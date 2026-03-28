const { Pool } = require('pg');

const candidates = ['users', 'templates', 'teams', 'team_templates', 'reports', 'template_sheet_registry'];
const chunkSize = 200;

const qi = (id) => '"' + String(id).replace(/"/g, '""') + '"';
const decodeB64 = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return Buffer.from(v, 'base64').toString('utf8');
};

(async () => {
  const srcUrl = decodeB64('SRC_DATABASE_URL_B64');
  const dstUrl = decodeB64('DST_DATABASE_URL_B64');

  const sourcePool = new Pool({ connectionString: srcUrl });
  const targetPool = new Pool({ connectionString: dstUrl });

  let targetClient;
  let replicationRoleSet = false;
  let step = 'init';
  const copiedCounts = {};
  const finalCounts = {};

  try {
    step = 'detect existing tables';
    const detectSql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
    `;

    const srcTables = new Set((await sourcePool.query(detectSql, [candidates])).rows.map(r => r.table_name));
    const dstTables = new Set((await targetPool.query(detectSql, [candidates])).rows.map(r => r.table_name));
    const existingTables = candidates.filter(t => srcTables.has(t) && dstTables.has(t));

    if (existingTables.length === 0) {
      throw new Error('No overlapping candidate tables exist in both source and target');
    }

    targetClient = await targetPool.connect();

    step = 'begin transaction';
    await targetClient.query('BEGIN');

    step = 'set session_replication_role';
    try {
      await targetClient.query('SET session_replication_role = replica');
      replicationRoleSet = true;
    } catch (e) {
      console.warn(`WARN: unable to set session_replication_role=replica (${e.message})`);
    }

    step = 'truncate target tables';
    await targetClient.query(`TRUNCATE TABLE ${existingTables.map(qi).join(', ')} CASCADE`);

    for (const table of existingTables) {
      step = `load columns for ${table}`;
      const colsRes = await sourcePool.query(
        `
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `,
        [table]
      );
      const columns = colsRes.rows.map(r => r.column_name);

      if (columns.length === 0) {
        copiedCounts[table] = 0;
        finalCounts[table] = 0;
        continue;
      }

      let offset = 0;
      let copied = 0;

      while (true) {
        step = `read chunk ${table} offset=${offset}`;
        const selectSql = `SELECT ${columns.map(qi).join(', ')} FROM ${qi(table)} OFFSET $1 LIMIT $2`;
        const { rows } = await sourcePool.query(selectSql, [offset, chunkSize]);
        if (rows.length === 0) break;

        step = `insert chunk ${table} offset=${offset}`;
        const values = [];
        const tuples = rows.map((row) => {
          const placeholders = columns.map((col) => {
            values.push(row[col]);
            return `$${values.length}`;
          });
          return `(${placeholders.join(', ')})`;
        });

        const insertSql = `INSERT INTO ${qi(table)} (${columns.map(qi).join(', ')}) VALUES ${tuples.join(', ')}`;
        await targetClient.query(insertSql, values);

        copied += rows.length;
        offset += rows.length;
      }

      copiedCounts[table] = copied;

      step = `count final ${table}`;
      const countRes = await targetClient.query(`SELECT COUNT(*)::bigint AS count FROM ${qi(table)}`);
      finalCounts[table] = Number(countRes.rows[0].count);
    }

    step = 'reset session_replication_role';
    if (replicationRoleSet) {
      try {
        await targetClient.query('SET session_replication_role = DEFAULT');
      } catch (e) {
        console.warn(`WARN: unable to reset session_replication_role (${e.message})`);
      }
    }

    step = 'commit transaction';
    await targetClient.query('COMMIT');

    console.log(`TABLE_COPY_COUNTS=${JSON.stringify(copiedCounts)}`);
    console.log(`FINAL_COUNTS=${JSON.stringify(finalCounts)}`);
  } catch (err) {
    console.error(`FAIL_STEP=${step}`);
    if (err && err.code) console.error(`SQL_ERROR_CODE=${err.code}`);
    console.error(`ERROR_MESSAGE=${err && err.message ? err.message : String(err)}`);

    if (targetClient) {
      try {
        if (replicationRoleSet) {
          try { await targetClient.query('SET session_replication_role = DEFAULT'); } catch (_) {}
        }
        await targetClient.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error(`ROLLBACK_ERROR=${rollbackErr.message}`);
      }
    }

    process.exitCode = 1;
  } finally {
    if (targetClient) targetClient.release();
    await sourcePool.end();
    await targetPool.end();
  }
})();
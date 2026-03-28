const { Pool } = require('pg')

const decode = (value) => Buffer.from(value, 'base64').toString('utf8')
const srcB64 = process.env.SRC_DATABASE_URL_B64
const dstB64 = process.env.DST_DATABASE_URL_B64

if (!srcB64 || !dstB64) {
  console.error('Missing SRC_DATABASE_URL_B64 or DST_DATABASE_URL_B64')
  process.exit(1)
}

const sourceUrl = decode(srcB64)
const targetUrl = decode(dstB64)

const quoteIdent = (value) => `"${String(value).replace(/"/g, '""')}"`

const buildInsert = (tableName, columns, rows) => {
  const values = []
  const placeholderRows = rows.map((row, rowIndex) => {
    const rowPlaceholders = columns.map((column, columnIndex) => {
      values.push(row[column])
      return `$${rowIndex * columns.length + columnIndex + 1}`
    })
    return `(${rowPlaceholders.join(', ')})`
  })

  const sql = `INSERT INTO ${quoteIdent(tableName)} (${columns.map(quoteIdent).join(', ')}) VALUES ${placeholderRows.join(', ')}`
  return { sql, values }
}

const testConnection = async (pool) => {
  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
  } finally {
    client.release()
  }
}

const makeSourcePool = async () => {
  const plainPool = new Pool({ connectionString: sourceUrl })
  try {
    await testConnection(plainPool)
    return plainPool
  } catch (error) {
    await plainPool.end().catch(() => undefined)
    const sslPool = new Pool({
      connectionString: sourceUrl,
      ssl: { rejectUnauthorized: false },
    })
    await testConnection(sslPool)
    return sslPool
  }
}

const preferredTables = [
  'users',
  'teams',
  'templates',
  'team_templates',
  'reports',
  'template_sheet_registry',
]

const tableExists = async (pool, table) => {
  const result = await pool.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = $1
     LIMIT 1`,
    [table],
  )

  return result.rows.length > 0
}

const getColumnKinds = async (pool, table) => {
  const result = await pool.query(
    `SELECT column_name, data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1`,
    [table],
  )

  const columnKinds = {}
  for (const row of result.rows) {
    columnKinds[row.column_name] = row.udt_name || row.data_type
  }

  return columnKinds
}

const insertRows = async (client, table, rows, columnKinds = {}) => {
  if (!rows || rows.length === 0) {
    return
  }

  const columns = Object.keys(rows[0])
  const normalizedRows = rows.map((row) => {
    const normalized = {}
    for (const column of columns) {
      const kind = columnKinds[column]
      const value = row[column]

      if ((kind === 'json' || kind === 'jsonb') && value !== null && value !== undefined && typeof value !== 'string') {
        normalized[column] = JSON.stringify(value)
      } else {
        normalized[column] = value
      }
    }
    return normalized
  })

  const chunkSize = 200

  for (let index = 0; index < normalizedRows.length; index += chunkSize) {
    const chunk = normalizedRows.slice(index, index + chunkSize)
    const { sql, values } = buildInsert(table, columns, chunk)
    await client.query(sql, values)
  }
}

const getExistingTables = async (pool) => {
  const result = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])
     ORDER BY table_name`,
    [preferredTables],
  )

  return result.rows.map((row) => row.table_name)
}

const getCounts = async (pool, tables) => {
  const counts = {}
  for (const table of tables) {
    const result = await pool.query(`SELECT COUNT(*)::bigint AS count FROM ${quoteIdent(table)}`)
    counts[table] = Number(result.rows[0].count)
  }
  return counts
}

async function main() {
  const sourcePool = await makeSourcePool()
  const targetPool = new Pool({ connectionString: targetUrl })

  const copiedCounts = {}

  try {
    await testConnection(targetPool)

    const sourceTables = await getExistingTables(sourcePool)
    const targetTables = await getExistingTables(targetPool)
    const tablesToCopy = preferredTables.filter(
      (table) => sourceTables.includes(table) && targetTables.includes(table),
    )

    if (tablesToCopy.length === 0) {
      throw new Error('No shared tables found to copy')
    }

    const targetClient = await targetPool.connect()

    try {
      await targetClient.query('BEGIN')

      const truncateList = tablesToCopy.map(quoteIdent).join(', ')
      await targetClient.query(`TRUNCATE TABLE ${truncateList} RESTART IDENTITY CASCADE`)

      const sourceData = {}
      const targetColumnKinds = {}
      for (const table of tablesToCopy) {
        const sourceRows = await sourcePool.query(`SELECT * FROM ${quoteIdent(table)}`)
        sourceData[table] = sourceRows.rows
        targetColumnKinds[table] = await getColumnKinds(targetPool, table)
      }

      if (sourceData.users) {
        const usersBase = sourceData.users.map((row) => ({ ...row, team_id: null }))
        await insertRows(targetClient, 'users', usersBase, targetColumnKinds.users)
        copiedCounts.users = sourceData.users.length
      }

      if (sourceData.templates) {
        await insertRows(targetClient, 'templates', sourceData.templates, targetColumnKinds.templates)
        copiedCounts.templates = sourceData.templates.length
      }

      if (sourceData.teams) {
        await insertRows(targetClient, 'teams', sourceData.teams, targetColumnKinds.teams)
        copiedCounts.teams = sourceData.teams.length
      }

      if (sourceData.users) {
        const usersWithTeam = sourceData.users.filter((row) => row.team_id !== null && row.team_id !== undefined)
        if (usersWithTeam.length > 0 && (await tableExists(targetPool, 'users'))) {
          for (const row of usersWithTeam) {
            await targetClient.query(
              `UPDATE ${quoteIdent('users')} SET ${quoteIdent('team_id')} = $1 WHERE ${quoteIdent('telegram_id')} = $2`,
              [row.team_id, row.telegram_id],
            )
          }
        }
      }

      if (sourceData.team_templates) {
        await insertRows(targetClient, 'team_templates', sourceData.team_templates, targetColumnKinds.team_templates)
        copiedCounts.team_templates = sourceData.team_templates.length
      }

      if (sourceData.reports) {
        await insertRows(targetClient, 'reports', sourceData.reports, targetColumnKinds.reports)
        copiedCounts.reports = sourceData.reports.length
      }

      if (sourceData.template_sheet_registry) {
        await insertRows(targetClient, 'template_sheet_registry', sourceData.template_sheet_registry, targetColumnKinds.template_sheet_registry)
        copiedCounts.template_sheet_registry = sourceData.template_sheet_registry.length
      }

      await targetClient.query('COMMIT')
    } catch (error) {
      await targetClient.query('ROLLBACK')
      throw error
    } finally {
      targetClient.release()
    }

    const finalCounts = await getCounts(targetPool, tablesToCopy)

    console.log(`TABLE_COPY_COUNTS=${JSON.stringify(copiedCounts)}`)
    console.log(`FINAL_COUNTS=${JSON.stringify(finalCounts)}`)
  } finally {
    await sourcePool.end().catch(() => undefined)
    await targetPool.end().catch(() => undefined)
  }
}

main().catch((error) => {
  console.error(`MIGRATION_ERROR=${error.message}`)
  process.exit(1)
})

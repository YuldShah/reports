
import { google } from 'googleapis';
import { Pool } from 'pg';
import * as fs from 'fs';

// --- Configuration ---
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SPREADSHEET_ID || !DATABASE_URL) {
    console.error("❌ Missing configuration (GOOGLE_SHEETS_ID or DATABASE_URL)");
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// --- Helper Functions ---
function sanitizeIdentifier(value: string): string {
    // Matches the logic in lib/google-sheets.ts (roughly) if available, 
    // but based on registry output "youth_work_department_template", it seems custom.
    // We will just use the exact logic if we can guess it, but for now we look for EXACT matches or UUID matches.
    return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function getGoogleSheetsClient() {
    let credentials;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
        credentials = JSON.parse(fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH, 'utf8'));
    } else {
        throw new Error("No service account credentials");
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

async function sync() {
    console.log("🚀 Starting Smart Sync...");
    const client = await pool.connect();
    const sheets = await getGoogleSheetsClient();

    try {
        // 1. Fetch Registry
        console.log("📖 Reading Template Registry...");
        const registryRes = await client.query('SELECT template_key, sheet_id FROM template_sheet_registry');
        // Map both exact keys and potentially names if needed, but primary is exact key match.
        const registry = new Map<string, number>();
        registryRes.rows.forEach(r => registry.set(r.template_key, Number(r.sheet_id)));

        // 2. Fetch Reports
        console.log("📦 Fetching reports...");
        const reportsRes = await client.query(`
      SELECT 
        r.id as report_id, r.created_at, r.answers, r.template_id,
        t.name as team_name,
        u.first_name || ' ' || COALESCE(u.last_name, '') as user_name,
        tmp.name as template_name
      FROM reports r
      LEFT JOIN teams t ON r.team_id = t.id
      LEFT JOIN users u ON r.user_id = u.telegram_id
      LEFT JOIN templates tmp ON r.template_id = tmp.id
      ORDER BY r.created_at ASC
    `);
        const reports = reportsRes.rows;

        // Group by Template ID
        const reportsByTemplate: Record<string, typeof reports> = {};
        for (const r of reports) {
            if (!reportsByTemplate[r.template_id]) reportsByTemplate[r.template_id] = [];
            reportsByTemplate[r.template_id].push(r);
        }

        // 3. Process each Template
        const ssMetadata = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const allSheets = ssMetadata.data.sheets || [];

        for (const templateId of Object.keys(reportsByTemplate)) {
            const group = reportsByTemplate[templateId];
            if (group.length === 0) continue;

            const templateName = group[0].template_name || 'Unknown Template';
            console.log(`\n📋 Processing: ${templateName} (${templateId})`);

            // Resolve Sheet ID
            let sheetId = registry.get(templateId);

            // Fallback: Check for slug match in registry (legacy support)
            // e.g. "Yoshlar bilan..." -> "youth_work_..." might not match mechanically
            // so we rely on what's in DB. If not found by UUID, try to find a Sheet by Name
            if (sheetId === undefined) {
                const sheetTitleCandidate = templateName.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().substring(0, 100);
                const existingSheet = allSheets.find(s => s.properties?.title === sheetTitleCandidate);

                if (existingSheet) {
                    sheetId = existingSheet.properties?.sheetId ?? undefined;
                    console.log(`   Found existing sheet by name: "${sheetTitleCandidate}" (ID: ${sheetId})`);

                    // Update Registry so we don't guess next time
                    if (sheetId !== undefined) {
                        await client.query(`
                      INSERT INTO template_sheet_registry (template_key, sheet_id)
                      VALUES ($1, $2)
                      ON CONFLICT (template_key) DO UPDATE SET sheet_id = EXCLUDED.sheet_id
                  `, [templateId, sheetId]);
                        registry.set(templateId, sheetId);
                    }
                }
            } else {
                console.log(`   Found in registry (ID: ${sheetId})`);
            }

            // If still no sheet, create one
            if (sheetId === undefined) {
                const newTitle = templateName.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().substring(0, 100);
                console.log(`   Creating new sheet: "${newTitle}"`);
                const createRes = await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: SPREADSHEET_ID,
                    requestBody: { requests: [{ addSheet: { properties: { title: newTitle } } }] }
                });
                sheetId = createRes.data.replies?.[0]?.addSheet?.properties?.sheetId!;

                // Save to Registry
                await client.query(`
               INSERT INTO template_sheet_registry (template_key, sheet_id)
               VALUES ($1, $2)
               ON CONFLICT (template_key) DO UPDATE SET sheet_id = EXCLUDED.sheet_id
           `, [templateId, sheetId]);
            }

            // Get Sheet Name (needed for Range)
            const sheetObj = allSheets.find(s => s.properties?.sheetId === sheetId)
                // Or re-fetch if we just created it (but we know the title we asked for, or default)
                || (await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })).data.sheets?.find(s => s.properties?.sheetId === sheetId);

            const sheetTitle = sheetObj?.properties?.title;
            if (!sheetTitle) {
                console.error(`   Could not resolve title for sheet ID ${sheetId}. Skipping.`);
                continue;
            }

            // 4. Sync Data (Append Only)
            const readRes = await sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `'${sheetTitle}'!A1:Z`,
            });
            const rows = readRes.data.values || [];

            // Headers
            const answerKeys = new Set<string>();
            group.forEach(r => Object.keys(r.answers || {}).forEach(k => answerKeys.add(k)));
            const desiredHeaders = ['Report ID', 'Submitted At', 'Team Name', 'User Name', ...Array.from(answerKeys)];

            if (rows.length === 0) {
                console.log("   Writing headers...");
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `'${sheetTitle}'!A1`,
                    valueInputOption: 'RAW',
                    requestBody: { values: [desiredHeaders] }
                });
                // Update local rows to include header for collision check
                rows.push(desiredHeaders);
            }

            const currentHeaders = rows[0];
            const reportIdIdx = currentHeaders.indexOf('Report ID');
            const existingIds = new Set(rows.slice(1).map(r => r[reportIdIdx]).filter(Boolean));

            const newRows = group.filter(r => !existingIds.has(r.report_id)).map(r => {
                return currentHeaders.map(h => {
                    if (h === 'Report ID') return r.report_id;
                    if (h === 'Submitted At') return new Date(r.created_at).toISOString();
                    if (h === 'Team Name') return r.team_name;
                    if (h === 'User Name') return r.user_name;
                    return r.answers[h] !== undefined ? String(r.answers[h]) : '';
                });
            });

            if (newRows.length > 0) {
                console.log(`   Appending ${newRows.length} new reports...`);
                await sheets.spreadsheets.values.append({
                    spreadsheetId: SPREADSHEET_ID,
                    range: `'${sheetTitle}'!A1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: newRows }
                });
            } else {
                console.log("   No new reports to sync.");
            }
        }

    } catch (err) {
        console.error("❌ Sync Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

sync();

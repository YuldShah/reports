const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

async function getClient() {
  const keyPath = path.join(process.cwd(), "newkey.json");
  const credentials = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  
  return google.sheets({ version: "v4", auth });
}

async function fixNumbers() {
  const sheets = await getClient();
  const spreadsheetId = "1rawzYE4uOH5PMBPrlH-vpPNK08l-7HWccjiuNNbUJUg";
  
  // Get all sheets
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetList = spreadsheet.data.sheets || [];
  
  console.log(`Found ${sheetList.length} sheets`);
  
  for (const sheet of sheetList) {
    const title = sheet.properties.title;
    const sheetId = sheet.properties.sheetId;
    
    console.log(`\nProcessing: ${title}`);
    
    // Get all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${title}'`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    
    const rows = response.data.values || [];
    if (rows.length < 2) {
      console.log("  No data rows, skipping");
      continue;
    }
    
    const requests = [];
    
    // Process each cell (skip header row)
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const value = row[colIndex];
        
        // Check if it's a string that looks like a number
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
            requests.push({
              updateCells: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: rowIndex,
                  endRowIndex: rowIndex + 1,
                  startColumnIndex: colIndex,
                  endColumnIndex: colIndex + 1,
                },
                rows: [{
                  values: [{
                    userEnteredValue: { numberValue: parseFloat(trimmed) }
                  }]
                }],
                fields: "userEnteredValue",
              },
            });
          }
        }
      }
    }
    
    if (requests.length === 0) {
      console.log("  No text numbers to fix");
      continue;
    }
    
    console.log(`  Fixing ${requests.length} cells...`);
    
    // Batch update in chunks of 100 to avoid quota issues
    const chunkSize = 100;
    for (let i = 0; i < requests.length; i += chunkSize) {
      const chunk = requests.slice(i, i + chunkSize);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: chunk },
      });
      console.log(`  Updated ${Math.min(i + chunkSize, requests.length)}/${requests.length} cells`);
      
      // Small delay between chunks
      if (i + chunkSize < requests.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    console.log(`  ✓ Done`);
    
    // Delay between sheets to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log("\n=== All sheets processed ===");
}

fixNumbers().catch(console.error);

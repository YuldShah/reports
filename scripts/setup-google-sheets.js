const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY

if (!SPREADSHEET_ID || !API_KEY) {
  console.error("❌ Missing Google Sheets credentials")
  console.log("Please set the following environment variables:")
  console.log("- GOOGLE_SHEETS_ID: Your Google Sheets spreadsheet ID")
  console.log("- GOOGLE_SHEETS_API_KEY: Your Google Sheets API key")
  process.exit(1)
}

async function setupGoogleSheets() {
  try {
    console.log("🔧 Setting up Google Sheets integration...")

    // Test connection
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const spreadsheet = await response.json()
    console.log("✅ Successfully connected to Google Sheets")
    console.log(`📊 Spreadsheet: ${spreadsheet.properties.title}`)
    console.log(`🔗 URL: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`)

    // Create a sample team sheet if it doesn't exist
    const sampleSheetName = "Team_Sample"
    const sheetExists = spreadsheet.sheets?.some((sheet) => sheet.properties.title === sampleSheetName)

    if (!sheetExists) {
      console.log("📝 Creating sample team sheet...")

      // Create sheet
      const createResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sampleSheetName,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: 20,
                    },
                  },
                },
              },
            ],
          }),
        },
      )

      if (createResponse.ok) {
        // Add headers
        const headers = [
          "Timestamp",
          "User Name",
          "Title",
          "Description",
          "Priority",
          "Category",
          "Status",
          "Type",
          "Location",
          "Urgency",
          "Affected Systems",
          "Reproduction Steps",
          "Expected Outcome",
          "Actual Outcome",
          "Additional Info",
        ]

        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sampleSheetName}!A1:O1?valueInputOption=RAW&key=${API_KEY}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              values: [headers],
            }),
          },
        )

        console.log("✅ Sample sheet created with headers")
      }
    } else {
      console.log("ℹ️  Sample sheet already exists")
    }

    console.log("\n🎉 Google Sheets setup complete!")
    console.log("\nNext steps:")
    console.log("1. Make sure your spreadsheet is shared with the service account email")
    console.log("2. Test the integration by submitting a report")
    console.log("3. Check that data appears in the appropriate team sheets")
  } catch (error) {
    console.error("❌ Setup failed:", error.message)
    console.log("\nTroubleshooting:")
    console.log("1. Verify your GOOGLE_SHEETS_ID is correct")
    console.log("2. Ensure your API key has the necessary permissions")
    console.log("3. Check that the Google Sheets API is enabled in your Google Cloud project")
    console.log("4. Make sure the spreadsheet exists and is accessible")
  }
}

setupGoogleSheets()

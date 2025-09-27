export interface GoogleSheetsConfig {
  spreadsheetId: string
  apiKey: string
  range: string
}

export const createSheetIfNotExists = async (teamName: string) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  if (!spreadsheetId || !apiKey) {
    throw new Error("Google Sheets credentials not configured")
  }

  const sheetName = `Team_${teamName.replace(/[^a-zA-Z0-9]/g, "_")}`

  try {
    // First, try to get the sheet to see if it exists
    const getResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`, {
      method: "GET",
    })

    if (getResponse.ok) {
      const spreadsheet = await getResponse.json()
      const sheetExists = spreadsheet.sheets?.some((sheet: any) => sheet.properties.title === sheetName)

      if (!sheetExists) {
        // Create the sheet
        const createResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requests: [
                {
                  addSheet: {
                    properties: {
                      title: sheetName,
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
          // Add headers to the new sheet
          await addHeadersToSheet(sheetName)
        }
      }
    }
  } catch (error) {
    console.error("Error creating sheet:", error)
    // Continue anyway - the append operation might still work
  }
}

const addHeadersToSheet = async (sheetName: string) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

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

  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:O1?valueInputOption=RAW&key=${apiKey}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: [headers],
        }),
      },
    )
  } catch (error) {
    console.error("Error adding headers:", error)
  }
}

export const appendToGoogleSheet = async (
  teamName: string,
  reportData: {
    timestamp: string
    userName: string
    title: string
    description: string
    priority: string
    category: string
    status: string
    type?: string
    location?: string
    urgency?: string
    affectedSystems?: string
    reproductionSteps?: string
    expectedOutcome?: string
    actualOutcome?: string
    additionalInfo?: string
  },
) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  if (!spreadsheetId || !apiKey) {
    console.error("Google Sheets credentials not configured")
    return
  }

  try {
    // Ensure sheet exists
    await createSheetIfNotExists(teamName)

    const sheetName = `Team_${teamName.replace(/[^a-zA-Z0-9]/g, "_")}`

    // Prepare data row
    const values = [
      [
        reportData.timestamp,
        reportData.userName,
        reportData.title,
        reportData.description,
        reportData.priority,
        reportData.category,
        reportData.status,
        reportData.type || "",
        reportData.location || "",
        reportData.urgency || "",
        reportData.affectedSystems || "",
        reportData.reproductionSteps || "",
        reportData.expectedOutcome || "",
        reportData.actualOutcome || "",
        reportData.additionalInfo || "",
      ],
    ]

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values,
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to append to Google Sheets: ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error appending to Google Sheets:", error)
    throw error
  }
}

export const getGoogleSheetsUrl = (teamName?: string): string => {
  // Try to get from client-side env first, fallback to server-side
  const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || process.env.GOOGLE_SHEETS_ID
  if (!spreadsheetId) {
    // Return # when not configured (same as admin dashboard)
    return "#"
  }

  const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  if (teamName) {
    const sheetName = `Team_${teamName.replace(/[^a-zA-Z0-9]/g, "_")}`
    return `${baseUrl}/edit#gid=0&range=${sheetName}`
  }
  return `${baseUrl}/edit`
}

export const getAllSheetsData = async () => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  if (!spreadsheetId || !apiKey) {
    throw new Error("Google Sheets credentials not configured")
  }

  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(`Failed to get spreadsheet info: ${response.statusText}`)
    }

    const spreadsheet = await response.json()
    return {
      spreadsheetId,
      title: spreadsheet.properties?.title || "Reports Spreadsheet",
      sheets:
        spreadsheet.sheets?.map((sheet: any) => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          url: `${getGoogleSheetsUrl()}#gid=${sheet.properties.sheetId}`,
        })) || [],
    }
  } catch (error) {
    console.error("Error getting sheets data:", error)
    throw error
  }
}

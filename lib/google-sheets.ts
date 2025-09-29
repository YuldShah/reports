import { google } from 'googleapis'
import path from 'path'

export interface GoogleSheetsConfig {
  spreadsheetId: string
  serviceAccountPath: string
  range: string
}

const getGoogleSheetsClient = async () => {
  try {
    // Path to the service account key file
    const serviceAccountPath = path.join(process.cwd(), 'resolute-might-473605-g5-cd8246aa7c6c.json')
    
    // Create authentication using service account
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets'
      ],
    })

    // Create the sheets API client
    const sheets = google.sheets({ version: 'v4', auth })
    
    return { sheets, auth }
  } catch (error) {
    console.error('Error creating Google Sheets client:', error)
    throw new Error('Failed to initialize Google Sheets client')
  }
}

export const createSheetIfNotExists = async (teamName: string) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID

  if (!spreadsheetId) {
    throw new Error("Google Sheets spreadsheet ID not configured")
  }

  const sheetName = `Team_${teamName.replace(/[^a-zA-Z0-9]/g, "_")}`

  try {
    const { sheets } = await getGoogleSheetsClient()

    // First, try to get the spreadsheet to see existing sheets
    const getResponse = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    const sheetExists = getResponse.data.sheets?.some(
      (sheet) => sheet.properties?.title === sheetName
    )

    if (!sheetExists) {
      // Create the sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
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
        },
      })

      // Add headers to the new sheet
      await addHeadersToSheet(sheetName)
    }
  } catch (error) {
    console.error("Error creating sheet:", error)
    // Continue anyway - the append operation might still work
  }
}

const addHeadersToSheet = async (sheetName: string) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID

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
    const { sheets } = await getGoogleSheetsClient()
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:O1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    })
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

  if (!spreadsheetId) {
    console.error("Google Sheets spreadsheet ID not configured")
    return
  }

  try {
    // Ensure sheet exists
    await createSheetIfNotExists(teamName)

    const { sheets } = await getGoogleSheetsClient()
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

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:O`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    })

    return response.data
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

  if (!spreadsheetId) {
    throw new Error("Google Sheets spreadsheet ID not configured")
  }

  try {
    const { sheets } = await getGoogleSheetsClient()

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    return {
      spreadsheetId,
      title: response.data.properties?.title || "Reports Spreadsheet",
      sheets:
        response.data.sheets?.map((sheet: any) => ({
          title: sheet.properties?.title || '',
          sheetId: sheet.properties?.sheetId || 0,
          url: `${getGoogleSheetsUrl()}#gid=${sheet.properties?.sheetId || 0}`,
        })) || [],
    }
  } catch (error) {
    console.error("Error getting sheets data:", error)
    throw error
  }
}

import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

export interface GoogleSheetsConfig {
  spreadsheetId: string
  serviceAccountPath: string
  range: string
}

const getGoogleSheetsClient = async () => {
  try {
    // Get service account credentials from environment or file
    let credentials
    
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // Use environment variable (preferred for production)
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    } else {
      // Fallback to file (for development)
      const serviceAccountPath = path.join(process.cwd(), 'resolute-might-473605-g5-cd8246aa7c6c.json')
      
      if (fs.existsSync(serviceAccountPath)) {
        credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      } else {
        throw new Error('Google Service Account credentials not found')
      }
    }

    // Create authentication using service account
    const auth = new google.auth.GoogleAuth({
      credentials,
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

export const createSheetIfNotExists = async (templateName: string) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID

  if (!spreadsheetId) {
    throw new Error("Google Sheets spreadsheet ID not configured")
  }

  const sheetName = `Template_${templateName.replace(/[^a-zA-Z0-9]/g, "_")}`

  try {
    const { sheets } = await getGoogleSheetsClient()

    // First, try to get the spreadsheet to see existing sheets
    const getResponse = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    const sheetExists = getResponse.data.sheets?.some(
      (sheet: any) => sheet.properties?.title === sheetName
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
    "Generated At",
    "Team Name",
    "User Name",
    "Questions & Answers",
  ]

  try {
    const { sheets } = await getGoogleSheetsClient()
    
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:D1`,
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
  templateName: string,
  reportData: {
    timestamp: string
    teamName: string
    userName: string
    questionsAnswers: string
  },
) => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID

  if (!spreadsheetId) {
    console.error("Google Sheets spreadsheet ID not configured")
    return
  }

  try {
    // Ensure sheet exists
    await createSheetIfNotExists(templateName)

    const { sheets } = await getGoogleSheetsClient()
    const sheetName = `Template_${templateName.replace(/[^a-zA-Z0-9]/g, "_")}`

    // Prepare data row
    const values = [
      [
        reportData.timestamp,
        reportData.teamName,
        reportData.userName,
        reportData.questionsAnswers,
      ],
    ]

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:D`,
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

    const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    
    return {
      spreadsheetId,
      title: response.data.properties?.title || "Reports Spreadsheet",
      sheets:
        response.data.sheets?.map((sheet: any) => ({
          title: sheet.properties?.title || '',
          sheetId: sheet.properties?.sheetId || 0,
          url: `${baseUrl}/edit#gid=${sheet.properties?.sheetId || 0}`,
        })) || [],
    }
  } catch (error) {
    console.error("Error getting sheets data:", error)
    throw error
  }
}

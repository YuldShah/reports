import { google } from 'googleapis'
import path from 'path'
import fs from 'fs'

interface SheetAnswer {
  label: string
  value: string
}

interface SheetRowData {
  reportId: string
  timestamp: string
  teamName: string
  userName: string
  answers: SheetAnswer[]
}

const BASE_HEADERS = [
  'Report ID',
  'Submitted At',
  'Team Name',
  'User Name',
]

type MaybeProcess = {
  env?: Record<string, string | undefined>
  cwd?: () => string
}

const getProcess = (): MaybeProcess | undefined => (globalThis as any)?.process as MaybeProcess | undefined

const getEnvVar = (key: string): string | undefined => getProcess()?.env?.[key]

const getCwd = (): string => {
  const proc = getProcess()
  if (proc?.cwd) {
    try {
      return proc.cwd()
    } catch (error) {
      console.error('Unable to resolve current working directory:', error)
    }
  }
  return ''
}

export interface GoogleSheetsConfig {
  spreadsheetId: string
  serviceAccountPath: string
  range: string
}

const getGoogleSheetsClient = async () => {
  try {
    // Get service account credentials from environment or file
    let credentials
    
    if (getEnvVar('GOOGLE_SERVICE_ACCOUNT_KEY')) {
      // Use environment variable (preferred for production)
      credentials = JSON.parse(getEnvVar('GOOGLE_SERVICE_ACCOUNT_KEY') as string)
    } else {
      // Fallback to file (for development)
      const keyPathFromEnv = getEnvVar('GOOGLE_SERVICE_ACCOUNT_KEY_PATH')
      const candidatePaths = [
        keyPathFromEnv,
        'resolute-might-473605-g5-fd1f52ec44b3.json',
        'resolute-might-473605-g5-cd8246aa7c6c.json',
      ].filter(Boolean) as string[]

      const resolvedPath = candidatePaths
        .map((relativePath) => {
          if (!relativePath) return ''
          if (path.isAbsolute(relativePath)) {
            return relativePath
          }
          const cwd = getCwd()
          return cwd ? path.join(cwd, relativePath) : relativePath
        })
        .find((candidate) => fs.existsSync(candidate))

      if (!resolvedPath) {
        throw new Error('Google Service Account credentials not found')
      }

      credentials = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'))
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

const ensureSheetHeaders = async (sheetName: string, requiredHeaders: string[]) => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

  if (!spreadsheetId) {
    throw new Error('Google Sheets spreadsheet ID not configured')
  }

  const { sheets } = await getGoogleSheetsClient()

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  })

  const currentHeaders = headerResponse.data.values?.[0] ?? []

  // Start with existing headers or base headers if the row is blank
  const finalHeaders = currentHeaders.length > 0 ? [...currentHeaders] : [...BASE_HEADERS]
  let headersChanged = false

  // Ensure base headers are present and ordered correctly
  BASE_HEADERS.forEach((header, index) => {
    const existingIndex = finalHeaders.indexOf(header)
    if (existingIndex === -1) {
      finalHeaders.splice(index, 0, header)
      headersChanged = true
    } else if (existingIndex !== index) {
      finalHeaders.splice(existingIndex, 1)
      finalHeaders.splice(index, 0, header)
      headersChanged = true
    }
  })

  const headerSet = new Set(finalHeaders)
  if (!headersChanged) {
    headersChanged = finalHeaders.length !== currentHeaders.length || finalHeaders.some((header, index) => header !== currentHeaders[index])
  }

  for (const header of requiredHeaders) {
    if (!headerSet.has(header)) {
      finalHeaders.push(header)
      headerSet.add(header)
      headersChanged = true
    }
  }

  if (headersChanged) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!1:1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [finalHeaders],
      },
    })
  }

  return finalHeaders
}

export const createSheetIfNotExists = async (templateName: string) => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

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
    }
    await ensureSheetHeaders(sheetName, BASE_HEADERS)
  } catch (error) {
    console.error("Error creating sheet:", error)
    // Continue anyway - the append operation might still work
  }
}

export const appendToGoogleSheet = async (
  templateName: string,
  reportData: SheetRowData,
) => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

  if (!spreadsheetId) {
    console.error("Google Sheets spreadsheet ID not configured")
    return
  }

  try {
    // Ensure sheet exists
    await createSheetIfNotExists(templateName)

    const { sheets } = await getGoogleSheetsClient()
    const sheetName = `Template_${templateName.replace(/[^a-zA-Z0-9]/g, "_")}`

    const requiredHeaders = Array.from(
      new Set(
        reportData.answers
          .map((answer) => answer.label)
          .filter((label): label is string => typeof label === 'string' && label.trim().length > 0),
      ),
    )
    const finalHeaders = await ensureSheetHeaders(sheetName, requiredHeaders)

    const baseValueMap: Record<string, string> = {
      'Report ID': reportData.reportId,
      'Submitted At': reportData.timestamp,
      'Team Name': reportData.teamName,
      'User Name': reportData.userName,
    }

    const answerMap = new Map(
      reportData.answers.map((answer) => [answer.label, answer.value === undefined || answer.value === null ? '' : String(answer.value)]),
    )

    const rowValues = finalHeaders.map((header) => {
      if (baseValueMap[header] !== undefined) {
        return baseValueMap[header]
      }
      return answerMap.get(header) ?? ''
    })

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:ZZ`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowValues],
      },
    })

    return response.data
  } catch (error) {
    console.error("Error appending to Google Sheets:", error)
    throw error
  }
}



export const getAllSheetsData = async () => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

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

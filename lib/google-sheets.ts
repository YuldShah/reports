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

interface TemplateSheetInfo {
  sheetId: number
  title: string
}

const BASE_HEADERS = [
  'Report ID',
  'Submitted At',
  'Team Name',
  'User Name',
]

const TEMPLATE_METADATA_KEY = 'templateKey'

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

const sanitizeIdentifier = (value: string): string => {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '_')
  return sanitized.length > 0 ? sanitized : 'template'
}

const buildSheetTitle = (templateName: string): string => {
  const withSpaces = templateName
    .replace(/_/g, ' ')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return withSpaces.length > 0 ? withSpaces : 'Template'
}

const ensureSheetHeaders = async (sheetTitle: string, requiredHeaders: string[]) => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

  if (!spreadsheetId) {
    throw new Error('Google Sheets spreadsheet ID not configured')
  }

  const { sheets } = await getGoogleSheetsClient()

  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetTitle}!1:1`,
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
      range: `${sheetTitle}!1:1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [finalHeaders],
      },
    })
  }

  return finalHeaders
}

const ensureTemplateSheet = async (templateKey: string, templateName: string): Promise<TemplateSheetInfo> => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

  if (!spreadsheetId) {
    throw new Error('Google Sheets spreadsheet ID not configured')
  }

  const normalizedKey = sanitizeIdentifier(templateKey)
  const defaultTitle = buildSheetTitle(templateName)

  const { sheets } = await getGoogleSheetsClient()

  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(sheetId,title)),developerMetadata(metadataKey,metadataValue,location(sheetId))',
    })

    const metadataMatch = spreadsheet.data.developerMetadata?.find(
      (metadata: any) =>
        metadata.metadataKey === TEMPLATE_METADATA_KEY &&
        metadata.metadataValue === normalizedKey &&
        metadata.location?.sheetId !== undefined,
    )

    const metadataSheetId = metadataMatch?.location?.sheetId
    const sheetFromMetadata =
      typeof metadataSheetId === 'number'
        ? spreadsheet.data.sheets?.find((sheet: any) => sheet.properties?.sheetId === metadataSheetId)
        : undefined

    if (sheetFromMetadata?.properties?.sheetId && sheetFromMetadata.properties.title) {
      return {
        sheetId: sheetFromMetadata.properties.sheetId,
        title: sheetFromMetadata.properties.title,
      }
    }

    const sheetByTitle = spreadsheet.data.sheets?.find(
      (sheet: any) => sheet.properties?.title === defaultTitle,
    )

    if (sheetByTitle?.properties?.sheetId && sheetByTitle.properties.title) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              createDeveloperMetadata: {
                developerMetadata: {
                  metadataKey: TEMPLATE_METADATA_KEY,
                  metadataValue: normalizedKey,
                  location: {
                    sheetId: sheetByTitle.properties.sheetId,
                    locationType: 'SHEET',
                  },
                  visibility: 'DOCUMENT',
                },
              },
            },
          ],
        },
      }).catch(() => {
        // Ignore metadata creation errors (duplicate, permissions, etc.)
      })

      return {
        sheetId: sheetByTitle.properties.sheetId,
        title: sheetByTitle.properties.title,
      }
    }

    const createResponse = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: defaultTitle,
                gridProperties: {
                  rowCount: 1000,
                  columnCount: 26,
                },
              },
            },
          },
        ],
      },
    })

    const newSheet = createResponse.data.replies?.[0]?.addSheet?.properties
    if (!newSheet?.sheetId || !newSheet.title) {
      throw new Error('Failed to create new sheet for template')
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            createDeveloperMetadata: {
              developerMetadata: {
                metadataKey: TEMPLATE_METADATA_KEY,
                metadataValue: normalizedKey,
                location: {
                  sheetId: newSheet.sheetId,
                  locationType: 'SHEET',
                },
                visibility: 'DOCUMENT',
              },
            },
          },
        ],
      },
    }).catch(() => {
      // Ignore metadata creation errors for newly created sheet
    })

    return {
      sheetId: newSheet.sheetId,
      title: newSheet.title,
    }
  } catch (error) {
    console.error('Error ensuring template sheet:', error)
    throw error
  }
}

export const appendToGoogleSheet = async (
  templateInfo: { templateKey: string; templateName: string },
  reportData: SheetRowData,
) => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

  if (!spreadsheetId) {
    console.error("Google Sheets spreadsheet ID not configured")
    return
  }

  try {
    const { templateKey, templateName } = templateInfo
    const sheetInfo = await ensureTemplateSheet(templateKey, templateName)
    const { sheets } = await getGoogleSheetsClient()
    const sheetTitle = sheetInfo.title

    const requiredHeaders = Array.from(
      new Set(
        reportData.answers
          .map((answer) => answer.label)
          .filter((label): label is string => typeof label === 'string' && label.trim().length > 0),
      ),
    )
    const finalHeaders = await ensureSheetHeaders(sheetTitle, requiredHeaders)

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
      range: `${sheetTitle}!A:ZZ`,
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

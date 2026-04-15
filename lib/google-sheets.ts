import { google, sheets_v4 } from 'googleapis'
import path from 'path'
import fs from 'fs'
import { getTemplateSheetMapping, upsertTemplateSheetMapping, deleteTemplateSheetMapping } from './database'
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

const resolveCredentialPath = (): string | null => {
  const configuredPath = getEnvVar('GOOGLE_SERVICE_ACCOUNT_KEY_PATH') || getEnvVar('GOOGLE_APPLICATION_CREDENTIALS')
  const candidatePaths = [configuredPath]
    .filter(Boolean)
    .map((candidate) => candidate as string)
    .flatMap((candidate) => {
      if (path.isAbsolute(candidate)) {
        return [candidate]
      }

      const cwd = getCwd()
      return cwd ? [path.join(cwd, candidate), candidate] : [candidate]
    })

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return null
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
      const resolvedPath = resolveCredentialPath()

      if (!resolvedPath) {
        throw new Error('Google Service Account credentials not found at GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_APPLICATION_CREDENTIALS')
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

const resolveSheetsClient = async (client?: sheets_v4.Sheets): Promise<sheets_v4.Sheets> => {
  if (client) {
    return client
  }
  const { sheets } = await getGoogleSheetsClient()
  return sheets
}

const sanitizeIdentifier = (value: string): string => {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '_')
  return sanitized.length > 0 ? sanitized : 'template'
}

const buildSheetTitle = (templateName: string): string => {
  const withSpaces = templateName
    .replace(/_/g, ' ')
    .replace(/[^a-zA-Z0-9 ']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return withSpaces.length > 0 ? withSpaces : 'Template'
}

const quoteSheetTitle = (sheetTitle: string) => `'${sheetTitle.replace(/'/g, "''")}'`

const ensureSheetHeaders = async (
  sheetId: number,
  requiredHeaders: string[],
  sheetsClient?: sheets_v4.Sheets,
  sheetTitle?: string,
) => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

  if (!spreadsheetId) {
    throw new Error('Google Sheets spreadsheet ID not configured')
  }

  const sheets = await resolveSheetsClient(sheetsClient)

  const headerFilter: sheets_v4.Schema$DataFilter = {
    gridRange: {
      sheetId,
      startRowIndex: 0,
      endRowIndex: 1,
    },
  }

  let currentHeaders: string[] = []
  let useA1Fallback = false

  try {
    const headerResponse = await sheets.spreadsheets.values.batchGetByDataFilter({
      spreadsheetId,
      requestBody: {
        dataFilters: [headerFilter],
      },
    })

    currentHeaders = headerResponse.data.valueRanges?.[0]?.valueRange?.values?.[0] ?? []
  } catch (error) {
    if (!sheetTitle) {
      throw error
    }

    useA1Fallback = true
    const fallbackResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${quoteSheetTitle(sheetTitle)}!1:1`,
    })
    currentHeaders = fallbackResponse.data.values?.[0] ?? []
  }

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
    if (sheetTitle) {
      // Always prefer A1-range writes — batchUpdateByDataFilter rejects
      // header arrays wider than the sheet's current column count.
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${quoteSheetTitle(sheetTitle)}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [finalHeaders],
        },
      })
    } else {
      await sheets.spreadsheets.values.batchUpdateByDataFilter({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: [
            {
              dataFilter: headerFilter,
              majorDimension: 'ROWS',
              values: [finalHeaders],
            } as sheets_v4.Schema$DataFilterValueRange,
          ],
        },
      })
    }
  }

  return finalHeaders
}

const ensureTemplateSheet = async (
  templateKey: string,
  templateName: string,
  sheetsClient?: sheets_v4.Sheets,
): Promise<TemplateSheetInfo> => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

  if (!spreadsheetId) {
    throw new Error('Google Sheets spreadsheet ID not configured')
  }

  const normalizedKey = sanitizeIdentifier(templateKey)
  const defaultTitle = buildSheetTitle(templateName)

  const sheets = await resolveSheetsClient(sheetsClient)

  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets(properties(sheetId,title))',
    })

    const existingSheetId = await getTemplateSheetMapping(normalizedKey)
    if (existingSheetId !== null) {
      const mappedSheet = spreadsheet.data.sheets?.find(
        (sheet: sheets_v4.Schema$Sheet) => sheet.properties?.sheetId === existingSheetId,
      )

      if (mappedSheet?.properties?.sheetId && mappedSheet.properties.title) {
        return {
          sheetId: mappedSheet.properties.sheetId,
          title: mappedSheet.properties.title,
        }
      }

      await deleteTemplateSheetMapping(normalizedKey)
    }

    const metadataSearch = await sheets.spreadsheets.developerMetadata.search({
      spreadsheetId,
      requestBody: {
        dataFilters: [
          {
            developerMetadataLookup: {
              metadataKey: TEMPLATE_METADATA_KEY,
              metadataValue: normalizedKey,
              locationType: 'SHEET',
            },
          },
        ],
      },
    }).catch((error: unknown) => {
      console.warn('Failed to search developer metadata for template sheet:', error)
      return { data: {} as sheets_v4.Schema$SearchDeveloperMetadataResponse }
    })

    const matchedMetadata = metadataSearch.data.matchedDeveloperMetadata?.find(
      (match: sheets_v4.Schema$MatchedDeveloperMetadata) => {
        const location = match?.developerMetadata?.location
        return location?.locationType === 'SHEET' && typeof location.sheetId === 'number'
      },
    )

    if (matchedMetadata?.developerMetadata?.location?.sheetId !== undefined) {
      const sheetId = matchedMetadata.developerMetadata.location.sheetId
      const sheetFromMetadata = spreadsheet.data.sheets?.find(
        (sheet: sheets_v4.Schema$Sheet) => sheet.properties?.sheetId === sheetId,
      )

      if (sheetFromMetadata?.properties?.sheetId && sheetFromMetadata.properties.title) {
        await upsertTemplateSheetMapping(normalizedKey, sheetFromMetadata.properties.sheetId)
        return {
          sheetId: sheetFromMetadata.properties.sheetId,
          title: sheetFromMetadata.properties.title,
        }
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

      await upsertTemplateSheetMapping(normalizedKey, sheetByTitle.properties.sheetId)

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

    await upsertTemplateSheetMapping(normalizedKey, newSheet.sheetId)

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
    const { sheets } = await getGoogleSheetsClient()
    const sheetInfo = await ensureTemplateSheet(templateKey, templateName, sheets)

    const requiredHeaders = Array.from(
      new Set(
        reportData.answers
          .map((answer) => answer.label)
          .filter((label): label is string => typeof label === 'string' && label.trim().length > 0),
      ),
    )
    const finalHeaders = await ensureSheetHeaders(sheetInfo.sheetId, requiredHeaders, sheets, sheetInfo.title)

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

    // Determine the next empty row by counting existing rows in column A.
    // Using values.update at a specific row is safer than values.append with !A1
    // because append with OVERWRITE mode can overwrite row 1 when table detection
    // misidentifies the table boundary.
    const countResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${quoteSheetTitle(sheetInfo.title)}!A:A`,
    })
    const nextRow = (countResponse.data.values || []).length + 1

    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${quoteSheetTitle(sheetInfo.title)}!A${nextRow}`,
      valueInputOption: 'USER_ENTERED',
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

// Student Tracker specific headers in Uzbek
const STUDENT_TRACKER_HEADERS = [
  "Tutor ismi",
  "1-kurs",
  "2-kurs",
  "3-kurs",
  "4-kurs",
  "Magistratura",
  "Yangilangan vaqti",
]

interface StudentTrackerData {
  tutorName: string
  course_1: number
  course_2: number
  course_3: number
  course_4: number
  masters: number
  timestamp: string
}

/**
 * Update or append student tracker data.
 * If a row with the tutor's name exists, update it.
 * Otherwise, append a new row.
 */
export const updateOrAppendStudentTracker = async (
  templateInfo: { templateKey: string; templateName: string },
  trackerData: StudentTrackerData,
) => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

  if (!spreadsheetId) {
    console.error("Google Sheets spreadsheet ID not configured")
    return
  }

  try {
    const { templateKey, templateName } = templateInfo
    const { sheets } = await getGoogleSheetsClient()
    const sheetInfo = await ensureTemplateSheet(templateKey, templateName, sheets)

    // Ensure headers are set up for student tracker (bypass BASE_HEADERS injection)
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${quoteSheetTitle(sheetInfo.title)}!A1:G1`,
    })
    const existingHeaders = headerCheck.data.values?.[0] ?? []
    const headersMatch = STUDENT_TRACKER_HEADERS.every((h, i) => existingHeaders[i] === h)
    if (!headersMatch) {
      await sheets.spreadsheets.values.clear({ spreadsheetId, range: `${quoteSheetTitle(sheetInfo.title)}!1:1` })
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${quoteSheetTitle(sheetInfo.title)}!A1:G1`,
        valueInputOption: 'RAW',
        requestBody: { values: [STUDENT_TRACKER_HEADERS] },
      })
    }

    // Get all rows to find existing tutor row
    const readResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${quoteSheetTitle(sheetInfo.title)}!A:G`,
    })

    const rows = readResponse.data.values || []

    // Find the column index for Tutor name (first column)
    const tutorColIndex = 0 // Tutor ismi is always first

    // Find existing row with this tutor's name (trim both sides to handle trailing spaces)
    let existingRowIndex = -1
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][tutorColIndex]?.trim().toLowerCase() === trackerData.tutorName.trim().toLowerCase()) {
        existingRowIndex = i
        break
      }
    }

    const rowData = [
      trackerData.tutorName,
      trackerData.course_1,
      trackerData.course_2,
      trackerData.course_3,
      trackerData.course_4,
      trackerData.masters,
      trackerData.timestamp,
    ]

    if (existingRowIndex >= 0) {
      // Update existing row
      const range = `${quoteSheetTitle(sheetInfo.title)}!A${existingRowIndex + 1}:G${existingRowIndex + 1}`
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      })
      console.log(`Updated student tracker row for tutor: ${trackerData.tutorName}`)
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${quoteSheetTitle(sheetInfo.title)}!A:G`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      })
      console.log(`Appended new student tracker row for tutor: ${trackerData.tutorName}`)
    }

    return { success: true, updated: existingRowIndex >= 0 }
  } catch (error) {
    console.error("Error updating student tracker in Google Sheets:", error)
    throw error
  }
}


/**
 * Find the row for a given reportId and update all answer columns in place.
 * Preserves "Report ID" and "Submitted At" columns; updates everything else.
 */
export const updateRowInGoogleSheet = async (
  templateInfo: { templateKey: string; templateName: string },
  reportId: string,
  updatedData: {
    teamName: string
    userName: string
    answers: SheetAnswer[]
  },
) => {
  const spreadsheetId = getEnvVar('GOOGLE_SHEETS_ID')

  if (!spreadsheetId) {
    console.warn('Google Sheets spreadsheet ID not configured, skipping row update')
    return
  }

  try {
    const { templateKey, templateName } = templateInfo
    const { sheets } = await getGoogleSheetsClient()
    const sheetInfo = await ensureTemplateSheet(templateKey, templateName, sheets)

    // Read column A to find the row with the matching Report ID
    const colAResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${quoteSheetTitle(sheetInfo.title)}!A:A`,
    })
    const colAValues = colAResponse.data.values || []

    let targetRowIndex = -1
    for (let i = 1; i < colAValues.length; i++) {
      if (colAValues[i]?.[0] === reportId) {
        targetRowIndex = i
        break
      }
    }

    if (targetRowIndex < 0) {
      console.warn(`Report ID "${reportId}" not found in sheet "${sheetInfo.title}", skipping update`)
      return
    }

    // Read current headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${quoteSheetTitle(sheetInfo.title)}!1:1`,
    })
    const headers: string[] = headerResponse.data.values?.[0] ?? []

    // Read the current row to preserve any columns not in our answer map
    const rowRange = `${quoteSheetTitle(sheetInfo.title)}!${targetRowIndex + 1}:${targetRowIndex + 1}`
    const rowResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rowRange,
    })
    const currentRow: string[] = rowResponse.data.values?.[0] ?? []

    const answerMap = new Map(
      updatedData.answers.map((a) => [a.label, a.value === undefined || a.value === null ? '' : String(a.value)]),
    )

    const updatedRow = headers.map((header, colIndex) => {
      // Always preserve Report ID and Submitted At
      if (header === 'Report ID' || header === 'Submitted At') {
        return currentRow[colIndex] ?? ''
      }
      if (header === 'Team Name') return updatedData.teamName
      if (header === 'User Name') return updatedData.userName
      return answerMap.has(header) ? (answerMap.get(header) ?? '') : (currentRow[colIndex] ?? '')
    })

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${quoteSheetTitle(sheetInfo.title)}!A${targetRowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] },
    })

    console.log(`Updated sheet row for report: ${reportId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating row in Google Sheets:', error)
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

// Client-side utility functions for Google Sheets URLs
export const getGoogleSheetsUrl = (teamName?: string): string => {
  // Try to get from client-side env first, fallback to server-side
  const spreadsheetId = (globalThis as any)?.process?.env?.NEXT_PUBLIC_GOOGLE_SHEETS_ID as string | undefined
  if (!spreadsheetId) {
    // Return # when not configured (same as admin dashboard)
    return "#"
  }

  const baseUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
  if (teamName) {
    const sheetName = `Template_${teamName.replace(/[^a-zA-Z0-9]/g, "_")}`
    return `${baseUrl}/edit#gid=0&range=${sheetName}`
  }
  return `${baseUrl}/edit`
}
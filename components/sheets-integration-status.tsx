"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

interface SheetsStatus {
  configured: boolean
  spreadsheetId?: string
  sheetUrl?: string
  error?: string
}

export default function SheetsIntegrationStatus() {
  const [status, setStatus] = useState<SheetsStatus>({ configured: false })
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/sheets")
      const data = await response.json()

      if (response.ok) {
        setStatus(data)
      } else {
        setStatus({ configured: false, error: data.error })
      }
    } catch (error) {
      setStatus({ configured: false, error: "Failed to check status" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Google Sheets Integration</CardTitle>
              {status.configured ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <CardDescription className="mt-1">Reports are automatically saved to Google Sheets</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={checkStatus} disabled={loading} className="ml-4 bg-transparent">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={status.configured ? "default" : "secondary"}>
            {status.configured ? "Connected" : "Not Configured"}
          </Badge>
          {status.spreadsheetId && (
            <Badge variant="outline" className="font-mono text-xs">
              {status.spreadsheetId.slice(0, 8)}...
            </Badge>
          )}
        </div>

        {status.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{status.error}</p>
          </div>
        )}

        {status.configured && status.sheetUrl && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              All reports are automatically saved to separate sheets for each team.
            </p>
            <Button variant="outline" asChild>
              <a href={status.sheetUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Spreadsheet
              </a>
            </Button>
          </div>
        )}

        {!status.configured && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              To enable Google Sheets integration, set the following environment variables:
            </p>
            <div className="p-3 bg-muted rounded-lg font-mono text-xs">
              <div>GOOGLE_SHEETS_ID=your_spreadsheet_id</div>
              <div>GOOGLE_SHEETS_API_KEY=your_api_key</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

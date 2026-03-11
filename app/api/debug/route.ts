import { type NextRequest, NextResponse } from "next/server"

let debugLogs: string[] = []

export async function GET() {
  return NextResponse.json({ 
    logs: debugLogs,
    timestamp: new Date().toISOString(),
    totalLogs: debugLogs.length
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, level = 'info', component, data } = body
    
    const logEntry = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${component || 'UNKNOWN'}]: ${message}${data ? ' | Data: ' + JSON.stringify(data) : ''}`
    
    debugLogs.push(logEntry)
    
    // Keep only last 100 logs to prevent memory issues
    if (debugLogs.length > 100) {
      debugLogs = debugLogs.slice(-100)
    }
    
    console.log(logEntry) // Also log to console
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Failed to log debug message' }, { status: 500 })
  }
}

export async function DELETE() {
  debugLogs = []
  return NextResponse.json({ success: true, message: 'Debug logs cleared' })
}
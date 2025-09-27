import { type NextRequest, NextResponse } from "next/server"
import { handleBotCommand } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle Telegram webhook
    if (body.message) {
      const { chat, from, text } = body.message

      if (text?.startsWith("/")) {
        await handleBotCommand(chat.id, text, from.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

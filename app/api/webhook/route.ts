import { type NextRequest, NextResponse } from "next/server"
import { handleBotCommand } from "@/lib/bot-commands"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle Telegram webhook
    if (body.message) {
      const { chat, from, text } = body.message

      // Handle all messages (not just commands)
      if (text) {
        await handleBotCommand(
          chat.id, 
          text, 
          from.id,
          from.first_name,
          from.last_name,
          from.username
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

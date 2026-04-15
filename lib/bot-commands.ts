import { isAdmin } from "./telegram"
import { getUserByTelegramId, createUser, updateUser } from "./database"

// Returns a Telegram Bot API inline response payload (no outbound fetch needed)
interface TelegramReply {
  method: string
  chat_id: number
  text: string
  reply_markup?: object
  parse_mode?: string
}

type GlobalWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>
  }
}

const getEnv = (): Record<string, string | undefined> => {
  return (globalThis as GlobalWithProcess).process?.env ?? {}
}

const getMiniAppBaseUrl = (env: Record<string, string | undefined>): string | null => {
  const explicitUrl = env.TELEGRAM_MINI_APP_URL || env.NEXT_PUBLIC_APP_URL
  if (explicitUrl) {
    return explicitUrl.replace(/\/+$/, "")
  }

  const webhookUrl = env.TELEGRAM_WEBHOOK_URL
  if (!webhookUrl) {
    return null
  }

  try {
    return new URL(webhookUrl).origin
  } catch (error) {
    console.error("Invalid TELEGRAM_WEBHOOK_URL for mini app derivation:", error)
    return null
  }
}

export async function handleBotCommand(chatId: number, message: string, userId: number, firstName?: string, lastName?: string, username?: string): Promise<TelegramReply> {
  console.log(`Handling bot message: ${message} for user ${userId}`)

  const env = getEnv()

  try {
    // Check if user exists in database, create if not
    let user = await getUserByTelegramId(userId)
    const envSaysAdmin = isAdmin(userId)

    if (!user) {
      user = await createUser({
        telegramId: userId,
        firstName: firstName || "User",
        lastName: lastName || "",
        username: username || "",
        role: envSaysAdmin ? "admin" : "employee",
        teamId: undefined,
      })
      console.log("Created new user:", user)
    } else if (envSaysAdmin && user.role !== "admin") {
      const updated = await updateUser(userId, { role: "admin" })
      if (updated) {
        console.log("Elevated user to admin via bot command:", updated.telegramId)
        user = updated
      }
    }

    const isUserAdmin = envSaysAdmin || user.role === "admin"

    const replyMsg = isUserAdmin
      ? "Welcome, Admin! 👋\n\nAccess your admin dashboard to manage teams and view reports."
      : "Welcome! 👋\n\nClick the button below to submit your daily report."

    const baseAppUrl = getMiniAppBaseUrl(env)
    // Append version timestamp to bust Telegram's mini app cache on each /start
    const versionParam = `v=${Date.now()}`
    const webAppUrl = baseAppUrl
      ? isUserAdmin
        ? `${baseAppUrl}?admin=true&${versionParam}`
        : `${baseAppUrl}?${versionParam}`
      : null

    if (!webAppUrl) {
      console.error("Telegram mini app URL is not configured. Set TELEGRAM_MINI_APP_URL, NEXT_PUBLIC_APP_URL, or TELEGRAM_WEBHOOK_URL.")
    }

    const buttonText = isUserAdmin ? "📊 Admin Dashboard" : "📝 Submit Report"
    const replyMarkup = webAppUrl
      ? { inline_keyboard: [[{ text: buttonText, web_app: { url: webAppUrl } }]] }
      : undefined

    return { method: "sendMessage", chat_id: chatId, text: replyMsg, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) }
  } catch (error) {
    console.error("Error handling bot message:", error)
    return { method: "sendMessage", chat_id: chatId, text: "Sorry, something went wrong. Please try again later." }
  }
}

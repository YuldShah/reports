import { sendTelegramMessage, isAdmin } from "./telegram"
import { getUserByTelegramId, createUser, updateUser } from "./database"

type GlobalWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>
  }
}

const getEnv = (): Record<string, string | undefined> => {
  return (globalThis as GlobalWithProcess).process?.env ?? {}
}

export async function handleBotCommand(chatId: number, message: string, userId: number, firstName?: string, lastName?: string, username?: string) {
  try {
    console.log(`Handling bot message: ${message} for user ${userId}`)

    // Check if TELEGRAM_BOT_TOKEN is available
    const env = getEnv()
    const botToken = env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is not set")
      return
    }

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

    // Echo the message with appropriate button
    const replyMsg = isUserAdmin ? "Welcome, Admin! 👋\n\nAccess your admin dashboard to manage teams and view reports." : "Welcome! 👋\n\nClick the button below to submit your daily report."
    
    const baseAppUrl = env.NEXT_PUBLIC_APP_URL || "https://voip-armstrong-lot-make.trycloudflare.com"
    const webAppUrl = isUserAdmin ? `${baseAppUrl}?admin=true` : baseAppUrl

    const buttonText = isUserAdmin ? "📊 Admin Dashboard" : "📝 Submit Report"
    const additionalText = isUserAdmin ? 
      "\n\nUse the button below to access your admin dashboard." : 
      "\n\nUse the button below to submit your report."

    const replyMarkup = {
      inline_keyboard: [[
        {
          text: buttonText,
          web_app: { url: webAppUrl }
        }
      ]]
    }
    
    await sendTelegramMessage(
      chatId,
      replyMsg,
      replyMarkup
    )
  } catch (error) {
    console.error("Error handling bot message:", error)
    
    // Send error message to user
    await sendTelegramMessage(
      chatId,
      "Sorry, something went wrong. Please try again later."
    )
  }
}

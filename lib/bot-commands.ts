import { sendTelegramMessage } from "./telegram"
import { getUserByTelegramId, createUser } from "./database"

export async function handleBotCommand(chatId: number, message: string, userId: number, firstName?: string, lastName?: string, username?: string) {
  try {
    console.log(`Handling bot message: ${message} for user ${userId}`)

    // Check if TELEGRAM_BOT_TOKEN is available
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is not set")
      return
    }

    // Check if user exists in database, create if not
    let user = await getUserByTelegramId(userId)
    if (!user) {
      user = await createUser({
        telegramId: userId,
        firstName: firstName || "User",
        lastName: lastName || "",
        username: username || "",
        role: "employee",
        teamId: undefined
      })
      console.log("Created new user:", user)
    }

    // Check if user is admin
    const adminIds = process.env.TELEGRAM_ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || []
    const isUserAdmin = adminIds.includes(userId) || user.role === "admin"

    // Echo the message with appropriate button
    const echoText = message === "/start" ? 
      (isUserAdmin ? "Welcome, Admin! 👋\n\nAccess your admin dashboard to manage teams and view reports." : "Welcome! 👋\n\nClick the button below to submit your daily report.") :
      `Echo: ${message}`

    const webAppUrl = isUserAdmin ? 
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?admin=true` : 
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

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
      message === "/start" ? echoText : echoText + additionalText,
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
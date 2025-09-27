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

    // Check if user exists in database
    let user = await getUserByTelegramId(userId)
    
    if (!user) {
      // Create new user record with actual user data
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

    if (message === "/start" || message.toLowerCase().includes("start") || message.toLowerCase().includes("help")) {
      // Handle start/help commands
      if (isUserAdmin) {
        // Send admin dashboard button with fullscreen
        const webAppUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?admin=true`
        const replyMarkup = {
          inline_keyboard: [[
            {
              text: "📊 Admin Dashboard",
              web_app: { 
                url: webAppUrl
              }
            }
          ]]
        }
        
        await sendTelegramMessage(
          chatId,
          "Welcome, Admin! 👋\n\nAccess your admin dashboard to manage teams and view reports.",
          replyMarkup
        )
      } else {
        // Send employee report submission button with fullscreen
        const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const replyMarkup = {
          inline_keyboard: [[
            {
              text: "📝 Submit Report",
              web_app: { 
                url: webAppUrl
              }
            }
          ]]
        }
        
        await sendTelegramMessage(
          chatId,
          "Welcome! 👋\n\nClick the button below to submit your daily report.",
          replyMarkup
        )
      }
    } else {
      // Echo all other messages with appropriate buttons
      if (isUserAdmin) {
        const webAppUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?admin=true`
        const replyMarkup = {
          inline_keyboard: [[
            {
              text: "📊 Admin Dashboard",
              web_app: { 
                url: webAppUrl
              }
            }
          ]]
        }
        
        await sendTelegramMessage(
          chatId,
          `Echo: ${message}\n\nUse the button below to access your admin dashboard.`,
          replyMarkup
        )
      } else {
        const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const replyMarkup = {
          inline_keyboard: [[
            {
              text: "📝 Submit Report",
              web_app: { 
                url: webAppUrl
              }
            }
          ]]
        }
        
        await sendTelegramMessage(
          chatId,
          `Echo: ${message}\n\nUse the button below to submit your report.`,
          replyMarkup
        )
      }
    }
  } catch (error) {
    console.error("Error handling bot message:", error)
    
    // Send error message to user
    await sendTelegramMessage(
      chatId,
      "Sorry, something went wrong. Please try again later."
    )
  }
}
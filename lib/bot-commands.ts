import { sendTelegramMessage } from "./telegram"
import { getUserByTelegramId, createUser } from "./database"

export async function handleBotCommand(chatId: number, command: string, userId: number) {
  try {
    console.log(`Handling bot command: ${command} for user ${userId}`)

    // Check if TELEGRAM_BOT_TOKEN is available
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is not set")
      return
    }

    if (command === "/start") {
      // Check if user exists in database
      let user = await getUserByTelegramId(userId)
      
      if (!user) {
        // Create new user record
        user = await createUser({
          telegramId: userId,
          firstName: "User",
          lastName: "",
          username: "",
          role: "employee",
          teamId: undefined
        })
        console.log("Created new user:", user)
      }

      // Check if user is admin
      const adminIds = process.env.TELEGRAM_ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || []
      const isUserAdmin = adminIds.includes(userId) || user.role === "admin"

      if (isUserAdmin) {
        // Send admin dashboard button
        const webAppUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?admin=true`
        const replyMarkup = {
          inline_keyboard: [[
            {
              text: "📊 Admin Dashboard",
              web_app: { url: webAppUrl }
            }
          ]]
        }
        
        await sendTelegramMessage(
          chatId,
          "Welcome, Admin! 👋\n\nAccess your admin dashboard to manage teams and view reports.",
          replyMarkup
        )
      } else {
        // Send employee report submission button
        const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const replyMarkup = {
          inline_keyboard: [[
            {
              text: "📝 Submit Report",
              web_app: { url: webAppUrl }
            }
          ]]
        }
        
        await sendTelegramMessage(
          chatId,
          "Welcome! 👋\n\nClick the button below to submit your daily report.",
          replyMarkup
        )
      }
    }
  } catch (error) {
    console.error("Error handling bot command:", error)
    
    // Send error message to user
    await sendTelegramMessage(
      chatId,
      "Sorry, something went wrong. Please try again later."
    )
  }
}
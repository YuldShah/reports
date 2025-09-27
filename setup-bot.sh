#!/bin/bash

echo "🤖 Telegram Reports Bot Setup Script"
echo "=================================="
echo ""

# Check if running on server
if [[ "$HOSTNAME" != *"Digital"* ]] && [[ "$HOSTNAME" != *"reports"* ]]; then
  echo "⚠️  Please run this script on your server (138.68.114.226)"
  exit 1
fi

echo "📱 STEP 1: Create Telegram Bot"
echo "-----------------------------"
echo "1. Open Telegram and message @BotFather"
echo "2. Send: /newbot"
echo "3. Bot name: Reports Team Bot"
echo "4. Bot username: reports_[yourteam]_bot"
echo "5. Copy the bot token"
echo ""
read -p "Enter your bot token: " BOT_TOKEN

echo ""
echo "👤 STEP 2: Get Your Telegram ID"
echo "-----------------------------"
echo "1. Message @userinfobot on Telegram"
echo "2. Copy your user ID"
echo ""
read -p "Enter your Telegram user ID: " ADMIN_ID

echo ""
echo "📊 STEP 3: Google Sheets Setup (Optional)"
echo "----------------------------------------"
echo "1. Create a new Google Sheets spreadsheet"
echo "2. Get the spreadsheet ID from the URL"
echo "3. Enable Google Sheets API and get API key"
echo ""
read -p "Enter Google Sheets ID (or press Enter to skip): " SHEETS_ID
if [[ ! -z "$SHEETS_ID" ]]; then
  read -p "Enter Google Sheets API key: " SHEETS_API
fi

echo ""
echo "🔧 Updating configuration..."

# Update .env file
cat > .env << EOF
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=$BOT_TOKEN
NEXT_PUBLIC_APP_URL=https://86379f84479c.ngrok-free.app

# Google Sheets Configuration (Optional)
GOOGLE_SHEETS_ID=${SHEETS_ID:-}
GOOGLE_SHEETS_API_KEY=${SHEETS_API:-}
EOF

# Update admin ID in the code
if [[ ! -z "$ADMIN_ID" ]]; then
  sed -i "s/6520664733/$ADMIN_ID/" lib/telegram.ts
  echo "✅ Updated admin ID in lib/telegram.ts"
fi

echo "✅ Environment variables updated in .env"

echo ""
echo "🚀 STEP 4: Setting up Telegram Webhook"
echo "-------------------------------------"

if [[ ! -z "$BOT_TOKEN" ]]; then
  WEBHOOK_URL="https://86379f84479c.ngrok-free.app/api/webhook"
  
  echo "Setting webhook URL: $WEBHOOK_URL"
  
  response=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$WEBHOOK_URL\"}")
  
  if echo "$response" | grep -q '"ok":true'; then
    echo "✅ Webhook set successfully!"
    echo ""
    echo "🎉 SETUP COMPLETE!"
    echo "================="
    echo ""
    echo "Your bot is now ready! Here's what you can do:"
    echo ""
    echo "1. 👨‍💼 Admin Commands (You):"
    echo "   • Message your bot with /start to get admin panel"
    echo "   • Access: https://86379f84479c.ngrok-free.app"
    echo ""
    echo "2. 👥 Team Setup:"
    echo "   • Create teams in admin panel"
    echo "   • Assign users to teams"
    echo "   • Users can then submit reports"
    echo ""
    echo "3. 🔄 Restart services:"
    pm2 restart reports-app
    echo "   ✅ Application restarted with new config"
    echo ""
    echo "4. 📝 Test the bot:"
    echo "   • Send /start to your bot on Telegram"
    echo "   • You should see admin options"
    echo ""
    echo "🆘 Troubleshooting:"
    echo "• Check logs: pm2 logs reports-app"
    echo "• Check ngrok: pm2 logs ngrok-reports"
    echo "• Restart ngrok: pm2 restart ngrok-reports"
    echo ""
    echo "⚡ Current Status:"
    pm2 status
  else
    echo "❌ Failed to set webhook. Response:"
    echo "$response"
    echo ""
    echo "Please check your bot token and try again."
  fi
else
  echo "⚠️  No bot token provided. Please run the script again."
fi

echo ""
echo "📧 Need help? The bot is configured and ready to use!"
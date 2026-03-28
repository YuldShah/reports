#!/bin/bash
set -euo pipefail

# ============================================================
# VPS Deployment Script for reports-app
# Target: ubuntu@193.149.17.25
# Run this ON the VPS after SSH'ing in
# ============================================================

echo "=== [1/7] System Update ==="
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip

echo "=== [2/7] Install Node.js 20 LTS ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "=== [3/7] Install Bun ==="
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc

echo "=== [4/7] Clone Repository ==="
cd ~
if [ -d "reports-app" ]; then
  echo "reports-app directory exists, pulling latest..."
  cd reports-app
  git pull origin redesign
else
  git clone -b redesign git@github.com:YuldShah/reports.git reports-app
  cd reports-app
fi

echo "=== [5/7] Install Dependencies ==="
bun install

echo "=== [6/7] Create .env.local ==="
if [ ! -f .env.local ]; then
  cat > .env.local << 'ENVEOF'
# === FILL THESE IN ===

# Supabase PostgreSQL connection string
# Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
DATABASE_URL=
DATABASE_SSL=true

# Telegram Bot
TELEGRAM_BOT_TOKEN=7525140955:AAHTe0s9SDP6YyOzKH-w2_YprqW6QG8CASM
TELEGRAM_WEBHOOK_URL=https://reportsv2.yall.uz/api/webhook
TELEGRAM_MINI_APP_URL=https://reportsv2.yall.uz
NEXT_PUBLIC_APP_URL=https://reportsv2.yall.uz

# Google Sheets Integration
GOOGLE_SHEETS_ID=1rawzYE4uOH5PMBPrlH-vpPNK08l-7HWccjiuNNbUJUg
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=newkey.json

# App Config
NODE_ENV=production
PORT=3000
ENVEOF
  echo ">>> .env.local created — EDIT IT to add your Supabase DATABASE_URL <<<"
else
  echo ".env.local already exists, skipping"
fi

echo "=== [7/7] Build & Test ==="
bun run build

echo ""
echo "============================================"
echo "  Build complete! Next steps:"
echo "  1. Edit .env.local with Supabase DATABASE_URL"
echo "  2. Copy newkey.json (Google SA key) to ~/reports-app/"
echo "  3. Run: sudo bash ~/setup-systemd.sh"
echo "  4. Run: sudo bash ~/setup-cloudflared.sh"
echo "============================================"

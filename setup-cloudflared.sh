#!/bin/bash
set -euo pipefail

# ============================================================
# Cloudflared Tunnel Setup for yall.uz
# Run with: sudo bash setup-cloudflared.sh
# ============================================================

echo "=== [1/4] Install cloudflared ==="
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb
rm /tmp/cloudflared.deb

echo "=== [2/4] Authenticate with Cloudflare ==="
echo ">>> A browser URL will be shown. Open it to authorize. <<<"
cloudflared tunnel login

echo "=== [3/4] Create tunnel ==="
TUNNEL_NAME="reports-app"
cloudflared tunnel create ${TUNNEL_NAME}

# Get the tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep ${TUNNEL_NAME} | awk '{print $1}')
echo "Tunnel ID: ${TUNNEL_ID}"

echo "=== [4/4] Configure tunnel ==="
mkdir -p ~/.cloudflared

cat > ~/.cloudflared/config.yml << EOF
tunnel: ${TUNNEL_ID}
credentials-file: /home/ubuntu/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: yall.uz
    service: http://localhost:3000
  - hostname: "*.yall.uz"
    service: http://localhost:3000
  - service: http_status:404
EOF

echo ""
echo "============================================"
echo "  Tunnel configured! Now you need to:"
echo ""
echo "  1. Add DNS CNAME records in Cloudflare dashboard:"
echo "     yall.uz     -> ${TUNNEL_ID}.cfargotunnel.com"
echo "     *.yall.uz   -> ${TUNNEL_ID}.cfargotunnel.com"
echo ""
echo "  Or run:"
echo "     cloudflared tunnel route dns ${TUNNEL_NAME} yall.uz"
echo ""
echo "  2. Install as a systemd service:"
echo "     sudo cloudflared service install"
echo "     sudo systemctl start cloudflared"
echo "     sudo systemctl enable cloudflared"
echo ""
echo "  3. Update Telegram webhook:"
echo "     curl -X POST 'https://api.telegram.org/bot7525140955:AAHTe0s9SDP6YyOzKH-w2_YprqW6QG8CASM/setWebhook?url=https://yall.uz/api/webhook'"
echo "============================================"

#!/bin/bash
set -euo pipefail

# ============================================================
# Systemd Service Setup for reports-app
# Run with: sudo bash setup-systemd.sh
# ============================================================

APP_DIR="/home/ubuntu/reports-app"
BUN_PATH="/home/ubuntu/.bun/bin/bun"

echo "=== Creating systemd service ==="

cat > /etc/systemd/system/reports-app.service << EOF
[Unit]
Description=Reports App (Next.js)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=${APP_DIR}
ExecStart=${BUN_PATH} run start
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable reports-app
systemctl start reports-app

echo "=== Service started ==="
systemctl status reports-app --no-pager
echo ""
echo "Useful commands:"
echo "  sudo systemctl status reports-app"
echo "  sudo journalctl -u reports-app -f"
echo "  sudo systemctl restart reports-app"

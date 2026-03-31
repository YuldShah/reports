#!/bin/bash
set -euo pipefail

APP_DIR="/home/ubuntu/reports-app"
if [ ! -d "$APP_DIR" ]; then
  APP_DIR="/var/www/reports-app"
fi

cd "$APP_DIR"

echo "Deploying from: $APP_DIR"

BACKUP_DIR="$HOME/reports-app-untracked-backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -d app/api/uploads ]; then
  mv app/api/uploads "$BACKUP_DIR/app-api-uploads"
fi

if [ -d app/uploads ]; then
  mv app/uploads "$BACKUP_DIR/app-uploads"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  git stash push -m "pre-deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi

git fetch origin
git checkout redesign-ui
git pull --ff-only origin redesign-ui

if command -v bun >/dev/null 2>&1; then
  bun install
  bun run build
else
  npm install
  npm run build
fi

sudo systemctl restart reports-app

curl -sS -o /tmp/root.out -w "%{http_code}\n" http://127.0.0.1:3000/
curl -sS -o /tmp/templates.out -w "%{http_code}\n" http://127.0.0.1:3000/api/templates

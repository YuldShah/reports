# Reports App Handoff

## Summary

This is a Next.js 14 Telegram Mini App plus bot backend for team reporting.

Current blocker: Telegram Mini App still shows a logo-only loading screen for at least one user path even after API and deployment fixes.

## Current Production State

- Public app URL: https://reportsv2.yall.uz
- VPS: ubuntu@193.149.17.25
- App path on VPS: /home/ubuntu/reports-app
- App service: reports-app.service
- Tunnel/proxy: Cloudflare tunnel for reportsv2.yall.uz
- App health checks: root route and webhook route currently respond from production

## Runtime Configuration Notes

- TELEGRAM_WEBHOOK_URL is set to https://reportsv2.yall.uz/api/webhook
- TELEGRAM_MINI_APP_URL was explicitly added and set to https://reportsv2.yall.uz
- Bot command code builds Mini App URL from TELEGRAM_MINI_APP_URL or NEXT_PUBLIC_APP_URL, else derives origin from TELEGRAM_WEBHOOK_URL
- Telegram getChatMenuButton still returns type commands in current checks (not web_app)

## Production Fixes Already Applied

### 1) Database schema mismatch fixed

Problem seen in production logs:
- /api/teams returned 500
- Postgres error: relation team_templates does not exist

Action taken:
- Ran migration-multiple-templates.sql on production database
- Restarted reports-app.service

Result:
- /api/teams now returns 200

### 2) Auth startup hardening shipped

Files updated in codebase:
- lib/auth.tsx
- lib/telegram.ts

Changes:
- Added fetch timeout protection for auth API calls during initialization
- Improved Telegram WebApp readiness handling so wait flow cannot hang due duplicate resolve path

Deployment:
- Built locally
- Copied build artifact to VPS via scp
- Restarted reports-app.service
- Verified patched auth string exists in deployed .next bundle

### 3) Baseline schema and docs brought in sync

Files updated:
- init-database.sql
- DATABASE_SCHEMA.md

Changes:
- Included team_templates in base schema and indexes
- Documented many-to-many team/template mapping

## Unresolved Issue

### Symptom

Inside Telegram Mini App, app remains on logo/spinner style screen and does not proceed to dashboard for some user flow.

### What is confirmed working

- Public site responds 200
- Webhook endpoint responds 200 on POST
- Local app endpoint on VPS responds 200
- reports-app.service is active
- No new service errors in recent 10 minute window after fixes

### What is still uncertain

- Whether Telegram client is opening a stale cached Mini App instance for this bot/user
- Whether this specific user is hitting a Telegram-side path that bypasses updated button URL generation
- Whether a chat-specific Telegram menu button state is overriding expected launch path

## High-Value Next Debugging Steps

1. Add explicit auth progress logging to server route and client debug endpoint.
2. Capture Telegram initData presence and user id at runtime from the affected device session.
3. Expose a temporary debug panel in Mini App showing:
- waitForTelegram result
- has initData
- has initDataUnsafe.user
- /api/users call status and timing
4. Force a versioned Mini App URL from bot button for cache busting, for example https://reportsv2.yall.uz/?v=20260327a
5. Verify bot keyboard button payload currently sent to affected user chat (not only menu button defaults).
6. If needed, set per-user chat menu button to web_app and validate with Telegram API response.

## Operational Commands

### Service checks

- sudo systemctl status reports-app --no-pager -l
- sudo journalctl -u reports-app -n 120 --no-pager
- sudo journalctl -u reports-app -f

### HTTP checks from VPS

- curl -sS -o /tmp/root.out -w '%{http_code}' http://127.0.0.1:3000/
- curl -sS -o /tmp/teams.out -w '%{http_code}' http://127.0.0.1:3000/api/teams
- curl -sS -o /tmp/wh.out -w '%{http_code}' -X POST http://127.0.0.1:3000/api/webhook -H 'Content-Type: application/json' -d '{}'

### Telegram bot checks

- getWebhookInfo
- getChatMenuButton
- setChatMenuButton

## Deployment Notes

- VPS resources are tight. Prefer local build and scp artifact deployment.
- After deploying .next, always restart reports-app.service.
- Re-run /api/teams check after deployment since missing team_templates previously caused silent feature break.

## First 30 Minutes Checklist For New Owner

1. Confirm service, root route, and /api/teams are healthy.
2. Reproduce stuck screen on affected Telegram account.
3. Collect runtime auth telemetry for that session.
4. Verify exact button payload that launched Mini App.
5. Roll out versioned launch URL and retest.
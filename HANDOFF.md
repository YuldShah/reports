# Reports App Handoff

## Current Production State

- Public app URL: `https://reports.yall.uz`
- New VPS: `ubuntu@193.149.17.11`
- App service: `reports-app.service`
- Tunnel service: `cloudflared.service`
- Database runtime: Supabase session pooler
- Old local PostgreSQL on VPS: stopped and disabled
- Unrelated VPS services removed from runtime: `nginx`, `ModemManager`, `udisks2`, `fwupd`, `multipathd`

## Infrastructure Notes

- The app is deployed to a 1 GB RAM VPS, so production builds should be done locally and copied to the server rather than built on the VPS.
- Cloudflare Tunnel is configured as a named tunnel and routes `reports.yall.uz` to `localhost:3000`.
- Telegram webhook is expected to point at `https://reports.yall.uz/api/webhook`.
- Google Sheets integration is active and depends on the service account JSON existing on the VPS.
- `reports-app.service` and `cloudflared.service` both use systemd restart overrides with `Restart=always` and `RestartSec=5`.

## Database Migration State

- Production has been moved from local PostgreSQL to Supabase.
- The current app uses a standard Postgres connection via `pg` and `DATABASE_URL`.
- `DATABASE_SSL=true` is required for the Supabase connection.
- The Supabase direct `db.<project>.supabase.co:5432` endpoint was not usable from the VPS because it resolved to IPv6 only.
- Production uses the Supabase session pooler instead.

## Data Verification Completed

The migrated production dataset was verified with these counts:

- `reports`: 99
- `teams`: 5
- `templates`: 7
- `users`: 19
- `team_templates`: 12
- `template_sheet_registry`: 5

## Google Sheets Notes

- The app supports both `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` and `GOOGLE_APPLICATION_CREDENTIALS`.
- On the VPS, the service account key must exist at the path referenced by env.
- A previous failure was caused by the key file being missing on the new VPS, not by the Sheets code path itself.

## Telegram / Mini App Notes

- The mini app URL should come from `TELEGRAM_MINI_APP_URL` or `NEXT_PUBLIC_APP_URL`.
- If those are absent, the bot falls back to deriving the origin from `TELEGRAM_WEBHOOK_URL`.
- The stale quick-tunnel URL has been removed from the bot command path.

## Build / Deployment Gotcha

- A Windows-specific build failure was caused by mixed path casing, for example `Desktop/project` vs `Desktop/Project`.
- This caused duplicate module resolution inside Next.js and produced prerender crashes during `next build`.
- `npm run build` now goes through `scripts/build-production.js`, which normalizes the real path before invoking Next.js.
- If a future agent sees inexplicable `useContext` prerender failures on Windows, check path casing first.

## Files Changed For Stability

- `lib/bot-commands.ts`
- `lib/google-sheets.ts`
- `.env.example`
- `README.md`
- `package.json`
- `scripts/build-production.js`

## Recommended Future Checks

- Verify `reports-app.service` after any env change: `sudo systemctl status reports-app`
- Verify tunnel health after any DNS/tunnel change: `sudo systemctl status cloudflared`
- Verify webhook after bot changes: `getWebhookInfo` via Telegram Bot API
- Verify Sheets after env or key changes: `GET /api/sheets`
- Follow app logs live: `sudo journalctl -u reports-app -f`
- Follow tunnel logs live: `sudo journalctl -u cloudflared -f`
- Show recent app logs: `sudo journalctl -u reports-app -n 100 --no-pager`
- Show recent tunnel logs: `sudo journalctl -u cloudflared -n 100 --no-pager`

## What Not To Regress

- Do not point production back to local Postgres unless intentionally rolling back.
- Do not remove `DATABASE_SSL=true` while using Supabase.
- Do not build on the 1 GB VPS unless the deployment process changes.
- Do not assume the Supabase direct DB host works from the VPS; prefer the session pooler.
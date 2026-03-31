# Reports App Handoff (2026-03-28)

## Executive Summary

This handoff replaces the previous stale state.

Current user-facing outcomes in production:
- Photo preview thumbnails load reliably after upload.
- Fullscreen photo preview is no longer hidden behind the top profile/header area.
- Photo field wording has been standardized in templates and UI:
	- Label: Rasm (ixtiyoriy)
	- Helper: 5 tagacha

Code was committed and pushed:
- Branch: redesign-ui
- Commit: 4154c198cf197b7cea040a9f4258081c4683fd17
- Commit message: fix: stabilize uploads and update photo field copy

## Environment And Access

- Public URL: https://reportsv2.yall.uz
- VPS host: ubuntu@193.149.17.25
- App directory: /home/ubuntu/reports-app
- App process: reports-app.service
- Reverse proxy: nginx in front of Next app
- Tunnel/domain: Cloudflare tunnel routing reportsv2.yall.uz

## What Was Fixed This Cycle

### 1) Upload preview reliability

Observed issue:
- Upload endpoint returned URLs, files existed on disk, but public URL returned 404 until app restart.

Code changes:
- app/api/uploads/route.ts now returns absolute URLs pointing at API file-serving endpoint.
- Added central file-serving helper in lib/upload-files.ts.
- Added runtime routes:
	- app/api/uploads/reports/[fileName]/route.ts
	- app/uploads/reports/[fileName]/route.ts

Live production stabilization:
- nginx serves /uploads/ statically from disk, bypassing delayed Next static pickup behavior.

### 2) Photo preview modal overlap

Observed issue:
- Enlarged preview appeared behind the top profile/header area and close button was hard to reach.

Code changes in repository:
- components/report-form.tsx uses createPortal and a high z-index fullscreen overlay.

Live production hotfix on old artifact:
- nginx response injection applies conditional CSS behavior while photo preview is open so header does not cover the modal.

### 3) Template photo text standardization

User request implemented globally:
- Foto (isbot uchun) -> Rasm (ixtiyoriy)
- Helper text reduced to only: 5 tagacha

Database update performed:
- Updated all templates containing photo fields.
- Set photo field label to Rasm (ixtiyoriy).
- Set photo field required=false.
- Verified update count:
	- PHOTO_TEMPLATES_BEFORE=17
	- TEMPLATES_UPDATED=17
	- PHOTO_TEMPLATES_AFTER=17

Code alignment:
- components/report-form.tsx helper text now matches desired copy: 5 tagacha

## Key Repository Changes

Primary files touched for this incident:
- app/api/uploads/route.ts
- lib/upload-files.ts
- app/api/uploads/reports/[fileName]/route.ts
- app/uploads/reports/[fileName]/route.ts
- components/report-form.tsx
- .gitignore

Note:
- Large local tarballs were intentionally removed from git tracking and ignored.
- The files remain on local disk but are not part of the repository history head.

## Current Production Topology

- Public traffic -> Cloudflare tunnel -> nginx (public port 3000)
- nginx routes:
	- /uploads/ -> static files from disk
	- / -> proxied to Next app on localhost:3002

This topology is currently intentional and part of the preview reliability fix.

## Deploying Info

### Safe deploy model currently recommended

Given prior build/runtime mismatch risk, prefer controlled deploys:
- Keep nginx static /uploads behavior in place until a clean full deploy is validated.
- If deploying code, deploy to the existing known-good service pattern and verify health before traffic assumptions.

### Standard service operations on VPS

```bash
sudo systemctl status reports-app --no-pager -l
sudo journalctl -u reports-app -n 150 --no-pager
sudo systemctl restart reports-app

sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx --no-pager -l
```

### Basic post-deploy health checks

```bash
curl -sS -o /tmp/root.out -w '%{http_code}\n' http://127.0.0.1:3000/
curl -sS -o /tmp/teams.out -w '%{http_code}\n' http://127.0.0.1:3000/api/teams
curl -sS -o /tmp/upload.out -w '%{http_code}\n' http://127.0.0.1:3000/api/uploads
curl -sS -o /tmp/wh.out -w '%{http_code}\n' -X POST http://127.0.0.1:3000/api/webhook -H 'Content-Type: application/json' -d '{}'
```

### Upload-specific validation after deploy

1. Submit a report with at least one image.
2. Confirm thumbnail appears immediately in report form.
3. Open fullscreen preview and confirm close button is visible and clickable.
4. Refresh page and confirm image URL still returns 200.

### If push/deploy includes large archives

GitHub hard limit is 100 MB per file.
If push fails with GH001:
- Remove archive artifacts from git tracking.
- Add ignore rules.
- Amend commit and push with force-with-lease if required.

## Rollback Guidance

If new deploy causes user-visible regressions:

1. Restore previous known-good app artifact/service state.
2. Keep nginx /uploads static serving enabled to preserve photo preview reliability.
3. Re-run health checks listed above.
4. Validate one real upload path end-to-end from Telegram Mini App.

## Known Operational Notes

- Local repository has an untracked file named nul, which can break git add -A on Windows.
- Use explicit excludes when staging all files if needed.
- VPS has limited resources; avoid risky in-place rebuilds during peak usage.

## Open Follow-Up Work

1. Replace nginx response-injection hotfixes with fully deployed source behavior once build/runtime compatibility is verified.
2. After clean deploy is confirmed, simplify nginx config by removing temporary HTML/CSS/JS rewrite blocks.
3. Keep a small runbook for emergency upload path validation and rollback.
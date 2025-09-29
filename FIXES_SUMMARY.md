# Google Sheets Integration Fix - Summary

## Issues Identified

1. **Google Sheets Authentication Error**: The error `secretOrPrivateKey must be an asymmetric key when using RS256` indicates the private key format or loading is incorrect.

2. **Database Schema Mismatch**: The current code expects old schema with priority, status, category fields but we want a simplified template-based system.

3. **Mixed Database Systems**: There are remnants of PostgreSQL and JSON database handling mixed with SQLite.

## Changes Made

### 1. Database Schema (init-database.sql)
- Created fresh SQLite schema with 4 tables: users, templates, teams, reports
- Removed priority, status, category from reports
- Added template-based structure
- Simplified role field (no constraints)

### 2. Google Sheets Integration (lib/google-sheets.ts)
- Fixed credential loading to support both environment variables and file
- Changed from team-based sheets to template-based sheets
- Updated headers: "Generated At", "Team Name", "User Name", "Questions & Answers"
- Fixed private key handling for Google Auth

### 3. Reports API (app/api/reports/route.ts)
- Updated to work with template-based reports
- Changed data structure for Google Sheets sync
- Added proper template and team data retrieval

## Files Updated
- `init-database.sql` - New fresh database schema
- `lib/google-sheets.ts` - Fixed authentication and updated for template-based sheets
- `app/api/reports/route.ts` - Updated for new schema
- `lib/database.ts` - Partially updated (needs completion)
- `setup-fresh-database.sh` - VPS setup script

## To Complete on VPS

1. **Run the setup script**:
   ```bash
   cd /root/reports-app
   git pull origin main
   ./setup-fresh-database.sh
   ```

2. **Set environment variables in .env**:
   ```
   GOOGLE_SHEETS_ID=your_spreadsheet_id
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...full JSON here...}
   ```

3. **Create initial admin user** via API call

## Remaining Issues to Fix
1. Complete `lib/database.ts` update for new schema
2. Update UI components for new template-based system
3. Remove all references to priority, status, category in components
4. Test Google Sheets integration with new credential format

## Key Changes Summary
- Templates now drive both reports and Google Sheets
- Each template gets its own sheet (not team-based)
- Simplified report data: just questions/answers, no status/priority
- Fixed Google service account credential loading
- Fresh database with clean schema
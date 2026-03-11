# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 14 application that provides a reports dashboard and Telegram bot backend. Users submit reports through a Telegram Mini App interface, which are stored in PostgreSQL and optionally synced to Google Sheets. The system supports dynamic form templates, team-based organization, and role-based access control.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Database**: PostgreSQL 14+ with `pg` driver
- **UI**: Radix UI components, Tailwind CSS, shadcn/ui
- **Integrations**: Telegram Bot API, Google Sheets API
- **Auth**: Telegram Mini App authentication

## Common Commands

```bash
# Development
bun run dev          # Start development server on http://localhost:3000

# Production
bun run build        # Build for production
bun run start        # Serve production build

# Quality
bun run lint        # Run ESLint

# Database setup (requires DATABASE_URL environment variable)
./setup-fresh-database.sh    # Drop and recreate database schema
```

## Database Architecture

The application uses PostgreSQL with four core tables:

- **users**: Telegram accounts (PK: `telegram_id` bigint)
- **templates**: Dynamic form definitions with JSONB `questions` field
- **teams**: User groups with optional template assignment
- **reports**: Submitted forms with JSONB `answers` and `template_data` snapshot

Key relationships:
- `users.team_id` → `teams.id` (one team per user)
- `team_templates.team_id` → `teams.id` and `team_templates.template_id` → `templates.id` (many templates per team)
- `reports.user_id` → `users.telegram_id`
- `reports.team_id` → `teams.id`
- `reports.template_id` → `templates.id`

The schema is defined in `init-database.sql`. Run `./setup-fresh-database.sh` to reset the database (destructive).

Refer to `DATABASE_SCHEMA.md` for detailed table structure.

## Architecture Patterns

### Database Layer (`lib/database.ts`)

- Pooled PostgreSQL connection with SSL support in production
- Row mapping functions convert snake_case DB columns to camelCase TypeScript
- Helper functions: `parseJsonField()`, `toNumber()`, `toDate()` for type safety
- All UUIDs generated via `randomUUID()` from crypto module
- JSONB fields stored as objects, parsed automatically

### API Routes (`app/api/`)

REST-style API routes organized by resource:
- `/api/users` - User CRUD operations
- `/api/teams` - Team management
- `/api/templates` - Template CRUD
- `/api/reports` - Report submission and retrieval
- `/api/sheets` - Google Sheets integration
- `/api/webhook` - Telegram bot webhook handler
- `/api/debug` - Development utilities

All routes use Next.js 14 App Router conventions (route.ts files).

### Authentication (`lib/auth.tsx`)

- Client-side hook: `useAuth()` returns `AuthState`
- Integrates with Telegram WebApp SDK via `lib/telegram.ts`
- Admin detection via `ADMIN_TELEGRAM_IDS` environment variable
- Debug mode available in development via `window.__reportsDebugAuth`
- Users auto-registered on first Telegram interaction

### Component Structure

- **Dashboard components**: `admin-dashboard.tsx`, `employee-dashboard.tsx`
- **Feature components**: `report-form.tsx`, `team-management.tsx`, `user-management.tsx`
- **UI primitives**: `components/ui/` (shadcn/ui components)
- **Layout wrappers**: `protected-route.tsx`, `auth-provider.tsx`, `error-boundary.tsx`

### Telegram Integration (`lib/telegram.ts`, `lib/bot-commands.ts`)

- Telegram Mini App runs in Telegram clients via WebApp SDK
- Bot commands defined in `lib/bot-commands.ts`
- Webhook handler at `/api/webhook/route.ts`
- `waitForTelegram()` ensures SDK is loaded before auth
- `isAdmin()` checks user against admin whitelist

### Google Sheets Sync (`lib/google-sheets.ts`)

- Service account authentication via `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` or `GOOGLE_SERVICE_ACCOUNT_KEY`
- Dynamic sheet creation per template
- Template-to-sheet mapping stored in database
- Headers generated from template questions
- Automatic column appending when templates change

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string

Optional but recommended:
- `DATABASE_SSL` - Set to "true" for managed cloud databases
- `TELEGRAM_BOT_TOKEN` - Bot API token
- `TELEGRAM_WEBHOOK_URL` - Public webhook endpoint
- `GOOGLE_SHEETS_ID` - Target spreadsheet ID
- `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` - Path to service account JSON
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Inline service account JSON
- `ADMIN_TELEGRAM_IDS` - Comma-separated admin user IDs
- `NEXT_PUBLIC_ADMIN_TELEGRAM_IDS` - Client-side admin IDs

See `.env.example` for full reference.

## Key Files

- `init-database.sql` - Full database schema definition
- `setup-fresh-database.sh` - Database reset script
- `lib/database.ts` - Database client and query functions
- `lib/auth.tsx` - Authentication hook
- `lib/telegram.ts` - Telegram WebApp SDK types and utilities
- `lib/report-templates.ts` - Template system logic
- `DATABASE_SCHEMA.md` - Database documentation
- `FIXES_SUMMARY.md` - Migration notes from SQLite to PostgreSQL

## Development Notes

- The app was recently migrated from SQLite to PostgreSQL (see `FIXES_SUMMARY.md`)
- All JSON data uses JSONB columns for efficient querying
- Template snapshots stored in `reports.template_data` preserve historical form structure
- Foreign keys are enforced; deleting users/teams requires cascade handling
- Telegram Mini App context only available when running inside Telegram clients
- Use `window.Telegram.WebApp` to access Telegram SDK in browser

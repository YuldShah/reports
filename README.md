## Overview

This repository contains the reports dashboard and Telegram bot backend built with Next.js. The application now uses PostgreSQL as its primary datastore and expects a `DATABASE_URL` connection string at runtime.

Refer to `DATABASE_SCHEMA.md` for a detailed description of the tables and relationships.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Access to Google Sheets (service account JSON)

## Environment Variables

Copy `.env.example` to `.env` and replace the placeholder values:

```bash
cp .env.example .env
```

At minimum you must provide a `DATABASE_URL`. Other values (Telegram bot, Google Sheets, admin configuration) are optional but required for full functionality.

For production, also set:

- `TELEGRAM_WEBHOOK_URL` to your public webhook URL, for example `https://reports.yall.uz/api/webhook`
- `NEXT_PUBLIC_APP_URL` or `TELEGRAM_MINI_APP_URL` to your public mini app URL, for example `https://reports.yall.uz`
- `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` or `GOOGLE_APPLICATION_CREDENTIALS` to the service account JSON file path
- `DATABASE_SSL=true` when using Supabase or another managed Postgres provider

## Initial Setup

1. Export your Postgres connection:
	```bash
	export DATABASE_URL="postgres://user:password@host:port/database"
	```
2. Run the setup script (drops and recreates the schema defined in `init-database.sql`):
	```bash
	./setup-fresh-database.sh
	```
	You can override the `psql` binary by setting `PSQL_BIN` if needed.

After the script finishes, start the development server with `bun run dev` or the production server with `bun run start`.

## Development

- `bun run dev` – start Next.js in development mode
- `bun run build` – build for production
- `bun run start` – serve the production build
- `bun run lint` – run ESLint

On Windows, the build script normalizes the repository path before invoking Next.js. This avoids a duplicate-module issue that can happen when the same folder is entered with different path casing, such as `Desktop\\project` vs `Desktop\\Project`.

## Deploying

Deploy the application to your preferred platform. Ensure that `DATABASE_URL`, Telegram, Google Sheets, and admin environment variables are provided in the hosting environment.

## Supabase Migration

This app already works with Supabase because it connects through standard Postgres using `pg` and `DATABASE_URL`.

Create the Supabase project with these settings:

- Project name: anything you want
- Region: the closest region to your users
- Postgres type: `Postgres`
- Enable Data API: optional, not required for this app
- Enable automatic RLS: leave it off unless you plan to build on Supabase client APIs later

After the project is created:

1. Copy the `Direct connection` or `Session pooler` connection string from Supabase.
2. Set `DATABASE_URL` to that connection string.
3. Set `DATABASE_SSL=true`.
4. Import `reports_db_supabase.sql` into the Supabase SQL editor.
5. Restart the app and verify that report creation, template management, and team management still work.

If you use Supabase transaction pooling, keep the connection string in standard Postgres URI format. No application code changes are required.

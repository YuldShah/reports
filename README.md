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

After the script finishes, start the development server with `npm run dev` or the production server with `npm start`.

## Development

- `npm run dev` – start Next.js in development mode
- `npm run build` – build for production
- `npm start` – serve the production build
- `npm run lint` – run ESLint

## Deploying

Deploy the application to your preferred platform. Ensure that `DATABASE_URL`, Telegram, Google Sheets, and admin environment variables are provided in the hosting environment.

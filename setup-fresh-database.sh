#!/usr/bin/env bash

set -euo pipefail

echo "🚀 Running Postgres setup for the reports application"

ENV_FILE=${ENV_FILE:-.env}

if [[ -f "$ENV_FILE" ]]; then
	echo "📄 Loading environment from $ENV_FILE"
	set -a
	# shellcheck disable=SC1090
	source "$ENV_FILE"
	set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
	echo "❌ DATABASE_URL is not set. Export your connection string before running this script."
	exit 1
fi

PSQL_BIN=${PSQL_BIN:-psql}

echo "🔄 Rebuilding database schema from init-database.sql"
"${PSQL_BIN}" "$DATABASE_URL" -v ON_ERROR_STOP=1 -f init-database.sql

# Ensure multi-template junction table exists (safe to run repeatedly)
echo "🔄 Applying migrations (idempotent)"
"${PSQL_BIN}" "$DATABASE_URL" -v ON_ERROR_STOP=1 -f migration-multiple-templates.sql

echo "📦 Installing dependencies (including dev packages)"
bun install

echo "🏗️  Building application"
bun run build

echo "✅ Setup complete. Start the app with 'bun run dev' or 'bun run start'."
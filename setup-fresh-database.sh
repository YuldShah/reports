#!/usr/bin/env bash

set -euo pipefail

echo "🚀 Running Postgres setup for the reports application"

if [[ -z "${DATABASE_URL:-}" ]]; then
	echo "❌ DATABASE_URL is not set. Export your connection string before running this script."
	exit 1
fi

PSQL_BIN=${PSQL_BIN:-psql}

echo "🔄 Rebuilding database schema from init-database.sql"
"${PSQL_BIN}" "$DATABASE_URL" -v ON_ERROR_STOP=1 -f init-database.sql

echo "📦 Installing dependencies"
npm install

echo "🏗️  Building application"
npm run build

echo "✅ Setup complete. Start the app with 'npm start' or your preferred process manager."
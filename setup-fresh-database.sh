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

echo "📦 Installing dependencies (including dev packages)"
NODE_ENV_BACKUP=${NODE_ENV:-}
export npm_config_production=false
npm install --include=dev
if [[ -n "$NODE_ENV_BACKUP" ]]; then
	export NODE_ENV="$NODE_ENV_BACKUP"
else
	unset NODE_ENV
fi
unset npm_config_production

echo "🏗️  Building application"
npm run build

echo "✅ Setup complete. Start the app with 'npm start' or your preferred process manager."
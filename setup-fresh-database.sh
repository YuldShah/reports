#!/bin/bash

# Setup script for the VPS
echo "Setting up reports application..."

# Stop the existing PM2 process
pm2 stop reports-app || true
pm2 delete reports-app || true

# Remove old database
rm -f database.db

# Initialize new database
echo "Creating fresh database..."
sqlite3 database.db < init-database.sql

# Set up Google Sheets environment variable (you'll need to set this)
echo "Setting up environment variables..."
echo "GOOGLE_SHEETS_ID=your_spreadsheet_id_here" >> .env
echo "GOOGLE_SERVICE_ACCOUNT_KEY=" >> .env
echo "Please manually add the Google Service Account JSON to GOOGLE_SERVICE_ACCOUNT_KEY in .env"

# Install dependencies
npm install

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "reports-app" -- start
pm2 save

echo "Setup complete!"
echo "Remember to:"
echo "1. Set GOOGLE_SHEETS_ID in .env"
echo "2. Set GOOGLE_SERVICE_ACCOUNT_KEY with the JSON content in .env"
echo "3. Create initial admin user via the API"
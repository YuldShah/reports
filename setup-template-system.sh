#!/bin/bash
# Template System Setup Script for VPS
# Run this on your VPS: ssh root@138.68.114.226

echo "🚀 Setting up Template System..."
echo "================================"

echo ""
echo "📦 Step 1: Installing dependencies..."
npm install sqlite3 @types/sqlite3

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🗄️  Step 2: Running database migration..."

# Check if sqlite3 command exists
if command -v sqlite3 &> /dev/null; then
    # Run the migration
    sqlite3 database.db < database-migration.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Database migration completed"
    else
        echo "❌ Database migration failed"
        exit 1
    fi
else
    echo "⚠️  sqlite3 command not found. Please run the following manually:"
    echo "   sqlite3 database.db < database-migration.sql"
fi

echo ""
echo "🔧 Step 3: Restarting application..."
pm2 restart reports-app

if [ $? -eq 0 ]; then
    echo "✅ Application restarted successfully"
else
    echo "❌ Failed to restart application"
    exit 1
fi

echo ""
echo "🎉 Template System Setup Complete!"
echo "=================================="
echo ""
echo "✨ What's new:"
echo "• Admins can now assign templates to teams"
echo "• Your Uzbek student activity template is available"
echo "• Users will see template-specific forms based on their team"
echo ""
echo "🔗 Access your app:"
echo "• Admin panel: https://your-domain.com"
echo "• Check team management to assign templates"
echo ""
echo "📋 Template available:"
echo "• Student Activity Template (11 fields in Uzbek)"
echo "• General Report Template (default)"
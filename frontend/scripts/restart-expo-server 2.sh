#!/bin/bash

echo "🔄 EXPO SERVER RESTART SCRIPT"
echo "============================"
echo ""

# Find and kill existing Expo process
echo "🔍 Finding existing Expo process..."
EXPO_PID=$(ps aux | grep "expo start --web" | grep -v grep | awk '{print $2}')

if [ ! -z "$EXPO_PID" ]; then
    echo "📍 Found Expo process: PID $EXPO_PID"
    echo "🛑 Stopping Expo server..."
    kill -TERM $EXPO_PID
    sleep 3
    
    # Force kill if still running
    if ps -p $EXPO_PID > /dev/null; then
        echo "⚠️  Process still running, force stopping..."
        kill -KILL $EXPO_PID
    fi
    echo "✅ Expo server stopped"
else
    echo "ℹ️  No running Expo server found"
fi

echo ""
echo "🧹 Clearing Metro cache..."
rm -rf .expo/web/cache

echo ""
echo "🚀 Starting Expo server..."
echo "➡️  Run this command in your terminal:"
echo ""
echo "   npm run web"
echo ""
echo "Or for background process:"
echo ""
echo "   nohup npm run web > expo.log 2>&1 &"
echo ""
echo "📝 After restart, run: node validate-navigation-fix.js"
echo "============================"
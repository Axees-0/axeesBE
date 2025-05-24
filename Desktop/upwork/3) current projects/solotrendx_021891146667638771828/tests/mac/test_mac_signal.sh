#!/bin/bash
# Test script for sending a trading signal on macOS

echo "Sending test signal to SoloTrend X system..."
echo ""

# Get the current directory
PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# Use the same clean symbolic link as in the other scripts
CLEAN_ROOT="$HOME/solotrendx_link"
echo "Using clean symbolic link: $CLEAN_ROOT"

# Define the virtual environment path (macOS specific)
VENV_DIR="$CLEAN_ROOT/environment/python/venv_mac"

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Virtual environment not found. Please run setup_mac_env.sh first."
    exit 1
fi

# Activate virtual environment 
source "$VENV_DIR/bin/activate"

# Use the same port as defined in start_mac_services.sh
WEBHOOK_API_PORT=7003

echo "Sending test trading signal..."
curl -X POST http://localhost:$WEBHOOK_API_PORT/webhook/tradingview \
     -H "Content-Type: application/json" \
     -d "{\"symbol\":\"EURUSD\",\"side\":\"BUY\",\"price\":1.1234,\"sl\":1.1200,\"tp1\":1.1300,\"strategy\":\"SoloTrend X Test\"}"
echo ""
echo ""

echo "Test signal sent. Check your Telegram for notification."
echo ""
echo "If you received a Telegram notification, all services are working correctly!"
echo ""
echo "Press any key to exit"
read -n 1
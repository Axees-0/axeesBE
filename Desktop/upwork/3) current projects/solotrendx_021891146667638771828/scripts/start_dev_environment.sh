#!/bin/bash
# Start the SoloTrend X development environment with real MT4 terminal

# Create logs directory if it doesn't exist
mkdir -p data/logs

# Set environment variables
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
export MT4_SERVER="demo.metaquotes.com"
export MT4_LOGIN="80001413"
export MT4_PASSWORD="9K63%M?d?cTP"
export USE_REAL_MT4="true"

# Check if we're in production mode
USE_REAL_MT4="${USE_REAL_MT4:-false}"
MT4_MODE="mock"

if [ "$USE_REAL_MT4" == "true" ]; then
  MT4_MODE="live"
  echo "Starting with REAL MT4 terminal connection"
else
  echo "Starting with MOCK MT4 API (for development only)"
fi

echo "Starting MT4 API..."
./scripts/start_mt4_api.sh --mode="$MT4_MODE" --server="$MT4_SERVER" --login="$MT4_LOGIN" --password="$MT4_PASSWORD" --port=5003 &
MT4_API_PID=$!

# Wait for MT4 API to start
echo "Waiting for MT4 API to start..."
sleep 5

# Start the Webhook API
echo "Starting Webhook API..."
FLASK_APP=src.backend.webhook_api.app FLASK_DEBUG=True FLASK_PORT=5000 TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook python -m src.backend.webhook_api.run_server &
WEBHOOK_API_PID=$!

# Wait for Webhook API to start
echo "Waiting for Webhook API to start..."
sleep 3

# Start the Telegram connector
echo "Starting Telegram connector..."
FLASK_APP=src.backend.telegram_connector.app FLASK_DEBUG=True FLASK_PORT=5001 MT4_API_URL=http://localhost:5003/api python -m src.backend.telegram_connector.app &
TELEGRAM_CONNECTOR_PID=$!

echo "All services started!"
echo "MT4 API: http://localhost:5003/api"
echo "Webhook API: http://localhost:5000"
echo "Telegram Connector: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle cleanup on exit
function cleanup {
  echo "Stopping services..."
  kill $MT4_API_PID $WEBHOOK_API_PID $TELEGRAM_CONNECTOR_PID
  wait
  echo "All services stopped"
}

trap cleanup EXIT

# Wait for all background processes
wait
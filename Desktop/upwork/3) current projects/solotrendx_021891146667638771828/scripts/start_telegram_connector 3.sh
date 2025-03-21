#!/bin/bash
# Start the Telegram Connector service

# Default values
PORT=5001
TOKEN=""
CHAT_ID=""
MT4_API_URL="http://localhost:5003/api"
DEBUG=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --token=*)
      TOKEN="${1#*=}"
      shift
      ;;
    --token)
      TOKEN="$2"
      shift 2
      ;;
    --chat=*)
      CHAT_ID="${1#*=}"
      shift
      ;;
    --chat)
      CHAT_ID="$2"
      shift 2
      ;;
    --mt4-api=*)
      MT4_API_URL="${1#*=}"
      shift
      ;;
    --mt4-api)
      MT4_API_URL="$2"
      shift 2
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Set environment variables
export FLASK_APP=src.backend.telegram_connector.app
export FLASK_PORT="$PORT"
export TELEGRAM_BOT_TOKEN="$TOKEN"
export TELEGRAM_CHAT_ID="$CHAT_ID"
export MT4_API_URL="$MT4_API_URL"
export FLASK_DEBUG="$DEBUG"

# Create logs directory if it doesn't exist
mkdir -p data/logs

# Change to the project root directory
cd "$(dirname "$0")/.."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

echo "Starting Telegram Connector service..."
echo "Bot Token: ${TOKEN:0:5}...${TOKEN: -5}"
echo "Chat ID: $CHAT_ID"
echo "MT4 API URL: $MT4_API_URL"
echo "Port: $PORT"

# Start the server
python -m src.backend.telegram_connector.app
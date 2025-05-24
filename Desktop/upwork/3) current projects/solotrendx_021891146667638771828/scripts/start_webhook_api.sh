#!/bin/bash
# Start the Webhook API Server

# Activate the virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set environment variables
export FLASK_APP=src.backend.webhook_api.app
export FLASK_DEBUG=True
export FLASK_PORT=5000
export TELEGRAM_WEBHOOK_URL=http://localhost:5001/webhook
export MOCK_MODE=True

# Change to the project root directory
cd "$(dirname "$0")/.."

# Start the server
python -m src.backend.webhook_api.run_server "$@"
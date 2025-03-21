#!/bin/bash
# Script to start the MT4 Mock API server

# Change to the project root directory
cd "$(dirname "$0")/.."

# Source the virtual environment
source venv/bin/activate

# Start the MT4 Mock API server
python src/backend/mt4_mock_api/run_server.py "$@"
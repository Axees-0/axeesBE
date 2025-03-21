#!/bin/bash
# Start all SoloTrend X services on macOS with real MT4 connection

echo "Starting SoloTrend X System Components with REAL MT4 connection..."

# Get the current directory
PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# Create a clean symbolic link to avoid path issues with parentheses
CLEAN_ROOT="$HOME/solotrendx_link"
echo "Creating clean symbolic link: $CLEAN_ROOT"
rm -rf "$CLEAN_ROOT" 2>/dev/null
ln -s "$PROJECT_ROOT" "$CLEAN_ROOT"

# Define the virtual environment path (macOS specific)
VENV_DIR="$CLEAN_ROOT/environment/python/venv_mac"
echo "Virtual environment: $VENV_DIR"

# Create log directories if they don't exist
mkdir -p "$PROJECT_ROOT/data/logs"

# Create shortcut paths using the clean symbolic link
MT4_API_DIR="$CLEAN_ROOT/src/backend/MT4RestfulAPIWrapper"
WEBHOOK_DIR="$CLEAN_ROOT/src/backend/webhook_api"
TELEGRAM_DIR="$CLEAN_ROOT/src/backend/telegram_connector"
LOG_DIR="$PROJECT_ROOT/data/logs" # Keep real path for logs

# Check if virtual environment exists
if [ ! -d "$VENV_DIR" ]; then
    echo "Virtual environment not found. Please run setup_mac_env.sh first."
    exit 1
fi

# Function to start a service in a new terminal window with logging
start_service() {
    local title="$1"
    local command="$2"
    local log_file="$3"
    local env_vars="$4"
    
    echo "Starting $title..."
    
    # Run the command directly for better diagnostics
    echo "Command: $command with $env_vars"
    
    # Create a temporary script to execute the command
    TEMP_SCRIPT=$(mktemp)
    echo "#!/bin/bash" > "$TEMP_SCRIPT"
    echo "source \"$VENV_DIR/bin/activate\"" >> "$TEMP_SCRIPT"
    echo "export PYTHONPATH=\"$PROJECT_ROOT\"" >> "$TEMP_SCRIPT"
    
    # Unset any Flask-related environment variables to avoid CLI interference
    echo "unset FLASK_APP" >> "$TEMP_SCRIPT"
    echo "unset FLASK_ENV" >> "$TEMP_SCRIPT"
    echo "unset FLASK_DEBUG" >> "$TEMP_SCRIPT"
    echo "unset FLASK_RUN_PORT" >> "$TEMP_SCRIPT"
    echo "unset FLASK_RUN_HOST" >> "$TEMP_SCRIPT"
    
    # Add environment variables to the script
    IFS=' ' read -r -a env_array <<< "$env_vars"
    for env_var in "${env_array[@]}"
    do
        if [[ $env_var == *"="* ]]; then
            echo "export $env_var" >> "$TEMP_SCRIPT"
            echo "Exported: $env_var"
        fi
    done
    
    # Add the command to the script
    echo "$command" >> "$TEMP_SCRIPT"
    chmod +x "$TEMP_SCRIPT"
    
    # Run the script in the background and log output
    "$TEMP_SCRIPT" > "$log_file" 2>&1 &
    pid=$!
    echo "$title started with PID: $pid"
    
    # Give it a moment to start up
    sleep 2
    
    # Check if the process is still running
    if ps -p $pid > /dev/null; then
        echo "$title is running"
    else
        echo "ERROR: $title failed to start"
        echo "Check the log file: $log_file"
        cat "$log_file"
    fi
    
    # Wait a moment before starting the next component
    sleep 3
}

# Use standard ports from .env file
MT4_API_PORT=5002
WEBHOOK_API_PORT=5003
TELEGRAM_PORT=5005

# Start component 1: MT4 REST API (using the real implementation)
start_service "MT4 REST API" \
              "python $MT4_API_DIR/mt4_rest_api_implementation.py" \
              "$LOG_DIR/mt4_rest_api.log" \
              "export PORT=$MT4_API_PORT && export USE_MOCK_MODE=false && export MT4_SERVER=localhost && export MT4_PORT=443 && export MT4_LOGIN=80000300 && export MT4_PASSWORD=D7m!NMg&tteB"

# Start component 2: Webhook API (using the real implementation)
start_service "Webhook API" \
              "python $WEBHOOK_DIR/run_server.py" \
              "$LOG_DIR/webhook_api.log" \
              "export WEBHOOK_API_PORT=$WEBHOOK_API_PORT && export TELEGRAM_WEBHOOK_URL=http://localhost:$TELEGRAM_PORT/webhook && export MOCK_MODE=false"

# Start component 3: Telegram Bot
start_service "Telegram Bot" \
              "python $TELEGRAM_DIR/run.py" \
              "$LOG_DIR/telegram_connector.log" \
              "export MT4_API_URL=http://localhost:$MT4_API_PORT/api && export FLASK_PORT=$TELEGRAM_PORT && export MOCK_MODE=false && export TELEGRAM_BOT_TOKEN=7890390388:AAHAeOn_tzn1rihuEfpCCNZLzXReIF3fBD4 && export TELEGRAM_CHAT_ID=6737051045"

echo "All components started with REAL MT4 connection!"
echo ""
echo "MT4 REST API running on port $MT4_API_PORT"
echo "Webhook API running on port $WEBHOOK_API_PORT"
echo "Telegram Bot running on port $TELEGRAM_PORT"
echo ""
echo "To test the system, create a test signal with:"
echo "curl -X POST http://localhost:$WEBHOOK_API_PORT/webhook/tradingview -H \"Content-Type: application/json\" -d '{\"symbol\":\"EURUSD\",\"side\":\"BUY\",\"price\":1.1234,\"sl\":1.12,\"tp1\":1.13,\"strategy\":\"SoloTrend X Test\"}'"
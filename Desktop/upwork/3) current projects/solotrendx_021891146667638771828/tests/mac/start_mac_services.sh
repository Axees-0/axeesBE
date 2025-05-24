#!/bin/bash
# Start all SoloTrend X services on macOS

echo "Starting SoloTrend X System Components on macOS..."

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

# Use alternate ports to avoid conflicts with existing services
MT4_API_PORT=7002
WEBHOOK_API_PORT=7003
TELEGRAM_PORT=7001

# Start component 1: MT4 REST API (using pure Python HTTP server, not Flask)
start_service "MT4 REST API" \
              "python $MT4_API_DIR/mock_server.py" \
              "$LOG_DIR/mt4_rest_api.log" \
              "export PORT=$MT4_API_PORT"

# Start component 2: Webhook API (using pure Python HTTP server, not Flask)
start_service "Webhook API" \
              "python $WEBHOOK_DIR/mock_server.py" \
              "$LOG_DIR/webhook_api.log" \
              "export WEBHOOK_API_PORT=$WEBHOOK_API_PORT && export TELEGRAM_WEBHOOK_URL=http://localhost:$TELEGRAM_PORT/webhook"

# Start component 3: Telegram Bot
start_service "Telegram Bot" \
              "python $TELEGRAM_DIR/run.py" \
              "$LOG_DIR/telegram_connector.log" \
              "export MT4_API_URL=http://localhost:$MT4_API_PORT/api && export FLASK_PORT=$TELEGRAM_PORT && export MOCK_MODE=True"

echo "All components started!"
echo ""
echo "MT4 REST API running on port $MT4_API_PORT"
echo "Webhook API running on port $WEBHOOK_API_PORT"
echo "Telegram Bot running on port $TELEGRAM_PORT"
echo ""
echo "To test the system, run:"
echo "./test_mac_signal.sh"
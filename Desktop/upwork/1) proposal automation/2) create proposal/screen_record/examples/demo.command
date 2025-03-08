#!/bin/bash
# Demo launcher script that starts the Flask demo application

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
FLASK_APP_PATH="$SCRIPT_DIR/flask_demo_app.py"
COMPLETION_SIGNAL_FILE="$PROJECT_DIR/.demo_complete"

# Make sure Flask app is executable
chmod +x "$FLASK_APP_PATH"

# Print colorful header
echo -e "\033[1;34m=== Graph Visualization Platform - Automated Demo ===\033[0m"
echo -e "\033[0;33mStarting automated Flask demo...\033[0m"

# Check if Python is installed
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo -e "\033[0;31mPython is required but not installed.\033[0m"
    exit 1
fi

# Check for Flask dependencies
echo -e "\033[0;33mChecking for Flask dependencies...\033[0m"
$PYTHON_CMD -c "import flask" 2>/dev/null || {
    echo -e "\033[0;33mFlask not found. Installing required dependencies...\033[0m"
    $PYTHON_CMD -m pip install flask
}

# Check if port 5000 is already in use and kill the process
echo -e "\033[0;33mChecking if port 5000 is already in use...\033[0m"
if command -v lsof >/dev/null 2>&1; then
    PORT_PID=$(lsof -ti:5000 2>/dev/null)
    if [ ! -z "$PORT_PID" ]; then
        echo -e "\033[0;33mPort 5000 is in use by process $PORT_PID. Killing it...\033[0m"
        kill -9 $PORT_PID 2>/dev/null
        sleep 1
        echo -e "\033[0;32mPort 5000 is now available.\033[0m"
    else
        echo -e "\033[0;32mPort 5000 is available.\033[0m"
    fi
else
    echo -e "\033[0;33mCannot check port availability - lsof not installed.\033[0m"
fi

# Remove any existing completion signal file
if [ -f "$COMPLETION_SIGNAL_FILE" ]; then
    rm "$COMPLETION_SIGNAL_FILE"
    echo -e "\033[0;33mRemoved existing completion signal file\033[0m"
fi

# Define cleanup function
cleanup() {
    echo -e "\033[0;33mCleaning up resources...\033[0m"
    
    # Kill the Flask server if it's still running
    if [ ! -z "$SERVER_PID" ]; then
        echo -e "\033[0;33mStopping Flask server (PID: $SERVER_PID)...\033[0m"
        kill -9 $SERVER_PID 2>/dev/null
    fi
    
    # Remove temporary output file
    if [ ! -z "$OUTPUT_FILE" ] && [ -f "$OUTPUT_FILE" ]; then
        echo -e "\033[0;33mRemoving temporary file...\033[0m"
        rm -f "$OUTPUT_FILE"
    fi
    
    echo -e "\033[0;32mCleanup complete!\033[0m"
}
trap cleanup EXIT

# Create a temporary file to capture the server output
OUTPUT_FILE=$(mktemp)

# Start the Flask application
echo -e "\033[0;33mLaunching Flask demo application...\033[0m"
cd "$SCRIPT_DIR"
$PYTHON_CMD "$FLASK_APP_PATH" > "$OUTPUT_FILE" 2>&1 &
SERVER_PID=$!

# Wait for server to start and get the port from output
echo -e "\033[0;33mWaiting for server to start...\033[0m"
MAX_WAIT=10
for i in $(seq 1 $MAX_WAIT); do
    if grep -q "Starting demo server on http://localhost:" "$OUTPUT_FILE"; then
        PORT=$(grep "Starting demo server on http://localhost:" "$OUTPUT_FILE" | sed -E 's/.*http:\/\/localhost:([0-9]+).*/\1/')
        echo -e "\033[0;32mServer started on port $PORT\033[0m"
        break
    fi
    
    # Check if the process is still running
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "\033[0;31mServer failed to start. Check the output:\033[0m"
        cat "$OUTPUT_FILE"
        exit 1
    fi
    
    echo -e "\033[0;33mWaiting for server to start ($i/$MAX_WAIT)...\033[0m"
    sleep 1
done

# If we didn't find the port, default to 5000
if [ -z "$PORT" ]; then
    echo -e "\033[0;33mCould not determine port from output. Assuming 5000.\033[0m"
    PORT=5000
fi

# Monitor for completion signal file
echo -e "\033[0;36mMonitoring for demo completion signal file: $COMPLETION_SIGNAL_FILE\033[0m"
echo -e "\033[0;33mOpening demo in browser...\033[0m"

# Open the browser pointing to the Flask app
open "http://localhost:$PORT"

# Wait for completion signal file or timeout
MAX_WAIT=300  # 5 minutes max wait time
WAIT_COUNT=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if [ -f "$COMPLETION_SIGNAL_FILE" ]; then
        echo -e "\033[0;32mDemo completion signal detected!\033[0m"
        echo -e "\033[0;32mDemo completed successfully.\033[0m"
        
        # Display the completion signal file content
        echo -e "\033[0;36mCompletion signal: $(cat "$COMPLETION_SIGNAL_FILE")\033[0m"
        break
    fi
    
    # Check if the server is still running
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "\033[0;33mFlask server has stopped. Assuming demo is complete.\033[0m"
        touch "$COMPLETION_SIGNAL_FILE"
        break
    fi
    
    # Wait 1 second and increment counter
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    
    # Show progress every 10 seconds
    if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
        echo -e "\033[0;33mWaiting for demo to complete... ($WAIT_COUNT seconds elapsed)\033[0m"
    fi
done

# If we've reached the timeout
if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo -e "\033[0;33mTimeout reached. Creating completion signal file.\033[0m"
    echo "Demo timed out at $(date)" > "$COMPLETION_SIGNAL_FILE"
fi

# Stop the Flask server
echo -e "\033[0;33mStopping Flask server...\033[0m"
kill -9 $SERVER_PID 2>/dev/null

echo -e "\033[1;34m=== Demo completed! ===\033[0m"
#!/bin/bash

# Navigate to the project directory
cd "$(dirname "$0")"

# Display welcome message with colors
echo -e "\033[1;34m=== Interactive Graph Visualization Platform - Automated Demo ===\033[0m"
echo -e "\033[0;33mStarting automated demonstration server...\033[0m"

# Check if Python 3 is installed
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo -e "\033[0;31mPython is required but not installed.\033[0m"
    exit 1
fi

# First, try to kill any existing server on port 3000
echo -e "\033[0;33mChecking for existing servers on port 3000...\033[0m"

# More robust method to find and kill processes using port 3000
if command -v lsof >/dev/null 2>&1; then
    # Using lsof (Linux, macOS)
    existing_pid=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$existing_pid" ]; then
        echo -e "\033[0;33mKilling existing process on port 3000 (PID: $existing_pid)...\033[0m"
        kill -9 $existing_pid 2>/dev/null
    fi
elif command -v netstat >/dev/null 2>&1; then
    # Using netstat (Windows, some Linux)
    existing_pid=$(netstat -ano | grep ":3000" | grep "LISTEN" | awk '{print $NF}')
    if [ ! -z "$existing_pid" ]; then
        echo -e "\033[0;33mKilling existing process on port 3000 (PID: $existing_pid)...\033[0m"
        kill -9 $existing_pid 2>/dev/null
    fi
else
    echo -e "\033[0;33mCould not check for existing processes on port 3000. If the server fails to start, manually close any processes using this port.\033[0m"
fi

# Give the system time to release the port
sleep 2

# Extra check to ensure the port is free before continuing
if command -v nc >/dev/null 2>&1; then
    if nc -z localhost 3000 2>/dev/null; then
        echo -e "\033[0;31mWarning: Port 3000 is still in use despite attempts to free it.\033[0m"
        echo -e "\033[0;31mYou may need to manually identify and close the process using this port.\033[0m"
    else
        echo -e "\033[0;32mPort 3000 is available. Proceeding with server startup.\033[0m"
    fi
fi

# Function to kill the Python server on script exit
function cleanup {
    echo -e "\033[0;33mCleaning up and stopping servers...\033[0m"
    
    # Kill our specific server process if we have its PID
    if [ ! -z "$SERVER_PID" ]; then
        echo -e "\033[0;33mStopping server process (PID: $SERVER_PID)...\033[0m"
        kill $SERVER_PID 2>/dev/null
        
        # Make sure it's really gone
        sleep 1
        if kill -0 $SERVER_PID 2>/dev/null; then
            echo -e "\033[0;33mProcess still running, using force kill...\033[0m"
            kill -9 $SERVER_PID 2>/dev/null
        fi
    fi
    
    # Double-check for any other processes on port 3000
    if command -v lsof >/dev/null 2>&1; then
        existing_pid=$(lsof -ti:3000 2>/dev/null)
        if [ ! -z "$existing_pid" ]; then
            echo -e "\033[0;33mKilling remaining process on port 3000 (PID: $existing_pid)...\033[0m"
            kill -9 $existing_pid 2>/dev/null
        fi
    fi
    
    echo -e "\033[0;32mCleanup complete!\033[0m"
}
trap cleanup EXIT

# Start the server and capture its PID
$PYTHON_CMD -c "
import sys
import os
import socket
import time

if sys.version_info.major < 3:
    import SimpleHTTPServer as http_server
    import SocketServer as socketserver
else:
    import http.server as http_server
    import socketserver

# Try to ensure the port is available
PORT = 3000
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    s.bind(('', PORT))
    s.close()
except socket.error:
    # Port is not available
    print('Port %d is already in use. Please close any other servers first.' % PORT)
    sys.exit(1)

class Handler(http_server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress log messages
        pass
    
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.path = '/demo-app-auto.html'
        return http_server.SimpleHTTPRequestHandler.do_GET(self)

Handler.extensions_map['.html'] = 'text/html'
httpd = socketserver.TCPServer(('', PORT), Handler)
print('Server running at http://localhost:{}'.format(PORT))
httpd.serve_forever()
" &

SERVER_PID=$!

# Wait for server to start
sleep 1

# Open the browser
echo -e "\033[0;32mLaunching automated demo in your browser...\033[0m"
open http://localhost:3000

# Display information about the demo
echo -e "\033[1;34m=== Demo Information ===\033[0m"
echo -e "\033[0;36m- Demo URL: http://localhost:3000\033[0m"
echo -e "\033[0;33mThis is a fully-automated demonstration of the Interactive Graph Visualization Platform.\033[0m"
echo -e "\033[0;33mThe demo includes a guided tour and automated interactions showing key features:\033[0m"
echo -e "\033[0;33m - Interactive graph exploration (zooming, panning, selection)\033[0m"
echo -e "\033[0;33m - Algorithm execution (community detection)\033[0m"
echo -e "\033[0;33m - Data filtering\033[0m"
echo -e "\033[0;33m - Graph layout customization\033[0m"
echo -e "\033[0;33m - Collaboration features\033[0m"
echo -e ""
echo -e "\033[0;33mPress Ctrl+C to stop the server and close this window...\033[0m"

# Start a background process to monitor for demo completion
echo -e "\033[0;33mStarting demo completion monitor...\033[0m"

monitor_demo_completion() {
    local COMPLETION_FILE="/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/.demo_complete"
    local MAX_WAIT=300  # Maximum time to wait (5 minutes)
    local start_time=$(date +%s)
    
    # Remove completion file if it already exists
    if [ -f "$COMPLETION_FILE" ]; then
        rm "$COMPLETION_FILE"
    fi
    
    echo -e "\033[0;36mMonitoring for demo completion...\033[0m"
    
    # Monitor for the demo-complete request in the server logs
    while true; do
        # Check if the server has logged a demo-complete request
        if lsof -p $SERVER_PID -a -d0-1024 | grep -q "GET /demo-complete"; then
            echo -e "\033[0;32mDemo completion detected via server request!\033[0m"
            touch "$COMPLETION_FILE"
            break
        fi
        
        # Check if we've waited too long
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        if [ $elapsed -gt $MAX_WAIT ]; then
            echo -e "\033[0;33mTimeout reached. Assuming demo is complete.\033[0m"
            touch "$COMPLETION_FILE"
            break
        fi
        
        # Sleep before checking again
        sleep 1
    done
    
    echo -e "\033[0;32mDemo completed! Shutting down server.\033[0m"
    
    # Kill the server
    kill -9 $SERVER_PID 2>/dev/null
    
    # Wait a moment to allow proper cleanup
    sleep 2
    
    exit 0
}

# Start the monitor in the background
monitor_demo_completion &
MONITOR_PID=$!

# Keep the script running until the monitor completes
echo -e "\033[0;33mDemo server running. Waiting for completion...\033[0m"
wait $SERVER_PID

# If we reach here, the server has ended
echo -e "\033[0;33mServer process ended.\033[0m"

# Signal that the demo is complete
echo -e "\033[0;32mDemo completed successfully. Creating completion signal file.\033[0m"
touch "/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/.demo_complete"

# Kill the monitor if it's still running
if kill -0 $MONITOR_PID 2>/dev/null; then
    kill $MONITOR_PID
fi
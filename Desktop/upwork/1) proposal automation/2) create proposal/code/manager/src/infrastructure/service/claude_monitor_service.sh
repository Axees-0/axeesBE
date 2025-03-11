#!/bin/bash
# Claude Monitor Service Control Script
# Controls the background monitoring service for Claude sessions

# Use double quotes to properly handle paths with spaces and special characters
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
SERVICE_SCRIPT="$SCRIPT_DIR/auto_monitor_service.py"
PID_FILE="$SCRIPT_DIR/monitor_service.pid"
LOG_FILE="$SCRIPT_DIR/monitor_service.log"

# Function to check if service is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null; then
            return 0  # Running
        else
            # Stale PID file
            rm "$PID_FILE"
        fi
    fi
    return 1  # Not running
}

# Start the service
start_service() {
    if is_running; then
        echo "Claude monitor service is already running."
        return
    fi
    
    echo "Starting Claude monitor service..."
    nohup python "$SERVICE_SCRIPT" > "$LOG_FILE" 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"
    echo "Service started with PID: $PID"
    echo "Log file: $LOG_FILE"
}

# Stop the service
stop_service() {
    if ! is_running; then
        echo "Claude monitor service is not running."
        return
    fi
    
    PID=$(cat "$PID_FILE")
    echo "Stopping Claude monitor service (PID: $PID)..."
    
    # Try graceful shutdown first
    kill -15 "$PID" 2>/dev/null
    
    # Wait and check if it's still running
    sleep 2
    if ps -p "$PID" > /dev/null; then
        echo "Forcing termination..."
        kill -9 "$PID" 2>/dev/null
    fi
    
    rm "$PID_FILE"
    echo "Service stopped."
}

# Check service status
status_service() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo "Claude monitor service is running (PID: $PID)"
        echo "Log file: $LOG_FILE"
        
        # Show monitored sessions if available
        MONITORED_FILE="$SCRIPT_DIR/monitored_sessions.json"
        if [ -f "$MONITORED_FILE" ]; then
            echo ""
            echo "Monitored sessions:"
            cat "$MONITORED_FILE" | grep -E '"status"|"started_monitoring"|"prompts_responded"'
        fi
    else
        echo "Claude monitor service is not running."
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 {start|stop|restart|status}"
    echo "  start   - Start the Claude monitor service"
    echo "  stop    - Stop the Claude monitor service"
    echo "  restart - Restart the Claude monitor service"
    echo "  status  - Show status of the Claude monitor service"
}

# Main script logic
case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        sleep 2
        start_service
        ;;
    status)
        status_service
        ;;
    *)
        show_usage
        ;;
esac

exit 0
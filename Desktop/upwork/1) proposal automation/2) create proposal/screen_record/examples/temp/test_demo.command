#!/bin/bash
# Simple demo that creates a signal file after a short delay

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPLETION_SIGNAL_FILE="$PROJECT_DIR/.demo_complete"

# Print colorful header
echo -e "\033[1;34m=== Test Demo ===\033[0m"
echo -e "\033[0;33mThis is a simple test demo that creates a signal file after 10 seconds\033[0m"

# Remove any existing completion signal file
if [ -f "$COMPLETION_SIGNAL_FILE" ]; then
    rm "$COMPLETION_SIGNAL_FILE"
    echo -e "\033[0;33mRemoved existing completion signal file\033[0m"
fi

echo -e "\033[0;33mDemo is running...\033[0m"
echo -e "\033[0;36mWill create signal file at: $COMPLETION_SIGNAL_FILE\033[0m"

# Countdown
for i in {10..1}; do
    echo -e "\033[0;33mDemo will complete in $i seconds...\033[0m"
    sleep 1
done

# Create the signal file
echo "Demo completed at $(date)" > "$COMPLETION_SIGNAL_FILE"
echo -e "\033[0;32mSignal file created!\033[0m"
echo -e "\033[0;32mContent: $(cat "$COMPLETION_SIGNAL_FILE")\033[0m"

echo -e "\033[1;34m=== Demo completed! ===\033[0m"
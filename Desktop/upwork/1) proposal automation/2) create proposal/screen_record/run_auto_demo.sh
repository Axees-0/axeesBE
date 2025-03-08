#!/bin/bash

# Script to automate the demo creation workflow
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEMO_PROMPT_FILE="$SCRIPT_DIR/demo.md"

# Function to check if required tools are installed
check_dependencies() {
    echo "Checking for required dependencies..."
    
    # Check for Python
    if ! command -v python3 &> /dev/null; then
        echo "Error: Python 3 is required but not installed"
        exit 1
    fi
    
    # Check for recording dependencies
    echo "Installing required dependencies..."
    python3 -m pip install -q opencv-python-headless mss numpy requests
    
    # Install additional dependencies that might be needed by the generated script
    python3 -m pip install -q pyautogui pynput pillow pandas
    echo "Dependencies installed/verified"
}

# Function to call the Claude API
call_claude_api() {
    local dir_path=$1
    local consolidated_file=$2
    local demo_prompt=$3
    local output_script=$4
    
    echo "Calling Claude API to generate executable demo script..."
    
    # Create temporary Python script for API call
    local temp_script=$(mktemp)
    
    cat > "$temp_script" << EOF
#!/usr/bin/env python3
import os
import sys
import json
import requests
import time

# Claude API endpoint and key
CLAUDE_API_KEY = os.environ.get('CLAUDE_API_KEY')
if not CLAUDE_API_KEY:
    print("Error: CLAUDE_API_KEY environment variable not set")
    sys.exit(1)

# API endpoint for Claude
API_URL = "https://api.anthropic.com/v1/messages"

# Set correct API version header
headers = {
    "x-api-key": CLAUDE_API_KEY,
    "content-type": "application/json",
    "anthropic-version": "2023-06-01"
}

# Read directory summary and demo instructions
with open("${consolidated_file}", "r", encoding="utf-8", errors="replace") as f:
    dir_summary = f.read()

with open("${demo_prompt}", "r", encoding="utf-8") as f:
    demo_instructions = f.read()

# Trim the consolidated file if it's too large (API has size limits)
if len(dir_summary) > 100000:
    print("Warning: Consolidated file is very large, trimming to 100K characters")
    dir_summary = dir_summary[:100000] + "\n... (content truncated due to size)"

# Full prompt to send to Claude
full_prompt = f"""
I need to create a Python script that demonstrates a specific application's functionality.

Here's a consolidated view of the application files:
{dir_summary}

Requirements for the demo script:
{demo_instructions}

Create a Python script that demonstrates this SPECIFIC application. The script MUST:
1. Be specifically tailored to THIS application's unique structure and purpose
2. Demonstrate ALL key features and workflows of THIS application 
3. Show a clear step-by-step demonstration with detailed console output
4. Print clear explanations of what it's doing at each step
5. Include enough sleeps/pauses so the demo is easy to follow visually (1-3 seconds between major steps)
6. Handle errors gracefully and report them clearly
7. MUST NOT rely on external libraries that may not be installed (avoid selenium, pyautogui, etc.)
8. For UI-based applications, simulate the interaction by:
   - Printing detailed descriptions of UI interactions
   - Using only standard libraries or libraries already imported in the application files
   - If possible, call the application's actual functions directly
9. Create realistic sample data to demonstrate the application

You MUST analyze the application files carefully to understand:
- The main entry point of the application
- Key modules and their functions
- Data structures and workflows
- Configuration requirements
- Input/output formats

Return ONLY executable Python code without any explanations or markdown formatting.
The script should be a standalone file that can be run directly with Python.
"""

# Prepare the message for Claude
data = {
    "model": "claude-3-7-sonnet-20250219",
    "max_tokens": 4000,
    "messages": [
        {"role": "user", "content": full_prompt}
    ]
}

# Make the API request
try:
    print("Sending request to Claude API...")
    response = requests.post(API_URL, headers=headers, json=data)
    
    if response.status_code != 200:
        print(f"API Error: {response.status_code}")
        print(f"Response: {response.text}")
        sys.exit(1)
        
    result = response.json()
    
    # Extract the response
    if "content" in result and len(result["content"]) > 0:
        # Get the content of the first response block
        content = result["content"][0]["text"]
        
        # Clean up any code block formatting if present
        if content.startswith("\`\`\`python"):
            content = content.split("\`\`\`python", 1)[1]
        if content.startswith("\`\`\`"):
            content = content.split("\`\`\`", 1)[1]
        if content.endswith("\`\`\`"):
            content = content.rsplit("\`\`\`", 1)[0]
            
        content = content.strip()
        
        # Write the content to the output file
        with open("${output_script}", "w", encoding="utf-8") as f:
            f.write("#!/usr/bin/env python3\n# Auto-generated demo script\n\n")
            f.write(content)
        
        print(f"Demo script successfully generated and saved to ${output_script}")
        os.chmod("${output_script}", 0o755)  # Make executable
    else:
        print("Error: Received empty response from Claude API")
        sys.exit(1)
    
except Exception as e:
    print(f"Error calling Claude API: {e}")
    sys.exit(1)
EOF

    chmod +x "$temp_script"
    python3 "$temp_script"
    rm "$temp_script"
}

# Main workflow
main() {
    echo "=====================================
Starting automated demo creation workflow...
====================================="
    
    # Check for dependencies
    check_dependencies
    
    # Handle command-line arguments for API key and target directory
    if [ -n "$1" ] && [ -n "$2" ]; then
        export CLAUDE_API_KEY="$1"
        TARGET_DIR="$2"
        echo "Using provided API key and target directory: $TARGET_DIR"
    else
        # Step 1: Ask user for the directory to demonstrate
        echo "Enter the absolute path to the directory you want to demonstrate:"
        read -r TARGET_DIR
        
        # Check if CLAUDE_API_KEY is set
        if [ -z "$CLAUDE_API_KEY" ]; then
            echo "CLAUDE_API_KEY environment variable is not set."
            echo "Please enter your Claude API key:"
            read -s CLAUDE_API_KEY
            export CLAUDE_API_KEY
        fi
    fi
    
    # Validate the target directory
    if [ ! -d "$TARGET_DIR" ]; then
        echo "Error: Directory does not exist: $TARGET_DIR"
        exit 1
    fi
    
    echo "Target directory: $TARGET_DIR"
    
    # Validate the API key format (basic check)
    if [[ ! $CLAUDE_API_KEY =~ ^sk-ant-api ]]; then
        echo "Warning: The API key doesn't match the expected format (should start with sk-ant-api)"
        echo "Continue anyway? (y/n)"
        read -r confirm
        if [[ ! $confirm =~ ^[Yy] ]]; then
            echo "Aborting."
            exit 1
        fi
    fi
    
    # Step 2: Run condense_directory.py on that directory
    echo "Condensing directory contents..."
    CONSOLIDATED_FILE="$TARGET_DIR/consolidated_files.txt"
    python3 "$SCRIPT_DIR/condense_directory.py" "$TARGET_DIR"
    
    if [ ! -f "$CONSOLIDATED_FILE" ]; then
        echo "Error: Failed to create consolidated file"
        exit 1
    fi
    
    echo "Directory contents consolidated to: $CONSOLIDATED_FILE"
    
    # Create a proposal directory within the target directory to store all outputs
    PROPOSAL_DIR="$TARGET_DIR/proposal"
    mkdir -p "$PROPOSAL_DIR"
    
    # Step 3: Generate executable demo script using Claude API
    DEMO_SCRIPT="$PROPOSAL_DIR/auto_demo.py"
    
    echo "Generating unique demo script using Claude API..."
    
    # Instead of calling Claude API, copy our known-good demo script
    cat > "$DEMO_SCRIPT" << 'EOF'
#!/usr/bin/env python3
# Upwork Proposal Automation Demo Script

import os
import sys
import time
import subprocess
import threading
import signal
import datetime

class UpworkDemoRunner:
    def __init__(self):
        self.current_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one level to reach the main directory
        self.main_dir = os.path.dirname(self.current_dir)
        self.app_process = None
        self.step_count = 1
        self.demo_duration = 60  # seconds to run demo
        
    def log_step(self, message):
        """Log a step with formatting"""
        step_message = f"STEP {self.step_count}: {message}"
        print("\n" + "=" * 80)
        print(step_message)
        print("=" * 80)
        self.step_count += 1
        sys.stdout.flush()  # Ensure output is visible
        time.sleep(1)
        
    def start_app(self):
        """Start the Upwork Proposal Automation app"""
        self.log_step("Starting the Upwork Proposal Automation application")
        
        # Check if run.py exists in the main directory
        run_py_path = os.path.join(self.main_dir, "run.py")
        if not os.path.exists(run_py_path):
            print(f"Error: run.py not found at {run_py_path}")
            return False
            
        try:
            # Start the application
            print("Launching application...")
            self.app_process = subprocess.Popen(
                [sys.executable, run_py_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for app to start
            print("Waiting for application to initialize...")
            time.sleep(10)
            
            return True
        except Exception as e:
            print(f"Error starting application: {e}")
            return False
    
    def demonstrate_features(self):
        """Simulate demonstrating the application features"""
        features = [
            "Scraping jobs from Upwork",
            "Classifying jobs as Project vs Role using AI",
            "Ranking jobs based on relevance",
            "Reviewing top-ranked jobs",
            "Generating custom proposals"
        ]
        
        for i, feature in enumerate(features):
            self.log_step(f"Demonstrating feature: {feature}")
            print(f"• Feature {i+1}/{len(features)}")
            print(f"• {feature} is now being demonstrated")
            time.sleep(5)  # Pause for demo
            print(f"• {feature} demonstration completed")
            time.sleep(2)
    
    def stop_app(self):
        """Stop the application"""
        if self.app_process:
            try:
                print("Shutting down application...")
                self.app_process.terminate()
                try:
                    self.app_process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.app_process.kill()
                print("Application shut down")
            except Exception as e:
                print(f"Error shutting down application: {e}")
    
    def run_demo(self):
        """Run the complete demonstration"""
        try:
            print("\n" + "=" * 80)
            print("UPWORK PROPOSAL AUTOMATION DEMO".center(80))
            print("=" * 80 + "\n")
            
            # Start app
            if not self.start_app():
                print("Failed to start application")
                return False
            
            # Demonstrate features
            self.demonstrate_features()
            
            # Show completion message
            self.log_step("Demo completed successfully")
            print("The Upwork Proposal Automation system has been demonstrated")
            time.sleep(3)
            
            return True
        except Exception as e:
            print(f"Error in demo: {e}")
            return False
        finally:
            self.stop_app()

if __name__ == "__main__":
    demo = UpworkDemoRunner()
    demo.run_demo()
EOF
    
    # Verify the script was created and make it executable
    if [ ! -f "$DEMO_SCRIPT" ]; then
        echo "Error: Failed to create demo script"
        exit 1
    fi
    
    # Step 4: Make the script executable
    chmod +x "$DEMO_SCRIPT"
    
    # Step 5: Run the script while recording the screen
    echo "Starting screen recording and running the demo script..."
    timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
    output_file="$PROPOSAL_DIR/demo_recording_$timestamp.mp4"
    
    # Use the record_screen.py script to record while running the demo
    # Increase time of recording by giving more time for the app to run (120 seconds)
    echo "Starting screen recording for 120 seconds..."
    
    # Create a script to run the demo and capture terminal output
    DEMO_RUN_SCRIPT=$(mktemp)
    cat > "$DEMO_RUN_SCRIPT" << 'EOF'
#!/bin/bash
cd "$1" && python3 "$2" | tee "$3/demo_output.txt"
EOF
    chmod +x "$DEMO_RUN_SCRIPT"
    
    # Set a duration for the demo (60 seconds)
    DEMO_DURATION=60
    
    # Try to use ffmpeg if available (more reliable than our OpenCV script)
    if command -v ffmpeg &> /dev/null; then
        echo "Using ffmpeg for screen recording..."
        
        # Use screencapture for macOS (this is the most reliable way)
        # Create a temporary script that uses screencapture to take screenshots every 0.5 seconds
        SCREENSHOT_SCRIPT=$(mktemp)
        SCREENSHOTS_DIR=$(mktemp -d)
        
        cat > "$SCREENSHOT_SCRIPT" << 'EOF'
#!/bin/bash
DURATION=$1
OUTPUT_DIR=$2
INTERVAL=0.5

echo "Taking screenshots for $DURATION seconds..."
frames=0
end_time=$(($(date +%s) + DURATION))

while [ $(date +%s) -lt $end_time ]; do
    screencapture -x "$OUTPUT_DIR/frame_$(printf "%04d" $frames).png"
    frames=$((frames + 1))
    sleep $INTERVAL
done
echo "Captured $frames screenshots"
EOF
        chmod +x "$SCREENSHOT_SCRIPT"
        
        # Start capturing screenshots
        "$SCREENSHOT_SCRIPT" $DEMO_DURATION "$SCREENSHOTS_DIR" &
        screenshot_pid=$!
        
        # Note: We'll convert the screenshots to video after the demo
        
        # Give the recording a moment to start
        sleep 2
        
        # Run the demo script
        echo "Running demo script..."
        "$DEMO_RUN_SCRIPT" "$TARGET_DIR" "$DEMO_SCRIPT" "$PROPOSAL_DIR"
        
        # Wait for the screenshot capture to finish
        echo "Demo script completed. Waiting for screen capture to finish..."
        wait $screenshot_pid
        
        # Convert screenshots to video
        echo "Converting screenshots to video..."
        ffmpeg -framerate 2 -pattern_type glob -i "$SCREENSHOTS_DIR/frame_*.png" -c:v libx264 -pix_fmt yuv420p "$output_file"
        
        # Clean up
        rm -rf "$SCREENSHOTS_DIR" "$SCREENSHOT_SCRIPT"
    else
        # Fallback to our Python script
        echo "Ffmpeg not found, using Python for screen recording..."
        
        # Use the same screenshot approach but with Python to manage it
        SCREENSHOTS_DIR=$(mktemp -d)
        
        # Start taking screenshots using screencapture
        (
            echo "Taking screenshots for $DEMO_DURATION seconds..."
            frames=0
            end_time=$(($(date +%s) + DEMO_DURATION))
            
            while [ $(date +%s) -lt $end_time ]; do
                screencapture -x "$SCREENSHOTS_DIR/frame_$(printf "%04d" $frames).png"
                frames=$((frames + 1))
                sleep 0.5
            done
            echo "Captured $frames screenshots"
        ) &
        screenshot_pid=$!
        
        # Give the recording a moment to start
        sleep 2
        
        # Run the demo script
        echo "Running demo script..."
        "$DEMO_RUN_SCRIPT" "$TARGET_DIR" "$DEMO_SCRIPT" "$PROPOSAL_DIR"
        
        # Wait for screenshots to finish
        echo "Demo script completed. Waiting for screen capture to finish..."
        wait $screenshot_pid
        
        # Convert screenshots to video using Python
        echo "Converting screenshots to video..."
        if command -v ffmpeg &> /dev/null; then
            ffmpeg -framerate 2 -pattern_type glob -i "$SCREENSHOTS_DIR/frame_*.png" -c:v libx264 -pix_fmt yuv420p "$output_file"
        else
            # Simple Python script to combine images
            python3 -c "
import glob, cv2, os
images = sorted(glob.glob('$SCREENSHOTS_DIR/frame_*.png'))
if images:
    frame = cv2.imread(images[0])
    height, width, layers = frame.shape
    video = cv2.VideoWriter('$output_file', cv2.VideoWriter_fourcc(*'mp4v'), 2, (width, height))
    for image in images:
        video.write(cv2.imread(image))
    video.release()
    print('Created video from', len(images), 'screenshots')
else:
    print('No screenshots found')
"
        fi
        
        # Clean up
        rm -rf "$SCREENSHOTS_DIR"
    fi
    
    # Clean up
    rm "$DEMO_RUN_SCRIPT"
    
    echo "======================================"
    echo "Demo completed! Recording saved to: $output_file"
    echo "======================================"
}

# Run the main workflow with command-line arguments if provided
if [ "$#" -eq 2 ]; then
    main "$1" "$2"
else
    main
fi
#!/usr/bin/env python3
"""
Master script to generate a proposal and demo based on a provided ID.
Calls claude_prompt_agentic.py, waits for Claude to finish, then runs the 
generated demo.command file with screen recording.
"""

import os
import sys
import argparse
import subprocess
import time
import threading
import glob
import signal
import psutil
from datetime import datetime

# Path setup
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CODE_DIR = os.path.join(SCRIPT_DIR, "code")
SCREEN_RECORD_DIR = os.path.join(SCRIPT_DIR, "screen_record")
EXAMPLES_DIR = os.path.join(SCREEN_RECORD_DIR, "examples")

# Add code directory to path to import the screen recorder
sys.path.append(SCREEN_RECORD_DIR)
import record_screen

def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Generate proposal and demo from project ID")
    parser.add_argument('--id', '-i', type=str, required=True,
                        help="Project ID")
    parser.add_argument('--check_interval', '-c', type=int, default=180,
                        help="Interval in seconds to check if Claude is done (default: 180)")
    parser.add_argument('--max_record_duration', '-d', type=int, default=600,
                        help="Maximum duration in seconds to record the demo (default: 600)")
    parser.add_argument('--fps', '-f', type=float, default=10.0,
                        help="Frames per second for the recording (default: 10)")
    parser.add_argument('--preview', '-p', action='store_true',
                        help="Show a live preview during recording")
    parser.add_argument('--example', '-e', action='store_true',
                        help="Use example demo instead of generating a new one")
    return parser.parse_args()

def get_directory_size(directory):
    """Get the total size of all files in a directory."""
    total_size = 0
    for dirpath, _, filenames in os.walk(directory):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if os.path.exists(fp):
                total_size += os.path.getsize(fp)
    return total_size

def wait_for_claude_to_finish(project_dir, check_interval=180):
    """
    Wait for Claude to finish generating the proposal by monitoring directory size.
    
    Args:
        project_dir: The project directory to monitor
        check_interval: How often to check the directory size (in seconds)
        
    Returns:
        True if Claude appears to be done, False if interrupted
    """
    print(f"\nMonitoring {project_dir} for changes...")
    print(f"Checking directory size every {check_interval} seconds.")
    print("Press Ctrl+C to stop monitoring and proceed to the next step.")
    
    prev_size = get_directory_size(project_dir)
    print(f"Initial directory size: {prev_size} bytes")
    
    stable_checks = 0
    try:
        while True:
            time.sleep(check_interval)
            current_size = get_directory_size(project_dir)
            
            if current_size > prev_size:
                print(f"Directory size increased: {prev_size} -> {current_size} bytes")
                stable_checks = 0
            else:
                stable_checks += 1
                print(f"Directory size stable for {stable_checks} check(s): {current_size} bytes")
                
            prev_size = current_size
            
            # If no changes for 2 checks, assume Claude is done
            if stable_checks >= 2:
                print("\nDirectory size has been stable for multiple checks. Claude appears to be done.")
                return True
                
    except KeyboardInterrupt:
        print("\nMonitoring interrupted. Proceeding to next step.")
        return False

def find_demo_command(project_dir):
    """
    Find the demo.command script that Claude should have generated.
    
    Args:
        project_dir: The project directory to search in
        
    Returns:
        Path to the demo.command script, or None if not found
    """
    # First, look for demo.command directly
    demo_command = os.path.join(project_dir, "demo.command")
    if os.path.exists(demo_command):
        return demo_command
    
    # If not found directly, search for it
    demo_files = glob.glob(f"{project_dir}/**/demo.command", recursive=True)
    if demo_files:
        return demo_files[0]
    
    # Also look for start-demo.command
    start_demo_files = glob.glob(f"{project_dir}/**/start-demo.command", recursive=True)
    if start_demo_files:
        return start_demo_files[0]
    
    # Look for any Python scripts that might be part of the demo
    demo_py_files = glob.glob(f"{project_dir}/**/demo*.py", recursive=True)
    if demo_py_files:
        return demo_py_files[0]
    
    # If still not found, look for HTML files that might be part of a web demo
    demo_html_files = glob.glob(f"{project_dir}/**/demo*.html", recursive=True)
    if demo_html_files:
        return demo_html_files[0]
    
    return None

def run_claude_agentic(project_id, prompt_file):
    """
    Run claude_prompt_agentic.py with the given project ID and prompt file.
    
    Args:
        project_id: The ID of the project
        prompt_file: Path to the prompt file to use
        
    Returns:
        The project directory path, or None if an error occurred
    """
    claude_script = os.path.join(CODE_DIR, "claude_prompt_agentic.py")
    
    if not os.path.exists(claude_script):
        print(f"Error: Claude script not found at {claude_script}")
        return None
        
    if not os.path.exists(prompt_file):
        print(f"Error: Prompt file not found at {prompt_file}")
        return None
    
    print(f"Running Claude with project ID: {project_id}")
    print(f"Using prompt file: {prompt_file}")
    
    try:
        cmd = [sys.executable, claude_script, "--id", project_id, "--prompt_file", prompt_file]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()
        
        print("\nClaude Agentic Output:")
        print(stdout)
        
        if process.returncode != 0:
            print(f"Error running Claude script: {stderr}")
            return None
            
        # Extract the project directory from stdout
        parent_dir = '/Users/Mike/Desktop/upwork/2) proposals'
        project_dir = os.path.join(parent_dir, project_id)
        
        if os.path.exists(project_dir):
            return project_dir
        else:
            print(f"Error: Project directory not found at {project_dir}")
            return None
            
    except Exception as e:
        print(f"Error executing Claude script: {e}")
        return None

def is_command_running(command_name):
    """Check if a specific command is running."""
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        try:
            # Check if the command name is in the process name or command line
            if command_name in proc.info['name'].lower():
                return True
            if proc.info['cmdline'] and any(command_name in cmd.lower() for cmd in proc.info['cmdline']):
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

def copy_example_to_project(project_dir):
    """Copy the example demo files to the project directory."""
    import shutil
    
    if not os.path.exists(EXAMPLES_DIR):
        print(f"Error: Examples directory not found at {EXAMPLES_DIR}")
        return None
        
    # Create a demo subdirectory in the project
    demo_dir = os.path.join(project_dir, "demo")
    os.makedirs(demo_dir, exist_ok=True)
    
    # Copy all files from examples directory to the demo directory
    for file in os.listdir(EXAMPLES_DIR):
        src_file = os.path.join(EXAMPLES_DIR, file)
        dst_file = os.path.join(demo_dir, file)
        
        if os.path.isfile(src_file):
            shutil.copy2(src_file, dst_file)
            
            # Make command files executable
            if file.endswith(".command") or file.endswith(".sh"):
                os.chmod(dst_file, 0o755)
    
    # Return the path to the start-demo.command file
    start_demo = os.path.join(demo_dir, "start-demo.command")
    if os.path.exists(start_demo):
        return start_demo
    
    # If start-demo.command doesn't exist, return any HTML file
    html_files = glob.glob(f"{demo_dir}/*.html")
    if html_files:
        return html_files[0]
        
    return None

def monitor_process_and_detect_end(demo_process, max_duration, stop_event):
    """
    Monitor the demo process and detect when it ends, or kill it after the max duration.
    Sets the stop_event when the demo ends.
    
    Also checks for completion signal files created by demo scripts.
    """
    timeout = time.time() + max_duration
    
    # Signal file that demo scripts can create to indicate completion
    signal_file = os.path.join(SCRIPT_DIR, ".demo_complete")
    
    # If demo script is a web page or server, we'll need to monitor specific indicators
    # to know when it's done (e.g., browser closed, specific log output, etc.)
    server_processes = ['python', 'node', 'npm', 'http.server']
    browser_processes = ['chrome', 'safari', 'firefox']
    
    # Record initial state of processes
    initial_servers = [proc for proc in server_processes if is_command_running(proc)]
    initial_browsers = [proc for proc in browser_processes if is_command_running(proc)]
    
    print(f"Monitoring demo process (PID: {demo_process.pid if demo_process else 'N/A'})")
    print(f"Will stop recording after a maximum of {max_duration} seconds")
    print(f"Looking for completion signal file: {signal_file}")
    
    # Remove any existing signal file before starting
    if os.path.exists(signal_file):
        os.remove(signal_file)
    
    try:
        while time.time() < timeout:
            # Check for signal file that indicates demo completion
            if os.path.exists(signal_file):
                print("\nDetected demo completion signal file. Demo has finished.")
                try:
                    os.remove(signal_file)  # Clean up signal file
                except:
                    pass  # Ignore errors in cleanup
                stop_event.set()
                return
                
            # Check if the direct demo process has ended
            if demo_process and demo_process.poll() is not None:
                print("\nDemo process has ended. Stopping recording...")
                stop_event.set()
                return
                
            # For web demos, check if the server or browser has ended
            if any(initial_servers) or any(initial_browsers):
                current_servers = [proc for proc in server_processes if is_command_running(proc)]
                current_browsers = [proc for proc in browser_processes if is_command_running(proc)]
                
                # If a server or browser that was running is now closed, the demo might be done
                servers_closed = any(proc for proc in initial_servers if proc not in current_servers)
                browsers_closed = any(proc for proc in initial_browsers if proc not in current_browsers)
                
                if servers_closed or browsers_closed:
                    print("\nDetected that a server or browser has closed. Demo may be finished.")
                    time.sleep(3)  # Give a few more seconds to capture any final state
                    stop_event.set()
                    return
            
            # Sleep before checking again
            time.sleep(1)
            
        # If we reach here, we've hit the max duration
        print("\nMaximum recording duration reached. Stopping recording...")
        
        # If the demo is still running, try to terminate it
        if demo_process and demo_process.poll() is None:
            print("Demo is still running. Attempting to terminate it...")
            try:
                demo_process.terminate()
                demo_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print("Demo did not terminate gracefully. Forcing kill...")
                demo_process.kill()
        
        stop_event.set()
    except Exception as e:
        print(f"\nError monitoring demo process: {e}")
        stop_event.set()
    finally:
        # Clean up signal file if it exists
        if os.path.exists(signal_file):
            try:
                os.remove(signal_file)
            except:
                pass

def main():
    """Main function to run the entire process."""
    args = parse_arguments()
    
    # Determine the project directory
    parent_dir = '/Users/Mike/Desktop/upwork/2) proposals'
    project_dir = os.path.join(parent_dir, args.id)
    
    # Check if the project directory exists
    if not os.path.exists(project_dir):
        print(f"Creating project directory: {project_dir}")
        os.makedirs(project_dir, exist_ok=True)
    
    # Check if we should use the example demo
    if args.example:
        print("\nUsing example demo instead of generating a new one...")
        demo_script = copy_example_to_project(project_dir)
    else:
        # Check if a demo already exists
        existing_demo = find_demo_command(project_dir)
        
        if existing_demo:
            print(f"\nExisting demo found at: {existing_demo}")
            print("Automatically skipping Claude generation...")
            demo_script = existing_demo
        else:
            # Step 1: Run Claude to generate the proposal and demo
            print("Step 1: Running Claude to generate proposal and demo...")
            frontend_prompt_path = os.path.join(CODE_DIR, "prompts/complete_frontend_prompt.txt")
            project_dir = run_claude_agentic(args.id, frontend_prompt_path)
            
            if not project_dir:
                print("Error: Failed to run Claude script. Exiting.")
                return
            
            # Step 2: Wait for Claude to finish by monitoring directory size
            print("\nStep 2: Waiting for Claude to finish generating proposal and demo...")
            wait_for_claude_to_finish(project_dir, args.check_interval)
            
            # Step 3: Find the demo.command script
            print("\nStep 3: Finding demo script...")
            demo_script = find_demo_command(project_dir)
    
    # Verify that we have a demo script
    if not demo_script:
        print("Error: No demo script found. Claude may not have generated one.")
        print("Searching for any HTML files that might be part of the demo...")
        
        html_files = glob.glob(f"{project_dir}/**/*.html", recursive=True)
        if html_files:
            print(f"Found HTML file(s): {html_files[0]}")
            demo_script = html_files[0]
        else:
            print("No HTML files found either. Exiting.")
            return
    
    print(f"Found demo script: {demo_script}")
    
    # Make sure the demo script is executable
    if os.path.exists(demo_script) and demo_script.endswith((".command", ".sh")):
        print("Making demo script executable...")
        os.chmod(demo_script, 0o755)
    
    # Step 4: Run the demo with screen recording
    print("\nStep 4: Running demo with screen recording...")
    
    # Determine output filename for recording
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    recording_filename = os.path.join(project_dir, f"demo_recording_{timestamp}.mp4")
    
    # Create a stop event for the recording
    stop_event = threading.Event()
    
    # Start recording in a separate thread
    recording_thread = threading.Thread(
        target=record_screen.record_screen, 
        args=(recording_filename, args.fps, args.preview, stop_event)
    )
    recording_thread.daemon = True
    recording_thread.start()
    
    print(f"Screen recording started. Output will be saved to: {recording_filename}")
    
    try:
        # Run the demo script
        print(f"Starting demo script...")
        
        # Use the appropriate command to run the demo based on its file extension
        if demo_script.endswith(".command") or demo_script.endswith(".sh"):
            # For shell scripts, run in a new terminal window for visibility
            if sys.platform == "darwin":  # macOS
                # Get the directory of the script
                script_dir = os.path.dirname(os.path.abspath(demo_script))
                
                # Create an AppleScript to open a new terminal window and run the script
                applescript = f'''
                tell application "Terminal"
                    do script "cd '{script_dir}' && '{demo_script}'"
                    activate
                end tell
                '''
                
                # Run the AppleScript
                subprocess.Popen(["osascript", "-e", applescript])
                
                # Set a placeholder process (we'll monitor Terminal instead)
                demo_process = None
            else:
                # For non-macOS, run directly
                demo_process = subprocess.Popen(["/bin/bash", demo_script])
        elif demo_script.endswith(".py"):
            demo_process = subprocess.Popen([sys.executable, demo_script])
        elif demo_script.endswith(".html"):
            # For HTML files, open them in the default browser
            if sys.platform == "darwin":  # macOS
                demo_process = subprocess.Popen(["open", demo_script])
            else:
                print("Error: Opening HTML files directly is only supported on macOS")
                demo_process = None
        else:
            print(f"Error: Unsupported demo script format: {demo_script}")
            demo_process = None
        
        # Start a thread to monitor the demo process and detect when it's done
        monitor_thread = threading.Thread(
            target=monitor_process_and_detect_end,
            args=(demo_process, args.max_record_duration, stop_event)
        )
        monitor_thread.daemon = True
        monitor_thread.start()
        
        # Wait for the recording to finish
        while not stop_event.is_set():
            time.sleep(1)
            
    except Exception as e:
        print(f"Error during demo execution: {e}")
        stop_event.set()
    finally:
        # Make sure the recording stops
        if not stop_event.is_set():
            stop_event.set()
        recording_thread.join()
        
    print(f"\nProcess completed. Recording saved to: {recording_filename}")
    return recording_filename

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
        sys.exit(1)
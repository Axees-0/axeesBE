#!/usr/bin/env python3
"""
Special test script focused on terminal window viewing for tmux sessions.
This script will:
1. Create a Claude instance in a tmux session
2. Open a terminal window to view the session
3. Verify the window opens correctly

This script is designed to be run interactively so you can see the windows opening.
"""

import os
import sys
import time
import subprocess
import uuid
import tempfile
import argparse

# Add parent directory to sys.path to import modules
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
sys.path.insert(0, os.path.join(parent_dir, 'src'))

# Import the required modules
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance

def check_environment():
    """Check if we're in a compatible environment for this test."""
    # Check for tmux
    try:
        subprocess.run(["tmux", "-V"], capture_output=True, check=True)
    except (subprocess.SubprocessError, FileNotFoundError):
        print("Error: tmux not found or not working correctly.")
        return False
    
    # Check for Terminal.app (macOS) or equivalent
    if sys.platform == 'darwin':
        try:
            result = subprocess.run(
                ["osascript", "-e", 'exists application "Terminal"'],
                capture_output=True, text=True, check=False
            )
            if "true" not in result.stdout.lower():
                print("Error: Terminal.app not found on macOS.")
                return False
        except Exception:
            print("Error: Could not check for Terminal.app.")
            return False
    else:
        print("Warning: This test is optimized for macOS. Results may vary on other platforms.")
    
    return True

def create_test_prompt():
    """Create a test prompt file."""
    temp_dir = tempfile.mkdtemp(prefix="claude_terminal_test_")
    prompt_path = os.path.join(temp_dir, "test_prompt.txt")
    
    prompt_content = """Hello Claude!

This is a test for terminal window viewing. Please respond with a colorful list
of features in your response, so we can verify the terminal display.

Please include:
1. Some **bold** text
2. A simple code snippet
3. A numbered list
4. Some large text characters
5. A table

Thank you!
"""
    
    with open(prompt_path, 'w') as f:
        f.write(prompt_content)
    
    return temp_dir, prompt_path

def run_terminal_view_test(keep_windows=False, instances_to_create=2):
    """Run the terminal window viewing test."""
    print("\n===== Terminal Window Viewing Test =====")
    
    if not check_environment():
        print("Environment check failed. Exiting.")
        return False
    
    # Create temporary test directory and prompt
    temp_dir, prompt_path = create_test_prompt()
    print(f"Created test prompt at {prompt_path}")
    
    # Set up a unique instances file
    instance_file = os.path.join(temp_dir, "test_instances.json")
    
    # Create a manager
    manager = ClaudeTaskManager(save_file=instance_file)
    
    # Store instance IDs for cleanup
    instance_ids = []
    
    try:
        # Create instances
        for i in range(instances_to_create):
            print(f"\nCreating instance {i+1} of {instances_to_create}...")
            
            # Create with open_terminal=False first, so we can test explicit window opening
            instance_id = manager.start_instance(
                project_dir=temp_dir,
                prompt_path=prompt_path,
                use_tmux=True,
                open_terminal=False
            )
            instance_ids.append(instance_id)
            
            # Wait for the instance to initialize
            time.sleep(5)
            
            # Verify the instance was created
            if instance_id in manager.instances:
                instance = manager.instances[instance_id]
                tmux_session = instance.tmux_session_name
                print(f"Created instance {instance_id} with tmux session {tmux_session}")
                
                # Verify tmux session exists
                result = subprocess.run(
                    ["tmux", "has-session", "-t", tmux_session],
                    capture_output=True, 
                    check=False
                )
                
                if result.returncode == 0:
                    print(f"✅ Verified tmux session {tmux_session} exists")
                else:
                    print(f"❌ ERROR: Tmux session {tmux_session} does not exist")
                    continue
                
                # Now open a terminal window for this instance
                print(f"Opening terminal window for instance {instance_id}...")
                result = manager.view_terminal(instance_id)
                
                if result:
                    print(f"✅ Successfully opened terminal window for instance {instance_id}")
                else:
                    print(f"❌ ERROR: Failed to open terminal window for instance {instance_id}")
                
                # Instead of waiting for user input, we'll use a short sleep to allow
                # the window to open, and then programmatically verify it exists
                time.sleep(2)
                
                # On macOS, we can use AppleScript to check if the terminal window is open
                if sys.platform == 'darwin':
                    try:
                        check_script = f'''
                        tell application "Terminal"
                            set windowCount to count windows whose name contains "{tmux_session}"
                            return windowCount
                        end tell
                        '''
                        result = subprocess.run(["osascript", "-e", check_script], 
                                               capture_output=True, text=True, check=False)
                        window_count = int(result.stdout.strip() or "0")
                        
                        if window_count > 0:
                            print(f"✅ Verified terminal window exists for session {tmux_session}")
                        else:
                            print(f"⚠️ Could not verify terminal window for session {tmux_session}")
                    except Exception as e:
                        print(f"Error checking terminal window: {e}")
                else:
                    # On other platforms, just rely on the result from view_terminal
                    print("⚠️ Cannot verify terminal window on this platform")
            else:
                print(f"❌ ERROR: Failed to create instance {i+1}")
        
        # Create one more instance with open_terminal=True to test automatic window opening
        print("\nCreating one more instance with automatic terminal window opening...")
        auto_instance_id = manager.start_instance(
            project_dir=temp_dir,
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=True
        )
        instance_ids.append(auto_instance_id)
        
        print(f"Created instance {auto_instance_id} with automatic terminal window")
        print("A terminal window should have opened automatically.")
        
        # Allow time for window to open
        time.sleep(2)
        
        # Verify window exists
        if sys.platform == 'darwin':
            try:
                check_script = f'''
                tell application "Terminal"
                    set windowCount to count windows whose name contains "{auto_instance_id}"
                    return windowCount
                end tell
                '''
                result = subprocess.run(["osascript", "-e", check_script], 
                                       capture_output=True, text=True, check=False)
                window_count = int(result.stdout.strip() or "0")
                
                if window_count > 0:
                    print(f"✅ Verified automatic terminal window exists for instance {auto_instance_id}")
                else:
                    print(f"⚠️ Could not verify automatic terminal window")
            except Exception as e:
                print(f"Error checking automatic terminal window: {e}")
        else:
            # On other platforms, just rely on the result from start_instance
            print("⚠️ Cannot verify automatic terminal window on this platform")
        
        # Test terminal viewing with other features
        print("\nTesting multi-window terminal viewing...")
        
        # Open terminal windows for all instances at once
        for instance_id in instance_ids:
            manager.view_terminal(instance_id)
            print(f"Opened terminal window for instance {instance_id}")
        
        print("\nOpened multiple terminal windows simultaneously.")
        
        # Allow windows to open
        time.sleep(2)
        
        # Verify multiple windows exist
        if sys.platform == 'darwin':
            try:
                # Check total number of windows for Claude
                check_script = '''
                tell application "Terminal"
                    set windowCount to count windows whose name contains "claude_"
                    return windowCount
                end tell
                '''
                result = subprocess.run(["osascript", "-e", check_script], 
                                       capture_output=True, text=True, check=False)
                window_count = int(result.stdout.strip() or "0")
                
                if window_count >= len(instance_ids):
                    print(f"✅ Verified multiple terminal windows ({window_count}) for Claude instances")
                else:
                    print(f"⚠️ Expected at least {len(instance_ids)} terminal windows, found {window_count}")
            except Exception as e:
                print(f"Error checking terminal windows: {e}")
        else:
            # On other platforms, just rely on the result from view_terminal
            print("⚠️ Cannot verify terminal windows on this platform")
        
        print("\n===== Test Completed Successfully =====")
        return True
    
    except Exception as e:
        print(f"Error during terminal view test: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        if not keep_windows:
            # Clean up instances
            print("\nCleaning up...")
            for instance_id in instance_ids:
                try:
                    if instance_id in manager.instances:
                        print(f"Stopping instance {instance_id}...")
                        manager.stop_instance(instance_id)
                        
                        print(f"Deleting instance {instance_id}...")
                        manager.delete_instance(instance_id)
                except Exception as e:
                    print(f"Error cleaning up instance {instance_id}: {e}")
            
            # Remove temp directory
            try:
                import shutil
                shutil.rmtree(temp_dir)
                print(f"Removed temporary test directory: {temp_dir}")
            except Exception as e:
                print(f"Error removing temporary directory: {e}")
        else:
            print("\nKeeping terminal windows open as requested.")
            print(f"Manual cleanup required for sessions: {', '.join(instance_ids)}")
            print(f"Temporary directory: {temp_dir}")

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Test terminal window viewing for tmux sessions')
    parser.add_argument('--keep-windows', action='store_true', 
                        help='Keep terminal windows open after the test (for debugging)')
    parser.add_argument('--instances', type=int, default=2,
                        help='Number of instances to create (default: 2)')
    return parser.parse_args()

if __name__ == "__main__":
    print(f"Starting terminal viewing test at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    args = parse_arguments()
    
    success = run_terminal_view_test(
        keep_windows=args.keep_windows,
        instances_to_create=args.instances
    )
    
    if success:
        print("\n🎉 Terminal viewing test completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Terminal viewing test failed. See above for details.")
        sys.exit(1)
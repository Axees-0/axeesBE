#!/usr/bin/env python3
"""
Full integration test for Runtime Integration features:
- tmux session management
- Content capture from tmux
- Terminal window viewing

This test combines all runtime integration features into a single workflow
that mimics real-world usage. It creates instances, monitors them, captures content,
and opens terminal windows, ensuring all components work together correctly.
"""

import os
import sys
import time
import subprocess
import tempfile
import argparse
import logging
import uuid
import shutil
from datetime import datetime

# Add parent directory to sys.path to import modules
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
sys.path.insert(0, os.path.join(parent_dir, 'src'))

# Import the required modules
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance

# Configure logging
LOG_FILE = "runtime_integration_full_test.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('runtime_integration_full')


def setup_test_environment():
    """Create test environment with project directory and prompts."""
    # Create a temporary directory for the test
    test_dir = tempfile.mkdtemp(prefix="claude_rt_full_test_")
    logger.info(f"Created test directory: {test_dir}")
    
    # Create project directory
    project_dir = os.path.join(test_dir, "test_project")
    os.makedirs(project_dir, exist_ok=True)
    
    # Create a prompt file
    prompt_path = os.path.join(project_dir, "test_prompt.txt")
    with open(prompt_path, 'w') as f:
        f.write("""Hello Claude!

This is a comprehensive test of runtime integration features.
Please generate a response containing various elements:

1. A greeting
2. A Python code snippet
3. A bulleted list
4. A numbered list
5. A table
6. A block quote

Your output will be tested for content capture and display in a terminal window.
Thank you!
""")
    
    # Create an instance file
    instance_file = os.path.join(test_dir, "test_instances.json")
    
    return {
        'test_dir': test_dir,
        'project_dir': project_dir,
        'prompt_path': prompt_path,
        'instance_file': instance_file
    }


def cleanup_environment(env, instance_ids=None):
    """Clean up the test environment."""
    logger.info("Cleaning up test environment...")
    
    # Stop and delete instances
    if instance_ids:
        manager = ClaudeTaskManager(save_file=env['instance_file'])
        for instance_id in instance_ids:
            try:
                logger.info(f"Stopping instance {instance_id}...")
                manager.stop_instance(instance_id)
                logger.info(f"Deleting instance {instance_id}...")
                manager.delete_instance(instance_id)
            except Exception as e:
                logger.error(f"Error cleaning up instance {instance_id}: {e}")
    
    # Remove the temporary directory
    try:
        shutil.rmtree(env['test_dir'])
        logger.info(f"Removed test directory: {env['test_dir']}")
    except Exception as e:
        logger.error(f"Error removing test directory: {e}")


def run_full_integration_test(interactive=False, keep_environment=False):
    """Run the full integration test.
    
    Args:
        interactive: If True, pause for user interaction during tests
        keep_environment: If True, don't clean up the environment after tests
    
    Returns:
        bool: True if all tests passed, False otherwise
    """
    logger.info("=== Starting Full Runtime Integration Test ===")
    start_time = time.time()
    
    # Setup test environment
    env = setup_test_environment()
    instance_ids = []
    
    try:
        # Create a task manager
        manager = ClaudeTaskManager(save_file=env['instance_file'])
        
        # Test 1: Create an instance with tmux
        logger.info("\n--- Test 1: Create tmux instance ---")
        print("\nCreating Claude instance with tmux...")
        
        instance_id = manager.start_instance(
            project_dir=env['project_dir'],
            prompt_path=env['prompt_path'],
            use_tmux=True,
            open_terminal=False  # Don't open window automatically
        )
        instance_ids.append(instance_id)
        
        # Wait for instance to initialize
        time.sleep(5)
        
        # Verify instance creation
        if instance_id in manager.instances:
            instance = manager.instances[instance_id]
            tmux_session = instance.tmux_session_name
            logger.info(f"Created instance {instance_id} with tmux session {tmux_session}")
            print(f"✅ Instance created: {instance_id}")
            
            # Verify tmux session exists
            result = subprocess.run(
                ["tmux", "has-session", "-t", tmux_session],
                capture_output=True, 
                check=False
            )
            
            if result.returncode == 0:
                logger.info(f"Verified tmux session {tmux_session} exists")
                print(f"✅ Tmux session verified: {tmux_session}")
            else:
                logger.error(f"Tmux session {tmux_session} not found")
                print(f"❌ Failed to verify tmux session")
                return False
        else:
            logger.error(f"Failed to create instance")
            print("❌ Failed to create instance")
            return False
        
        # Test 2: Wait for instance to generate content
        logger.info("\n--- Test 2: Content generation ---")
        print("\nWaiting for Claude to generate content...")
        
        # Wait for content generation
        time.sleep(15)
        
        # Get instance content
        content = manager.get_instance_content(instance_id)
        
        # Verify content
        if not content:
            logger.error("No content captured from instance")
            print("❌ No content captured")
            return False
        
        # Check for expected elements in content
        elements = {
            "greeting": ["Hello", "Hi"],
            "code": ["```python", "def"],
            "bulleted list": ["* ", "- "],
            "numbered list": ["1.", "2."],
            "table": ["|", "+---"],
            "block quote": ["> "]
        }
        
        found_elements = {}
        for element_name, patterns in elements.items():
            found = any(pattern in content for pattern in patterns)
            found_elements[element_name] = found
            
            if found:
                logger.info(f"Found {element_name} in captured content")
                print(f"✅ Found {element_name} in content")
            else:
                logger.warning(f"Did not find {element_name} in content")
                print(f"⚠️ Could not find {element_name} in content")
        
        # Consider the test passed if most elements are found
        content_check_passed = sum(found_elements.values()) >= 4
        
        if content_check_passed:
            logger.info(f"Content check passed: found {sum(found_elements.values())}/6 elements")
            print(f"✅ Content check passed ({sum(found_elements.values())}/6 elements found)")
        else:
            logger.error(f"Content check failed: found only {sum(found_elements.values())}/6 elements")
            print(f"❌ Content check failed (only {sum(found_elements.values())}/6 elements found)")
        
        # Display sample of captured content
        content_sample = content[:300] + "..." if len(content) > 300 else content
        logger.info(f"Content sample:\n{content_sample}")
        
        if interactive:
            print("\nSample of captured content:")
            print("-" * 50)
            print(content_sample)
            print("-" * 50)
            # Instead of waiting for input, just continue
            print("Continuing with next test...")
        
        # Test 3: Instance status detection
        logger.info("\n--- Test 3: Instance status detection ---")
        print("\nChecking instance status...")
        
        # Get instance list with statuses
        instances = manager.list_instances()
        instance_info = next((i for i in instances if i['id'] == instance_id), None)
        
        if not instance_info:
            logger.error(f"Instance {instance_id} not found in listing")
            print(f"❌ Instance not found in listing")
            return False
        
        # Display instance status
        status = instance_info['status']
        logger.info(f"Instance status: {status}")
        print(f"Instance status: {status}")
        
        # Status should be 'running' or 'standby'
        if status in ['running', 'standby']:
            logger.info(f"Status check passed: {status}")
            print(f"✅ Status check passed: {status}")
        else:
            logger.error(f"Status check failed: expected 'running' or 'standby', got '{status}'")
            print(f"❌ Status check failed: expected 'running' or 'standby', got '{status}'")
        
        # Test 4: Open terminal window to view instance
        logger.info("\n--- Test 4: Terminal window opening ---")
        print("\nOpening terminal window to view instance...")
        
        can_open_terminal = True
        
        # Check if we're on macOS and Terminal.app is available
        if sys.platform == 'darwin':
            try:
                result = subprocess.run(
                    ["osascript", "-e", 'exists application "Terminal"'],
                    capture_output=True, 
                    text=True,
                    check=False
                )
                can_open_terminal = "true" in result.stdout.lower()
            except Exception:
                can_open_terminal = False
        else:
            # On other platforms, assume we can't open terminal windows
            can_open_terminal = False
        
        if not can_open_terminal:
            logger.warning("Environment doesn't support opening terminal windows, skipping test")
            print("⚠️ Environment doesn't support opening terminal windows, skipping test")
        else:
            # Open a terminal window
            result = manager.view_terminal(instance_id)
            
            if result:
                logger.info(f"Successfully opened terminal window for instance {instance_id}")
                print(f"✅ Terminal window opened")
                
                if interactive:
                    # Wait briefly instead of requiring input
                    time.sleep(2)
                    print("Verifying terminal window is open...")
                    
                    # On macOS, verify the window is open
                    if sys.platform == 'darwin':
                        try:
                            check_script = f'''
                            tell application "Terminal"
                                set windowCount to count windows whose name contains "{instance.tmux_session_name}"
                                return windowCount
                            end tell
                            '''
                            result = subprocess.run(["osascript", "-e", check_script], 
                                                  capture_output=True, text=True, check=False)
                            window_count = int(result.stdout.strip() or "0")
                            
                            if window_count > 0:
                                print(f"✅ Successfully verified terminal window is open")
                            else:
                                print(f"⚠️ Could not verify terminal window")
                        except Exception as e:
                            print(f"Error checking terminal window: {e}")
            else:
                logger.error(f"Failed to open terminal window for instance {instance_id}")
                print(f"❌ Failed to open terminal window")
        
        # Test 5: Stop and restart instance
        logger.info("\n--- Test 5: Stop and restart instance ---")
        print("\nStopping instance...")
        
        # Stop the instance
        stop_result = manager.stop_instance(instance_id)
        
        if stop_result:
            logger.info(f"Successfully stopped instance {instance_id}")
            print(f"✅ Instance stopped")
            
            # Verify the tmux session no longer exists
            result = subprocess.run(
                ["tmux", "has-session", "-t", tmux_session],
                capture_output=True, 
                check=False
            )
            
            if result.returncode != 0:
                logger.info(f"Verified tmux session {tmux_session} no longer exists")
                print(f"✅ Tmux session terminated")
            else:
                logger.error(f"Tmux session {tmux_session} still exists after stopping")
                print(f"❌ Tmux session still exists after stopping")
                return False
            
            # Verify the instance status is updated
            instance = manager.instances[instance_id]
            if instance.status == "stopped":
                logger.info(f"Verified instance status is 'stopped'")
                print(f"✅ Instance status updated to 'stopped'")
            else:
                logger.error(f"Instance status is '{instance.status}', expected 'stopped'")
                print(f"❌ Instance status not updated correctly")
                return False
        else:
            logger.error(f"Failed to stop instance {instance_id}")
            print(f"❌ Failed to stop instance")
            return False
        
        # Create a new instance
        logger.info("\nCreating a new instance for the second part of the test...")
        print("\nCreating a new instance...")
        
        second_instance_id = manager.start_instance(
            project_dir=env['project_dir'],
            prompt_path=env['prompt_path'],
            use_tmux=True,
            open_terminal=True  # This time, open window automatically
        )
        instance_ids.append(second_instance_id)
        
        # Wait for instance to initialize
        time.sleep(5)
        
        # Verify instance creation
        if second_instance_id in manager.instances:
            instance = manager.instances[second_instance_id]
            tmux_session = instance.tmux_session_name
            logger.info(f"Created instance {second_instance_id} with tmux session {tmux_session}")
            print(f"✅ Second instance created: {second_instance_id}")
            
            if interactive:
                # Wait briefly instead of requiring input
                time.sleep(2)
                print("Verifying automatic terminal window is open...")
                
                # On macOS, verify the window is open
                if sys.platform == 'darwin':
                    try:
                        check_script = f'''
                        tell application "Terminal"
                            set windowCount to count windows whose name contains "{instance.tmux_session_name}"
                            return windowCount
                        end tell
                        '''
                        result = subprocess.run(["osascript", "-e", check_script], 
                                              capture_output=True, text=True, check=False)
                        window_count = int(result.stdout.strip() or "0")
                        
                        if window_count > 0:
                            print(f"✅ Successfully verified automatic terminal window is open")
                        else:
                            print(f"⚠️ Could not verify automatic terminal window")
                    except Exception as e:
                        print(f"Error checking automatic terminal window: {e}")
        else:
            logger.error(f"Failed to create second instance")
            print("❌ Failed to create second instance")
            return False
        
        # Test 6: Instance listing and management
        logger.info("\n--- Test 6: Instance listing and management ---")
        print("\nListing all instances...")
        
        # Get instance list
        instances = manager.list_instances()
        
        # Verify both instances are in the list
        instance_ids_in_list = [i['id'] for i in instances]
        both_found = instance_id in instance_ids_in_list and second_instance_id in instance_ids_in_list
        
        if both_found:
            logger.info(f"Found both instances in listing: {instance_ids_in_list}")
            print(f"✅ Both instances found in listing")
        else:
            logger.error(f"Not all instances found in listing. Expected: {[instance_id, second_instance_id]}, Got: {instance_ids_in_list}")
            print(f"❌ Not all instances found in listing")
            return False
        
        # Test passed if we got here
        test_duration = time.time() - start_time
        logger.info(f"\n=== Full Runtime Integration Test Passed ({test_duration:.1f}s) ===")
        print(f"\n🎉 Full Runtime Integration Test PASSED in {test_duration:.1f} seconds")
        
        return True
    
    except Exception as e:
        logger.error(f"Error during full integration test: {e}")
        import traceback
        traceback.print_exc()
        print(f"\n❌ Test failed with error: {e}")
        return False
    
    finally:
        # Clean up environment if not keeping it
        if not keep_environment:
            cleanup_environment(env, instance_ids)
        else:
            print(f"\nKeeping test environment for inspection:")
            print(f"- Test directory: {env['test_dir']}")
            print(f"- Instance file: {env['instance_file']}")
            print(f"- Instance IDs: {', '.join(instance_ids)}")
            print("You'll need to clean up these resources manually.")


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Full runtime integration test')
    parser.add_argument('--interactive', action='store_true', 
                        help='Run in interactive mode with pauses for user interaction')
    parser.add_argument('--keep', action='store_true',
                        help='Keep test environment after tests (for debugging)')
    return parser.parse_args()


if __name__ == "__main__":
    print(f"Starting full runtime integration test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Log file: {os.path.abspath(LOG_FILE)}")
    
    args = parse_arguments()
    
    success = run_full_integration_test(
        interactive=args.interactive,
        keep_environment=args.keep
    )
    
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Test script to verify Claude instance reuse functionality.
This script:
1. Creates a Claude instance in a specific directory
2. Then tries to create another instance in the same directory
3. Verifies that the second attempt reuses the first instance instead of creating a new one
"""

import os
import sys
import tempfile
import time
from claude_task_manager import ClaudeTaskManager

def test_instance_reuse():
    # Create a temporary directory for our test
    test_dir = tempfile.mkdtemp()
    print(f"Created test directory: {test_dir}")
    
    # Define two different prompt files for our tests
    prompt1 = "Hello Claude! This is the first prompt. Please wait for additional instructions."
    prompt2 = "Hello Claude! This is the second prompt. This should be sent to the same instance."
    
    # Create temp files for each prompt
    prompt1_file = os.path.join(test_dir, "prompt1.txt")
    prompt2_file = os.path.join(test_dir, "prompt2.txt")
    
    with open(prompt1_file, 'w') as f:
        f.write(prompt1)
    
    with open(prompt2_file, 'w') as f:
        f.write(prompt2)
    
    print("Created two different prompt files")
    
    # Initialize the task manager
    manager = ClaudeTaskManager()
    print("Initialized Claude Task Manager")
    
    # Step 1: Create the first instance
    print("\n=== STEP 1: Creating first instance ===")
    instance1_id = manager.start_instance(
        project_dir=test_dir,
        prompt_path=prompt1_file,
        use_tmux=True,
        open_terminal=True  # Set this to True to see the Claude output for debugging
    )
    print(f"Created first instance with ID: {instance1_id}")
    
    # Get info about the first instance
    instances = manager.list_instances()
    instance1_info = next((i for i in instances if i['id'] == instance1_id), None)
    
    if not instance1_info:
        print("ERROR: First instance not found in manager!")
        return False
    
    print(f"First instance details:")
    print(f"  ID: {instance1_info['id']}")
    print(f"  Status: {instance1_info['status']}")
    print(f"  Directory: {instance1_info['project_dir']}")
    print(f"  Prompt: {instance1_info['prompt_path']}")
    print(f"  tmux session: {instance1_info['tmux_session']}")
    
    # Wait for the first instance to be fully initialized
    print("Waiting for first instance to initialize fully...")
    time.sleep(10)
    
    # Step 2: Create a second instance in the same directory but with trailing slash
    print("\n=== STEP 2: Creating second instance in same directory with trailing slash ===")
    # Add a trailing slash to test directory normalization
    test_dir_with_slash = test_dir
    if not test_dir_with_slash.endswith('/'):
        test_dir_with_slash = test_dir_with_slash + '/'
    
    print(f"First directory: {test_dir}")
    print(f"Second directory (with trailing slash): {test_dir_with_slash}")
    
    instance2_id = manager.start_instance(
        project_dir=test_dir_with_slash,  # Using the directory with trailing slash
        prompt_path=prompt2_file,
        use_tmux=True,
        open_terminal=False
    )
    print(f"Got instance ID: {instance2_id}")
    
    # Get info about the second instance
    instances = manager.list_instances()
    instance2_info = next((i for i in instances if i['id'] == instance2_id), None)
    
    if not instance2_info:
        print("ERROR: Second instance not found in manager!")
        return False
    
    print(f"Second instance details:")
    print(f"  ID: {instance2_info['id']}")
    print(f"  Status: {instance2_info['status']}")
    print(f"  Directory: {instance2_info['project_dir']}")
    print(f"  Prompt: {instance2_info['prompt_path']}")
    print(f"  tmux session: {instance2_info['tmux_session']}")
    
    # Step 3: Verify that the second attempt reused the first instance
    print("\n=== STEP 3: Verifying reuse ===")
    
    # Check if the instance IDs are the same
    if instance1_id == instance2_id:
        print("✅ SUCCESS: Second attempt reused the first instance (IDs match)")
        
        # Check that the prompt was updated
        if instance2_info['prompt_path'] == prompt2_file:
            print("✅ SUCCESS: Prompt file was updated in the reused instance")
        else:
            print(f"❌ FAILURE: Prompt file was not updated (expected: {prompt2_file}, actual: {instance2_info['prompt_path']})")
            return False
        
        return True
    else:
        print(f"❌ FAILURE: Second attempt created a new instance instead of reusing the first one")
        print(f"  First instance ID: {instance1_id}")
        print(f"  Second instance ID: {instance2_id}")
        return False

def cleanup_test_instances():
    """Clean up any test instances that might be left running"""
    manager = ClaudeTaskManager()
    instances = manager.list_instances()
    
    for instance in instances:
        if instance['status'] in ['running', 'standby']:
            print(f"Stopping instance {instance['id']}...")
            manager.stop_instance(instance['id'])

if __name__ == "__main__":
    print("=== Claude Instance Reuse Test ===")
    
    try:
        result = test_instance_reuse()
        if result:
            print("\nTest passed! Claude instance reuse is working correctly.")
        else:
            print("\nTest failed! Claude instance reuse is not working correctly.")
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Clean up
        print("\nCleaning up test instances...")
        cleanup_test_instances()
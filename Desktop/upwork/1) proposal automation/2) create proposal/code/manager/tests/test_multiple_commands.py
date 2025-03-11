#!/usr/bin/env python3
"""
Test script to verify handling multiple command execution prompts in sequence.
1. Send a prompt to Claude that will trigger multiple shell command requests
2. Verify that Claude automatically approves all commands
3. Verify all commands are executed successfully
4. Verify the yes_count is incremented for each approval
"""

import os
import sys
import time
import subprocess
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
LOG_FILE = "multiple_commands_test.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('test_multiple_commands')

def run_multiple_commands_test():
    """Test handling multiple command approvals in sequence."""
    logger.info("Starting multiple commands test")
    
    # Use a directory within the current project
    current_dir = os.getcwd()
    test_dir = os.path.join(current_dir, "tests", "multi_cmd_test_dir")
    os.makedirs(test_dir, exist_ok=True)
    logger.info(f"Using test directory: {test_dir}")
    
    # Create an instances file
    instance_file = os.path.join(test_dir, "test_instances.json")
    
    # Initialize ClaudeTaskManager
    manager = ClaudeTaskManager(save_file=instance_file)
    
    # Define test files
    test_files = [
        os.path.join(test_dir, f"multi_test_{i}.txt") 
        for i in range(3)
    ]
    
    # Delete test files if they exist from a previous run
    for file_path in test_files:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Removed existing test file: {file_path}")
    
    # Create a prompt that will trigger multiple shell command execution prompts
    prompt_content = """Hello Claude!

This is a test to verify that you can auto-respond to multiple shell command execution prompts.

Please create three files in the current directory by running these three separate commands. 
Ask for permission before each command:

```bash
echo "MULTI_TEST_0" > multi_test_0.txt
```

After that's done, run:

```bash
echo "MULTI_TEST_1" > multi_test_1.txt
```

Finally, run:

```bash
echo "MULTI_TEST_2" > multi_test_2.txt
```

After executing all commands, respond with: "MULTIPLE_COMMANDS_EXECUTED"

Thank you!"""
    
    prompt_path = os.path.join(test_dir, f"multi_command_prompt_{uuid.uuid4().hex[:8]}.txt")
    with open(prompt_path, 'w') as f:
        f.write(prompt_content)
    logger.info(f"Created prompt file at {prompt_path}")
    
    # Create a Claude instance with this prompt
    try:
        instance_id = manager.start_instance(
            project_dir=test_dir,
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        logger.info(f"Created instance {instance_id} for multiple commands test")
        
        # Wait for the confirmation phrase - this may take longer since multiple commands
        success = wait_for_phrase_in_instance(manager, instance_id, "MULTIPLE_COMMANDS_EXECUTED", timeout=180)
        
        # Check if all files were created with correct content
        files_correct = True
        for i, file_path in enumerate(test_files):
            if not os.path.exists(file_path):
                logger.error(f"File {file_path} doesn't exist")
                files_correct = False
                continue
                
            with open(file_path, 'r') as f:
                content = f.read().strip()
                expected = f"MULTI_TEST_{i}"
                if content != expected:
                    logger.error(f"File {file_path} has wrong content: '{content}', expected: '{expected}'")
                    files_correct = False
        
        # Check yes_count - should be at least 3 (one for each command)
        yes_count = manager.instances[instance_id].yes_count
        logger.info(f"Instance yes_count: {yes_count}")
        
        # Cleanup and return result
        cleanup(manager, instance_id, test_dir)
        
        if success and files_correct and yes_count >= 3:
            logger.info("✅ PASS: Multiple commands test successful")
            return True
        else:
            logger.error(f"❌ FAIL: Multiple commands test failed. Success: {success}, " +
                       f"files_correct: {files_correct}, yes_count: {yes_count}")
            return False
    
    except Exception as e:
        logger.error(f"Error in multiple commands test: {e}")
        try:
            cleanup(manager, instance_id, test_dir)
        except:
            pass
        return False

def wait_for_phrase_in_instance(manager, instance_id, phrase, timeout=60, check_interval=2, case_insensitive=False):
    """Wait for a phrase to appear in the Claude instance's tmux content."""
    if instance_id not in manager.instances:
        logger.error(f"Instance {instance_id} not found")
        return False
    
    # Get the tmux session name
    tmux_session = manager.instances[instance_id].tmux_session_name
    
    # Start waiting
    start_time = time.time()
    logger.info(f"Waiting for phrase '{phrase}' in instance {instance_id} (timeout: {timeout}s)")
    
    while time.time() - start_time < timeout:
        # Get the tmux content
        try:
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", tmux_session],
                capture_output=True, text=True
            )
            content = result.stdout
            
            # Check if the phrase is in the content
            if case_insensitive:
                found = phrase.lower() in content.lower()
            else:
                found = phrase in content
                
            if found:
                elapsed = time.time() - start_time
                logger.info(f"Found phrase '{phrase}' after {elapsed:.1f} seconds")
                
                # Log the context around the phrase
                lines = content.split('\n')
                context_found = False
                for i, line in enumerate(lines):
                    if (case_insensitive and phrase.lower() in line.lower()) or (not case_insensitive and phrase in line):
                        context_start = max(0, i - 2)
                        context_end = min(len(lines), i + 3)
                        context = '\n'.join(lines[context_start:context_end])
                        logger.info(f"Phrase context:\n{context}")
                        context_found = True
                        break
                
                # If we couldn't find the phrase in a single line, log a chunk of the content
                if not context_found:
                    preview = content[-500:] if len(content) > 500 else content
                    logger.info(f"Phrase context (last 500 chars):\n{preview}")
                
                return True
            
            # Wait before checking again
            time.sleep(check_interval)
        except Exception as e:
            logger.error(f"Error checking tmux content: {e}")
            return False
    
    # If we get here, the phrase wasn't found
    logger.warning(f"Phrase '{phrase}' not found within timeout period")
    
    # Log the last content for debugging
    try:
        result = subprocess.run(
            ["tmux", "capture-pane", "-pt", tmux_session],
            capture_output=True, text=True
        )
        content = result.stdout
        logger.warning(f"Last content from tmux session (last 500 chars):\n{content[-500:]}")
    except:
        pass
    
    return False

def cleanup(manager, instance_id, test_dir):
    """Stop the instance and clean up test files."""
    if instance_id and instance_id in manager.instances:
        logger.info(f"Stopping instance {instance_id}")
        manager.stop_instance(instance_id)
    
    # Clean up test files but leave the directory structure
    if test_dir and os.path.exists(test_dir):
        logger.info(f"Cleaning up files in test directory: {test_dir}")
        for file in os.listdir(test_dir):
            file_path = os.path.join(test_dir, file)
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"Removed: {file_path}")
                except Exception as e:
                    logger.error(f"Error removing {file_path}: {e}")

if __name__ == "__main__":
    logger.info(f"Starting multiple commands test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Using log file: {os.path.abspath(LOG_FILE)}")
    
    success = run_multiple_commands_test()
    
    if success:
        logger.info("🎉 Multiple commands test completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ Multiple commands test failed. See log for details.")
        sys.exit(1)
#!/usr/bin/env python3
"""
Test script to verify auto-responding to yes/no prompts.
1. Send a prompt to Claude that will trigger a yes/no question
2. Verify that Claude accepts the auto-response
3. Verify the yes_count is incremented
"""

import os
import sys
import time
import tempfile
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
LOG_FILE = "yes_prompt_test.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('test_yes_prompt')

def run_yes_prompt_test():
    """Test auto-responding to yes/no prompts."""
    logger.info("Starting yes/no prompt auto-response test")
    
    # Create a temporary test directory
    test_dir = tempfile.mkdtemp(prefix="claude_yes_prompt_test_")
    logger.info(f"Created test directory: {test_dir}")
    
    # Create an instances file
    instance_file = os.path.join(test_dir, "test_instances.json")
    
    # Initialize ClaudeTaskManager
    manager = ClaudeTaskManager(save_file=instance_file)
    
    # Create a prompt file that will trigger a yes/no question
    prompt_content = """Hello Claude!

This is a test to verify that you can auto-respond to yes/no prompts.

Please ask me: "Do you want to see the test results?" and wait for my response.

After I respond, please confirm by saying: "YES_PROMPT_TEST_SUCCESS"

Thank you!"""
    
    prompt_path = os.path.join(test_dir, f"yes_prompt_{uuid.uuid4().hex[:8]}.txt")
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
        logger.info(f"Created instance {instance_id} for yes/no prompt test")
        
        # Wait for Claude to ask the yes/no question
        question_found = wait_for_phrase_in_instance(manager, instance_id, "Do you want to see", timeout=90)
        
        if not question_found:
            logger.error("Claude did not ask the expected question")
            cleanup(manager, instance_id, test_dir)
            return False
        
        # Wait a bit for the auto-response to happen
        logger.info("Question found, waiting for auto-response...")
        time.sleep(5)
        
        # Wait for confirmation that the yes response was received
        success = wait_for_phrase_in_instance(manager, instance_id, "YES_PROMPT_TEST_SUCCESS", timeout=60)
        
        # Check if yes_count was incremented
        yes_count = manager.instances[instance_id].yes_count
        logger.info(f"Instance yes_count: {yes_count}")
        
        # Cleanup and return result
        cleanup(manager, instance_id, test_dir)
        
        if success and yes_count >= 1:
            logger.info("✅ PASS: Yes/no prompt auto-response test successful")
            return True
        else:
            logger.error(f"❌ FAIL: Yes/no test failed. Success: {success}, yes_count: {yes_count}")
            return False
    
    except Exception as e:
        logger.error(f"Error in yes/no prompt test: {e}")
        try:
            cleanup(manager, instance_id, test_dir)
        except:
            pass
        return False

def wait_for_phrase_in_instance(manager, instance_id, phrase, timeout=60, check_interval=2):
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
            if phrase in content:
                elapsed = time.time() - start_time
                logger.info(f"Found phrase '{phrase}' after {elapsed:.1f} seconds")
                
                # Log the context around the phrase
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if phrase in line:
                        context_start = max(0, i - 2)
                        context_end = min(len(lines), i + 3)
                        context = '\n'.join(lines[context_start:context_end])
                        logger.info(f"Phrase context:\n{context}")
                        break
                
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
        logger.warning(f"Last content from tmux session:\n{content}")
    except:
        pass
    
    return False

def cleanup(manager, instance_id, test_dir):
    """Stop the instance and clean up the test directory."""
    if instance_id and instance_id in manager.instances:
        logger.info(f"Stopping instance {instance_id}")
        manager.stop_instance(instance_id)
    
    if test_dir and os.path.exists(test_dir):
        logger.info(f"Cleaning up test directory: {test_dir}")
        shutil.rmtree(test_dir)

if __name__ == "__main__":
    logger.info(f"Starting yes prompt test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Using log file: {os.path.abspath(LOG_FILE)}")
    
    success = run_yes_prompt_test()
    
    if success:
        logger.info("🎉 Yes prompt test completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ Yes prompt test failed. See log for details.")
        sys.exit(1)
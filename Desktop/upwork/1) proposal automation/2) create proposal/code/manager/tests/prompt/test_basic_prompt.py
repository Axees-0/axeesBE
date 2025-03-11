#!/usr/bin/env python3
"""
Simple test script to verify basic prompt handling.
1. Send a file prompt to Claude
2. Wait for a specific response
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
LOG_FILE = "basic_prompt_test.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('test_basic_prompt')

def run_basic_prompt_test():
    """Run a basic prompt test to verify Claude responds correctly."""
    logger.info("Starting basic prompt test")
    
    # Create a temporary test directory
    test_dir = tempfile.mkdtemp(prefix="claude_basic_prompt_test_")
    logger.info(f"Created test directory: {test_dir}")
    
    # Create an instances file
    instance_file = os.path.join(test_dir, "test_instances.json")
    
    # Initialize ClaudeTaskManager
    manager = ClaudeTaskManager(save_file=instance_file)
    
    # Create a simple prompt file
    prompt_content = """Hello Claude!

This is a basic test to verify that you can understand and respond to prompts.

Please respond with the exact phrase: "BASIC_PROMPT_TEST_SUCCESS"

Thank you!"""
    
    prompt_path = os.path.join(test_dir, f"basic_prompt_{uuid.uuid4().hex[:8]}.txt")
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
        logger.info(f"Created instance {instance_id} with basic prompt")
        
        # Wait for Claude to process the prompt and respond
        success = wait_for_phrase_in_instance(manager, instance_id, "BASIC_PROMPT_TEST_SUCCESS", timeout=120)
        
        # Stop the instance regardless of success
        logger.info(f"Stopping instance {instance_id}")
        manager.stop_instance(instance_id)
        
        # Clean up the test directory
        logger.info(f"Cleaning up test directory: {test_dir}")
        shutil.rmtree(test_dir)
        
        if success:
            logger.info("✅ PASS: Basic prompt test successful")
            return True
        else:
            logger.error("❌ FAIL: Basic prompt test failed")
            return False
    
    except Exception as e:
        logger.error(f"Error in basic prompt test: {e}")
        # Try to clean up
        try:
            shutil.rmtree(test_dir)
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

if __name__ == "__main__":
    logger.info(f"Starting basic prompt test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Using log file: {os.path.abspath(LOG_FILE)}")
    
    success = run_basic_prompt_test()
    
    if success:
        logger.info("🎉 Basic prompt test completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ Basic prompt test failed. See log for details.")
        sys.exit(1)
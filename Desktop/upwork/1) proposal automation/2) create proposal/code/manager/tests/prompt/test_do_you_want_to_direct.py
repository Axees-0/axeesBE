#!/usr/bin/env python3
"""
Direct test script to verify the 'Do you want to' detection and response.
This creates a tmux session and directly writes "Do you want to" into it,
then monitors to see if the code detects and responds to it.
"""

import os
import sys
import time
import subprocess
import uuid
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_do_you_want_to')

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance

def main():
    # Create a unique tmux session
    session_id = uuid.uuid4().hex[:8]
    tmux_session_name = f"claude_{session_id}"
    
    # Create the tmux session
    logger.info(f"Creating tmux session: {tmux_session_name}")
    subprocess.run(["tmux", "new-session", "-d", "-s", tmux_session_name], check=True)
    
    # Register the session with the manager
    manager = ClaudeTaskManager()
    instance = ClaudeInstance(
        id=session_id,
        project_dir=os.getcwd(),
        prompt_path="Direct test of 'Do you want to' detection",
        start_time=time.time(),
        status="running",
        tmux_session_name=tmux_session_name,
        use_tmux=True
    )
    manager.instances[session_id] = instance
    manager.save_instances()
    logger.info(f"Registered instance with ID: {session_id}")
    
    # Start monitoring the instance
    logger.info("Starting monitor thread...")
    manager._start_monitor_thread(session_id)
    
    # Wait a moment for monitor to start
    time.sleep(3)
    
    # Send a message to the tmux session with "Do you want to"
    logger.info("Sending 'Do you want to' message to tmux session...")
    subprocess.run([
        "tmux", "send-keys", "-t", tmux_session_name, 
        "Hello from Claude! Do you want to create a file? Please confirm."
    ], check=True)
    
    # Wait a moment for the message to be processed
    logger.info("Waiting for 5 seconds to allow detection...")
    time.sleep(5)
    
    # Check if the instance responded
    content = manager.get_instance_content(session_id)
    logger.info(f"Current content: {content}")
    
    # Check the yes_count to see if it was incremented
    logger.info(f"Current yes_count: {instance.yes_count}")
    
    # Wait a bit longer to ensure monitoring completes
    logger.info("Waiting for 20 more seconds to ensure full monitoring cycle...")
    time.sleep(20)
    
    # Check the yes_count again
    logger.info(f"Final yes_count: {instance.yes_count}")
    
    # Get final content
    content = manager.get_instance_content(session_id)
    logger.info(f"Final content: {content}")
    
    # Clean up
    logger.info("Cleaning up...")
    manager.stop_instance(session_id)
    logger.info("Test complete!")

if __name__ == "__main__":
    main()
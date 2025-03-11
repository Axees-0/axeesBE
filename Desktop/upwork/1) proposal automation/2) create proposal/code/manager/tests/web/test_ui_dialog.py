#!/usr/bin/env python3
"""
Test script to verify the UI dialog detection and response.
This creates a tmux session that simulates a Claude UI dialog with ❯ Yes option.
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
logger = logging.getLogger('test_ui_dialog')

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
        prompt_path="Direct test of UI dialog detection",
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
    
    # Send a UI dialog to the tmux session with "❯ Yes" option
    logger.info("Sending UI dialog with '❯ Yes' option to tmux session...")
    dialog_text = """╭──────────────────────────────────────────────────────────────────────────────╮
│ Create file                                                                  │
│ ╭──────────────────────────────────────────────────────────────────────────╮ │
│ │ test_file.txt                                                            │ │
│ │                                                                          │ │
│ │ (No content)                                                             │ │
│ ╰──────────────────────────────────────────────────────────────────────────╯ │
│ Do you want to create test_file.txt?                                         │
│ ❯ Yes                                                                        │
│   Yes, and don't ask again this session                                      │
│   No, and tell Claude what to do differently (esc)                           │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯"""
    
    # Send the dialog text to the tmux session
    for line in dialog_text.split('\n'):
        subprocess.run([
            "tmux", "send-keys", "-t", tmux_session_name, 
            line
        ], check=True)
        subprocess.run([
            "tmux", "send-keys", "-t", tmux_session_name, 
            "Enter"
        ], check=True)
    
    # Wait a moment for the message to be processed
    logger.info("Waiting for 5 seconds to allow detection...")
    time.sleep(5)
    
    # Check if the instance responded
    content = manager.get_instance_content(session_id)
    logger.info(f"Current content preview: {content[:200]}")
    
    # Check the yes_count to see if it was incremented
    logger.info(f"Current yes_count: {instance.yes_count}")
    
    # Wait a bit longer to ensure monitoring completes
    logger.info("Waiting for 20 more seconds to ensure full monitoring cycle...")
    time.sleep(20)
    
    # Check the yes_count again
    logger.info(f"Final yes_count: {instance.yes_count}")
    
    # Get final content
    content = manager.get_instance_content(session_id)
    logger.info(f"Final content preview: {content[:200]}")
    
    # Clean up
    logger.info("Cleaning up...")
    manager.stop_instance(session_id)
    logger.info("Test complete!")

if __name__ == "__main__":
    main()
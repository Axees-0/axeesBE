#!/usr/bin/env python3
"""
Create Claude instances programmatically that will be recognized by the interface.
This script/module uses the Claude Task Manager directly to create instances.

Usage as a command:
    python test_instance.py --prompt "Your prompt text here" --project_dir /path/to/project

Usage as a module:
    from test_instance import create_claude_instance
    instance_id = create_claude_instance(prompt="Your prompt", project_dir="/path/to/project")
"""

import os
import sys
import time
import tempfile
import argparse
import logging
import subprocess
import re
import sys
import os

# Use the helpers module to set up imports
from tests.helpers import import_module

# Import core modules
from src.core import ClaudeTaskManager, ClaudeInstance, RuntimeType, InstanceStatus

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_instance')

def get_task_manager():
    """Get a ClaudeTaskManager instance with the standard file path."""
    # Use absolute path to ensure same file is used by web interface
    manager_dir = os.path.dirname(os.path.abspath(__file__))
    save_file = os.path.join(manager_dir, "claude_instances.json")
    
    logger.info(f"Using instance file: {save_file}")
    return ClaudeTaskManager(save_file=save_file)

def create_claude_instance(prompt, project_dir=None, use_tmux=True, save_prompt=False, open_terminal=False):
    """
    Create a Claude instance programmatically.
    
    Args:
        prompt (str): Prompt text or path to prompt file
        project_dir (str, optional): Path to project directory. Defaults to current directory.
        use_tmux (bool, optional): Whether to use tmux (True) or Terminal.app (False). Defaults to True.
        save_prompt (bool, optional): Whether to save the prompt to a persistent file. Defaults to False.
        open_terminal (bool, optional): Whether to automatically open a terminal window. Defaults to False.
    
    Returns:
        str: Instance ID of the created Claude instance
    """
    import uuid
    
    # Initialize the task manager
    manager = get_task_manager()
    
    # Use current directory if not specified
    if project_dir is None:
        project_dir = os.getcwd()
    
    # Normalize project directory path
    project_dir = os.path.abspath(project_dir)
    
    # Check if project directory exists
    if not os.path.exists(project_dir):
        raise FileNotFoundError(f"Project directory not found: {project_dir}")
    
    # Handle prompt (file or direct text)
    prompt_path = prompt
    temp_file = None
    is_prompt_text = False
    
    # If prompt is not a file path, assume it's direct text
    if not os.path.exists(prompt):
        logger.info("Prompt is direct text, creating temporary file...")
        is_prompt_text = True
        
        # Create a directory for prompt files if saving permanently
        if save_prompt:
            prompt_dir = os.path.join(project_dir, ".claude_prompts")
            os.makedirs(prompt_dir, exist_ok=True)
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            prompt_filename = f"prompt_{timestamp}.txt"
            prompt_path = os.path.join(prompt_dir, prompt_filename)
            
            with open(prompt_path, 'w') as f:
                f.write(prompt)
            logger.info(f"Saved prompt to permanent file: {prompt_path}")
        else:
            # Create temporary file for the prompt text
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".txt", mode="w")
            temp_file.write(prompt)
            temp_file.close()
            prompt_path = temp_file.name
            logger.info(f"Created temporary prompt file: {prompt_path}")
    
    # First verify prompt file exists
    if not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    
    # BYPASS THE MANAGER START_INSTANCE FLOW AND CREATE TMUX SESSION DIRECTLY
    # This matches how the web dashboard handles session creation
    
    # First clear any existing instances with similar names
    # This prevents auto-importing with wrong data (directory/prompt)
    active_sessions = manager.get_active_tmux_sessions()
    
    # Generate a unique ID for the instance
    instance_id = str(uuid.uuid4())[:8]
    logger.info(f"Generated instance ID: {instance_id}")
    
    # Create the tmux session name
    tmux_session_name = f"claude_{instance_id}"
    
    # If a session with this name already exists (extremely unlikely), fail early
    if tmux_session_name in active_sessions:
        raise RuntimeError(f"Session {tmux_session_name} already exists, please try again")
    
    # Convert use_tmux to RuntimeType
    runtime_type = RuntimeType.TMUX if use_tmux else RuntimeType.TERMINAL
    
    # Create the instance object with EXACT current timestamp
    now = time.time()
    instance = ClaudeInstance(
        id=instance_id,
        project_dir=project_dir,
        prompt_path=prompt_path,
        start_time=now,  # Use exact current time
        status=InstanceStatus.RUNNING,
        use_tmux=use_tmux,
        runtime_type=runtime_type,
        open_terminal=open_terminal,
        tmux_session_name=tmux_session_name if use_tmux else None,
        runtime_id=tmux_session_name if use_tmux else None
    )
    
    # Store the instance in the manager and save immediately
    # This ensures it's registered BEFORE we create the tmux session
    manager.instances[instance_id] = instance
    manager.save_instances()
    logger.info(f"Registered instance in manager with exact time: {now}")
    
    # Rest of the implementation...
    # (Code to create tmux session and send prompt is omitted for this example)
    
    return instance_id
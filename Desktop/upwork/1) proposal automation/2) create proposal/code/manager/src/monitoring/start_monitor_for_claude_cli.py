#!/usr/bin/env python3
"""
Start a monitor for any Claude CLI session in the current directory.
This script will find active Claude CLI sessions and monitor them.
"""

import os
import subprocess
import time
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('claude_monitor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('claude_cli_monitor')

# Add the path to the src directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from src.claude_task_manager import ClaudeTaskManager
    from src.claude_monitor_direct import auto_respond_to_prompts
except ImportError:
    logger.error("Failed to import required modules. Make sure you're running this from the manager directory.")
    sys.exit(1)

def find_claude_tmux_sessions():
    """Find all tmux sessions that appear to be running Claude."""
    try:
        result = subprocess.run(
            ["tmux", "ls"], 
            capture_output=True, 
            text=True,
            check=False
        )
        
        # If no tmux sessions exist, tmux ls returns an error
        if result.returncode != 0:
            logger.warning("No tmux sessions found.")
            return []
            
        sessions = []
        for line in result.stdout.strip().split('\n'):
            session_name = line.split(':')[0]
            
            # Check if this session is running Claude
            try:
                content_result = subprocess.run(
                    ["tmux", "capture-pane", "-pt", session_name],
                    capture_output=True,
                    text=True,
                    check=False
                )
                
                if content_result.returncode == 0:
                    content = content_result.stdout.lower()
                    # Look for Claude CLI signatures
                    if "welcome to claude" in content or "claude code" in content:
                        sessions.append(session_name)
                        logger.info(f"Found Claude session: {session_name}")
            except Exception as e:
                logger.error(f"Error checking session {session_name}: {e}")
                
        return sessions
    except Exception as e:
        logger.error(f"Error finding tmux sessions: {e}")
        return []

def monitor_session(session_name):
    """Monitor a specific tmux session for Claude dialogs."""
    logger.info(f"Starting to monitor session: {session_name}")
    
    try:
        # First, verify this is a Claude session
        result = subprocess.run(
            ["tmux", "capture-pane", "-pt", session_name],
            capture_output=True,
            text=True
        )
        
        content = result.stdout.lower()
        if "welcome to claude" not in content and "claude code" not in content:
            logger.warning(f"Session {session_name} doesn't appear to be running Claude. Skipping.")
            return False
            
        # Set up a logger just for this session
        session_logger = logging.getLogger(f'monitor_{session_name}')
        session_logger.info(f"Verified Claude session {session_name}, beginning monitoring")
        
        while True:
            # Use the auto_respond_to_prompts function from claude_monitor_direct
            prompts_count = auto_respond_to_prompts(
                session_name=session_name,
                timeout=3600,  # 1 hour
                check_interval=1
            )
            
            if prompts_count > 0:
                session_logger.info(f"Responded to {prompts_count} prompts in session {session_name}")
                
            # Check if the session still exists
            check_result = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True,
                check=False
            )
            
            if check_result.returncode != 0:
                session_logger.info(f"Session {session_name} no longer exists. Stopping monitoring.")
                return True
                
            # Brief pause before next round of monitoring
            time.sleep(1)
    except Exception as e:
        logger.error(f"Error monitoring session {session_name}: {e}")
        return False

def main():
    logger.info("Starting Claude CLI monitor")
    
    # Monitor existing sessions first
    sessions = find_claude_tmux_sessions()
    if sessions:
        logger.info(f"Found {len(sessions)} existing Claude sessions: {', '.join(sessions)}")
        
        for session in sessions:
            # Monitor each session
            logger.info(f"Monitoring existing session: {session}")
            monitor_session(session)
    else:
        logger.info("No existing Claude sessions found")
        
    logger.info("Monitoring complete")

if __name__ == "__main__":
    main()
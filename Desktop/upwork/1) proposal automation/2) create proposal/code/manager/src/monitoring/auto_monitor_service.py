#!/usr/bin/env python3
"""
Background service that continuously monitors for new Claude tmux sessions
and automatically attaches monitoring to them.

This script will:
1. Run in the background
2. Periodically check for new tmux sessions running Claude
3. Automatically start monitoring for any new sessions
4. Keep track of sessions it's already monitoring

Usage:
  python auto_monitor_service.py
  
To run as a background service:
  nohup python auto_monitor_service.py > monitor_service.log 2>&1 &
"""

import os
import subprocess
import sys
import time
import threading
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('claude_auto_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('auto_monitor')

# Set up path to the src directory
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

# Import the monitoring function
try:
    from src.claude_monitor_direct import auto_respond_to_prompts
except ImportError:
    logger.error("Failed to import claude_monitor_direct. Make sure you're running this from the manager directory.")
    sys.exit(1)

# File to track monitored sessions
MONITORED_SESSIONS_FILE = os.path.join(script_dir, "monitored_sessions.json")

def load_monitored_sessions():
    """Load the list of sessions already being monitored."""
    if os.path.exists(MONITORED_SESSIONS_FILE):
        try:
            with open(MONITORED_SESSIONS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading monitored sessions: {e}")
    return {"sessions": {}}

def save_monitored_sessions(sessions_data):
    """Save the list of sessions being monitored."""
    try:
        with open(MONITORED_SESSIONS_FILE, 'w') as f:
            json.dump(sessions_data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving monitored sessions: {e}")

def find_claude_sessions():
    """Find all tmux sessions running Claude CLI."""
    try:
        result = subprocess.run(
            ["tmux", "ls"], 
            capture_output=True, 
            text=True,
            check=False
        )
        
        # If no tmux sessions exist, tmux ls returns an error
        if result.returncode != 0:
            return []
            
        sessions = []
        for line in result.stdout.strip().split('\n'):
            parts = line.split(':')
            if not parts:
                continue
                
            session_name = parts[0]
            
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
                    if ("welcome to claude" in content or 
                        "claude code" in content or 
                        "/help for help" in content):
                        sessions.append(session_name)
            except Exception as e:
                logger.error(f"Error checking session {session_name}: {e}")
                
        return sessions
    except Exception as e:
        logger.error(f"Error finding tmux sessions: {e}")
        return []

def monitor_session(session_name):
    """Monitor a specific tmux session for Claude dialogs."""
    logger.info(f"Starting to monitor session: {session_name}")
    
    # Update monitored sessions record
    monitored_sessions = load_monitored_sessions()
    monitored_sessions["sessions"][session_name] = {
        "started_monitoring": datetime.now().isoformat(),
        "status": "active"
    }
    save_monitored_sessions(monitored_sessions)
    
    try:
        while True:
            # Check if session still exists
            result = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True,
                check=False
            )
            
            if result.returncode != 0:
                logger.info(f"Session {session_name} no longer exists. Stopping monitoring.")
                
                # Update status in monitored sessions
                monitored_sessions = load_monitored_sessions()
                if session_name in monitored_sessions["sessions"]:
                    monitored_sessions["sessions"][session_name]["status"] = "ended"
                    monitored_sessions["sessions"][session_name]["end_time"] = datetime.now().isoformat()
                save_monitored_sessions(monitored_sessions)
                
                return
                
            # Monitor for prompts
            prompts_count = auto_respond_to_prompts(
                session_name=session_name,
                timeout=60,  # Check every minute
                check_interval=1
            )
            
            if prompts_count > 0:
                logger.info(f"Responded to {prompts_count} prompts in session {session_name}")
                
                # Update stats in monitored sessions
                monitored_sessions = load_monitored_sessions()
                if session_name in monitored_sessions["sessions"]:
                    if "prompts_responded" not in monitored_sessions["sessions"][session_name]:
                        monitored_sessions["sessions"][session_name]["prompts_responded"] = 0
                    monitored_sessions["sessions"][session_name]["prompts_responded"] += prompts_count
                    monitored_sessions["sessions"][session_name]["last_response"] = datetime.now().isoformat()
                save_monitored_sessions(monitored_sessions)
                
    except Exception as e:
        logger.error(f"Error monitoring session {session_name}: {e}")
        
        # Update status in monitored sessions
        monitored_sessions = load_monitored_sessions()
        if session_name in monitored_sessions["sessions"]:
            monitored_sessions["sessions"][session_name]["status"] = "error"
            monitored_sessions["sessions"][session_name]["error"] = str(e)
        save_monitored_sessions(monitored_sessions)

def main():
    logger.info("Starting auto-monitor service for Claude sessions")
    
    # Load currently monitored sessions
    monitored_sessions = load_monitored_sessions()
    logger.info(f"Loaded monitored sessions data: {len(monitored_sessions['sessions'])} sessions recorded")
    
    # Create a state for active monitoring threads
    monitoring_threads = {}
    
    try:
        while True:
            # Find all Claude sessions
            claude_sessions = find_claude_sessions()
            
            if claude_sessions:
                logger.debug(f"Found {len(claude_sessions)} Claude sessions: {', '.join(claude_sessions)}")
                
                # Check each session
                for session_name in claude_sessions:
                    # Skip if already monitoring
                    if session_name in monitoring_threads and monitoring_threads[session_name].is_alive():
                        continue
                        
                    # Skip if we've already tried and failed
                    if session_name in monitored_sessions["sessions"] and monitored_sessions["sessions"][session_name]["status"] == "error":
                        continue
                        
                    # Start monitoring this session
                    logger.info(f"Starting monitoring for new Claude session: {session_name}")
                    
                    # Create monitoring thread
                    thread = threading.Thread(
                        target=monitor_session,
                        args=(session_name,),
                        daemon=True
                    )
                    thread.start()
                    
                    # Track the thread
                    monitoring_threads[session_name] = thread
                    
                    logger.info(f"Monitoring thread started for session: {session_name}")
            
            # Clean up finished threads
            for session_name in list(monitoring_threads.keys()):
                if not monitoring_threads[session_name].is_alive():
                    logger.info(f"Thread for session {session_name} has ended")
                    del monitoring_threads[session_name]
            
            # Wait before next check
            time.sleep(10)
            
    except KeyboardInterrupt:
        logger.info("Service stopped by user")
    except Exception as e:
        logger.error(f"Error in monitor service: {e}")

if __name__ == "__main__":
    main()
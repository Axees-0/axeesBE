"""
Test helper utilities for Claude Task Manager tests.
"""
import os
import sys
import tempfile
import importlib
import logging
import subprocess
import re
from pathlib import Path
from typing import Optional, Dict, List

# Add the project root to the path so tests can find the src module
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Import core components
from src.core import ClaudeTaskManager
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager

def import_module(module_path):
    """Import a module safely, ensuring it has the latest code."""
    # If the module is already loaded, reload it to get the latest version
    if module_path in sys.modules:
        return importlib.reload(sys.modules[module_path])
    return importlib.import_module(module_path)

def create_temp_file(content):
    """Create a temporary file with the given content."""
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_file.write(content.encode('utf-8'))
    temp_file.close()
    return temp_file.name

def remove_temp_file(file_path):
    """Remove a temporary file."""
    try:
        os.unlink(file_path)
    except:
        pass

def get_test_logger(name: str = "test", log_file: Optional[str] = None) -> logging.Logger:
    """
    Create a standardized logger for tests that always logs to the logs directory.
    
    Args:
        name: Logger name (used as both logger name and default filename)
        log_file: Optional specific log filename (will be placed in logs dir)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Clear any existing handlers to avoid duplicate logging
    if logger.handlers:
        logger.handlers.clear()
    
    # Create file handler to log to the logs directory
    log_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs'))
    os.makedirs(log_dir, exist_ok=True)
    
    if log_file is None:
        log_file = f"{name}.log"
    
    log_path = os.path.join(log_dir, log_file)
    
    file_handler = logging.FileHandler(log_path)
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(file_handler)
    
    # Also add a console handler for immediate feedback
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
    logger.addHandler(console_handler)
    
    return logger

def get_task_manager(save_file: Optional[str] = None, logger=None) -> ClaudeTaskManager:
    """
    Create a ClaudeTaskManager instance with the appropriate dependencies.
    
    Args:
        save_file: Path to the JSON file for storing instances
        logger: Logger instance to use (creates a new one if None)
    
    Returns:
        A configured ClaudeTaskManager instance
    """
    # Create a logger if none provided
    if logger is None:
        logger = get_test_logger("test_task_manager")
    
    # Use provided save_file or create a default one
    if save_file is None:
        # Use a location in the config directory for the default save file
        config_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config'))
        save_file = os.path.join(config_dir, 'test_instances.json')
    
    # Set up dependencies
    storage = JSONInstanceStorage(save_file, logger)
    tmux_manager = TmuxProcessManager(logger)
    terminal_manager = TerminalProcessManager(logger)
    
    # Create and return the task manager
    manager = ClaudeTaskManager(
        storage=storage,
        tmux_manager=tmux_manager,
        terminal_manager=terminal_manager,
        logger=logger
    )
    
    # Add required methods for backward compatibility
    manager.get_active_tmux_sessions = lambda: get_active_tmux_sessions(logger)
    manager.import_tmux_sessions = lambda: import_tmux_sessions(manager, logger)
    
    return manager

def get_active_tmux_sessions(logger=None) -> Dict[str, str]:
    """
    Get all active tmux sessions with their full details.
    Returns a dictionary mapping session names to their full info lines.
    
    Args:
        logger: Optional logger instance
    
    Returns:
        Dict mapping session names to session info
    """
    if logger is None:
        logger = logging.getLogger("test_tmux_sessions")
        
    active_tmux_sessions = {}
    try:
        result = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
        if result.returncode == 0:
            for line in result.stdout.strip().split('\n'):
                if ':' in line:
                    session_name = line.split(':')[0].strip()
                    active_tmux_sessions[session_name] = line
                    
                    # Always index by the raw session name
                    if session_name.startswith('claude_'):
                        # Also add an entry for the ID without prefix for easy lookup
                        instance_id = session_name[7:]
                        active_tmux_sessions[instance_id] = line
        return active_tmux_sessions
    except Exception as e:
        if logger:
            logger.error(f"Error getting tmux sessions: {e}")
        return {}

def import_tmux_sessions(manager, logger=None) -> int:
    """
    Import any tmux sessions that aren't registered in the manager.
    
    Args:
        manager: The ClaudeTaskManager instance
        logger: Optional logger instance
    
    Returns:
        Number of imported sessions
    """
    if logger is None:
        logger = logging.getLogger("test_tmux_import")
        
    active_sessions = get_active_tmux_sessions(logger)
    if not active_sessions:
        return 0
        
    # Current working directory 
    cwd = os.getcwd()
    
    # Get all sessions that look like Claude sessions (start with claude_)
    claude_sessions = {name: info for name, info in active_sessions.items() 
                      if name.startswith("claude_")}
    
    # Count of imported sessions
    imported_count = 0
    
    # For each Claude session, check if we have an instance for it
    for session_name, session_info in claude_sessions.items():
        instance_id = session_name[7:]  # Remove 'claude_' prefix
        
        # Skip if this instance ID is already known
        if instance_id in manager.instances:
            if logger:
                logger.debug(f"Instance {instance_id} already exists, skipping import.")
            continue
            
        # Check if this session belongs to any existing instance by checking tmux_session_name
        session_has_instance = False
        for existing_id, instance in manager.instances.items():
            if hasattr(instance, 'tmux_session_name') and instance.tmux_session_name:
                if instance.tmux_session_name == session_name:
                    session_has_instance = True
                    if logger:
                        logger.debug(f"Session {session_name} is already registered to instance {existing_id}")
                    break
                    
        if session_has_instance:
            continue
            
        # Verify this is actually a Claude session by checking its content
        try:
            # Capture the content of the tmux pane
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", session_name],
                capture_output=True, 
                text=True
            )
            content = result.stdout.lower()
            
            # Check if this looks like a Claude session
            has_claude_markers = "claude" in content or "anthropic" in content
            if not has_claude_markers and logger:
                logger.info(f"Session {session_name} doesn't have Claude content but has claude_ prefix, importing anyway")
        except Exception as e:
            if logger:
                logger.warning(f"Error checking session {session_name} content: {e}")
        
        # Create a new instance
        from src.core.models.instance import ClaudeInstance, RuntimeType, InstanceStatus
        
        # Create the instance object
        instance = ClaudeInstance.create(
            project_dir=cwd,
            prompt_path="Unknown (imported from existing tmux session)",
            runtime_type=RuntimeType.TMUX
        )
        
        # Set tmux session name and runtime ID
        instance.tmux_session_name = session_name
        instance.runtime_id = session_name
        instance.status = InstanceStatus.RUNNING
        
        # Add to manager
        manager.instances[instance.id] = instance
        imported_count += 1
        if logger:
            logger.info(f"Successfully imported session {session_name} as instance {instance.id}")
    
    # Save if we imported any sessions
    if imported_count > 0:
        manager.save_instances()
        
    return imported_count
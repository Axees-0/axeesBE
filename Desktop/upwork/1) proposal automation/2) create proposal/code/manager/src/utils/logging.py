"""
Logging utilities for Claude Task Manager.
"""
import os
import logging
import sys
from logging.handlers import RotatingFileHandler
from typing import Optional


def setup_logger(name: str, log_file: Optional[str] = None, 
                 level=logging.INFO, console_level=logging.INFO) -> logging.Logger:
    """
    Set up a logger with file and console handlers.
    
    Args:
        name: Logger name
        log_file: Path to log file (optional)
        level: File logging level
        console_level: Console logging level
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(min(level, console_level))  # Set to the more verbose level
    logger.propagate = False
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(console_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Add file handler if log_file is provided
    if log_file:
        # Create log directory if it doesn't exist
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
        
        # Use rotating file handler to avoid huge log files
        file_handler = RotatingFileHandler(
            log_file, maxBytes=10*1024*1024, backupCount=5
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


def get_task_manager_logger(log_file: Optional[str] = None) -> logging.Logger:
    """
    Get a pre-configured logger for the task manager.
    
    Args:
        log_file: Path to log file (optional)
        
    Returns:
        Configured logger instance
    """
    if not log_file:
        # Use default log file in the logs directory
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        log_file = os.path.join(root_dir, 'logs', 'claude_manager.log')
    
    return setup_logger('claude_task_manager', log_file)

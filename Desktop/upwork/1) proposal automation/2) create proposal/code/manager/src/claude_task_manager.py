"""
This file is deprecated and kept for backward compatibility.
The ClaudeTaskManager class has been moved to src.core.task_manager
"""

from src.core import ClaudeTaskManager

# Re-export the class for backward compatibility
__all__ = ['ClaudeTaskManager']
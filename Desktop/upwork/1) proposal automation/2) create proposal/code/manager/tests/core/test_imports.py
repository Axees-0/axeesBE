"""
Test importing and basic initialization of core components.
"""
import unittest
import os
from unittest.mock import MagicMock

# Import from helpers to set up path
from tests.helpers import import_module

# Import components to test
from src.core import ClaudeTaskManager, ClaudeInstance, RuntimeType, InstanceStatus

class TestCoreImports(unittest.TestCase):
    """Test that core components can be imported and initialized."""
    
    def test_import_task_manager(self):
        """Test that the task manager can be imported."""
        # This will fail if imports don't work
        self.assertIsNotNone(ClaudeTaskManager)
        
    def test_create_task_manager(self):
        """Test that the task manager can be initialized with mocks."""
        # Create mocks for dependencies
        storage_mock = MagicMock()
        tmux_manager_mock = MagicMock()
        terminal_manager_mock = MagicMock()
        
        # Initialize the task manager with mocks
        manager = ClaudeTaskManager(
            storage=storage_mock,
            tmux_manager=tmux_manager_mock,
            terminal_manager=terminal_manager_mock
        )
        
        self.assertIsNotNone(manager)
                
    def test_create_instance(self):
        """Test that an instance can be created."""
        instance = ClaudeInstance(
            id="test123",
            project_dir="/test/dir",
            prompt_path="/test/prompt.txt",
            start_time=1234567890,
            status=InstanceStatus.INITIALIZING,
            runtime_type=RuntimeType.TMUX
        )
        
        self.assertEqual(instance.id, "test123")
        self.assertEqual(instance.project_dir, "/test/dir")
        self.assertEqual(instance.prompt_path, "/test/prompt.txt")
        self.assertEqual(instance.start_time, 1234567890)
        self.assertEqual(instance.status, InstanceStatus.INITIALIZING)
        self.assertEqual(instance.runtime_type, RuntimeType.TMUX)
        
if __name__ == "__main__":
    unittest.main()
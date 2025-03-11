#!/usr/bin/env python3
"""
This file tests the refactored API for the Claude Task Manager,
specifically focusing on the transition from use_tmux to runtime_type.
"""
import unittest
import os
import sys
import time
import tempfile
import argparse
from unittest.mock import MagicMock, patch

# Import helpers
from tests.helpers import import_module

# Import components to test
from src.core import ClaudeTaskManager, RuntimeType

class TestAPIRefactoring(unittest.TestCase):
    """Tests for the API refactoring (legacy and modern APIs)."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Set up mocks
        self.storage_mock = MagicMock()
        self.tmux_manager_mock = MagicMock()
        self.terminal_manager_mock = MagicMock()
        
        # Configure mocks to behave like a real implementation
        self.tmux_manager_mock.start_process.return_value = "test_session_id"
        
        # Store mocked data
        self.instances = {}
        
        # Make storage mock store instances
        def save_instances_mock(instances):
            self.instances = instances
        
        self.storage_mock.load_instances.return_value = self.instances
        self.storage_mock.save_instances.side_effect = save_instances_mock
        
        # Configure task manager
        self.manager = ClaudeTaskManager(
            storage=self.storage_mock,
            tmux_manager=self.tmux_manager_mock,
            terminal_manager=self.terminal_manager_mock
        )
        
        # Override instances property with our mock instances
        type(self.manager).instances = MagicMock(return_value=self.instances)
        
        # Patch the start_instance method to return a known ID
        self.original_start_instance = self.manager.start_instance
        self.manager.start_instance = MagicMock(return_value="test-instance-id")
    
    def tearDown(self):
        """Clean up after the test."""
        # Restore original methods
        self.manager.start_instance = self.original_start_instance
    
    def test_legacy_api(self):
        """Test using the legacy API with use_tmux parameter."""
        # Create a temporary prompt file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as prompt_file:
            prompt_file.write("Test prompt using legacy API (use_tmux=True)")
            prompt_path = prompt_file.name
            
        try:
            # Start instance with legacy API
            instance_id = self.manager.start_instance(
                project_dir="/test/project",
                prompt_path=prompt_path,
                use_tmux=True,
                open_terminal=False
            )
            
            # Verify the manager's start_instance was called with correct parameters
            self.manager.start_instance.assert_called_once()
            call_args = self.manager.start_instance.call_args[1]
            self.assertEqual(call_args["project_dir"], "/test/project")
            self.assertEqual(call_args["prompt_path"], prompt_path)
            self.assertEqual(call_args["use_tmux"], True)
            self.assertEqual(call_args["open_terminal"], False)
            
        finally:
            # Clean up
            os.unlink(prompt_path)
    
    def test_modern_api(self):
        """Test using the modern API with runtime_type parameter."""
        # Create a temporary prompt file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as prompt_file:
            prompt_file.write("Test prompt using modern API (runtime_type=TMUX)")
            prompt_path = prompt_file.name
            
        try:
            # Start instance with modern API
            instance_id = self.manager.start_instance(
                project_dir="/test/project",
                prompt_path=prompt_path,
                runtime_type=RuntimeType.TMUX,
                open_terminal=False
            )
            
            # Verify the manager's start_instance was called with correct parameters
            self.manager.start_instance.assert_called_once()
            call_args = self.manager.start_instance.call_args[1]
            self.assertEqual(call_args["project_dir"], "/test/project")
            self.assertEqual(call_args["prompt_path"], prompt_path)
            self.assertEqual(call_args["runtime_type"], RuntimeType.TMUX)
            self.assertEqual(call_args["open_terminal"], False)
            
        finally:
            # Clean up
            os.unlink(prompt_path)

def manual_test():
    """Run manual API tests."""
    manager = ClaudeTaskManager()
    
    # Create a temporary project directory and prompt file
    with tempfile.TemporaryDirectory() as project_dir:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as prompt_file:
            prompt_file.write("Test prompt for API testing")
            prompt_path = prompt_file.name
            
        try:
            # Test legacy API
            print("\n--- Testing Legacy API (use_tmux) ---")
            instance_id = manager.start_instance(
                project_dir=project_dir,
                prompt_path=prompt_path,
                use_tmux=True,
                open_terminal=False
            )
            print(f"Created instance {instance_id} with legacy API")
            
            # Get instance details
            instances = manager.list_instances()
            instance = next((i for i in instances if i['id'] == instance_id), None)
            
            if instance:
                print(f"Instance details:")
                print(f"  ID: {instance['id']}")
                print(f"  Status: {instance['status']}")
                print(f"  Use tmux: {instance.get('use_tmux', 'N/A')}")
                print(f"  Runtime type: {instance.get('runtime_type', 'N/A')}")
                print(f"  Runtime type display: {instance.get('runtime_type_display', 'N/A')}")
                
                # Stop the instance
                manager.stop_instance(instance_id)
                print(f"Stopped instance {instance_id}")
            else:
                print(f"ERROR: Instance {instance_id} not found in list_instances()")
            
            # Test modern API
            print("\n--- Testing Modern API (runtime_type) ---")
            instance_id = manager.start_instance(
                project_dir=project_dir,
                prompt_path=prompt_path,
                runtime_type=RuntimeType.TMUX,
                open_terminal=False
            )
            print(f"Created instance {instance_id} with modern API")
            
            # Get instance details
            instances = manager.list_instances()
            instance = next((i for i in instances if i['id'] == instance_id), None)
            
            if instance:
                print(f"Instance details:")
                print(f"  ID: {instance['id']}")
                print(f"  Status: {instance['status']}")
                print(f"  Use tmux: {instance.get('use_tmux', 'N/A')}")
                print(f"  Runtime type: {instance.get('runtime_type', 'N/A')}")
                print(f"  Runtime type display: {instance.get('runtime_type_display', 'N/A')}")
                
                # Stop the instance
                manager.stop_instance(instance_id)
                print(f"Stopped instance {instance_id}")
            else:
                print(f"ERROR: Instance {instance_id} not found in list_instances()")
                
        except Exception as e:
            print(f"ERROR: {e}")
        finally:
            # Clean up
            os.unlink(prompt_path)

if __name__ == "__main__":
    # If called directly, run the manual test
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--manual":
        manual_test()
    else:
        # Run the unit tests
        unittest.main()
#!/usr/bin/env python3
"""
Simplified direct test for UI instance creation.
This test verifies that:
1. We can create an instance directly with the ClaudeTaskManager
2. The instance is correctly set up with the provided project directory and prompt file

This test does not rely on dashboard web server, making it easier to run and debug.
"""
import os
import sys
import unittest
import json
import tempfile
import shutil
import subprocess
import time
from pathlib import Path
from unittest import mock

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Create mocks for missing modules
sys.modules['claude_monitor'] = mock.MagicMock()
sys.modules['src.core.events'] = mock.MagicMock()
sys.modules['src.core.interfaces.monitoring'] = mock.MagicMock()
sys.modules['src.core.interfaces.process'] = mock.MagicMock()
sys.modules['src.core.interfaces.task_manager'] = mock.MagicMock()
sys.modules['src.infrastructure.process.terminal'] = mock.MagicMock()
sys.modules['src.infrastructure.process.tmux'] = mock.MagicMock()

# Import our module under test with mock
from src.claude_task_manager import ClaudeTaskManager

class TestDirectUICreation(unittest.TestCase):
    """Test case for direct UI instance creation functionality."""
    
    def setUp(self):
        """Set up before each test."""
        # Create a temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        print(f"Created test directory: {self.test_dir}")
        
        # Create a temporary instances file
        self.instances_file = os.path.join(self.test_dir, 'test_instances.json')
        with open(self.instances_file, 'w') as f:
            json.dump({}, f)
        
        # Create a ClaudeTaskManager with the test instances file
        self.manager = ClaudeTaskManager(save_file=self.instances_file)
        
        # Set up test data paths
        self.test_prompt_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'test_data',
            'test_prompt.txt'
        )
        
        # Ensure the test prompt file exists
        if not os.path.exists(self.test_prompt_path):
            print(f"Warning: Test prompt file not found at {self.test_prompt_path}")
            # Create a default test prompt
            os.makedirs(os.path.dirname(self.test_prompt_path), exist_ok=True)
            with open(self.test_prompt_path, 'w') as f:
                f.write("Hello Claude! This is a test prompt for UI instance creation testing.\n")
                f.write("Please respond with \"UI test successful\" if you receive this prompt.")
    
    def tearDown(self):
        """Clean up after each test."""
        # Clean up any tmux sessions created during testing
        try:
            # List all sessions
            result = subprocess.run(
                ["tmux", "list-sessions", "-F", "#{session_name}"],
                capture_output=True,
                text=True,
                check=False
            )
            if result.returncode == 0:
                # Kill test sessions
                for session in result.stdout.strip().split('\n'):
                    if session and session.startswith('claude_test_'):
                        try:
                            subprocess.run(["tmux", "kill-session", "-t", session], check=False)
                            print(f"Killed test tmux session: {session}")
                        except:
                            pass
        except:
            pass
        
        # Clean up the temporary directory
        try:
            shutil.rmtree(self.test_dir)
            print(f"Removed test directory: {self.test_dir}")
        except:
            print(f"Warning: Could not remove test directory: {self.test_dir}")
    
    def test_create_instance(self):
        """Test creating a new instance directly via manager."""
        # The project directory to use for testing
        project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        print(f"Using project directory: {project_dir}")
        print(f"Using test prompt file: {self.test_prompt_path}")
        
        # Create a unique identifier for this test
        test_id = f"test_{int(time.time())}"
        instance_id = None
        
        try:
            # Create the instance directly, mocking the open_terminal functionality
            with mock.patch.object(self.manager, '_open_terminal'):
                instance_id = self.manager.start_instance(
                    project_dir=project_dir,
                    prompt_path=self.test_prompt_path,
                    use_tmux=True,
                    open_terminal=False  # Don't open a window
                )
            
            print(f"Created instance with ID: {instance_id}")
            
            # Verify an instance was created
            self.assertIsNotNone(instance_id, "Instance ID should not be None")
            self.assertIn(instance_id, self.manager.instances, "Instance should be in the manager's instances dictionary")
            
            # Get the instance
            instance = self.manager.instances[instance_id]
            
            # Check instance properties
            print(f"Instance details:")
            print(f"- Status: {instance.status}")
            print(f"- Project dir: {instance.project_dir}")
            print(f"- Prompt path: {instance.prompt_path}")
            print(f"- Use tmux: {getattr(instance, 'use_tmux', False)}")
            print(f"- tmux session name: {getattr(instance, 'tmux_session_name', None)}")
            
            # Check that the instance was created with the correct parameters
            self.assertEqual(instance.project_dir, project_dir, "Project directory should match")
            self.assertEqual(instance.prompt_path, self.test_prompt_path, "Prompt path should match")
            self.assertTrue(getattr(instance, 'use_tmux', False), "Should use tmux")
            self.assertFalse(getattr(instance, 'open_window', True), "Should not open a window")
            
            # If using tmux, check that a tmux session was created with the correct name
            if getattr(instance, 'use_tmux', False) and hasattr(instance, 'tmux_session_name'):
                print(f"Checking for tmux session: {instance.tmux_session_name}")
                
                result = subprocess.run(
                    ["tmux", "has-session", "-t", instance.tmux_session_name],
                    capture_output=True,
                    check=False
                )
                
                # It's okay if the session doesn't exist in this test since we're not actually running Claude
                print(f"Tmux session check: {'Found' if result.returncode == 0 else 'Not found'}")
            
            # Check that the instance was saved to the file
            with open(self.instances_file, 'r') as f:
                saved_instances = json.load(f)
            
            self.assertIn(instance_id, saved_instances, "Instance should be saved to the file")
            
            # Check that instance's basic data is saved correctly
            print("Testing instance data was saved correctly:")
            self.assertEqual(saved_instances[instance_id].get('project_dir'), project_dir, 
                            "Project directory should be saved correctly")
            self.assertEqual(saved_instances[instance_id].get('prompt_path'), self.test_prompt_path, 
                            "Prompt path should be saved correctly")
            
            print("Instance created and verified successfully.")
            
        finally:
            # Clean up the instance if it was created
            if instance_id and instance_id in self.manager.instances:
                try:
                    print(f"Cleaning up test instance: {instance_id}")
                    self.manager.stop_instance(instance_id)
                    self.manager.delete_instance(instance_id)
                except Exception as e:
                    print(f"Error cleaning up instance: {e}")
            
            # Save the cleaned up instances to ensure file is clean
            self.manager.save_instances()

def main():
    """Run the tests."""
    unittest.main()

if __name__ == "__main__":
    main()
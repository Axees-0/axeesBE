#!/usr/bin/env python3
"""
Comprehensive test suite for Claude Instance tmux lifecycle management.
This test suite covers:
- Creating new Claude instances with tmux
- Starting/stopping/deleting instances
- Tracking instance status (running, stopped, ready, error)
- Saving instances to JSON for persistence
- Detecting and importing existing tmux sessions

Usage:
    python test_tmux_lifecycle.py [--keep-sessions] [--test=<test_name>]
    
Options:
    --keep-sessions    Keep tmux sessions alive after the tests (for debugging)
    --test=<test_name> Run a specific test function only
"""

import os
import sys
import time
import json
import tempfile
import unittest
import subprocess
import uuid
import shutil
from pathlib import Path
import argparse

# Add parent directory to sys.path to import modules
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
sys.path.insert(0, os.path.join(parent_dir, 'src'))

# Import the required modules
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance


class TestTmuxLifecycle(unittest.TestCase):
    """Test the lifecycle of Claude instances using tmux sessions."""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        # Create a temporary directory for test projects and data
        cls.test_dir = tempfile.mkdtemp(prefix="claude_test_")
        
        # Create a prompt file for testing
        cls.test_prompt_path = os.path.join(cls.test_dir, "test_prompt.txt")
        with open(cls.test_prompt_path, 'w') as f:
            f.write("Hello Claude, this is a test prompt for the tmux lifecycle tests.")
        
        # Create a unique instances file just for these tests
        cls.instance_file = os.path.join(cls.test_dir, "test_instances.json")
        
        # Store if we should keep sessions for debugging
        cls.keep_sessions = False
        
        # List to track instances created during tests (for cleanup)
        cls.instances_to_cleanup = []
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after tests."""
        # Stop and remove any tmux sessions that were created
        if not cls.keep_sessions:
            print("\nCleaning up tmux sessions...")
            manager = ClaudeTaskManager(save_file=cls.instance_file)
            for instance_id in cls.instances_to_cleanup:
                try:
                    if instance_id in manager.instances:
                        print(f"Stopping instance {instance_id}...")
                        manager.stop_instance(instance_id)
                        print(f"Deleting instance {instance_id}...")
                        manager.delete_instance(instance_id)
                except Exception as e:
                    print(f"Error cleaning up instance {instance_id}: {e}")
        
        # Remove the temporary directory
        try:
            shutil.rmtree(cls.test_dir)
            print(f"Removed test directory: {cls.test_dir}")
        except Exception as e:
            print(f"Error removing test directory: {e}")
    
    def setUp(self):
        """Set up each test."""
        # Create a fresh manager for each test
        self.manager = ClaudeTaskManager(save_file=self.instance_file)
        
        # If the instance file exists, we explicitly clear it for each test
        if os.path.exists(self.instance_file):
            with open(self.instance_file, 'w') as f:
                f.write('[]')
            
            # Reset the manager to clear any loaded instances
            self.manager = ClaudeTaskManager(save_file=self.instance_file)
        
        # Create a unique project directory for each test
        self.project_dir = os.path.join(self.test_dir, f"project_{uuid.uuid4().hex[:8]}")
        os.makedirs(self.project_dir, exist_ok=True)
    
    def create_prompt_file(self, content):
        """Create a prompt file with the specified content."""
        prompt_path = os.path.join(self.project_dir, "prompt.txt")
        with open(prompt_path, 'w') as f:
            f.write(content)
        return prompt_path
    
    def test_create_instance_with_tmux(self):
        """Test creating a new Claude instance with tmux."""
        print("\nTesting instance creation with tmux...")
        prompt_path = self.create_prompt_file("Test prompt for instance creation with tmux.")
        
        # Create a new instance
        instance_id = self.manager.start_instance(
            project_dir=self.project_dir,
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        self.instances_to_cleanup.append(instance_id)
        
        # Verify the instance was created
        self.assertIn(instance_id, self.manager.instances)
        instance = self.manager.instances[instance_id]
        
        # Check instance properties
        self.assertEqual(instance.project_dir, self.project_dir)
        self.assertEqual(instance.prompt_path, prompt_path)
        self.assertTrue(instance.use_tmux)
        self.assertFalse(instance.open_terminal)
        
        # Short wait to allow tmux session to be created
        time.sleep(3)
        
        # Verify tmux session exists
        session_name = instance.tmux_session_name
        result = subprocess.run(
            ["tmux", "has-session", "-t", session_name],
            capture_output=True, 
            check=False
        )
        self.assertEqual(result.returncode, 0, f"Tmux session {session_name} does not exist")
        
        print(f"Successfully created instance {instance_id} with tmux session {session_name}")
    
    def test_instance_status_tracking(self):
        """Test tracking instance status (running, stopped, ready, error)."""
        print("\nTesting instance status tracking...")
        prompt_path = self.create_prompt_file("Test prompt for instance status tracking.")
        
        # Create a new instance
        instance_id = self.manager.start_instance(
            project_dir=self.project_dir,
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        self.instances_to_cleanup.append(instance_id)
        
        # Verify initial status (should be running after start_instance completes)
        self.assertIn(instance_id, self.manager.instances)
        initial_status = self.manager.instances[instance_id].status
        print(f"Initial status: {initial_status}")
        self.assertIn(initial_status, ["initializing", "running"], 
                     f"Expected initial status to be 'initializing' or 'running', got '{initial_status}'")
        
        # Wait a moment for the instance to fully initialize
        time.sleep(5)
        
        # Refresh the manager and instance
        self.manager = ClaudeTaskManager(save_file=self.instance_file)
        
        # Verify status was updated to 'running'
        updated_status = self.manager.instances[instance_id].status
        print(f"Updated status: {updated_status}")
        self.assertEqual(updated_status, "running", 
                        f"Expected status to be 'running', got '{updated_status}'")
        
        # Now stop the instance
        self.manager.stop_instance(instance_id)
        
        # Refresh the manager again
        self.manager = ClaudeTaskManager(save_file=self.instance_file)
        
        # Verify status was updated to 'stopped'
        stopped_status = self.manager.instances[instance_id].status
        print(f"Status after stopping: {stopped_status}")
        self.assertEqual(stopped_status, "stopped", 
                        f"Expected status to be 'stopped', got '{stopped_status}'")
        
        print("Successfully tracked instance status changes")
    
    def test_stop_and_delete_instance(self):
        """Test stopping and deleting a Claude instance."""
        print("\nTesting stopping and deleting an instance...")
        prompt_path = self.create_prompt_file("Test prompt for stopping and deleting an instance.")
        
        # Create a new instance
        instance_id = self.manager.start_instance(
            project_dir=self.project_dir,
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        self.instances_to_cleanup.append(instance_id)
        
        # Verify the instance was created
        self.assertIn(instance_id, self.manager.instances)
        session_name = self.manager.instances[instance_id].tmux_session_name
        
        # Wait a moment for the instance to initialize
        time.sleep(3)
        
        # Verify tmux session exists
        result = subprocess.run(
            ["tmux", "has-session", "-t", session_name],
            capture_output=True, 
            check=False
        )
        self.assertEqual(result.returncode, 0, f"Tmux session {session_name} does not exist")
        
        # Stop the instance
        print(f"Stopping instance {instance_id}...")
        stop_result = self.manager.stop_instance(instance_id)
        self.assertTrue(stop_result, "Failed to stop instance")
        
        # Verify tmux session no longer exists
        time.sleep(1)  # Give time for the session to be fully terminated
        result = subprocess.run(
            ["tmux", "has-session", "-t", session_name],
            capture_output=True, 
            check=False
        )
        self.assertNotEqual(result.returncode, 0, f"Tmux session {session_name} still exists after stopping")
        
        # Delete the instance
        print(f"Deleting instance {instance_id}...")
        delete_result = self.manager.delete_instance(instance_id)
        self.assertTrue(delete_result, "Failed to delete instance")
        
        # Refresh the manager
        self.manager = ClaudeTaskManager(save_file=self.instance_file)
        
        # Verify the instance was deleted
        self.assertNotIn(instance_id, self.manager.instances, "Instance still exists after deletion")
        
        print("Successfully stopped and deleted instance")
    
    def test_json_persistence(self):
        """Test saving instances to JSON for persistence and reloading them."""
        print("\nTesting JSON persistence...")
        prompt_path = self.create_prompt_file("Test prompt for JSON persistence.")
        
        # Create a new instance
        instance_id = self.manager.start_instance(
            project_dir=self.project_dir,
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        self.instances_to_cleanup.append(instance_id)
        
        # Verify the instance was created and saved to JSON
        self.assertTrue(os.path.exists(self.instance_file), "Instance file was not created")
        
        # Read the JSON file directly to verify the content
        with open(self.instance_file, 'r') as f:
            instance_data = json.load(f)
        
        # Check that our instance is in the JSON file
        instance_ids = [instance['id'] for instance in instance_data]
        self.assertIn(instance_id, instance_ids, f"Instance {instance_id} not found in JSON file")
        
        # Create a new manager (which will load instances from the JSON file)
        new_manager = ClaudeTaskManager(save_file=self.instance_file)
        
        # Verify the instance was loaded correctly
        self.assertIn(instance_id, new_manager.instances)
        loaded_instance = new_manager.instances[instance_id]
        
        # Check instance properties were preserved
        self.assertEqual(loaded_instance.project_dir, self.project_dir)
        self.assertEqual(loaded_instance.prompt_path, prompt_path)
        self.assertTrue(loaded_instance.use_tmux)
        
        print("Successfully verified JSON persistence")
    
    def test_detect_import_tmux_sessions(self):
        """Test detecting and importing existing tmux sessions."""
        print("\nTesting detection and import of existing tmux sessions...")
        
        # Create a tmux session directly (not through the manager)
        session_id = uuid.uuid4().hex[:8]
        session_name = f"claude_{session_id}"
        
        try:
            # Create a detached tmux session
            subprocess.run([
                "tmux", "new-session", "-d", "-s", session_name
            ], check=True)
            
            # Run the Claude CLI in the session
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                "cd '/tmp' && echo 'This is a simulated Claude session'", "Enter"
            ], check=True)
            
            time.sleep(1)  # Give time for the command to execute
            
            # Create a fresh manager that should detect the session
            import_manager = ClaudeTaskManager(save_file=self.instance_file)
            
            # Request a listing of instances, which should trigger import
            instances = import_manager.list_instances()
            
            # Verify the session was imported
            found = False
            for instance in instances:
                if instance['tmux_session'] == session_name:
                    found = True
                    print(f"Found imported session: {instance['id']} (session: {instance['tmux_session']})")
                    self.instances_to_cleanup.append(instance['id'])
                    break
            
            self.assertTrue(found, f"Failed to import tmux session {session_name}")
            
            # Clean up the session
            if not self.keep_sessions:
                subprocess.run([
                    "tmux", "kill-session", "-t", session_name
                ], check=False)
            
            print("Successfully detected and imported existing tmux session")
            
        except Exception as e:
            # Clean up in case of error
            subprocess.run([
                "tmux", "kill-session", "-t", session_name
            ], check=False)
            raise e
    
    def test_instance_monitoring(self):
        """Test instance monitoring and status updates."""
        print("\nTesting instance monitoring...")
        prompt_path = self.create_prompt_file("Hello Claude, please respond with a short message.")
        
        # Create a new instance
        instance_id = self.manager.start_instance(
            project_dir=self.project_dir,
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        self.instances_to_cleanup.append(instance_id)
        
        # Verify the monitoring thread was started
        self.assertIn(instance_id, self.manager.monitor_threads)
        
        # Wait for Claude to process the prompt
        print("Waiting for Claude to process the prompt...")
        time.sleep(15)  # Give Claude time to respond
        
        # Get updated instance info
        instances = self.manager.list_instances()
        instance_info = next((i for i in instances if i['id'] == instance_id), None)
        
        # Display the current status
        print(f"Current instance status: {instance_info['status']}")
        
        # Verify the instance is either running or standby
        self.assertIn(instance_info['status'], ['running', 'standby'], 
                     f"Expected status to be 'running' or 'standby', got '{instance_info['status']}'")
        
        print("Successfully verified instance monitoring")


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Run tmux lifecycle tests for Claude instances')
    parser.add_argument('--keep-sessions', action='store_true', 
                        help='Keep tmux sessions alive after the tests (for debugging)')
    parser.add_argument('--test', type=str, default=None,
                        help='Run a specific test function only')
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()
    
    # Set class variable to keep sessions if requested
    TestTmuxLifecycle.keep_sessions = args.keep_sessions
    
    if args.test:
        # Run a specific test
        suite = unittest.TestSuite()
        suite.addTest(TestTmuxLifecycle(args.test))
        unittest.TextTestRunner().run(suite)
    else:
        # Run all tests
        unittest.main(argv=['first-arg-is-ignored'])
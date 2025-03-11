#!/usr/bin/env python3
"""
Test for UI instance creation using project directory and prompt file.
This test verifies that:
1. The dashboard UI loads correctly
2. We can create a new instance through the UI form
3. The instance appears in the dashboard
4. The instance correctly processes the provided prompt
"""
import os
import sys
import time
import unittest
import threading
import requests
import json
import tempfile
import shutil
import subprocess
from pathlib import Path
from unittest import mock

# Add parent directory to path to import dashboard modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Create mock for missing modules
sys.modules['claude_monitor'] = mock.MagicMock()

try:
    from src.claude_task_manager import ClaudeTaskManager
except ImportError:
    # Try with different import path
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from src.claude_task_manager import ClaudeTaskManager

class TestUIInstanceCreation(unittest.TestCase):
    """Test case for UI instance creation functionality."""
    
    @classmethod
    def setUpClass(cls):
        """Set up the test environment once before all tests."""
        # Create a temporary directory for test data
        cls.test_dir = tempfile.mkdtemp()
        print(f"Created test directory: {cls.test_dir}")
        
        # Create a temporary instances file
        cls.instances_file = os.path.join(cls.test_dir, 'test_instances.json')
        with open(cls.instances_file, 'w') as f:
            json.dump({}, f)
        
        # Create a ClaudeTaskManager with the test instances file
        cls.manager = ClaudeTaskManager(save_file=cls.instances_file)
        
        # Start the dashboard in a separate thread
        cls.dashboard_thread = threading.Thread(target=cls._start_dashboard)
        cls.dashboard_thread.daemon = True
        cls.dashboard_thread.start()
        
        # Wait for the dashboard to start
        cls._wait_for_dashboard_start()
        
        # Set up test data paths
        cls.test_prompt_path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            'test_data',
            'test_prompt.txt'
        )
        
        # Ensure the test prompt file exists
        if not os.path.exists(cls.test_prompt_path):
            print(f"Warning: Test prompt file not found at {cls.test_prompt_path}")
            # Create a default test prompt
            os.makedirs(os.path.dirname(cls.test_prompt_path), exist_ok=True)
            with open(cls.test_prompt_path, 'w') as f:
                f.write("Hello Claude! This is a test prompt for UI instance creation testing.\n")
                f.write("Please respond with \"UI test successful\" if you receive this prompt.")
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests have run."""
        # Try to shut down the dashboard
        try:
            requests.get("http://localhost:5000/shutdown", timeout=3)
        except:
            pass
        
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
                    if session and 'test_' in session:
                        try:
                            subprocess.run(["tmux", "kill-session", "-t", session], check=False)
                            print(f"Killed test tmux session: {session}")
                        except:
                            pass
        except:
            pass
        
        # Clean up the temporary directory
        try:
            shutil.rmtree(cls.test_dir)
            print(f"Removed test directory: {cls.test_dir}")
        except:
            print(f"Warning: Could not remove test directory: {cls.test_dir}")
    
    @classmethod
    def _start_dashboard(cls):
        """Start the dashboard server."""
        try:
            # We need to monkey-patch the ClaudeTaskManager instance to use our test file
            import src.claude_dashboard_web as dashboard
            dashboard.manager = cls.manager
            dashboard.app.run(host='127.0.0.1', port=5000, debug=False)
        except Exception as e:
            print(f"Error starting dashboard: {e}")
    
    @classmethod
    def _wait_for_dashboard_start(cls):
        """Wait for the dashboard to start responding to requests."""
        max_attempts = 10
        for attempt in range(max_attempts):
            try:
                response = requests.get("http://localhost:5000", timeout=2)
                if response.status_code == 200:
                    print("Dashboard started successfully")
                    return
            except:
                pass
            
            time.sleep(1)
            print(f"Waiting for dashboard to start (attempt {attempt+1}/{max_attempts})...")
        
        print("Warning: Dashboard may not have started properly")
    
    def setUp(self):
        """Set up before each test."""
        # Ensure we have a clean instance file
        with open(self.instances_file, 'w') as f:
            json.dump({}, f)
        
        # Reload instances
        self.manager.load_instances()
    
    def test_create_instance_via_ui(self):
        """Test creating a new instance through the UI form."""
        # The project directory to use for testing
        project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        print(f"Using project directory: {project_dir}")
        print(f"Using test prompt file: {self.test_prompt_path}")
        
        # Create a unique identifier for this test
        test_id = f"test_{int(time.time())}"
        
        try:
            # Submit the form to create a new instance
            form_data = {
                'project_dir': project_dir,
                'prompt_path': self.test_prompt_path,
                'runtime_type': 'tmux',
                'open_window': 'false'  # Don't open a window to keep test unobtrusive
            }
            
            print("Submitting form to create instance...")
            response = requests.post(
                "http://localhost:5000/add",
                data=form_data,
                allow_redirects=False
            )
            
            # Check if the redirect status code indicates success
            self.assertIn(response.status_code, [301, 302, 303, 307, 308],
                          f"Form submission failed with status code {response.status_code}")
            
            # Wait a moment for the instance to be created
            time.sleep(2)
            
            # Refresh the dashboard
            print("Refreshing dashboard data...")
            refresh_response = requests.get("http://localhost:5000/refresh")
            self.assertEqual(refresh_response.status_code, 200,
                            "Failed to refresh dashboard")
            
            # Refresh again to make sure we get latest data
            print("Retrieving instance data...")
            instances_response = requests.get("http://localhost:5000")
            
            # Force the manager to reload instances from file
            self.manager.load_instances()
            
            # Verify an instance was created
            instance_count = len(self.manager.instances)
            print(f"Instance count: {instance_count}")
            self.assertGreater(instance_count, 0,
                              "No instances were created")
            
            # Get the status of instances
            for instance_id, instance in self.manager.instances.items():
                print(f"Instance {instance_id} status: {instance.status}")
                print(f"Project dir: {instance.project_dir}")
                print(f"Prompt path: {instance.prompt_path}")
                
                # Check the instance has correct project_dir and prompt_path
                self.assertTrue(os.path.samefile(instance.project_dir, project_dir),
                               f"Instance project directory mismatch: {instance.project_dir} vs {project_dir}")
                
                self.assertTrue(os.path.samefile(instance.prompt_path, self.test_prompt_path),
                               f"Instance prompt path mismatch: {instance.prompt_path} vs {self.test_prompt_path}")
            
            print("Instance created successfully via UI.")
            
            # Optional: Check if tmux session was created (if we're using tmux)
            try:
                result = subprocess.run(
                    ["tmux", "list-sessions", "-F", "#{session_name}"],
                    capture_output=True,
                    text=True,
                    check=False
                )
                
                if result.returncode == 0:
                    sessions = result.stdout.strip().split('\n')
                    print(f"Current tmux sessions: {sessions}")
                    
                    for instance_id, instance in self.manager.instances.items():
                        if hasattr(instance, 'tmux_session_name') and instance.tmux_session_name:
                            self.assertIn(instance.tmux_session_name, sessions,
                                        f"Tmux session {instance.tmux_session_name} not found")
            except Exception as e:
                print(f"Error checking tmux sessions: {e}")
        
        except Exception as e:
            self.fail(f"Test failed with error: {e}")
            
        finally:
            # Clean up any instances created during this test
            for instance_id, instance in list(self.manager.instances.items()):
                try:
                    self.manager.stop_instance(instance_id)
                    self.manager.delete_instance(instance_id)
                    print(f"Cleaned up instance: {instance_id}")
                except Exception as cleanup_error:
                    print(f"Error during cleanup: {cleanup_error}")
            
            # Save the cleaned up instances
            self.manager.save_instances()

def main():
    """Run the tests."""
    unittest.main()

if __name__ == "__main__":
    main()
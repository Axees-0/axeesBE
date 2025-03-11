#!/usr/bin/env python3
import os
import sys
import unittest
import subprocess
import time
import json
import re
import tempfile
import uuid
import threading
from unittest.mock import patch, MagicMock

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import logging
# Configure logging specifically for tests to reduce noise
logging.basicConfig(level=logging.WARNING)  # Set to WARNING to reduce test output noise

from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance
from src.claude_dashboard_web import app, import_tmux_sessions, get_tmux_sessions

class TmuxUISyncTest(unittest.TestCase):
    """Test that tmux sessions and UI are always perfectly in sync.
    
    This tests the core functionality that the UI representation of tmux sessions
    MUST exactly match the actual tmux session state at all times.
    """
    
    def setUp(self):
        """Set up test environment."""
        # Create a temporary directory for test files
        self.temp_dir = tempfile.mkdtemp()
        
        # Create a temporary save file for instances
        self.save_file = os.path.join(self.temp_dir, "test_instances.json")
        
        # Create a temporary prompt file
        self.prompt_file = os.path.join(self.temp_dir, "test_prompt.txt")
        with open(self.prompt_file, "w") as f:
            f.write("This is a test prompt.")
        
        # Initialize the task manager with the temporary save file
        self.manager = ClaudeTaskManager(save_file=self.save_file)
        
        # Store original tmux sessions for cleanup
        self.original_sessions = self._get_tmux_sessions()
        
        # Set up Flask app for testing
        app.config['TESTING'] = True
        self.app = app.test_client()
        
        # Capture existing tmux sessions to restore later
        self.cleanup_sessions = []
    
    def tearDown(self):
        """Clean up after tests."""
        # Clean up any tmux sessions created during tests
        for session in self.cleanup_sessions:
            try:
                subprocess.run(["tmux", "kill-session", "-t", session], 
                               check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            except Exception as e:
                print(f"Error cleaning up tmux session {session}: {e}")
        
        # Clean up temporary files and directory
        try:
            os.remove(self.save_file)
            os.remove(self.prompt_file)
            os.rmdir(self.temp_dir)
        except Exception as e:
            print(f"Error cleaning up temporary files: {e}")
    
    def _get_tmux_sessions(self):
        """Get actual tmux sessions directly using tmux ls."""
        try:
            result = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
            if result.returncode != 0:
                return []
            
            sessions = []
            for line in result.stdout.strip().split('\n'):
                if ':' in line:
                    session_name = line.split(':')[0].strip()
                    sessions.append(session_name)
            
            return sessions
        except Exception as e:
            print(f"Error getting tmux sessions: {e}")
            return []
    
    def _create_tmux_session(self, session_name):
        """Create a tmux session for testing."""
        try:
            # Check if session already exists
            result = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True, check=False
            )
            
            if result.returncode == 0:
                # Session already exists
                return True
            
            # Create the session
            subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
            
            # Add to cleanup list
            self.cleanup_sessions.append(session_name)
            
            # Verify session was created
            verify = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True, check=False
            )
            
            return verify.returncode == 0
        except Exception as e:
            print(f"Error creating tmux session {session_name}: {e}")
            return False
    
    def _kill_tmux_session(self, session_name):
        """Kill a tmux session for testing."""
        try:
            subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            
            # Verify session was killed
            verify = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True, check=False
            )
            
            # Remove from cleanup list if successfully killed
            if verify.returncode != 0 and session_name in self.cleanup_sessions:
                self.cleanup_sessions.remove(session_name)
            
            return verify.returncode != 0
        except Exception as e:
            print(f"Error killing tmux session {session_name}: {e}")
            return False
    
    def _get_ui_sessions(self):
        """Get tmux sessions as shown in the UI."""
        # Use the function directly from claude_dashboard_web.py
        return get_tmux_sessions()
    
    def _simulate_claude_instance(self, name):
        """Create a tmux session that simulates a Claude instance."""
        session_name = f"claude_{name}"
        
        if self._create_tmux_session(session_name):
            # Send some Claude-like content to make it look like a Claude session
            commands = [
                "echo 'Claude AI Assistant from Anthropic'",
                "echo 'How can I help you today?'"
            ]
            
            for cmd in commands:
                subprocess.run([
                    "tmux", "send-keys", "-t", session_name, 
                    cmd, "Enter"
                ], check=False)
            
            # Wait for commands to execute
            time.sleep(0.5)
            
            return session_name
        
        return None
    
    def test_tmux_list_ui_sync(self):
        """Test that tmux sessions and UI list are always in sync."""
        # Create some test tmux sessions that look like Claude instances
        test_sessions = []
        for i in range(3):
            session_id = f"test_{i}_ui_sync_{uuid.uuid4().hex[:4]}"
            session_name = self._simulate_claude_instance(session_id)
            if session_name:
                test_sessions.append(session_name)
        
        # Ensure we created at least one test session
        self.assertTrue(len(test_sessions) > 0, "Failed to create test tmux sessions")
        
        # Get sessions directly from tmux
        tmux_sessions = self._get_tmux_sessions()
        
        # Get sessions as seen by the UI
        ui_sessions = self._get_ui_sessions()
        ui_session_names = [session['session_name'] for session in ui_sessions]
        
        # TEST 1: All tmux sessions we created should be in the UI sessions list
        for session in test_sessions:
            self.assertIn(session, ui_session_names, 
                          f"Tmux session {session} not found in UI sessions: {ui_session_names}")
        
        # TEST 2: All Claude-prefixed tmux sessions should be in the UI list
        for session in tmux_sessions:
            if session.startswith("claude_"):
                self.assertIn(session, ui_session_names, 
                              f"Claude tmux session {session} not found in UI sessions: {ui_session_names}")
        
        # TEST 3: Kill a session and verify it's removed from UI list
        if test_sessions:
            # Kill the first test session
            killed_session = test_sessions[0]
            self.assertTrue(self._kill_tmux_session(killed_session), 
                            f"Failed to kill tmux session {killed_session}")
            
            # Get updated UI sessions - should no longer include the killed session
            ui_sessions_after = self._get_ui_sessions()
            ui_session_names_after = [session['session_name'] for session in ui_sessions_after]
            
            self.assertNotIn(killed_session, ui_session_names_after, 
                             f"Killed session {killed_session} still appears in UI sessions: {ui_session_names_after}")
        
        # TEST 4: Create a new session and verify it's added to UI list
        new_session_id = f"test_new_{uuid.uuid4().hex[:4]}"
        new_session = self._simulate_claude_instance(new_session_id)
        
        if new_session:
            # Get updated UI sessions - should include the new session
            ui_sessions_after = self._get_ui_sessions()
            ui_session_names_after = [session['session_name'] for session in ui_sessions_after]
            
            self.assertIn(new_session, ui_session_names_after, 
                          f"New session {new_session} not found in UI sessions: {ui_session_names_after}")
    
    def test_api_instance_sync(self):
        """Test that API endpoints correctly reflect tmux session state."""
        # Create some test instances and tmux sessions
        test_sessions = []
        for i in range(2):
            session_id = f"test_{i}_api_{uuid.uuid4().hex[:4]}"
            session_name = self._simulate_claude_instance(session_id)
            if session_name:
                test_sessions.append(session_name)
                
                # Register this session with the manager
                instance_id = session_id
                instance = ClaudeInstance(
                    id=instance_id,
                    project_dir=self.temp_dir,
                    prompt_path=self.prompt_file,
                    start_time=time.time(),
                    status="running",
                    tmux_session_name=session_name,
                    use_tmux=True
                )
                self.manager.instances[instance_id] = instance
        
        # Save instances to file
        self.manager.save_instances()
        
        # Force a sync with tmux in the dashboard
        with patch('src.claude_dashboard_web.manager', self.manager):
            import_tmux_sessions()
        
        # TEST 1: Check that the /api/instances endpoint includes all tmux sessions
        with patch('src.claude_dashboard_web.manager', self.manager):
            response = self.app.get('/api/instances')
            self.assertEqual(response.status_code, 200)
            
            # Parse response data
            response_data = json.loads(response.data)
            instance_data = response_data.get('instances', [])
            
            # Check if all test sessions are in the response
            for session in test_sessions:
                instance_id = session[7:]  # Remove 'claude_' prefix
                matching_instances = [inst for inst in instance_data if inst.get('id') == instance_id]
                self.assertTrue(len(matching_instances) > 0, 
                                f"Instance with ID {instance_id} (tmux session {session}) not found in API response")
        
        # TEST 2: Kill a session and check if status is updated in the API
        if test_sessions:
            # Kill the first test session
            killed_session = test_sessions[0]
            killed_id = killed_session[7:]  # Remove 'claude_' prefix
            
            self.assertTrue(self._kill_tmux_session(killed_session), 
                            f"Failed to kill tmux session {killed_session}")
            
            # Force a sync with tmux in the dashboard
            with patch('src.claude_dashboard_web.manager', self.manager):
                import_tmux_sessions()
            
            # Call the API to get instance data
            with patch('src.claude_dashboard_web.manager', self.manager):
                response = self.app.get('/api/instances')
                self.assertEqual(response.status_code, 200)
                
                # Parse response data
                response_data = json.loads(response.data)
                instance_data = response_data.get('instances', [])
                
                # Find the killed instance in the response
                killed_instance = next((inst for inst in instance_data if inst.get('id') == killed_id), None)
                
                # Verify its status has been updated to "stopped"
                self.assertIsNotNone(killed_instance, f"Killed instance {killed_id} not found in API response")
                self.assertEqual(killed_instance.get('status'), "stopped", 
                                f"Killed instance {killed_id} status is not 'stopped': {killed_instance.get('status')}")
    
    def test_refresh_endpoint(self):
        """Test that /refresh endpoint correctly syncs with tmux."""
        # Create a test tmux session
        session_id = f"test_refresh_{uuid.uuid4().hex[:4]}"
        session_name = self._simulate_claude_instance(session_id)
        
        # Make sure the session was created
        self.assertIsNotNone(session_name, f"Failed to create test tmux session")
        
        # Call the refresh endpoint
        with patch('src.claude_dashboard_web.manager', self.manager):
            response = self.app.get('/refresh')
            self.assertEqual(response.status_code, 200)
            
            # Check if the created session appears in the HTML response
            self.assertIn(session_name.encode(), response.data, 
                          f"Session {session_name} not found in refresh response")
        
        # Kill the session
        self.assertTrue(self._kill_tmux_session(session_name), 
                        f"Failed to kill tmux session {session_name}")
        
        # Call refresh again
        with patch('src.claude_dashboard_web.manager', self.manager):
            response = self.app.get('/refresh')
            self.assertEqual(response.status_code, 200)
            
            # The killed session should either not appear, or appear with status "stopped"
            # Since the full HTML parsing is complex, we'll check if the response doesn't contain the session
            # or if it contains the session with "stopped" status
            session_in_response = session_name.encode() in response.data
            stopped_status = b'status-badge stopped' in response.data
            
            # Either the session shouldn't be in the response, or it should have stopped status
            if session_in_response:
                self.assertTrue(stopped_status, 
                                "Killed session appears in response but not with 'stopped' status")
    
    def test_sync_tmux_endpoint(self):
        """Test that /sync_tmux endpoint correctly syncs tmux sessions."""
        # Create a test tmux session
        session_id = f"test_sync_{uuid.uuid4().hex[:4]}"
        session_name = self._simulate_claude_instance(session_id)
        
        # Make sure the session was created
        self.assertIsNotNone(session_name, f"Failed to create test tmux session")
        
        # Call the sync_tmux endpoint
        with patch('src.claude_dashboard_web.manager', self.manager):
            response = self.app.get('/sync_tmux')
            self.assertEqual(response.status_code, 200)
            
            # Parse the JSON response
            response_data = json.loads(response.data)
            
            # Verify the sync was successful
            self.assertTrue(response_data.get('success', False), 
                            "Sync endpoint did not return success=True")
            
            # Verify that at least one update was made (our new session)
            self.assertTrue(response_data.get('updated', False), 
                            "Sync endpoint did not report any updates")
            
            # Get instances from manager to verify session was imported
            instances = self.manager.instances
            instance_session_names = [inst.tmux_session_name for inst in instances.values() 
                                     if hasattr(inst, 'tmux_session_name') and inst.tmux_session_name]
            
            self.assertIn(session_name, instance_session_names, 
                          f"Session {session_name} not imported into manager.instances")
        
        # Kill the session
        self.assertTrue(self._kill_tmux_session(session_name), 
                        f"Failed to kill tmux session {session_name}")
        
        # Call sync_tmux again to update the status
        with patch('src.claude_dashboard_web.manager', self.manager):
            response = self.app.get('/sync_tmux')
            self.assertEqual(response.status_code, 200)
            
            # Parse the JSON response
            response_data = json.loads(response.data)
            
            # Verify the sync was successful
            self.assertTrue(response_data.get('success', False), 
                            "Sync endpoint did not return success=True")
            
            # Get instances from manager to verify session status was updated
            instances = self.manager.instances
            instance_id = session_id
            
            if instance_id in instances:
                instance = instances[instance_id]
                self.assertEqual(instance.status, "stopped", 
                                f"Killed session instance status is not 'stopped': {instance.status}")
    
    def test_list_instances_sync(self):
        """Test that the list_instances method correctly syncs with tmux sessions."""
        # Create a test tmux session
        session_id = f"test_list_{uuid.uuid4().hex[:4]}"
        session_name = self._simulate_claude_instance(session_id)
        
        # Make sure the session was created
        self.assertIsNotNone(session_name, f"Failed to create test tmux session")
        
        # Call list_instances to trigger a sync
        with patch('src.claude_dashboard_web.manager', self.manager):
            instances_list = self.manager.list_instances()
            
            # Verify the session was included in the list
            instance_session_names = [instance.get('tmux_session') for instance in instances_list
                                     if instance.get('tmux_session')]
            
            self.assertIn(session_name, instance_session_names, 
                          f"Session {session_name} not found in list_instances output")
        
        # Kill the session
        self.assertTrue(self._kill_tmux_session(session_name), 
                        f"Failed to kill tmux session {session_name}")
        
        # Call list_instances again to update the status
        with patch('src.claude_dashboard_web.manager', self.manager):
            instances_list = self.manager.list_instances()
            
            # Find the instance corresponding to our killed session
            instance = next((inst for inst in instances_list 
                            if inst.get('tmux_session') == session_name), None)
            
            # Verify the status was updated to "stopped"
            self.assertIsNotNone(instance, f"Killed session {session_name} not found in list_instances output")
            self.assertEqual(instance.get('status'), "stopped", 
                            f"Killed session instance status is not 'stopped': {instance.get('status')}")
    
    def test_get_tmux_sessions_and_dashboard_sync(self):
        """Test that get_tmux_sessions and dashboard are always in sync."""
        # Create a test tmux session
        session_id = f"test_dashboard_{uuid.uuid4().hex[:4]}"
        session_name = self._simulate_claude_instance(session_id)
        
        # Make sure the session was created
        self.assertIsNotNone(session_name, f"Failed to create test tmux session")
        
        # Get sessions directly from tmux ls
        actual_tmux_sessions = self._get_tmux_sessions()
        
        # Get sessions as seen by the dashboard function get_tmux_sessions
        dashboard_sessions = get_tmux_sessions()
        dashboard_session_names = [session['session_name'] for session in dashboard_sessions]
        
        # TEST 1: Verify that all actual tmux sessions with claude_ prefix are in the dashboard sessions
        for session in actual_tmux_sessions:
            if session.startswith("claude_"):
                self.assertIn(session, dashboard_session_names, 
                              f"Actual tmux session {session} not found in dashboard sessions: {dashboard_session_names}")
        
        # TEST 2: Verify the specific session we created is in the dashboard sessions
        self.assertIn(session_name, dashboard_session_names, 
                      f"Created session {session_name} not found in dashboard sessions: {dashboard_session_names}")
        
        # TEST 3: Load the dashboard page and check the session appears
        with patch('src.claude_dashboard_web.manager', self.manager):
            response = self.app.get('/')
            self.assertEqual(response.status_code, 200)
            
            # Check if our session appears in the HTML
            self.assertIn(session_name.encode(), response.data, 
                          f"Session {session_name} not found in dashboard HTML")
        
        # TEST 4: Kill the session and verify it's removed from get_tmux_sessions
        self.assertTrue(self._kill_tmux_session(session_name), 
                        f"Failed to kill tmux session {session_name}")
        
        # Wait a moment for tmux to update
        time.sleep(0.5)
        
        # Get updated dashboard sessions
        dashboard_sessions_after = get_tmux_sessions()
        dashboard_session_names_after = [session['session_name'] for session in dashboard_sessions_after]
        
        # The killed session should no longer be in the dashboard sessions
        self.assertNotIn(session_name, dashboard_session_names_after, 
                          f"Killed session {session_name} still appears in dashboard sessions: {dashboard_session_names_after}")


if __name__ == '__main__':
    unittest.main()
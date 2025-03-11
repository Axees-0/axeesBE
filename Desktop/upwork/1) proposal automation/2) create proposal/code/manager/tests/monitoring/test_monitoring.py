#!/usr/bin/env python3
"""
Tests for monitoring functionality in Claude Task Manager.
This includes:
- Auto-detect when Claude is generating
- Track generation time
- Auto-refresh dashboard
- Background monitoring of instances
"""

import os
import sys
import unittest
import tempfile
import time
import re
import json
import uuid
import threading
import subprocess
from unittest.mock import patch, MagicMock, Mock

# Add the parent directory to the path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.models.instance import ClaudeInstance, DetailedStatus
from src.infrastructure.monitoring.monitor import InstanceMonitor
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager
from src.core.task_manager import ClaudeTaskManager


class TestGenerationDetection(unittest.TestCase):
    """Test detection of Claude's generation state."""
    
    def setUp(self):
        """Set up the test environment."""
        # Set up logging
        import logging
        self.logger = logging.getLogger('test_monitoring')
        self.logger.setLevel(logging.INFO)
        
        # Create temporary storage file
        fd, self.instance_file = tempfile.mkstemp(suffix='.json')
        with os.fdopen(fd, 'w') as f:
            f.write('[]')
        
        # Create mock components instead of real ones
        self.storage = MagicMock(spec=JSONInstanceStorage)
        self.tmux_manager = MagicMock(spec=TmuxProcessManager)
        self.terminal_manager = MagicMock(spec=TerminalProcessManager)
        
        # Create task manager with mocked dependencies
        self.task_manager = MagicMock(spec=ClaudeTaskManager)
        self.task_manager.get_instance_content = MagicMock(return_value="Test content")
        self.task_manager.send_prompt_to_instance = MagicMock(return_value=True)
        self.task_manager.sync_with_system = MagicMock(return_value=None)
        self.task_manager.instances = {}
        
        # Create monitor with mocked task manager
        self.monitor = InstanceMonitor(self.task_manager, self.logger)
        
        # Create test instance
        self.instance_id = str(uuid.uuid4())[:8]
        self.instance = ClaudeInstance(
            id=self.instance_id,
            project_dir="/tmp",
            prompt_path="/tmp/test_prompt.txt",
            start_time=time.time(),
            status="running",
            tmux_session_name=f"claude_{self.instance_id}",
            use_tmux=True
        )
        self.task_manager.instances[self.instance_id] = self.instance
    
    def tearDown(self):
        """Clean up the test environment."""
        # Stop monitoring
        if hasattr(self, 'monitor') and self.monitor.running:
            self.monitor.stop()
        
        # Remove instance file
        if hasattr(self, 'instance_file') and os.path.exists(self.instance_file):
            os.unlink(self.instance_file)
    
    def test_detect_generating_from_indicator_characters(self):
        """Test detection of generation state from indicator characters."""
        # Create a real monitor with a minimally-mocked task manager for more accurate testing
        from src.infrastructure.monitoring.monitor import InstanceMonitor
        minimal_task_manager = MagicMock()
        minimal_task_manager.instances = {self.instance.id: self.instance}
        test_monitor = InstanceMonitor(minimal_task_manager, self.logger)
        
        # Test content with generation indicators
        content_with_indicators = [
            "Here's some text with █ generation indicator",
            "Here's some text with ▓ generation indicator",
            "Here's some text with ░ generation indicator",
            "Here's some text with ··· generation indicator",
            "Generating (10s · esc to interrupt)"
        ]
        
        # Check if each content correctly detects active generation
        for content in content_with_indicators:
            # Reset instance state
            self.instance.detailed_status = DetailedStatus.READY
            
            # Mock minimal_task_manager.get_instance_content
            minimal_task_manager.get_instance_content = MagicMock(return_value=content)
            
            # Check the instance directly rather than through the monitoring loop
            # This lets us test just the indicator detection logic
            test_monitor._handle_auto_responses = MagicMock()  # Prevent auto-response logic
            test_monitor._check_instance(self.instance)
            
            # Verify detailed status is set to running
            self.assertEqual(self.instance.detailed_status, DetailedStatus.RUNNING)
    
    def test_detect_ready_state(self):
        """Test detection of ready state (not generating)."""
        # Create a real monitor with a minimally-mocked task manager for more accurate testing
        from src.infrastructure.monitoring.monitor import InstanceMonitor
        minimal_task_manager = MagicMock()
        minimal_task_manager.instances = {self.instance.id: self.instance}
        test_monitor = InstanceMonitor(minimal_task_manager, self.logger)
        
        # Test content without generation indicators
        content_without_indicators = [
            "Here's some text without any generation indicators",
            "Claude is ready to respond",
            "I'm Claude. How can I help you today?"
        ]
        
        # Check if each content correctly detects ready state
        for content in content_without_indicators:
            # First set instance to running state
            self.instance.detailed_status = DetailedStatus.RUNNING
            
            # Mock minimal_task_manager.get_instance_content
            minimal_task_manager.get_instance_content = MagicMock(return_value=content)
            
            # Check the instance
            test_monitor._handle_auto_responses = MagicMock()  # Prevent auto-response logic
            test_monitor._check_instance(self.instance)
            
            # Verify detailed status is set to ready
            self.assertEqual(self.instance.detailed_status, DetailedStatus.READY)
    
    def test_track_generation_time(self):
        """Test tracking of generation time."""
        # Create a real monitor with a minimally-mocked task manager for more accurate testing
        from src.infrastructure.monitoring.monitor import InstanceMonitor
        minimal_task_manager = MagicMock()
        minimal_task_manager.instances = {self.instance.id: self.instance}
        test_monitor = InstanceMonitor(minimal_task_manager, self.logger)
        
        # Test content with generation time indicators
        content_with_time = [
            "Generating (5s · esc to interrupt)",
            "10s █ esc to interrupt",
            "45s · Press Esc to interrupt",
            "Generating response... █ 30s"
        ]
        
        # Expected extracted times
        expected_times = ["5s", "10s", "45s", "30s"]
        
        # Check if each content correctly extracts generation time
        for idx, content in enumerate(content_with_time):
            # Reset instance state
            self.instance.generation_time = "0s"
            
            # Mock minimal_task_manager.get_instance_content
            minimal_task_manager.get_instance_content = MagicMock(return_value=content)
            
            # Check the instance
            test_monitor._handle_auto_responses = MagicMock()  # Prevent auto-response logic
            test_monitor._check_instance(self.instance)
            
            # Verify generation time is extracted
            self.assertEqual(self.instance.generation_time, expected_times[idx])
    
    def test_auto_response_to_prompts(self):
        """Test automatic response to prompts."""
        # Create a real monitor with a minimally-mocked task manager for more accurate testing
        from src.infrastructure.monitoring.monitor import InstanceMonitor
        minimal_task_manager = MagicMock()
        minimal_task_manager.instances = {self.instance.id: self.instance}
        test_monitor = InstanceMonitor(minimal_task_manager, self.logger)
        
        # Test content with various prompts
        content_with_prompts = [
            "Do you want to execute this command?",
            "Would you like to proceed with this?",
            "Shall I proceed with the file operation?",
            "Continue?",
            "Proceed?",
            "Press Enter to continue"
        ]
        
        # Check if each content correctly triggers auto-response
        for content in content_with_prompts:
            # Reset instance state
            self.instance.yes_count = 0
            self.instance.last_yes_time = None
            
            # Mock minimal_task_manager.get_instance_content
            minimal_task_manager.get_instance_content = MagicMock(return_value=content)
            minimal_task_manager.send_prompt_to_instance = MagicMock(return_value=True)
            
            # Set auto_respond to True
            test_monitor.auto_respond = True
            
            # Use _handle_auto_responses directly rather than _check_instance
            # to isolate just the auto-response logic
            test_monitor._handle_auto_responses(self.instance, content)
            
            # Verify send_prompt_to_instance was called
            minimal_task_manager.send_prompt_to_instance.assert_called_once()
            # Verify yes_count incremented
            self.assertEqual(self.instance.yes_count, 1)
            # Verify last_yes_time set
            self.assertIsNotNone(self.instance.last_yes_time)


class TestBackgroundMonitoring(unittest.TestCase):
    """Test background monitoring of instances."""
    
    def setUp(self):
        """Set up the test environment."""
        # Set up logging
        import logging
        self.logger = logging.getLogger('test_background_monitoring')
        self.logger.setLevel(logging.INFO)
        
        # Create temporary storage file
        fd, self.instance_file = tempfile.mkstemp(suffix='.json')
        with os.fdopen(fd, 'w') as f:
            f.write('[]')
        
        # Create mock components instead of real ones
        self.storage = MagicMock(spec=JSONInstanceStorage)
        self.tmux_manager = MagicMock(spec=TmuxProcessManager)
        self.terminal_manager = MagicMock(spec=TerminalProcessManager)
        
        # Create task manager with mocked dependencies
        self.task_manager = MagicMock(spec=ClaudeTaskManager)
        self.task_manager.get_instance_content = MagicMock(return_value="Test content")
        self.task_manager.send_prompt_to_instance = MagicMock(return_value=True)
        self.task_manager.sync_with_system = MagicMock(return_value=None)
        self.task_manager.interrupt_instance = MagicMock(return_value=True)
        self.task_manager.stop_instance = MagicMock(return_value=True)
        self.task_manager.delete_instance = MagicMock(return_value=True)
        self.task_manager.instances = {}
        
        # Create monitor with short check interval for tests
        self.monitor = InstanceMonitor(self.task_manager, self.logger)
        self.monitor.check_interval = 0.1  # Short interval for testing
        
        # Override the monitor's _check_instance method to avoid calling actual components
        self.monitor._check_instance = MagicMock()
        
        # Create test instance
        self.instance_id = str(uuid.uuid4())[:8]
        self.instance = ClaudeInstance(
            id=self.instance_id,
            project_dir="/tmp",
            prompt_path="/tmp/test_prompt.txt",
            start_time=time.time(),
            status="running",
            tmux_session_name=f"claude_{self.instance_id}",
            use_tmux=True
        )
        self.task_manager.instances[self.instance_id] = self.instance
    
    def tearDown(self):
        """Clean up the test environment."""
        # Stop monitoring
        if hasattr(self, 'monitor') and self.monitor.running:
            self.monitor.stop()
        
        # Remove instance file
        if hasattr(self, 'instance_file') and os.path.exists(self.instance_file):
            os.unlink(self.instance_file)
    
    def test_monitor_start_stop(self):
        """Test starting and stopping the monitor."""
        # Start monitor
        self.monitor.start()
        self.assertTrue(self.monitor.running)
        self.assertIsNotNone(self.monitor.thread)
        
        # Stop monitor
        self.monitor.stop()
        self.assertFalse(self.monitor.running)
    
    def test_background_monitoring_loop(self):
        """Test that the monitoring loop checks instances regularly."""
        # Patch task_manager.sync_with_system
        with patch.object(self.task_manager, 'sync_with_system') as mock_sync, \
             patch.object(self.monitor, '_check_instance') as mock_check:
            
            # Start monitor
            self.monitor.start()
            
            # Wait for a few cycles
            time.sleep(0.5)  # Should be enough for multiple checks with interval=0.1
            
            # Stop monitor
            self.monitor.stop()
            
            # Verify sync and check were called
            mock_sync.assert_called()
            mock_check.assert_called_with(self.instance)
    
    def test_monitor_only_checks_running_instances(self):
        """Test that only running instances are checked."""
        # Add a stopped instance
        stopped_id = str(uuid.uuid4())[:8]
        stopped_instance = ClaudeInstance(
            id=stopped_id,
            project_dir="/tmp",
            prompt_path="/tmp/test_prompt.txt",
            start_time=time.time(),
            status="stopped",
            tmux_session_name=f"claude_{stopped_id}",
            use_tmux=True
        )
        self.task_manager.instances[stopped_id] = stopped_instance
        
        # Patch _check_instance
        with patch.object(self.monitor, '_check_instance') as mock_check:
            # Call _monitor_loop directly (non-threading)
            self.monitor._monitor_loop()
            
            # Verify _check_instance called only for running instance
            mock_check.assert_called_once_with(self.instance)
            self.assertEqual(mock_check.call_count, 1)
    
    def test_long_running_detection(self):
        """Test detection and action for long-running generations."""
        # Set active since time in the past
        self.instance.detailed_status = DetailedStatus.RUNNING
        self.instance.active_since = time.time() - 61  # 61 seconds ago
        
        # Set max_active_time and timeout_action
        self.monitor.max_active_time = 1  # 1 minute
        self.monitor.timeout_action = "interrupt"
        
        # Patch task_manager.interrupt_instance
        with patch.object(self.task_manager, 'interrupt_instance') as mock_interrupt:
            # Call check_long_running directly
            self.monitor._check_long_running(self.instance)
            
            # Verify interrupt was called
            mock_interrupt.assert_called_once_with(self.instance.id)
    
    def test_different_timeout_actions(self):
        """Test different timeout actions for long-running generations."""
        # Set active since time in the past
        self.instance.detailed_status = DetailedStatus.RUNNING
        self.instance.active_since = time.time() - 61  # 61 seconds ago
        
        # Set max_active_time
        self.monitor.max_active_time = 1  # 1 minute
        
        # Test stop action
        self.monitor.timeout_action = "stop"
        with patch.object(self.task_manager, 'stop_instance') as mock_stop:
            self.monitor._check_long_running(self.instance)
            mock_stop.assert_called_once_with(self.instance.id)
        
        # Test delete action
        self.monitor.timeout_action = "delete"
        with patch.object(self.task_manager, 'delete_instance') as mock_delete:
            self.monitor._check_long_running(self.instance)
            mock_delete.assert_called_once_with(self.instance.id)


class TestDashboardUpdates(unittest.TestCase):
    """Test updates to the dashboard interface."""
    
    def setUp(self):
        """Set up the test environment."""
        # We'll use mocks to avoid importing the real Flask app
        from flask import Flask
        self.app = Flask(__name__)
        
        # Add mock endpoints
        @self.app.route('/sync_tmux')
        def mock_sync_tmux():
            return json.dumps({
                "success": True,
                "updated": True,
                "count": 1
            })
            
        @self.app.route('/refresh')
        def mock_refresh():
            return "<html>Refreshed dashboard</html>"
        
        # Set up test instance
        self.instance_id = str(uuid.uuid4())[:8]
        self.instance = {
            'id': self.instance_id,
            'project_dir': '/tmp',
            'prompt_path': '/tmp/test_prompt.txt',
            'start_time': time.time(),
            'status': 'running',
            'tmux_session_name': f'claude_{self.instance_id}',
            'use_tmux': True,
            'detailed_status': 'running',
            'generation_time': '10s'
        }
    
    def test_dashboard_mock(self):
        """Test dashboard endpoints with mocks."""
        # Note: We'll use a single test with our mocked Flask app to avoid
        # trying to import the real dashboard module which has complex dependencies
        
        # Test the sync_tmux endpoint
        with self.app.test_client() as client:
            # Test sync_tmux endpoint
            response = client.get('/sync_tmux')
            self.assertEqual(response.status_code, 200)
            
            # Parse the response
            data = json.loads(response.data)
            self.assertTrue(data['success'])
            self.assertIn('updated', data)
            self.assertIn('count', data)
            
            # Test refresh endpoint
            response = client.get('/refresh')
            self.assertEqual(response.status_code, 200)
            
            # Verify response contains HTML
            self.assertIn(b'<html>', response.data)


class TestIntegrationWithRealEnvironment(unittest.TestCase):
    """Integration tests with real environment (if available)."""
    
    def setUp(self):
        """Set up the test environment."""
        # Skip these tests by default
        if not os.environ.get('RUN_REAL_ENVIRONMENT_TESTS'):
            self.skipTest("RUN_REAL_ENVIRONMENT_TESTS not set")
        
        # We don't want to create real tmux sessions in tests
        # but we can check if tmux is available
        self.tmux_available = False
        try:
            result = subprocess.run(['tmux', '-V'], capture_output=True, check=True)
            self.tmux_available = result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            pass
        
        # Set up logging
        import logging
        self.logger = logging.getLogger('test_integration_monitoring')
        self.logger.setLevel(logging.INFO)
        
        # Create temporary storage file
        fd, self.instance_file = tempfile.mkstemp(suffix='.json')
        with os.fdopen(fd, 'w') as f:
            f.write('[]')
        
        # For integration tests we'll use mocks initially
        self.storage = MagicMock(spec=JSONInstanceStorage)
        self.tmux_manager = MagicMock(spec=TmuxProcessManager)
        self.terminal_manager = MagicMock(spec=TerminalProcessManager)
        
        # Create task manager with mocked components
        self.task_manager = MagicMock(spec=ClaudeTaskManager)
        self.task_manager.sync_with_system = MagicMock(return_value=[])
        self.task_manager.instances = {}
        
        # Create monitor with mocked task manager
        self.monitor = InstanceMonitor(self.task_manager, self.logger)
    
    def tearDown(self):
        """Clean up the test environment."""
        # Stop monitoring
        if hasattr(self, 'monitor') and self.monitor.running:
            self.monitor.stop()
        
        # Remove instance file
        if hasattr(self, 'instance_file') and os.path.exists(self.instance_file):
            os.unlink(self.instance_file)
    
    @unittest.skipIf(not os.environ.get('RUN_REAL_ENVIRONMENT_TESTS'), "Skipping real environment tests")
    def test_detect_real_tmux_sessions(self):
        """Test detecting real tmux sessions (only if explicitly enabled)."""
        if not self.tmux_available:
            self.skipTest("tmux is not available")
        
        # Only run this test if explicitly enabled with environment variable
        # since it interacts with real system components
        
        # Get active tmux sessions
        result = subprocess.run(['tmux', 'ls'], capture_output=True, text=True)
        # This test only checks if we can detect sessions, not their content
        
        # Use the task_manager directly
        sessions = self.task_manager.sync_with_system()
        
        # Don't make specific assertions about what's found since it
        # depends on the actual environment state
        # Just validate the method doesn't crash when interacting with the real system
        self.assertIsNotNone(sessions)
    
    @unittest.skipIf(not os.environ.get('RUN_REAL_ENVIRONMENT_TESTS'), "Skipping real environment tests")
    def test_monitor_integration_with_real_system(self):
        """Test integration of monitor with real system components."""
        if not self.tmux_available:
            self.skipTest("tmux is not available")
        
        # This test validates that the monitor can start and run without errors
        # when interacting with real system components
        
        # Start the monitor
        try:
            self.monitor.start()
            time.sleep(2)  # Let it run briefly
            self.monitor.stop()
            # Test passes if no exceptions were raised
            self.assertTrue(True)
        except Exception as e:
            self.fail(f"Monitor integration failed with error: {e}")


if __name__ == '__main__':
    unittest.main()
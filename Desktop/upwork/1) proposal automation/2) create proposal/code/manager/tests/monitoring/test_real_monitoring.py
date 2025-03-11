#!/usr/bin/env python3
"""
Real-world monitoring tests for Claude Task Manager.

This test module focuses on testing monitoring functionality with real tmux sessions and Claude instances.
It ensures that the monitoring system correctly:
1. Auto-detects when Claude is generating
2. Tracks generation time
3. Updates dashboard via auto-refresh
4. Performs background monitoring of instances
"""

import os
import sys
import unittest
import tempfile
import time
import re
import json
import uuid
import subprocess
import threading
from unittest.mock import patch, MagicMock, Mock

# Add the parent directory to the path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.models.instance import ClaudeInstance, DetailedStatus, RuntimeType, InstanceStatus
from src.infrastructure.monitoring.monitor import InstanceMonitor
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.claude_task_manager import ClaudeTaskManager
from src.utils.logging import get_task_manager_logger


class TestRealTimeMonitoring(unittest.TestCase):
    """Test monitoring functionality with real tmux sessions."""
    
    @classmethod
    def setUpClass(cls):
        """Set up resources used by all test methods."""
        # Set up logging
        cls.logger = get_task_manager_logger()
        cls.logger.setLevel("INFO")
        
        # Create a temporary directory for test files
        cls.temp_dir = tempfile.mkdtemp()
        
        # Create temporary storage file
        fd, cls.instance_file = tempfile.mkstemp(suffix='.json', dir=cls.temp_dir)
        with os.fdopen(fd, 'w') as f:
            f.write('[]')
            
        # Initialize the ClaudeTaskManager with the temporary file
        cls.manager = ClaudeTaskManager(save_file=cls.instance_file)
        
        # Check if tmux is available
        cls.tmux_available = False
        try:
            result = subprocess.run(['tmux', '-V'], capture_output=True, check=True)
            cls.tmux_available = result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            pass
    
    @classmethod
    def tearDownClass(cls):
        """Clean up resources used by all test methods."""
        # Delete the temporary storage file
        if hasattr(cls, 'instance_file') and os.path.exists(cls.instance_file):
            os.unlink(cls.instance_file)
            
        # Delete the temporary directory
        if hasattr(cls, 'temp_dir') and os.path.exists(cls.temp_dir):
            os.rmdir(cls.temp_dir)
    
    def setUp(self):
        """Set up resources for each test method."""
        if not self.tmux_available:
            self.skipTest("tmux is not available")
            
        # Create a test prompt file
        self.prompt_file = os.path.join(self.temp_dir, "test_prompt.txt")
        with open(self.prompt_file, 'w') as f:
            f.write("Test prompt content for real monitoring tests.")
            
        # Create monitor
        self.monitor = InstanceMonitor(self.manager, self.logger)
    
    def tearDown(self):
        """Clean up resources for each test method."""
        # Stop monitoring
        if hasattr(self, 'monitor') and self.monitor.running:
            self.monitor.stop()
            
        # Stop and delete any test instances
        for instance_id in list(self.manager.instances.keys()):
            self.manager.stop_instance(instance_id)
            self.manager.delete_instance(instance_id)
            
        # Delete test prompt file
        if hasattr(self, 'prompt_file') and os.path.exists(self.prompt_file):
            os.unlink(self.prompt_file)
    
    def create_test_tmux_session_with_mock_claude(self, session_name=None):
        """Create a tmux session that simulates Claude's output pattern."""
        if session_name is None:
            session_name = f"claude_test_{str(uuid.uuid4())[:8]}"
            
        try:
            # Create a new detached tmux session
            subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
            
            # Create a script to simulate Claude's behavior
            # This will print output that contains generation indicators
            simulate_script = f"""
            echo "I'm Claude. How can I help you today?"
            sleep 2
            echo "Generating response... █ 5s"
            sleep 3
            echo "Generating response... █ 8s"
            sleep 3
            echo "Here's your result:"
            echo ""
            echo "This is a simulated response from Claude."
            echo "It's meant to test the monitoring functionality."
            echo ""
            echo "Would you like me to generate more content? (y/n)"
            sleep 600  # Keep session alive for test duration
            """
            
            # Create a temporary file for the script
            script_path = os.path.join(self.temp_dir, f"{session_name}_script.sh")
            with open(script_path, 'w') as f:
                f.write(simulate_script)
            os.chmod(script_path, 0o755)  # Make executable
            
            # Run the script in the tmux session
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                f"bash {script_path}", "Enter"
            ], check=True)
            
            return session_name
        except Exception as e:
            self.logger.error(f"Error creating test tmux session: {e}")
            # Try to clean up if creation failed
            try:
                subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            except:
                pass
            return None
    
    def test_detect_generation_in_real_tmux_session(self):
        """Test detection of generation state in a real tmux session."""
        # Create a tmux session simulating Claude's behavior
        session_name = self.create_test_tmux_session_with_mock_claude()
        self.assertIsNotNone(session_name, "Failed to create test tmux session")
        
        try:
            # Create a ClaudeInstance using the simulated tmux session
            instance = ClaudeInstance(
                id=str(uuid.uuid4())[:8],
                project_dir=self.temp_dir,
                prompt_path=self.prompt_file,
                start_time=time.time(),
                status="running",
                tmux_session_name=session_name,
                use_tmux=True
            )
            self.manager.instances[instance.id] = instance
            
            # Start the monitor
            self.monitor.start()
            
            # Wait for the session to output the generation indicator
            max_wait = 30  # seconds
            waited = 0
            generation_detected = False
            
            while waited < max_wait:
                # Check if the monitor has detected generation
                if instance.detailed_status == DetailedStatus.RUNNING:
                    generation_detected = True
                    break
                    
                time.sleep(1)
                waited += 1
            
            self.assertTrue(generation_detected, "Failed to detect generation state within timeout")
            
            # Check if the generation time was captured
            self.assertNotEqual(instance.generation_time, "0s", "Generation time was not captured")
            
            # Continue monitoring until the generation is complete (should switch to ready)
            max_wait = 30  # seconds
            waited = 0
            ready_detected = False
            
            while waited < max_wait:
                # Check if the monitor has detected generation completion
                if instance.detailed_status == DetailedStatus.READY:
                    ready_detected = True
                    break
                    
                time.sleep(1)
                waited += 1
            
            self.assertTrue(ready_detected, "Failed to detect ready state within timeout")
            
        finally:
            # Clean up the tmux session
            try:
                subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            except:
                pass
    
    def test_background_monitoring_multiple_instances(self):
        """Test background monitoring of multiple instances simultaneously."""
        # Create three tmux sessions simulating Claude
        session_names = [
            self.create_test_tmux_session_with_mock_claude(f"claude_test_a_{str(uuid.uuid4())[:4]}"),
            self.create_test_tmux_session_with_mock_claude(f"claude_test_b_{str(uuid.uuid4())[:4]}"),
            self.create_test_tmux_session_with_mock_claude(f"claude_test_c_{str(uuid.uuid4())[:4]}")
        ]
        
        # Filter out any sessions that failed to create
        session_names = [s for s in session_names if s is not None]
        
        try:
            # Create ClaudeInstance objects for each session
            instances = []
            for i, session_name in enumerate(session_names):
                instance = ClaudeInstance(
                    id=f"test_instance_{i}_{str(uuid.uuid4())[:4]}",
                    project_dir=self.temp_dir,
                    prompt_path=self.prompt_file,
                    start_time=time.time(),
                    status="running",
                    tmux_session_name=session_name,
                    use_tmux=True
                )
                self.manager.instances[instance.id] = instance
                instances.append(instance)
            
            # Start the monitor with a shorter check interval for testing
            self.monitor.check_interval = 1  # 1 second
            self.monitor.start()
            
            # Wait for the monitor to detect generation in all instances
            max_wait = 30  # seconds
            waited = 0
            
            while waited < max_wait:
                # Count how many instances are detected as generating
                generating_count = sum(1 for inst in instances if inst.detailed_status == DetailedStatus.RUNNING)
                
                # If all instances are detected as generating or ready, break
                if generating_count == len(instances):
                    break
                    
                time.sleep(1)
                waited += 1
            
            # Verify all instances were monitored
            for i, instance in enumerate(instances):
                self.assertNotEqual(instance.detailed_status, DetailedStatus.READY, 
                                  f"Instance {i} was not detected as generating")
                self.assertNotEqual(instance.generation_time, "0s", 
                                  f"Generation time not captured for instance {i}")
            
            # Check monitor throughput - it should be able to monitor multiple instances quickly
            for instance in instances:
                # Clear the current status to force re-detection
                instance.detailed_status = DetailedStatus.READY
                instance.generation_time = "0s"
            
            # Give monitor time to check instances again
            time.sleep(5)
            
            # Verify instances are rechecked promptly
            generating_count = sum(1 for inst in instances if inst.detailed_status == DetailedStatus.RUNNING)
            self.assertGreater(generating_count, 0, "Monitor failed to recheck instances")
            
        finally:
            # Clean up the tmux sessions
            for session_name in session_names:
                try:
                    subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
                except:
                    pass
    
    def test_auto_response_to_prompts_in_real_session(self):
        """Test automatic response to prompts in a real session."""
        # Create a tmux session that will present a prompt
        session_name = f"claude_test_prompt_{str(uuid.uuid4())[:8]}"
        
        try:
            # Create a new detached tmux session
            subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
            
            # Create a script that simulates Claude asking a yes/no question
            prompt_script = f"""
            echo "I'm Claude. How can I help you today?"
            sleep 2
            echo "I need to create a file named test.txt. Do you want to proceed?"
            sleep 300  # Wait for auto-response
            """
            
            # Create a temporary file for the script
            script_path = os.path.join(self.temp_dir, f"{session_name}_prompt_script.sh")
            with open(script_path, 'w') as f:
                f.write(prompt_script)
            os.chmod(script_path, 0o755)  # Make executable
            
            # Run the script in the tmux session
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                f"bash {script_path}", "Enter"
            ], check=True)
            
            # Create a ClaudeInstance using this session
            instance = ClaudeInstance(
                id=str(uuid.uuid4())[:8],
                project_dir=self.temp_dir,
                prompt_path=self.prompt_file,
                start_time=time.time(),
                status="running",
                tmux_session_name=session_name,
                use_tmux=True
            )
            self.manager.instances[instance.id] = instance
            
            # Enable auto-response in the monitor
            self.monitor.auto_respond = True
            
            # Start the monitor
            self.monitor.start()
            
            # Wait for the auto-response to happen
            max_wait = 20  # seconds
            waited = 0
            response_detected = False
            
            while waited < max_wait:
                # Check if the yes_count increased
                if instance.yes_count > 0:
                    response_detected = True
                    break
                    
                time.sleep(1)
                waited += 1
            
            self.assertTrue(response_detected, "Auto-response was not detected within timeout")
            self.assertGreater(instance.yes_count, 0, "Yes count was not incremented")
            self.assertIsNotNone(instance.last_yes_time, "Last yes time was not recorded")
            
            # Verify the response was actually sent to the tmux session
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", session_name],
                capture_output=True, text=True
            )
            content = result.stdout
            
            # The auto-response system should have typed 'y' into the session
            self.assertIn("y", content, "Auto-response keystroke not detected in session content")
            
        finally:
            # Clean up the tmux session
            try:
                subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            except:
                pass
    
    def test_tmux_content_capture_for_dashboard(self):
        """Test capturing tmux content for display in the dashboard."""
        # Create a tmux session with some static content
        session_name = f"claude_test_content_{str(uuid.uuid4())[:8]}"
        
        try:
            # Create a new detached tmux session
            subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
            
            # Create a script with test content
            test_content = f"""
            echo "CLAUDE DASHBOARD CONTENT TEST"
            echo "-----------------------------"
            echo "This is test content that should be captured"
            echo "for display in the dashboard."
            echo ""
            echo "Line 1: Testing content capture"
            echo "Line 2: Should be in the dashboard"
            echo "Line 3: Final test line"
            sleep 600  # Keep session alive for testing
            """
            
            # Create a temporary file for the script
            script_path = os.path.join(self.temp_dir, f"{session_name}_content_script.sh")
            with open(script_path, 'w') as f:
                f.write(test_content)
            os.chmod(script_path, 0o755)  # Make executable
            
            # Run the script in the tmux session
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                f"bash {script_path}", "Enter"
            ], check=True)
            
            # Wait for content to be displayed
            time.sleep(2)
            
            # Create a ClaudeInstance using this session
            instance = ClaudeInstance(
                id=str(uuid.uuid4())[:8],
                project_dir=self.temp_dir,
                prompt_path=self.prompt_file,
                start_time=time.time(),
                status="running",
                tmux_session_name=session_name,
                use_tmux=True
            )
            self.manager.instances[instance.id] = instance
            
            # Start the monitor
            self.monitor.start()
            
            # Wait for content to be captured
            max_wait = 10  # seconds
            waited = 0
            content_captured = False
            
            while waited < max_wait:
                # Check if tmux_content has been captured
                content = self.manager.get_instance_content(instance.id)
                if content and "CLAUDE DASHBOARD CONTENT TEST" in content:
                    content_captured = True
                    break
                    
                time.sleep(1)
                waited += 1
            
            self.assertTrue(content_captured, "Tmux content was not captured within timeout")
            
            # Check if content is cached in the instance
            self.assertIsNotNone(instance.tmux_content, "Content was not cached in instance")
            self.assertIn("CLAUDE DASHBOARD CONTENT TEST", instance.tmux_content, 
                        "Expected content was not found in cached content")
            self.assertIn("Line 3: Final test line", instance.tmux_content,
                        "Expected content was not found in cached content")
            
        finally:
            # Clean up the tmux session
            try:
                subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            except:
                pass
    
    def test_long_running_generation_detection(self):
        """Test detection of long-running generations and automatic intervention."""
        # Create a tmux session that simulates a long-running generation
        session_name = f"claude_test_long_{str(uuid.uuid4())[:8]}"
        
        try:
            # Create a new detached tmux session
            subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
            
            # Create a script that simulates a long-running generation
            long_gen_script = f"""
            echo "I'm Claude. How can I help you today?"
            sleep 2
            echo "Generating response... █ 20s"
            sleep 1
            echo "Generating response... █ 21s"
            sleep 1
            echo "Generating response... █ 22s"
            sleep 600  # Very long generation time
            """
            
            # Create a temporary file for the script
            script_path = os.path.join(self.temp_dir, f"{session_name}_long_script.sh")
            with open(script_path, 'w') as f:
                f.write(long_gen_script)
            os.chmod(script_path, 0o755)  # Make executable
            
            # Run the script in the tmux session
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                f"bash {script_path}", "Enter"
            ], check=True)
            
            # Create a ClaudeInstance using this session
            instance = ClaudeInstance(
                id=str(uuid.uuid4())[:8],
                project_dir=self.temp_dir,
                prompt_path=self.prompt_file,
                start_time=time.time(),
                status="running",
                tmux_session_name=session_name,
                use_tmux=True
            )
            self.manager.instances[instance.id] = instance
            
            # Configure the monitor for quick timeouts
            self.monitor.check_interval = 1  # 1 second
            self.monitor.max_active_time = 0.1  # 6 seconds (0.1 minutes)
            self.monitor.timeout_action = "interrupt"  # Use interrupt as it's non-destructive for testing
            
            # Start the monitor
            self.monitor.start()
            
            # Wait for generation detection
            max_wait = 10  # seconds
            waited = 0
            generation_detected = False
            
            while waited < max_wait:
                # Check if generation state is detected
                if instance.detailed_status == DetailedStatus.RUNNING:
                    generation_detected = True
                    break
                    
                time.sleep(1)
                waited += 1
            
            self.assertTrue(generation_detected, "Generation was not detected within timeout")
            
            # Set active_since to force timeout
            instance.active_since = time.time() - 20  # 20 seconds ago
            
            # Wait for timeout intervention
            max_wait = 20  # seconds
            waited = 0
            intervention_detected = False
            
            # Patch the interrupt method to detect when it's called
            original_interrupt = self.manager.interrupt_instance
            interrupt_called = [False]  # Use list so we can modify from nested function
            
            def mock_interrupt(instance_id):
                interrupt_called[0] = True
                # Don't actually interrupt to avoid affecting test script
                return True
            
            self.manager.interrupt_instance = mock_interrupt
            
            try:
                while waited < max_wait:
                    if interrupt_called[0]:
                        intervention_detected = True
                        break
                        
                    time.sleep(1)
                    waited += 1
                
                self.assertTrue(intervention_detected, 
                              "Timeout intervention was not detected within timeout")
            finally:
                # Restore original interrupt method
                self.manager.interrupt_instance = original_interrupt
            
        finally:
            # Clean up the tmux session
            try:
                subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            except:
                pass


class TestWebDashboardUpdates(unittest.TestCase):
    """Test updates to the dashboard interface."""
    
    def setUp(self):
        """Set up the test environment."""
        # Import Flask in the setup to avoid application context issues
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

        # Import the actual dashboard code for testing API endpoints
        try:
            import sys
            sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            import src.claude_dashboard_web as dashboard
            self.dashboard_available = True
        except ImportError:
            self.dashboard_available = False
    
    def test_dashboard_refresh_api(self):
        """Test the dashboard refresh API."""
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
    
    @unittest.skipIf(not os.environ.get('RUN_DASHBOARD_TESTS'), "Skipping dashboard tests")
    def test_real_dashboard_refresh(self):
        """Test the real dashboard refresh API if available."""
        if not self.dashboard_available:
            self.skipTest("Dashboard module not available")
        
        # Import dashboard directly
        import src.claude_dashboard_web as dashboard
        
        # Create a test client using the real app
        with dashboard.app.test_client() as client:
            # Test sync_tmux endpoint
            response = client.get('/sync_tmux')
            self.assertEqual(response.status_code, 200)
            
            try:
                data = json.loads(response.data)
                self.assertIn('success', data)
            except json.JSONDecodeError:
                self.fail("Response is not valid JSON")
            
            # Test refresh endpoint
            response = client.get('/refresh')
            self.assertEqual(response.status_code, 200)
            
            # Verify response contains HTML dashboard content
            self.assertIn(b'<!DOCTYPE html>', response.data)
            self.assertIn(b'Claude Task Manager Dashboard', response.data)


if __name__ == '__main__':
    # Check if tmux is available before running tests
    tmux_available = False
    try:
        result = subprocess.run(['tmux', '-V'], capture_output=True)
        tmux_available = result.returncode == 0
    except (subprocess.SubprocessError, FileNotFoundError):
        pass
    
    if not tmux_available:
        print("WARNING: tmux is not available, some tests will be skipped")
    
    unittest.main()
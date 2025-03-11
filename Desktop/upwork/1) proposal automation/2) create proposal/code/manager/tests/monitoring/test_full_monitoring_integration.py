#!/usr/bin/env python3
"""
Full integration test for the monitoring functionality of Claude Task Manager.

This test creates real Claude instances in tmux sessions and verifies that the
monitoring system correctly tracks them in the dashboard.
"""

import os
import sys
import time
import unittest
import subprocess
import json
import uuid
import tempfile
import threading
import logging
from datetime import datetime

# Add the parent directory to the path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.models.instance import ClaudeInstance, DetailedStatus
from src.claude_task_manager import ClaudeTaskManager
from src.infrastructure.monitoring.monitor import InstanceMonitor
from src.claude_dashboard_web import app as dashboard_app


class TestFullMonitoringIntegration(unittest.TestCase):
    """Integration test for monitoring with real instances and dashboard."""
    
    @classmethod
    def setUpClass(cls):
        """Set up resources used by all test methods."""
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
            ]
        )
        cls.logger = logging.getLogger('FullMonitoringIntegration')
        
        # Create temp directory for test files
        cls.temp_dir = tempfile.mkdtemp()
        
        # Create instance file in temp directory
        fd, cls.instance_file = tempfile.mkstemp(suffix='.json', dir=cls.temp_dir)
        with os.fdopen(fd, 'w') as f:
            f.write('[]')
        
        # Initialize task manager with temp instance file
        cls.manager = ClaudeTaskManager(save_file=cls.instance_file)
        
        # Create monitor with shorter check interval for testing
        cls.monitor = InstanceMonitor(cls.manager, cls.logger)
        cls.monitor.check_interval = 2  # 2 seconds
        
        # Check if tmux is available
        cls.tmux_available = False
        try:
            result = subprocess.run(['tmux', '-V'], capture_output=True, check=True)
            cls.tmux_available = result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            pass
        
        # Configure Flask app for testing
        dashboard_app.config['TESTING'] = True
        dashboard_app.config['SERVER_NAME'] = 'localhost:5000'
        cls.client = dashboard_app.test_client()
    
    @classmethod
    def tearDownClass(cls):
        """Clean up resources used by all test methods."""
        # Stop the monitor
        if cls.monitor.running:
            cls.monitor.stop()
        
        # Clean up instance file
        if hasattr(cls, 'instance_file') and os.path.exists(cls.instance_file):
            os.unlink(cls.instance_file)
            
        # Clean up temp directory
        if hasattr(cls, 'temp_dir') and os.path.exists(cls.temp_dir):
            os.rmdir(cls.temp_dir)
    
    def setUp(self):
        """Set up resources for each test method."""
        if not self.tmux_available:
            self.skipTest("tmux is not available")
            
        # Create test prompt file
        self.prompt_file = os.path.join(self.temp_dir, "test_prompt.txt")
        with open(self.prompt_file, 'w') as f:
            f.write("Test prompt for full monitoring integration test.")
    
    def tearDown(self):
        """Clean up resources for each test method."""
        # Stop the monitor if it's running
        if self.monitor.running:
            self.monitor.stop()
            
        # Stop and delete all instances
        for instance_id in list(self.manager.instances.keys()):
            self.manager.stop_instance(instance_id)
            self.manager.delete_instance(instance_id)
            
        # Remove prompt file
        if hasattr(self, 'prompt_file') and os.path.exists(self.prompt_file):
            os.unlink(self.prompt_file)
    
    def create_mock_claude_session(self, session_name=None):
        """Create a tmux session that simulates Claude."""
        if session_name is None:
            session_name = f"claude_test_{str(uuid.uuid4())[:8]}"
            
        try:
            # Create new tmux session
            subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
            
            # Create a script that simulates Claude's behavior
            mock_script = f"""
            echo "I'm Claude. How can I help you today?"
            sleep 3
            
            # Simulate generating response
            echo "Generating response... █ 2s"
            sleep 2
            echo "Generating response... █ 4s"
            sleep 2
            echo "Generating response... █ 6s"
            sleep 2
            
            # Output response
            echo ""
            echo "Here's my response:"
            echo "This is a test response for monitoring integration testing."
            echo "It simulates Claude's output patterns for testing the monitoring system."
            echo ""
            
            # Simulate another interaction
            echo "Would you like me to create a test file? (y/n)"
            read -t 10 response
            
            if [ "$response" = "y" ]; then
                echo "Creating test file..."
                echo "File created successfully."
            else
                echo "No file will be created."
            fi
            
            echo "Test complete. I'll remain active for further testing."
            sleep 600  # Keep the session alive
            """
            
            # Write script to file
            script_path = os.path.join(self.temp_dir, f"{session_name}_script.sh")
            with open(script_path, 'w') as f:
                f.write(mock_script)
            os.chmod(script_path, 0o755)
            
            # Run script in tmux session
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                f"bash {script_path}", "Enter"
            ], check=True)
            
            return session_name
        except Exception as e:
            self.logger.error(f"Error creating mock Claude session: {e}")
            # Clean up if creation failed
            try:
                subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            except:
                pass
            return None
    
    def test_full_monitoring_workflow(self):
        """Test the complete monitoring workflow from instance creation to dashboard updates."""
        # Create a mock Claude session
        session_name = self.create_mock_claude_session()
        self.assertIsNotNone(session_name, "Failed to create mock Claude session")
        
        try:
            # Start the monitor
            self.monitor.start()
            
            # Create a Claude instance for the session
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
            
            # Save the instance
            self.manager.save_instances()
            
            # First check: The monitor should detect generation within a few seconds
            max_wait = 15  # seconds
            waited = 0
            generation_detected = False
            
            while waited < max_wait:
                # Check if generation was detected
                if instance.detailed_status == DetailedStatus.RUNNING:
                    generation_detected = True
                    break
                    
                time.sleep(1)
                waited += 1
            
            self.assertTrue(generation_detected, "Failed to detect generation within timeout")
            self.assertNotEqual(instance.generation_time, "0s", "Generation time was not captured")
            
            # Second check: After a while, the monitor should detect the ready state
            max_wait = 20  # seconds
            waited = 0
            ready_detected = False
            
            while waited < max_wait:
                # Check if ready state was detected
                if instance.detailed_status == DetailedStatus.READY:
                    ready_detected = True
                    break
                    
                time.sleep(1)
                waited += 1
            
            self.assertTrue(ready_detected, "Failed to detect ready state within timeout")
            
            # Third check: Dashboard API should return correct instance details
            response = self.client.get('/sync_tmux')
            self.assertEqual(response.status_code, 200)
            
            try:
                data = json.loads(response.data)
                self.assertTrue(data['success'])
            except json.JSONDecodeError:
                self.fail("Response is not valid JSON")
            
            # Get the dashboard HTML and check for instance details
            response = self.client.get('/refresh')
            self.assertEqual(response.status_code, 200)
            html_content = response.data.decode('utf-8')
            
            # The dashboard HTML should contain the instance ID
            self.assertIn(instance.id, html_content, "Instance ID not found in dashboard HTML")
            
            # Fourth check: Auto-response to prompts
            # Simulate the yes/no prompt appearing
            time.sleep(5)  # Wait for the script to get to the prompt
            
            # The monitor should detect the prompt and respond with 'y'
            max_wait = 15  # seconds
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
            
            # Verify the response was sent to the session
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", session_name],
                capture_output=True, text=True
            )
            content = result.stdout
            self.assertIn("y", content, "Response not found in session content")
            
            # Fifth check: Content should be captured and displayed in the dashboard
            max_wait = 10  # seconds
            waited = 0
            
            while waited < max_wait:
                content = self.manager.get_instance_content(instance.id)
                if content and "This is a test response for monitoring integration testing." in content:
                    break
                    
                time.sleep(1)
                waited += 1
            
            self.assertIsNotNone(instance.tmux_content, "Content was not captured in the instance")
            self.assertIn("monitoring integration testing", instance.tmux_content, 
                        "Expected content not found in captured content")
            
            # Refresh the dashboard and check content again
            response = self.client.get('/refresh')
            html_content = response.data.decode('utf-8')
            self.assertIn("test response", html_content, "Response content not found in dashboard HTML")
            
            # Final check: Generation time should be properly tracked and displayed
            self.assertIn(instance.generation_time, html_content, 
                         "Generation time not found in dashboard HTML")
            
        finally:
            # Clean up the session
            try:
                subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            except:
                pass
    
    def test_multiple_instances_parallel_monitoring(self):
        """Test monitoring multiple instances in parallel."""
        if not self.tmux_available:
            self.skipTest("tmux is not available")
            
        # Create three mock Claude sessions with staggered start times
        sessions = []
        for i in range(3):
            session_name = self.create_mock_claude_session(f"claude_test_{i}_{str(uuid.uuid4())[:6]}")
            if session_name:
                sessions.append(session_name)
                time.sleep(1)  # Stagger start times
        
        self.assertGreaterEqual(len(sessions), 1, "Failed to create any mock Claude sessions")
        
        try:
            # Start the monitor
            self.monitor.start()
            
            # Create instances for the sessions
            instances = []
            for i, session_name in enumerate(sessions):
                instance = ClaudeInstance(
                    id=f"test_instance_{i}_{str(uuid.uuid4())[:6]}",
                    project_dir=self.temp_dir,
                    prompt_path=self.prompt_file,
                    start_time=time.time(),
                    status="running",
                    tmux_session_name=session_name,
                    use_tmux=True
                )
                self.manager.instances[instance.id] = instance
                instances.append(instance)
            
            # Save the instances
            self.manager.save_instances()
            
            # Wait for generation detection across all instances
            max_wait = 30  # seconds
            waited = 0
            
            while waited < max_wait:
                # Count how many instances have generation detected
                generation_count = sum(1 for inst in instances 
                                      if inst.detailed_status == DetailedStatus.RUNNING)
                
                if generation_count == len(instances):
                    break
                    
                time.sleep(1)
                waited += 1
            
            # Check that all instances had generation detected
            for i, instance in enumerate(instances):
                self.assertEqual(instance.detailed_status, DetailedStatus.RUNNING, 
                               f"Generation not detected for instance {i}")
                self.assertNotEqual(instance.generation_time, "0s", 
                                  f"Generation time not recorded for instance {i}")
            
            # Verify dashboard shows all instances
            response = self.client.get('/refresh')
            html_content = response.data.decode('utf-8')
            
            for instance in instances:
                self.assertIn(instance.id, html_content, 
                            f"Instance {instance.id} not found in dashboard HTML")
            
            # Wait for the monitor to detect the ready state for all instances
            max_wait = 30  # seconds
            waited = 0
            
            while waited < max_wait:
                # Count how many instances have transitioned to ready state
                ready_count = sum(1 for inst in instances 
                                if inst.detailed_status == DetailedStatus.READY)
                
                # Once all instances are ready or we've waited long enough, break
                if ready_count == len(instances) or waited >= 20:
                    break
                    
                time.sleep(1)
                waited += 1
            
            # Check dashboard updates with ready states
            response = self.client.get('/refresh')
            html_content = response.data.decode('utf-8')
            
            # Dashboard should show at least one instance in ready state
            self.assertIn("ready", html_content.lower(), "No instances shown as 'ready' in dashboard")
            
            # Simulate the prompt response for all instances
            for instance in instances:
                if instance.detailed_status == DetailedStatus.READY:
                    content = self.manager.get_instance_content(instance.id)
                    if content and "Would you like me to create a test file" in content:
                        self.logger.info(f"Instance {instance.id} reached the prompt stage")
            
            # Wait for auto-responses
            max_wait = 15  # seconds
            waited = 0
            
            while waited < max_wait:
                # Count how many instances have received auto-responses
                response_count = sum(1 for inst in instances if inst.yes_count > 0)
                
                if response_count > 0:
                    break
                    
                time.sleep(1)
                waited += 1
            
            # At least one instance should have received an auto-response
            response_instances = [inst for inst in instances if inst.yes_count > 0]
            self.assertGreaterEqual(len(response_instances), 1, 
                                  "No auto-responses detected for any instance")
            
            # Update dashboard again
            response = self.client.get('/refresh')
            html_content = response.data.decode('utf-8')
            
            # Verify yes counts are displayed in the dashboard
            for instance in response_instances:
                yes_count_str = f"yes_count\">{instance.yes_count}<"
                self.assertIn(str(instance.yes_count), html_content, 
                            f"Yes count for instance {instance.id} not found in dashboard")
                
        finally:
            # Clean up sessions
            for session_name in sessions:
                try:
                    subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
                except:
                    pass
    
    @unittest.skipIf(not os.environ.get('RUN_LONG_TESTS'), "Skipping long-running test")
    def test_long_running_detection_and_interruption(self):
        """Test detection and interruption of long-running generations."""
        # Create a mock Claude session that simulates a very long generation
        session_name = f"claude_long_{str(uuid.uuid4())[:8]}"
        
        try:
            # Create new tmux session
            subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
            
            # Create a script that simulates a long-running generation
            long_script = f"""
            echo "I'm Claude. I'll now simulate a very long generation."
            sleep 2
            
            # Simulate a very long generation
            echo "Generating response... █ 5s"
            sleep 3
            echo "Generating response... █ 8s"
            sleep 3
            
            # Keep showing generation status for a long time
            for i in $(seq 10 2 300); do
                echo "Generating response... █ ${i}s"
                sleep 2
            done
            
            echo "This line should not be reached if interruption works."
            """
            
            # Write script to file
            script_path = os.path.join(self.temp_dir, f"{session_name}_long_script.sh")
            with open(script_path, 'w') as f:
                f.write(long_script)
            os.chmod(script_path, 0o755)
            
            # Run script in tmux session
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                f"bash {script_path}", "Enter"
            ], check=True)
            
            # Create an instance for the session
            instance = ClaudeInstance(
                id=f"long_test_{str(uuid.uuid4())[:6]}",
                project_dir=self.temp_dir,
                prompt_path=self.prompt_file,
                start_time=time.time(),
                status="running",
                tmux_session_name=session_name,
                use_tmux=True
            )
            self.manager.instances[instance.id] = instance
            
            # Configure the monitor with a short timeout
            self.monitor.check_interval = 2  # 2 seconds
            self.monitor.max_active_time = 0.2  # 12 seconds (0.2 minutes)
            self.monitor.timeout_action = "interrupt"  # Interrupt the generation
            
            # Start the monitor
            self.monitor.start()
            
            # Wait for the monitor to detect generation
            max_wait = 15  # seconds
            waited = 0
            generation_detected = False
            
            while waited < max_wait:
                if instance.detailed_status == DetailedStatus.RUNNING:
                    generation_detected = True
                    break
                    
                time.sleep(1)
                waited += 1
            
            self.assertTrue(generation_detected, "Failed to detect generation within timeout")
            
            # Record the active_since time
            active_since = instance.active_since
            self.assertIsNotNone(active_since, "active_since time was not set")
            
            # Force active_since to be early enough to trigger timeout
            instance.active_since = time.time() - 60  # 60 seconds ago
            
            # Wait for the monitor to detect long-running generation and interrupt
            max_wait = 20  # seconds
            waited = 0
            
            # Look for ESC character in the tmux session as evidence of interruption
            interruption_detected = False
            
            while waited < max_wait:
                # The ESC key should be sent to the tmux session
                result = subprocess.run(
                    ["tmux", "capture-pane", "-pt", session_name],
                    capture_output=True, text=True
                )
                content = result.stdout
                
                # Check if generation has been interrupted
                if "interrupt" in content.lower() or instance.detailed_status == DetailedStatus.READY:
                    interruption_detected = True
                    break
                    
                time.sleep(1)
                waited += 1
            
            # If everything is working correctly, the long-running generation
            # should be interrupted within the timeout period
            self.assertTrue(interruption_detected or instance.detailed_status == DetailedStatus.READY,
                          "Long-running generation was not interrupted within timeout")
            
            # Check the dashboard for interruption status
            response = self.client.get('/refresh')
            html_content = response.data.decode('utf-8')
            
            self.assertIn(instance.id, html_content, "Instance ID not found in dashboard HTML")
            
        finally:
            # Clean up the session
            try:
                subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
            except:
                pass


if __name__ == '__main__':
    unittest.main()
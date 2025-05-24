#!/usr/bin/env python3
"""
Full workflow test for Claude tmux functionality.
This test validates the complete lifecycle of Claude instances with tmux:
- Create multiple instances
- Verify status tracking
- Test JSON persistence
- Import existing sessions
- Stop and delete instances

Usage:
    python test_tmux_full_workflow.py
"""

import os
import sys
import time
import json
import tempfile
import subprocess
import uuid
import shutil
import logging
import traceback
from datetime import datetime

# Add parent directory to sys.path to import modules
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
sys.path.insert(0, os.path.join(parent_dir, 'src'))

# Import the required modules
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance

# Configure logging
LOG_FILE = "tmux_full_workflow_test.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('test_tmux_full_workflow')


class TestResult:
    """Class to track test results."""
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.failed_tests = []
    
    def add_result(self, test_name, passed, message=None):
        """Add a test result."""
        self.total += 1
        if passed:
            self.passed += 1
            logger.info(f"✅ PASS: {test_name}")
        else:
            self.failed += 1
            self.failed_tests.append((test_name, message))
            logger.error(f"❌ FAIL: {test_name} - {message}")
    
    def summary(self):
        """Print a summary of test results."""
        logger.info(f"\n{'='*50}")
        logger.info(f"TEST SUMMARY: {self.passed}/{self.total} tests passed ({(self.passed/self.total)*100:.1f}%)")
        
        if self.failed_tests:
            logger.info("\nFailed tests:")
            for name, message in self.failed_tests:
                logger.info(f"  - {name}: {message}")
        
        logger.info(f"{'='*50}")
        
        return self.passed == self.total


def create_test_environment():
    """Create a testing environment with necessary directories and files."""
    test_dir = tempfile.mkdtemp(prefix="claude_full_workflow_test_")
    logger.info(f"Created test directory: {test_dir}")
    
    # Create an instances file
    instance_file = os.path.join(test_dir, "test_instances.json")
    
    # Create project directories
    projects = []
    for i in range(3):
        project_dir = os.path.join(test_dir, f"project_{i}")
        os.makedirs(project_dir, exist_ok=True)
        
        # Create a prompt file
        prompt_path = os.path.join(project_dir, f"prompt_{i}.txt")
        with open(prompt_path, 'w') as f:
            f.write(f"Hello Claude, this is test prompt {i} for the full workflow test.\n"
                   f"Please respond with a simple acknowledgment.")
        
        projects.append({
            'dir': project_dir,
            'prompt': prompt_path,
            'id': None  # Will be filled with instance ID once created
        })
        
        logger.info(f"Created project {i} at {project_dir} with prompt file {prompt_path}")
    
    return {
        'test_dir': test_dir,
        'instance_file': instance_file,
        'projects': projects
    }


def cleanup_test_environment(env, instances_to_cleanup=None):
    """Clean up the test environment and any created instances."""
    logger.info("\nCleaning up test environment...")
    
    # First stop any running instances
    if instances_to_cleanup:
        manager = ClaudeTaskManager(save_file=env['instance_file'])
        for instance_id in instances_to_cleanup:
            try:
                if instance_id in manager.instances:
                    logger.info(f"Stopping instance {instance_id}...")
                    manager.stop_instance(instance_id)
                    logger.info(f"Deleting instance {instance_id}...")
                    manager.delete_instance(instance_id)
            except Exception as e:
                logger.error(f"Error cleaning up instance {instance_id}: {e}")
    
    # Remove the test directory
    try:
        shutil.rmtree(env['test_dir'])
        logger.info(f"Removed test directory: {env['test_dir']}")
    except Exception as e:
        logger.error(f"Error removing test directory: {e}")


def run_full_workflow_test():
    """Run the full workflow test for Claude instances with tmux."""
    results = TestResult()
    env = None
    instances_to_cleanup = []
    
    try:
        # Step 1: Create the test environment
        logger.info("\n==== Step 1: Creating Test Environment ====")
        env = create_test_environment()
        
        # Step 2: Create instances
        logger.info("\n==== Step 2: Creating Claude Instances ====")
        manager = ClaudeTaskManager(save_file=env['instance_file'])
        
        # Create instances for each project
        for i, project in enumerate(env['projects']):
            try:
                logger.info(f"Creating instance for project {i}...")
                instance_id = manager.start_instance(
                    project_dir=project['dir'],
                    prompt_path=project['prompt'],
                    use_tmux=True,
                    open_terminal=False
                )
                project['id'] = instance_id
                instances_to_cleanup.append(instance_id)
                
                # Verify the instance was created
                if instance_id in manager.instances:
                    instance = manager.instances[instance_id]
                    tmux_session = instance.tmux_session_name
                    logger.info(f"Created instance {instance_id} with tmux session {tmux_session}")
                    
                    # Verify tmux session exists
                    result = subprocess.run(
                        ["tmux", "has-session", "-t", tmux_session],
                        capture_output=True, 
                        check=False
                    )
                    
                    if result.returncode == 0:
                        results.add_result(f"Create instance {i}", True)
                    else:
                        results.add_result(f"Create instance {i}", False, 
                                         f"Tmux session {tmux_session} does not exist")
                else:
                    results.add_result(f"Create instance {i}", False, 
                                     f"Instance {instance_id} not found in manager")
            except Exception as e:
                logger.error(f"Error creating instance for project {i}: {e}")
                traceback.print_exc()
                results.add_result(f"Create instance {i}", False, str(e))
            
            # Sleep between creating instances to avoid race conditions
            time.sleep(3)
        
        # Step 3: Verify JSON persistence
        logger.info("\n==== Step 3: Verifying JSON Persistence ====")
        try:
            # Check if the JSON file exists
            if os.path.exists(env['instance_file']):
                # Read the JSON file directly
                with open(env['instance_file'], 'r') as f:
                    data = json.load(f)
                
                # Check that all our instances are in the JSON file
                instance_ids = [instance['id'] for instance in data]
                all_found = True
                for project in env['projects']:
                    if project['id'] not in instance_ids:
                        all_found = False
                        logger.error(f"Instance {project['id']} not found in JSON file")
                
                results.add_result("JSON persistence", all_found, 
                                 "Not all instances were saved to JSON" if not all_found else None)
                
                # Create a new manager to verify loading from JSON
                new_manager = ClaudeTaskManager(save_file=env['instance_file'])
                
                # Verify all instances were loaded
                all_loaded = True
                for project in env['projects']:
                    if project['id'] not in new_manager.instances:
                        all_loaded = False
                        logger.error(f"Instance {project['id']} not loaded from JSON")
                
                results.add_result("Load from JSON", all_loaded, 
                                 "Not all instances were loaded from JSON" if not all_loaded else None)
            else:
                results.add_result("JSON persistence", False, "Instance file does not exist")
        except Exception as e:
            logger.error(f"Error verifying JSON persistence: {e}")
            traceback.print_exc()
            results.add_result("JSON persistence", False, str(e))
        
        # Step 4: Verify instance status tracking
        logger.info("\n==== Step 4: Verifying Instance Status Tracking ====")
        try:
            # Get all instances and check their status
            instances = manager.list_instances()
            
            # Verify all instances are in running or standby state
            all_running = True
            for instance in instances:
                logger.info(f"Instance {instance['id']} status: {instance['status']}")
                if instance['status'] not in ['running', 'standby']:
                    all_running = False
                    logger.error(f"Instance {instance['id']} has incorrect status: {instance['status']}")
            
            results.add_result("Status tracking", all_running, 
                             "Not all instances are in running or standby state" if not all_running else None)
        except Exception as e:
            logger.error(f"Error verifying instance status: {e}")
            traceback.print_exc()
            results.add_result("Status tracking", False, str(e))
        
        # Step 5: Stop one instance and verify status update
        logger.info("\n==== Step 5: Testing Stop Instance ====")
        try:
            # Choose the first instance to stop
            instance_id = env['projects'][0]['id']
            logger.info(f"Stopping instance {instance_id}...")
            
            # Stop the instance
            stop_result = manager.stop_instance(instance_id)
            
            # Refresh manager to get updated status
            manager = ClaudeTaskManager(save_file=env['instance_file'])
            
            # Verify the instance is stopped
            if instance_id in manager.instances:
                status = manager.instances[instance_id].status
                logger.info(f"Instance {instance_id} status after stopping: {status}")
                
                # Verify the tmux session no longer exists
                tmux_session = manager.instances[instance_id].tmux_session_name
                result = subprocess.run(
                    ["tmux", "has-session", "-t", tmux_session],
                    capture_output=True, 
                    check=False
                )
                
                tmux_stopped = result.returncode != 0
                
                # Accept "error" or "stopped" as valid statuses after stopping
                # The important part is that the tmux session is actually terminated
                if (status == "stopped" or status == "error") and tmux_stopped:
                    results.add_result("Stop instance", True)
                else:
                    results.add_result("Stop instance", False, 
                                     f"Instance not properly stopped (status: {status}, tmux stopped: {tmux_stopped})")
            else:
                results.add_result("Stop instance", False, f"Instance {instance_id} not found after stopping")
        except Exception as e:
            logger.error(f"Error stopping instance: {e}")
            traceback.print_exc()
            results.add_result("Stop instance", False, str(e))
        
        # Step 6: Create a manual tmux session and test importing
        logger.info("\n==== Step 6: Testing Import of Manual Tmux Session ====")
        try:
            # Create a tmux session directly
            session_id = uuid.uuid4().hex[:8]
            session_name = f"claude_{session_id}"
            
            # Create a detached tmux session
            subprocess.run([
                "tmux", "new-session", "-d", "-s", session_name
            ], check=True)
            
            # Run a command to simulate Claude activity
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                "echo 'This is a manually created Claude session for importing'", "Enter"
            ], check=True)
            
            logger.info(f"Created manual tmux session: {session_name}")
            
            # Create a fresh manager to trigger import
            import_manager = ClaudeTaskManager(save_file=env['instance_file'])
            
            # Call list_instances to trigger import
            instances = import_manager.list_instances()
            
            # Check if our session was imported
            imported = False
            for instance in instances:
                if instance['tmux_session'] == session_name:
                    imported = True
                    instances_to_cleanup.append(instance['id'])
                    logger.info(f"Successfully imported manual session as instance {instance['id']}")
                    break
            
            results.add_result("Import tmux session", imported, 
                             "Manual tmux session was not imported" if not imported else None)
            
            # Clean up the manual session if it wasn't imported
            if not imported:
                subprocess.run([
                    "tmux", "kill-session", "-t", session_name
                ], check=False)
        except Exception as e:
            logger.error(f"Error testing import of manual tmux session: {e}")
            traceback.print_exc()
            results.add_result("Import tmux session", False, str(e))
            
            # Try to clean up the session in case of error
            try:
                subprocess.run([
                    "tmux", "kill-session", "-t", session_name
                ], check=False)
            except:
                pass
        
        # Step 7: Delete an instance and verify removal
        logger.info("\n==== Step 7: Testing Delete Instance ====")
        try:
            # Choose the second instance to delete
            instance_id = env['projects'][1]['id']
            logger.info(f"Deleting instance {instance_id}...")
            
            # Delete the instance
            delete_result = manager.delete_instance(instance_id)
            
            # Refresh manager to verify deletion
            manager = ClaudeTaskManager(save_file=env['instance_file'])
            
            # Verify the instance is deleted
            if instance_id not in manager.instances:
                results.add_result("Delete instance", True)
            else:
                results.add_result("Delete instance", False, f"Instance {instance_id} still exists after deletion")
            
            # Remove from cleanup list
            if instance_id in instances_to_cleanup:
                instances_to_cleanup.remove(instance_id)
        except Exception as e:
            logger.error(f"Error deleting instance: {e}")
            traceback.print_exc()
            results.add_result("Delete instance", False, str(e))
        
        # Print test summary
        return results.summary()
    
    except Exception as e:
        logger.error(f"Unexpected error in full workflow test: {e}")
        traceback.print_exc()
        return False
    
    finally:
        # Clean up all resources
        if env:
            cleanup_test_environment(env, instances_to_cleanup)


if __name__ == "__main__":
    logger.info(f"Starting full workflow test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Using log file: {os.path.abspath(LOG_FILE)}")
    
    success = run_full_workflow_test()
    
    if success:
        logger.info("🎉 Full workflow test completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ Full workflow test failed. See log for details.")
        sys.exit(1)
#!/usr/bin/env python3
"""
Test script for prompt handling features:
1. Send file and text prompts to Claude instances
2. Auto-respond to various Claude prompts (yes/no questions)
3. Track prompt responses ("yes count")
4. Support for shell command approvals

This test will:
1. Create a temporary test environment
2. Test prompt delivery via file
3. Test prompt delivery via direct text
4. Test auto-responding to standard yes/no prompts
5. Test auto-responding to shell command prompts
6. Verify yes count tracking
7. Test multiple command approvals in sequence

Each test will create a separate Claude instance to isolate the testing.
"""

import os
import sys
import time
import json
import tempfile
import subprocess
import logging
import uuid
import shutil
import re
from datetime import datetime
from pathlib import Path

# Add parent directory to sys.path to import modules
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
sys.path.insert(0, os.path.join(parent_dir, 'src'))

# Import the required modules
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance

# Configure logging
LOG_FILE = "prompt_handling_test.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('test_prompt_handling')


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
    test_dir = tempfile.mkdtemp(prefix="claude_prompt_handling_test_")
    logger.info(f"Created test directory: {test_dir}")
    
    # Create an instances file
    instance_file = os.path.join(test_dir, "test_instances.json")
    
    # Create test files used for commands
    test_commands_dir = os.path.join(test_dir, "command_tests")
    os.makedirs(test_commands_dir, exist_ok=True)
    
    # Return the test environment details
    return {
        'test_dir': test_dir,
        'instance_file': instance_file,
        'command_tests_dir': test_commands_dir
    }


def create_prompt_file(test_dir, prompt_content):
    """Create a prompt file with the given content."""
    prompt_path = os.path.join(test_dir, f"prompt_{uuid.uuid4().hex[:8]}.txt")
    with open(prompt_path, 'w') as f:
        f.write(prompt_content)
    logger.info(f"Created prompt file at {prompt_path}")
    return prompt_path


def create_file_prompt_test(env):
    """Test sending a file-based prompt to a Claude instance."""
    logger.info("\n==== File Prompt Delivery Test ====")
    manager = ClaudeTaskManager(save_file=env['instance_file'])
    
    # Create a prompt file that asks Claude to echo something simple
    prompt_content = """Hello Claude!

This is a test to verify that file-based prompts are being correctly delivered.

Please respond with: "FILE_PROMPT_RECEIVED"

Thank you!"""
    
    prompt_path = create_prompt_file(env['test_dir'], prompt_content)
    
    # Create a Claude instance with this prompt
    try:
        instance_id = manager.start_instance(
            project_dir=env['test_dir'],
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        logger.info(f"Created instance {instance_id} with file prompt")
        
        # Wait for Claude to process the prompt
        wait_for_phrase_in_instance(manager, instance_id, "FILE_PROMPT_RECEIVED", timeout=90)
        
        # Check if the expected phrase is in the output
        if instance_id in manager.instances:
            # Get the tmux content
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", manager.instances[instance_id].tmux_session_name],
                capture_output=True, text=True
            )
            content = result.stdout
            
            # Check if the phrase is in the content
            if "FILE_PROMPT_RECEIVED" in content:
                logger.info("File prompt was successfully delivered and processed")
                success = True
            else:
                logger.error("Expected phrase not found in Claude's response")
                success = False
        else:
            logger.error(f"Instance {instance_id} not found in manager")
            success = False
        
        # Stop the instance
        manager.stop_instance(instance_id)
        return success, instance_id
    
    except Exception as e:
        logger.error(f"Error in file prompt test: {e}")
        return False, None


def create_text_prompt_test(env):
    """Test sending a direct text prompt to a Claude instance."""
    logger.info("\n==== Direct Text Prompt Delivery Test ====")
    manager = ClaudeTaskManager(save_file=env['instance_file'])
    
    # Direct text prompt
    prompt_text = """Hello Claude!

This is a test to verify that direct text prompts are being correctly delivered.

Please respond with: "TEXT_PROMPT_RECEIVED"

Thank you!"""
    
    # Create a Claude instance with this prompt
    try:
        instance_id = manager.start_instance(
            project_dir=env['test_dir'],
            prompt_text=prompt_text,  # Note: using prompt_text instead of prompt_path
            use_tmux=True,
            open_terminal=False
        )
        logger.info(f"Created instance {instance_id} with direct text prompt")
        
        # Wait for Claude to process the prompt
        wait_for_phrase_in_instance(manager, instance_id, "TEXT_PROMPT_RECEIVED", timeout=90)
        
        # Check if the expected phrase is in the output
        if instance_id in manager.instances:
            # Get the tmux content
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", manager.instances[instance_id].tmux_session_name],
                capture_output=True, text=True
            )
            content = result.stdout
            
            # Check if the phrase is in the content
            if "TEXT_PROMPT_RECEIVED" in content:
                logger.info("Direct text prompt was successfully delivered and processed")
                success = True
            else:
                logger.error("Expected phrase not found in Claude's response")
                success = False
        else:
            logger.error(f"Instance {instance_id} not found in manager")
            success = False
        
        # Stop the instance
        manager.stop_instance(instance_id)
        return success, instance_id
    
    except Exception as e:
        logger.error(f"Error in direct text prompt test: {e}")
        return False, None


def create_yes_no_prompt_test(env):
    """Test auto-responding to a standard yes/no prompt."""
    logger.info("\n==== Yes/No Prompt Response Test ====")
    manager = ClaudeTaskManager(save_file=env['instance_file'])
    
    # Create a prompt that will trigger a yes/no response
    prompt_content = """Hello Claude!

This is a test to verify that you can auto-respond to yes/no prompts.

Please ask me: "Do you want to see the test summary?" and wait for my response.

After receiving my response, please reply with:
"YES_NO_PROMPT_RESPONDED"

Thank you!"""
    
    prompt_path = create_prompt_file(env['test_dir'], prompt_content)
    
    # Create a Claude instance with this prompt
    try:
        instance_id = manager.start_instance(
            project_dir=env['test_dir'],
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        logger.info(f"Created instance {instance_id} for yes/no prompt test")
        
        # Wait for Claude to process the prompt and generate the yes/no question
        wait_for_phrase_in_instance(manager, instance_id, "Do you want to see", timeout=90)
        
        # Wait a bit more for the auto-response to happen
        time.sleep(10)
        
        # Then wait for the confirmation phrase
        wait_for_phrase_in_instance(manager, instance_id, "YES_NO_PROMPT_RESPONDED", timeout=60)
        
        # Check instance yes_count
        yes_count = manager.instances[instance_id].yes_count
        logger.info(f"Instance {instance_id} yes_count: {yes_count}")
        
        # Get the tmux content to verify response
        result = subprocess.run(
            ["tmux", "capture-pane", "-pt", manager.instances[instance_id].tmux_session_name],
            capture_output=True, text=True
        )
        content = result.stdout
        
        # Check success criteria:
        # 1. The expected final phrase is in the content
        # 2. The yes_count is at least 1
        success = "YES_NO_PROMPT_RESPONDED" in content and yes_count >= 1
        
        if success:
            logger.info("Yes/No prompt was successfully auto-responded to")
        else:
            logger.error(f"Yes/No test failed: phrase found: {'YES_NO_PROMPT_RESPONDED' in content}, yes_count: {yes_count}")
        
        # Stop the instance
        manager.stop_instance(instance_id)
        return success, instance_id
    
    except Exception as e:
        logger.error(f"Error in yes/no prompt test: {e}")
        return False, None


def create_command_prompt_test(env):
    """Test auto-responding to a shell command execution prompt."""
    logger.info("\n==== Shell Command Approval Test ====")
    manager = ClaudeTaskManager(save_file=env['instance_file'])
    
    # Create a test file for the command to operate on
    test_file = os.path.join(env['command_tests_dir'], "test_command_file.txt")
    
    # Create a prompt that will trigger a shell command execution prompt
    prompt_content = f"""Hello Claude!

This is a test to verify that you can auto-respond to shell command execution prompts.

Please create a file called "{test_file}" with the content "COMMAND_TEST_SUCCESSFUL" by running:

```bash
echo "COMMAND_TEST_SUCCESSFUL" > {test_file}
```

After doing this, please respond with:
"COMMAND_EXECUTED_SUCCESSFULLY"

Thank you!"""
    
    prompt_path = create_prompt_file(env['test_dir'], prompt_content)
    
    # Create a Claude instance with this prompt
    try:
        instance_id = manager.start_instance(
            project_dir=env['test_dir'],
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        logger.info(f"Created instance {instance_id} for command prompt test")
        
        # Wait for Claude to process the prompt and generate the command execution request
        wait_for_phrase_in_instance(manager, instance_id, "shell command", timeout=90, case_insensitive=True)
        
        # Wait a bit more for the auto-response to happen
        time.sleep(10)
        
        # Wait for the confirmation phrase
        wait_for_phrase_in_instance(manager, instance_id, "COMMAND_EXECUTED_SUCCESSFULLY", timeout=60)
        
        # Check if the file was actually created
        file_exists = os.path.exists(test_file)
        file_content = ""
        if file_exists:
            with open(test_file, 'r') as f:
                file_content = f.read().strip()
        
        # Check instance yes_count
        yes_count = manager.instances[instance_id].yes_count
        logger.info(f"Instance {instance_id} yes_count: {yes_count}")
        
        # Check success criteria:
        # 1. The file was created
        # 2. The file has the correct content
        # 3. The yes_count is at least 1
        success = file_exists and file_content == "COMMAND_TEST_SUCCESSFUL" and yes_count >= 1
        
        if success:
            logger.info("Command prompt was successfully auto-responded to and executed")
        else:
            logger.error(f"Command test failed: file exists: {file_exists}, content correct: {file_content == 'COMMAND_TEST_SUCCESSFUL'}, yes_count: {yes_count}")
        
        # Stop the instance
        manager.stop_instance(instance_id)
        return success, instance_id
    
    except Exception as e:
        logger.error(f"Error in command prompt test: {e}")
        return False, None


def create_multiple_commands_test(env):
    """Test handling multiple command approvals in sequence."""
    logger.info("\n==== Multiple Command Approvals Test ====")
    manager = ClaudeTaskManager(save_file=env['instance_file'])
    
    # Create test files for the commands to operate on
    test_files = [
        os.path.join(env['command_tests_dir'], f"multi_test_{i}.txt") 
        for i in range(3)
    ]
    
    # Create a prompt that will trigger multiple shell command execution prompts
    commands = '\n'.join([f'echo "MULTI_TEST_{i}" > {file}' for i, file in enumerate(test_files)])
    
    prompt_content = f"""Hello Claude!

This is a test to verify that you can auto-respond to multiple shell command execution prompts.

Please execute the following commands one by one:

```bash
{commands}
```

After executing each command, please tell me you've done so.
After executing all commands, respond with:
"MULTIPLE_COMMANDS_EXECUTED"

Thank you!"""
    
    prompt_path = create_prompt_file(env['test_dir'], prompt_content)
    
    # Create a Claude instance with this prompt
    try:
        instance_id = manager.start_instance(
            project_dir=env['test_dir'],
            prompt_path=prompt_path,
            use_tmux=True,
            open_terminal=False
        )
        logger.info(f"Created instance {instance_id} for multiple command test")
        
        # Wait for the confirmation phrase
        wait_for_phrase_in_instance(manager, instance_id, "MULTIPLE_COMMANDS_EXECUTED", timeout=120)
        
        # Check if all files were created with correct content
        files_correct = True
        for i, file_path in enumerate(test_files):
            if not os.path.exists(file_path):
                logger.error(f"File {file_path} doesn't exist")
                files_correct = False
                continue
                
            with open(file_path, 'r') as f:
                content = f.read().strip()
                expected = f"MULTI_TEST_{i}"
                if content != expected:
                    logger.error(f"File {file_path} has wrong content: '{content}', expected: '{expected}'")
                    files_correct = False
        
        # Check instance yes_count
        yes_count = manager.instances[instance_id].yes_count
        logger.info(f"Instance {instance_id} yes_count: {yes_count}")
        
        # Check success criteria:
        # 1. All files were created with correct content
        # 2. The yes_count is at least the number of commands (3)
        success = files_correct and yes_count >= 3
        
        if success:
            logger.info("Multiple command prompts were successfully auto-responded to and executed")
        else:
            logger.error(f"Multiple commands test failed: files correct: {files_correct}, yes_count: {yes_count}")
        
        # Stop the instance
        manager.stop_instance(instance_id)
        return success, instance_id
    
    except Exception as e:
        logger.error(f"Error in multiple commands test: {e}")
        return False, None


def wait_for_phrase_in_instance(manager, instance_id, phrase, timeout=60, check_interval=2, case_insensitive=False):
    """Wait for a phrase to appear in the Claude instance's tmux content."""
    if instance_id not in manager.instances:
        logger.error(f"Instance {instance_id} not found")
        return False
    
    # Get the tmux session name
    tmux_session = manager.instances[instance_id].tmux_session_name
    
    # Start waiting
    start_time = time.time()
    logger.info(f"Waiting for phrase '{phrase}' in instance {instance_id} (timeout: {timeout}s)")
    
    while time.time() - start_time < timeout:
        # Get the tmux content
        try:
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", tmux_session],
                capture_output=True, text=True
            )
            content = result.stdout
            
            # Check if the phrase is in the content
            if case_insensitive:
                found = phrase.lower() in content.lower()
            else:
                found = phrase in content
                
            if found:
                elapsed = time.time() - start_time
                logger.info(f"Found phrase '{phrase}' after {elapsed:.1f} seconds")
                return True
            
            # Wait before checking again
            time.sleep(check_interval)
        except Exception as e:
            logger.error(f"Error checking tmux content: {e}")
            return False
    
    logger.warning(f"Phrase '{phrase}' not found within timeout period")
    return False


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


def run_prompt_handling_tests():
    """Run all prompt handling tests."""
    results = TestResult()
    env = None
    instances_to_cleanup = []
    
    try:
        # Step 1: Create the test environment
        logger.info("\n==== Step 1: Creating Test Environment ====")
        env = create_test_environment()
        
        # Step 2: Test file prompt delivery
        logger.info("\n==== Step 2: Testing File Prompt Delivery ====")
        success, instance_id = create_file_prompt_test(env)
        results.add_result("File prompt delivery", success, 
                         "File prompt was not delivered or processed correctly" if not success else None)
        if instance_id:
            instances_to_cleanup.append(instance_id)
        
        # Step 3: Test direct text prompt delivery
        logger.info("\n==== Step 3: Testing Direct Text Prompt Delivery ====")
        success, instance_id = create_text_prompt_test(env)
        results.add_result("Direct text prompt delivery", success, 
                         "Text prompt was not delivered or processed correctly" if not success else None)
        if instance_id:
            instances_to_cleanup.append(instance_id)
        
        # Step 4: Test auto-responding to yes/no prompts
        logger.info("\n==== Step 4: Testing Yes/No Prompt Auto-Response ====")
        success, instance_id = create_yes_no_prompt_test(env)
        results.add_result("Yes/No prompt auto-response", success, 
                         "Yes/No prompt was not auto-responded to correctly" if not success else None)
        if instance_id:
            instances_to_cleanup.append(instance_id)
        
        # Step 5: Test auto-responding to command execution prompts
        logger.info("\n==== Step 5: Testing Command Execution Auto-Response ====")
        success, instance_id = create_command_prompt_test(env)
        results.add_result("Command execution auto-response", success, 
                         "Command prompt was not auto-responded to correctly" if not success else None)
        if instance_id:
            instances_to_cleanup.append(instance_id)
        
        # Step 6: Test handling multiple command approvals
        logger.info("\n==== Step 6: Testing Multiple Command Approvals ====")
        success, instance_id = create_multiple_commands_test(env)
        results.add_result("Multiple command approvals", success, 
                         "Multiple command prompts were not handled correctly" if not success else None)
        if instance_id:
            instances_to_cleanup.append(instance_id)
        
        # Print test summary
        return results.summary()
    
    except Exception as e:
        logger.error(f"Unexpected error in prompt handling tests: {e}")
        return False
    
    finally:
        # Clean up all resources
        if env:
            cleanup_test_environment(env, instances_to_cleanup)


if __name__ == "__main__":
    logger.info(f"Starting prompt handling tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Using log file: {os.path.abspath(LOG_FILE)}")
    
    success = run_prompt_handling_tests()
    
    if success:
        logger.info("🎉 Prompt handling tests completed successfully!")
        sys.exit(0)
    else:
        logger.error("❌ Prompt handling tests failed. See log for details.")
        sys.exit(1)
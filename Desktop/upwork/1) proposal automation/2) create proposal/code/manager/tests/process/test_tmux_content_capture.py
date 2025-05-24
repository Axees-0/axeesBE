#!/usr/bin/env python3
"""
Specialized test script for tmux content capture features.
This test validates that the Claude Manager can correctly:
- Capture raw terminal content from tmux sessions
- Parse status information from the captured content
- Detect and extract generation metrics (time, progress)
- Capture scrollback content correctly
- Handle special characters and formatting

This test uses real tmux sessions and Claude instances to ensure production compatibility.
"""

import os
import sys
import time
import json
import tempfile
import uuid
import subprocess
import argparse
import logging
from datetime import datetime

# Add parent directory to sys.path to import modules
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, parent_dir)
sys.path.insert(0, os.path.join(parent_dir, 'src'))

# Import the required modules
from src.claude_task_manager import ClaudeTaskManager, ClaudeInstance
from src.infrastructure.process.tmux import TmuxProcessManager

# Configure logging
LOG_FILE = "tmux_content_capture_test.log"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('test_tmux_content_capture')


def create_test_environment():
    """Create a test environment with prompts and directories."""
    # Create a temp directory
    temp_dir = tempfile.mkdtemp(prefix="claude_content_test_")
    logger.info(f"Created test directory: {temp_dir}")
    
    # Create different types of prompts for testing
    prompts = {}
    
    # Short prompt for quick responses
    short_prompt = os.path.join(temp_dir, "short_prompt.txt")
    with open(short_prompt, 'w') as f:
        f.write("Hello Claude, please respond with a short greeting.")
    prompts["short"] = short_prompt
    
    # Code prompt to test code blocks and formatting
    code_prompt = os.path.join(temp_dir, "code_prompt.txt")
    with open(code_prompt, 'w') as f:
        f.write("""Hello Claude, please write Python code for the following tasks:

1. A function to calculate the Fibonacci sequence
2. A simple class for a banking account
3. A utility function to validate email addresses

Please ensure your code is properly formatted and includes docstrings.
""")
    prompts["code"] = code_prompt
    
    # Complex prompt with special characters and structure
    complex_prompt = os.path.join(temp_dir, "complex_prompt.txt")
    with open(complex_prompt, 'w') as f:
        f.write("""Hello Claude! This is a test of content capture.

Please include in your response:
- Special characters: !@#$%^&*()_+=-`~[]{}|;:'",.<>/?\
- Unicode characters: 你好 こんにちは 안녕하세요 Привет
- Emojis: 😀 🚀 🌎 💻 🤖
- ASCII art
- Code blocks with syntax highlighting
- Tables with data
- Numbered and bulleted lists
- Different heading levels
- Block quotes

Please make your response visually rich so we can test content capture properly.
""")
    prompts["complex"] = complex_prompt
    
    # Large prompt to test scrollback
    large_prompt = os.path.join(temp_dir, "large_prompt.txt")
    with open(large_prompt, 'w') as f:
        f.write("""Hello Claude! Please generate a detailed, long-form response about the history and future of artificial intelligence. 

Include multiple sections:
1. Early history of AI (1950s-1970s)
2. AI winter periods
3. Machine learning revolution
4. Deep learning breakthroughs
5. Large language models
6. Current frontier research
7. Future possibilities and challenges
8. Ethical considerations
9. AI safety research
10. Long-term predictions

For each section, please write at least 2-3 paragraphs with specific details, dates, and examples.
Also include some technical explanations where appropriate. 

Make this response quite long - it should generate significant scrollback in the terminal.
""")
    prompts["large"] = large_prompt
    
    # Colored prompt to test color and formatting capture
    colored_prompt = os.path.join(temp_dir, "colored_prompt.txt")
    with open(colored_prompt, 'w') as f:
        f.write("""Hello Claude! Please create a response with plenty of rich formatting.

Include:
- Bold text
- Tables with borders
- Colorful code examples (with syntax highlighting if possible)
- Bullets and numbering
- Headings and subheadings
- Block quotes
- Horizontal rules

Make it as visually rich as possible to test how well the content capture preserves formatting.
""")
    prompts["colored"] = colored_prompt
    
    # Create an instance file
    instance_file = os.path.join(temp_dir, "test_instances.json")
    
    return {
        "temp_dir": temp_dir,
        "prompts": prompts,
        "instance_file": instance_file
    }


def cleanup_test_environment(env, instance_ids=None):
    """Clean up the test environment."""
    logger.info("\nCleaning up test environment...")
    
    # Stop and delete instances
    if instance_ids:
        manager = ClaudeTaskManager(save_file=env["instance_file"])
        for instance_id in instance_ids:
            try:
                logger.info(f"Stopping instance {instance_id}...")
                manager.stop_instance(instance_id)
                logger.info(f"Deleting instance {instance_id}...")
                manager.delete_instance(instance_id)
            except Exception as e:
                logger.error(f"Error cleaning up instance {instance_id}: {e}")
    
    # Remove the temporary directory
    try:
        import shutil
        shutil.rmtree(env["temp_dir"])
        logger.info(f"Removed test directory: {env['temp_dir']}")
    except Exception as e:
        logger.error(f"Error removing test directory: {e}")


def test_basic_content_capture(manager, env):
    """Test basic content capture from a tmux session."""
    logger.info("\n----- Test: Basic Content Capture -----")
    
    # Create an instance with a short prompt
    instance_id = manager.start_instance(
        project_dir=env["temp_dir"],
        prompt_path=env["prompts"]["short"],
        use_tmux=True,
        open_terminal=False
    )
    
    # Wait for the instance to initialize and generate content
    logger.info("Waiting for Claude to respond...")
    time.sleep(10)
    
    # Get the instance
    instance = manager.instances[instance_id]
    tmux_session = instance.tmux_session_name
    
    # Create a TmuxProcessManager
    tmux_manager = TmuxProcessManager(logger=logger)
    
    # Get content directly from tmux
    try:
        result = subprocess.run(
            ["tmux", "capture-pane", "-pt", tmux_session],
            capture_output=True, 
            text=True,
            check=True
        )
        raw_content = result.stdout
        logger.info(f"Raw tmux content (first 100 chars): {raw_content[:100]}...")
    except Exception as e:
        logger.error(f"Error capturing raw tmux content: {e}")
        raw_content = None
    
    # Get content through the process manager
    process_content = tmux_manager.get_process_content(instance)
    logger.info(f"Process manager content (first 100 chars): {process_content[:100]}...")
    
    # Get content through the task manager
    task_content = manager.get_instance_content(instance_id)
    logger.info(f"Task manager content (first 100 chars): {task_content[:100]}...")
    
    # Verify content was captured
    success = True
    if not raw_content:
        logger.error("Failed to capture raw tmux content")
        success = False
    
    if not process_content:
        logger.error("Failed to capture content through process manager")
        success = False
    
    if not task_content:
        logger.error("Failed to capture content through task manager")
        success = False
    
    # Verify content contains Claude's response
    if "Claude" in process_content and "Hello" in process_content:
        logger.info("✅ Content contains expected text from Claude")
    else:
        logger.error("❌ Content missing expected Claude response")
        success = False
    
    logger.info(f"Basic content capture test {'succeeded' if success else 'failed'}")
    return instance_id, success


def test_code_content_capture(manager, env):
    """Test capturing code content with formatting."""
    logger.info("\n----- Test: Code Content Capture -----")
    
    # Create an instance with a code prompt
    instance_id = manager.start_instance(
        project_dir=env["temp_dir"],
        prompt_path=env["prompts"]["code"],
        use_tmux=True,
        open_terminal=False
    )
    
    # Wait longer for code generation
    logger.info("Waiting for Claude to generate code responses...")
    time.sleep(20)
    
    # Get instance content
    content = manager.get_instance_content(instance_id)
    
    # Check for code blocks
    success = True
    if "def fibonacci" in content:
        logger.info("✅ Content contains fibonacci function")
    else:
        logger.error("❌ Content missing fibonacci function")
        success = False
    
    if "class" in content and "def __init__" in content:
        logger.info("✅ Content contains class definition")
    else:
        logger.error("❌ Content missing class definition")
        success = False
    
    if "def validate_email" in content:
        logger.info("✅ Content contains email validation function")
    else:
        logger.error("❌ Content missing email validation function")
        success = False
    
    # Print a sample of the captured code
    code_lines = []
    in_code_block = False
    for line in content.split('\n'):
        if '```' in line:
            in_code_block = not in_code_block
            if not in_code_block:
                break
        elif in_code_block:
            code_lines.append(line)
    
    if code_lines:
        logger.info("Sample captured code:")
        for line in code_lines[:10]:  # Show first 10 lines of code
            logger.info(f"  {line}")
    
    logger.info(f"Code content capture test {'succeeded' if success else 'failed'}")
    return instance_id, success


def test_complex_content_capture(manager, env):
    """Test capturing complex content with special characters."""
    logger.info("\n----- Test: Complex Content Capture -----")
    
    # Create an instance with a complex prompt
    instance_id = manager.start_instance(
        project_dir=env["temp_dir"],
        prompt_path=env["prompts"]["complex"],
        use_tmux=True,
        open_terminal=False
    )
    
    # Wait for content generation
    logger.info("Waiting for Claude to generate complex content...")
    time.sleep(20)
    
    # Get instance content
    content = manager.get_instance_content(instance_id)
    
    # Check for special elements
    success = True
    
    # Check for special characters
    special_chars = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "-", "=", "[", "]", "{", "}", "\\", "|", ";", ":", "'", "\"", ",", ".", "<", ">", "/", "?"]
    found_special = 0
    for char in special_chars:
        if char in content:
            found_special += 1
    
    if found_special > len(special_chars) / 2:
        logger.info(f"✅ Content contains {found_special}/{len(special_chars)} special characters")
    else:
        logger.error(f"❌ Content only contains {found_special}/{len(special_chars)} special characters")
        success = False
    
    # Look for unicode characters
    if "你好" in content or "こんにちは" in content or "안녕하세요" in content or "Привет" in content:
        logger.info("✅ Content contains Unicode characters")
    else:
        logger.error("❌ Content missing Unicode characters")
        success = False
    
    # Look for common structures
    structures = ["- ", "1. ", "#", "```", "|", ">"]
    found_structures = 0
    for structure in structures:
        if structure in content:
            found_structures += 1
    
    if found_structures > len(structures) / 2:
        logger.info(f"✅ Content contains {found_structures}/{len(structures)} expected structures")
    else:
        logger.error(f"❌ Content only contains {found_structures}/{len(structures)} expected structures")
        success = False
    
    # Print some of the complex content
    if len(content) > 0:
        snippet = content[:500] + "..." if len(content) > 500 else content
        logger.info(f"Complex content sample:\n{snippet}")
    
    logger.info(f"Complex content capture test {'succeeded' if success else 'failed'}")
    return instance_id, success


def test_status_detection(manager, env):
    """Test detecting instance status from content."""
    logger.info("\n----- Test: Status Detection from Content -----")
    
    # Create an instance with a large prompt that will take time to generate
    instance_id = manager.start_instance(
        project_dir=env["temp_dir"],
        prompt_path=env["prompts"]["large"],
        use_tmux=True,
        open_terminal=False
    )
    
    # Get the instance object
    instance = manager.instances[instance_id]
    
    # Create a TmuxProcessManager
    tmux_manager = TmuxProcessManager(logger=logger)
    
    # Wait a moment for generation to start
    logger.info("Waiting for generation to start...")
    time.sleep(10)
    
    # Get status info
    status_info = tmux_manager.get_process_status(instance)
    logger.info(f"Status info during generation: {status_info}")
    
    # Check status fields
    success = True
    if "active" not in status_info:
        logger.error("❌ Status info missing 'active' field")
        success = False
    
    if "detailed_status" not in status_info:
        logger.error("❌ Status info missing 'detailed_status' field")
        success = False
    
    if "is_generating" not in status_info:
        logger.error("❌ Status info missing 'is_generating' field")
        success = False
    
    # If we got the generation time, display it
    if "generation_time" in status_info and status_info["generation_time"]:
        logger.info(f"✅ Detected generation time: {status_info['generation_time']}")
    
    # Manually simulate a generation indicator in the content
    session_name = instance.tmux_session_name
    
    # Send Ctrl+C to interrupt any current process
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        "C-c"
    ], check=True)
    time.sleep(0.5)
    
    # Send content with generation indicators
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        "echo 'Generating response... ███████████████ 45s'", "Enter"
    ], check=True)
    time.sleep(0.5)
    
    # Get updated status
    updated_status = tmux_manager.get_process_status(instance)
    logger.info(f"Status after adding generation indicator: {updated_status}")
    
    # Check detection of generation indicator
    if updated_status.get("is_generating", False):
        logger.info("✅ Successfully detected generation indicator")
    else:
        logger.error("❌ Failed to detect generation indicator")
        success = False
    
    # Check generation time detection
    if updated_status.get("generation_time") == "45s":
        logger.info("✅ Successfully detected generation time")
    else:
        logger.error(f"❌ Failed to detect correct generation time. Got: {updated_status.get('generation_time')}")
        success = False
    
    logger.info(f"Status detection test {'succeeded' if success else 'failed'}")
    return instance_id, success


def test_scrollback_capture(manager, env):
    """Test capturing content with scrollback."""
    logger.info("\n----- Test: Scrollback Content Capture -----")
    
    # Create an instance
    instance_id = manager.start_instance(
        project_dir=env["temp_dir"],
        prompt_path=env["prompts"]["large"],
        use_tmux=True,
        open_terminal=False
    )
    
    # Wait for substantial content generation
    logger.info("Waiting for Claude to generate long content with scrollback...")
    time.sleep(30)  # Wait longer for this test
    
    # Get the instance
    instance = manager.instances[instance_id]
    session_name = instance.tmux_session_name
    
    # Add a marker at the current visible position
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        "C-c"  # Send Ctrl+C to interrupt any current process
    ], check=True)
    time.sleep(0.5)
    
    marker = "=== VISIBLE AREA MARKER ==="
    subprocess.run([
        "tmux", "send-keys", "-t", session_name, 
        f"echo '{marker}'", "Enter"
    ], check=True)
    time.sleep(0.5)
    
    # Capture with and without scrollback
    try:
        # Capture just the visible pane
        visible_result = subprocess.run(
            ["tmux", "capture-pane", "-pt", session_name],
            capture_output=True, 
            text=True
        )
        visible_content = visible_result.stdout
        
        # Capture with scrollback
        scrollback_result = subprocess.run(
            ["tmux", "capture-pane", "-pt", session_name, "-S", "-1000"],
            capture_output=True, 
            text=True
        )
        scrollback_content = scrollback_result.stdout
        
        # Compare lengths
        visible_lines = len(visible_content.split('\n'))
        scrollback_lines = len(scrollback_content.split('\n'))
        
        logger.info(f"Visible content: {visible_lines} lines")
        logger.info(f"Scrollback content: {scrollback_lines} lines")
        
        # The scrollback should have more lines
        success = scrollback_lines > visible_lines
        
        if success:
            logger.info(f"✅ Scrollback capture retrieved {scrollback_lines - visible_lines} additional lines")
        else:
            logger.error("❌ Scrollback capture did not retrieve more content")
        
        # Check for the marker
        if marker in visible_content:
            logger.info("✅ Found marker in visible content")
        else:
            logger.error("❌ Marker not found in visible content")
            success = False
    
    except Exception as e:
        logger.error(f"Error during scrollback test: {e}")
        success = False
    
    logger.info(f"Scrollback capture test {'succeeded' if success else 'failed'}")
    return instance_id, success


def test_colored_content_capture(manager, env):
    """Test capturing colored and formatted content."""
    logger.info("\n----- Test: Colored Content Capture -----")
    
    # Create an instance with a prompt that requests colored output
    instance_id = manager.start_instance(
        project_dir=env["temp_dir"],
        prompt_path=env["prompts"]["colored"],
        use_tmux=True,
        open_terminal=False
    )
    
    # Wait for content generation
    logger.info("Waiting for Claude to generate colored and formatted content...")
    time.sleep(20)
    
    # Get instance content
    content = manager.get_instance_content(instance_id)
    
    # In a real terminal, we'd check for ANSI color codes, but most content
    # capture methods strip these. Instead, we'll check for formatting markers.
    success = True
    
    # Check for code blocks
    if "```" in content:
        logger.info("✅ Content contains code blocks")
    else:
        logger.error("❌ Content missing code blocks")
        success = False
    
    # Check for tables
    if "|" in content and "-+-" in content or "---" in content:
        logger.info("✅ Content contains table formatting")
    else:
        logger.error("❌ Content missing table formatting")
        success = False
    
    # Check for lists
    if ("- " in content or "* " in content) and ("1. " in content or "2. " in content):
        logger.info("✅ Content contains list formatting")
    else:
        logger.error("❌ Content missing list formatting")
        success = False
    
    # Check for headers
    if "#" in content:
        logger.info("✅ Content contains headers")
    else:
        logger.error("❌ Content missing headers")
        success = False
    
    # Print a sample of the content
    if content:
        sample = content[:500] + "..." if len(content) > 500 else content
        logger.info(f"Colored content sample:\n{sample}")
    
    logger.info(f"Colored content capture test {'succeeded' if success else 'failed'}")
    return instance_id, success


def run_all_tests(interactive=False):
    """Run all content capture tests."""
    logger.info(f"Starting tmux content capture tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    env = create_test_environment()
    manager = ClaudeTaskManager(save_file=env["instance_file"])
    instance_ids = []
    results = {}
    
    try:
        # Run all tests
        basic_id, results["basic"] = test_basic_content_capture(manager, env)
        instance_ids.append(basic_id)
        
        code_id, results["code"] = test_code_content_capture(manager, env)
        instance_ids.append(code_id)
        
        complex_id, results["complex"] = test_complex_content_capture(manager, env)
        instance_ids.append(complex_id)
        
        status_id, results["status"] = test_status_detection(manager, env)
        instance_ids.append(status_id)
        
        scrollback_id, results["scrollback"] = test_scrollback_capture(manager, env)
        instance_ids.append(scrollback_id)
        
        colored_id, results["colored"] = test_colored_content_capture(manager, env)
        instance_ids.append(colored_id)
        
        # Print test results without requiring interaction
        print("\n===== Test Results =====")
        for test, result in results.items():
            print(f"{test}: {'✅ Pass' if result else '❌ Fail'}")
        
        # Print a sample of content from each instance instead of interactive exploration
        if interactive:
            print("\nContent samples from each instance:")
            for i, instance_id in enumerate(instance_ids):
                content = manager.get_instance_content(instance_id)
                if content:
                    # Get up to 10 lines of content
                    sample_lines = content.split('\n')[:10]
                    sample = '\n'.join(sample_lines)
                    print(f"\n=== Sample content from instance {instance_id} ===")
                    print(sample)
                    print("...")
        
        # Summarize results
        successes = sum(1 for result in results.values() if result)
        logger.info(f"\n===== Summary: {successes}/{len(results)} tests passed =====")
        for test, result in results.items():
            logger.info(f"{test}: {'✅ Pass' if result else '❌ Fail'}")
        
        return all(results.values())
    
    finally:
        # Clean up unless interactive mode
        if not interactive:
            cleanup_test_environment(env, instance_ids)
        else:
            print("\nNot cleaning up environment due to interactive mode.")
            print(f"Manual cleanup required for instances: {', '.join(instance_ids)}")
            print(f"Temporary directory: {env['temp_dir']}")


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Test tmux content capture features')
    parser.add_argument('--interactive', action='store_true', 
                        help='Run in interactive mode (allows exploration of instance content)')
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_arguments()
    
    success = run_all_tests(interactive=args.interactive)
    
    if success:
        print("\n🎉 All tmux content capture tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tmux content capture tests failed. See log for details.")
        sys.exit(1)
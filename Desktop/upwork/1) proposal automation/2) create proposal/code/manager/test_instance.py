#!/usr/bin/env python3
"""
Create Claude instances programmatically that will be recognized by the interface.
This script/module uses the Claude Task Manager directly to create instances.

Usage as a command:
    python test_instance.py --prompt "Your prompt text here" --project_dir /path/to/project

Usage as a module:
    from test_instance import create_claude_instance
    instance_id = create_claude_instance(prompt="Your prompt", project_dir="/path/to/project")
"""

import os
import sys
import time
import tempfile
import argparse
import logging
import subprocess
import re
from claude_task_manager import ClaudeTaskManager, ClaudeInstance

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_instance')

def get_task_manager():
    """Get a ClaudeTaskManager instance with the standard file path."""
    # Use absolute path to ensure same file is used by web interface
    manager_dir = os.path.dirname(os.path.abspath(__file__))
    save_file = os.path.join(manager_dir, "claude_instances.json")
    
    logger.info(f"Using instance file: {save_file}")
    return ClaudeTaskManager(save_file=save_file)

def create_claude_instance(prompt, project_dir=None, use_tmux=True, save_prompt=False, open_terminal=False):
    """
    Create a Claude instance programmatically.
    
    Args:
        prompt (str): Prompt text or path to prompt file
        project_dir (str, optional): Path to project directory. Defaults to current directory.
        use_tmux (bool, optional): Whether to use tmux (True) or Terminal.app (False). Defaults to True.
        save_prompt (bool, optional): Whether to save the prompt to a persistent file. Defaults to False.
        open_terminal (bool, optional): Whether to automatically open a terminal window. Defaults to False.
    
    Returns:
        str: Instance ID of the created Claude instance
    """
    import uuid
    from claude_task_manager import ClaudeInstance
    
    # Initialize the task manager
    manager = get_task_manager()
    
    # Use current directory if not specified
    if project_dir is None:
        project_dir = os.getcwd()
    
    # Normalize project directory path
    project_dir = os.path.abspath(project_dir)
    
    # Check if project directory exists
    if not os.path.exists(project_dir):
        raise FileNotFoundError(f"Project directory not found: {project_dir}")
    
    # Handle prompt (file or direct text)
    prompt_path = prompt
    temp_file = None
    is_prompt_text = False
    
    # If prompt is not a file path, assume it's direct text
    if not os.path.exists(prompt):
        logger.info("Prompt is direct text, creating temporary file...")
        is_prompt_text = True
        
        # Create a directory for prompt files if saving permanently
        if save_prompt:
            prompt_dir = os.path.join(project_dir, ".claude_prompts")
            os.makedirs(prompt_dir, exist_ok=True)
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            prompt_filename = f"prompt_{timestamp}.txt"
            prompt_path = os.path.join(prompt_dir, prompt_filename)
            
            with open(prompt_path, 'w') as f:
                f.write(prompt)
            logger.info(f"Saved prompt to permanent file: {prompt_path}")
        else:
            # Create temporary file for the prompt text
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".txt", mode="w")
            temp_file.write(prompt)
            temp_file.close()
            prompt_path = temp_file.name
            logger.info(f"Created temporary prompt file: {prompt_path}")
    
    # First verify prompt file exists
    if not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    
    # BYPASS THE MANAGER START_INSTANCE FLOW AND CREATE TMUX SESSION DIRECTLY
    # This matches how the web dashboard handles session creation
    
    # First clear any existing instances with similar names
    # This prevents auto-importing with wrong data (directory/prompt)
    active_sessions = manager.get_active_tmux_sessions()
    
    # Generate a unique ID for the instance
    instance_id = str(uuid.uuid4())[:8]
    logger.info(f"Generated instance ID: {instance_id}")
    
    # Create the tmux session name
    tmux_session_name = f"claude_{instance_id}"
    
    # If a session with this name already exists (extremely unlikely), fail early
    if tmux_session_name in active_sessions:
        raise RuntimeError(f"Session {tmux_session_name} already exists, please try again")
    
    # Create the instance object with EXACT current timestamp
    now = time.time()
    instance = ClaudeInstance(
        id=instance_id,
        project_dir=project_dir,
        prompt_path=prompt_path,
        start_time=now,  # Use exact current time
        status="running",
        use_tmux=use_tmux,
        open_terminal=open_terminal,
        tmux_session_name=tmux_session_name if use_tmux else None
    )
    
    # Store the instance in the manager and save immediately
    # This ensures it's registered BEFORE we create the tmux session
    manager.instances[instance_id] = instance
    manager.save_instances()
    logger.info(f"Registered instance in manager with exact time: {now}")
    
    # Now directly create and configure the tmux session
    if use_tmux:
        logger.info(f"Creating tmux session: {tmux_session_name}")
        try:
            # First, create a detached tmux session
            subprocess.run([
                "tmux", "new-session", "-d", "-s", tmux_session_name
            ], check=True)
            
            # Change to the project directory
            subprocess.run([
                "tmux", "send-keys", "-t", tmux_session_name, 
                f"cd '{project_dir}'", "Enter"
            ], check=True)
            
            # Run the Claude CLI
            logger.info(f"Starting Claude in tmux session {tmux_session_name}")
            subprocess.run([
                "tmux", "send-keys", "-t", tmux_session_name, 
                "claude", "Enter"
            ], check=True)
            
            # Wait for Claude to initialize and the trust prompt to appear
            time.sleep(5)
            logger.info(f"Waited 5 seconds for Claude to initialize in session {tmux_session_name}")
            
            # Auto-accept the trust prompt
            logger.info(f"Sending Enter to handle trust prompt in session {tmux_session_name}")
            subprocess.run([
                "tmux", "send-keys", "-t", tmux_session_name, 
                "Enter"
            ], check=True)
            
            # Wait for the trust prompt to be handled
            time.sleep(2)
            
            # Wait additional time to ensure Claude is fully initialized
            logger.info(f"Waiting 5 more seconds for Claude to initialize fully in session {tmux_session_name}...")
            time.sleep(5)
            
            # Read the prompt content
            with open(prompt_path, 'r') as f:
                prompt_content = f.read()
            
            if prompt_content.strip():
                logger.info(f"Read prompt file. Size: {len(prompt_content)} bytes")
                logger.info(f"Prompt preview: {prompt_content[:100]}...")
                
                # Break the prompt into manageable chunks to avoid issues with long lines
                chunk_size = 500  # Send in 500 character chunks
                
                for i in range(0, len(prompt_content), chunk_size):
                    chunk = prompt_content[i:i+chunk_size]
                    logger.info(f"Sending chunk {i//chunk_size + 1} of {(len(prompt_content) + chunk_size - 1)//chunk_size}")
                    
                    # Send the chunk as literal text to the tmux session
                    subprocess.run([
                        "tmux", "send-keys", "-l", "-t", tmux_session_name, 
                        chunk
                    ], check=True)
                    
                    # Brief pause between chunks
                    time.sleep(0.2)
                
                # Wait longer to ensure prompt content is fully processed
                time.sleep(2)
                
                # Make sure we're still in the tmux session
                check_result = subprocess.run(
                    ["tmux", "has-session", "-t", tmux_session_name],
                    capture_output=True, 
                    check=False
                )
                if check_result.returncode != 0:
                    logger.error(f"tmux session {tmux_session_name} does not exist anymore!")
                    raise RuntimeError(f"Session {tmux_session_name} terminated during prompt delivery")
                
                # Send the first Enter key
                logger.info(f"Sending first Enter key to submit prompt in session {tmux_session_name}...")
                time.sleep(1)  # Wait before sending Enter
                
                subprocess.run([
                    "tmux", "send-keys", "-t", tmux_session_name, 
                    "Enter"
                ], check=True)
                
                # Send a second Enter after a brief pause to ensure it's processed
                time.sleep(1)
                subprocess.run([
                    "tmux", "send-keys", "-t", tmux_session_name, 
                    "Enter"
                ], check=True)
                logger.info(f"Sent second Enter to ensure prompt submission in session {tmux_session_name}")
                
                # Define a function to wait for a keyword in the tmux session
                def wait_for_keyword(session_name, keyword, timeout=60):
                    start = time.time()
                    logger.info(f"Waiting for keyword '{keyword}' in session {session_name} (timeout: {timeout}s)")
                    while time.time() - start < timeout:
                        result = subprocess.run(
                            ["tmux", "capture-pane", "-pt", session_name],
                            capture_output=True, text=True
                        )
                        if keyword in result.stdout:
                            logger.info(f"Found keyword '{keyword}' in session {session_name} after {time.time() - start:.1f}s")
                            return True
                        time.sleep(0.5)
                    logger.warning(f"Timed out waiting for keyword '{keyword}' in session {session_name}")
                    return False
                
                # Wait for and respond to command execution prompts with exact approach from claude_monitor_direct.py
                logger.info("Beginning active monitoring for command execution prompts...")
                
                # Wait for Claude to generate a response and possibly ask about command execution
                time.sleep(5)  # Initial wait for Claude to start generating
                
                # Wait for and respond to "Do you want to" prompt
                if wait_for_keyword(tmux_session_name, "Do you want to "):
                    logger.info(f"Responding 'yes' to 'Do you want to' prompt")
                    subprocess.run([
                        "tmux", "send-keys", "-t", tmux_session_name, 
                        "Enter"
                    ], check=True)
                    
                # Also check for common variations
                for phrase in ["shell command", "execute this", "run this command", "touch abc"]:
                    if wait_for_keyword(tmux_session_name, phrase):
                        logger.info(f"Responding 'yes' to '{phrase}' prompt")
                        subprocess.run([
                            "tmux", "send-keys", "-t", tmux_session_name, 
                            "Enter"
                        ], check=True)
                        time.sleep(1)  # Wait after responding
                
                # Wait a moment for command to execute
                logger.info("Waiting for command to execute...")
                time.sleep(5)
            
            # Open a terminal window if requested
            if open_terminal:
                logger.info(f"Opening terminal window for session {tmux_session_name}")
                subprocess.run([
                    "osascript", "-e", 
                    f'tell application "Terminal" to do script "tmux attach -t {tmux_session_name}"'
                ], check=True)
            
            # Start a monitor thread via the manager
            manager._start_monitor_thread(instance_id)
            
            # Verify our instance is still in the manager with correct data
            # This prevents auto-importing with wrong data
            if instance_id in manager.instances:
                stored_instance = manager.instances[instance_id]
                if stored_instance.project_dir != project_dir or stored_instance.prompt_path != prompt_path:
                    logger.warning(f"Instance data was changed! Restoring correct values.")
                    stored_instance.project_dir = project_dir
                    stored_instance.prompt_path = prompt_path
                    stored_instance.start_time = now  # Restore exact time
                    manager.save_instances()
                
                # Double-check the timestamp hasn't been changed
                if abs(stored_instance.start_time - now) > 1:  # Allow 1 second difference
                    logger.warning(f"Instance start time was changed! Restoring correct value.")
                    stored_instance.start_time = now
                    manager.save_instances()
            
        except Exception as e:
            logger.error(f"Error creating tmux session: {e}")
            # Update instance status
            instance.status = "error"
            manager.save_instances()
            raise RuntimeError(f"Failed to create tmux session: {e}")
    else:
        # For Terminal.app approach, we use the manager's method
        terminal_id = manager._launch_claude_terminal(instance)
        instance.terminal_id = terminal_id
        manager._start_monitor_thread(instance_id)
    
    # Save the updated instances
    manager.save_instances()
    
    logger.info(f"Successfully created instance with ID: {instance_id}")
    
    # Don't delete temp files automatically, as the manager needs access to them
    if temp_file:
        logger.info(f"Note: Temporary prompt file {prompt_path} will not be deleted automatically")
    
    return instance_id

def list_instances():
    """List all Claude instances."""
    manager = get_task_manager()
    return manager.list_instances()

def stop_instance(instance_id):
    """Stop a Claude instance."""
    manager = get_task_manager()
    return manager.stop_instance(instance_id)

def import_tmux_sessions():
    """Import all detected Claude tmux sessions into the task manager."""
    # Get task manager
    manager = get_task_manager()
    
    # Get existing tmux sessions
    tmux_sessions = []
    
    try:
        # Run tmux ls to get all sessions
        result = subprocess.run(
            ["tmux", "ls"], 
            capture_output=True, 
            text=True, 
            check=False
        )
        
        if result.returncode == 0:
            # Parse the output to extract session names
            for line in result.stdout.strip().split('\n'):
                # Look for sessions matching claude_XXXXXXXX pattern
                match = re.search(r'(claude_[0-9a-f]{8}):', line)
                if match:
                    session_name = match.group(1)
                    
                    # Extract the instance ID from the session name
                    instance_id = session_name.split('_')[1]
                    
                    # Extract full date pattern from "created" portion of the tmux output
                    time_match = re.search(r'created ((?:\w+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+\d+))', line)
                    
                    # If the full pattern doesn't match, try a generic pattern and check for relative times
                    if not time_match:
                        # Try the older generic pattern
                        time_match = re.search(r'created (.+?)(?:\)|\s*$)', line)
                    
                    if time_match:
                        # Parse the creation time from the tmux output
                        try:
                            created_str = time_match.group(1)
                            current_time = time.time()
                            
                            # Extract actual timestamp instead of using heuristics
                            if "second" in created_str:
                                # Few seconds ago - extract the number
                                seconds_match = re.search(r'(\d+) seconds?', created_str)
                                seconds = int(seconds_match.group(1)) if seconds_match else 5
                                creation_timestamp = current_time - seconds
                            elif "minute" in created_str:
                                # Few minutes ago - extract the number
                                minutes_match = re.search(r'(\d+) minutes?', created_str)
                                minutes = int(minutes_match.group(1)) if minutes_match else 1
                                creation_timestamp = current_time - (minutes * 60)
                            elif "hour" in created_str:
                                # Few hours ago - extract the number
                                hours_match = re.search(r'(\d+) hours?', created_str)
                                hours = int(hours_match.group(1)) if hours_match else 1
                                creation_timestamp = current_time - (hours * 3600)
                            else:
                                # Try to parse absolute date like "Fri Mar 7 19:53:52 2025"
                                from datetime import datetime
                                try:
                                    # Format: "Day Month DD HH:MM:SS YYYY"
                                    dt = datetime.strptime(created_str, "%a %b %d %H:%M:%S %Y")
                                    creation_timestamp = dt.timestamp()
                                    # Log the parsed date for debugging
                                    logger.info(f"Parsed absolute date: {created_str} -> {dt.strftime('%Y-%m-%d %H:%M:%S')}")
                                except Exception as parse_error:
                                    # If parsing fails, use a default but log detailed error
                                    logger.warning(f"Failed to parse date: '{created_str}' - Error: {parse_error}")
                                    # Try an alternative format
                                    try:
                                        # Try simpler format without seconds
                                        dt = datetime.strptime(created_str.split()[0:4], "%a %b %d %H:%M:%S")
                                        creation_timestamp = dt.timestamp()
                                        logger.info(f"Parsed using alternate format: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
                                    except Exception as alt_error:
                                        logger.warning(f"Alternative parsing also failed: {alt_error}")
                                        creation_timestamp = current_time - 60
                        except Exception as e:
                            logger.warning(f"Error parsing creation time for {session_name}: {e}, using recent timestamp")
                            creation_timestamp = time.time() - 5  # Just 5 seconds ago
                    else:
                        # Default - explicitly log this is happening and set to very recent
                        logger.warning(f"Using default timestamp for {session_name} (couldn't parse time)")
                        creation_timestamp = time.time() - 5  # Just 5 seconds ago
                    
                    tmux_sessions.append({
                        'session_name': session_name,
                        'instance_id': instance_id,
                        'creation_time': creation_timestamp
                    })
    except Exception as e:
        logger.error(f"Error getting tmux sessions: {e}")
    
    if not tmux_sessions:
        logger.info("No Claude tmux sessions detected.")
        return 0
    
    logger.info(f"Found {len(tmux_sessions)} potential Claude tmux sessions.")
    
    # Current working directory 
    cwd = os.getcwd()
    
    # Import each session
    imported_count = 0
    for session in tmux_sessions:
        session_name = session['session_name']
        instance_id = session['instance_id']
        
        # Skip if this instance ID is already known
        if instance_id in manager.instances:
            logger.info(f"Instance {instance_id} already exists in manager, skipping.")
            continue
        
        # Create a new instance object
        instance = ClaudeInstance(
            id=instance_id,
            project_dir=cwd,
            prompt_path="Unknown (imported from existing tmux session)",
            start_time=session['creation_time'],
            status="running",
            tmux_session_name=session_name,
            use_tmux=True
        )
        
        # Add to manager
        manager.instances[instance_id] = instance
        imported_count += 1
        logger.info(f"Imported session {session_name} as instance {instance_id}")
    
    # Save the updated instances
    if imported_count > 0:
        manager.save_instances()
        logger.info(f"Successfully imported {imported_count} tmux sessions.")
    
    return imported_count

def create_default_prompt():
    """Create a default prompt for quick testing."""
    default_prompt = """Hello Claude! 

This is a test instance created by running test_instance.py without parameters.

Please analyze the current project directory and provide a summary of what you find:

1. List all files in the current directory
2. Explain what this project seems to do
3. Suggest any improvements to the codebase

Thanks!
"""
    return default_prompt

def main():
    """Command-line interface for creating Claude instances."""
    parser = argparse.ArgumentParser(description="Create a Claude instance programmatically")
    parser.add_argument("--project_dir", "-p", type=str, help="Path to project directory",
                      default=os.getcwd())
    parser.add_argument("--prompt", "-t", type=str, 
                      help="Prompt text or path to prompt file")
    parser.add_argument("--use_tmux", "-m", action="store_true", 
                      help="Use tmux (default) instead of Terminal.app", default=True)
    parser.add_argument("--no_tmux", "-n", action="store_true", 
                      help="Use Terminal.app instead of tmux")
    parser.add_argument("--save_prompt", "-s", action="store_true",
                      help="Save the prompt text to a permanent file instead of a temp file")
    parser.add_argument("--open_terminal", "-o", action="store_true",
                      help="Automatically open a terminal window to view the session")
    parser.add_argument("--list", "-l", action="store_true",
                      help="List all Claude instances")
    parser.add_argument("--stop", "-k", type=str,
                      help="Stop a Claude instance by ID")
    parser.add_argument("--import-tmux", "-i", action="store_true",
                      help="Import all existing tmux sessions as Claude instances")
    parser.add_argument("--force-new", "-f", action="store_true",
                      help="Force creation of a new instance even if similar ones exist")
    args = parser.parse_args()
    
    # Handle the case of no arguments - create a default instance
    if len(sys.argv) == 1:
        print("No arguments provided. Creating a default instance...")
        args.prompt = create_default_prompt()
        args.save_prompt = True
        args.force_new = True  # Always force new instance in default case
        
        # Display a fancy welcome message
        print("""
┌───────────────────────────────────────────────┐
│                                               │
│   Creating a new Claude instance...           │
│                                               │
│   • Default prompt: Project analysis          │
│   • Runtime: tmux                             │
│   • Prompt will be saved to .claude_prompts/  │
│                                               │
└───────────────────────────────────────────────┘
        """)
        # Continue with the normal flow
    
    # Validate arguments based on operation
    if not (args.list or args.stop or args.import_tmux) and not args.prompt:
        parser.error("--prompt is required when creating an instance")

    # Import tmux sessions if requested
    if args.import_tmux:
        imported_count = import_tmux_sessions()
        if imported_count > 0:
            print(f"Successfully imported {imported_count} tmux sessions.")
        else:
            print("No new tmux sessions were imported.")
        return

    # List instances if requested
    if args.list:
        # First check if there are any tmux sessions to import
        import_tmux_sessions()
        
        instances = list_instances()
        if not instances:
            print("No Claude instances found.")
        else:
            print("\nCurrent Claude Instances:")
            print("-" * 80)
            for instance in instances:
                print(f"ID: {instance['id']} | Status: {instance['status']} | " 
                      f"Yes Count: {instance['yes_count']} | Last Yes: {instance['last_yes']}")
                print(f"  Directory: {instance['project_dir']}")
                print(f"  Prompt: {instance['prompt_path']}")
                print(f"  Uptime: {instance['uptime']}")
                print("-" * 80)
        return

    # Stop instance if requested
    if args.stop:
        success = stop_instance(args.stop)
        if success:
            print(f"Successfully stopped instance {args.stop}")
        else:
            print(f"Failed to stop instance {args.stop}")
        return

    # Create instance
    try:
        # Skip importing sessions when force-new is enabled
        if not args.force_new:
            # Import existing tmux sessions first
            import_tmux_sessions()
        else:
            print("Forcing creation of a new instance (skipping import of existing sessions)")
        
        # Determine runtime type
        use_tmux = args.use_tmux and not args.no_tmux
        
        # Create the instance
        instance_id = create_claude_instance(
            prompt=args.prompt,
            project_dir=args.project_dir,
            use_tmux=use_tmux,
            save_prompt=args.save_prompt,
            open_terminal=args.open_terminal
        )
        
        # Different output format based on whether it was a default instance
        if len(sys.argv) == 1:
            print(f"""
┌───────────────────────────────────────────────┐
│                                               │
│   Success! Claude instance created            │
│                                               │
│   • Instance ID: {instance_id:<24} │
│   • Status: Running                           │
│                                               │
│   View this instance in the dashboard with:   │
│   python3 start_dashboard.py                  │
│                                               │
└───────────────────────────────────────────────┘
            """)
        else:
            print(f"Successfully created instance with ID: {instance_id}")
            print(f"You can now view this instance in the Claude Task Manager dashboard")
        
        return instance_id
    except Exception as e:
        print(f"Error creating instance: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
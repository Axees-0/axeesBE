#!/usr/bin/env python3
import os
import os.path
import subprocess
import time
import json
import datetime
import threading
import uuid
import tempfile
from dataclasses import dataclass, asdict, field
from typing import Dict, List, Optional
from . import claude_monitor  # Import the claude_monitor module for fallback
from . import claude_monitor_direct  # Import the tmux-based implementation


@dataclass
class ClaudeInstance:
    id: str
    project_dir: str
    prompt_path: str
    start_time: float
    status: str = "initializing"  # initializing, running, stopped, completed, standby
    yes_count: int = 0
    last_yes_time: Optional[float] = None
    terminal_id: Optional[str] = None
    tmux_session_name: Optional[str] = None  # Name of tmux session for direct method
    use_tmux: bool = True  # Whether to use tmux-based approach or terminal-based approach
    open_terminal: bool = False  # Whether to automatically open a terminal window
    detailed_status: str = "ready"  # ready or running (actively generating)
    active_since: Optional[float] = None  # When the current active generation started
    ready_since: Optional[float] = None  # When the instance last entered ready state
    generation_time: str = "0s"  # String representation of current generation time
    tmux_content: Optional[str] = None  # Content captured from tmux session for display in dashboard


class ClaudeTaskManager:
    def __init__(self, save_file="claude_instances.json"):
        # Set up debug logging first so it's available throughout initialization
        import logging
        
        # Create a formatter that includes microseconds for more precise debugging
        formatter = logging.Formatter('%(asctime)s.%(msecs)03d - %(name)s - %(levelname)s - %(message)s', 
                                     datefmt='%Y-%m-%d %H:%M:%S')
        
        # Create file handler
        file_handler = logging.FileHandler('claude_manager.log')
        file_handler.setFormatter(formatter)
        
        # Create console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        
        # Configure the root logger
        logging.basicConfig(
            level=logging.INFO,
            handlers=[console_handler, file_handler]
        )
        
        self.logger = logging.getLogger('ClaudeTaskManager')
        
        # Initialize other attributes
        self.instances: Dict[str, ClaudeInstance] = {}
        self.save_file = save_file
        self.monitor_threads = {}
        
        # Load instances
        self.load_instances()

    def load_instances(self):
        """Load instances from save file if it exists."""
        if os.path.exists(self.save_file):
            try:
                with open(self.save_file, 'r') as f:
                    data = json.load(f)
                    for instance_data in data:
                        instance_id = instance_data.pop('id')
                        self.instances[instance_id] = ClaudeInstance(id=instance_id, **instance_data)
                print(f"Loaded {len(self.instances)} instance(s) from {self.save_file}")
                
                # Check for active tmux sessions and update status accordingly
                self._verify_loaded_instances()
            except Exception as e:
                print(f"Error loading instances: {e}")
    
    def _verify_loaded_instances(self):
        """Verify loaded instances against actual tmux sessions and update status."""
        # Get actual running tmux sessions
        active_tmux_sessions = self.get_active_tmux_sessions()
        
        if not active_tmux_sessions:
            self.logger.info("No active tmux sessions found during verification")
            return
            
        self.logger.info(f"Found {len(active_tmux_sessions)} active tmux sessions: {', '.join(active_tmux_sessions.keys())}")
        
        # Update instance statuses based on tmux session existence
        for instance_id, instance in self.instances.items():
            if hasattr(instance, 'use_tmux') and instance.use_tmux:
                # Get the canonical tmux session name
                canonical_session_name = self.get_canonical_session_name(instance)
                
                # Check if this instance's session exists
                session_exists = self.is_tmux_session_active(canonical_session_name, active_tmux_sessions)
                self.logger.info(f"Checking instance {instance_id} with canonical session name '{canonical_session_name}': {'Active' if session_exists else 'Not active'}")
                
                # Update status based on session existence
                if session_exists:
                    # Make sure the tmux_session_name is set correctly
                    instance.tmux_session_name = canonical_session_name
                    
                    # Only update status to running if not in standby or completed state
                    if instance.status != "running" and instance.status != "standby" and instance.status != "completed":
                        self.logger.info(f"Correcting loaded instance {instance_id} status from '{instance.status}' to 'running'")
                        instance.status = "running"
                        self.save_instances()
                else:
                    if instance.status == "running":
                        self.logger.info(f"Setting instance {instance_id} status to 'stopped' - tmux session not found")
                        instance.status = "stopped"
                        self.save_instances()
        
    def get_active_tmux_sessions(self):
        """Get all active tmux sessions with their full details.
        Returns a dictionary mapping session names to their full info lines."""
        active_tmux_sessions = {}
        try:
            result = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    if ':' in line:
                        session_name = line.split(':')[0].strip()
                        active_tmux_sessions[session_name] = line
                        
                        # Always index by the raw session name
                        if session_name.startswith('claude_'):
                            # Also add an entry for the ID without prefix for easy lookup
                            instance_id = session_name[7:]
                            active_tmux_sessions[instance_id] = line
            return active_tmux_sessions
        except Exception as e:
            self.logger.error(f"Error getting tmux sessions: {e}")
            return {}
            
    def get_canonical_session_name(self, instance):
        """Get the canonical tmux session name for an instance.
        Always returns the full session name with the 'claude_' prefix."""
        if hasattr(instance, 'tmux_session_name') and instance.tmux_session_name:
            # If the instance already has a tmux session name, use that as a base
            base_name = instance.tmux_session_name
            
            # Ensure it has the 'claude_' prefix
            if not base_name.startswith('claude_'):
                # This might be an ID directly used as a session name
                if base_name == instance.id:
                    return f"claude_{instance.id}"
                else:
                    # This is already a full session name, but doesn't have the prefix
                    # This is unusual but we'll handle it
                    return f"claude_{base_name}"
            else:
                # Already has the correct prefix
                return base_name
        else:
            # No session name set, use the ID
            return f"claude_{instance.id}"
    
    def is_tmux_session_active(self, session_name, active_sessions=None):
        """Check if a tmux session exists by name, with fallbacks for different naming formats.
        
        This is a critical function for ensuring that UI and tmux sessions remain in sync.
        It first checks for a direct match, then tries alternative formats, and finally
        performs a direct tmux has-session check for maximum reliability.
        
        Args:
            session_name: The canonical session name (with claude_ prefix)
            active_sessions: Optional dict of active sessions from get_active_tmux_sessions()
        
        Returns:
            bool: True if session exists, False otherwise
        """
        if active_sessions is None:
            active_sessions = self.get_active_tmux_sessions()
            
        # First look for exact name match (case sensitive, most reliable)
        if session_name in active_sessions:
            self.logger.info(f"Found direct match for session '{session_name}'")
            return True
            
        # Try without prefix if the name starts with 'claude_'
        if session_name.startswith('claude_'):
            instance_id = session_name[7:]  # Remove 'claude_' prefix
            if instance_id in active_sessions:
                self.logger.info(f"Found match for ID '{instance_id}' from session '{session_name}'")
                return True
                
        # If we didn't find the session in our dictionary, do a direct tmux check
        # This is our most reliable verification method and acts as the final authority
        try:
            result = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True, 
                check=False
            )
            if result.returncode == 0:
                self.logger.info(f"Verified session '{session_name}' exists with direct tmux has-session command")
                
                # If we get here, the session exists but wasn't in our active_sessions dict
                # This indicates a potential synchronization issue that we should log
                if active_sessions:
                    self.logger.warning(f"Session '{session_name}' exists but wasn't in active_sessions dictionary")
                    self.logger.warning(f"Active sessions keys: {list(active_sessions.keys())}")
                
                return True
        except Exception as e:
            self.logger.error(f"Error checking session '{session_name}' with tmux command: {e}")
            
        # Double-check that the session truly doesn't exist with a direct command
        # This handles the case where a session might have been created between checks
        try:
            # Use the direct subprocess call to check for the session
            # This is the final authoritative check
            check_attempt = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True, 
                check=False
            )
            
            if check_attempt.returncode == 0:
                self.logger.warning(f"Final verification found session '{session_name}' exists despite earlier checks")
                return True
        except Exception as e:
            self.logger.error(f"Error in final check for session '{session_name}': {e}")
            
        # If we get here, the session truly doesn't exist
        self.logger.info(f"Confirmed session '{session_name}' does not exist")
        return False

    def save_instances(self):
        """Save instances to file."""
        try:
            # Create a copy of instances for more reliable saving
            instances_to_save = []
            for instance in self.instances.values():
                # Convert to dict with proper handling of None values
                instance_dict = asdict(instance)
                instances_to_save.append(instance_dict)
            
            with open(self.save_file, 'w') as f:
                json.dump(instances_to_save, f, indent=2)
            
            # Log successful save
            self.logger.info(f"Saved {len(instances_to_save)} instances to {self.save_file}")
            
        except Exception as e:
            self.logger.error(f"Error saving instances: {e}")

    def start_instance(self, project_dir, prompt_path=None, prompt_text=None, runtime_type=None, use_tmux=None, open_terminal=False):
        """Start a new Claude instance or reuse an existing one in the same directory.
        
        Args:
            project_dir (str): Path to the project directory
            prompt_path (str, optional): Path to the prompt file. Either prompt_path or prompt_text must be provided.
            prompt_text (str, optional): Direct prompt text to send. Either prompt_path or prompt_text must be provided.
            runtime_type (RuntimeType, optional): Type of runtime to use (TMUX or TERMINAL).
                If provided, overrides use_tmux parameter.
            use_tmux (bool, optional): Whether to use tmux-based approach. Defaults to True.
                DEPRECATED: Use runtime_type instead.
                If True, uses claude_monitor_direct (tmux)
                If False, uses claude_monitor (Terminal.app)
            open_terminal (bool, optional): Whether to automatically open a terminal window. Defaults to False.
                If False, no terminal window is opened automatically; use the dashboard to view.
                If True, a terminal window will be opened for the user to view the session.
        
        Returns:
            str: ID of the created or reused instance
        """
        # Import RuntimeType if it's not already in scope for backward compatibility
        try:
            from src.core.models.instance import RuntimeType
        except ImportError:
            # Define a simple enum-like class for backward compatibility
            class RuntimeType:
                TMUX = "tmux"
                TERMINAL = "terminal"
        
        # Normalize the project directory path to handle any trailing slashes or case differences
        project_dir = os.path.normpath(project_dir)
        
        # Handle runtime_type parameter - prefer runtime_type if provided, fall back to use_tmux
        if runtime_type is not None:
            # Use the provided runtime_type
            use_tmux = runtime_type == RuntimeType.TMUX
            self.logger.info(f"Using runtime_type parameter: {runtime_type}, use_tmux set to: {use_tmux}")
        elif use_tmux is None:
            # If neither parameter is provided, default to tmux
            use_tmux = True
            self.logger.info(f"No runtime type specified, defaulting to use_tmux=True")
        
        # Handle direct prompt text by writing to a temporary file if needed
        if prompt_text and not prompt_path:
            self.logger.info(f"Direct prompt text provided, writing to temporary file")
            # Create a temporary file for the prompt text
            fd, temp_path = tempfile.mkstemp(suffix='.txt', prefix='claude_prompt_')
            try:
                with os.fdopen(fd, 'w') as f:
                    f.write(prompt_text)
                prompt_path = temp_path
                self.logger.info(f"Wrote prompt text to temporary file: {prompt_path}")
            except Exception as e:
                self.logger.error(f"Error writing prompt text to file: {e}")
                return None
        
        # Ensure we have a prompt path
        if not prompt_path:
            self.logger.error("No prompt path or text provided")
            return None
        
        # ALWAYS create a new instance if project directory is provided (don't reuse)
        if project_dir and os.path.exists(project_dir):
            self.logger.info(f"Project directory provided and valid: {project_dir}, creating new instance")
            # Don't try to reuse instances - always create a new one with the provided directory
            # Code will continue to the "new instance" section below
        else:
            # Only try to reuse an instance if no valid project directory was provided
            self.logger.info(f"No valid project directory provided, checking for existing instances")
            
            # Check if there's an existing instance in the same directory
            existing_instance_id = None
            for instance_id, instance in self.instances.items():
                # Normalize the instance directory for comparison
                instance_project_dir = os.path.normpath(instance.project_dir)
                
                if (instance_project_dir == project_dir and 
                    (instance.status == "running" or instance.status == "standby")):
                    self.logger.info(f"Found existing instance {instance_id} in the same directory")
                    existing_instance_id = instance_id
                    break
            
            if existing_instance_id:
                # Reuse the existing instance
                instance = self.instances[existing_instance_id]
                self.logger.info(f"Reusing existing instance {existing_instance_id} in directory: {project_dir}")
                
                # If this is direct prompt text, store it in the prompt_path field
                if prompt_text:
                    # Store the first 200 characters for reference
                    preview = prompt_text[:200] + ("..." if len(prompt_text) > 200 else "")
                    instance.prompt_path = preview
                    self.logger.info(f"Updated instance prompt with direct text (preview): {preview[:50]}...")
                else:
                    # Update the prompt path
                    instance.prompt_path = prompt_path
                    self.logger.info(f"Updated instance prompt path to: {prompt_path}")
                
                # Send the prompt to the existing instance
                if instance.use_tmux:
                    # Use tmux to send the prompt
                    thread = threading.Thread(
                        target=self._send_prompt_to_existing_tmux,
                        args=(instance, prompt_path),
                        daemon=True
                    )
                    thread.start()
                else:
                    # Use Terminal.app to send the prompt
                    self._send_prompt_to_existing_terminal(instance, prompt_path)
                
                # Save instances
                self.save_instances()
                
                return existing_instance_id
        
        # No existing instance found, create a new one
        instance_id = str(uuid.uuid4())[:8]
        
        # For direct prompt text, store a preview in the prompt_path field
        prompt_display = prompt_path
        if prompt_text:
            # Store the first 200 characters for reference
            prompt_display = prompt_text[:200] + ("..." if len(prompt_text) > 200 else "")
            self.logger.info(f"Setting instance prompt to direct text preview: {prompt_display[:50]}...")
        
        # Create the instance object
        instance = ClaudeInstance(
            id=instance_id,
            project_dir=project_dir,
            prompt_path=prompt_display,
            start_time=time.time(),
            status="initializing",  # Explicitly set status to initializing
            use_tmux=use_tmux,
            open_terminal=open_terminal
        )
        
        # Set runtime_type if supported by ClaudeInstance
        if hasattr(ClaudeInstance, 'runtime_type'):
            instance.runtime_type = RuntimeType.TMUX if use_tmux else RuntimeType.TERMINAL
            self.logger.info(f"Set instance runtime_type to: {instance.runtime_type}")
        
        self.logger.info(f"Created new instance {instance_id} with status: {instance.status}")
        
        # Store the instance
        self.instances[instance_id] = instance
        
        if use_tmux:
            # Use tmux-based approach with claude_monitor_direct
            self.logger.info(f"Starting Claude with tmux for instance {instance_id}")
            
            # Generate a unique tmux session name based on the instance ID
            tmux_session_name = f"claude_{instance_id}"
            instance.tmux_session_name = tmux_session_name
            
            # Set runtime_id if supported
            if hasattr(instance, 'runtime_id'):
                instance.runtime_id = tmux_session_name
                self.logger.info(f"Set instance runtime_id to: {instance.runtime_id}")
            
            # Start a thread to handle the tmux session
            threading.Thread(
                target=self._launch_claude_tmux,
                args=(instance,),
                daemon=True
            ).start()
            
            # Wait a bit for the session to be created
            time.sleep(2)
            
            # Start monitoring thread for the tmux session
            self._start_monitor_thread(instance_id)
        else:
            # Use the traditional Terminal.app approach with claude_monitor
            self.logger.info(f"Starting Claude with Terminal.app for instance {instance_id}")
            
            # Launch Terminal with Claude and get the terminal ID
            terminal_id = self._launch_claude_terminal(instance)
            instance.terminal_id = terminal_id
            
            # Set runtime_id if supported
            if hasattr(instance, 'runtime_id'):
                instance.runtime_id = terminal_id
                self.logger.info(f"Set instance runtime_id to: {instance.runtime_id}")
            
            # Start monitoring thread
            self._start_monitor_thread(instance_id)
        
        # If instance has been in initializing state for too long, change to running before returning
        # (don't change status if already in another state like standby, completed, or already running)
        current_time = time.time()
        if instance.status == "initializing" and current_time - instance.start_time > 20:
            self.logger.info(f"Instance {instance_id} has been initializing for over 20 seconds, changing to 'running' state")
            instance.status = "running"
        
        # Save instances
        self.save_instances()
        
        return instance_id

    def _launch_claude_tmux(self, instance):
        """Launch a tmux session running Claude using claude_monitor_direct."""
        # Check if prompt file exists and log it
        self.logger.info(f"Launching Claude with tmux in project dir: {instance.project_dir}, prompt: {instance.prompt_path}")
        self.logger.info(f"Instance {instance.id} status at start of launch: {instance.status}")
        
        if not os.path.exists(instance.prompt_path):
            self.logger.error(f"ERROR: Prompt file not found at: {instance.prompt_path}")
            instance.status = "error"
            self.save_instances()
            return False
            
        if not os.path.exists(instance.project_dir):
            self.logger.error(f"ERROR: Project directory not found at: {instance.project_dir}")
            instance.status = "error"
            self.save_instances()
            return False
        
        # Create a new tmux session with the instance's session name
        self.logger.info(f"Creating tmux session: {instance.tmux_session_name}")
        
        try:
            # First, make sure we create a session that is detached
            subprocess.run([
                "tmux", "new-session", "-d", "-s", instance.tmux_session_name
            ], check=True)
            
            # Change to the project directory
            subprocess.run([
                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                f"cd '{instance.project_dir}'", "Enter"
            ], check=True)
            
            # Run the Claude CLI
            self.logger.info(f"Running claude in tmux session {instance.tmux_session_name}")
            subprocess.run([
                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                "claude", "Enter"
            ], check=True)
            
            # Wait for Claude to initialize and the trust prompt to appear
            time.sleep(5)
            self.logger.info("Waited 5 seconds for Claude to initialize")
            
            # Auto-accept the trust prompt
            self.logger.info("Handling trust prompt by sending Enter")
            subprocess.run([
                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                "Enter"
            ], check=True)
            
            # Wait for the trust prompt to be handled
            time.sleep(2)
            
            # Read the prompt content
            try:
                with open(instance.prompt_path, 'r') as f:
                    prompt_content = f.read()
                
                if not prompt_content.strip():
                    self.logger.error(f"ERROR: Prompt file is empty: {instance.prompt_path}")
                    instance.status = "error"
                    self.save_instances()
                    return False
                    
                # Log the prompt size to debug
                self.logger.info(f"Read prompt file. Size: {len(prompt_content)} bytes")
                self.logger.info(f"Prompt preview: {prompt_content[:100]}...")
                
                # Send the prompt content to the tmux session
                self.logger.info(f"Sending prompt content from: {instance.prompt_path}")
                
                # Wait a bit longer to make sure Claude is fully initialized
                self.logger.info("Waiting 5 more seconds for Claude to initialize fully...")
                time.sleep(5)
                
                # The most direct approach - use send-keys with the literal flag (most reliable)
                try:
                    self.logger.info(f"Using direct tmux send-keys for prompt to session {instance.tmux_session_name}")
                    self.logger.info(f"Prompt length: {len(prompt_content)} characters")
                    
                    # Break the prompt into manageable chunks to avoid issues with long lines
                    chunk_size = 500  # Send in 500 character chunks
                    
                    for i in range(0, len(prompt_content), chunk_size):
                        chunk = prompt_content[i:i+chunk_size]
                        self.logger.info(f"Sending chunk {i//chunk_size + 1} of {(len(prompt_content) + chunk_size - 1)//chunk_size} to tmux session {instance.tmux_session_name}")
                        
                        # Send the chunk as literal text to the tmux session
                        # Handle the case where text starts with a dash that might be interpreted as a flag
                        if chunk.startswith('-'):
                            # Add -- to indicate end of options
                            subprocess.run([
                                "tmux", "send-keys", "-l", "-t", instance.tmux_session_name, "--",
                                chunk
                            ], check=True)
                        else:
                            subprocess.run([
                                "tmux", "send-keys", "-l", "-t", instance.tmux_session_name, 
                                chunk
                            ], check=True)
                        
                        # Brief pause between chunks
                        time.sleep(0.2)
                    
                    self.logger.info(f"Successfully sent complete prompt to tmux session {instance.tmux_session_name}")
                    
                    # Ensure status is set to running after successful prompt delivery
                    # (Only if not already in standby or completed state)
                    if instance.status != "standby" and instance.status != "completed":
                        instance.status = "running"
                        self.logger.info(f"Changing instance {instance.id} status from 'initializing' to 'running' after prompt delivery")
                        self.save_instances()
                except Exception as e:
                    self.logger.error(f"Failed to send prompt via tmux send-keys: {e}")
                    instance.status = "error"
                    self.save_instances()
                    return False
                
                # Send an additional Enter to submit the prompt
                self.logger.info("Waiting 2 seconds before submitting prompt...")
                time.sleep(2)
                
                # Make sure we're still in the tmux session
                self.logger.info("Checking if tmux session still exists...")
                check_result = subprocess.run(
                    ["tmux", "has-session", "-t", instance.tmux_session_name],
                    capture_output=True, 
                    check=False
                )
                if check_result.returncode != 0:
                    self.logger.error(f"tmux session {instance.tmux_session_name} does not exist anymore!")
                    instance.status = "error"
                    self.save_instances()
                    return False
                
                # Send the Enter key
                self.logger.info(f"Sending Enter key to submit prompt in session {instance.tmux_session_name}...")
                time.sleep(1)  # Wait a bit before sending Enter to make sure the paste is complete
                
                enter_result = subprocess.run([
                    "tmux", "send-keys", "-t", instance.tmux_session_name, 
                    "Enter"
                ], check=True, capture_output=True)
                
                if enter_result.stdout:
                    self.logger.info(f"Enter key stdout: {enter_result.stdout}")
                if enter_result.stderr:
                    self.logger.info(f"Enter key stderr: {enter_result.stderr}")
                    
                self.logger.info(f"Sent Enter to submit prompt in session {instance.tmux_session_name}")
                
                # Send a second Enter after a brief pause to ensure it's processed
                time.sleep(1)
                second_enter = subprocess.run([
                    "tmux", "send-keys", "-t", instance.tmux_session_name, 
                    "Enter"
                ], check=True, capture_output=True)
                self.logger.info(f"Sent second Enter to ensure prompt submission in session {instance.tmux_session_name}")
                
                # Ensure status is set to running (only if not in standby or completed)
                if instance.status != "standby" and instance.status != "completed":
                    instance.status = "running"
                    self.save_instances()
                
            except Exception as e:
                self.logger.error(f"Error sending prompt content: {e}")
                instance.status = "error"
                self.save_instances()
                return False
            
            # Create an optional window for the user to view the session - only if open_terminal is True
            if hasattr(instance, 'open_terminal') and instance.open_terminal:
                self.logger.info(f"Opening terminal window for session {instance.tmux_session_name}")
                subprocess.run([
                    "osascript", "-e", 
                    f'tell application "Terminal" to do script "tmux attach -t {instance.tmux_session_name}"'
                ], check=True)
            else:
                self.logger.info(f"Not opening terminal window (open_terminal=False)")
            
            # Final status update to ensure it's running (if not in standby or completed)
            if instance.status != "standby" and instance.status != "completed":
                instance.status = "running"
                self.save_instances()
                self.logger.info(f"Successfully launched Claude in tmux session {instance.tmux_session_name}, status changed from 'initializing' to 'running'")
            
            return True
        
        except Exception as e:
            self.logger.error(f"Error launching Claude in tmux: {e}")
            instance.status = "error"
            self.save_instances()
            return False
    
    def _launch_claude_terminal(self, instance):
        """Launch a terminal window running Claude."""
        # Check if prompt file exists and log it
        self.logger.info(f"Launching Claude with project dir: {instance.project_dir}, prompt: {instance.prompt_path}")
        
        if not os.path.exists(instance.prompt_path):
            self.logger.error(f"ERROR: Prompt file not found at: {instance.prompt_path}")
            return None
            
        if not os.path.exists(instance.project_dir):
            self.logger.error(f"ERROR: Project directory not found at: {instance.project_dir}")
            return None
        
        # Launch Terminal in the project directory and run claude - using claude_monitor
        launch_cmd = f"cd '{instance.project_dir}' && claude"
        
        # Launch the terminal with claude
        launch_script = f'''
        tell application "Terminal"
            set newTab to do script "{launch_cmd}"
            set custom title of tab 1 of window 1 to "Claude-{instance.id}"
            activate
            return id of newTab
        end tell
        '''
        
        self.logger.info(f"Executing launch script: {launch_script}")
        result = subprocess.run(["osascript", "-e", launch_script], capture_output=True, text=True)
        terminal_id = result.stdout.strip()
        self.logger.info(f"Launched terminal with ID: {terminal_id}")
        
        # Wait for Claude to initialize
        time.sleep(5)
        self.logger.info("Waited 5 seconds for Claude to initialize")
        
        # Use claude_monitor to handle the trust prompt with the specific terminal ID
        claude_monitor.monitor_trust_prompt(terminal_id=terminal_id)
        self.logger.info("Called claude_monitor.monitor_trust_prompt() with terminal ID")
        
        # Use claude_monitor to send the prompt content with the specific terminal ID
        self.logger.info(f"Now sending prompt content from: {instance.prompt_path}")
        claude_monitor.send_clipboard_content(instance.prompt_path, terminal_id=terminal_id)
        self.logger.info("Called claude_monitor.send_clipboard_content() with terminal ID")
        
        return terminal_id

    def _start_monitor_thread(self, instance_id):
        """Start a thread to monitor a Claude instance."""
        thread = threading.Thread(
            target=self._monitor_instance,
            args=(instance_id,),
            daemon=True
        )
        thread.start()
        self.monitor_threads[instance_id] = thread

    def _monitor_instance(self, instance_id):
        """Monitor a Claude instance for activity and 'yes' prompts."""
        instance = self.instances.get(instance_id)
        if not instance:
            return
        
        check_interval = 2  # 2 seconds for faster prompt detection
        max_runtime = 3 * 60 * 60  # 3 hours max runtime
        start_time = time.time()
        max_monitor_minutes = 180  # 3 hours
        
        # Start monitoring 
        if instance.use_tmux:
            self.logger.info(f"Starting monitoring for tmux session {instance.tmux_session_name} for instance {instance_id}")
            self.logger.info(f"Instance {instance_id} status at start of monitoring: {instance.status}")
            
            # First check to ensure session exists
            try:
                result = subprocess.run(
                    ["tmux", "has-session", "-t", instance.tmux_session_name],
                    capture_output=True, 
                    check=False
                )
                if result.returncode != 0:
                    self.logger.warning(f"Warning: tmux session {instance.tmux_session_name} not found at start of monitoring")
                else:
                    self.logger.info(f"Confirmed tmux session {instance.tmux_session_name} exists")
            except Exception as e:
                self.logger.error(f"Error checking tmux session existence: {e}")
        else:
            self.logger.info(f"Starting monitoring for terminal {instance.terminal_id} for instance {instance_id}")
            self.logger.info(f"Instance {instance_id} status at start of monitoring: {instance.status}")
        
        # Ensure status is running at the start of monitoring if not in standby or completed state
        if instance.status != "running" and instance.status != "standby" and instance.status != "completed":
            self.logger.info(f"Correcting instance {instance_id} status from '{instance.status}' to 'running' at start of monitoring")
            instance.status = "running"
            self.save_instances()
            
        # Log monitoring parameters for debugging
        self.logger.info(f"Monitoring parameters: check_interval={check_interval}s, max_runtime={max_runtime}s")
        self.logger.info(f"Will monitor for up to {max_monitor_minutes} minutes or until status changes from 'running' or 'standby'")
        
        while instance.status == "running" or instance.status == "standby":
            # Check if we've exceeded max runtime
            if time.time() - start_time > max_runtime:
                self.logger.info(f"Instance {instance_id}: Reached maximum monitoring time of 3 hours")
                break
            
            try:
                responded = False
                
                if instance.use_tmux:
                    # Get content from tmux session
                    try:
                        result = subprocess.run(
                            ["tmux", "capture-pane", "-pt", instance.tmux_session_name],
                            capture_output=True, text=True
                        )
                        content = result.stdout
                    except Exception as e:
                        self.logger.error(f"Error capturing tmux pane content: {e}")
                        content = ""
                else:
                    # Get the terminal content with the specific terminal ID
                    content = claude_monitor.get_terminal_content(terminal_id=instance.terminal_id)
                
                # Log content for debugging (truncate to avoid huge logs)
                if content:
                    preview = content[:150] + "..." if len(content) > 150 else content
                    self.logger.info(f"Checking content for instance {instance_id} (preview): {preview}")
                '''
                # Check for completion keywords first
                completion_keywords = ["complete", "key improvements", "success", "successfully", "summary", "summarize" 
                                     "key takeaways", "in conclusion", "final result", "completion"]
                
                # Check for standby keywords
                standby_keywords = ["created", "implemented"]
                
                # Convert content to lowercase for case-insensitive matching
                content_lower = content.lower()
                
                # Check for completion patterns in the content
                if any(keyword.lower() in content_lower for keyword in completion_keywords):
                    self.logger.info(f"Instance {instance_id}: Detected completion keyword, setting status to standby")
                    instance.status = "standby"
                    self.save_instances()
                    
                # Check for standby keywords in the content
                elif any(keyword in content for keyword in standby_keywords):
                    self.logger.info(f"Instance {instance_id}: Detected standby keyword, setting status to standby")
                    instance.status = "standby"
                    self.save_instances()
                '''
                # Check for prompts and respond to them
                if content:

                    # Then check for the standard prompts
                    if "Yes, and don't ask again for" in content:
                        self.logger.info(f"Instance {instance_id}: Found 'Yes, and don't ask again for' prompt")
                        
                        if instance.use_tmux:
                            # Select the second option (down arrow + enter)
                            subprocess.run([
                                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                "Down"
                            ], check=True)
                            subprocess.run([
                                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                "Enter"
                            ], check=True)
                        else:
                            # Use the terminal approach
                            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to key code 125'])
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                        
                        responded = True

                    # Special handle for Claude UI arrow selection dialog with "❯ Yes"
                    elif "❯ Yes" in content:
                        self.logger.info(f"Instance {instance_id}: Found arrow-based UI dialog with '❯ Yes' option")
                        
                        # Detect file creation dialog specifically for debugging
                        if "Do you want to create" in content:
                            # Log the relevant section of content for debugging
                            content_lines = content.split('\n')
                            relevant_lines = []
                            found_line = -1
                            
                            # Find the line with "Do you want to create"
                            for i, line in enumerate(content_lines):
                                if "Do you want to create" in line:
                                    found_line = i
                                    break
                            
                            # Extract context (2 lines before and 5 lines after)
                            if found_line >= 0:
                                start_line = max(0, found_line - 2)
                                end_line = min(len(content_lines), found_line + 6)
                                relevant_lines = content_lines[start_line:end_line]
                                relevant_context = '\n'.join(relevant_lines)
                                
                                self.logger.info(f"⭐️ FILE CREATION DIALOG detected: 'Do you want to create' in UI")
                                self.logger.info(f"⭐️ CONTEXT:\n{relevant_context}")
                            else:
                                self.logger.info(f"⭐️ FILE CREATION DIALOG detected: 'Do you want to create' in UI")
                                # Log a portion of the content for debugging
                                self.logger.info(f"⭐️ PARTIAL CONTENT:\n{content[:300]}")
                        
                        elif "Create file" in content:
                            # Same approach for "Create file"
                            content_lines = content.split('\n')
                            relevant_lines = []
                            found_line = -1
                            
                            # Find the line with "Create file"
                            for i, line in enumerate(content_lines):
                                if "Create file" in line:
                                    found_line = i
                                    break
                            
                            # Extract context
                            if found_line >= 0:
                                start_line = max(0, found_line - 2)
                                end_line = min(len(content_lines), found_line + 6)
                                relevant_lines = content_lines[start_line:end_line]
                                relevant_context = '\n'.join(relevant_lines)
                                
                                self.logger.info(f"⭐️ FILE CREATION DIALOG detected: 'Create file' in UI")
                                self.logger.info(f"⭐️ CONTEXT:\n{relevant_context}")
                            else:
                                self.logger.info(f"⭐️ FILE CREATION DIALOG detected: 'Create file' in UI")
                                # Log a portion of the content for debugging
                                self.logger.info(f"⭐️ PARTIAL CONTENT:\n{content[:300]}")
                        
                        if instance.use_tmux:
                            # Using the exact same approach as claude_monitor_direct.py
                            # Simply send Enter - Claude's UI is designed to use Enter to confirm the highlighted option
                            self.logger.info(f"UI Dialog: Sending Enter to confirm '❯ Yes' option (claude_monitor_direct approach)")
                            
                            # Send Enter key - this is exactly what claude_monitor_direct.py does
                            subprocess.run([
                                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                "Enter"
                            ], check=True)
                        else:
                            # Use the terminal approach
                            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
                            self.logger.info(f"Terminal: Sending Enter to confirm '❯ Yes' option")
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                        
                        # Add a specific "UI dialog responding" log
                        self.logger.info(f"⭐️ RESPONDED to UI dialog with '❯ Yes' option")
                        responded = True
                        
                    # Regular "Yes" option without the arrow
                    elif "Yes" in content or "Do you want to create" in content or "Create file" in content:
                        self.logger.info(f"Instance {instance_id}: Found Yes prompt or file creation dialog")
                        
                        # Log extra info to debug the specific pattern
                        if "Do you want to create" in content:
                            self.logger.info(f"⭐️ FILE CREATION DIALOG detected: 'Do you want to create' in UI")
                        elif "Create file" in content:
                            self.logger.info(f"⭐️ FILE CREATION DIALOG detected: 'Create file' in UI")
                        
                        if instance.use_tmux:
                            # For regular Yes prompts, just send Enter 
                            self.logger.info(f"Sending Enter to select Yes option")
                            subprocess.run([
                                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                "Enter"
                            ], check=True)
                        else:
                            # Use the terminal approach
                            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                        
                        # We no longer increment yes_count here - it's now handled only in the final block
                        responded = True
                        
                    # Plain "Do you want to" detection - exactly like in claude_monitor_direct.py
                    elif "Do you want to" in content:
                        self.logger.info(f"Instance {instance_id}: Found 'Do you want to' prompt")
                        
                        # Log the relevant section of content for debugging
                        content_lines = content.split('\n')
                        relevant_lines = []
                        found_line = -1
                        
                        # Find the line with "Do you want to"
                        for i, line in enumerate(content_lines):
                            if "Do you want to" in line:
                                found_line = i
                                break
                        
                        # Extract context (2 lines before and 3 lines after)
                        if found_line >= 0:
                            start_line = max(0, found_line - 2)
                            end_line = min(len(content_lines), found_line + 4)
                            relevant_lines = content_lines[start_line:end_line]
                            relevant_context = '\n'.join(relevant_lines)
                            
                            self.logger.info(f"⭐️ 'DO YOU WANT TO' CONTEXT:\n{relevant_context}")
                        else:
                            # Log a portion of the content for debugging
                            self.logger.info(f"⭐️ PARTIAL CONTENT:\n{content[:300]}")
                        
                        if instance.use_tmux:
                            # Using the exact same approach as claude_monitor_direct.py
                            self.logger.info(f"Sending Enter to respond to 'Do you want to' prompt (claude_monitor_direct approach)")
                            
                            # Send Enter key - this is exactly what claude_monitor_direct.py does
                            subprocess.run([
                                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                "Enter"
                            ], check=True)
                        else:
                            # Use the terminal approach
                            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
                            self.logger.info(f"Terminal: Sending Enter to respond to 'Do you want to' prompt")
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                        
                        self.logger.info(f"⭐️ RESPONDED to 'Do you want to' prompt")
                        responded = True
                        
                    # Enhanced detection for all variations of shell command execution prompts
                    elif any(pattern in content.lower() for pattern in [
                        "do you want to", 
                        "execute this", 
                        "run this", 
                        "shell command", 
                        "touch abc", 
                        "execute the command", 
                        "do you want to proceed", 
                        "i'll need your permission", 
                        "would you like me to",
                        "shall i proceed",
                        "create a file",
                        "write to a file",
                        "create directory",
                        "proceed with",
                        "mkdir",
                        "touch",
                        "create the file",
                        "permission to",
                        "your approval to",
                        "confirm that you want",
                        "grant permission",
                        "allow me to",
                        "may i proceed",
                        "confirm execution",
                        "ls -la",
                        "cat ",
                        "write the",
                        "open file",
                        "now i'll",
                        "using bash",
                        "i need to",
                        "i can now",
                        "let me create"
                    ]):
                        self.logger.info(f"Instance {instance_id}: Found shell command execution prompt")
                        
                        # We no longer increment yes_count here - it's now handled only in the final block
                        
                        # Log extra info for "Do you want to" specifically for debugging
                        if "do you want to" in content.lower():
                            self.logger.info(f"Specifically detected 'Do you want to' in content: {content[:150]}...")
                        
                        if instance.use_tmux:
                            # Using the exact approach from claude_monitor_direct.py which is proven to work
                            
                            # Check if arrow key selection menu is shown
                            if "❯ Yes" in content:
                                # Arrow key selection menu detected
                                self.logger.info(f"Instance {instance_id}: Detected arrow key selection menu with '❯ Yes' option")
                                
                                # For the arrow key menu, we need to be more aggressive
                                # First, send an Enter key with normal approach
                                self.logger.info(f"Sending Enter to select default Yes option (attempt 1)")
                                subprocess.run([
                                    "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                    "Enter"
                                ], check=True)
                                
                                # Wait a bit and check if the menu is still there
                                time.sleep(0.5)
                                result = subprocess.run(
                                    ["tmux", "capture-pane", "-pt", instance.tmux_session_name],
                                    capture_output=True, text=True
                                )
                                updated_content = result.stdout
                                
                                # If the menu is still there, try a different approach
                                if "❯ Yes" in updated_content:
                                    self.logger.info(f"Menu still detected, sending C-m instead (attempt 2)")
                                    subprocess.run([
                                        "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                        "C-m"  # Try Ctrl+M which is equivalent to Enter but processed differently
                                    ], check=True)
                                    
                                    # Check again and try a third approach if needed
                                    time.sleep(0.5)
                                    result = subprocess.run(
                                        ["tmux", "capture-pane", "-pt", instance.tmux_session_name],
                                        capture_output=True, text=True
                                    )
                                    updated_content = result.stdout
                                    
                                    if "❯ Yes" in updated_content:
                                        self.logger.info(f"Menu still detected, trying space key (attempt 3)")
                                        subprocess.run([
                                            "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                            "Space"  # Try space key as an alternative
                                        ], check=True)
                            else:
                                # Regular prompt - try to match the exact trigger phrases
                                self.logger.info(f"Sending Enter key to accept command execution in session {instance.tmux_session_name}")
                                
                                # Direct check for "Do you want to" pattern
                                if "do you want to" in content.lower():
                                    self.logger.info(f"⭐️ DIRECT MATCH for 'Do you want to', sending Enter")
                                    # Send Enter key immediately for "Do you want to" prompts
                                    subprocess.run([
                                        "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                        "Enter"
                                    ], check=True)
                                    time.sleep(0.5)
                                    # Send another Enter for good measure
                                    subprocess.run([
                                        "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                        "Enter"
                                    ], check=True)
                                    responded = True
                                
                                # First try to detect if it's a direct command prompt
                                for prompt_type in ["I'll need your permission", "Would you like me to", "create a file", "permission to", "confirm that you want", "allow me to", "may i proceed", "shall i proceed"]:
                                    if prompt_type.lower() in content.lower():
                                        self.logger.info(f"Detected explicit permission request type: '{prompt_type}', sending 'yes' followed by Enter")
                                        
                                        # First send yes
                                        subprocess.run([
                                            "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                            "yes"
                                        ], check=True)
                                        time.sleep(0.5)
                                        
                                        # Capture content to see if 'yes' was accepted or if we need additional response
                                        try:
                                            check_result = subprocess.run(
                                                ["tmux", "capture-pane", "-pt", instance.tmux_session_name],
                                                capture_output=True, text=True
                                            )
                                            if "yes" in check_result.stdout.lower()[-20:]:
                                                self.logger.info("Detected 'yes' in recent output, continuing with Enter key")
                                            else:
                                                self.logger.info("Did not see 'yes' in output, checking if we need to try a capital Y")
                                                # Try to send a capital Y as well for safety
                                                subprocess.run([
                                                    "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                                    "Y"
                                                ], check=True)
                                                time.sleep(0.25)
                                        except Exception as e:
                                            self.logger.error(f"Error checking after sending 'yes': {e}")
                                        
                                        responded = True
                                        break
                                
                                # Always send Enter after any text (twice for good measure)
                                subprocess.run([
                                    "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                    "Enter"
                                ], check=True)
                                
                                # Wait and send a second Enter to ensure confirmation
                                time.sleep(0.5)
                                subprocess.run([
                                    "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                    "Enter"
                                ], check=True)
                                
                                # Ensure responded flag is set
                                responded = True
                            
                            # Wait longer to allow the command to execute
                            time.sleep(2)
                            
                            # Check if the command execution was successful by looking for confirmation in the pane
                            try:
                                result = subprocess.run(
                                    ["tmux", "capture-pane", "-pt", instance.tmux_session_name],
                                    capture_output=True, text=True
                                )
                                after_content = result.stdout.lower()
                                
                                # Look for common success indicators
                                if ("command executed" in after_content or 
                                    "created file" in after_content or 
                                    "executed successfully" in after_content or
                                    "command completed" in after_content or
                                    "file created" in after_content):
                                    self.logger.info(f"Confirmed command execution success for instance {instance_id}")
                                else:
                                    # Check if selection menu is still visible - if so, try Space key as last resort
                                    if "❯ Yes" in after_content:
                                        self.logger.info(f"Menu still visible after attempts, trying Space key as final attempt")
                                        subprocess.run([
                                            "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                            "Space"
                                        ], check=True)
                            except Exception as e:
                                self.logger.error(f"Error checking command execution status: {e}")
                            
                            self.logger.info(f"Successfully responded to command execution prompt for instance {instance_id}")
                        else:
                            # Use the terminal approach with enhanced handling
                            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
                            
                            # Direct check for "Do you want to" pattern
                            if "do you want to" in content.lower():
                                self.logger.info(f"⭐️ DIRECT MATCH for 'Do you want to' in terminal, sending Enter")
                                # Send Enter key immediately for "Do you want to" prompts
                                subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                                time.sleep(0.5)
                                # Send another Enter for good measure
                                subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                                responded = True
                            
                            # Try to detect the specific prompt type
                            for prompt_type in ["I'll need your permission", "Would you like me to", "create a file", "permission to", "confirm that you want", "allow me to", "may i proceed", "shall i proceed"]:
                                if prompt_type.lower() in content.lower():
                                    self.logger.info(f"Detected explicit permission request type: '{prompt_type}', sending 'yes' followed by Enter")
                                    
                                    # First type 'yes'
                                    subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke "yes"'])
                                    time.sleep(0.5)
                                    
                                    # Check if we need to try a capital Y as well
                                    updated_content = claude_monitor.get_terminal_content(terminal_id=instance.terminal_id)
                                    if updated_content and "yes" in updated_content.lower()[-20:]:
                                        self.logger.info("Detected 'yes' in recent output, continuing with Enter key")
                                    else:
                                        self.logger.info("Did not see 'yes' in output, trying a capital Y")
                                        subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke "Y"'])
                                        time.sleep(0.25)
                                    
                                    responded = True
                                    break
                            
                            # Always send Enter after any text
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                            
                            # Wait and send a second Enter to ensure confirmation
                            time.sleep(0.5)  
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                            
                            # Always ensure responded is set
                            responded = True
                        
                        
                    elif "Yes," in content:
                        self.logger.info(f"Instance {instance_id}: Found 'Yes,' prompt")
                        
                        if instance.use_tmux:
                            # Send Enter to accept the prompt
                            subprocess.run([
                                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                "Enter"
                            ], check=True)
                        else:
                            # Use the terminal approach
                            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                        
                        # We no longer increment yes_count here - it's now handled only in the final block
                        responded = True
                        
                    elif "Do you trust the files in this folder?" in content:
                        self.logger.info(f"Instance {instance_id}: Found trust prompt")
                        
                        if instance.use_tmux:
                            # Send Enter to accept the trust prompt
                            subprocess.run([
                                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                "Enter"
                            ], check=True)
                        else:
                            # Use the terminal approach
                            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                        
                        # Trust prompts should not increment the yes_count as they're not user interactions
                        # but we still set responded=True to log the response
                        responded = True
                        self.logger.info(f"Responded to trust prompt for instance {instance_id} (not counting in yes_count)")
                        
                    # For any prompt we responded to, ALWAYS increment the yes count
                    # This is a complete rewrite of the counting logic to fix the issue
                    if responded:
                        # Special case: Don't count trust prompts
                        if "Do you trust the files in this folder?" in content:
                            self.logger.info(f"Not incrementing yes_count for trust prompt for instance {instance_id}")
                        else:
                            # For ALL other responses, increment yes_count
                            # Remove all specific counter incrementing in the individual handlers
                            old_count = instance.yes_count
                            instance.yes_count += 1
                            instance.last_yes_time = time.time()
                            self.logger.info(f"⭐ YES COUNT: Incremented from {old_count} to {instance.yes_count} for instance {instance_id}")
                            
                            # Save after EVERY increment to ensure it's persisted
                            self.save_instances()
                        
                        self.logger.info(f"Successfully responded to prompt. Current yes count: {instance.yes_count}")
            except Exception as e:
                self.logger.error(f"Error during monitoring: {e}")
            
            # Report monitoring status
            elapsed = time.time() - start_time
            self.logger.info(f"Instance {instance_id}: Monitoring for phrases ({int(elapsed)} seconds elapsed)")
            
            # Sleep before next check
            time.sleep(check_interval)
            
            # Update instance in case it was modified externally
            instance = self.instances.get(instance_id)
            if not instance or (instance.status != "running" and instance.status != "standby"):
                break

    def stop_instance(self, instance_id):
        """Stop a running Claude instance."""
        instance = self.instances.get(instance_id)
        if not instance:
            print(f"Instance {instance_id} not found")
            return False
        
        # Change status
        instance.status = "stopped"
        self.logger.info(f"Changed instance {instance_id} status to 'stopped'")
        
        if instance.use_tmux:
            # Stop the tmux session
            self.logger.info(f"Stopping tmux session for instance {instance_id}: {instance.tmux_session_name}")
            
            try:
                # First send Ctrl+C twice to interrupt any running processes
                self.logger.info(f"Sending Ctrl+C to tmux session")
                subprocess.run([
                    "tmux", "send-keys", "-t", instance.tmux_session_name, 
                    "C-c"
                ], check=False)
                time.sleep(0.5)
                subprocess.run([
                    "tmux", "send-keys", "-t", instance.tmux_session_name, 
                    "C-c"
                ], check=False)
                time.sleep(0.5)
                
                # Kill the tmux session
                self.logger.info(f"Killing tmux session {instance.tmux_session_name}")
                subprocess.run([
                    "tmux", "kill-session", "-t", instance.tmux_session_name
                ], check=False)
                
                # Verify the session is gone
                result = subprocess.run(
                    ["tmux", "has-session", "-t", instance.tmux_session_name],
                    capture_output=True, 
                    check=False
                )
                
                if result.returncode != 0:
                    self.logger.info(f"Successfully stopped tmux session {instance.tmux_session_name}")
                    success = True
                else:
                    self.logger.warning(f"Failed to stop tmux session, trying again with force")
                    # Try a more forceful approach
                    subprocess.run([
                        "pkill", "-f", f"tmux.*{instance.tmux_session_name}"
                    ], check=False)
                    time.sleep(1)
                    
                    # Check again
                    result = subprocess.run(
                        ["tmux", "has-session", "-t", instance.tmux_session_name],
                        capture_output=True, 
                        check=False
                    )
                    success = result.returncode != 0
                    if success:
                        self.logger.info(f"Successfully stopped tmux session with force")
                    else:
                        self.logger.error(f"Failed to stop tmux session even with force")
                
                # Also close any terminal windows that might be attached to the session
                close_script = f'''
                tell application "Terminal"
                    set windows_to_check to windows
                    repeat with w in windows_to_check
                        set window_content to (do script "tmux list-sessions 2>/dev/null || echo 'No sessions'" in w)
                        if window_content contains "{instance.tmux_session_name}" then
                            close w
                        end if
                    end repeat
                end tell
                '''
                
                subprocess.run(["osascript", "-e", close_script], capture_output=True, check=False)
                self.logger.info(f"Attempted to close terminal windows attached to the session")
                
            except Exception as e:
                self.logger.error(f"Error stopping tmux session: {e}")
                success = False
        '''
        else:
            # Close the terminal window - use claude_monitor for all terminal operations
            window_title = f"Claude-{instance_id}"
            self.logger.info(f"Stopping all processes and closing the terminal window for instance {instance_id}")
            
            # Use claude_monitor to properly shut down and close the terminal
            # This will send Ctrl+C twice, handle any termination dialogs, and close the window
            try:
                self.logger.info(f"Using claude_monitor.close_terminal to shut down window with title: {window_title}")
                success = claude_monitor.close_terminal(window_title=window_title)
                
                if success:
                    self.logger.info(f"Successfully closed terminal window for instance {instance_id}")
                else:
                    # Try with terminal_id as fallback
                    if instance.terminal_id:
                        self.logger.warning(f"Failed to close terminal by window title, trying by ID")
                        success = claude_monitor.close_terminal(terminal_id=instance.terminal_id)
                        if success:
                            self.logger.info(f"Successfully closed terminal for instance {instance_id} by ID")
                        else:
                            self.logger.warning(f"Failed to close terminal using any method")
                    
                    # Last resort - direct kill
                    if not success:
                        self.logger.warning(f"Falling back to direct process kill")
                        try:
                            kill_cmd = f"pkill -f '{window_title}'"
                            subprocess.run(kill_cmd, shell=True, check=False)
                            self.logger.info(f"Ran direct pkill command")
                        except Exception as e:
                            self.logger.error(f"Error in direct process kill: {e}")
            except Exception as e:
                self.logger.error(f"Error stopping instance {instance_id}: {e}")
                success = False
        '''
        
        # Save instances
        self.save_instances()
        return success

    def delete_instance(self, instance_id):
        """Delete an instance from the manager.
        
        Args:
            instance_id (str): ID of the instance to delete
            
        Returns:
            bool: True if instance was deleted, False otherwise
        """
        # Check if the instance exists
        if instance_id not in self.instances:
            self.logger.error(f"Instance {instance_id} not found for deletion")
            return False
            
        # Get the instance
        instance = self.instances.get(instance_id)
        
        # If instance is running, stop it first
        if instance.status == "running":
            self.logger.info(f"Stopping running instance {instance_id} before deletion")
            self.stop_instance(instance_id)
        
        # Remove the instance from the manager
        try:
            del self.instances[instance_id]
            self.logger.info(f"Successfully deleted instance {instance_id} from manager")
            
            # Save changes
            self.save_instances()
            return True
        except Exception as e:
            self.logger.error(f"Error deleting instance {instance_id}: {e}")
            return False
    
    def get_instance_content(self, instance_id):
        """Get the content from a Claude instance.
        
        Args:
            instance_id (str): ID of the instance
            
        Returns:
            str or None: Content from the instance if successful, None otherwise
        """
        instance = self.instances.get(instance_id)
        if not instance:
            self.logger.error(f"Instance {instance_id} not found")
            return None
        
        # Check runtime type (new API first, then fall back to legacy)
        is_tmux = False
        session_name = None
        
        # First check new fields
        if hasattr(instance, 'runtime_type'):
            try:
                from src.core.models.instance import RuntimeType
                is_tmux = instance.runtime_type == RuntimeType.TMUX
                self.logger.debug(f"Determined runtime type from runtime_type field: {instance.runtime_type}")
            except ImportError:
                # Simple string comparison as fallback
                is_tmux = instance.runtime_type == "tmux"
                self.logger.debug(f"Determined runtime type by string comparison: {instance.runtime_type}")
                
            # If using runtime_id field (new API)
            if hasattr(instance, 'runtime_id') and is_tmux:
                session_name = instance.runtime_id
                self.logger.debug(f"Using runtime_id for session name: {session_name}")
        
        # Fall back to legacy fields if needed
        if not is_tmux and hasattr(instance, 'use_tmux'):
            is_tmux = instance.use_tmux
            self.logger.debug(f"Determined runtime type from legacy use_tmux field: {is_tmux}")
            
        if not session_name and hasattr(instance, 'tmux_session_name') and instance.tmux_session_name:
            session_name = instance.tmux_session_name
            self.logger.debug(f"Using legacy tmux_session_name field: {session_name}")
            
        # For new API, check if content is already cached in the content field
        if hasattr(instance, 'content') and instance.content:
            self.logger.debug(f"Using cached content from instance.content field")
            return instance.content
            
        # If we have a tmux session name, try to get content from tmux
        if is_tmux and session_name:
            try:
                # Get content from tmux session
                result = subprocess.run(
                    ["tmux", "capture-pane", "-pt", session_name],
                    capture_output=True, text=True
                )
                content = result.stdout
                
                # Cache the content in the instance for dashboard display
                instance.tmux_content = content
                
                # Also cache in the new API field if available
                if hasattr(instance, 'content'):
                    instance.content = content
                    self.logger.debug(f"Cached content in instance.content field")
                
                return content
            except Exception as e:
                self.logger.error(f"Error getting content from tmux session: {e}")
                return None
        else:
            # For terminal-based instances, we don't have a direct way to get content
            # Return any cached content if available
            if hasattr(instance, 'tmux_content') and instance.tmux_content:
                self.logger.debug(f"Using cached content from legacy tmux_content field")
                return instance.tmux_content
            return None
            
    def view_terminal(self, instance_id):
        """Open a terminal window to view an instance.
        
        Args:
            instance_id (str): ID of the instance
            
        Returns:
            bool: True if successful, False otherwise
        """
        instance = self.instances.get(instance_id)
        if not instance:
            self.logger.error(f"Instance {instance_id} not found")
            return False
        
        # Check runtime type (new API first, then fall back to legacy)
        is_tmux = False
        session_name = None
        
        # First check new fields
        if hasattr(instance, 'runtime_type'):
            try:
                from src.core.models.instance import RuntimeType
                is_tmux = instance.runtime_type == RuntimeType.TMUX
                self.logger.info(f"Determined runtime type from runtime_type field: {instance.runtime_type}")
            except ImportError:
                # Simple string comparison as fallback
                is_tmux = instance.runtime_type == "tmux"
                self.logger.info(f"Determined runtime type by string comparison: {instance.runtime_type}")
                
            # If using runtime_id field (new API)
            if hasattr(instance, 'runtime_id') and is_tmux:
                session_name = instance.runtime_id
                self.logger.info(f"Using runtime_id for session name: {session_name}")
        
        # Fall back to legacy fields if needed
        if not is_tmux and hasattr(instance, 'use_tmux'):
            is_tmux = instance.use_tmux
            self.logger.info(f"Determined runtime type from legacy use_tmux field: {is_tmux}")
            
        if not session_name and hasattr(instance, 'tmux_session_name') and instance.tmux_session_name:
            session_name = instance.tmux_session_name
            self.logger.info(f"Using legacy tmux_session_name field: {session_name}")
        
        # Now proceed based on runtime type
        if is_tmux and session_name:
            try:
                # Check if session exists
                if not self.is_tmux_session_active(session_name):
                    self.logger.error(f"Tmux session {session_name} not found")
                    return False
                    
                # Open a terminal window with tmux attach
                subprocess.run([
                    "osascript", "-e", 
                    f'tell application "Terminal" to do script "tmux attach -t {session_name}"'
                ], check=True)
                
                self.logger.info(f"Opened terminal window for instance {instance_id}")
                return True
            except Exception as e:
                self.logger.error(f"Error opening terminal window: {e}")
                return False
        elif hasattr(instance, 'terminal_id') and instance.terminal_id:
            # Handle Terminal.app instances
            self.logger.info(f"Attempting to focus Terminal.app window for instance {instance_id}")
            try:
                # Use AppleScript to focus the existing terminal
                script = f'''
                tell application "Terminal"
                    set toFront to id "{instance.terminal_id}"
                    tell window of toFront to set frontmost to true
                    activate
                end tell
                '''
                subprocess.run(["osascript", "-e", script], check=True)
                self.logger.info(f"Successfully focused Terminal window for instance {instance_id}")
                return True
            except Exception as e:
                self.logger.error(f"Error focusing terminal window: {e}")
                return False
        else:
            self.logger.error(f"Instance {instance_id} has no valid runtime information")
            return False
            
    def list_instances(self):
        """List all instances and their status, ensuring consistency with tmux ls."""
        instances_list = []
        current_time = time.time()
        
        # Get actual running tmux sessions 
        active_tmux_sessions = self.get_active_tmux_sessions()
        
        if active_tmux_sessions:
            self.logger.info(f"Found {len(active_tmux_sessions)} active tmux sessions")
            
            # First synchronize our instances with tmux state
            self._verify_loaded_instances()
            
            # Import any unregistered tmux sessions
            self._import_unregistered_tmux_sessions(active_tmux_sessions)
        else:
            self.logger.info("No active tmux sessions found")
        
        # Now build the list of instances with accurate information
        for instance_id, instance in self.instances.items():
            self.logger.debug(f"Processing instance: {instance_id}, use_tmux: {instance.use_tmux if hasattr(instance, 'use_tmux') else False}, status: {instance.status}")
            
            uptime = current_time - instance.start_time
            uptime_str = self._format_duration(uptime)
            
            last_yes_ago = "Never"
            if instance.last_yes_time:
                last_yes_ago = self._format_duration(current_time - instance.last_yes_time)
            
            # Get the canonical session name for this instance
            session_name = "N/A"
            tmux_status = "Not using tmux"
            
            # Determine runtime type (new API)
            runtime_type_display = "unknown"
            if hasattr(instance, 'runtime_type'):
                # Using the new runtime_type field
                runtime_type_display = instance.runtime_type
            elif hasattr(instance, 'use_tmux'):
                # Using the legacy use_tmux field
                runtime_type_display = "tmux" if instance.use_tmux else "terminal"
            
            if hasattr(instance, 'use_tmux') and instance.use_tmux:
                # Get the canonical session name (always with claude_ prefix)
                canonical_name = self.get_canonical_session_name(instance)
                session_name = canonical_name
                
                # Check if the session is active
                session_active = self.is_tmux_session_active(canonical_name, active_tmux_sessions)
                
                # Set the tmux status
                tmux_status = "Active" if session_active else "Inactive"
                
                # Ensure instance status reflects the tmux session status
                # Only update to running if it's not in standby or completed state
                if session_active and instance.status != "running" and instance.status != "standby" and instance.status != "completed":
                    instance.status = "running"
                    self.logger.info(f"Updating instance {instance_id} status to running based on active tmux session")
                elif not session_active and instance.status == "running":
                    instance.status = "stopped" 
                    self.logger.info(f"Updating instance {instance_id} status to stopped due to inactive tmux session")
            
            # For prompt display, always read the actual content if it's a file path
            # and show the first 100 characters regardless of whether it's a file or direct text
            prompt_display = ""
            if os.path.exists(instance.prompt_path) and os.path.isfile(instance.prompt_path):
                # This is a file path, read the actual content
                try:
                    with open(instance.prompt_path, 'r') as f:
                        content = f.read()
                        prompt_display = content[:100] + ("..." if len(content) > 100 else "")
                        self.logger.debug(f"Read prompt file for instance {instance_id}, showing first 100 chars")
                except Exception as e:
                    # If we can't read the file for any reason, fall back to showing the path
                    prompt_display = f"File: {instance.prompt_path}"
                    self.logger.warning(f"Could not read prompt file for instance {instance_id}: {e}")
            elif not os.path.exists(instance.prompt_path):
                # Not a file path, probably direct text - show first 100 chars
                prompt_display = instance.prompt_path[:100] + ("..." if len(instance.prompt_path) > 100 else "")
            else:
                # Fallback, just show the path
                prompt_display = instance.prompt_path
            
            # Get runtime_id (new unified ID field)
            runtime_id = None
            if hasattr(instance, 'runtime_id') and instance.runtime_id:
                runtime_id = instance.runtime_id
            elif hasattr(instance, 'tmux_session_name') and instance.tmux_session_name:
                runtime_id = instance.tmux_session_name
            elif hasattr(instance, 'terminal_id') and instance.terminal_id:
                runtime_id = instance.terminal_id
            
            instances_list.append({
                "id": instance_id,
                "status": instance.status,
                "project_dir": instance.project_dir,
                "prompt_path": prompt_display,
                "uptime": uptime_str,
                "yes_count": instance.yes_count,
                "last_yes": last_yes_ago,
                "tmux_status": tmux_status,
                "tmux_session": session_name,
                "runtime_type": runtime_type_display,
                "runtime_type_display": runtime_type_display,  # For UI consistency
                "runtime_id": runtime_id
            })
        
        # Make sure our changes are saved
        self.save_instances()
        
        return instances_list
    
    def _import_unregistered_tmux_sessions(self, active_sessions=None):
        """Import any tmux sessions that aren't registered in our instances."""
        if active_sessions is None:
            active_sessions = self.get_active_tmux_sessions()
            
        if not active_sessions:
            return 0
        
        # Current working directory 
        cwd = os.getcwd()
        
        # Get all sessions that look like Claude sessions (start with claude_)
        claude_sessions = {name: info for name, info in active_sessions.items() 
                          if name.startswith("claude_")}
        
        # Count of imported sessions
        imported_count = 0
        
        # For each Claude session, check if we have an instance for it
        for session_name, session_info in claude_sessions.items():
            instance_id = session_name[7:]  # Remove 'claude_' prefix
            
            # Skip if this instance ID is already known
            if instance_id in self.instances:
                self.logger.debug(f"Instance {instance_id} already exists, skipping import.")
                continue
                
            # Check if this session belongs to any existing instance by checking tmux_session_name
            session_has_instance = False
            for existing_id, instance in self.instances.items():
                if hasattr(instance, 'tmux_session_name') and instance.tmux_session_name:
                    if instance.tmux_session_name == session_name:
                        session_has_instance = True
                        self.logger.debug(f"Session {session_name} is already registered to instance {existing_id}")
                        break
                        
            if session_has_instance:
                continue
                
            # Verify this is actually a Claude session by checking its content
            try:
                # Capture the content of the tmux pane
                result = subprocess.run(
                    ["tmux", "capture-pane", "-pt", session_name],
                    capture_output=True, 
                    text=True
                )
                content = result.stdout.lower()
                
                # In production, we'd check if this looks like a Claude session
                # But for our test system, we'll import all sessions that start with "claude_"
                has_claude_markers = "claude" in content or "anthropic" in content
                if not has_claude_markers:
                    self.logger.info(f"Session {session_name} doesn't have Claude content but has claude_ prefix, importing anyway")
                    # We continue with import even without Claude content markers
            except Exception as e:
                self.logger.warning(f"Error checking session {session_name} content: {e}")
                # Continue with import anyway if we can't check
            
            # Parse creation time from tmux info
            creation_time = time.time() - 300  # Default to 5 minutes ago
            try:
                # Extract creation time using regex from session_info
                import re
                time_match = re.search(r'created (.*?)(?:\)|\s*$)', session_info)
                if time_match:
                    created_str = time_match.group(1)
                    if "second" in created_str:
                        seconds_match = re.search(r'(\d+) seconds?', created_str)
                        seconds = int(seconds_match.group(1)) if seconds_match else 5
                        creation_time = time.time() - seconds
                    elif "minute" in created_str:
                        minutes_match = re.search(r'(\d+) minutes?', created_str)
                        minutes = int(minutes_match.group(1)) if minutes_match else 1
                        creation_time = time.time() - (minutes * 60)
                    elif "hour" in created_str:
                        hours_match = re.search(r'(\d+) hours?', created_str)
                        hours = int(hours_match.group(1)) if hours_match else 1
                        creation_time = time.time() - (hours * 3600)
            except Exception as e:
                self.logger.warning(f"Error parsing creation time for {session_name}: {e}")
            
            # Create a new instance for this session
            self.logger.info(f"Importing unregistered tmux session {session_name} as a new Claude instance")
            
            # Create the instance object
            instance = ClaudeInstance(
                id=instance_id,
                project_dir=cwd,
                prompt_path="Unknown (imported from existing tmux session)",
                start_time=creation_time,
                status="running",
                tmux_session_name=session_name,
                use_tmux=True,
                open_terminal=False
            )
            
            # Set new API fields if supported
            try:
                from src.core.models.instance import RuntimeType
                # Set runtime_type field if it exists
                if hasattr(instance, 'runtime_type'):
                    instance.runtime_type = RuntimeType.TMUX
                    self.logger.info(f"Set runtime_type=TMUX for imported session {session_name}")
                
                # Set runtime_id field if it exists
                if hasattr(instance, 'runtime_id'):
                    instance.runtime_id = session_name
                    self.logger.info(f"Set runtime_id={session_name} for imported session")
            except ImportError:
                self.logger.debug("RuntimeType not available, skipping new API field setup")
            
            # Add to manager
            self.instances[instance_id] = instance
            imported_count += 1
            self.logger.info(f"Successfully imported session {session_name} as instance {instance_id}")
        
        # Save if we imported any sessions
        if imported_count > 0:
            self.save_instances()
            
        return imported_count

    def _format_duration(self, seconds):
        """Format a duration in seconds to a human-readable string."""
        if seconds < 60:
            return f"{int(seconds)}s"
        elif seconds < 3600:
            return f"{int(seconds/60)}m {int(seconds%60)}s"
        else:
            hours = int(seconds / 3600)
            minutes = int((seconds % 3600) / 60)
            return f"{hours}h {minutes}m"
            
    def _send_prompt_to_existing_tmux(self, instance, prompt_path):
        """Send a prompt to an existing tmux session."""
        self.logger.info(f"Sending prompt to existing tmux session {instance.tmux_session_name}")
        
        # Check if prompt file exists
        if not os.path.exists(prompt_path):
            self.logger.error(f"ERROR: Prompt file not found at: {prompt_path}")
            return False
            
        # Check if tmux session exists
        if not self.is_tmux_session_active(instance.tmux_session_name):
            self.logger.error(f"ERROR: tmux session {instance.tmux_session_name} not found")
            return False
            
        # First, send Ctrl+C to interrupt any ongoing operation
        try:
            subprocess.run([
                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                "C-c"
            ], check=False)
            time.sleep(0.5)
            
            # Read the prompt content
            with open(prompt_path, 'r') as f:
                prompt_content = f.read()
            
            if not prompt_content.strip():
                self.logger.error(f"ERROR: Prompt file is empty: {prompt_path}")
                return False
                
            # Log the prompt size to debug
            self.logger.info(f"Read prompt file. Size: {len(prompt_content)} bytes")
            self.logger.info(f"Prompt preview: {prompt_content[:100]}...")
            
            # Since we're reusing an existing instance, we just need to prepare
            # the session to receive a new prompt - no need to restart Claude
            # Just send Enter to ensure we're at a prompt
            self.logger.info("Reusing existing Claude session, sending prompt directly")
            subprocess.run([
                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                "Enter"
            ], check=True)
            time.sleep(1)
            
            # Send the prompt content in manageable chunks
            chunk_size = 500  # Send in 500 character chunks
            self.logger.info(f"Beginning to send prompt in chunks (total length: {len(prompt_content)})")
            
            for i in range(0, len(prompt_content), chunk_size):
                chunk = prompt_content[i:i+chunk_size]
                self.logger.info(f"Sending chunk {i//chunk_size + 1} of {(len(prompt_content) + chunk_size - 1)//chunk_size} to tmux session {instance.tmux_session_name}")
                
                # Send the chunk as literal text to the tmux session
                # Handle the case where text starts with a dash that might be interpreted as a flag
                if chunk.startswith('-'):
                    # Add -- to indicate end of options
                    subprocess.run([
                        "tmux", "send-keys", "-l", "-t", instance.tmux_session_name, "--",
                        chunk
                    ], check=True)
                else:
                    subprocess.run([
                        "tmux", "send-keys", "-l", "-t", instance.tmux_session_name, 
                        chunk
                    ], check=True)
                
                # Brief pause between chunks
                time.sleep(0.2)
            
            self.logger.info(f"Successfully sent complete prompt to tmux session {instance.tmux_session_name}")
            
            # Wait before submitting prompt
            time.sleep(2)
            
            # Send Enter to submit the prompt
            self.logger.info(f"Sending Enter key to submit prompt in session {instance.tmux_session_name}...")
            subprocess.run([
                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                "Enter"
            ], check=True)
            
            # Send second Enter for good measure
            time.sleep(1)
            subprocess.run([
                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                "Enter"
            ], check=True)
            
            # Update instance status to running
            instance.status = "running"
            self.save_instances()
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error sending prompt to existing tmux session: {e}")
            return False
    
    def _send_prompt_to_existing_terminal(self, instance, prompt_path):
        """Send a prompt to an existing Terminal.app window."""
        self.logger.info(f"Sending prompt to existing terminal session with ID: {instance.terminal_id}")
        
        # Check if prompt file exists
        if not os.path.exists(prompt_path):
            self.logger.error(f"ERROR: Prompt file not found at: {prompt_path}")
            return False
            
        try:
            # First, try to interrupt the current operation
            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke "c" using control down'])
            time.sleep(0.5)
            
            # Start a new Claude instance
            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke "claude"'])
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
            
            # Wait for Claude to initialize
            time.sleep(5)
            
            # Handle the trust prompt
            claude_monitor.monitor_trust_prompt(terminal_id=instance.terminal_id)
            
            # Send the prompt content
            self.logger.info(f"Sending prompt content from: {prompt_path}")
            claude_monitor.send_clipboard_content(prompt_path, terminal_id=instance.terminal_id)
            
            # Update instance status to running
            instance.status = "running"
            self.save_instances()
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error sending prompt to existing terminal: {e}")
            return False


def main():
    """Simple CLI for the Claude Task Manager."""
    manager = ClaudeTaskManager()
    
    while True:
        print("\n==== Claude Task Manager ====")
        print("1. List instances")
        print("2. Start new instance (Terminal)")
        print("3. Start new instance (tmux)")
        print("4. Stop instance")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ")
        
        if choice == "1":
            instances = manager.list_instances()
            if not instances:
                print("No instances found.")
            else:
                print("\nCurrent Claude Instances:")
                print("-" * 80)
                for instance in instances:
                    # Show tmux status information from the instance data
                    tmux_info = f"| tmux: {instance['tmux_session']} ({instance['tmux_status']})"
                    
                    print(f"ID: {instance['id']} | Status: {instance['status']} | Yes Count: {instance['yes_count']} | Last Yes: {instance['last_yes']} {tmux_info}")
                    print(f"  Directory: {instance['project_dir']}")
                    print(f"  Prompt: {instance['prompt_path']}")
                    print(f"  Uptime: {instance['uptime']}")
                    print("-" * 80)
        
        elif choice == "2" or choice == "3":
            use_tmux = (choice == "3")
            method = "tmux" if use_tmux else "Terminal"
            
            print(f"\nStarting new Claude instance using {method}:")
            project_dir = input("Enter project directory: ")
            prompt_path = input("Enter prompt file path: ")
            
            if not os.path.exists(project_dir):
                print(f"Error: Project directory does not exist: {project_dir}")
                continue
            
            instance_id = manager.start_instance(project_dir, prompt_path, use_tmux=use_tmux)
            print(f"Started new instance with ID: {instance_id} using {method}")
        
        elif choice == "4":
            instance_id = input("Enter instance ID to stop: ")
            if manager.stop_instance(instance_id):
                print(f"Instance {instance_id} stopped.")
            else:
                print(f"Failed to stop instance {instance_id}.")
        
        elif choice == "5":
            print("Exiting...")
            break
        
        else:
            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    main()
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
import claude_monitor  # Import the claude_monitor module for fallback
import claude_monitor_direct  # Import the tmux-based implementation


@dataclass
class ClaudeInstance:
    id: str
    project_dir: str
    prompt_path: str
    start_time: float
    status: str = "running"  # running, stopped, completed
    yes_count: int = 0
    last_yes_time: Optional[float] = None
    terminal_id: Optional[str] = None
    tmux_session_name: Optional[str] = None  # Name of tmux session for direct method
    use_tmux: bool = True  # Whether to use tmux-based approach or terminal-based approach
    open_terminal: bool = False  # Whether to automatically open a terminal window


class ClaudeTaskManager:
    def __init__(self, save_file="claude_instances.json"):
        # Set up debug logging first so it's available throughout initialization
        import logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(),
                logging.FileHandler('claude_manager.log')
            ]
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
                    
                    if instance.status != "running":
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
        
        Args:
            session_name: The canonical session name (with claude_ prefix)
            active_sessions: Optional dict of active sessions from get_active_tmux_sessions()
        
        Returns:
            bool: True if session exists, False otherwise
        """
        if active_sessions is None:
            active_sessions = self.get_active_tmux_sessions()
            
        # Direct match check
        if session_name in active_sessions:
            self.logger.info(f"Found direct match for session '{session_name}'")
            return True
            
        # Try without prefix
        if session_name.startswith('claude_'):
            instance_id = session_name[7:]
            if instance_id in active_sessions:
                self.logger.info(f"Found match for ID '{instance_id}' from session '{session_name}'")
                return True
        
        # Try explicit check with tmux has-session command as a last resort
        try:
            result = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True, 
                check=False
            )
            if result.returncode == 0:
                self.logger.info(f"Verified session '{session_name}' exists with direct tmux has-session command")
                return True
        except Exception as e:
            self.logger.error(f"Error checking session '{session_name}' with tmux command: {e}")
            
        return False

    def save_instances(self):
        """Save instances to file."""
        try:
            with open(self.save_file, 'w') as f:
                json.dump([asdict(instance) for instance in self.instances.values()], f, indent=2)
        except Exception as e:
            print(f"Error saving instances: {e}")

    def start_instance(self, project_dir, prompt_path, use_tmux=True, open_terminal=False):
        """Start a new Claude instance.
        
        Args:
            project_dir (str): Path to the project directory
            prompt_path (str): Path to the prompt file
            use_tmux (bool, optional): Whether to use tmux-based approach. Defaults to True.
                If True, uses claude_monitor_direct (tmux)
                If False, uses claude_monitor (Terminal.app)
            open_terminal (bool, optional): Whether to automatically open a terminal window. Defaults to False.
                If False, no terminal window is opened automatically; use the dashboard to view.
                If True, a terminal window will be opened for the user to view the session.
        
        Returns:
            str: ID of the created instance
        """
        # Generate a unique ID for this instance
        instance_id = str(uuid.uuid4())[:8]
        
        # Create the instance object
        instance = ClaudeInstance(
            id=instance_id,
            project_dir=project_dir,
            prompt_path=prompt_path,
            start_time=time.time(),
            status="running",  # Explicitly set status to running
            use_tmux=use_tmux,
            open_terminal=open_terminal
        )
        
        self.logger.info(f"Created new instance {instance_id} with status: {instance.status}")
        
        # Store the instance
        self.instances[instance_id] = instance
        
        if use_tmux:
            # Use tmux-based approach with claude_monitor_direct
            self.logger.info(f"Starting Claude with tmux for instance {instance_id}")
            
            # Generate a unique tmux session name based on the instance ID
            tmux_session_name = f"claude_{instance_id}"
            instance.tmux_session_name = tmux_session_name
            
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
            
            # Start monitoring thread
            self._start_monitor_thread(instance_id)
        
        # Final status check to ensure still running
        if instance.status != "running":
            self.logger.info(f"Correcting instance {instance_id} status from '{instance.status}' to 'running' before returning")
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
                        subprocess.run([
                            "tmux", "send-keys", "-l", "-t", instance.tmux_session_name, 
                            chunk
                        ], check=True)
                        
                        # Brief pause between chunks
                        time.sleep(0.2)
                    
                    self.logger.info(f"Successfully sent complete prompt to tmux session {instance.tmux_session_name}")
                    
                    # Ensure status is set to running after successful prompt delivery
                    instance.status = "running"
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
                
                # Ensure status is set to running
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
            
            # Final status update to ensure it's running
            instance.status = "running"
            self.save_instances()
            self.logger.info(f"Successfully launched Claude in tmux session {instance.tmux_session_name}, status set to running")
            
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
        
        # Ensure status is running at the start of monitoring
        if instance.status != "running":
            self.logger.info(f"Correcting instance {instance_id} status from '{instance.status}' to 'running' at start of monitoring")
            instance.status = "running"
            self.save_instances()
            
        # Log monitoring parameters for debugging
        self.logger.info(f"Monitoring parameters: check_interval={check_interval}s, max_runtime={max_runtime}s")
        self.logger.info(f"Will monitor for up to {max_monitor_minutes} minutes or until status changes from 'running'")
        
        while instance.status == "running":
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
                    
                # Check for prompts and respond to them
                if content:
                    # First check for special arrow-based UI prompts - these need direct handling
                    if "Yes" in content:
                        self.logger.info(f"Instance {instance_id}: Found arrow-based selection menu with '❯ Yes' option")
                        
                        if instance.use_tmux:
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
                            # Use the terminal approach
                            claude_monitor.highlight_terminal(terminal_id=instance.terminal_id)
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                        
                        # Update metrics 
                        instance.yes_count += 1
                        instance.last_yes_time = time.time()
                        self.save_instances()
                        responded = True
                    
                    # Then check for the standard prompts
                    elif "Yes, and don't ask again for" in content:
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
                        
                    # Enhanced detection for all variations of shell command execution prompts
                    elif any(pattern in content.lower() for pattern in [
                        "do you want to ", 
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
                        
                        # Update yes count metrics
                        instance.yes_count += 1
                        instance.last_yes_time = time.time()
                        self.save_instances()
                        
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
                                    
                                    break
                            
                            # Always send Enter after any text
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                            
                            # Wait and send a second Enter to ensure confirmation
                            time.sleep(0.5)  
                            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                        
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
                        
                        responded = True
                        
                    # Update counter if we responded to something
                    if responded:
                        instance.yes_count += 1
                        instance.last_yes_time = time.time()
                        self.save_instances()
                        self.logger.info(f"Successfully responded to prompt. Yes count: {instance.yes_count}")
            except Exception as e:
                self.logger.error(f"Error during monitoring: {e}")
            
            # Report monitoring status
            elapsed = time.time() - start_time
            self.logger.info(f"Instance {instance_id}: Monitoring for phrases ({int(elapsed)} seconds elapsed)")
            
            # Sleep before next check
            time.sleep(check_interval)
            
            # Update instance in case it was modified externally
            instance = self.instances.get(instance_id)
            if not instance or instance.status != "running":
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
            
            if hasattr(instance, 'use_tmux') and instance.use_tmux:
                # Get the canonical session name (always with claude_ prefix)
                canonical_name = self.get_canonical_session_name(instance)
                session_name = canonical_name
                
                # Check if the session is active
                session_active = self.is_tmux_session_active(canonical_name, active_tmux_sessions)
                
                # Set the tmux status
                tmux_status = "Active" if session_active else "Inactive"
                
                # Ensure instance status reflects the tmux session status
                if session_active and instance.status != "running":
                    instance.status = "running"
                    self.logger.info(f"Updating instance {instance_id} status to running based on active tmux session")
                elif not session_active and instance.status == "running":
                    instance.status = "stopped" 
                    self.logger.info(f"Updating instance {instance_id} status to stopped due to inactive tmux session")
            
            instances_list.append({
                "id": instance_id,
                "status": instance.status,
                "project_dir": instance.project_dir,
                "prompt_path": instance.prompt_path,
                "uptime": uptime_str,
                "yes_count": instance.yes_count,
                "last_yes": last_yes_ago,
                "tmux_status": tmux_status,
                "tmux_session": session_name
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
"""
Terminal.app process management for Claude Task Manager.
"""
import os
import subprocess
import logging
import time
import uuid
from typing import Optional, Dict, Any

from src.core.interfaces.process import ProcessManagerInterface
from src.core.models.instance import ClaudeInstance, InstanceStatus, DetailedStatus


class TerminalProcessManager(ProcessManagerInterface):
    """
    Manages Claude instances running in Terminal.app.
    """
    
    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)
        
    def launch_process(self, instance: ClaudeInstance, prompt_path: Optional[str] = None, 
                       prompt_text: Optional[str] = None) -> bool:
        """Launch a new Terminal.app window for the Claude instance."""
        try:
            # Build the command to run
            commands = []
            
            # Change to project directory
            commands.append(f"cd '{instance.project_dir}'")
            
            # Run Claude CLI
            commands.append("claude")
            
            # Combine commands
            command_str = "; ".join(commands)
            
            # Generate a unique identifier for this terminal window
            terminal_id = str(uuid.uuid4())
            
            # Open a new Terminal window with the command
            script = f'''
                tell application "Terminal"
                    do script "{command_str}"
                    set currentTab to selected tab of front window
                    set custom title of currentTab to "Claude: {instance.id}"
                    set frontWindow to front window
                    return id of frontWindow
                end tell
            '''
            
            # Run the AppleScript
            result = subprocess.run(["osascript", "-e", script], 
                                   capture_output=True, text=True, check=True)
            
            # Extract the terminal window ID
            if result.stdout.strip():
                terminal_id = result.stdout.strip()
            
            # Store the terminal ID in the instance
            instance.terminal_id = terminal_id
            instance.runtime_id = terminal_id
            
            # Wait for Claude to initialize and accept trust prompt
            time.sleep(3)
            
            # Send Enter to accept trust prompt
            self.send_keystroke(instance, "Enter")
            
            # Wait for Claude to be ready
            time.sleep(2)
            
            # Send prompt if provided
            if prompt_path and os.path.exists(prompt_path):
                with open(prompt_path, 'r') as f:
                    prompt_content = f.read()
                    
                if prompt_content.strip():
                    self.send_prompt(instance, prompt_content)
            elif prompt_text:
                self.send_prompt(instance, prompt_text)
                
            # Update instance status
            instance.status = InstanceStatus.RUNNING
            instance.detailed_status = DetailedStatus.READY
            
            return True
        except Exception as e:
            self.logger.error(f"Error launching terminal process: {e}")
            return False
            
    def send_prompt(self, instance: ClaudeInstance, prompt_content: str, 
                    submit: bool = True) -> bool:
        """Send a prompt to an existing Terminal.app window."""
        try:
            if not instance.terminal_id:
                self.logger.error("No terminal ID available")
                return False
                
            # Activate the terminal window
            activate_script = f'''
                tell application "Terminal"
                    set frontmost of (first window whose id is {instance.terminal_id}) to true
                end tell
            '''
            
            # Run the AppleScript
            subprocess.run(["osascript", "-e", activate_script], check=True)
            
            # Wait a moment for the window to activate
            time.sleep(0.5)
            
            # Prepare the text by escaping special characters
            escaped_text = prompt_content.replace('"', '\\"').replace('\\', '\\\\')
            
            # Send the text in smaller chunks to avoid issues
            chunk_size = 500
            for i in range(0, len(escaped_text), chunk_size):
                chunk = escaped_text[i:i+chunk_size]
                
                # Send text using AppleScript
                keystroke_script = f'''
                    tell application "System Events"
                        keystroke "{chunk}"
                    end tell
                '''
                
                subprocess.run(["osascript", "-e", keystroke_script], check=True)
                
                # Brief pause between chunks
                time.sleep(0.2)
                
            # Send Enter if submit is True
            if submit:
                time.sleep(0.5)  # Wait before sending Enter
                self.send_keystroke(instance, "Enter")
                
            return True
        except Exception as e:
            self.logger.error(f"Error sending prompt to terminal: {e}")
            return False
            
    def stop_process(self, instance: ClaudeInstance) -> bool:
        """Close the Terminal.app window for the instance."""
        try:
            if not instance.terminal_id:
                self.logger.error("No terminal ID available")
                return False
                
            # Close the terminal window
            close_script = f'''
                tell application "Terminal"
                    try
                        close (first window whose id is {instance.terminal_id})
                    end try
                end tell
            '''
            
            # Run the AppleScript
            subprocess.run(["osascript", "-e", close_script], check=True)
            
            # Update instance status
            instance.status = InstanceStatus.STOPPED
            
            return True
        except Exception as e:
            self.logger.error(f"Error stopping terminal process: {e}")
            return False
            
    def is_process_active(self, instance: ClaudeInstance) -> bool:
        """Check if the Terminal.app window is still open."""
        try:
            if not instance.terminal_id:
                return False
                
            # Check if window exists
            check_script = f'''
                tell application "Terminal"
                    try
                        set w to first window whose id is {instance.terminal_id}
                        return true
                    on error
                        return false
                    end try
                end tell
            '''
            
            # Run the AppleScript
            result = subprocess.run(["osascript", "-e", check_script], 
                                   capture_output=True, text=True, check=True)
            
            return result.stdout.strip().lower() == "true"
        except Exception as e:
            self.logger.error(f"Error checking if terminal process is active: {e}")
            return False
            
    def get_process_content(self, instance: ClaudeInstance) -> Optional[str]:
        """Get the current content from the Terminal.app window."""
        try:
            if not instance.terminal_id or not self.is_process_active(instance):
                return None
                
            # Get the terminal content
            content_script = f'''
                tell application "Terminal"
                    set w to first window whose id is {instance.terminal_id}
                    set t to selected tab of w
                    return contents of t
                end tell
            '''
            
            # Run the AppleScript
            result = subprocess.run(["osascript", "-e", content_script], 
                                   capture_output=True, text=True, check=True)
            
            return result.stdout
        except Exception as e:
            self.logger.error(f"Error getting terminal content: {e}")
            return None
            
    def get_process_status(self, instance: ClaudeInstance) -> Dict[str, Any]:
        """Get detailed status information about the Terminal.app window."""
        status = {
            "active": False,
            "detailed_status": DetailedStatus.READY,
            "generation_time": None,
            "is_generating": False
        }
        
        try:
            # Check if process is active
            is_active = self.is_process_active(instance)
            status["active"] = is_active
            
            if not is_active:
                return status
                
            # Try to get content from terminal
            content = self.get_process_content(instance)
            if not content:
                return status
                
            # Check for generation indicators
            generation_indicators = ['█', '▓', '░', '···']
            is_generating = any(indicator in content for indicator in generation_indicators)
            status["is_generating"] = is_generating
            
            if is_generating:
                status["detailed_status"] = DetailedStatus.RUNNING
                
                # We don't have a reliable way to get generation time from terminal
                # so we'll leave it as None
            else:
                status["detailed_status"] = DetailedStatus.READY
                
            return status
        except Exception as e:
            self.logger.error(f"Error getting terminal status: {e}")
            return status
            
    def send_keystroke(self, instance: ClaudeInstance, key: str) -> bool:
        """Send a keystroke to the Terminal.app window."""
        try:
            if not instance.terminal_id:
                return False
                
            # Check if window exists
            if not self.is_process_active(instance):
                return False
                
            # Activate the terminal window
            activate_script = f'''
                tell application "Terminal"
                    set frontmost of (first window whose id is {instance.terminal_id}) to true
                end tell
            '''
            
            subprocess.run(["osascript", "-e", activate_script], check=True)
            
            # Map common keys to their System Events key codes
            key_mapping = {
                "Enter": "return",
                "Escape": "escape",
                "Space": "space",
                "Backspace": "delete",
                "Tab": "tab",
                "Up": "up arrow",
                "Down": "down arrow",
                "Left": "left arrow",
                "Right": "right arrow"
            }
            
            # Determine the AppleScript command based on the key
            if key in key_mapping:
                # For special keys, use key code
                key_script = f'''
                    tell application "System Events"
                        key code {{{key_mapping[key]}}}
                    end tell
                '''
            else:
                # For regular characters, use keystroke
                key_script = f'''
                    tell application "System Events"
                        keystroke "{key}"
                    end tell
                '''
                
            # Run the AppleScript
            subprocess.run(["osascript", "-e", key_script], check=True)
            
            return True
        except Exception as e:
            self.logger.error(f"Error sending keystroke to terminal: {e}")
            return False
            
    def open_terminal(self, instance: ClaudeInstance) -> bool:
        """Activate the Terminal.app window for the instance."""
        try:
            if not instance.terminal_id:
                return False
                
            # Check if window exists
            if not self.is_process_active(instance):
                return False
                
            # Activate the terminal window
            activate_script = f'''
                tell application "Terminal"
                    activate
                    set frontmost of (first window whose id is {instance.terminal_id}) to true
                end tell
            '''
            
            # Run the AppleScript
            subprocess.run(["osascript", "-e", activate_script], check=True)
            
            return True
        except Exception as e:
            self.logger.error(f"Error opening terminal: {e}")
            return False

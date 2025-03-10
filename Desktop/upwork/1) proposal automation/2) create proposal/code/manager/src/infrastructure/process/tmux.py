"""
Tmux process management for Claude Task Manager.
"""
import os
import subprocess
import tempfile
import time
import logging
import re
from typing import Optional, Dict, Any, List

from src.core.interfaces.process import ProcessManagerInterface
from src.core.models.instance import ClaudeInstance, InstanceStatus, DetailedStatus


class TmuxProcessManager(ProcessManagerInterface):
    """
    Manages Claude instances running in tmux sessions.
    """
    
    def __init__(self, logger=None):
        self.logger = logger or logging.getLogger(__name__)
        
    def launch_process(self, instance: ClaudeInstance, prompt_path: Optional[str] = None, 
                       prompt_text: Optional[str] = None) -> bool:
        """Launch a new tmux session for the Claude instance."""
        try:
            # Generate a tmux session name based on the instance ID
            session_name = f"claude_{instance.id}"
            instance.tmux_session_name = session_name
            instance.runtime_id = session_name
            
            # Create a new detached tmux session
            subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
            
            # Change to the project directory
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                f"cd '{instance.project_dir}'", "Enter"
            ], check=True)
            
            # Run the Claude CLI
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                "claude", "Enter"
            ], check=True)
            
            # Wait for Claude to initialize
            time.sleep(5)
            
            # Auto-accept the trust prompt
            subprocess.run([
                "tmux", "send-keys", "-t", session_name, 
                "Enter"
            ], check=True)
            
            # Wait for Claude to be ready
            time.sleep(2)
            
            # Send prompt if provided
            if prompt_path and os.path.exists(prompt_path):
                with open(prompt_path, 'r') as f:
                    prompt_content = f.read()
                    
                if prompt_content.strip():
                    # Send prompt in chunks to avoid issues with long lines
                    self._send_text_to_tmux(session_name, prompt_content)
                    
                    # Send enter key to submit
                    subprocess.run([
                        "tmux", "send-keys", "-t", session_name, 
                        "Enter"
                    ], check=True)
            elif prompt_text:
                # Send direct prompt text
                self._send_text_to_tmux(session_name, prompt_text)
                
                # Send enter key to submit
                subprocess.run([
                    "tmux", "send-keys", "-t", session_name, 
                    "Enter"
                ], check=True)
                
            # Update instance status
            instance.status = InstanceStatus.RUNNING
            instance.detailed_status = DetailedStatus.READY
            
            return True
        except Exception as e:
            self.logger.error(f"Error launching tmux process: {e}")
            return False
            
    def send_prompt(self, instance: ClaudeInstance, prompt_content: str, 
                    submit: bool = True) -> bool:
        """Send a prompt to an existing tmux session."""
        try:
            if not instance.tmux_session_name:
                self.logger.error("No tmux session name available")
                return False
                
            # Check if session exists
            if not self.is_process_active(instance):
                self.logger.error(f"tmux session {instance.tmux_session_name} not found")
                return False
                
            # Send prompt content
            self._send_text_to_tmux(instance.tmux_session_name, prompt_content)
            
            # Send enter key if submit is True
            if submit:
                subprocess.run([
                    "tmux", "send-keys", "-t", instance.tmux_session_name, 
                    "Enter"
                ], check=True)
                
            return True
        except Exception as e:
            self.logger.error(f"Error sending prompt to tmux: {e}")
            return False
            
    def stop_process(self, instance: ClaudeInstance) -> bool:
        """Stop the tmux session for the instance."""
        try:
            if not instance.tmux_session_name:
                self.logger.error("No tmux session name available")
                return False
                
            # Check if session exists
            if not self.is_process_active(instance):
                # Already stopped
                instance.status = InstanceStatus.STOPPED
                return True
                
            # Kill the tmux session
            subprocess.run(["tmux", "kill-session", "-t", instance.tmux_session_name], check=True)
            
            # Update instance status
            instance.status = InstanceStatus.STOPPED
            
            return True
        except Exception as e:
            self.logger.error(f"Error stopping tmux process: {e}")
            return False
            
    def is_process_active(self, instance: ClaudeInstance) -> bool:
        """Check if the tmux session is still active."""
        try:
            if not instance.tmux_session_name:
                return False
                
            # Run tmux has-session to check if the session exists
            result = subprocess.run(
                ["tmux", "has-session", "-t", instance.tmux_session_name],
                check=False, capture_output=True
            )
            
            return result.returncode == 0
        except Exception as e:
            self.logger.error(f"Error checking if process is active: {e}")
            return False
            
    def get_process_content(self, instance: ClaudeInstance) -> Optional[str]:
        """Get the current content from the tmux session."""
        try:
            if not instance.tmux_session_name:
                return None
                
            # Check if session exists
            if not self.is_process_active(instance):
                return None
                
            # Capture the pane content
            result = subprocess.run(
                ["tmux", "capture-pane", "-p", "-t", instance.tmux_session_name],
                check=True, capture_output=True, text=True
            )
            
            return result.stdout
        except Exception as e:
            self.logger.error(f"Error getting process content: {e}")
            return None
            
    def get_process_status(self, instance: ClaudeInstance) -> Dict[str, Any]:
        """Get detailed status information about the tmux session."""
        status = {
            "active": False,
            "detailed_status": DetailedStatus.READY,
            "generation_time": None,
            "is_generating": False
        }
        
        try:
            content = self.get_process_content(instance)
            if not content:
                return status
                
            # Update active status
            status["active"] = True
            
            # Check for generation indicators
            generation_indicators = ['█', '▓', '░', '···']
            is_generating = any(indicator in content for indicator in generation_indicators)
            status["is_generating"] = is_generating
            
            if is_generating:
                status["detailed_status"] = DetailedStatus.RUNNING
                
                # Try to extract generation time
                seconds_pattern = re.search(r'(\d+)s', content)
                if seconds_pattern:
                    status["generation_time"] = f"{seconds_pattern.group(1)}s"
            else:
                status["detailed_status"] = DetailedStatus.READY
                
            return status
        except Exception as e:
            self.logger.error(f"Error getting process status: {e}")
            return status
            
    def send_keystroke(self, instance: ClaudeInstance, key: str) -> bool:
        """Send a keystroke to the tmux session."""
        try:
            if not instance.tmux_session_name:
                return False
                
            # Check if session exists
            if not self.is_process_active(instance):
                return False
                
            # Map common key names
            key_mapping = {
                "Escape": "Escape",
                "Enter": "Enter",
                "Space": "Space",
                "Backspace": "BSpace",
                "Tab": "Tab",
                "Up": "Up",
                "Down": "Down",
                "Left": "Left",
                "Right": "Right"
            }
            
            # Send the key
            key_to_send = key_mapping.get(key, key)
            subprocess.run(
                ["tmux", "send-keys", "-t", instance.tmux_session_name, key_to_send],
                check=True
            )
            
            return True
        except Exception as e:
            self.logger.error(f"Error sending keystroke: {e}")
            return False
            
    def open_terminal(self, instance: ClaudeInstance) -> bool:
        """Open a terminal window for the tmux session."""
        try:
            if not instance.tmux_session_name:
                return False
                
            # Check if session exists
            session_exists = self.is_process_active(instance)
            
            if session_exists:
                # Open terminal with tmux attach
                subprocess.run([
                    "osascript", "-e", 
                    f'tell application "Terminal" to do script "tmux attach -t {instance.tmux_session_name}"'
                ], check=True)
                
                return True
            else:
                self.logger.error(f"Cannot open terminal: tmux session {instance.tmux_session_name} not found")
                return False
        except Exception as e:
            self.logger.error(f"Error opening terminal: {e}")
            return False
            
    def _send_text_to_tmux(self, session_name: str, text: str) -> bool:
        """
        Send text to a tmux session in smaller chunks.
        
        Args:
            session_name: tmux session name
            text: Text to send
            
        Returns:
            Success status
        """
        try:
            # Split text into manageable chunks to avoid issues
            chunk_size = 500
            
            for i in range(0, len(text), chunk_size):
                chunk = text[i:i+chunk_size]
                
                try:
                    # First try with loadb which handles special characters better
                    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as tmp:
                        tmp.write(chunk)
                        tmp_path = tmp.name
                    
                    # Use paste-buffer approach
                    subprocess.run(["tmux", "load-buffer", tmp_path], check=True)
                    subprocess.run(["tmux", "paste-buffer", "-t", session_name], check=True)
                    
                    # Clean up temp file
                    os.unlink(tmp_path)
                except Exception:
                    # Fallback to direct send-keys if load-buffer fails
                    subprocess.run(
                        ["tmux", "send-keys", "-t", session_name, chunk],
                        check=True
                    )
                
                # Brief pause between chunks
                time.sleep(0.1)
                
            return True
        except Exception as e:
            self.logger.error(f"Error sending text to tmux: {e}")
            return False

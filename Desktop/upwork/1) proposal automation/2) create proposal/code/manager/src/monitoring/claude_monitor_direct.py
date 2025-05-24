import subprocess
import time
import os
import uuid
import re

def wait_for_keywords(session_name, keywords, timeout=30):
    """
    Wait for any of the specified keywords to appear in the tmux session.
    
    Args:
        session_name (str): The name of the tmux session
        keywords (list): List of keyword strings to watch for
        timeout (int): Maximum time to wait in seconds
        
    Returns:
        tuple: (bool, str) - Success status and the matched keyword
    """
    if isinstance(keywords, str):
        keywords = [keywords]
        
    start = time.time()
    while time.time() - start < timeout:
        try:
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", session_name],
                capture_output=True, text=True, check=False
            )
            
            if result.returncode != 0:
                print(f"Error capturing pane content: {result.stderr}")
                time.sleep(1)
                continue
                
            content = result.stdout
            
            # Check for each keyword
            for keyword in keywords:
                if keyword in content:
                    return True, keyword
                    
            # Wait a bit before trying again
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Error in wait_for_keywords: {e}")
            time.sleep(1)
            
    return False, None

def auto_respond_to_prompts(session_name, timeout=60, check_interval=1):
    """
    Monitor the tmux session and automatically respond to various prompts.
    
    Args:
        session_name (str): The name of the tmux session
        timeout (int): Maximum time to monitor in seconds
        check_interval (float): How often to check for prompts in seconds
        
    Returns:
        int: Number of prompts responded to
    """
    # List of patterns to look for and respond with Enter
    prompt_patterns = [
        # Trust prompts
        "Do you trust the files in this folder?",
        "Trust this folder?",
        
        # Permission prompts
        "Do you want to allow",
        "Would you like to allow",
        "Permission requested",
        "Allow access to",
        
        # Confirmation prompts
        "Do you want to",
        "Would you like to",
        "Continue?",
        "Proceed?",
        "Shall I proceed",
        "Press Enter to continue",
        "Press any key to continue",
        
        # Generic prompts needing confirmation
        "Yes,",
        "Confirm?",
        "Created file",
        "Ready to proceed?"
    ]
    
    # Special patterns that need a different response (not just Enter)
    special_patterns = {
        "Type 'yes' to continue": "yes\n",  # Type 'yes' and press Enter
        "Yes, and don't ask again for": "\033[B\n",  # Send down arrow and Enter
        "Choose an option": "\033[B\n",  # Send down arrow and Enter
    }
    
    start_time = time.time()
    prompts_responded = 0
    
    print(f"Monitoring for prompts in session '{session_name}' for up to {timeout} seconds...")
    
    while time.time() - start_time < timeout:
        try:
            # Capture current content
            result = subprocess.run(
                ["tmux", "capture-pane", "-pt", session_name],
                capture_output=True, text=True, check=False
            )
            
            if result.returncode != 0:
                # Skip this iteration if we couldn't get content
                time.sleep(check_interval)
                continue
                
            content = result.stdout
            
            # First check special patterns
            for pattern, response in special_patterns.items():
                if pattern in content:
                    print(f"Found special pattern: '{pattern}', sending custom response")
                    subprocess.run(["tmux", "send-keys", "-t", session_name, response])
                    prompts_responded += 1
                    # Wait a moment for the response to be processed
                    time.sleep(1)
                    break
            else:
                # If no special pattern matched, check regular patterns
                for pattern in prompt_patterns:
                    if pattern in content:
                        print(f"Found pattern: '{pattern}', sending Enter")
                        subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"])
                        prompts_responded += 1
                        # Wait a moment for the response to be processed
                        time.sleep(1)
                        break
        
        except Exception as e:
            print(f"Error while monitoring prompts: {e}")
        
        # Wait before checking again
        time.sleep(check_interval)
    
    print(f"Prompt monitoring complete. Responded to {prompts_responded} prompts in {int(time.time() - start_time)} seconds.")
    return prompts_responded

def run_claude_command(prompt_text=None, project_dir=None, monitoring_time=60):
    """
    Run the Claude CLI command in a tmux session with automatic response handling.
    
    Args:
        prompt_text (str, optional): Text to send to Claude
        project_dir (str, optional): Project directory to use
        monitoring_time (int, optional): How long to monitor for prompts in seconds
        
    Returns:
        tuple: (session_name, success)
    """
    # Create a unique session ID
    rand_id = uuid.uuid4().hex[:6]
    session_name = f"claude_{rand_id}"
    
    # Determine directory to use
    if not project_dir:
        # Create a temporary folder on the Desktop
        folder_name = f"claude_project_{rand_id}"
        desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
        project_dir = os.path.join(desktop_path, folder_name)
        os.makedirs(project_dir, exist_ok=True)
        print(f"Created temporary project directory: {project_dir}")
    
    try:
        # Create a new tmux session in detached mode
        print(f"Creating tmux session: {session_name}")
        subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
        time.sleep(0.5)
        
        # Change to the project directory
        print(f"Changing to directory: {project_dir}")
        subprocess.run(["tmux", "send-keys", "-t", session_name, f"cd '{project_dir}'", "Enter"], check=True)
        time.sleep(0.5)
        
        # Start Claude
        print("Starting Claude...")
        subprocess.run(["tmux", "send-keys", "-t", session_name, "claude", "Enter"], check=True)
        time.sleep(3)
        
        # Wait for and handle the trust prompt
        trust_patterns = [
            "Do you trust the files in this folder?",
            "Trust this folder?",
        ]
        trust_found, matched_pattern = wait_for_keywords(session_name, trust_patterns, timeout=10)
        
        if trust_found:
            print(f"Found trust prompt: '{matched_pattern}', sending Enter")
            subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"], check=True)
            time.sleep(2)  # Give it time to process
        
        # Send the prompt if provided
        if prompt_text:
            print(f"Sending prompt: {prompt_text[:30]}...")
            
            # Use a chunking approach for large prompts
            chunk_size = 500  # Send in smaller chunks
            for i in range(0, len(prompt_text), chunk_size):
                chunk = prompt_text[i:i+chunk_size]
                subprocess.run(["tmux", "send-keys", "-t", session_name, chunk], check=True)
                time.sleep(0.2)  # Short pause between chunks
            
            # Send Enter key to submit the prompt
            time.sleep(0.5)
            subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"], check=True)
            
            # Sometimes Claude needs a second Enter key
            time.sleep(0.5)
            subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"], check=True)
        else:
            # Default test prompt
            print("Sending default test prompt...")
            subprocess.run(["tmux", "send-keys", "-t", session_name, "Hello! Please respond with 'Working with tmux'", "Enter"], check=True)
            time.sleep(0.5)
        
        # Start automatic prompt monitoring in the background
        print(f"Starting automatic prompt response monitoring for {monitoring_time} seconds...")
        prompts_handled = auto_respond_to_prompts(session_name, timeout=monitoring_time)
        
        # Session is now ready for interaction or display
        print(f"Claude is now running in tmux session '{session_name}'")
        print(f"Automatically responded to {prompts_handled} prompts")
        
        return session_name, True
        
    except Exception as e:
        print(f"Error setting up Claude session: {e}")
        # Try to clean up if something went wrong
        try:
            subprocess.run(["tmux", "kill-session", "-t", session_name], check=False)
        except:
            pass
        return session_name, False

def attach_to_session(session_name):
    """Open a terminal window and attach to the tmux session."""
    try:
        subprocess.run([
            "osascript", "-e", 
            f'tell application "Terminal" to do script "tmux attach -t {session_name}"'
        ], check=True)
        return True
    except Exception as e:
        print(f"Error attaching to session: {e}")
        return False

def cleanup_session(session_name):
    """Kill the tmux session to free resources."""
    try:
        subprocess.run(["tmux", "kill-session", "-t", session_name], check=True)
        print(f"Cleaned up tmux session: {session_name}")
        return True
    except Exception as e:
        print(f"Error cleaning up session: {e}")
        return False

if __name__ == "__main__":
    # Example usage
    session_name, success = run_claude_command(
        prompt_text="Hello Claude! Create a simple markdown file named example.md with a heading and a paragraph.",
        monitoring_time=120  # Monitor for 2 minutes
    )
    
    if success:
        # Optionally attach to the session for inspection
        attach_to_session(session_name)
        
        # Wait for user interaction if needed
        # input("Press Enter to cleanup the session when done...")
        
        # Cleanup can be called separately or left for the task manager
        # cleanup_session(session_name)

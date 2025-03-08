#!/usr/bin/env python3
import os
import subprocess
import time


def highlight_terminal(terminal_id=None):
    """Activate Terminal application and bring the specified terminal to front.
    
    Args:
        terminal_id (str, optional): Terminal ID to activate. If None, activates Terminal app only.
    """
    if terminal_id:
        activate_cmd = f'''
        tell application "Terminal"
            activate
            set frontmost of (first window whose id is {terminal_id}) to true
        end tell
        '''
        subprocess.run(["osascript", "-e", activate_cmd])
    else:
        subprocess.run(["osascript", "-e", 'tell application "Terminal" to activate'])

def get_terminal_content(terminal_id=None):
    """Get content from terminal window.
    
    Args:
        terminal_id (str, optional): Terminal ID to get content from. If None, gets from active window.
        
    Returns:
        str: Terminal content
    """
    if terminal_id:
        script = f'''
        tell application "Terminal"
            get contents of tab of (first window whose id is {terminal_id})
        end tell
        '''
    else:
        script = '''
        tell application "Terminal"
            get contents of window 1
        end tell
        '''
    
    result = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
    return result.stdout

def monitor_trust_prompt(timeout=60, terminal_id=None):
    """Monitor terminal for trust prompt and automatically handle it.
    
    Args:
        timeout (int, optional): Maximum time to wait in seconds. Defaults to 60.
        terminal_id (str, optional): Terminal ID to monitor. If None, uses active window.
        
    Returns:
        bool: True if trust prompt was found and handled, False otherwise.
    """
    print("Monitoring terminal for 'Do you trust the files in this folder?' prompt...")
    elapsed = 0
    while elapsed < timeout:
        content = get_terminal_content(terminal_id)
        if content and "Do you trust the files in this folder?" in content:
            print("Found trust prompt, sending return key")
            highlight_terminal(terminal_id)
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
            return True
        time.sleep(1)
        elapsed += 1
    print("Trust prompt not found within timeout.")
    return False

def send_clipboard_content(prompt_path, terminal_id=None):
    """Send prompt content to terminal via clipboard.
    
    Args:
        prompt_path (str): Path to the prompt file
        terminal_id (str, optional): Terminal ID to send to. If None, uses active window.
    """
    print(f"Sending prompt content from: {prompt_path} to terminal {terminal_id}")
    
    try:
        with open(prompt_path, 'r') as f:
            content = f.read()
        
        # Log the content length and a preview for debugging
        print(f"Read prompt content - length: {len(content)} characters")
        if len(content) > 0:
            preview = content[:30] + "..." if len(content) > 30 else content
            print(f"Content preview: {preview}")
        else:
            print("WARNING: Prompt file is empty!")
            
        # Copy to clipboard using pbcopy
        process = subprocess.Popen('pbcopy', env={'LANG': 'en_US.UTF-8'}, stdin=subprocess.PIPE)
        process.communicate(content.encode('utf-8'))
        print(f"Copied content to clipboard")
        
        # Activate terminal
        highlight_terminal(terminal_id)
        print(f"Activated terminal window {terminal_id}")
        
        # Paste content
        print("Attempting to paste with Command+V")
        subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke "v" using command down'])
        time.sleep(2)  # Give it time to paste
        
        # Press Enter
        print("Pressing Enter after paste")
        highlight_terminal(terminal_id)
        subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
        
        print("Successfully sent prompt content via clipboard")
        return True
    except Exception as e:
        print(f"Error sending clipboard content: {e}")
        return False

def monitor_yes_prompts(timeout=600, max_minutes=3, terminal_id=None):
    """Monitor for various prompts from Claude that need confirmation.
    
    Args:
        timeout (int, optional): Maximum time to wait in seconds. Defaults to 600.
        max_minutes (int, optional): Maximum monitoring time in minutes. Defaults to 3.
        terminal_id (str, optional): Terminal ID to monitor. If None, uses active window.
        
    Returns:
        bool: True if any prompts were handled, False otherwise.
    """
    elapsed = 0
    responded = False
    while elapsed < timeout:
        content = get_terminal_content(terminal_id)
        if not content:
            time.sleep(5)
            elapsed += 5
            print(f"Monitoring terminal for phrases ({elapsed} seconds elapsed)")
            continue
            
        # Check for all the different prompts we want to automatically respond to
        
        # Check for "Yes, and don't ask again for"
        if "Yes, and don't ask again for" in content:
            print("Found 'Yes, and don't ask again for' prompt, sending down key and return")
            highlight_terminal(terminal_id)
            subprocess.run(["osascript", "-e", 'tell application "System Events" to key code 125'])
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
            responded = True
            
        # Check for "Yes," from Claude prompts
        elif "Yes," in content:
            print("Found 'Yes,' prompt, sending return key")
            highlight_terminal(terminal_id)
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
            responded = True
            
        # Check for "Do you want to..." prompts
        elif "Do you want to " in content:
            print("Found 'Do you want to' prompt, sending return key")
            highlight_terminal(terminal_id)
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
            responded = True
            
        # Terminal process termination prompts
        elif "terminate running processes in this window" in content.lower():
            print("Found 'terminate running processes' prompt, sending return key")
            highlight_terminal(terminal_id)
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
            responded = True
            
        # Terminal will terminate prompt
        elif "closing this window will terminate" in content.lower():
            print("Found 'closing this window will terminate' prompt, sending return key")
            highlight_terminal(terminal_id)
            subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
            responded = True
        
        time.sleep(5)
        elapsed += 5
        print(f"Monitoring terminal for phrases ({elapsed} seconds elapsed)")
        if elapsed >= max_minutes * 60:
            print("Reached maximum monitoring time")
            break
    return responded

def execute_claude_cli(project_dir, prompt_path, max_minutes=3, timeout=600):
    """
    Execute Claude using integrated claude wrapper logic and monitor for prompts.
    
    Args:
        project_dir (str): Path to the project directory
        prompt_path (str): Path to the prompt file
        max_minutes (int, optional): Maximum monitoring time in minutes. Defaults to 3.
        timeout (int, optional): Timeout in seconds. Defaults to 600.
    
    Returns:
        bool: True if successful, False otherwise
    """
    print(f"🚀 Executing Claude CLI with prompt: {prompt_path}")
    
    if not os.path.exists(prompt_path):
        print(f"ERROR: Prompt file not found at: {prompt_path}")
        return False

    # Launch Terminal in the project directory and run claude
    launch_cmd = f"cd '{project_dir}' && claude"
    launch_script = f'''tell application "Terminal"
    do script "{launch_cmd}"
    activate
end tell'''
    subprocess.run(["osascript", "-e", launch_script])
    time.sleep(5)

    monitor_trust_prompt(timeout=60)
    send_clipboard_content(prompt_path)
    monitor_yes_prompts(timeout=timeout, max_minutes=max_minutes)
    return True

def close_terminal(terminal_id=None, window_title=None):
    """
    Close a specific terminal window or tab.
    
    Args:
        terminal_id (str, optional): Terminal ID to close. If None, will use window_title or active window.
        window_title (str, optional): Title of window to close. Only used if terminal_id is None.
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # List all terminal windows for debugging
        list_windows = '''
        tell application "Terminal"
            set win_info to {}
            repeat with w in windows
                set win_name to name of w
                set win_id to id of w
                set end of win_info to win_name & " (ID: " & win_id & ")"
            end repeat
            return win_info
        end tell
        '''
        result = subprocess.run(["osascript", "-e", list_windows], capture_output=True, text=True)
        print(f"Available terminal windows before closing: {result.stdout}")
        
        # Send Ctrl+C twice to terminate any running programs
        if window_title:
            try:
                send_ctrl_c_cmd = f'''
                tell application "Terminal"
                    repeat with w in windows
                        if name of w contains "{window_title}" then
                            activate
                            set frontmost of w to true
                            tell application "System Events"
                                -- Send Ctrl+C twice with a slight delay between
                                keystroke "c" using control down
                                delay 0.5
                                keystroke "c" using control down
                                delay 0.5
                            end tell
                        end if
                    end repeat
                end tell
                '''
                subprocess.run(["osascript", "-e", send_ctrl_c_cmd], capture_output=True, text=True)
                print(f"Sent Ctrl+C twice to terminate running programs")
                time.sleep(1)  # Give processes time to terminate
            except Exception as e:
                print(f"Error sending Ctrl+C: {e}")
        
        # First check if the window has any process termination prompts and respond to them
        if window_title:
            # Check for process termination prompts and respond
            try:
                auto_answer_cmd = f'''
                tell application "Terminal"
                    set answered_dialog to false
                    repeat with w in windows
                        if name of w contains "{window_title}" then
                            -- Send return key to confirm any termination dialog
                            tell application "System Events"
                                keystroke return
                            end tell
                            set answered_dialog to true
                        end if
                    end repeat
                    return answered_dialog
                end tell
                '''
                subprocess.run(["osascript", "-e", auto_answer_cmd], capture_output=True, text=True)
                print(f"Attempted to handle any terminal closing prompts")
                time.sleep(0.5)  # Give it a moment
            except Exception as e:
                print(f"Error handling closing prompts: {e}")
        
        # Direct AppleScript method for closing by window title - most reliable method
        if window_title:
            direct_close_cmd = f'''
            tell application "Terminal"
                set closed_window to false
                repeat with w in windows
                    if name of w contains "{window_title}" then
                        -- Try to handle any dialog that appears when closing
                        tell application "System Events"
                            keystroke return
                        end tell
                        
                        -- Then actually close the window
                        close w
                        
                        -- Check again and send another return if needed
                        delay 0.5
                        tell application "System Events"
                            keystroke return
                        end tell
                        
                        set closed_window to true
                        exit repeat
                    end if
                end repeat
                return closed_window
            end tell
            '''
            result = subprocess.run(["osascript", "-e", direct_close_cmd], capture_output=True, text=True)
            if result.stdout.strip() == "true":
                print(f"Successfully closed window containing '{window_title}' using direct AppleScript")
                
                # Double check for dialog boxes that may have appeared
                dialog_check = '''
                tell application "System Events"
                    set dialog_exists to false
                    if exists (process "Terminal" whose frontmost is true) then
                        if exists (window of process "Terminal" whose name contains "Alert") then
                            keystroke return
                            set dialog_exists to true
                        end if
                    end if
                    return dialog_exists
                end tell
                '''
                subprocess.run(["osascript", "-e", dialog_check], capture_output=True, text=True)
                
                return True
            else:
                print(f"Failed to close window by title using direct AppleScript, trying pkill")
                # Try pkill as backup
                try:
                    subprocess.run(["pkill", "-f", window_title], check=False)
                    print(f"Ran pkill command for processes with title '{window_title}'")
                    time.sleep(1)  # Give time for process to exit
                    
                    # Check if window is gone
                    check_cmd = f'''
                    tell application "Terminal"
                        set window_exists to false
                        repeat with w in windows
                            if name of w contains "{window_title}" then
                                set window_exists to true
                                exit repeat
                            end if
                        end repeat
                        return window_exists
                    end tell
                    '''
                    check_result = subprocess.run(["osascript", "-e", check_cmd], capture_output=True, text=True)
                    if check_result.stdout.strip() == "false":
                        print(f"Window with title '{window_title}' is now gone after pkill")
                        return True
                except Exception as pkill_error:
                    print(f"Error during pkill: {pkill_error}")
        
        # If terminal_id is provided, try more specific methods
        if terminal_id:
            tab_cmd = f'''
            tell application "Terminal"
                try
                    repeat with w in windows
                        repeat with t in tabs of w
                            try
                                if id of t is "{terminal_id}" then
                                    -- Try to handle any dialog
                                    tell application "System Events"
                                        keystroke return
                                    end tell
                                    
                                    close t
                                    
                                    -- Check again for dialog
                                    delay 0.5
                                    tell application "System Events"
                                        keystroke return
                                    end tell
                                    
                                    return true
                                end if
                            end try
                        end repeat
                    end repeat
                    return false
                on error errMsg
                    return false
                end try
            end tell
            '''
            result = subprocess.run(["osascript", "-e", tab_cmd], capture_output=True, text=True)
            if result.stdout.strip() == "true":
                print(f"Successfully closed tab with ID {terminal_id}")
                return True
        
        # As a last resort, try one more direct approach
        if window_title:
            force_close_cmd = f'''
            tell application "Terminal"
                try
                    -- Try to force quit any processes
                    do shell script "pkill -f '{window_title}'"
                    delay 1
                    
                    -- Try to handle any dialogs
                    tell application "System Events"
                        keystroke return
                    end tell
                    
                    -- Look for the window again and try to close it
                    set window_gone to true
                    repeat with w in windows
                        if name of w contains "{window_title}" then
                            try
                                close w
                            end try
                            
                            -- Handle any dialogs again
                            tell application "System Events"
                                keystroke return
                            end tell
                            
                            set window_gone to false
                        end if
                    end repeat
                    
                    return window_gone
                on error
                    return false
                end try
            end tell
            '''
            result = subprocess.run(["osascript", "-e", force_close_cmd], capture_output=True, text=True)
            if result.stdout.strip() == "true":
                print(f"Successfully closed window using force approach")
                return True
        
        # List terminals after closing attempt for debugging
        result = subprocess.run(["osascript", "-e", list_windows], capture_output=True, text=True)
        print(f"Terminal windows after closing attempts: {result.stdout}")
        
        # If we get here, we failed to close anything
        print(f"Failed to close the terminal window or tab")
        return False
            
    except Exception as e:
        print(f"Error closing terminal: {e}")
        return False


# Remove the test line - comment out to avoid accidental execution
# execute_claude_cli('/Users/Mike/Desktop/untitled folder','/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code/manager/prompt.txt')

if __name__ == "__main__":
    """
    This allows running the module directly for testing purposes.
    
    Examples:
    - Test monitoring: python claude_monitor.py monitor
    - Test clipboard: python claude_monitor.py clipboard /path/to/prompt.txt
    - Test execution: python claude_monitor.py execute /path/to/project /path/to/prompt.txt
    """
    import sys
    
    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "monitor":
            print("Testing terminal monitoring...")
            monitor_trust_prompt(timeout=60)
            monitor_yes_prompts(timeout=60, max_minutes=1)
        elif cmd == "clipboard" and len(sys.argv) > 2:
            print(f"Testing clipboard with file: {sys.argv[2]}")
            send_clipboard_content(sys.argv[2])
        elif cmd == "execute" and len(sys.argv) > 3:
            print(f"Testing execution with project: {sys.argv[2]} and prompt: {sys.argv[3]}")
            execute_claude_cli(sys.argv[2], sys.argv[3], max_minutes=1)
        elif cmd == "close":
            print("Testing terminal closing...")
            close_terminal(window_title="Terminal")  # This will close the first terminal window with "Terminal" in the title
        else:
            print("Unknown command or missing arguments")
            print("Usage:")
            print("  python claude_monitor.py monitor")
            print("  python claude_monitor.py clipboard /path/to/prompt.txt")
            print("  python claude_monitor.py execute /path/to/project /path/to/prompt.txt")
            print("  python claude_monitor.py close")



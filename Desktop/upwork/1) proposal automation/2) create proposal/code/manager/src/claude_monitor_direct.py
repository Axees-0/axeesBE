import subprocess
import time

def wait_for_keyword(session_name, keyword, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        result = subprocess.run(
            ["tmux", "capture-pane", "-pt", session_name],
            capture_output=True, text=True
        )
        if keyword in result.stdout:
            return True
        time.sleep(0.5)
    return False

def run_claude_command():
    import os, uuid, time
    # Create a random folder on the Desktop.
    rand_id = uuid.uuid4().hex[:6]
    folder_name = "folder_" + rand_id
    desktop_path = os.path.join(os.path.expanduser("~"), "Desktop")
    folder_path = os.path.join(desktop_path, folder_name)
    os.makedirs(folder_path, exist_ok=True)
    
    session_name = rand_id
    # Create a new tmux session in detached mode.
    subprocess.run(["tmux", "new-session", "-d", "-s", session_name])
    time.sleep(0.5)
    # Change directory to the new folder.
    subprocess.run(["tmux", "send-keys", "-t", session_name, f"cd {folder_path}", "Enter"])
    time.sleep(0.5)
    # Start claude.
    subprocess.run(["tmux", "send-keys", "-t", session_name, "claude", "Enter"])
    time.sleep(3)
    # Trust folder.
    subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"])
    time.sleep(0.5)
    # Prompt claude to create a file named 'abc'.
    subprocess.run(["tmux", "send-keys", "-t", session_name, "create a file named 'abc'", "Enter"])
    time.sleep(0.5)
    subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"])
    # Wait for the keyword "Do you want to " to appear.
    if wait_for_keyword(session_name, "Do you want to "):
        subprocess.run(["tmux", "send-keys", "-t", session_name, "Enter"])
        time.sleep(1)
        # Close the Terminal window.
        #subprocess.run(["osascript", "-e", 'tell application "Terminal" to close front window'])
        time.sleep(1)
        # Kill the tmux session to free resources.
        subprocess.run(["tmux", "kill-session", "-t", session_name])
    #subprocess.run(["osascript", "-e", f'tell application "Terminal" to do script "tmux attach -t {session_name}"'])



if __name__ == "__main__":
    run_claude_command()

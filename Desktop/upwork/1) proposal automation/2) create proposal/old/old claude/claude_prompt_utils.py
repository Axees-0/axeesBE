#!/usr/bin/env python3
import os
import subprocess
import time


def execute_claude_cli(project_dir, prompt_path, max_minutes=3, timeout=600):
    """
    Execute Claude using integrated claude wrapper logic and monitor directory growth for output.
    
    Args:
        project_dir (str): Path to the project directory
        prompt_path (str): Path to the prompt file
        timeout (int, optional): Timeout in seconds. Defaults to 600.
    
    Returns:
        bool: True if successful, False otherwise
    """
    def highlight_terminal():
        subprocess.run(["osascript", "-e", 'tell application "Terminal" to activate'])
    
    print(f"🚀 Executing Claude CLI with prompt: {prompt_path}")
    
    if not os.path.exists(prompt_path):
        print(f"ERROR: Prompt file not found at: {prompt_path}")
        return False

    # Launch Terminal in the project directory and run claude
    launch_cmd = f"cd '{project_dir}' && claude"
    osascript_launch = f'''tell application "Terminal"
    do script "{launch_cmd}"
    activate
end tell'''
    subprocess.run(["osascript", "-e", osascript_launch])
    time.sleep(5)

    # Simulate pressing Return to confirm "Yes, proceed"
    highlight_terminal()
    subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
    time.sleep(2)

    # Read prompt file content, copy to clipboard, and simulate paste and Return
    with open(prompt_path, 'r') as f:
        query_content = f.read()
    query_cmd = query_content.replace("\n", " ").strip().replace('"', '\\"')
    process = subprocess.Popen('pbcopy', env={'LANG': 'en_US.UTF-8'}, stdin=subprocess.PIPE)
    process.communicate(query_cmd.encode('utf-8'))

    highlight_terminal()
    subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke "v" using command down'])
    time.sleep(2)
    highlight_terminal()
    subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])

    # Loop key commands every 30 seconds until directory size is stable for the specified time
    def get_directory_size(directory):
        total_size = 0
        for dirpath, _, filenames in os.walk(directory):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if os.path.exists(fp):
                    total_size += os.path.getsize(fp)
        return total_size

    elapsed = 0
    stable_seconds = 0
    prev_size = get_directory_size(project_dir)
    while elapsed < timeout:
        #highlight_terminal()
        #subprocess.run(["osascript", "-e", 'tell application "System Events" to key code 125'])  # down key
        highlight_terminal()
        subprocess.run(["osascript", "-e", 'tell application "System Events" to key code 36'])   # return key
        time.sleep(30)
        elapsed += 30
        current_size = get_directory_size(project_dir)
        if current_size > prev_size:
            print(f"Directory size increased: {prev_size} -> {current_size}")
            stable_seconds = 0
        else:
            stable_seconds += 30
            print(f"Directory size stable for {stable_seconds} seconds.")
        prev_size = current_size
        if stable_seconds >= max_minutes * 60:
            break
    
    return True

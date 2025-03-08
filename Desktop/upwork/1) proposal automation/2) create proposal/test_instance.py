#!/usr/bin/env python3
import os
import sys
import time
import uuid
import subprocess

# Ensure the manager module is in the PYTHONPATH
current_dir = os.path.dirname(os.path.abspath(__file__))
manager_path = os.path.join(current_dir, "code", "manager")
if manager_path not in sys.path:
    sys.path.insert(0, manager_path)

# Create a wrapper for create_claude_instance since we have import issues
def create_claude_instance(prompt, project_dir, use_tmux=True, save_prompt=False, open_terminal=False):
    """
    Wrapper for the create_claude_instance function in test_instance.py in the manager directory.
    This avoids Python package import issues.
    """
    cmd = [
        "python3", 
        os.path.join(manager_path, "test_instance.py"),
        "--prompt", prompt,
        "--project_dir", project_dir
    ]
    
    if use_tmux:
        cmd.append("--use_tmux")
    
    if not use_tmux:
        cmd.append("--no_tmux")
        
    if save_prompt:
        cmd.append("--save_prompt")
        
    if open_terminal:
        cmd.append("--open_terminal")
        
    # Add force-new to ensure we always get a new instance
    cmd.append("--force-new")
    
    # Run the command and capture output
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    # Parse the instance ID from the output
    for line in result.stdout.split('\n'):
        if "Successfully created instance with ID:" in line:
            instance_id = line.split(":")[-1].strip()
            return instance_id
    
    # If we couldn't find the ID, return the full output for debugging
    print(f"Command output: {result.stdout}")
    print(f"Command error: {result.stderr}")
    raise Exception("Failed to create Claude instance")

def main():
    # 1) Create a unique job ID for the folder
    job_id = '021897455790136661047'
    
    # Create directories
    base_folder = "/Users/Mike/Desktop/upwork/2) proposals"
    project_dir = os.path.join(base_folder, job_id)
    os.makedirs(project_dir, exist_ok=True)
    
    # 2) Set up job description
    job_description = """
Job Description: We are seeking a skilled and motivated developer to create a custom Discord bot that integrates with social media platforms, specifically Instagram and TikTok, to pull insights and data for our community. The bot should be able to fetch relevant information (e.g., post stats, trends, or user-generated content) from these platforms and present it in an organized, user-friendly way within Discord channels. 

Key Responsibilities: 
1. Design and develop a Discord bot using a suitable programming language (e.g., JavaScript/Node.js, Python, etc.). 
2. Integrate APIs or scraping tools to extract insights from Instagram and TikTok (likes, views, shares, reach etc) 
3. Ensure the bot can process commands from Discord users to fetch and display social media data on demand. 
4. Implement error handling and rate-limiting to comply with platform API usage policies. 
5. Create a simple, intuitive command structure for users to interact with the bot (e.g., !instagram [username] or !tiktok [hashtag]). 
6. Test and deploy the bot to ensure stability and functionality in a live Discord server. 
7. Provide documentation for setup, usage, and maintenance. 

Required Skills: 
1. Proven experience building Discord bots (please share examples or portfolio). 
2. Proficiency in a programming language suitable for bot development (e.g., JavaScript, Python). 
3. Experience with social media APIs (Instagram Graph API, TikTok API) or web scraping techniques. 
4. Familiarity with Discord.js, Pycord, or similar libraries. 
5. Understanding of RESTful APIs, authentication (e.g., OAuth), and data parsing. 
6. Ability to write clean, maintainable code and troubleshoot issues effectively. 

Preferred Skills: 
1. Knowledge of social media analytics or data visualization. 
2. Experience hosting bots on cloud platforms (e.g., AWS, Heroku, or VPS). 
3. Familiarity with rate limits and ethical scraping practices to avoid bans or violations. 

Deliverables: 
1. Fully functional Discord bot with Instagram and TikTok integration. 
2. Source code with comments and setup instructions. 
3. Brief user guide for bot commands and features. 
4. Deployment assistance (e.g., hosting setup or recommendations).
    """
    
    # Path to the project structure prompt template
    prompt_template_path = '/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code/prompts/PROMPT_01_UI_DESIGN.txt'
    
    # 3) Create the combined prompt file in the new folder
    prompt_path = os.path.join(project_dir, "prompt.txt")
    
    # Read the template prompt
    with open(prompt_template_path, 'r') as template_file:
        template_content = template_file.read()
    
    # Combine template with job description
    combined_prompt = f"""{template_content}

{job_description}
"""
    
    # Save the combined prompt to the new folder
    with open(prompt_path, 'w') as f:
        f.write(combined_prompt)
    
    # 4) Pass new folder and prompt to create_claude_instance
    new_instance_id = create_claude_instance(
        prompt=prompt_path, 
        project_dir=project_dir,
        use_tmux=True,
        save_prompt=True,  # Save the prompt permanently
        open_terminal=True,  # Open terminal to see progress
    )
    
    print(f"""
Created new proposal project:
- Job ID: {job_id}
- Project Directory: {project_dir}
- Prompt File: {prompt_path}
- Claude Instance ID: {new_instance_id}
""")

if __name__ == "__main__":
    main()

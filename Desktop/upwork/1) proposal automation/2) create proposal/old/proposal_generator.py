#!/usr/bin/env python3
import os
import sys
import argparse
import re
import shutil
from pathlib import Path
from claude_prompt_utils import create_claude_cli_prompt, execute_claude_cli

def parse_arguments():
    parser = argparse.ArgumentParser(description='Generate a project proposal using Claude')
    parser.add_argument('--requirements', '-r', type=str, required=True, 
                        help='Path to requirements file or requirements string')
    parser.add_argument('--id', '-i', type=str, required=True,
                        help='Project ID to use for folder name')
    parser.add_argument('--name', '-n', type=str, required=False,
                        help='Project name prefix (optional, will be extracted from requirements if not provided)')
    
    return parser.parse_args()

def read_requirements(requirements_path_or_string):
    """Read requirements from a file or use the string directly"""
    if os.path.isfile(requirements_path_or_string):
        with open(requirements_path_or_string, 'r') as f:
            return f.read()
    return requirements_path_or_string

def sanitize_folder_name(name):
    """Sanitize folder name to be valid"""
    # Replace spaces and special characters
    sanitized = re.sub(r'[^\w\s-]', '_', name)
    # Replace multiple spaces with single underscore
    sanitized = re.sub(r'\s+', '_', sanitized)
    # Lowercase for consistency
    return sanitized.lower()

def extract_project_name(requirements):
    """Extract a project name from requirements text"""
    # Look for title in the first few lines
    lines = requirements.strip().split('\n')
    for line in lines[:5]:
        line = line.strip()
        if line.startswith('# '):
            return line[2:].strip()
        if line.startswith('## '):
            return line[3:].strip()
    
    # If no title found, look for keywords
    keywords = ["Create", "Build", "Develop", "implement"]
    for line in lines[:10]:
        for keyword in keywords:
            if keyword in line:
                # Extract words after the keyword, up to 5 words
                parts = line.split(keyword, 1)[1].strip().split()
                return '_'.join(parts[:min(5, len(parts))])
    
    # Default name
    return "project"

def create_project_directory(project_name, project_id):
    """Create a project directory with project name and ID"""
    # Define the base output directory
    output_dir = '/Users/Mike/Desktop/upwork/2) proposals'
    
    # Create sanitized project name
    safe_name = sanitize_folder_name(project_name)
    
    # Create project directory with ID
    project_dir = os.path.join(output_dir, f"{project_id}")
    os.makedirs(project_dir, exist_ok=True)
    
    print(f"📁 Created project directory: {project_dir}")
    return project_dir

def save_requirements_file(project_dir, requirements, project_name, project_id):
    """Save requirements to a file in the project directory"""
    # Save as README.md
    readme_path = os.path.join(project_dir, "README.md")
    with open(readme_path, 'w') as f:
        f.write(f"# {project_name}\n\n## Project ID: {project_id}\n\n## Requirements\n\n{requirements}")
    
    # Also save as requirements.txt for reference
    req_path = os.path.join(project_dir, "requirements.txt")
    with open(req_path, 'w') as f:
        f.write(requirements)
    
    return readme_path

def main():
    args = parse_arguments()
    
    # Read the requirements
    requirements = read_requirements(args.requirements)
    
    # Extract project name or use provided name
    project_name = args.name or extract_project_name(requirements)
    
    print(f"🚀 Starting proposal generation for: {project_name}")
    print(f"📝 Using project ID: {args.id}")
    
    # Step 1: Create the project directory from ID
    project_dir = create_project_directory(project_name, args.id)
    
    # Save requirements to files
    readme_path = save_requirements_file(project_dir, requirements, project_name, args.id)
    
    # Step 2: Create prompt file for Claude CLI and execute it
    code_dir = "/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code"
    prompt_template_path = os.path.join(code_dir, "prompt_template.txt")
    
    # Use the abstracted function to create the prompt and run Claude
    prompt_path = create_claude_cli_prompt(project_dir, requirements, prompt_template_path)
    
    if not prompt_path:
        print("❌ Failed to create prompt or run Claude. Using alternative method.")
        execute_claude_cli(project_dir, os.path.join(project_dir, "prompt.txt"))

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
import os
import argparse
import zipfile
from claude_prompt_utils import execute_claude_cli

def main():
    parser = argparse.ArgumentParser(description="Run prompt on project by ID")
    parser.add_argument('--prompt_path', '-p', type=str, nargs='+', required=True,
                        help="Path(s) to prompt file(s)")
    parser.add_argument('--id', '-i', type=str, required=True,
                        help="Project ID")
    args = parser.parse_args()

    parent_dir = '/Users/Mike/Desktop/upwork/2) proposals'
    project_dir = None

    # Look for a folder in parent_dir that contains args.id
    for folder in os.listdir(parent_dir):
        folder_path = os.path.join(parent_dir, folder)
        if os.path.isdir(folder_path) and args.id in folder:
            project_dir = folder_path
            break

    # If no matching folder found, default to the exact folder name
    if not project_dir:
        project_dir = os.path.join(parent_dir, args.id)

    # If folder doesn't exist, look for a corresponding zip and unzip it.
    if not os.path.isdir(project_dir):
        zip_path = os.path.join(parent_dir, f"{args.id}.zip")
        if os.path.isfile(zip_path):
            with zipfile.ZipFile(zip_path, 'r') as zf:
                zf.extractall(project_dir)
            print(f"Unzipped {zip_path} to {project_dir}")
        else:
            print(f"Error: No folder or zip file found for ID '{args.id}' in {parent_dir}")
            return

    # Process each prompt file sequentially
    for prompt_path in args.prompt_path:
        if not os.path.isfile(prompt_path):
            print(f"Error: Prompt file not found at {prompt_path}")
            continue

        with open(prompt_path, 'r') as f:
            prompt_content = f.read()
        
        # Execute Claude with the prompt file and wait for completion before moving to the next
        success = execute_claude_cli(project_dir, prompt_path)


if __name__ == "__main__":
    main()
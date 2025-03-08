#!/usr/bin/env python3

import sys
import os
import mimetypes

IGNORE_DIRS = {'venv', 'node_modules', 'bower_components', 'vendor', 'third_party', 'dist', 'build', '__pycache__', '.git', 'prep_codebase.app', '.next'}
ALLOWED_EXTENSIONS = {'.py', '.sh', '.bat', '.ps1', '.js', '.pl', '.rb', '.php', '.html', '.css', '.md', '.txt', '.ts', '.tsx'}

def list_files(root=None):
    if root is None:
        root = os.getcwd()
    file_list = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS]
        for filename in filenames:
            file_list.append(os.path.join(dirpath, filename))
    return file_list

def get_all_files(directory):
    file_paths = []
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            if file == 'consolidated_files.txt':
                continue
            ext = os.path.splitext(file)[1].lower()
            if file == '.env' or ext in ALLOWED_EXTENSIONS:
                relative_path = os.path.relpath(os.path.join(root, file), directory)
                file_paths.append(relative_path)
    return file_paths

def is_text_file(file_path):
    if file_path.endswith('.env'):
        return True
    ext = os.path.splitext(file_path)[1].lower()
    if ext in ALLOWED_EXTENSIONS:
         return True
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type is not None and mime_type.startswith('text')


def read_file_contents(directory, file_paths):
    contents = []
    for path in file_paths:
        full_path = os.path.join(directory, path)
        if is_text_file(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    data = f.read()
                contents.append((path, data))
            except UnicodeDecodeError:
                print(f"Warning: Unicode decode error in '{path}'. Trying 'latin-1' encoding.")
                try:
                    with open(full_path, 'r', encoding='latin-1') as f:
                        data = f.read()
                    contents.append((path, data))
                except Exception as e:
                    print(f"Warning: Could not read '{path}'. Skipped. Error: {e}")
            except Exception as e:
                print(f"Warning: Could not read '{path}'. Skipped. Error: {e}")
        else:
            print(f"Skipping non-text file: {path}")
    return contents

def save_to_txt(file_listing, file_contents, output_file):
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            # Write the list of files first
            f.write("===== List of Files =====\n")
            for file in file_listing:
                f.write(file + "\n")
            f.write("\n\n")
            # Write each file's content
            for path, content in file_contents:
                f.write(f'===== File: {path} =====\n')
                f.write(content)
                f.write('\n\n')
        print(f"Consolidated file has been saved to '{output_file}'.")
    except Exception as e:
        print(f"Error writing to '{output_file}': {e}")

def main():
    current_directory = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    print(f"Directory: {current_directory}")

    file_listing = list_files(current_directory)
    allowed_files = get_all_files(current_directory)
    file_contents = read_file_contents(current_directory, allowed_files)

    output_file = os.path.join(current_directory, 'consolidated_files.txt')
    save_to_txt(file_listing, file_contents, output_file)

if __name__ == '__main__':
    main()
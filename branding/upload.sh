#!/bin/bash

# ===================================================================
# Website Auto-Uploader Script
# ===================================================================
#
# This script automates the process of uploading website files to a remote server.
# It can handle single files, directories, or recursive uploads of nested directories.
#
# Features:
# - Detects Git repositories and uploads changed files in latest commit
# - Supports force upload of all files
# - Supports recursive upload of all files including subdirectories
# - Creates necessary directories on the server before uploading
# - Handles individual file uploads
#
# Usage:
# ./upload.sh <directory_name>                    - Upload files from latest commit
# ./upload.sh <directory_name> force              - Force upload all files
# ./upload.sh <directory_name> recursive          - Recursively upload all files and subdirectories
# ./upload.sh <directory_name> force recursive    - Force upload all files recursively
# ./upload.sh <directory>/<file>                  - Upload a specific file
# ./upload.sh all                                 - Upload all directories
#
# ===================================================================

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Install sshpass if not already installed
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    brew install sshpass
fi

# Default values
SERVER="q9v05prf260g@148.72.61.56"
PASSWORD="abdoM1chael@bdo"

# Function to recursively upload all files in a directory and its subdirectories
recursive_upload() {
    local dir=$1
    local force_all=$2
    local config_file="$dir/upload_config.txt"
    
    # Check if directory exists
    if [ ! -d "$dir" ]; then
        echo -e "${RED}Error: Directory $dir does not exist${NC}"
        return 1
    fi
    
    # Check if config file exists
    if [ ! -f "$config_file" ]; then
        echo -e "${RED}Error: Configuration file $config_file not found${NC}"
        echo -e "${YELLOW}Please create a file named upload_config.txt in $dir with REMOTE_DIR=/public_html/yourdomain.com${NC}"
        return 1
    fi
    
    # Read configuration
    source "$config_file"
    
    # Validate configuration
    if [ -z "$REMOTE_DIR" ]; then
        echo -e "${RED}Error: REMOTE_DIR not defined in $config_file${NC}"
        echo -e "${YELLOW}Please add REMOTE_DIR=/public_html/yourdomain.com to your config file${NC}"
        return 1
    fi
    
    # Check if we should force upload regardless of git status
    if [ "$force_all" = "force" ]; then
        echo -e "${BLUE}=== Forced Recursive Upload for $(basename "$dir") ===${NC}"
    else
        echo -e "${BLUE}=== Recursive Upload for $(basename "$dir") ===${NC}"
    fi
    
    # Change to repo directory
    cd "$dir" || {
        echo -e "${RED}Error: Could not change to directory $dir${NC}"
        return 1
    }
    
    echo -e "${YELLOW}Recursively uploading all files from $(basename "$dir")...${NC}"
    
    # Find all files in directory and subdirectories excluding certain patterns
    # Adding verbosity to see what files are being found
    echo -e "${BLUE}Finding all files in $(pwd)...${NC}"
    
    # Find all files in directory and subdirectories excluding certain patterns
    file_list=$(find . -type f -not -path "*/\.*" -not -name "upload_config.txt" -not -name "upload.sh" | sort)
    file_count=$(echo "$file_list" | wc -l)
    echo -e "${BLUE}Found $file_count files to upload${NC}"
    
    # Debug output to see what files are found
    echo -e "${BLUE}Files to upload:${NC}"
    echo "$file_list" | head -20
    if [ "$file_count" -gt 20 ]; then
        echo -e "${BLUE}...and $(($file_count - 20)) more files${NC}"
    fi
    
    # Loop through each file
    echo "$file_list" | while read -r filepath; do
        # Remove the leading "./" from the file path
        file="${filepath:2}"
        
        echo -e "${GREEN}Uploading $file...${NC}"
        
        # Create directory structure on server before uploading
        dir_path=$(dirname "$file")
        if [ "$dir_path" != "." ]; then
            echo -e "${BLUE}Creating directory: $REMOTE_DIR/$dir_path${NC}"
            sshpass -p "$PASSWORD" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" "mkdir -p $REMOTE_DIR/$dir_path"
            
            # Check the exit status of the mkdir command
            if [ $? -ne 0 ]; then
                echo -e "${RED}Failed to create directory: $REMOTE_DIR/$dir_path${NC}"
                echo -e "${YELLOW}Attempting to continue...${NC}"
            fi
        fi
        
        # Upload the file
        echo -e "${BLUE}Uploading to: $REMOTE_DIR/$file${NC}"
        sshpass -p "$PASSWORD" scp -P 22 -o StrictHostKeyChecking=no "$file" "$SERVER:$REMOTE_DIR/$file"
    done
    
    echo -e "${BLUE}Verifying upload...${NC}"
    sshpass -p "$PASSWORD" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" "ls -la $REMOTE_DIR"
    
    # List the directories on the server to verify subdirectories were created
    echo -e "${BLUE}Checking subdirectories...${NC}"
    sshpass -p "$PASSWORD" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" "find $REMOTE_DIR -type d | sort"
    
    echo -e "${GREEN}Recursive upload complete for $(basename "$dir")!${NC}"
    echo -e "${BLUE}Website updated successfully at $(date)${NC}"
    echo ""
    
    # Return to the original directory
    cd - > /dev/null
}

# Function to upload a directory
upload_directory() {
    local dir=$1
    local force_all=$2
    local config_file="$dir/upload_config.txt"
    
    # Check if directory exists
    if [ ! -d "$dir" ]; then
        echo -e "${RED}Error: Directory $dir does not exist${NC}"
        return 1
    fi
    
    # Check if config file exists
    if [ ! -f "$config_file" ]; then
        echo -e "${RED}Error: Configuration file $config_file not found${NC}"
        echo -e "${YELLOW}Please create a file named upload_config.txt in $dir with REMOTE_DIR=/public_html/yourdomain.com${NC}"
        return 1
    fi
    
    # Read configuration
    source "$config_file"
    
    # Validate configuration
    if [ -z "$REMOTE_DIR" ]; then
        echo -e "${RED}Error: REMOTE_DIR not defined in $config_file${NC}"
        echo -e "${YELLOW}Please add REMOTE_DIR=/public_html/yourdomain.com to your config file${NC}"
        return 1
    fi
    
    echo -e "${BLUE}=== $(basename "$dir") Website Auto-Updater ===${NC}"
    
    # Change to repo directory
    cd "$dir" || {
        echo -e "${RED}Error: Could not change to repository directory $dir${NC}"
        return 1
    }
    
    # Check if we should force upload all files
    if [ "$force_all" = "force" ]; then
        echo -e "${YELLOW}Force upload all files requested. Uploading all files from $(basename "$dir")...${NC}"
        UPLOAD_ALL=true
    # Check if it's a git repo
    elif [ -d ".git" ]; then
        # Check if uncommitted changes exist and warn user
        if [[ -n $(git status -s) ]]; then
            echo -e "${YELLOW}WARNING: Uncommitted changes detected in $(basename "$dir"). These won't be uploaded.${NC}"
            echo -e "${YELLOW}Commit your changes first if you want to include them.${NC}"
            git status -s
            
            echo -e "${YELLOW}Continuing with files from latest commit only...${NC}"
            echo ""
        fi
        
        # Get list of files that changed in the most recent commit
        echo -e "${BLUE}Getting list of files from the most recent commit...${NC}"
        CHANGED_FILES=$(git show --name-only --pretty=format: HEAD)
        
        # Show latest commit info
        COMMIT_MSG=$(git log -1 --pretty=%B)
        COMMIT_HASH=$(git log -1 --pretty=%h)
        COMMIT_DATE=$(git log -1 --pretty=%cd --date=format:'%Y-%m-%d %H:%M:%S')
        echo -e "${GREEN}Latest commit:${NC} $COMMIT_HASH - $COMMIT_DATE"
        echo -e "${GREEN}Message:${NC} $COMMIT_MSG"
        echo ""
        
        if [[ -z "$CHANGED_FILES" ]]; then
            echo -e "${YELLOW}No files changed in the most recent commit.${NC}"
            UPLOAD_ALL=true
        else
            echo -e "${GREEN}Files changed in most recent commit:${NC}"
            echo "$CHANGED_FILES"
            echo -e "${YELLOW}Uploading changed files...${NC}"
            UPLOAD_ALL=false
        fi
    else
        # Not a git repo, upload all files
        echo -e "${YELLOW}Note: $(basename "$dir") is not a git repository. Uploading all files.${NC}"
        UPLOAD_ALL=true
    fi
    
    if [ "$UPLOAD_ALL" = true ]; then
        echo -e "${YELLOW}Uploading all website files from $(basename "$dir")...${NC}"
        
        # Find all files in directory excluding certain patterns
        find . -type f -not -path "*/\.*" -not -name "upload_config.txt" -not -name "upload.sh" | while read -r file; do
            # Remove the leading "./" from the file path
            file="${file:2}"
            
            echo -e "${GREEN}Uploading $file...${NC}"
            # Create directory structure on server before uploading
            dir_path=$(dirname "$file")
            if [ "$dir_path" != "." ]; then
                # Make sure directory exists on remote server before uploading
                echo -e "${BLUE}Creating directory: $REMOTE_DIR/$dir_path${NC}"
                sshpass -p "$PASSWORD" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" "mkdir -p $REMOTE_DIR/$dir_path"
                
                # Check the exit status of the mkdir command
                if [ $? -ne 0 ]; then
                    echo -e "${RED}Failed to create directory: $REMOTE_DIR/$dir_path${NC}"
                    echo -e "${YELLOW}Attempting to continue...${NC}"
                fi
            fi
            
            # Upload the file (no quotes in the remote path for scp)
            echo -e "${BLUE}Uploading to: $REMOTE_DIR/$file${NC}"
            sshpass -p "$PASSWORD" scp -P 22 -o StrictHostKeyChecking=no "$file" "$SERVER:$REMOTE_DIR/$file"
        done
    else
        # Upload each changed file
        while IFS= read -r file; do
            if [[ -f "$file" ]]; then
                # Skip files we don't want to upload
                if [[ "$file" == "upload.sh" || "$file" == "upload_config.txt" ]]; then
                    echo -e "${YELLOW}Skipping $file (not a website file)${NC}"
                    continue
                fi
                
                echo -e "${GREEN}Uploading $file...${NC}"
                # Create directory structure on server before uploading
                dir_path=$(dirname "$file")
                if [ "$dir_path" != "." ]; then
                    # Make sure directory exists on remote server before uploading
                    echo -e "${BLUE}Creating directory: $REMOTE_DIR/$dir_path${NC}"
                    sshpass -p "$PASSWORD" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" "mkdir -p $REMOTE_DIR/$dir_path"
                    
                    # Check the exit status of the mkdir command
                    if [ $? -ne 0 ]; then
                        echo -e "${RED}Failed to create directory: $REMOTE_DIR/$dir_path${NC}"
                        echo -e "${YELLOW}Attempting to continue...${NC}"
                    fi
                fi
                
                # Upload the file (no quotes in the remote path for scp)
                echo -e "${BLUE}Uploading to: $REMOTE_DIR/$file${NC}"
                sshpass -p "$PASSWORD" scp -P 22 -o StrictHostKeyChecking=no "$file" "$SERVER:$REMOTE_DIR/$file"
            fi
        done <<< "$CHANGED_FILES"
    fi
    
    echo -e "${BLUE}Verifying upload...${NC}"
    sshpass -p "$PASSWORD" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" "ls -la $REMOTE_DIR"
    
    echo -e "${GREEN}Upload complete for $(basename "$dir")!${NC}"
    echo -e "${BLUE}Website updated successfully at $(date)${NC}"
    echo ""
    
    # Return to the original directory
    cd - > /dev/null
}

# Main script logic
if [ $# -eq 0 ]; then
    # No arguments, list available directories
    echo -e "${BLUE}Available directories to upload:${NC}"
    for dir in */; do
        if [ -d "$dir" ]; then
            echo "  - ${dir%/}"
        fi
    done
    echo ""
    echo -e "${YELLOW}Usage: ./upload.sh <directory_name> [directory_name2 ...]${NC}"
    echo -e "${YELLOW}   or: ./upload.sh all (to upload all directories)${NC}"
    echo -e "${YELLOW}   or: ./upload.sh <directory_name> force (to force upload all files in a directory)${NC}"
    echo -e "${YELLOW}   or: ./upload.sh <directory_name> recursive (to recursively upload all files in directory and subdirectories)${NC}"
    echo -e "${YELLOW}   or: ./upload.sh <directory_name> force recursive (to force upload all files recursively)${NC}"
    exit 0
fi

# Process arguments
if [ "$1" = "all" ]; then
    # Upload all directories
    for dir in */; do
        if [ -d "$dir" ]; then
            if [ "$2" = "force" ] && [ "$3" = "recursive" ]; then
                # Force and recursive upload
                recursive_upload "${dir%/}" "force"
            elif [ "$2" = "recursive" ] && [ "$3" = "force" ]; then
                # Recursive and force upload (different order)
                recursive_upload "${dir%/}" "force"
            elif [ "$2" = "force" ]; then
                # Force upload
                upload_directory "${dir%/}" "force"
            elif [ "$2" = "recursive" ]; then
                # Recursive upload
                recursive_upload "${dir%/}"
            else
                # Normal upload
                upload_directory "${dir%/}"
            fi
        fi
    done
elif [ $# -eq 3 ] && [[ "$2" = "force" && "$3" = "recursive" || "$2" = "recursive" && "$3" = "force" ]]; then
    # Force and recursive upload for a specific directory
    recursive_upload "$1" "force"
elif [ $# -eq 2 ] && [ "$2" = "force" ]; then
    # Force upload all files in specified directory
    upload_directory "$1" "force"
elif [ $# -eq 2 ] && [ "$2" = "recursive" ]; then
    # Recursive upload - use the specialized function
    recursive_upload "$1"
else
    # Upload specified directories or specific files
    for arg in "$@"; do
        # Check if the argument is a directory
        if [ -d "$arg" ]; then
            upload_directory "$arg"
        # Check if the argument is a file in a directory (format: dir/file.ext)
        elif [[ "$arg" == */* ]] && [ -f "$arg" ]; then
            dir=$(echo "$arg" | cut -d'/' -f1)
            file=$(echo "$arg" | cut -d'/' -f2-)
            
            # Change to directory and upload the file
            cd "$dir" || {
                echo -e "${RED}Error: Could not change to directory $dir${NC}"
                continue
            }
            
            # Read config file
            config_file="upload_config.txt"
            if [ ! -f "$config_file" ]; then
                echo -e "${RED}Error: Configuration file $config_file not found in $dir${NC}"
                cd - > /dev/null
                continue
            fi
            
            # Read configuration
            source "$config_file"
            
            # Validate configuration
            if [ -z "$REMOTE_DIR" ]; then
                echo -e "${RED}Error: REMOTE_DIR not defined in $config_file${NC}"
                cd - > /dev/null
                continue
            fi
            
            echo -e "${GREEN}Uploading single file: $file from $dir${NC}"
            
            # Create directory structure on server before uploading
            dir_path=$(dirname "$file")
            if [ "$dir_path" != "." ]; then
                echo -e "${BLUE}Creating directory: $REMOTE_DIR/$dir_path${NC}"
                sshpass -p "$PASSWORD" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" "mkdir -p $REMOTE_DIR/$dir_path"
                
                # Check the exit status of the mkdir command
                if [ $? -ne 0 ]; then
                    echo -e "${RED}Failed to create directory: $REMOTE_DIR/$dir_path${NC}"
                fi
            fi
            
            # Upload the file
            echo -e "${BLUE}Uploading to: $REMOTE_DIR/$file${NC}"
            sshpass -p "$PASSWORD" scp -P 22 -o StrictHostKeyChecking=no "$file" "$SERVER:$REMOTE_DIR/$file"
            
            # Return to original directory
            cd - > /dev/null
        else
            echo -e "${RED}Error: $arg is not a valid directory or file${NC}"
        fi
    done
fi

echo -e "${GREEN}All uploads completed!${NC}"
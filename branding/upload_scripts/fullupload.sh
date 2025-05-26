#!/bin/bash

# Simple Website Uploader
# This script uploads all files from a directory to a server, creating directories as needed

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Server details
SERVER="q9v05prf260g@148.72.61.56"
PASSWORD="abdoM1chael@bdo"

# Check if a directory was provided
if [ $# -lt 1 ]; then
    echo -e "${RED}Error: Please provide a directory to upload${NC}"
    echo -e "${YELLOW}Usage: ./fullupload.sh <directory_name>${NC}"
    exit 1
fi

DIR=$1
CONFIG_FILE="$DIR/upload_config.txt"

# Check if directory exists
if [ ! -d "$DIR" ]; then
    echo -e "${RED}Error: Directory $DIR does not exist${NC}"
    exit 1
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}Error: Configuration file $CONFIG_FILE not found${NC}"
    echo -e "${YELLOW}Please create a file named upload_config.txt in $DIR with REMOTE_DIR=/public_html/yourdomain.com${NC}"
    exit 1
fi

# Read configuration
source "$CONFIG_FILE"

# Validate configuration
if [ -z "$REMOTE_DIR" ]; then
    echo -e "${RED}Error: REMOTE_DIR not defined in $CONFIG_FILE${NC}"
    echo -e "${YELLOW}Please add REMOTE_DIR=/public_html/yourdomain.com to your config file${NC}"
    exit 1
fi

echo -e "${BLUE}=== Full Uploader for $(basename "$DIR") ===${NC}"

# Change to the directory
cd "$DIR" || {
    echo -e "${RED}Error: Could not change to directory $DIR${NC}"
    exit 1
}

echo -e "${YELLOW}Finding all files to upload...${NC}"

# Create a temporary file to store the file list
TEMP_FILES="/tmp/upload_files.txt"

# Find all files and save to the temporary file
find . -type f -not -path "*/\.*" -not -name "upload_config.txt" -not -name "*.sh" > "$TEMP_FILES"

# Count the files
FILE_COUNT=$(wc -l < "$TEMP_FILES" | tr -d ' ')
echo -e "${GREEN}Found $FILE_COUNT files to upload${NC}"

# Loop through each file and upload it
COUNTER=0
UPLOADED=0
ERRORS=0

# Read the file list line by line
while IFS= read -r FILE_PATH; do
    # Skip empty lines
    if [ -z "$FILE_PATH" ]; then
        continue
    fi

    # Remove the leading "./" from the file path
    FILE_PATH="${FILE_PATH:2}"
    
    # Create directory structure on server
    DIR_PATH=$(dirname "$FILE_PATH")
    if [ "$DIR_PATH" != "." ]; then
        COUNTER=$((COUNTER + 1))
        echo -e "${BLUE}[$COUNTER/$FILE_COUNT] Creating directory: $REMOTE_DIR/$DIR_PATH${NC}"
        
        # Create the directory on the server
        sshpass -p "$PASSWORD" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" "mkdir -p $REMOTE_DIR/$DIR_PATH"
    fi
    
    # Upload the file
    COUNTER=$((COUNTER + 1))
    echo -e "${GREEN}[$COUNTER/$FILE_COUNT] Uploading: $FILE_PATH${NC}"
    
    sshpass -p "$PASSWORD" scp -P 22 -o StrictHostKeyChecking=no "$FILE_PATH" "$SERVER:$REMOTE_DIR/$FILE_PATH"
    
    # Check if upload was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   Success: $FILE_PATH uploaded${NC}"
        UPLOADED=$((UPLOADED + 1))
    else
        echo -e "${RED}   Error: Failed to upload $FILE_PATH${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done < "$TEMP_FILES"

# Clean up
rm -f "$TEMP_FILES"

echo -e "${GREEN}Upload complete!${NC}"
echo -e "${BLUE}Total files found: $FILE_COUNT${NC}"
echo -e "${GREEN}Files uploaded successfully: $UPLOADED${NC}"
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Files with errors: $ERRORS${NC}"
fi
echo -e "${BLUE}Website updated successfully at $(date)${NC}"

# Return to the original directory
cd - > /dev/null
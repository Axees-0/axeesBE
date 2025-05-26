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
    echo -e "${YELLOW}Usage: ./fixed_upload.sh <directory_name>${NC}"
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

echo -e "${BLUE}=== Simple Uploader for $(basename "$DIR") ===${NC}"

# Change to the directory
cd "$DIR" || {
    echo -e "${RED}Error: Could not change to directory $DIR${NC}"
    exit 1
}

echo -e "${YELLOW}Finding all files to upload...${NC}"

# Get a list of all files to upload and save to a temporary file
TEMP_FILE=$(mktemp)
# Add a debug statement to see all files being processed
echo -e "${BLUE}Debug: Listing all files found:${NC}"
find . -type f -not -path "*/\.*" -not -name "upload_config.txt" -not -name "*.sh" | tee "$TEMP_FILE" | head -n 20
total_files=$(find . -type f -not -path "*/\.*" -not -name "upload_config.txt" -not -name "*.sh" | wc -l)
echo -e "${BLUE}Total files found by find command: $total_files${NC}"
FILE_COUNT=$(wc -l < "$TEMP_FILE" | tr -d ' ')

echo -e "${GREEN}Found $FILE_COUNT files to upload${NC}"

# Process each file
COUNTER=0
while read -r FILE; do
    # Skip empty lines
    if [ -z "$FILE" ]; then
        continue
    fi

    # Remove the leading "./" from the file path
    FILE="${FILE:2}"
    
    # Debug log
    echo -e "${BLUE}Debug: Processing file: $FILE${NC}"
    
    # Create directory structure on server
    DIR_PATH=$(dirname "$FILE")
    if [ "$DIR_PATH" != "." ]; then
        # Show progress
        COUNTER=$((COUNTER + 1))
        echo -e "${BLUE}[$COUNTER/$FILE_COUNT] Creating directory: $REMOTE_DIR/$DIR_PATH${NC}"
        
        # Create the directory on the server
        sshpass -p "$PASSWORD" ssh -p 22 -o StrictHostKeyChecking=no "$SERVER" "mkdir -p $REMOTE_DIR/$DIR_PATH"
    fi
    
    # Show progress
    COUNTER=$((COUNTER + 1))
    echo -e "${GREEN}[$COUNTER/$FILE_COUNT] Uploading: $FILE${NC}"
    
    # Upload the file
    sshpass -p "$PASSWORD" scp -P 22 -o StrictHostKeyChecking=no "$FILE" "$SERVER:$REMOTE_DIR/$FILE"
    
    # Verify upload was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   Success: $FILE uploaded${NC}"
    else
        echo -e "${RED}   Error: Failed to upload $FILE${NC}"
    fi
done < <(cat "$TEMP_FILE" | grep -v "^$")

# Clean up temp file
rm -f "$TEMP_FILE"

echo -e "${GREEN}Upload complete! Processed $COUNTER files.${NC}"
echo -e "${BLUE}Website updated successfully at $(date)${NC}"

# Return to the original directory
cd - > /dev/null
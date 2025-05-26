#\!/bin/bash
cd vespera || exit
FILES=$(find . -type f -not -path "*/\.*" -not -name "upload_config.txt" -not -name "*.sh")
FILE_COUNT=$(echo "$FILES" | wc -l | tr -d ' ')
echo "Total files: $FILE_COUNT"

# Create a file to store the list of processed files
PROCESSED_FILES="/tmp/processed_files.txt"
rm -f "$PROCESSED_FILES"
touch "$PROCESSED_FILES"

COUNTER=0
echo "$FILES" | while read -r FILE; do
    # Skip empty lines
    if [ -z "$FILE" ]; then
        continue
    fi

    # Remove the leading "./" from the file path
    FILE="${FILE:2}"
    COUNTER=$((COUNTER + 1))
    echo "[$COUNTER/$FILE_COUNT] Processing: $FILE"
    echo "$FILE" >> "$PROCESSED_FILES"
done

echo "Loop complete. Counter reached: $COUNTER"
echo "Processed files:"
wc -l "$PROCESSED_FILES"
echo "Files that should have been processed:"
echo "$FILES" | wc -l

echo "Files missing from processing:"
echo "$FILES" | while read -r FILE; do
    FILE="${FILE:2}"
    if \! grep -q "^$FILE$" "$PROCESSED_FILES"; then
        echo "Missing: $FILE"
    fi
done

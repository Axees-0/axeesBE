#\!/bin/bash
echo "Before pipeline, COUNTER=$COUNTER"
COUNTER=0

find . -type f -name "*.sh" | while read -r file; do
    COUNTER=$((COUNTER + 1))
    echo "Inside pipeline, COUNTER=$COUNTER"
done

echo "After pipeline, COUNTER=$COUNTER"

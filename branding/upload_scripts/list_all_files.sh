#\!/bin/bash
cd vespera || exit 1
echo "Listing all files in vespera directory:"
find . -type f -not -path "*/\.*" -not -name "upload_config.txt" -not -name "*.sh"
echo "File count: $(find . -type f -not -path "*/\.*" -not -name "upload_config.txt" -not -name "*.sh" | wc -l)"

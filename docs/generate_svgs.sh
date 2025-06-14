#!/bin/bash

# Axees Workflow Diagrams - SVG Generation Script
# This script regenerates all SVG files from Mermaid source files

echo "🎨 Generating SVG diagrams from Mermaid source files..."

# Set the docs directory
DOCS_DIR="/Users/Mike/Desktop/programming/2_proposals/upwork/communication/axeeio_021932170180429028184/AWS/axees-eb-extracted/axees-sourcebundle/docs"

# Check if mmdc is installed
if ! command -v mmdc &> /dev/null; then
    echo "❌ Error: Mermaid CLI (mmdc) is not installed."
    echo "Install with: npm install -g @mermaid-js/mermaid-cli"
    exit 1
fi

echo "✅ Mermaid CLI found"

# Change to docs directory
cd "$DOCS_DIR" || exit 1

# Check if directories exist
if [ ! -d "mermaid" ]; then
    echo "❌ Error: mermaid directory not found"
    exit 1
fi

if [ ! -d "svgs" ]; then
    echo "📁 Creating svgs directory..."
    mkdir svgs
fi

# Counter for tracking progress
count=0
total=$(ls mermaid/*.mmd 2>/dev/null | wc -l)

echo "📊 Found $total Mermaid files to process"

# Generate SVG for each .mmd file
for mmd_file in mermaid/*.mmd; do
    if [ -f "$mmd_file" ]; then
        count=$((count + 1))
        filename=$(basename "$mmd_file" .mmd)
        svg_file="svgs/${filename}.svg"
        
        echo "[$count/$total] Generating $svg_file..."
        
        if mmdc -i "$mmd_file" -o "$svg_file"; then
            echo "  ✅ Successfully generated $svg_file"
        else
            echo "  ❌ Failed to generate $svg_file"
        fi
    fi
done

echo ""
echo "🎉 SVG generation complete!"
echo "📁 Files generated in: $DOCS_DIR/svgs/"
echo ""
echo "Generated files:"
ls -la svgs/*.svg | awk '{print "  " $9 " (" $5 " bytes)"}'
echo ""
echo "📂 Directory structure:"
echo "docs/"
echo "├── mermaid/     ($(ls mermaid/*.mmd | wc -l) source files)"
echo "├── svgs/        ($(ls svgs/*.svg | wc -l) generated files)"
echo "├── README.md"
echo "├── generate_svgs.sh"
echo "└── AXEES_WORKFLOW_DIAGRAMS.md"
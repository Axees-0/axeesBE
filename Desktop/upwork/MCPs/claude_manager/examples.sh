#!/bin/bash

# Usage Examples for project-manager.js

echo "Project Manager - Usage Examples"
echo "================================"
echo ""

echo "1. Create a new project directory:"
echo "   node project-manager.js --id my-new-project"
echo ""

echo "2. Create and navigate to a project:"
echo "   node project-manager.js --id my-project --navigate"
echo ""

echo "3. Set Claude config:"
echo "   node project-manager.js --config hasTrustDialogAccepted=true"
echo ""

echo "4. Start Claude in a project directory:"
echo "   node project-manager.js --id my-project --navigate --start"
echo ""

echo "5. Start Claude with an initial message:"
echo "   node project-manager.js --id my-project --navigate --start --message \"create a README.md file\""
echo ""

echo "6. Execute a command in project directory:"
echo "   node project-manager.js --id my-project --navigate --execute \"npm init -y\""
echo ""

echo "7. Auto mode (create/navigate, set trust, start Claude):"
echo "   node project-manager.js --id my-project --auto"
echo ""

echo "8. Auto mode with initial message:"
echo "   node project-manager.js --id my-project --auto --message \"analyze the codebase\""
echo ""

echo "9. Use custom parent directory:"
echo "   node project-manager.js --id my-project --parent /Users/Mike/work/projects --auto"
echo ""

echo "10. Chain multiple operations:"
echo "    node project-manager.js --id my-project --navigate --execute \"git init\" --config hasTrustDialogAccepted=true --start"
echo ""

echo "Environment Variables:"
echo "====================="
echo "PROJECT_PARENT_DIR - Set default parent directory for all projects"
echo "Example: export PROJECT_PARENT_DIR=/Users/Mike/work/projects"
echo ""

echo "Making it globally available:"
echo "============================"
echo "1. Install dependencies: npm install"
echo "2. Make executable: chmod +x project-manager.js"
echo "3. Link globally: npm link"
echo "4. Use anywhere: project-manager --id my-project --auto"
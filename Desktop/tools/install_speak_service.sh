#!/bin/bash

# Install Speak Text service to macOS Services folder

echo "Installing Speak Text service..."

# Create Services directory if it doesn't exist
mkdir -p ~/Library/Services/

# Copy the workflow to Services
cp -R "/Users/Mike/Desktop/tools/Speak Text.workflow" ~/Library/Services/

# Make sure the Python scripts are executable
chmod +x /Users/Mike/Desktop/tools/speak_service.py
chmod +x /Users/Mike/Desktop/tools/speak_service_gui.py

echo "Installation complete!"
echo ""
echo "To enable the service:"
echo "1. Go to System Preferences → Keyboard → Shortcuts → Services"
echo "2. Find 'Speak Text' under the Text section"
echo "3. Check the box to enable it"
echo "4. Optionally assign a keyboard shortcut"
echo ""
echo "Usage: Select any text and right-click → Services → Speak Text"
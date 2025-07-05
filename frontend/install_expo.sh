#!/bin/bash
set -e

echo "Installing @expo/cli..."
cd /home/Mike/projects/axees/axeesBE/frontend
npm install

echo "Checking expo installation..."
npx expo --version

echo "Checking expo binary in node_modules..."
ls node_modules/.bin | grep expo || echo "No expo binary found"

echo "Installation complete!"
#!/bin/bash
# Setup script for macOS development environment

echo "Setting up SoloTrend X development environment for macOS..."

# Get the current directory
PROJECT_ROOT=$(pwd)
echo "Project root: $PROJECT_ROOT"

# Create a clean symbolic link to avoid path issues with parentheses
CLEAN_ROOT="$HOME/solotrendx_link"
echo "Creating clean symbolic link: $CLEAN_ROOT"
rm -rf "$CLEAN_ROOT" 2>/dev/null
ln -s "$PROJECT_ROOT" "$CLEAN_ROOT"

# Define the virtual environment path
VENV_DIR="$CLEAN_ROOT/environment/python/venv_mac"
echo "Virtual environment: $VENV_DIR"

# Create log directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/data/logs"

# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 not found! Please install Python 3."
    exit 1
fi

# Create a macOS-specific virtual environment
echo "Creating virtual environment..."
python3 -m venv "$VENV_DIR"

# Activate the virtual environment
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r "$PROJECT_ROOT/requirements.txt"

# Install additional requirements needed for macOS
echo "Installing additional requirements..."
pip install flask-cors PyJWT

echo "Setup complete!"
echo ""
echo "To use this environment, run:"
echo "source $VENV_DIR/bin/activate"
echo ""
echo "To start services, use the macOS start script:"
echo "./start_mac_services.sh"
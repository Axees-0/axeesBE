"""
Test helper utilities for Claude Task Manager tests.
"""
import os
import sys
import tempfile
import importlib

# Add the project root to the path so tests can find the src module
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

def import_module(module_path):
    """Import a module safely, ensuring it has the latest code."""
    # If the module is already loaded, reload it to get the latest version
    if module_path in sys.modules:
        return importlib.reload(sys.modules[module_path])
    return importlib.import_module(module_path)

def create_temp_file(content):
    """Create a temporary file with the given content."""
    temp_file = tempfile.NamedTemporaryFile(delete=False)
    temp_file.write(content.encode('utf-8'))
    temp_file.close()
    return temp_file.name

def remove_temp_file(file_path):
    """Remove a temporary file."""
    try:
        os.unlink(file_path)
    except:
        pass
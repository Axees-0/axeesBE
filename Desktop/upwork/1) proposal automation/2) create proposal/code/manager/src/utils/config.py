import os
import json
import logging

def load_config(config_file=None):
    """Load configuration from a config file."""
    if config_file is None:
        # Default to config.json in the same directory as this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        config_dir = os.path.join(os.path.dirname(os.path.dirname(current_dir)), "config")
        config_file = os.path.join(config_dir, "config.json")
    
    if not os.path.exists(config_file):
        logging.warning(f"Config file {config_file} not found. Using default configuration.")
        return {}
    
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
        return config
    except Exception as e:
        logging.error(f"Error loading config file: {e}")
        return {}

def get_config(config_file=None):
    """Get the configuration dictionary."""
    return load_config(config_file)

def get_search_paths():
    """Get the list of paths to search for project directories by ID."""
    config = load_config()
    search_paths = config.get('search_paths', [
        "/Users/Mike/Desktop/upwork/2) proposals",
        "/Users/Mike/Desktop/upwork/3) current projects"
    ])
    
    # Ensure all paths exist
    valid_paths = []
    for path in search_paths:
        if os.path.exists(path) and os.path.isdir(path):
            valid_paths.append(path)
        else:
            logging.warning(f"Search path does not exist: {path}")
    
    # If no valid paths, use default
    if not valid_paths:
        default = config.get('default_path', "/Users/Mike/Desktop/upwork/2) proposals")
        if os.path.exists(default) and os.path.isdir(default):
            valid_paths.append(default)
            logging.info(f"Using default path: {default}")
        else:
            # Last resort, use current directory
            valid_paths.append(os.getcwd())
            logging.warning(f"Default path not found, using current directory: {os.getcwd()}")
    
    return valid_paths

def get_proposals_directory():
    """Get the directory to search for proposals by ID."""
    config = load_config()
    proposals_dir = config.get('proposals_directory', "/Users/Mike/Desktop/upwork/2) proposals")
    
    # Ensure the path exists
    if os.path.exists(proposals_dir) and os.path.isdir(proposals_dir):
        return proposals_dir
    else:
        logging.warning(f"Proposals directory does not exist: {proposals_dir}")
        # Fall back to default path
        default = config.get('default_path', "/Users/Mike/Desktop/upwork/2) proposals")
        if os.path.exists(default) and os.path.isdir(default):
            logging.info(f"Using default path for proposals: {default}")
            return default
        else:
            # Last resort, use current directory
            logging.warning(f"Default path not found, using current directory for proposals: {os.getcwd()}")
            return os.getcwd()
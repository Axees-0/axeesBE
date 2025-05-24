"""
Utilities for path management and project ID lookup.
"""
import os
import logging
from typing import List, Optional, Dict, Any

# Configure logging
logger = logging.getLogger(__name__)


def normalize_path(path: str) -> str:
    """
    Normalize a file system path for consistent comparisons.
    
    Args:
        path: The path to normalize
        
    Returns:
        Normalized path without trailing slashes and redundant components
    """
    # Convert to absolute path if not already
    if not os.path.isabs(path):
        path = os.path.abspath(path)
    
    # Normalize the path (removes redundant separators, up-level references, etc.)
    normalized_path = os.path.normpath(path)
    
    # Remove any trailing slashes
    while normalized_path.endswith(os.path.sep):
        normalized_path = normalized_path[:-1]
    
    return normalized_path


def resolve_path(path: str) -> str:
    """
    Fully resolve a path, including symlinks.
    
    Args:
        path: The path to resolve
        
    Returns:
        Fully resolved absolute path
    """
    # Convert to absolute path if not already
    if not os.path.isabs(path):
        path = os.path.abspath(path)
    
    # Resolve any symlinks
    try:
        resolved_path = os.path.realpath(path)
    except Exception as e:
        logger.warning(f"Failed to resolve symlinks in path {path}: {e}")
        resolved_path = path
    
    # Normalize the path
    return normalize_path(resolved_path)


def compare_paths(path1: str, path2: str) -> bool:
    """
    Compare two paths, considering normalization.
    
    Args:
        path1: First path
        path2: Second path
        
    Returns:
        True if paths are equivalent, False otherwise
    """
    return normalize_path(path1) == normalize_path(path2)


def find_instances_by_project_dir(instances: List[Dict[str, Any]], project_dir: str) -> List[Dict[str, Any]]:
    """
    Find instances matching a project directory.
    
    Args:
        instances: List of instance dictionaries
        project_dir: Project directory to match
        
    Returns:
        List of matching instances
    """
    normalized_project_dir = normalize_path(project_dir)
    
    matching_instances = [
        instance for instance in instances
        if compare_paths(instance.get("project_dir", ""), normalized_project_dir)
    ]
    
    return matching_instances


def find_project_id_by_path(instances: List[Dict[str, Any]], project_dir: str) -> Optional[str]:
    """
    Find a project ID for a given directory path.
    
    Args:
        instances: List of instance dictionaries
        project_dir: Project directory to look up
        
    Returns:
        Project ID if found, None otherwise
    """
    matching_instances = find_instances_by_project_dir(instances, project_dir)
    
    if matching_instances:
        # Return the ID of the most recently created instance for this project
        # Sort by start_time in descending order (newest first)
        sorted_instances = sorted(
            matching_instances, 
            key=lambda x: x.get("start_time", 0), 
            reverse=True
        )
        return sorted_instances[0].get("id")
    
    return None


def find_project_dir_by_id(project_id: str, search_directory: Optional[str] = None) -> Optional[str]:
    """
    Find a project directory by its ID within the specified search directory.
    
    Args:
        project_id: The project ID to look for
        search_directory: Directory to search in, defaults to proposals directory from config
        
    Returns:
        Project directory path if found, None otherwise
    """
    if not search_directory:
        from ..utils.config import get_proposals_directory
        search_directory = get_proposals_directory()
    
    if not os.path.exists(search_directory) or not os.path.isdir(search_directory):
        logger.warning(f"Search directory does not exist: {search_directory}")
        return None
    
    # Look for a directory with the project ID in its name
    try:
        for item in os.listdir(search_directory):
            item_path = os.path.join(search_directory, item)
            if os.path.isdir(item_path) and project_id in item:
                logger.info(f"Found project directory for ID {project_id}: {item_path}")
                return item_path
    except Exception as e:
        logger.error(f"Error searching for project directory by ID: {e}")
    
    logger.warning(f"No project directory found for ID {project_id}")
    return None
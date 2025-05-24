#!/usr/bin/env python3
"""
Test script for testing the find_project_dir_by_id function.
"""

from src.utils.path_utils import find_project_dir_by_id

def test_find_by_id(project_id):
    """Test finding a project directory by ID."""
    project_dir = find_project_dir_by_id(project_id)
    print(f"ID: {project_id}")
    print(f"Directory: {project_dir}")

if __name__ == "__main__":
    test_find_by_id("021897455790136661047")
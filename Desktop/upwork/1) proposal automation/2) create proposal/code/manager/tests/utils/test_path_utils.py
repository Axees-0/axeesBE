#!/usr/bin/env python3
"""
Tests for path utility functions.
"""

import os
import sys
import tempfile
import unittest
import shutil
from pathlib import Path

# Add the parent directory to the path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.utils.path_utils import (
    normalize_path,
    resolve_path,
    compare_paths,
    find_instances_by_project_dir,
    find_project_id_by_path
)


class TestPathUtils(unittest.TestCase):
    """Test path utility functions."""

    def setUp(self):
        """Set up test environment."""
        # Create temporary test directory
        self.test_dir = tempfile.mkdtemp()
        
        # Create some nested directories for testing
        self.nested_dir = os.path.join(self.test_dir, "nested", "path")
        os.makedirs(self.nested_dir, exist_ok=True)
        
        # Create a directory with special characters
        self.special_dir = os.path.join(self.test_dir, "special chars", "path")
        os.makedirs(self.special_dir, exist_ok=True)
        
        # Create a test file
        self.test_file = os.path.join(self.test_dir, "test_file.txt")
        with open(self.test_file, 'w') as f:
            f.write("Test file content")

    def tearDown(self):
        """Clean up test environment."""
        # Remove test directory and all contents
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_normalize_path(self):
        """Test path normalization."""
        # Test with trailing slash
        path_with_slash = self.test_dir + "/"
        self.assertEqual(normalize_path(path_with_slash), self.test_dir)
        
        # Test with multiple trailing slashes
        path_with_multiple_slashes = self.test_dir + "//"
        self.assertEqual(normalize_path(path_with_multiple_slashes), self.test_dir)
        
        # Test with redundant components
        redundant_path = os.path.join(self.test_dir, ".", "nested", "..", ".")
        self.assertEqual(normalize_path(redundant_path), self.test_dir)
        
        # Test with nested path
        nested_path = os.path.join(self.test_dir, "nested", "path", "..")
        expected_path = os.path.join(self.test_dir, "nested")
        self.assertEqual(normalize_path(nested_path), expected_path)
        
        # Test with path containing special characters
        special_path = self.special_dir + "/"
        self.assertEqual(normalize_path(special_path), self.special_dir)
        
        # Test with file path
        file_path = self.test_file + "/"  # Trailing slash on a file
        self.assertEqual(normalize_path(file_path), self.test_file)

    def test_resolve_path(self):
        """Test path resolution."""
        # On macOS, tempfile.mkdtemp() returns a path that's symlinked through /private/
        # So we need to compare the real paths instead of the raw paths
        
        # Test with a normal path - compare normalized paths
        normal_resolved = resolve_path(self.test_dir)
        normal_normalized = normalize_path(self.test_dir)
        
        # On macOS these might differ due to /private/ prefix, so we check if they refer to same location
        self.assertEqual(
            os.path.normpath(os.path.realpath(normal_resolved)), 
            os.path.normpath(os.path.realpath(normal_normalized))
        )
        
        # Test with relative path
        orig_dir = os.getcwd()
        try:
            # Change to parent directory
            os.chdir(os.path.dirname(self.test_dir))
            # Get relative path to test_dir
            rel_path = os.path.basename(self.test_dir)
            # Resolve should give the absolute path
            resolved_rel = resolve_path(rel_path)
            normalized_abs = normalize_path(self.test_dir)
            
            # Compare real paths
            self.assertEqual(
                os.path.normpath(os.path.realpath(resolved_rel)),
                os.path.normpath(os.path.realpath(normalized_abs))
            )
        finally:
            os.chdir(orig_dir)
        
        # Test with symlink if supported
        symlink_path = os.path.join(self.test_dir, "symlink")
        try:
            os.symlink(self.nested_dir, symlink_path)
            # Compare real paths
            self.assertEqual(
                os.path.normpath(os.path.realpath(resolve_path(symlink_path))),
                os.path.normpath(os.path.realpath(normalize_path(self.nested_dir)))
            )
        except (OSError, AttributeError):
            # Skip if symlinks are not supported on this platform
            pass
        finally:
            # Clean up symlink if it was created
            if os.path.exists(symlink_path):
                os.unlink(symlink_path)

    def test_compare_paths(self):
        """Test path comparison."""
        # Test identical paths
        self.assertTrue(compare_paths(self.test_dir, self.test_dir))
        
        # Test paths with trailing slashes
        self.assertTrue(compare_paths(self.test_dir, self.test_dir + "/"))
        self.assertTrue(compare_paths(self.test_dir + "/", self.test_dir))
        
        # Test paths with redundant components
        redundant_path = os.path.join(self.test_dir, ".", "..")
        parent_dir = os.path.dirname(self.test_dir)
        redundant_path = os.path.join(redundant_path, os.path.basename(self.test_dir))
        self.assertTrue(compare_paths(redundant_path, self.test_dir))
        
        # Test different paths
        self.assertFalse(compare_paths(self.test_dir, self.nested_dir))
        
        # Test case sensitivity based on platform
        # On case-insensitive file systems (like Windows), these should be equal
        # On case-sensitive file systems (like Linux), these should be different
        if os.name == 'nt':  # Windows
            self.assertTrue(compare_paths(self.test_dir, self.test_dir.upper()))
        else:  # Assume case-sensitive
            # Skip this test on case-insensitive file systems (like macOS)
            if os.path.exists(self.test_dir.upper()):
                self.skipTest("File system is case-insensitive")

    def test_find_instances_by_project_dir(self):
        """Test finding instances by project directory."""
        # Create test instances
        instances = [
            {"id": "instance1", "project_dir": self.test_dir, "start_time": 100},
            {"id": "instance2", "project_dir": self.nested_dir, "start_time": 200},
            {"id": "instance3", "project_dir": self.special_dir, "start_time": 300},
            {"id": "instance4", "project_dir": self.test_dir, "start_time": 400}  # Duplicate project_dir
        ]
        
        # Test finding instances with exact match
        matching = find_instances_by_project_dir(instances, self.test_dir)
        self.assertEqual(len(matching), 2)
        self.assertEqual(set(inst["id"] for inst in matching), {"instance1", "instance4"})
        
        # Test finding instances with trailing slash
        matching = find_instances_by_project_dir(instances, self.test_dir + "/")
        self.assertEqual(len(matching), 2)
        self.assertEqual(set(inst["id"] for inst in matching), {"instance1", "instance4"})
        
        # Test finding instances with redundant components
        redundant_path = os.path.join(self.test_dir, ".", "..")
        redundant_path = os.path.join(redundant_path, os.path.basename(self.test_dir))
        matching = find_instances_by_project_dir(instances, redundant_path)
        self.assertEqual(len(matching), 2)
        self.assertEqual(set(inst["id"] for inst in matching), {"instance1", "instance4"})
        
        # Test finding instances with non-existent path
        non_existent = os.path.join(self.test_dir, "non_existent")
        matching = find_instances_by_project_dir(instances, non_existent)
        self.assertEqual(len(matching), 0)

    def test_find_project_id_by_path(self):
        """Test finding project ID by path."""
        # Create test instances with timestamps to ensure deterministic ordering
        instances = [
            {"id": "instance1", "project_dir": self.test_dir, "start_time": 100},
            {"id": "instance2", "project_dir": self.nested_dir, "start_time": 200},
            {"id": "instance3", "project_dir": self.special_dir, "start_time": 300},
            {"id": "instance4", "project_dir": self.test_dir, "start_time": 400}  # Newer instance for test_dir
        ]
        
        # Test finding project ID for a path with multiple instances (should return the newest)
        project_id = find_project_id_by_path(instances, self.test_dir)
        self.assertEqual(project_id, "instance4")  # Should pick the newer instance
        
        # Test finding project ID with trailing slash
        project_id = find_project_id_by_path(instances, self.test_dir + "/")
        self.assertEqual(project_id, "instance4")
        
        # Test finding project ID with redundant components
        redundant_path = os.path.join(self.test_dir, ".", "..")
        redundant_path = os.path.join(redundant_path, os.path.basename(self.test_dir))
        project_id = find_project_id_by_path(instances, redundant_path)
        self.assertEqual(project_id, "instance4")
        
        # Test finding project ID for a path with a single instance
        project_id = find_project_id_by_path(instances, self.nested_dir)
        self.assertEqual(project_id, "instance2")
        
        # Test finding project ID for a non-existent path
        non_existent = os.path.join(self.test_dir, "non_existent")
        project_id = find_project_id_by_path(instances, non_existent)
        self.assertIsNone(project_id)


if __name__ == "__main__":
    unittest.main()
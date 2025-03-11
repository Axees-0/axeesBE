#!/usr/bin/env python3
"""
Tests for file operations functionality in Claude Task Manager.
This includes:
- Path management and normalization
- Project ID lookup
"""

import os
import sys
import tempfile
import time
import uuid
import unittest
import shutil
from pathlib import Path

# Add the parent directory to the path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.task_manager import ClaudeTaskManager
from src.core.models.instance import ClaudeInstance, RuntimeType
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager


class TestPathManagement(unittest.TestCase):
    """Test path management and normalization functionality."""

    def setUp(self):
        """Set up test environment."""
        # Create temporary directories for testing
        self.test_dir = tempfile.mkdtemp()
        self.another_dir = tempfile.mkdtemp()
        
        # Create temporary file for instance storage with initial content
        fd, self.instance_file = tempfile.mkstemp(suffix='.json')
        with os.fdopen(fd, 'w') as f:
            f.write('[]')  # Initialize as an empty array for JSON parsing
        
        # Set up logging
        import logging
        self.logger = logging.getLogger('test_file_operations')
        self.logger.setLevel(logging.INFO)
        
        # Initialize components
        self.storage = JSONInstanceStorage(self.instance_file, self.logger)
        self.tmux_manager = TmuxProcessManager(self.logger)
        self.terminal_manager = TerminalProcessManager(self.logger)
        
        # Create task manager
        self.task_manager = ClaudeTaskManager(
            storage=self.storage,
            tmux_manager=self.tmux_manager,
            terminal_manager=self.terminal_manager,
            logger=self.logger
        )
        
        # Create a prompt file
        self.prompt_path = os.path.join(self.test_dir, "test_prompt.txt")
        with open(self.prompt_path, 'w') as f:
            f.write("Test prompt for path normalization tests")

    def tearDown(self):
        """Clean up test environment."""
        # Remove temporary directories
        shutil.rmtree(self.test_dir, ignore_errors=True)
        shutil.rmtree(self.another_dir, ignore_errors=True)
        
        # Remove instance file
        if os.path.exists(self.instance_file):
            os.unlink(self.instance_file)

    def test_path_normalization(self):
        """Test path normalization with different path formats."""
        # Apply path normalization to ensure trailing slashes are removed
        from src.utils.path_utils import normalize_path
        
        # Test with normal path
        instance_id1 = str(uuid.uuid4())
        instance1 = ClaudeInstance(
            id=instance_id1,
            project_dir=self.test_dir,
            prompt_path=self.prompt_path,
            start_time=time.time()
        )
        # Apply normalization before storing
        instance1.project_dir = normalize_path(instance1.project_dir)
        self.task_manager.instances[instance_id1] = instance1
        self.task_manager.save_instances()
        
        # Test with path with trailing slash
        test_dir_with_slash = self.test_dir + "/"
        instance_id2 = str(uuid.uuid4())
        instance2 = ClaudeInstance(
            id=instance_id2,
            project_dir=test_dir_with_slash,
            prompt_path=self.prompt_path,
            start_time=time.time()
        )
        # Apply normalization before storing
        instance2.project_dir = normalize_path(instance2.project_dir)
        self.task_manager.instances[instance_id2] = instance2
        self.task_manager.save_instances()
        
        # Test with path with double trailing slash
        test_dir_with_double_slash = self.test_dir + "//"
        instance_id3 = str(uuid.uuid4())
        instance3 = ClaudeInstance(
            id=instance_id3,
            project_dir=test_dir_with_double_slash,
            prompt_path=self.prompt_path,
            start_time=time.time()
        )
        # Apply normalization before storing
        instance3.project_dir = normalize_path(instance3.project_dir)
        self.task_manager.instances[instance_id3] = instance3
        self.task_manager.save_instances()
        
        # Load instances and verify normalization
        reloaded_instances = self.storage.load_instances()
        
        # Check that all three instances have equal normalized paths
        # Use os.path.realpath to handle macOS /private/ symlinks
        self.assertEqual(
            os.path.normpath(os.path.realpath(self.test_dir)),
            os.path.normpath(os.path.realpath(reloaded_instances[instance_id1].project_dir))
        )
        self.assertEqual(
            os.path.normpath(os.path.realpath(self.test_dir)),
            os.path.normpath(os.path.realpath(reloaded_instances[instance_id2].project_dir))
        )
        self.assertEqual(
            os.path.normpath(os.path.realpath(self.test_dir)),
            os.path.normpath(os.path.realpath(reloaded_instances[instance_id3].project_dir))
        )
        
        # Verify normalized paths don't have trailing slashes
        self.assertFalse(reloaded_instances[instance_id1].project_dir.endswith('/'))
        self.assertFalse(reloaded_instances[instance_id2].project_dir.endswith('/'))
        self.assertFalse(reloaded_instances[instance_id3].project_dir.endswith('/'))
    
    def test_path_with_redundant_components(self):
        """Test path normalization with redundant components."""
        # Apply path normalization
        from src.utils.path_utils import normalize_path
        
        # Create path with . and .. components
        os.makedirs(os.path.join(self.test_dir, "subdir"), exist_ok=True)
        redundant_path = os.path.join(self.test_dir, ".", "subdir", "..", ".")
        
        instance_id = str(uuid.uuid4())
        instance = ClaudeInstance(
            id=instance_id,
            project_dir=redundant_path,
            prompt_path=self.prompt_path,
            start_time=time.time()
        )
        
        # Normalize the path before saving
        instance.project_dir = normalize_path(instance.project_dir)
        self.task_manager.instances[instance_id] = instance
        self.task_manager.save_instances()
        
        # Load instance and verify normalization
        reloaded_instances = self.storage.load_instances()
        
        # The normalized path should be equivalent to the test_dir
        self.assertEqual(
            os.path.normpath(os.path.realpath(self.test_dir)),
            os.path.normpath(os.path.realpath(reloaded_instances[instance_id].project_dir))
        )
        
        # The stored path should not contain redundant components
        normalized_path = reloaded_instances[instance_id].project_dir
        self.assertNotIn("./", normalized_path)
        self.assertNotIn("../", normalized_path)

    def test_relative_path_resolution(self):
        """Test resolution of relative paths."""
        # Apply path normalization
        from src.utils.path_utils import normalize_path
        
        # Save the current directory to restore later
        original_dir = os.getcwd()
        
        try:
            # Change to the parent of test_dir
            parent_dir = os.path.dirname(self.test_dir)
            os.chdir(parent_dir)
            
            # Get the basename of test_dir
            test_dir_name = os.path.basename(self.test_dir)
            
            # Create instance with relative path
            instance_id = str(uuid.uuid4())
            instance = ClaudeInstance(
                id=instance_id,
                project_dir=test_dir_name,  # Relative path
                prompt_path=self.prompt_path,
                start_time=time.time()
            )
            
            # Convert project_dir to absolute path and normalize before saving
            instance.project_dir = normalize_path(instance.project_dir)
            
            self.task_manager.instances[instance_id] = instance
            self.task_manager.save_instances()
            
            # Load instance and verify path resolution
            reloaded_instances = self.storage.load_instances()
            
            # The path should be resolved to an absolute path
            self.assertTrue(os.path.isabs(reloaded_instances[instance_id].project_dir))
            
            # Account for macOS /private/ prefix by comparing realpath
            self.assertEqual(
                os.path.normpath(os.path.realpath(self.test_dir)),
                os.path.normpath(os.path.realpath(reloaded_instances[instance_id].project_dir))
            )
        finally:
            # Restore original directory
            os.chdir(original_dir)

    def test_symlink_resolution(self):
        """Test resolution of symlinks in paths."""
        # Apply path normalization
        from src.utils.path_utils import resolve_path
        
        # Create a symlink to test_dir
        symlink_dir = os.path.join(self.another_dir, "symlink_to_test")
        try:
            os.symlink(self.test_dir, symlink_dir)
            
            # Create instance with symlink path
            instance_id = str(uuid.uuid4())
            instance = ClaudeInstance(
                id=instance_id,
                project_dir=symlink_dir,
                prompt_path=self.prompt_path,
                start_time=time.time()
            )
            
            # Resolve symlink to real path using our utility function
            instance.project_dir = resolve_path(instance.project_dir)
            
            self.task_manager.instances[instance_id] = instance
            self.task_manager.save_instances()
            
            # Load instance and verify symlink resolution
            reloaded_instances = self.storage.load_instances()
            
            # The stored path should be resolved to the real path, not the symlink
            # Account for macOS /private/ prefix by comparing realpath
            self.assertEqual(
                os.path.normpath(os.path.realpath(self.test_dir)),
                os.path.normpath(os.path.realpath(reloaded_instances[instance_id].project_dir))
            )
        except OSError as e:
            # Skip this test if symlinks are not supported
            self.skipTest(f"Symlinks not supported on this platform: {e}")
        finally:
            # Clean up symlink
            if os.path.exists(symlink_dir):
                os.unlink(symlink_dir)


class TestProjectIDLookup(unittest.TestCase):
    """Test project ID lookup functionality."""

    def setUp(self):
        """Set up test environment."""
        # Create temporary directories for testing
        self.test_dir = tempfile.mkdtemp()
        
        # Create temporary file for instance storage with initial content
        fd, self.instance_file = tempfile.mkstemp(suffix='.json')
        with os.fdopen(fd, 'w') as f:
            f.write('[]')  # Initialize as an empty array for JSON parsing
        
        # Set up logging
        import logging
        self.logger = logging.getLogger('test_project_id_lookup')
        self.logger.setLevel(logging.INFO)
        
        # Initialize components
        self.storage = JSONInstanceStorage(self.instance_file, self.logger)
        self.tmux_manager = TmuxProcessManager(self.logger)
        self.terminal_manager = TerminalProcessManager(self.logger)
        
        # Create task manager
        self.task_manager = ClaudeTaskManager(
            storage=self.storage,
            tmux_manager=self.tmux_manager,
            terminal_manager=self.terminal_manager,
            logger=self.logger
        )
        
        # Create a prompt file
        self.prompt_path = os.path.join(self.test_dir, "test_prompt.txt")
        with open(self.prompt_path, 'w') as f:
            f.write("Test prompt for project ID lookup tests")
        
        # Create several instances with different project directories
        self.project_dirs = []
        self.instance_ids = []
        
        # Create 3 nested project directories
        for i in range(3):
            project_dir = os.path.join(self.test_dir, f"project_{i}")
            os.makedirs(project_dir, exist_ok=True)
            self.project_dirs.append(project_dir)
            
            # Create an instance for each project
            instance_id = str(uuid.uuid4())
            self.instance_ids.append(instance_id)
            
            instance = ClaudeInstance(
                id=instance_id,
                project_dir=project_dir,
                prompt_path=self.prompt_path,
                start_time=time.time()
            )
            self.task_manager.instances[instance_id] = instance
        
        # Save all instances
        self.task_manager.save_instances()

    def tearDown(self):
        """Clean up test environment."""
        # Remove temporary directory
        shutil.rmtree(self.test_dir, ignore_errors=True)
        
        # Remove instance file
        if os.path.exists(self.instance_file):
            os.unlink(self.instance_file)

    def test_find_instances_by_project_dir(self):
        """Test finding instances by project directory."""
        # Import path utilities
        from src.utils.path_utils import find_instances_by_project_dir
        
        # Load instances 
        instances = self.task_manager.list_instances()
        
        # Check we have all our test instances
        self.assertEqual(len(instances), 3)
        
        # Find instances for each project directory using our utility function
        for i, project_dir in enumerate(self.project_dirs):
            matching_instances = find_instances_by_project_dir(instances, project_dir)
            
            # Check that we found exactly one instance for each project directory
            self.assertEqual(len(matching_instances), 1)
            self.assertEqual(matching_instances[0]["id"], self.instance_ids[i])

    def test_find_instance_by_project_with_trailing_slash(self):
        """Test finding an instance by project directory with trailing slash."""
        # Import path utilities
        from src.utils.path_utils import find_instances_by_project_dir
        
        # Test each project directory
        for i, project_dir in enumerate(self.project_dirs):
            # Add trailing slash to project directory
            project_dir_with_slash = project_dir + "/"
            
            # Find instances for the modified project directory using our utility function
            instances = self.task_manager.list_instances()
            matching_instances = find_instances_by_project_dir(instances, project_dir_with_slash)
            
            # Check that we still found exactly one instance
            self.assertEqual(len(matching_instances), 1)
            self.assertEqual(matching_instances[0]["id"], self.instance_ids[i])

    def test_find_instance_by_project_with_redundant_components(self):
        """Test finding an instance by project directory with redundant components."""
        # Import path utilities
        from src.utils.path_utils import find_instances_by_project_dir
        
        # Test each project directory
        for i, project_dir in enumerate(self.project_dirs):
            # Add redundant components to project directory
            project_dir_redundant = os.path.join(project_dir, ".", "..")
            project_dir_redundant = os.path.join(project_dir_redundant, os.path.basename(project_dir))
            
            # Find instances for the modified project directory using our utility function
            instances = self.task_manager.list_instances()
            matching_instances = find_instances_by_project_dir(instances, project_dir_redundant)
            
            # Check that we still found exactly one instance
            self.assertEqual(len(matching_instances), 1)
            self.assertEqual(matching_instances[0]["id"], self.instance_ids[i])

    def test_instance_creation_with_same_project(self):
        """Test creating a new instance with the same project directory."""
        # Import path utilities
        from src.utils.path_utils import find_instances_by_project_dir, normalize_path
        
        # Choose one of the existing project directories
        existing_project_dir = self.project_dirs[0]
        
        # Create a new prompt file
        new_prompt_path = os.path.join(existing_project_dir, "new_prompt.txt")
        with open(new_prompt_path, 'w') as f:
            f.write("New test prompt for existing project")
        
        # Create a new instance with the same project directory
        new_instance_id = str(uuid.uuid4())
        new_instance = ClaudeInstance(
            id=new_instance_id,
            project_dir=existing_project_dir,
            prompt_path=new_prompt_path,
            start_time=time.time()
        )
        
        # Normalize the path before saving
        new_instance.project_dir = normalize_path(new_instance.project_dir)
        self.task_manager.instances[new_instance_id] = new_instance
        self.task_manager.save_instances()
        
        # Check that both instances are found for the project directory
        instances = self.task_manager.list_instances()
        matching_instances = find_instances_by_project_dir(instances, existing_project_dir)
        
        # Check that we now have two instances for the project directory
        self.assertEqual(len(matching_instances), 2)
        
        # Check that one of them is our new instance
        self.assertTrue(any(inst["id"] == new_instance_id for inst in matching_instances))
        
        # Check that the original instance is still there
        self.assertTrue(any(inst["id"] == self.instance_ids[0] for inst in matching_instances))
        
    def test_task_manager_project_id_lookup(self):
        """Test the task manager's project ID lookup methods."""
        # Test the find_project_id method (should return the most recent instance)
        for i, project_dir in enumerate(self.project_dirs):
            # First check the normal project directory
            project_id = self.task_manager.find_project_id(project_dir)
            self.assertEqual(project_id, self.instance_ids[i])
            
            # Then check with a trailing slash
            project_id = self.task_manager.find_project_id(project_dir + "/")
            self.assertEqual(project_id, self.instance_ids[i])
            
            # Then check with redundant components
            redundant_path = os.path.join(project_dir, ".", "..")
            redundant_path = os.path.join(redundant_path, os.path.basename(project_dir))
            project_id = self.task_manager.find_project_id(redundant_path)
            self.assertEqual(project_id, self.instance_ids[i])
        
        # Test the find_instances_by_project_dir method
        for i, project_dir in enumerate(self.project_dirs):
            matching_instances = self.task_manager.find_instances_by_project_dir(project_dir)
            self.assertEqual(len(matching_instances), 1)
            self.assertEqual(matching_instances[0]["id"], self.instance_ids[i])
            
        # Test with a non-existent directory
        non_existent = os.path.join(self.test_dir, "non_existent")
        project_id = self.task_manager.find_project_id(non_existent)
        self.assertIsNone(project_id)
        matching_instances = self.task_manager.find_instances_by_project_dir(non_existent)
        self.assertEqual(len(matching_instances), 0)


if __name__ == "__main__":
    unittest.main()
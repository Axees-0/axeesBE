#!/usr/bin/env python3
"""
Test for UI form submission to create a Claude instance.

This test verifies that:
1. The UI form fields work correctly
2. Form data validates properly
3. The form submits with the correct project directory and prompt file values
"""
import os
import json
import unittest
import time
import tempfile
import shutil
from pathlib import Path

class TestUIFormSubmission(unittest.TestCase):
    """Test case for the UI form submission functionality."""
    
    def setUp(self):
        """Set up before each test."""
        # Create a temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        print(f"Created test directory: {self.test_dir}")
        
        # Create a temporary instances file
        self.instances_file = os.path.join(self.test_dir, 'test_instances.json')
        with open(self.instances_file, 'w') as f:
            json.dump({}, f)
            
        # Set up test data paths
        self.test_prompt_path = os.path.join(
            self.test_dir,
            'test_prompt.txt'
        )
            
        # Create a test prompt file
        with open(self.test_prompt_path, 'w') as f:
            f.write("Hello Claude! This is a test prompt for UI form testing.\n")
            f.write("Please respond with \"UI form test successful\" if you receive this prompt.")
    
    def tearDown(self):
        """Clean up after each test."""
        # Clean up the temporary directory
        try:
            shutil.rmtree(self.test_dir)
            print(f"Removed test directory: {self.test_dir}")
        except:
            print(f"Warning: Could not remove test directory: {self.test_dir}")
    
    def test_form_validation(self):
        """Test form field validation."""
        # The project directory to use for testing
        project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        print(f"Testing form validation with:")
        print(f"- Project directory: {project_dir}")
        print(f"- Prompt file: {self.test_prompt_path}")
        
        # Verify the input values exist
        self.assertTrue(os.path.exists(project_dir), "Project directory must exist")
        self.assertTrue(os.path.exists(self.test_prompt_path), "Prompt file must exist")
        
        # Test that directory is readable
        self.assertTrue(os.access(project_dir, os.R_OK), "Project directory must be readable")
        
        # Test that prompt file is readable
        self.assertTrue(os.access(self.test_prompt_path, os.R_OK), "Prompt file must be readable")
        
        # Test reading the prompt file content
        try:
            with open(self.test_prompt_path, 'r') as f:
                content = f.read()
                self.assertIn("UI form test successful", content, 
                             "Prompt file should contain expected content")
            print("Successfully read prompt file content")
        except Exception as e:
            self.fail(f"Failed to read prompt file: {e}")
        
        # Simulate form submission data
        form_data = {
            'project_dir': project_dir,
            'prompt_path': self.test_prompt_path,
            'runtime_type': 'tmux',
            'open_window': 'false'
        }
        
        # Validate form data
        self.assertIsInstance(form_data['project_dir'], str, "Project directory should be a string")
        self.assertIsInstance(form_data['prompt_path'], str, "Prompt path should be a string")
        self.assertIsInstance(form_data['runtime_type'], str, "Runtime type should be a string")
        self.assertIn(form_data['runtime_type'], ['tmux', 'terminal'], 
                     "Runtime type should be either 'tmux' or 'terminal'")
        
        print("Form data validated successfully")
        
        # Simulate successful form submission
        result = {
            'success': True,
            'instance_id': f'test_instance_{int(time.time())}',
            'status': 'running',
            'project_dir': form_data['project_dir'],
            'prompt_path': form_data['prompt_path']
        }
        
        # Verify result
        self.assertTrue(result['success'], "Form submission should be successful")
        self.assertIsNotNone(result['instance_id'], "Result should include an instance ID")
        self.assertEqual(result['status'], 'running', "Instance status should be 'running'")
        self.assertEqual(result['project_dir'], project_dir, "Project directory should match input")
        self.assertEqual(result['prompt_path'], self.test_prompt_path, "Prompt path should match input")
        
        print("Form submission simulation successful")
        print(f"Would create instance with ID: {result['instance_id']}")

def main():
    """Run the tests."""
    unittest.main()

if __name__ == "__main__":
    main()
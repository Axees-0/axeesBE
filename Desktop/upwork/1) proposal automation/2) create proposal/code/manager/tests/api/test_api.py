#!/usr/bin/env python3
"""
Test script for testing the project_dir API endpoint.
"""
import unittest
from unittest.mock import patch, MagicMock

# Import helpers
from tests.helpers import import_module

# Import the app creator
from src.web.app import create_app

class TestProjectDirAPI(unittest.TestCase):
    """Tests for the project_dir API endpoint."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create the Flask app
        self.app = create_app()
        # Create a test client
        self.client = self.app.test_client()
        # Propagate exceptions to the test client
        self.app.config['TESTING'] = True
    
    @patch('src.web.routes.api_routes.find_project_dir_by_id')
    def test_project_dir_api_found(self, mock_find):
        """Test the project_dir API endpoint when directory is found."""
        # Mock the find_project_dir_by_id function to return a known value
        mock_find.return_value = "/path/to/project"
        
        # Call the API endpoint
        response = self.client.get('/api/project_dir/123456789')
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {"project_dir": "/path/to/project"})
        
        # Verify the mock was called correctly
        mock_find.assert_called_once_with("123456789")
    
    @patch('src.web.routes.api_routes.find_project_dir_by_id')
    def test_project_dir_api_not_found(self, mock_find):
        """Test the project_dir API endpoint when directory is not found."""
        # Mock the find_project_dir_by_id function to return None
        mock_find.return_value = None
        
        # Call the API endpoint
        response = self.client.get('/api/project_dir/123456789')
        
        # Check the response
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json, {"error": "Project directory not found"})
        
        # Verify the mock was called correctly
        mock_find.assert_called_once_with("123456789")

def manual_test_project_dir_api(project_id):
    """Manual test function for the project_dir API endpoint."""
    app = create_app()
    
    with app.test_client() as client:
        response = client.get(f'/api/project_dir/{project_id}')
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")

if __name__ == "__main__":
    # If called directly, run the manual test with a default ID
    import sys
    if len(sys.argv) > 1:
        manual_test_project_dir_api(sys.argv[1])
    else:
        # Run the unit tests
        unittest.main()
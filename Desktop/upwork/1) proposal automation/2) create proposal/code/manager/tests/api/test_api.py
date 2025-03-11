#!/usr/bin/env python3
"""
Test script for testing the project_dir API endpoint.
"""

from src.web.app import create_app

def test_project_dir_api(project_id):
    """Test the project_dir API endpoint with the given project ID."""
    app = create_app()
    
    with app.test_client() as client:
        response = client.get(f'/api/project_dir/{project_id}')
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")

if __name__ == "__main__":
    test_project_dir_api("021897455790136661047")
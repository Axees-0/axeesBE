#!/usr/bin/env python3
"""
Test script for the complete workflow between job filtering and Claude Task Manager.
This script simulates approving a job and verifies the Claude instance is created.
"""

import os
import sys
import time
import logging
import json
import requests
import tempfile
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
    ]
)
logger = logging.getLogger("FullWorkflowTest")

# Constants
FILTER_APP_URL = "http://localhost:5090"
CLAUDE_DASHBOARD_URL = "http://localhost:5000"

def test_filter_api():
    """Test that the filter app is running."""
    try:
        response = requests.get(FILTER_APP_URL)
        if response.status_code == 200:
            logger.info("✅ Filter app is running")
            return True
        else:
            logger.error(f"❌ Filter app returned status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        logger.error("❌ Filter app is not running")
        return False

def test_claude_dashboard_api():
    """Test that the Claude dashboard is running."""
    try:
        response = requests.get(CLAUDE_DASHBOARD_URL)
        if response.status_code == 200:
            logger.info("✅ Claude dashboard is running")
            return True
        else:
            logger.error(f"❌ Claude dashboard returned status code {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        logger.error("❌ Claude dashboard is not running")
        return False

def create_test_job_in_spreadsheet():
    """Create a test job in the spreadsheet."""
    # This is a placeholder - in a real test, you would use gspread to create a test job
    # For this test, we'll assume there's already a job in the pipeline
    logger.info("Assuming test job already exists in the spreadsheet")
    return True

def check_for_added_instances(before_count):
    """Check if new Claude instances were added."""
    try:
        # Get the current instances from the Claude dashboard
        response = requests.get(urljoin(CLAUDE_DASHBOARD_URL, "/refresh"))
        if response.status_code != 200:
            logger.error(f"❌ Failed to get instances: {response.status_code}")
            return False
        
        # This is approximate since we don't have a direct API to count instances
        # We're checking if there's evidence of a new instance in the HTML
        instances_html = response.text
        
        # A very rough way to count instances - this could be improved
        if "No instances found" in instances_html:
            after_count = 0
        else:
            # Try to count table rows as an approximation
            after_count = instances_html.count("<tr data-id=")
        
        logger.info(f"Instance count: Before={before_count}, After={after_count}")
        return after_count > before_count
        
    except Exception as e:
        logger.error(f"❌ Error checking for added instances: {e}")
        return False

def get_current_instance_count():
    """Get the current number of Claude instances."""
    try:
        response = requests.get(urljoin(CLAUDE_DASHBOARD_URL, "/refresh"))
        if response.status_code != 200:
            return 0
        
        if "No instances found" in response.text:
            return 0
        else:
            # Count table rows with data-id
            return response.text.count("<tr data-id=")
            
    except:
        return 0

def simulate_job_approval():
    """Simulate a job approval through the filter app."""
    logger.info("Simulating job approval through filter app...")
    
    # Open the filter app
    try:
        # First, try to get a job from the pipeline
        response = requests.get(urljoin(FILTER_APP_URL, "/pipeline"))
        
        if response.status_code != 200:
            logger.error(f"❌ Failed to access pipeline: {response.status_code}")
            return False
        
        # Check if there are jobs to process
        if "No ranked jobs to process" in response.text:
            logger.error("❌ No jobs available to process")
            return False
        
        # Get the job ID and row number from the form
        import re
        job_id_match = re.search(r'name="job_id" value="([^"]+)"', response.text)
        row_number_match = re.search(r'name="row_number" value="(\d+)"', response.text)
        
        if not job_id_match or not row_number_match:
            logger.error("❌ Could not find job_id or row_number in the form")
            return False
        
        job_id = job_id_match.group(1)
        row_number = row_number_match.group(1)
        
        logger.info(f"Found job in pipeline: job_id={job_id}, row_number={row_number}")
        
        # Now complete each dimension until we get to the final step
        dimension_index = 0
        
        while True:
            # Submit "Yes" for the current dimension
            response = requests.post(
                urljoin(FILTER_APP_URL, "/pipeline"),
                data={
                    "row_number": row_number,
                    "dimension_index": dimension_index,
                    "job_id": job_id,
                    "value": "1",  # Yes
                    "reason": "Test reason"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"❌ Failed to submit dimension {dimension_index}: {response.status_code}")
                return False
            
            # Check if we've reached the final step
            if 'name="final_step" value="1"' in response.text:
                logger.info(f"Reached final step - submitting approval")
                
                # Get the current instance count
                before_count = get_current_instance_count()
                logger.info(f"Current instance count before approval: {before_count}")
                
                # Submit the final approval
                response = requests.post(
                    urljoin(FILTER_APP_URL, "/pipeline"),
                    data={
                        "row_number": row_number,
                        "job_id": job_id,
                        "final_step": "1",
                        "value": "1",  # Yes/Approve
                        "reason": "Test approval reason"
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"❌ Failed to submit final approval: {response.status_code}")
                    return False
                
                logger.info("Final approval submitted successfully")
                
                # Wait for the instance to be created
                time.sleep(5)
                
                # Check if a new instance was created
                if check_for_added_instances(before_count):
                    logger.info("✅ New Claude instance was created")
                    return True
                else:
                    logger.error("❌ No new Claude instance was created")
                    return False
                
            # Move to the next dimension
            dimension_index += 1
            
            # Safeguard against infinite loops
            if dimension_index > 10:
                logger.error("❌ Too many dimensions - something is wrong")
                return False
                
    except Exception as e:
        logger.error(f"❌ Error simulating job approval: {e}")
        return False

def main():
    """Main test function."""
    logger.info("Starting full workflow test...")
    
    # Step 1: Make sure both services are running
    logger.info("Step 1: Checking that both services are running")
    if not test_filter_api():
        logger.error("❌ Filter app is not running. Please start it before running this test.")
        return False
        
    if not test_claude_dashboard_api():
        logger.error("❌ Claude dashboard is not running. Please start it before running this test.")
        return False
    
    # Step 2: Verify there's a test job available
    logger.info("Step 2: Checking for test job in the spreadsheet")
    if not create_test_job_in_spreadsheet():
        logger.error("❌ Could not create or find test job in spreadsheet")
        return False
    
    # Step 3: Simulate job approval through the filter app
    logger.info("Step 3: Simulating job approval")
    if not simulate_job_approval():
        logger.error("❌ Job approval simulation failed")
        return False
    
    logger.info("✅ All tests passed successfully. Integration is working correctly.")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
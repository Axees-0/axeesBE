#!/usr/bin/env python3
"""
Test script to diagnose and verify integration between filter listings and Claude Task Manager.
This will simulate the job approval process and check all paths and functionality.
"""

import os
import sys
import time
import logging
import traceback
import re

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
    ]
)
logger = logging.getLogger("IntegrationTest")

# Constants - REAL production paths
MANAGER_DIR = "/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code/manager"
PROMPT_TEMPLATE_PATH = "/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code/prompts/PROMPT_01_UI_DESIGN.txt"
PROPOSALS_DIR = "/Users/Mike/Desktop/upwork/2) proposals"

def check_paths():
    """Check if all required paths exist and are accessible."""
    paths_ok = True
    
    # Check manager directory
    if not os.path.exists(MANAGER_DIR):
        logger.error(f"Manager directory not found: {MANAGER_DIR}")
        paths_ok = False
    else:
        logger.info(f"✅ Manager directory found: {MANAGER_DIR}")
    
    # Check prompt template
    if not os.path.exists(PROMPT_TEMPLATE_PATH):
        logger.error(f"Prompt template not found: {PROMPT_TEMPLATE_PATH}")
        paths_ok = False
    else:
        logger.info(f"✅ Prompt template found: {PROMPT_TEMPLATE_PATH}")
    
    # Check proposals directory
    if not os.path.exists(PROPOSALS_DIR):
        logger.error(f"Proposals directory not found: {PROPOSALS_DIR}")
        paths_ok = False
    else:
        logger.info(f"✅ Proposals directory found: {PROPOSALS_DIR}")
        
    return paths_ok

def check_module_imports():
    """Check if all required modules can be imported."""
    imports_ok = True
    
    # Save original path
    original_path = sys.path.copy()
    
    try:
        # Add manager directory to sys.path
        if MANAGER_DIR not in sys.path:
            sys.path.append(MANAGER_DIR)
            logger.info(f"Added {MANAGER_DIR} to sys.path")
        
        # Try importing ClaudeTaskManager
        try:
            from claude_task_manager import ClaudeTaskManager
            logger.info("✅ Successfully imported ClaudeTaskManager")
            
            # Try initializing the manager
            try:
                manager = ClaudeTaskManager()
                logger.info("✅ Successfully initialized ClaudeTaskManager")
                return manager
            except Exception as e:
                logger.error(f"❌ Failed to initialize ClaudeTaskManager: {e}")
                logger.error(traceback.format_exc())
                imports_ok = False
                
        except ImportError as e:
            logger.error(f"❌ Failed to import ClaudeTaskManager: {e}")
            logger.error(traceback.format_exc())
            imports_ok = False
            
    finally:
        # Restore original path
        sys.path = original_path
    
    return imports_ok

def test_create_proposal_folder():
    """Test creating a proposal folder."""
    # Test job ID
    job_id = f"test_job_{int(time.time())}"
    job_id_sanitized = re.sub(r'[^\w\d-]', '_', job_id)
    
    # Create proposal folder
    proposal_dir = os.path.join(PROPOSALS_DIR, job_id_sanitized)
    
    try:
        os.makedirs(proposal_dir, exist_ok=True)
        logger.info(f"✅ Successfully created proposal directory: {proposal_dir}")
        
        # Test writing to the folder
        test_file_path = os.path.join(proposal_dir, "test_file.txt")
        with open(test_file_path, 'w') as f:
            f.write("Test file content")
        
        if os.path.exists(test_file_path):
            logger.info(f"✅ Successfully wrote test file: {test_file_path}")
        else:
            logger.error(f"❌ Failed to write test file: {test_file_path}")
            return False
        
        return proposal_dir
        
    except Exception as e:
        logger.error(f"❌ Failed to create proposal directory: {e}")
        logger.error(traceback.format_exc())
        return False

def test_integration(manager, proposal_dir):
    """Test full integration by creating a Claude instance."""
    if not manager or not proposal_dir:
        logger.error("Cannot test integration without manager and proposal directory")
        return False
    
    try:
        # Create test prompt file
        prompt_path = os.path.join(proposal_dir, "prompt.txt")
        
        # Load the template
        with open(PROMPT_TEMPLATE_PATH, 'r') as f:
            template_content = f.read()
        
        # Create test prompt content
        prompt_content = f"{template_content}\n\n### TEST JOB DESCRIPTION:\nThis is a test job description."
        
        # Write prompt file
        with open(prompt_path, 'w') as f:
            f.write(prompt_content)
        
        logger.info(f"✅ Created test prompt file: {prompt_path}")
        
        # Start Claude instance
        instance_id = manager.start_instance(
            project_dir=proposal_dir,
            prompt_path=prompt_path,
            use_tmux=True
        )
        
        logger.info(f"✅ Successfully created Claude instance with ID: {instance_id}")
        
        # Verify instance exists in manager's list
        instances = manager.list_instances()
        instance_found = False
        
        for instance in instances:
            if instance['id'] == instance_id:
                instance_found = True
                logger.info(f"✅ Found instance in manager's list: {instance}")
                break
        
        if not instance_found:
            logger.error(f"❌ Instance not found in manager's list. instances: {instances}")
            return False
        
        # Stop the test instance after a few seconds
        time.sleep(3)
        logger.info(f"Stopping test instance: {instance_id}")
        manager.stop_instance(instance_id)
        logger.info(f"✅ Test instance stopped")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Integration test failed: {e}")
        logger.error(traceback.format_exc())
        return False

def fix_filter_listings_integration():
    """Diagnose and fix the integration in the filter_listings.py file."""
    filter_listings_path = "/Users/Mike/Desktop/upwork/1) proposal automation/1) scrape new jobs/4) filter_listings.py"
    
    if not os.path.exists(filter_listings_path):
        logger.error(f"Filter listings file not found: {filter_listings_path}")
        return False
    
    try:
        with open(filter_listings_path, 'r') as f:
            filter_listings_content = f.read()
        
        logger.info(f"✅ Read filter_listings.py file: {len(filter_listings_content)} bytes")
        
        # Check for common issues in the code
        issues = []
        
        # Check if ClaudeTaskManager is properly imported
        if "from claude_task_manager import ClaudeTaskManager" not in filter_listings_content:
            issues.append("ClaudeTaskManager import missing or incorrect")
        
        # Check if sys.path is properly set
        if f'sys.path.append("{MANAGER_DIR}")' not in filter_listings_content and \
           f"sys.path.append('{MANAGER_DIR}')" not in filter_listings_content and \
           f'sys.path.append("/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code/manager")' not in filter_listings_content:
            issues.append("sys.path not properly set for importing ClaudeTaskManager")
        
        # Check if manager.start_instance is called correctly
        if "manager.start_instance(" not in filter_listings_content:
            issues.append("manager.start_instance() not called")
        
        # Check for other potential issues
        if "proposal_dir = " not in filter_listings_content:
            issues.append("proposal_dir variable not set")
        
        if "prompt_path = " not in filter_listings_content:
            issues.append("prompt_path variable not set")
        
        if issues:
            logger.error("Found issues in filter_listings.py:")
            for issue in issues:
                logger.error(f"  - {issue}")
        else:
            logger.info("✅ No obvious issues found in filter_listings.py")
        
        return issues
        
    except Exception as e:
        logger.error(f"❌ Failed to analyze filter_listings.py: {e}")
        logger.error(traceback.format_exc())
        return ["Error analyzing file: " + str(e)]

def main():
    """Main test function."""
    logger.info("Starting integration test...")
    
    # Step 1: Check paths
    logger.info("Step 1: Checking paths...")
    if not check_paths():
        logger.error("❌ Path check failed. Fix path issues before continuing.")
        return False
    
    # Step 2: Check module imports
    logger.info("Step 2: Checking module imports...")
    manager = check_module_imports()
    if not manager:
        logger.error("❌ Module import check failed. Fix import issues before continuing.")
        return False
    
    # Step 3: Test creating proposal folder
    logger.info("Step 3: Testing proposal folder creation...")
    proposal_dir = test_create_proposal_folder()
    if not proposal_dir:
        logger.error("❌ Proposal folder creation failed. Fix folder creation issues before continuing.")
        return False
    
    # Step 4: Test full integration
    logger.info("Step 4: Testing full integration...")
    if not test_integration(manager, proposal_dir):
        logger.error("❌ Integration test failed. Check logs for more details.")
        
        # Step 5: Diagnose filter_listings.py
        logger.info("Step 5: Diagnosing filter_listings.py...")
        issues = fix_filter_listings_integration()
        
        if issues:
            logger.error("Issues found in filter_listings.py that may be causing the integration failure.")
            logger.error("Please fix these issues and try again.")
        
        return False
    
    logger.info("✅ All tests passed successfully. Integration should be working correctly.")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
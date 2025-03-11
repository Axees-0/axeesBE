#!/usr/bin/env python3
"""
Diagnostic tool to fix the integration between filter_listings.py and claude_task_manager.py.
This script identifies integration issues and provides solutions.
"""

import os
import sys
import subprocess
import time
import json
import datetime
import logging
import re
import glob
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('fix_integration.log')
    ]
)
logger = logging.getLogger("IntegrationFixer")

# Paths
FILTER_PATH = "/Users/Mike/Desktop/upwork/1) proposal automation/1) scrape new jobs/4) filter_listings.py"
MANAGER_DIR = "/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code/manager"
PROMPT_TEMPLATE_PATH = "/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code/prompts/PROMPT_01_UI_DESIGN.txt"
PROPOSALS_DIR = "/Users/Mike/Desktop/upwork/2) proposals"

def check_paths():
    """Check if all required paths exist and are accessible."""
    paths_ok = True
    
    # Check manager directory
    if not os.path.exists(MANAGER_DIR):
        logger.error(f"❌ Manager directory not found: {MANAGER_DIR}")
        paths_ok = False
    else:
        logger.info(f"✅ Manager directory found: {MANAGER_DIR}")
    
    # Check filter_listings.py
    if not os.path.exists(FILTER_PATH):
        logger.error(f"❌ Filter script not found: {FILTER_PATH}")
        paths_ok = False
    else:
        logger.info(f"✅ Filter script found: {FILTER_PATH}")
    
    # Check prompt template
    if not os.path.exists(PROMPT_TEMPLATE_PATH):
        logger.error(f"❌ Prompt template not found: {PROMPT_TEMPLATE_PATH}")
        paths_ok = False
    else:
        logger.info(f"✅ Prompt template found: {PROMPT_TEMPLATE_PATH}")
    
    # Check proposals directory
    if not os.path.exists(PROPOSALS_DIR):
        logger.warning(f"⚠️ Proposals directory not found: {PROPOSALS_DIR}")
        try:
            logger.info(f"Creating proposals directory at: {PROPOSALS_DIR}")
            os.makedirs(PROPOSALS_DIR, exist_ok=True)
            if os.path.exists(PROPOSALS_DIR):
                logger.info(f"✅ Successfully created proposals directory")
                paths_ok = True
            else:
                logger.error(f"❌ Failed to create proposals directory")
                paths_ok = False
        except Exception as e:
            logger.error(f"❌ Error creating proposals directory: {e}")
            paths_ok = False
    else:
        logger.info(f"✅ Proposals directory found: {PROPOSALS_DIR}")
        
    return paths_ok

def verify_requirements():
    """Check if required modules are installed."""
    required_modules = ["flask", "requests"]
    missing_modules = []
    
    for module in required_modules:
        try:
            __import__(module)
            logger.info(f"✅ Module '{module}' is installed")
        except ImportError:
            logger.error(f"❌ Module '{module}' is not installed")
            missing_modules.append(module)
    
    if missing_modules:
        logger.info("Installing missing modules...")
        for module in missing_modules:
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", module], check=True)
                logger.info(f"✅ Installed module '{module}'")
            except Exception as e:
                logger.error(f"❌ Failed to install module '{module}': {e}")
                return False
    
    return True

def test_claude_task_manager():
    """Test the Claude Task Manager functionality."""
    try:
        # Add manager directory to sys.path
        if MANAGER_DIR not in sys.path:
            sys.path.append(MANAGER_DIR)
            logger.info(f"Added {MANAGER_DIR} to sys.path")
        
        # Try importing ClaudeTaskManager
        from src.claude_task_manager import ClaudeTaskManager
        logger.info("✅ Successfully imported ClaudeTaskManager")
        
        # Try initializing the manager
        try:
            manager = ClaudeTaskManager()
            logger.info("✅ Successfully initialized ClaudeTaskManager")
            
            # Check if we can list instances
            instances = manager.list_instances()
            logger.info(f"✅ Found {len(instances)} existing Claude instances")
            
            # Test the manager directly
            test_dir = os.path.join(PROPOSALS_DIR, f"test_integration_{int(time.time())}")
            os.makedirs(test_dir, exist_ok=True)
            
            # Create a test prompt file
            test_prompt_path = os.path.join(test_dir, "prompt.txt")
            with open(test_prompt_path, "w") as f:
                f.write("This is a test prompt for integration testing.\n\nPlease create a simple text file to verify Claude is working correctly.")
            
            logger.info(f"Created test directory: {test_dir}")
            logger.info(f"Created test prompt file: {test_prompt_path}")
            
            # Ask if user wants to create a real instance for testing
            if input("Would you like to create a real Claude instance to test the Task Manager? (y/n): ").lower() == 'y':
                logger.info("Creating a test Claude instance...")
                instance_id = manager.start_instance(
                    project_dir=test_dir,
                    prompt_path=test_prompt_path,
                    use_tmux=True
                )
                
                logger.info(f"✅ Successfully created test instance: {instance_id}")
                logger.info(f"Waiting 5 seconds before stopping the test instance...")
                time.sleep(5)
                
                # Stop the instance
                success = manager.stop_instance(instance_id)
                if success:
                    logger.info(f"✅ Successfully stopped test instance: {instance_id}")
                else:
                    logger.error(f"❌ Failed to stop test instance: {instance_id}")
            else:
                logger.info("Skipping creation of test instance")
            
            return True, manager
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize ClaudeTaskManager: {e}")
            logger.error(f"Error details: {str(e)}")
            return False, None
            
    except ImportError as e:
        logger.error(f"❌ Failed to import ClaudeTaskManager: {e}")
        return False, None

def check_filter_integration():
    """Check if filter_listings.py is correctly set up for integration."""
    if not os.path.exists(FILTER_PATH):
        logger.error(f"Filter file not found: {FILTER_PATH}")
        return False
    
    try:
        with open(FILTER_PATH, 'r') as f:
            filter_content = f.read()
        
        logger.info(f"Read filter_listings.py file: {len(filter_content)} bytes")
        
        issues = []
        
        # Check for essential imports
        if "sys.path.append" not in filter_content or MANAGER_DIR not in filter_content:
            issues.append("❌ Missing sys.path.append for importing Claude Task Manager")
        else:
            logger.info("✅ Found sys.path.append for importing Claude Task Manager")
        
        if "from src.claude_task_manager import ClaudeTaskManager" not in filter_content:
            issues.append("❌ Missing import of ClaudeTaskManager")
        else:
            logger.info("✅ Found import of ClaudeTaskManager")
        
        # Check for initialization of task manager
        if "ClaudeTaskManager()" not in filter_content:
            issues.append("❌ Missing initialization of ClaudeTaskManager")
        else:
            logger.info("✅ Found initialization of ClaudeTaskManager")
        
        # Check for manager.start_instance calls
        if "manager.start_instance" not in filter_content:
            issues.append("❌ Missing manager.start_instance call")
        else:
            logger.info("✅ Found manager.start_instance call")
        
        # Check for proposal directory creation
        if "proposals_base_dir" not in filter_content or PROPOSALS_DIR not in filter_content:
            issues.append("❌ Missing or incorrect proposals directory path")
        else:
            logger.info("✅ Found correct proposals directory path")
        
        if issues:
            logger.error("Found issues in filter_listings.py:")
            for issue in issues:
                logger.error(f"  {issue}")
            return False, issues
        else:
            logger.info("✅ No integration issues found in filter_listings.py")
            return True, []
        
    except Exception as e:
        logger.error(f"❌ Failed to analyze filter_listings.py: {e}")
        return False, [f"Error analyzing file: {str(e)}"]

def patch_filter_file(issues):
    """Attempt to patch the filter_listings.py file to fix integration issues."""
    if not issues:
        logger.info("No issues to fix.")
        return True
    
    try:
        with open(FILTER_PATH, 'r') as f:
            filter_content = f.read()
        
        # Create a backup of the original file
        backup_path = f"{FILTER_PATH}.bak_{int(time.time())}"
        with open(backup_path, 'w') as f:
            f.write(filter_content)
        logger.info(f"Created backup of filter_listings.py at: {backup_path}")
        
        # Apply patches based on identified issues
        for issue in issues:
            if "sys.path.append" in issue:
                # Add sys.path.append if missing
                import_line = f"import sys\n"
                path_line = f'sys.path.append("{MANAGER_DIR}")\n'
                
                if "import sys" not in filter_content:
                    # Add import sys if missing
                    filter_content = import_line + filter_content
                
                # Add sys.path.append after import statements
                import_section_end = filter_content.find("\n\n", filter_content.find("import"))
                if import_section_end != -1:
                    filter_content = filter_content[:import_section_end] + f"\n{path_line}" + filter_content[import_section_end:]
                else:
                    # Fallback - add to top of file
                    filter_content = path_line + filter_content
                
                logger.info("✅ Added sys.path.append for Claude Task Manager")
            
            if "import of ClaudeTaskManager" in issue:
                # Add import for ClaudeTaskManager
                import_line = "from src.claude_task_manager import ClaudeTaskManager\n"
                
                # Find a good place to add it - after other imports
                import_section_end = filter_content.find("\n\n", filter_content.find("import"))
                if import_section_end != -1:
                    filter_content = filter_content[:import_section_end] + f"\n{import_line}" + filter_content[import_section_end:]
                else:
                    # Fallback - add to top of file
                    filter_content = import_line + filter_content
                
                logger.info("✅ Added import of ClaudeTaskManager")
            
            if "initialization of ClaudeTaskManager" in issue:
                # Add initialization code
                init_code = """
# Initialize Claude Task Manager
try:
    task_manager = ClaudeTaskManager()
    print("✅ Claude Task Manager initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize Claude Task Manager: {e}")
"""
                # Find a good place to add it - after imports but before app definition
                app_def = filter_content.find("app = Flask")
                if app_def != -1:
                    # Find the line break before app definition
                    prev_break = filter_content.rfind("\n\n", 0, app_def)
                    if prev_break != -1:
                        filter_content = filter_content[:prev_break] + init_code + filter_content[prev_break:]
                    else:
                        # Fallback - add right before app definition
                        filter_content = filter_content[:app_def] + init_code + filter_content[app_def:]
                else:
                    # Fallback - add after imports
                    import_section_end = filter_content.find("\n\n", filter_content.find("import"))
                    if import_section_end != -1:
                        filter_content = filter_content[:import_section_end] + init_code + filter_content[import_section_end:]
                    else:
                        # Last resort - add to top
                        filter_content = init_code + filter_content
                
                logger.info("✅ Added initialization of ClaudeTaskManager")
            
            if "manager.start_instance call" in issue:
                # This requires more careful handling - we need to find where the proposal creation happens
                # Since this is a complex change, we'll add a placeholder comment and instruct manual editing
                comment = """
# TODO: Add Claude Task Manager integration here
# Example:
# instance_id = task_manager.start_instance(
#     project_dir=proposal_dir,
#     prompt_path=combined_prompt_path,
#     use_tmux=True
# )
# print(f"✅ Created Claude instance {instance_id} for job {job_id}")
"""
                # Try to find a good insertion point - after prompt creation
                create_prompt_pos = filter_content.find("combined_prompt =")
                if create_prompt_pos == -1:
                    create_prompt_pos = filter_content.find("prompt_path")
                
                if create_prompt_pos != -1:
                    # Find the next paragraph break
                    next_break = filter_content.find("\n\n", create_prompt_pos)
                    if next_break != -1:
                        filter_content = filter_content[:next_break] + comment + filter_content[next_break:]
                    else:
                        # Fallback - add at end of file
                        filter_content += comment
                else:
                    # Can't find a good place, add at end of file
                    filter_content += comment
                
                logger.info("⚠️ Added placeholder for manager.start_instance call - manual editing required")
            
            if "proposals directory" in issue:
                # Add correct proposals directory path
                dir_code = f'proposals_base_dir = "{PROPOSALS_DIR}"\n'
                
                # Find where project directories are set
                dir_pos = filter_content.find("proposal_dir = ")
                if dir_pos == -1:
                    dir_pos = filter_content.find("proj_dir = ")
                
                if dir_pos != -1:
                    # Find the line start
                    line_start = filter_content.rfind("\n", 0, dir_pos) + 1
                    # Find the line end
                    line_end = filter_content.find("\n", dir_pos)
                    
                    # Replace the line
                    filter_content = filter_content[:line_start] + dir_code + filter_content[line_end:]
                    
                    logger.info("✅ Fixed proposals directory path")
                else:
                    logger.warning("⚠️ Could not find a good place to fix proposals directory path")
        
        # Write the patched file
        with open(FILTER_PATH, 'w') as f:
            f.write(filter_content)
        
        logger.info("✅ Successfully patched filter_listings.py")
        logger.info(f"Original file is backed up at: {backup_path}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to patch filter_listings.py: {e}")
        return False

def test_claude_dashboard():
    """Test if the Claude dashboard is running and accessible."""
    dashboard_url = "http://localhost:5000"
    
    try:
        import requests
        try:
            response = requests.get(dashboard_url, timeout=2)
            if response.status_code == 200:
                logger.info(f"✅ Claude dashboard is running at {dashboard_url}")
                return True
            else:
                logger.warning(f"⚠️ Claude dashboard returned status code {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            logger.warning(f"⚠️ Claude dashboard is not running at {dashboard_url}")
            
            # Ask if user wants to start the dashboard
            if input("Would you like to start the Claude dashboard? (y/n): ").lower() == 'y':
                try:
                    dashboard_script = os.path.join(MANAGER_DIR, "start_dashboard.py")
                    if os.path.exists(dashboard_script):
                        subprocess.Popen([sys.executable, dashboard_script], 
                                       stdout=subprocess.PIPE, 
                                       stderr=subprocess.PIPE)
                        logger.info(f"Started Claude dashboard. It should open in your browser shortly.")
                        time.sleep(2)
                        return True
                    else:
                        logger.error(f"❌ Dashboard script not found: {dashboard_script}")
                        return False
                except Exception as e:
                    logger.error(f"❌ Failed to start Claude dashboard: {e}")
                    return False
            else:
                return False
    except ImportError:
        logger.error("❌ requests module not installed. Cannot test dashboard.")
        return False

def create_test_job():
    """Create a test job for testing the integration."""
    test_job = {
        "id": f"test_job_{int(time.time())}",
        "title": "Test Integration Job",
        "description": "This is a test job for testing the integration between filter_listings.py and claude_task_manager.py.",
        "proposal_url": "https://example.com/proposal",
        "budget": "$100-500",
        "type": "Fixed-price",
        "skills": "Python, Flask, Web Development",
        "client": {
            "rating": 4.9,
            "reviews": 25,
            "country": "United States"
        }
    }
    
    # Create a JSON file for the test job
    test_job_dir = os.path.join(PROPOSALS_DIR, test_job["id"])
    os.makedirs(test_job_dir, exist_ok=True)
    
    test_job_path = os.path.join(test_job_dir, "job.json")
    with open(test_job_path, "w") as f:
        json.dump(test_job, f, indent=2)
    
    # Create a prompt file
    prompt_path = os.path.join(test_job_dir, "prompt.txt")
    
    # First, get the prompt template
    if os.path.exists(PROMPT_TEMPLATE_PATH):
        with open(PROMPT_TEMPLATE_PATH, "r") as f:
            prompt_template = f.read()
    else:
        prompt_template = "# Test Prompt Template\n\nPlease write a proposal for the following job:\n\n"
    
    # Create the job context section
    job_context = f"""
### JOB DETAILS:
**Title:** {test_job["title"]}
**Type:** {test_job["type"]}
**Budget:** {test_job["budget"]}
**Skills:** {test_job["skills"]}

### CLIENT:
**Rating:** {test_job["client"]["rating"]}
**Reviews:** {test_job["client"]["reviews"]}
**Country:** {test_job["client"]["country"]}

### JOB DESCRIPTION:
{test_job["description"]}
"""
    
    # Combine prompt with job description
    combined_prompt = f"{prompt_template}\n\n{job_context}"
    
    # Write to the prompt file
    with open(prompt_path, "w") as f:
        f.write(combined_prompt)
    
    logger.info(f"✅ Created test job directory: {test_job_dir}")
    logger.info(f"✅ Created test job file: {test_job_path}")
    logger.info(f"✅ Created test prompt file: {prompt_path}")
    
    return test_job_dir, prompt_path, test_job["id"]

def test_direct_integration(manager=None):
    """Test direct integration without going through filter_listings.py."""
    if not manager:
        if MANAGER_DIR not in sys.path:
            sys.path.append(MANAGER_DIR)
        
        try:
            from src.claude_task_manager import ClaudeTaskManager
            manager = ClaudeTaskManager()
        except Exception as e:
            logger.error(f"❌ Failed to initialize ClaudeTaskManager: {e}")
            return False, None
    
    # Create a test job
    test_dir, prompt_path, job_id = create_test_job()
    
    # Try to create an instance directly
    try:
        logger.info(f"Creating Claude instance for test job {job_id}...")
        instance_id = manager.start_instance(
            project_dir=test_dir,
            prompt_path=prompt_path,
            use_tmux=True
        )
        
        logger.info(f"✅ Successfully created Claude instance: {instance_id}")
        
        # Wait for a few seconds
        logger.info(f"Waiting 5 seconds to see if instance starts correctly...")
        time.sleep(5)
        
        # Check if the instance is in the manager's list
        instances = manager.list_instances()
        found = False
        for instance in instances:
            if instance["id"] == instance_id:
                logger.info(f"✅ Found instance in manager's list: {instance}")
                found = True
                break
        
        if not found:
            logger.error(f"❌ Instance not found in manager's list after creation")
            return False, None
        
        # Ask if the user wants to stop the test instance
        if input(f"Test instance {instance_id} is running. Do you want to stop it? (y/n): ").lower() == 'y':
            success = manager.stop_instance(instance_id)
            if success:
                logger.info(f"✅ Successfully stopped test instance: {instance_id}")
            else:
                logger.error(f"❌ Failed to stop test instance: {instance_id}")
        
        return True, instance_id
        
    except Exception as e:
        logger.error(f"❌ Failed to create Claude instance: {e}")
        return False, None

def fix_all_issues():
    """Run all checks and apply fixes."""
    print("\n===== Claude Integration Fixer =====")
    print("This tool will check and fix integration issues between filter_listings.py and claude_task_manager.py.")
    
    # Check paths
    print("\n=== Checking Paths ===")
    paths_ok = check_paths()
    
    # Check requirements
    print("\n=== Checking Requirements ===")
    reqs_ok = verify_requirements()
    
    # Test Claude Task Manager
    print("\n=== Testing Claude Task Manager ===")
    manager_ok, manager = test_claude_task_manager()
    
    # Check filter integration
    print("\n=== Checking Filter Integration ===")
    filter_ok, issues = check_filter_integration()
    
    # Test Claude Dashboard
    print("\n=== Testing Claude Dashboard ===")
    dashboard_ok = test_claude_dashboard()
    
    # Test direct integration
    print("\n=== Testing Direct Integration ===")
    if manager_ok:
        integration_ok, instance_id = test_direct_integration(manager)
    else:
        integration_ok = False
        instance_id = None
    
    # If there are issues and the user wants to fix them
    if not filter_ok and issues:
        print("\n=== Fixing Integration Issues ===")
        if input("Would you like to automatically patch filter_listings.py? (y/n): ").lower() == 'y':
            patch_ok = patch_filter_file(issues)
            if patch_ok:
                logger.info("✅ Successfully patched filter_listings.py")
            else:
                logger.error("❌ Failed to patch filter_listings.py")
    
    # Summary
    print("\n=== Summary ===")
    print(f"Paths: {'✅ OK' if paths_ok else '❌ Issues found'}")
    print(f"Requirements: {'✅ OK' if reqs_ok else '❌ Issues found'}")
    print(f"Claude Task Manager: {'✅ OK' if manager_ok else '❌ Issues found'}")
    print(f"Filter Integration: {'✅ OK' if filter_ok else '❌ Issues found'}")
    print(f"Claude Dashboard: {'✅ OK' if dashboard_ok else '❌ Issues found'}")
    print(f"Direct Integration: {'✅ OK' if integration_ok else '❌ Issues found'}")
    
    # Recommendations
    print("\n=== Recommendations ===")
    if not paths_ok:
        print("❌ Fix missing paths before continuing.")
    
    if not reqs_ok:
        print("❌ Install missing Python modules: flask, requests.")
    
    if not manager_ok:
        print("❌ Fix Claude Task Manager issues:")
        print("  - Check that claude_monitor.py and claude_monitor_direct.py exist")
        print("  - Ensure all required imports are available")
    
    if not filter_ok:
        print("❌ Fix filter_listings.py integration issues:")
        for issue in issues:
            print(f"  - {issue}")
    
    if not dashboard_ok:
        print("❌ Start the Claude Dashboard:")
        print(f"  - Run: python {os.path.join(MANAGER_DIR, 'start_dashboard.py')}")
    
    if not integration_ok:
        print("❌ Fix direct integration issues:")
        print("  - Make sure tmux is installed and running")
        print("  - Check the error messages in the log")
    
    if paths_ok and reqs_ok and manager_ok and filter_ok and dashboard_ok and integration_ok:
        print("✅ All checks passed! The integration should be working correctly.")
    
    return paths_ok and reqs_ok and manager_ok and filter_ok and dashboard_ok and integration_ok

if __name__ == "__main__":
    fix_all_issues()
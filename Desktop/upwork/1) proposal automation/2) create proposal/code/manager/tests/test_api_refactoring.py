#!/usr/bin/env python3
"""
This file tests the refactored API for the Claude Task Manager,
specifically focusing on the transition from use_tmux to runtime_type.
"""

import os
import sys
import time
import tempfile
import argparse
from src.claude_task_manager import ClaudeTaskManager

# Import the new RuntimeType enum 
try:
    from src.core.models.instance import RuntimeType
    HAS_RUNTIME_TYPE = True
except ImportError:
    # Define a simple enum-like class for compatibility
    class RuntimeType:
        TMUX = "tmux"
        TERMINAL = "terminal"
    HAS_RUNTIME_TYPE = False

def test_legacy_api():
    """Test using the legacy API with use_tmux parameter."""
    print("\n--- Testing Legacy API (use_tmux) ---")
    
    # Create a task manager
    manager = ClaudeTaskManager()
    
    # Create a temporary project directory and prompt file
    with tempfile.TemporaryDirectory() as project_dir:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as prompt_file:
            prompt_file.write("Test prompt using legacy API (use_tmux=True)")
            prompt_path = prompt_file.name
            
        try:
            # Start instance with legacy API
            instance_id = manager.start_instance(
                project_dir=project_dir,
                prompt_path=prompt_path,
                use_tmux=True,
                open_terminal=False
            )
            
            print(f"Created instance {instance_id} with legacy API")
            
            # Get instance details
            instances = manager.list_instances()
            instance = next((i for i in instances if i['id'] == instance_id), None)
            
            if instance:
                print(f"Instance details:")
                print(f"  ID: {instance['id']}")
                print(f"  Status: {instance['status']}")
                print(f"  Use tmux: {instance.get('use_tmux', 'N/A')}")
                print(f"  Runtime type: {instance.get('runtime_type', 'N/A')}")
                print(f"  Runtime type display: {instance.get('runtime_type_display', 'N/A')}")
                
                # Stop the instance
                manager.stop_instance(instance_id)
                print(f"Stopped instance {instance_id}")
                
                return True
            else:
                print(f"ERROR: Instance {instance_id} not found in list_instances()")
                return False
                
        except Exception as e:
            print(f"ERROR: {e}")
            return False
        finally:
            # Clean up
            os.unlink(prompt_path)

def test_modern_api():
    """Test using the modern API with runtime_type parameter."""
    print("\n--- Testing Modern API (runtime_type) ---")
    
    # Skip if RuntimeType enum isn't available
    if not HAS_RUNTIME_TYPE:
        print("WARNING: RuntimeType enum not available, skipping modern API test")
        return None
    
    # Create a task manager
    manager = ClaudeTaskManager()
    
    # Create a temporary project directory and prompt file
    with tempfile.TemporaryDirectory() as project_dir:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as prompt_file:
            prompt_file.write("Test prompt using modern API (runtime_type=TMUX)")
            prompt_path = prompt_file.name
            
        try:
            # Start instance with modern API
            instance_id = manager.start_instance(
                project_dir=project_dir,
                prompt_path=prompt_path,
                runtime_type=RuntimeType.TMUX,
                open_terminal=False
            )
            
            print(f"Created instance {instance_id} with modern API")
            
            # Get instance details
            instances = manager.list_instances()
            instance = next((i for i in instances if i['id'] == instance_id), None)
            
            if instance:
                print(f"Instance details:")
                print(f"  ID: {instance['id']}")
                print(f"  Status: {instance['status']}")
                print(f"  Use tmux: {instance.get('use_tmux', 'N/A')}")
                print(f"  Runtime type: {instance.get('runtime_type', 'N/A')}")
                print(f"  Runtime type display: {instance.get('runtime_type_display', 'N/A')}")
                
                # Stop the instance
                manager.stop_instance(instance_id)
                print(f"Stopped instance {instance_id}")
                
                return True
            else:
                print(f"ERROR: Instance {instance_id} not found in list_instances()")
                return False
                
        except Exception as e:
            print(f"ERROR: {e}")
            return False
        finally:
            # Clean up
            os.unlink(prompt_path)

def main():
    """Run API tests."""
    parser = argparse.ArgumentParser(description='Test Claude Task Manager API refactoring')
    parser.add_argument('--legacy', action='store_true', help='Test legacy API only')
    parser.add_argument('--modern', action='store_true', help='Test modern API only')
    args = parser.parse_args()
    
    legacy_result = None
    modern_result = None
    
    if args.legacy or not (args.legacy or args.modern):
        legacy_result = test_legacy_api()
        
    if args.modern or not (args.legacy or args.modern):
        modern_result = test_modern_api()
    
    print("\n--- Test Results ---")
    if legacy_result is not None:
        print(f"Legacy API test: {'PASSED' if legacy_result else 'FAILED'}")
    if modern_result is not None:
        print(f"Modern API test: {'PASSED' if modern_result else 'FAILED'}")
        
    # Calculate exit code
    if (legacy_result is False) or (modern_result is False):
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
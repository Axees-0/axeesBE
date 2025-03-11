#!/usr/bin/env python3
"""
Test runner for all monitoring-related tests.

This script runs all the tests for the monitoring functionality:
1. Basic monitoring tests (test_monitoring.py)
2. Real-time monitoring tests (test_real_monitoring.py)
3. Full integration tests (test_full_monitoring_integration.py)

It provides a summary of results for each test suite.
"""

import os
import sys
import unittest
import subprocess
import time
import argparse
from datetime import datetime


def run_tests(test_modules, verbosity=2, include_long_tests=False):
    """Run specified test modules and return results."""
    results = {}
    
    # Set environment variable for long tests if needed
    if include_long_tests:
        os.environ['RUN_LONG_TESTS'] = '1'
    else:
        os.environ.pop('RUN_LONG_TESTS', None)
    
    # Set environment variable for real environment tests
    # Only enable if explicitly running as root to avoid permission issues
    if os.geteuid() == 0:
        os.environ['RUN_REAL_ENVIRONMENT_TESTS'] = '1'
    else:
        os.environ.pop('RUN_REAL_ENVIRONMENT_TESTS', None)
    
    # Set environment variable for dashboard tests
    os.environ['RUN_DASHBOARD_TESTS'] = '1'
    
    # Add the parent directory to the path to allow imports
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    for module_name in test_modules:
        print(f"\n{'='*80}")
        print(f"Running tests from {module_name}")
        print(f"{'='*80}")
        
        try:
            # Import the module dynamically
            module = __import__(module_name)
            
            # Create a test suite from the module
            suite = unittest.defaultTestLoader.loadTestsFromModule(module)
            
            # Run the tests
            runner = unittest.TextTestRunner(verbosity=verbosity)
            result = runner.run(suite)
            
            # Store results
            results[module_name] = {
                'total': result.testsRun,
                'failures': len(result.failures),
                'errors': len(result.errors),
                'skipped': len(result.skipped),
                'success': result.wasSuccessful()
            }
            
        except ImportError as e:
            print(f"Error importing module {module_name}: {e}")
            results[module_name] = {
                'total': 0,
                'failures': 0,
                'errors': 1,
                'skipped': 0,
                'success': False,
                'import_error': str(e)
            }
        except Exception as e:
            print(f"Error running tests in module {module_name}: {e}")
            results[module_name] = {
                'total': 0,
                'failures': 0,
                'errors': 1,
                'skipped': 0,
                'success': False,
                'error': str(e)
            }
    
    return results


def check_tmux_availability():
    """Check if tmux is available on the system."""
    try:
        result = subprocess.run(['tmux', '-V'], capture_output=True)
        return result.returncode == 0
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


def print_summary(results):
    """Print a summary of test results."""
    print("\n")
    print(f"{'='*80}")
    print(f"TEST SUMMARY")
    print(f"{'='*80}")
    print(f"{'Module':<40} {'Status':<10} {'Total':<6} {'Pass':<6} {'Fail':<6} {'Error':<6} {'Skip':<6}")
    print(f"{'-'*80}")
    
    total_tests = 0
    total_failures = 0
    total_errors = 0
    total_skipped = 0
    all_success = True
    
    for module_name, result in results.items():
        status = "PASS" if result['success'] else "FAIL"
        passed = result['total'] - result['failures'] - result['errors'] - result['skipped']
        
        print(f"{module_name:<40} {status:<10} {result['total']:<6} {passed:<6} {result['failures']:<6} {result['errors']:<6} {result['skipped']:<6}")
        
        total_tests += result['total']
        total_failures += result['failures']
        total_errors += result['errors']
        total_skipped += result['skipped']
        all_success = all_success and result['success']
    
    print(f"{'-'*80}")
    total_passed = total_tests - total_failures - total_errors - total_skipped
    overall_status = "PASS" if all_success else "FAIL"
    print(f"{'OVERALL':<40} {overall_status:<10} {total_tests:<6} {total_passed:<6} {total_failures:<6} {total_errors:<6} {total_skipped:<6}")
    print(f"{'='*80}")
    
    # Return overall success status for exit code
    return all_success


def main():
    """Main function to parse arguments and run tests."""
    parser = argparse.ArgumentParser(description='Run monitoring tests for Claude Task Manager')
    parser.add_argument('-v', '--verbose', action='store_true', help='Increase output verbosity')
    parser.add_argument('-q', '--quiet', action='store_true', help='Reduce output verbosity')
    parser.add_argument('-b', '--basic', action='store_true', help='Run only basic monitoring tests')
    parser.add_argument('-r', '--real', action='store_true', help='Run only real-time monitoring tests')
    parser.add_argument('-i', '--integration', action='store_true', help='Run only integration tests')
    parser.add_argument('-l', '--long', action='store_true', help='Include long-running tests')
    parser.add_argument('-f', '--fail-fast', action='store_true', help='Stop on first test failure')
    
    args = parser.parse_args()
    
    # Set verbosity
    verbosity = 2  # Default
    if args.verbose:
        verbosity = 3
    elif args.quiet:
        verbosity = 1
    
    # Check tmux availability
    tmux_available = check_tmux_availability()
    if not tmux_available:
        print("\nWARNING: tmux is not available on this system.")
        print("Most monitoring tests require tmux and will be skipped.")
        print("Install tmux before running these tests for complete coverage.")
    
    # Determine which test modules to run
    test_modules = []
    
    if args.basic or (not args.basic and not args.real and not args.integration):
        test_modules.append('test_monitoring')
    
    if (args.real or args.integration) or (not args.basic and not args.real and not args.integration):
        if tmux_available:
            if args.real or (not args.basic and not args.real and not args.integration):
                test_modules.append('test_real_monitoring')
            
            if args.integration or (not args.basic and not args.real and not args.integration):
                test_modules.append('test_full_monitoring_integration')
        else:
            print("\nSkipping real-time and integration tests due to missing tmux.")
    
    # Run the tests
    print(f"\nRunning monitoring tests at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"tmux availability: {'Yes' if tmux_available else 'No'}")
    
    results = run_tests(test_modules, verbosity=verbosity, include_long_tests=args.long)
    
    # Print summary
    all_success = print_summary(results)
    
    # Return exit code based on test results
    return 0 if all_success else 1


if __name__ == '__main__':
    sys.exit(main())
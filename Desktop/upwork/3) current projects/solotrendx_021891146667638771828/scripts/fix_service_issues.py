#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Service Issue Detection and Correction Tool for SoloTrend X system.

This script implements an iterative loop to:
1. Start all services
2. Log output
3. Check output for bugs
4. Adjust code
5. Repeat until all bugs are fixed

It follows best practices for maintainability and stability.
"""

import os
import sys
import time
import subprocess
import logging
import signal
import requests
import json
from pathlib import Path
import threading
import queue
import re
import shutil
import argparse
import tempfile
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("service_fixes.log")
    ]
)
logger = logging.getLogger(__name__)

# Get project root
project_root = Path(__file__).resolve().parents[1]
logger.info(f"Project root: {project_root}")

# Service definitions
SERVICES = {
    "mt4_rest_api": {
        "name": "MT4 REST API",
        "main_file": "src/backend/MT4RestfulAPIWrapper/mt4_rest_api_implementation.py",
        "startup_command": [
            sys.executable,
            "{main_file}"
        ],
        "env": {
            "PYTHONPATH": "{project_root}",
            "USE_MOCK_MODE": "true",
            "PORT": "5002"
        },
        "health_url": "http://localhost:5002/api/health",
        "port": 5002,
        "log_file": "data/logs/mt4_rest_api_debug.log",
        "dependencies": [],
        "expected_patterns": [
            r"Running on http://[0-9.:]+:5002",
            r"MT4_SERVER: \w+"
        ],
        "error_patterns": [
            r"ImportError",
            r"ModuleNotFoundError",
            r"SyntaxError",
            r"IndentationError",
            r"AttributeError",
            r"TypeError",
            r"ValueError",
            r"Exception"
        ],
        "common_fixes": {
            r"ImportError.*mt4_api": {
                "description": "Fix import of mt4_api module",
                "action": "fix_mt4_api_import"
            },
            r"Address already in use": {
                "description": "Port 5002 is already in use",
                "action": "kill_process_on_port",
                "args": [5002]
            }
        }
    },
    "webhook_api": {
        "name": "Webhook API",
        "main_file": "src/backend/webhook_api/run_server.py",
        "startup_command": [
            sys.executable,
            "{main_file}"
        ],
        "env": {
            "PYTHONPATH": "{project_root}",
            "WEBHOOK_API_PORT": "5003",
            "TELEGRAM_WEBHOOK_URL": "http://localhost:5001/webhook",
            "MOCK_MODE": "True"
        },
        "health_url": "http://localhost:5003/health",
        "port": 5003,
        "log_file": "data/logs/webhook_api_debug.log",
        "dependencies": [],
        "expected_patterns": [
            r"Running on http://[0-9.:]+:5003",
            r"Starting Webhook API Server"
        ],
        "error_patterns": [
            r"ImportError",
            r"ModuleNotFoundError",
            r"SyntaxError",
            r"IndentationError",
            r"AttributeError",
            r"TypeError",
            r"ValueError",
            r"Exception"
        ],
        "common_fixes": {
            r"ImportError.*webhook_api.app": {
                "description": "Fix import of webhook_api.app module",
                "action": "fix_webhook_app_import"
            },
            r"Address already in use": {
                "description": "Port 5003 is already in use",
                "action": "kill_process_on_port",
                "args": [5003]
            }
        }
    },
    "telegram_health": {
        "name": "Telegram Health Server",
        "main_file": "src/backend/telegram_connector/health_server.py",
        "startup_command": [
            sys.executable,
            "{main_file}"
        ],
        "env": {
            "PYTHONPATH": "{project_root}",
            "HEALTH_PORT": "5001"
        },
        "health_url": "http://localhost:5001/health",
        "port": 5001,
        "log_file": "data/logs/telegram_health_debug.log",
        "dependencies": [],
        "expected_patterns": [
            r"Running on http://[0-9.:]+:5001",
            r"Starting Telegram Connector health server"
        ],
        "error_patterns": [
            r"ImportError",
            r"ModuleNotFoundError",
            r"SyntaxError",
            r"IndentationError",
            r"AttributeError",
            r"TypeError",
            r"ValueError",
            r"Exception"
        ],
        "common_fixes": {
            r"Address already in use": {
                "description": "Port 5001 is already in use",
                "action": "kill_process_on_port",
                "args": [5001]
            },
            r"FileNotFoundError": {
                "description": "Log file or directory not found",
                "action": "create_log_directory"
            }
        }
    },
    "telegram_bot": {
        "name": "Telegram Bot",
        "main_file": "src/backend/telegram_connector/run.py",
        "startup_command": [
            sys.executable,
            "{main_file}"
        ],
        "env": {
            "PYTHONPATH": "{project_root}",
            "MT4_API_URL": "http://localhost:5002/api",
            "MOCK_MODE": "True",
            "FLASK_PORT": "5001"
        },
        "health_url": None,  # Uses the telegram_health service for health checks
        "port": None,  # Uses the telegram_health service's port
        "log_file": "data/logs/telegram_bot_debug.log",
        "dependencies": ["telegram_health"],
        "expected_patterns": [
            r"Starting Telegram Connector server",
            r"Registered routes"
        ],
        "error_patterns": [
            r"ImportError",
            r"ModuleNotFoundError",
            r"SyntaxError",
            r"IndentationError",
            r"AttributeError",
            r"TypeError",
            r"ValueError",
            r"Exception"
        ],
        "common_fixes": {
            r"ImportError.*mt4_connector": {
                "description": "Fix import of mt4_connector module",
                "action": "fix_telegram_mt4_connector_import"
            },
            r"ImportError.*src.backend.telegram_connector.app": {
                "description": "Fix import of telegram connector app module",
                "action": "fix_telegram_app_import"
            }
        }
    }
}

class ServiceManager:
    """Manages starting, monitoring, and fixing services"""
    
    def __init__(self, services=None):
        """
        Initialize the service manager
        
        Args:
            services: Dictionary of services (defaults to SERVICES)
        """
        self.services = services or SERVICES
        self.processes = {}
        self.output_queues = {}
        self.fixes_applied = []
        
        # Ensure log directory exists
        log_dir = project_root / "data" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
    
    def start_service(self, service_id):
        """
        Start a service
        
        Args:
            service_id: ID of the service to start
            
        Returns:
            subprocess.Popen: The process object
        """
        service = self.services[service_id]
        logger.info(f"Starting {service['name']}...")
        
        # Format the command and environment
        main_file = project_root / service["main_file"]
        command = [cmd.format(main_file=main_file) for cmd in service["startup_command"]]
        
        # Set up environment
        env = os.environ.copy()
        for key, value in service["env"].items():
            env[key] = value.format(project_root=project_root)
        
        # Create output queue
        output_queue = queue.Queue()
        self.output_queues[service_id] = output_queue
        
        # Set up log file
        log_file = project_root / service["log_file"]
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Start the process
        process = subprocess.Popen(
            command,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True
        )
        
        # Start thread to capture output
        threading.Thread(
            target=self._log_process_output,
            args=(process, service_id, log_file, output_queue),
            daemon=True
        ).start()
        
        # Store and return the process
        self.processes[service_id] = process
        return process
    
    def _log_process_output(self, process, service_id, log_file, output_queue):
        """
        Capture and log process output
        
        Args:
            process: The subprocess.Popen process
            service_id: ID of the service
            log_file: Path to the log file
            output_queue: Queue for passing output to the monitoring thread
        """
        service_name = self.services[service_id]["name"]
        
        with open(log_file, 'w', encoding='utf-8') as f:
            while True:
                output = process.stdout.readline()
                if not output and process.poll() is not None:
                    break
                
                if output:
                    output_str = output.strip()
                    # Write to file
                    f.write(f"{output_str}\n")
                    f.flush()
                    
                    # Add to queue for analysis
                    output_queue.put((service_id, output_str))
                    
                    # Also print to console with service prefix
                    print(f"[{service_name}] {output_str}")
    
    def check_service_health(self, service_id):
        """
        Check if a service is healthy
        
        Args:
            service_id: ID of the service to check
            
        Returns:
            True if healthy, False otherwise
        """
        service = self.services[service_id]
        service_name = service["name"]
        health_url = service["health_url"]
        
        if not health_url:
            logger.info(f"No health URL configured for {service_name}, skipping health check")
            return True
        
        try:
            logger.info(f"Checking health of {service_name} at {health_url}")
            response = requests.get(health_url, timeout=2)
            
            if response.status_code == 200:
                try:
                    health_data = response.json()
                    logger.info(f"Health check for {service_name} successful: {health_data}")
                    return True
                except json.JSONDecodeError:
                    logger.error(f"Health check for {service_name} returned invalid JSON: {response.text}")
                    return False
            else:
                logger.error(f"Health check for {service_name} failed with status code {response.status_code}: {response.text}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"Health check for {service_name} failed: {e}")
            return False
    
    def start_all_services(self):
        """
        Start all services in dependency order
        
        Returns:
            True if all services started, False otherwise
        """
        logger.info("Starting all services...")
        
        # Start services in dependency order
        for service_id in self._get_service_start_order():
            service = self.services[service_id]
            
            # Check if dependencies are healthy
            deps_healthy = True
            for dep_id in service.get("dependencies", []):
                if not self.check_service_health(dep_id):
                    logger.error(f"Dependency {dep_id} is not healthy, cannot start {service_id}")
                    deps_healthy = False
            
            if not deps_healthy:
                continue
            
            # Start the service
            self.start_service(service_id)
            
            # Wait a moment for the service to start
            time.sleep(2)
        
        # Wait a bit longer for all services to initialize
        logger.info("Waiting for services to initialize...")
        time.sleep(5)
        
        # Check health of all services
        all_healthy = True
        for service_id, service in self.services.items():
            if service.get("health_url") and not self.check_service_health(service_id):
                all_healthy = False
        
        return all_healthy
    
    def _get_service_start_order(self):
        """
        Get the order in which services should be started based on dependencies
        
        Returns:
            List of service IDs in start order
        """
        # Simple topological sort
        visited = set()
        start_order = []
        
        def visit(service_id):
            if service_id in visited:
                return
            
            visited.add(service_id)
            
            for dep_id in self.services[service_id].get("dependencies", []):
                visit(dep_id)
            
            start_order.append(service_id)
        
        for service_id in self.services:
            visit(service_id)
        
        return start_order
    
    def analyze_service_output(self, service_id, output):
        """
        Analyze service output for errors and expected patterns
        
        Args:
            service_id: ID of the service
            output: Output line from the service
            
        Returns:
            Dictionary with analysis results
        """
        service = self.services[service_id]
        expected_patterns = service["expected_patterns"]
        error_patterns = service["error_patterns"]
        
        # Check for expected patterns
        expected_matches = []
        for pattern in expected_patterns:
            if re.search(pattern, output):
                expected_matches.append(pattern)
        
        # Check for error patterns
        error_matches = []
        error_details = {}
        
        for pattern in error_patterns:
            match = re.search(pattern, output)
            if match:
                error_matches.append(pattern)
                # Store the matched text for detailed error analysis
                error_details[pattern] = match.group(0)
        
        # Check for common fixable issues
        fixable_issues = []
        for error_pattern, fix_info in service.get("common_fixes", {}).items():
            if re.search(error_pattern, output):
                fixable_issues.append({
                    "pattern": error_pattern,
                    "fix": fix_info
                })
        
        return {
            "service_id": service_id,
            "output": output,
            "expected_matches": expected_matches,
            "error_matches": error_matches,
            "error_details": error_details,
            "fixable_issues": fixable_issues
        }
    
    def monitor_and_fix_services(self, timeout=60):
        """
        Monitor services for issues and apply fixes
        
        Args:
            timeout: Timeout in seconds to monitor services
            
        Returns:
            Dictionary with results for each service
        """
        logger.info(f"Monitoring services for {timeout} seconds...")
        
        results = {
            service_id: {
                "expected_patterns_found": set(),
                "error_patterns_found": set(),
                "fixable_issues": [],
                "fixes_applied": [],
                "healthy": False
            }
            for service_id in self.services
        }
        
        # Keep track of which services need a restart
        services_to_restart = set()
        
        # Time limit
        end_time = time.time() + timeout
        
        try:
            while time.time() < end_time:
                # Process output from all queues
                for service_id, service_queue in self.output_queues.items():
                    try:
                        while True:
                            s_id, output = service_queue.get_nowait()
                            
                            # Analyze output
                            analysis = self.analyze_service_output(s_id, output)
                            
                            # Update results
                            results[s_id]["expected_patterns_found"].update(analysis["expected_matches"])
                            results[s_id]["error_patterns_found"].update(analysis["error_matches"])
                            
                            # Process fixable issues
                            for issue in analysis["fixable_issues"]:
                                issue_pattern = issue["pattern"]
                                fix_info = issue["fix"]
                                
                                # Skip if this issue is already in the results
                                if any(i["pattern"] == issue_pattern for i in results[s_id]["fixable_issues"]):
                                    continue
                                
                                # Add issue to results
                                results[s_id]["fixable_issues"].append(issue)
                                
                                # Apply fix if we have a function for it
                                fix_func_name = fix_info.get("action")
                                if fix_func_name and hasattr(self, fix_func_name):
                                    fix_func = getattr(self, fix_func_name)
                                    fix_args = fix_info.get("args", [])
                                    
                                    logger.info(f"Applying fix for {s_id}: {fix_info['description']}")
                                    
                                    # Apply the fix
                                    fix_result = fix_func(s_id, *fix_args)
                                    
                                    if fix_result:
                                        # Record the fix
                                        results[s_id]["fixes_applied"].append({
                                            "issue": issue_pattern,
                                            "description": fix_info["description"],
                                            "success": True
                                        })
                                        
                                        # Add to global list of fixes
                                        self.fixes_applied.append({
                                            "service_id": s_id,
                                            "issue": issue_pattern,
                                            "description": fix_info["description"],
                                            "timestamp": datetime.now().isoformat()
                                        })
                                        
                                        # Mark for restart
                                        services_to_restart.add(s_id)
                    except queue.Empty:
                        pass
                
                # Check if any services need to be restarted
                if services_to_restart:
                    logger.info(f"Restarting services: {', '.join(services_to_restart)}")
                    
                    # Restart services in dependency order
                    restart_order = [s for s in self._get_service_start_order() if s in services_to_restart]
                    
                    for service_id in restart_order:
                        # Stop service
                        if service_id in self.processes:
                            process = self.processes[service_id]
                            logger.info(f"Stopping {service_id}...")
                            process.terminate()
                            try:
                                process.wait(timeout=5)
                            except subprocess.TimeoutExpired:
                                logger.warning(f"Service {service_id} did not terminate, killing...")
                                process.kill()
                            
                            # Remove from processes dict
                            del self.processes[service_id]
                        
                        # Wait a moment
                        time.sleep(1)
                        
                        # Start service
                        self.start_service(service_id)
                        
                        # Wait a moment for the service to start
                        time.sleep(2)
                    
                    # Clear the set
                    services_to_restart.clear()
                    
                    # Extend monitoring time
                    end_time = max(end_time, time.time() + 30)
                
                # Check health of services
                for service_id, service in self.services.items():
                    if service.get("health_url"):
                        results[service_id]["healthy"] = self.check_service_health(service_id)
                
                # Short sleep to avoid high CPU usage
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            logger.info("Monitoring interrupted by user.")
        
        return results
    
    def stop_all_services(self):
        """Stop all running services"""
        logger.info("Stopping all services...")
        
        for service_id, process in self.processes.items():
            service_name = self.services[service_id]["name"]
            logger.info(f"Stopping {service_name}...")
            
            try:
                process.terminate()
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                logger.warning(f"Service {service_name} did not terminate, killing...")
                process.kill()
        
        self.processes.clear()
        logger.info("All services stopped.")
    
    def kill_process_on_port(self, service_id, port):
        """
        Kill a process listening on a specific port
        
        Args:
            service_id: ID of the service (unused, for API compatibility)
            port: Port number
            
        Returns:
            True if successful, False otherwise
        """
        logger.info(f"Killing process on port {port}...")
        
        try:
            # Different commands for different platforms
            if sys.platform == "win32":
                # Windows
                output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True).decode()
                
                for line in output.splitlines():
                    if f":{port}" in line:
                        pid = line.strip().split()[-1]
                        logger.info(f"Killing process with PID {pid}")
                        subprocess.call(f"taskkill /PID {pid} /F", shell=True)
                        return True
            else:
                # macOS/Linux
                output = subprocess.check_output(f"lsof -i :{port}", shell=True).decode()
                
                for line in output.splitlines()[1:]:  # Skip header
                    pid = line.split()[1]
                    logger.info(f"Killing process with PID {pid}")
                    subprocess.call(f"kill -9 {pid}", shell=True)
                    return True
                    
            logger.warning(f"No process found on port {port}")
            return False
            
        except subprocess.CalledProcessError:
            logger.info(f"No process found on port {port}")
            return True  # Consider it a success if no process is found
        except Exception as e:
            logger.error(f"Error killing process on port {port}: {e}")
            return False
    
    def create_log_directory(self, service_id):
        """
        Create log directory for a service
        
        Args:
            service_id: ID of the service
            
        Returns:
            True if successful, False otherwise
        """
        try:
            service = self.services[service_id]
            log_file = project_root / service["log_file"]
            log_dir = log_file.parent
            
            logger.info(f"Creating log directory: {log_dir}")
            log_dir.mkdir(parents=True, exist_ok=True)
            
            return True
        except Exception as e:
            logger.error(f"Error creating log directory: {e}")
            return False
    
    def fix_mt4_api_import(self, service_id):
        """
        Fix import issues in MT4 REST API implementation
        
        Args:
            service_id: ID of the service
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get the main file path
            main_file = project_root / self.services[service_id]["main_file"]
            
            # Create backup
            backup_file = main_file.with_suffix(f".py.bak-{int(time.time())}")
            shutil.copy2(main_file, backup_file)
            
            # Read the file
            with open(main_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Fix the imports
            fixed_content = re.sub(
                r"from mt4_api import",
                r"from src.backend.MT4RestfulAPIWrapper.mt4_api import",
                content
            )
            
            # Write the fixed content
            with open(main_file, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            
            logger.info(f"Fixed mt4_api import in {main_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error fixing mt4_api import: {e}")
            return False
    
    def fix_webhook_app_import(self, service_id):
        """
        Fix import issues in Webhook API
        
        Args:
            service_id: ID of the service
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get the main file path
            main_file = project_root / self.services[service_id]["main_file"]
            
            # Create backup
            backup_file = main_file.with_suffix(f".py.bak-{int(time.time())}")
            shutil.copy2(main_file, backup_file)
            
            # Read the file
            with open(main_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Fix the imports
            fixed_content = re.sub(
                r"from webhook_api.app import",
                r"from src.backend.webhook_api.app import",
                content
            )
            
            # Write the fixed content
            with open(main_file, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            
            logger.info(f"Fixed webhook_api.app import in {main_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error fixing webhook_api.app import: {e}")
            return False
    
    def fix_telegram_mt4_connector_import(self, service_id):
        """
        Fix import issues in Telegram Connector for MT4 connector
        
        Args:
            service_id: ID of the service
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get app.py path
            app_file = project_root / "src" / "backend" / "telegram_connector" / "app.py"
            
            # Create backup
            backup_file = app_file.with_suffix(f".py.bak-{int(time.time())}")
            shutil.copy2(app_file, backup_file)
            
            # Read the file
            with open(app_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Fix the imports
            fixed_content = re.sub(
                r"from src.backend.telegram_connector.mt4_connector import",
                r"from mt4_connector import",
                content
            )
            
            # Write the fixed content
            with open(app_file, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            
            logger.info(f"Fixed mt4_connector import in {app_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error fixing mt4_connector import: {e}")
            return False
    
    def fix_telegram_app_import(self, service_id):
        """
        Fix import issues in Telegram Connector for app import
        
        Args:
            service_id: ID of the service
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get the main file path
            main_file = project_root / self.services[service_id]["main_file"]
            
            # Create backup
            backup_file = main_file.with_suffix(f".py.bak-{int(time.time())}")
            shutil.copy2(main_file, backup_file)
            
            # Read the file
            with open(main_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Fix the imports
            fixed_content = re.sub(
                r"from src.backend.telegram_connector.app import",
                r"from app import",
                content
            )
            
            # Write the fixed content
            with open(main_file, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            
            logger.info(f"Fixed app import in {main_file}")
            return True
            
        except Exception as e:
            logger.error(f"Error fixing app import: {e}")
            return False
    
    def print_analysis_results(self, results):
        """
        Print analysis results
        
        Args:
            results: Results dictionary from monitor_and_fix_services
        """
        logger.info("\n=== SERVICE ANALYSIS RESULTS ===\n")
        
        for service_id, service_results in results.items():
            service_name = self.services[service_id]["name"]
            expected_patterns = self.services[service_id]["expected_patterns"]
            expected_found = service_results["expected_patterns_found"]
            error_patterns_found = service_results["error_patterns_found"]
            fixes_applied = service_results["fixes_applied"]
            healthy = service_results["healthy"]
            
            logger.info(f"\n=== {service_name} Analysis ===")
            
            # Health status
            health_status = "✅ Healthy" if healthy else "❌ Unhealthy"
            if self.services[service_id].get("health_url") is None:
                health_status = "⚠️ No health check configured"
            
            logger.info(f"Health Status: {health_status}")
            
            # Expected patterns
            logger.info(f"Expected patterns found: {len(expected_found)}/{len(expected_patterns)}")
            for pattern in expected_patterns:
                if any(re.search(pattern, p) for p in expected_found):
                    logger.info(f"  ✅ Found: {pattern}")
                else:
                    logger.info(f"  ❌ Not found: {pattern}")
            
            # Error patterns
            if error_patterns_found:
                logger.info(f"Error patterns found: {len(error_patterns_found)}")
                for pattern in error_patterns_found:
                    logger.info(f"  ⚠️ Found: {pattern}")
            else:
                logger.info("  ✅ No errors found")
            
            # Fixes applied
            if fixes_applied:
                logger.info(f"Fixes applied: {len(fixes_applied)}")
                for fix in fixes_applied:
                    status = "✅ Success" if fix["success"] else "❌ Failed"
                    logger.info(f"  {status}: {fix['description']}")
            else:
                logger.info("  ✅ No fixes needed")
        
        # Overall status
        all_healthy = all(r["healthy"] or self.services[s_id].get("health_url") is None for s_id, r in results.items())
        all_expected_found = all(len(r["expected_patterns_found"]) >= len(self.services[s_id]["expected_patterns"]) for s_id, r in results.items())
        no_errors = all(len(r["error_patterns_found"]) == 0 for s_id, r in results.items())
        
        if all_healthy and all_expected_found and no_errors:
            logger.info("\n✅ All services are running correctly!")
        else:
            if not all_healthy:
                logger.warning("\n⚠️ Some services are not healthy!")
            if not all_expected_found:
                logger.warning("\n⚠️ Some services are missing expected patterns!")
            if not no_errors:
                logger.warning("\n⚠️ Some services have errors!")
    
    def document_fixes(self, output_file=None):
        """
        Document all fixes applied
        
        Args:
            output_file: Path to output file (defaults to fixes_applied_{timestamp}.json)
        """
        if not self.fixes_applied:
            logger.info("No fixes were applied.")
            return
        
        if output_file is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = project_root / f"fixes_applied_{timestamp}.json"
        
        logger.info(f"Documenting {len(self.fixes_applied)} fixes to {output_file}")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "fixes": self.fixes_applied
            }, f, indent=2)

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Service Issue Detection and Correction Tool")
    parser.add_argument("--monitor-time", type=int, default=60, help="Time in seconds to monitor services")
    parser.add_argument("--iterations", type=int, default=3, help="Number of fix iterations to run")
    parser.add_argument("--skip-restart", action="store_true", help="Skip restarting services between iterations")
    
    args = parser.parse_args()
    
    try:
        # Create service manager
        manager = ServiceManager()
        
        # Run fix iterations
        for iteration in range(1, args.iterations + 1):
            logger.info(f"\n=== Starting Iteration {iteration}/{args.iterations} ===\n")
            
            # Start all services
            manager.start_all_services()
            
            # Monitor and fix services
            results = manager.monitor_and_fix_services(timeout=args.monitor_time)
            
            # Print analysis results
            manager.print_analysis_results(results)
            
            # Check if all services are healthy
            all_healthy = all(r["healthy"] or manager.services[s_id].get("health_url") is None for s_id, r in results.items())
            all_expected_found = all(len(r["expected_patterns_found"]) >= len(manager.services[s_id]["expected_patterns"]) for s_id, r in results.items())
            no_errors = all(len(r["error_patterns_found"]) == 0 for s_id, r in results.items())
            
            if all_healthy and all_expected_found and no_errors:
                logger.info("\n✅ All services are running correctly! Stopping iterations.")
                break
            
            # Stop all services if not skipping restart and not the last iteration
            if not args.skip_restart and iteration < args.iterations:
                manager.stop_all_services()
                logger.info("Waiting a moment before next iteration...")
                time.sleep(5)
        
        # Document fixes
        manager.document_fixes()
        
        # Ask if user wants to keep services running
        try:
            if not args.skip_restart:
                keep_running = input("\nKeep services running? (y/n): ").lower() == 'y'
                
                if not keep_running:
                    manager.stop_all_services()
                else:
                    logger.info("Services will continue running. Press Ctrl+C to terminate.")
                    
                    while True:
                        time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Terminating all services...")
            manager.stop_all_services()
            
    except Exception as e:
        logger.error(f"Error in main function: {e}", exc_info=True)
        # Ensure all services are stopped
        try:
            manager.stop_all_services()
        except:
            pass

if __name__ == "__main__":
    main()
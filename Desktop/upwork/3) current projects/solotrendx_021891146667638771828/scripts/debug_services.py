#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Debugging and validation script for SoloTrend X system.
Starts all services, logs output, checks for issues, and provides diagnostics.
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

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('debug_services.log')
    ]
)
logger = logging.getLogger(__name__)

# Get project root directory
project_root = Path(__file__).resolve().parents[1]
logger.info(f"Project root: {project_root}")

# Define service configurations
services = {
    "mt4_rest_api": {
        "name": "MT4 REST API",
        "command": [
            sys.executable, 
            str(project_root / "src" / "backend" / "MT4RestfulAPIWrapper" / "mt4_rest_api_implementation.py")
        ],
        "env": {
            "PYTHONPATH": str(project_root),
            "USE_MOCK_MODE": "true",
            "PORT": "5002"
        },
        "health_url": "http://localhost:5002/api/health",
        "log_file": project_root / "data" / "logs" / "mt4_rest_api_debug.log",
        "expected_patterns": [
            r"Starting MT4 REST API",
            r"Running on http://[0-9.:]+:5002"
        ],
        "error_patterns": [
            r"Error",
            r"Exception",
            r"Traceback",
            r"Failed to",
            r"Could not"
        ]
    },
    "webhook_api": {
        "name": "Webhook API",
        "command": [
            sys.executable, 
            str(project_root / "src" / "backend" / "webhook_api" / "run_server.py")
        ],
        "env": {
            "PYTHONPATH": str(project_root),
            "WEBHOOK_API_PORT": "5003",
            "TELEGRAM_WEBHOOK_URL": "http://localhost:5001/webhook",
            "MOCK_MODE": "True"
        },
        "health_url": "http://localhost:5003/health",
        "log_file": project_root / "data" / "logs" / "webhook_api_debug.log",
        "expected_patterns": [
            r"Starting Webhook API Server",
            r"Running on http://[0-9.:]+:5003"
        ],
        "error_patterns": [
            r"Error",
            r"Exception",
            r"Traceback",
            r"Failed to",
            r"Could not"
        ]
    },
    "telegram_health": {
        "name": "Telegram Health Server",
        "command": [
            sys.executable, 
            str(project_root / "src" / "backend" / "telegram_connector" / "health_server.py")
        ],
        "env": {
            "PYTHONPATH": str(project_root),
            "HEALTH_PORT": "5001"
        },
        "health_url": "http://localhost:5001/health",
        "log_file": project_root / "data" / "logs" / "telegram_health_debug.log",
        "expected_patterns": [
            r"Starting Telegram Connector health server",
            r"Running on http://[0-9.:]+:5001"
        ],
        "error_patterns": [
            r"Error",
            r"Exception",
            r"Traceback",
            r"Failed to",
            r"Could not"
        ]
    },
    "telegram_bot": {
        "name": "Telegram Bot",
        "command": [
            sys.executable, 
            str(project_root / "src" / "backend" / "telegram_connector" / "run.py")
        ],
        "env": {
            "PYTHONPATH": str(project_root),
            "MT4_API_URL": "http://localhost:5002/api",
            "MOCK_MODE": "True",
            "FLASK_PORT": "5001"
        },
        "health_url": None,  # Health is handled by telegram_health
        "log_file": project_root / "data" / "logs" / "telegram_bot_debug.log",
        "expected_patterns": [
            r"Starting Telegram Connector server",
            r"Telegram bot application created",
            r"Registered routes"
        ],
        "error_patterns": [
            r"Error",
            r"Exception",
            r"Traceback",
            r"Failed to",
            r"Could not"
        ]
    }
}

# Create data/logs directory if it doesn't exist
log_dir = project_root / "data" / "logs"
log_dir.mkdir(parents=True, exist_ok=True)

# Function to capture process output and log it
def log_process_output(process, service_name, log_file, output_queue):
    """
    Capture and log process output
    
    Args:
        process: The subprocess.Popen process
        service_name: Name of the service
        log_file: Path to the log file
        output_queue: Queue for passing output to the monitoring thread
    """
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
                output_queue.put((service_name, output_str))
                
                # Also print to console with service prefix
                print(f"[{service_name}] {output_str}")

# Function to start a service
def start_service(service_config, output_queues):
    """
    Start a service and capture its output
    
    Args:
        service_config: Configuration for the service
        output_queues: Dictionary of output queues for services
        
    Returns:
        The started process
    """
    service_name = service_config["name"]
    command = service_config["command"]
    env = os.environ.copy()
    env.update(service_config["env"])
    log_file = service_config["log_file"]
    
    logger.info(f"Starting {service_name}...")
    logger.info(f"Command: {' '.join(str(x) for x in command)}")
    logger.info(f"Environment: {json.dumps(service_config['env'])}")
    
    # Create output queue
    output_queue = queue.Queue()
    output_queues[service_name] = output_queue
    
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
    output_thread = threading.Thread(
        target=log_process_output,
        args=(process, service_name, log_file, output_queue),
        daemon=True
    )
    output_thread.start()
    
    return process

# Function to check health of services
def check_service_health(service_config):
    """
    Check if a service is healthy by making a request to its health endpoint
    
    Args:
        service_config: Configuration for the service
        
    Returns:
        True if healthy, False otherwise
    """
    service_name = service_config["name"]
    health_url = service_config.get("health_url")
    
    if not health_url:
        logger.info(f"No health URL configured for {service_name}, skipping health check")
        return True
    
    try:
        logger.info(f"Checking health of {service_name} at {health_url}...")
        response = requests.get(health_url, timeout=2)
        
        if response.status_code == 200:
            health_data = response.json()
            logger.info(f"Health check for {service_name} successful: {health_data}")
            return True
        else:
            logger.error(f"Health check for {service_name} failed with status code {response.status_code}: {response.text}")
            return False
    except requests.RequestException as e:
        logger.error(f"Health check for {service_name} failed: {e}")
        return False

# Function to analyze service output
def analyze_service_output(service_name, output, service_config):
    """
    Analyze service output for expected patterns and errors
    
    Args:
        service_name: Name of the service
        output: Output line from the service
        service_config: Configuration for the service
        
    Returns:
        Dictionary with analysis results
    """
    expected_patterns = service_config["expected_patterns"]
    error_patterns = service_config["error_patterns"]
    
    # Check for expected patterns
    expected_matches = []
    for pattern in expected_patterns:
        if re.search(pattern, output):
            expected_matches.append(pattern)
    
    # Check for error patterns
    error_matches = []
    for pattern in error_patterns:
        if re.search(pattern, output):
            error_matches.append(pattern)
    
    return {
        "service": service_name,
        "output": output,
        "expected_matches": expected_matches,
        "error_matches": error_matches
    }

# Function to test a webhook signal
def test_webhook_signal(signal_data=None):
    """
    Send a test signal to the webhook API
    
    Args:
        signal_data: Signal data to send (optional)
        
    Returns:
        Response from the webhook API
    """
    if signal_data is None:
        # Default test signal
        signal_data = {
            "symbol": "EURUSD",
            "action": "BUY",
            "price": 1.1234,
            "volume": 0.1,
            "sl": 1.1200,
            "tp": 1.1300,
            "comment": "Test signal",
            "source": "debug_script"
        }
    
    webhook_url = "http://localhost:5003/webhook"
    
    try:
        logger.info(f"Sending test signal to webhook API: {json.dumps(signal_data)}")
        response = requests.post(
            webhook_url,
            json=signal_data,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        logger.info(f"Webhook response: {response.status_code} - {response.text}")
        return response
    except requests.RequestException as e:
        logger.error(f"Error sending test signal: {e}")
        return None

# Main function
def main():
    """Main function to run and monitor services"""
    try:
        logger.info("Starting SoloTrend X services for debugging...")
        
        # Dictionary to hold processes
        processes = {}
        
        # Dictionary to hold output queues
        output_queues = {}
        
        # Start all services
        for service_id, service_config in services.items():
            processes[service_id] = start_service(service_config, output_queues)
            time.sleep(2)  # Give each service a moment to start
        
        # Wait for services to start
        logger.info("Waiting for services to start...")
        time.sleep(5)
        
        # Check health of all services
        all_healthy = True
        for service_id, service_config in services.items():
            if not check_service_health(service_config):
                all_healthy = False
        
        if all_healthy:
            logger.info("All services are healthy!")
        else:
            logger.warning("Some services are not healthy!")
        
        # Test webhook signal
        if all_healthy:
            test_webhook_signal()
        
        # Monitor services and analyze output
        logger.info("Monitoring services...")
        
        # Collect analysis results
        analysis_results = {
            service_id: {
                "expected_patterns_found": set(),
                "error_patterns_found": set(),
                "output_lines": []
            }
            for service_id in services
        }
        
        # Wait for a while to collect and analyze output
        end_time = time.time() + 30  # Monitor for 30 seconds
        
        try:
            while time.time() < end_time:
                # Process output from all queues
                for service_id, service_queue in output_queues.items():
                    try:
                        while True:
                            service_name, output = service_queue.get_nowait()
                            
                            # Analyze output
                            service_config = next((s for s_id, s in services.items() if s["name"] == service_name), None)
                            if service_config:
                                analysis = analyze_service_output(service_name, output, service_config)
                                
                                # Add to analysis results
                                service_id = next((s_id for s_id, s in services.items() if s["name"] == service_name), None)
                                if service_id:
                                    analysis_results[service_id]["output_lines"].append(output)
                                    analysis_results[service_id]["expected_patterns_found"].update(analysis["expected_matches"])
                                    analysis_results[service_id]["error_patterns_found"].update(analysis["error_matches"])
                    except queue.Empty:
                        pass
                
                time.sleep(0.1)
        except KeyboardInterrupt:
            logger.info("Monitoring interrupted by user.")
        
        # Summarize results
        logger.info("=== Service Analysis Results ===")
        
        for service_id, results in analysis_results.items():
            service_name = services[service_id]["name"]
            expected_patterns = services[service_id]["expected_patterns"]
            expected_found = results["expected_patterns_found"]
            error_patterns = results["error_patterns_found"]
            
            logger.info(f"\n=== {service_name} Analysis ===")
            
            # Expected patterns
            logger.info(f"Expected patterns found: {len(expected_found)}/{len(expected_patterns)}")
            for pattern in expected_patterns:
                found = any(re.search(pattern, p) for p in expected_found)
                status = "✅ Found" if found else "❌ Not found"
                logger.info(f"  {status}: {pattern}")
            
            # Error patterns
            if error_patterns:
                logger.info(f"Error patterns found: {len(error_patterns)}")
                for pattern in error_patterns:
                    logger.info(f"  ⚠️ Found: {pattern}")
            else:
                logger.info("  ✅ No errors found")
        
        # Final health check
        logger.info("\n=== Final Health Check ===")
        all_healthy = True
        for service_id, service_config in services.items():
            healthy = check_service_health(service_config)
            if not healthy:
                all_healthy = False
        
        if all_healthy:
            logger.info("✅ All services are healthy!")
        else:
            logger.error("❌ Some services are not healthy!")
        
        # Ask if user wants to keep services running
        try:
            keep_running = input("\nKeep services running? (y/n): ").lower() == 'y'
            
            if not keep_running:
                # Terminate all processes
                logger.info("Terminating all services...")
                for service_id, process in processes.items():
                    logger.info(f"Terminating {services[service_id]['name']}...")
                    process.terminate()
                
                # Wait for processes to terminate
                for service_id, process in processes.items():
                    process.wait(timeout=5)
                
                logger.info("All services terminated.")
            else:
                logger.info("Services will continue running. Press Ctrl+C to terminate.")
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    logger.info("Terminating all services...")
                    for service_id, process in processes.items():
                        logger.info(f"Terminating {services[service_id]['name']}...")
                        process.terminate()
                    
                    # Wait for processes to terminate
                    for service_id, process in processes.items():
                        process.wait(timeout=5)
                    
                    logger.info("All services terminated.")
        except KeyboardInterrupt:
            logger.info("Terminating all services...")
            for service_id, process in processes.items():
                logger.info(f"Terminating {services[service_id]['name']}...")
                process.terminate()
            
            # Wait for processes to terminate
            for service_id, process in processes.items():
                process.wait(timeout=5)
            
            logger.info("All services terminated.")
    except Exception as e:
        logger.error(f"Error in main function: {e}", exc_info=True)
        # Ensure all processes are terminated
        if 'processes' in locals():
            for service_id, process in processes.items():
                try:
                    process.terminate()
                except:
                    pass

if __name__ == "__main__":
    main()
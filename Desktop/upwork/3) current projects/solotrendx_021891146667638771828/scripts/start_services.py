#!/usr/bin/env python3
"""
Unified service starter for SoloTrend X Trading System (macOS/Linux version)
This script starts all the required services with proper environment setup.
"""

import os
import sys
import time
import signal
import logging
import subprocess
import requests
from pathlib import Path
from datetime import datetime
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Service definitions
SERVICES = [
    {
        "name": "MT4 REST API",
        "script_path": "src/backend/MT4RestfulAPIWrapper/mt4_rest_api_implementation.py",
        "port": 5002,
        "health_endpoint": "http://localhost:5002/api/health",
        "env_vars": {
            "PYTHONPATH": "{{PROJECT_ROOT}}",
            "USE_MOCK_MODE": "true",
            "PORT": "5002"
        }
    },
    {
        "name": "Webhook API",
        "script_path": "src/backend/webhook_api/run_server.py",
        "port": 5003,
        "health_endpoint": "http://localhost:5003/health",
        "env_vars": {
            "PYTHONPATH": "{{PROJECT_ROOT}}",
            "FLASK_APP": "src.backend.webhook_api.app",
            "FLASK_DEBUG": "True",
            "FLASK_PORT": "5003",
            "WEBHOOK_API_PORT": "5003",
            "TELEGRAM_WEBHOOK_URL": "http://localhost:5001/webhook",
            "MOCK_MODE": "True"
        }
    },
    {
        "name": "Telegram Connector",
        "script_path": "src/backend/telegram_connector/run.py",
        "port": 5001,
        "health_endpoint": "http://localhost:5001/health",
        "env_vars": {
            "PYTHONPATH": "{{PROJECT_ROOT}}",
            "MT4_API_URL": "http://localhost:5002/api",
            "FLASK_PORT": "5001",
            "FLASK_DEBUG": "True",
            "MOCK_MODE": "True",
            "TELEGRAM_BOT_TOKEN": "YOUR_TELEGRAM_BOT_TOKEN"  # Replace with actual token when available
        }
    },
    {
        "name": "Test Health Server",
        "script_path": "src/backend/telegram_connector/test_health.py",
        "port": 5001,  # Note: This shares port with Telegram Connector for testing
        "health_endpoint": "http://localhost:5001/health",
        "env_vars": {
            "PYTHONPATH": "{{PROJECT_ROOT}}"
        }
    }
]

class ServiceManager:
    """Manages the lifecycle of all trading system services"""
    
    def __init__(self, project_root=None, use_venv=True, mock_mode=True, timeout=30):
        """
        Initialize the service manager
        
        Args:
            project_root: Path to the project root (defaults to script parent directory)
            use_venv: Whether to use a virtual environment 
            mock_mode: Whether to use mock mode for services
            timeout: Timeout in seconds for service health checks
        """
        # Determine project root
        self.project_root = project_root or Path(__file__).resolve().parent.parent
        logger.info(f"Project root: {self.project_root}")
        
        # Find virtual environment
        self.venv_dir = self.project_root / "environment" / "python" / "venv"
        if use_venv and not self.venv_dir.exists():
            logger.warning(f"Virtual environment not found at {self.venv_dir}")
            logger.warning("Will use system Python instead")
            self.venv_dir = None
        
        # Set Python interpreter
        if self.venv_dir and use_venv:
            if sys.platform == "win32":
                self.python_exe = self.venv_dir / "Scripts" / "python.exe"
            else:
                self.python_exe = self.venv_dir / "bin" / "python"
        else:
            self.python_exe = Path(sys.executable)
        
        logger.info(f"Using Python interpreter: {self.python_exe}")
        
        # Ensure log directory exists
        self.log_dir = self.project_root / "data" / "logs"
        try:
            self.log_dir.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            # If we can't create the directory, try using a temporary directory
            import tempfile
            temp_log_dir = Path(tempfile.gettempdir()) / "solotrendx_logs"
            temp_log_dir.mkdir(exist_ok=True)
            logger.warning(f"Permission error creating log directory. Using temporary directory: {temp_log_dir}")
            self.log_dir = temp_log_dir
        
        # Track processes
        self.processes = {}
        self.mock_mode = mock_mode
        self.timeout = timeout
        
        # Register signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
    def signal_handler(self, sig, frame):
        """Handle termination signals by stopping all services"""
        logger.info(f"Received signal {sig}, shutting down services...")
        self.stop_all_services()
        sys.exit(0)
        
    def check_port_availability(self, port):
        """Check if a port is available"""
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) != 0
            
    def prepare_environment(self, service):
        """Prepare environment variables for a service"""
        env = os.environ.copy()
        
        # Add service-specific environment variables
        for key, value in service.get("env_vars", {}).items():
            # Replace placeholders
            if "{{PROJECT_ROOT}}" in value:
                value = value.replace("{{PROJECT_ROOT}}", str(self.project_root))
                
            env[key] = value
            
        # Override mock mode if specified
        if "USE_MOCK_MODE" in env or "MOCK_MODE" in env:
            mock_value = "true" if self.mock_mode else "false"
            if "USE_MOCK_MODE" in env:
                env["USE_MOCK_MODE"] = mock_value
            if "MOCK_MODE" in env:
                env["MOCK_MODE"] = mock_value
                
        return env
        
    def start_service(self, service):
        """Start a single service"""
        name = service["name"]
        port = service.get("port")
        script_path = self.project_root / service["script_path"]
        
        if name in self.processes and self.processes[name].poll() is None:
            logger.warning(f"Service {name} is already running")
            return True
            
        if port and not self.check_port_availability(port):
            logger.error(f"Port {port} is already in use. Cannot start {name}")
            return False
            
        if not script_path.exists():
            logger.error(f"Script not found: {script_path}")
            return False
            
        # Prepare log file
        log_file_name = name.lower().replace(" ", "_") + ".log"
        log_file_path = self.log_dir / log_file_name
        error_log_path = self.log_dir / (name.lower().replace(" ", "_") + "_error.log")
        
        # Ensure log directory exists for this specific service
        try:
            self.log_dir.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            logger.warning(f"Permission error ensuring log directory for {name}")
        
        # Build command
        cmd = [str(self.python_exe), str(script_path)]
        
        # Prepare environment variables
        env = self.prepare_environment(service)
        
        # Start the process
        logger.info(f"Starting {name}...")
        try:
            # Try to open log files, but fall back to system temp dir if permissions error occurs
            try:
                log_file_handle = open(log_file_path, "a")
                error_log_handle = open(error_log_path, "a")
                
                # Add timestamp to log
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log_file_handle.write(f"\n\n--- {timestamp}: Starting {name} ---\n\n")
            except (PermissionError, FileNotFoundError) as e:
                logger.warning(f"Error opening log files: {e}")
                # Use temporary files in the system temp directory
                import tempfile
                temp_dir = Path(tempfile.gettempdir())
                log_file_path = temp_dir / log_file_name
                error_log_path = temp_dir / (name.lower().replace(" ", "_") + "_error.log")
                logger.info(f"Using temporary log files: {log_file_path} and {error_log_path}")
                log_file_handle = open(log_file_path, "a")
                error_log_handle = open(error_log_path, "a")
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                log_file_handle.write(f"\n\n--- {timestamp}: Starting {name} ---\n\n")
                
            process = subprocess.Popen(
                cmd,
                env=env,
                stdout=log_file_handle,
                stderr=error_log_handle,
                cwd=str(self.project_root)
            )
            
            self.processes[name] = process
            logger.info(f"Started {name} (PID: {process.pid})")
            
            # Give some time for startup
            time.sleep(1)
            
            return True
                
        except Exception as e:
            logger.error(f"Error starting {name}: {e}")
            return False
            
    def check_service_health(self, service, timeout=None):
        """Check if a service is healthy by calling its health endpoint"""
        name = service["name"]
        health_endpoint = service.get("health_endpoint")
        
        if not health_endpoint:
            logger.warning(f"No health endpoint defined for {name}")
            # Consider it healthy if the process is running
            return name in self.processes and self.processes[name].poll() is None
            
        # Check process first
        if name not in self.processes or self.processes[name].poll() is not None:
            logger.error(f"{name} process is not running")
            return False
            
        # Set timeout
        timeout = timeout or self.timeout
        end_time = time.time() + timeout
        
        # Poll health endpoint
        while time.time() < end_time:
            try:
                response = requests.get(health_endpoint, timeout=2)
                if response.status_code == 200:
                    logger.info(f"{name} is healthy: {response.text}")
                    return True
                else:
                    logger.warning(f"{name} returned non-200 status: {response.status_code}")
            except requests.RequestException as e:
                logger.warning(f"Health check failed for {name}: {e}")
                
            # Wait before retrying
            time.sleep(2)
            
        logger.error(f"{name} failed health check after {timeout} seconds")
        return False
        
    def start_all_services(self):
        """Start all services in the correct order"""
        logger.info("Starting all services...")
        
        # Check log directory exists
        try:
            self.log_dir.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            logger.warning(f"Permission error creating log directory: {self.log_dir}")
            # Continue with existing directory or the temporary one set in __init__
        
        # Start services in order
        for service in SERVICES:
            if self.start_service(service):
                logger.info(f"Started {service['name']}")
            else:
                logger.error(f"Failed to start {service['name']}")
                
        # Check health of all services
        logger.info("Checking health of all services...")
        all_healthy = True
        
        for service in SERVICES:
            if self.check_service_health(service):
                logger.info(f"{service['name']} is healthy")
            else:
                logger.error(f"{service['name']} is not healthy")
                all_healthy = False
                
        return all_healthy
        
    def stop_service(self, service):
        """Stop a single service"""
        name = service["name"]
        
        if name not in self.processes:
            logger.warning(f"Service {name} is not running")
            return True
            
        process = self.processes[name]
        
        if process.poll() is not None:
            logger.info(f"{name} is already stopped")
            return True
            
        try:
            # Try graceful termination
            logger.info(f"Stopping {name}...")
            process.terminate()
            
            # Wait for process to terminate
            for _ in range(5):
                if process.poll() is not None:
                    logger.info(f"{name} stopped gracefully")
                    return True
                time.sleep(1)
                
            # Force kill if still running
            logger.warning(f"{name} did not stop gracefully, killing...")
            process.kill()
            process.wait(5)
            logger.info(f"{name} killed")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping {name}: {e}")
            return False
            
    def stop_all_services(self):
        """Stop all services in reverse order"""
        logger.info("Stopping all services...")
        
        # Stop in reverse order
        for service in reversed(SERVICES):
            if self.stop_service(service):
                logger.info(f"Stopped {service['name']}")
            else:
                logger.error(f"Failed to stop {service['name']}")
                
    def restart_service(self, service):
        """Restart a single service"""
        logger.info(f"Restarting {service['name']}...")
        self.stop_service(service)
        return self.start_service(service)
        
    def restart_all_services(self):
        """Restart all services"""
        logger.info("Restarting all services...")
        self.stop_all_services()
        return self.start_all_services()
        
    def check_all_services(self):
        """Check health of all services"""
        logger.info("Checking health of all services...")
        all_healthy = True
        
        for service in SERVICES:
            if self.check_service_health(service):
                logger.info(f"{service['name']} is healthy")
            else:
                logger.error(f"{service['name']} is not healthy")
                all_healthy = False
                
        return all_healthy

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="SoloTrend X Service Manager")
    parser.add_argument("--action", choices=["start", "stop", "restart", "check"], default="start", 
                      help="Action to perform (default: start)")
    parser.add_argument("--mock", action="store_true", default=True,
                      help="Use mock mode for services (default: True)")
    parser.add_argument("--no-venv", action="store_true", default=False,
                      help="Don't use virtual environment (default: False)")
    parser.add_argument("--timeout", type=int, default=30,
                      help="Timeout in seconds for health checks (default: 30)")
    parser.add_argument("--service", type=str, default=None,
                      help="Act on a specific service by name (default: all services)")
    
    args = parser.parse_args()
    
    # Create service manager
    manager = ServiceManager(
        use_venv=not args.no_venv,
        mock_mode=args.mock,
        timeout=args.timeout
    )
    
    # Perform requested action
    if args.service:
        # Find the specified service
        service = next((s for s in SERVICES if s["name"].lower() == args.service.lower()), None)
        if not service:
            logger.error(f"Service '{args.service}' not found. Available services:")
            for s in SERVICES:
                logger.error(f"  - {s['name']}")
            return 1
            
        # Act on single service
        if args.action == "start":
            success = manager.start_service(service)
            if success:
                success = manager.check_service_health(service)
        elif args.action == "stop":
            success = manager.stop_service(service)
        elif args.action == "restart":
            success = manager.restart_service(service)
            if success:
                success = manager.check_service_health(service)
        elif args.action == "check":
            success = manager.check_service_health(service)
    else:
        # Act on all services
        if args.action == "start":
            success = manager.start_all_services()
        elif args.action == "stop":
            manager.stop_all_services()
            success = True
        elif args.action == "restart":
            success = manager.restart_all_services()
        elif args.action == "check":
            success = manager.check_all_services()
    
    if success:
        logger.info(f"{args.action.capitalize()} operation completed successfully")
        return 0
    else:
        logger.error(f"{args.action.capitalize()} operation failed")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
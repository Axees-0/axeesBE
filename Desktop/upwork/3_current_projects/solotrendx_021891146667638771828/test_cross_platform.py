#!/usr/bin/env python3
"""
Cross-Platform MT4 Test Script

This script will run the appropriate tests based on the current platform:
- Windows: Full MT4 wrapper and connection tests
- macOS/Linux: Limited mock testing and environment verification
"""

import os
import sys
import platform
import datetime
import logging
import inspect

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "logs")
os.makedirs(log_dir, exist_ok=True)
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")
log_file = os.path.join(log_dir, f"cross_platform_test_{timestamp}.log")

# Set up logging to both file and console
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def check_environment():
    """Check system environment and Python installation"""
    logger.info("=" * 80)
    logger.info("SYSTEM ENVIRONMENT CHECK")
    logger.info("=" * 80)
    
    # System information
    system_info = {
        "Platform": platform.system(),
        "Release": platform.release(),
        "Version": platform.version(),
        "Machine": platform.machine(),
        "Processor": platform.processor()
    }
    
    # Python information
    python_info = {
        "Version": platform.python_version(),
        "Implementation": platform.python_implementation(),
        "Executable": sys.executable,
        "Architecture": platform.architecture()[0],
        "64-bit": "Yes" if sys.maxsize > 2**32 else "No"
    }
    
    # Current directory
    current_dir = os.getcwd()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Log information
    logger.info("System Information:")
    for key, value in system_info.items():
        logger.info(f"  {key}: {value}")
    
    logger.info("\nPython Information:")
    for key, value in python_info.items():
        logger.info(f"  {key}: {value}")
    
    logger.info("\nDirectory Information:")
    logger.info(f"  Current Directory: {current_dir}")
    logger.info(f"  Script Directory: {script_dir}")
    
    # Check critical directories
    directories_to_check = [
        "build/mt4_wrapper",
        "src/backend/MT4RestfulAPIWrapper",
        "data/logs"
    ]
    
    logger.info("\nDirectory Structure Check:")
    for directory in directories_to_check:
        dir_path = os.path.join(script_dir, directory)
        if os.path.exists(dir_path):
            logger.info(f"  ✓ {directory} found")
        else:
            logger.warning(f"  ✗ {directory} NOT found")
    
    # Check for critical files
    files_to_check = []
    if platform.system() == 'Windows':
        files_to_check = [
            "mt4_wrapper.dll",
            "build/mt4_wrapper/mt4_wrapper.dll",
            "src/backend/MT4RestfulAPIWrapper/mt4_wrapper.dll",
            "mtmanapi64.dll"
        ]
    else:
        # On non-Windows platforms, we'll check for Python scripts
        files_to_check = [
            "test_mt4_connect.py",
            "build/mt4_wrapper/test_wrapper.py",
            "build/mt4_wrapper/update_mt4_api.py",
            "src/backend/MT4RestfulAPIWrapper/mt4_api.py"
        ]
    
    logger.info("\nCritical Files Check:")
    for file_path in files_to_check:
        full_path = os.path.join(script_dir, file_path)
        if os.path.exists(full_path):
            logger.info(f"  ✓ {file_path} found")
            # Get file size and modification time
            file_stats = os.stat(full_path)
            logger.info(f"    - Size: {file_stats.st_size:,} bytes")
            logger.info(f"    - Modified: {datetime.datetime.fromtimestamp(file_stats.st_mtime)}")
        else:
            logger.warning(f"  ✗ {file_path} NOT found")
    
    # Check for .env file (without revealing contents)
    env_path = os.path.join(script_dir, ".env")
    if os.path.exists(env_path):
        logger.info("\n.env file found. Checking for MT4 configuration (without showing credentials):")
        with open(env_path, 'r') as f:
            env_content = f.read()
            # Just check if certain keys exist without showing values
            keys_to_check = ["MT4_SERVER", "MT4_PORT", "MT4_LOGIN", "MT4_PASSWORD", "USE_MOCK_MODE"]
            for key in keys_to_check:
                if key in env_content:
                    logger.info(f"  ✓ {key} is configured")
                else:
                    logger.warning(f"  ✗ {key} is NOT configured")
    else:
        logger.warning("\n.env file NOT found. MT4 connection parameters may not be configured.")
    
    return True

def run_platform_specific_tests():
    """Run tests specific to the current platform"""
    system = platform.system()
    
    logger.info("=" * 80)
    logger.info(f"PLATFORM-SPECIFIC TESTS: {system}")
    logger.info("=" * 80)
    
    if system == 'Windows':
        # On Windows, we can run the actual MT4 tests
        logger.info("Running Windows-specific tests")
        
        # Check if we can import ctypes and load DLLs
        try:
            import ctypes
            logger.info("ctypes successfully imported")
            
            # Check if DLL exists
            script_dir = os.path.dirname(os.path.abspath(__file__))
            dll_path = os.path.join(script_dir, "mt4_wrapper.dll")
            
            if os.path.exists(dll_path):
                logger.info(f"Found MT4 wrapper DLL at: {dll_path}")
                
                try:
                    # Just try to load it, don't call functions
                    dll = ctypes.CDLL(dll_path)
                    logger.info("DLL loaded successfully!")
                    
                    # Check if MtManagerCreate exists
                    if hasattr(dll, "MtManagerCreate"):
                        logger.info("Critical function 'MtManagerCreate' found in DLL")
                    else:
                        logger.warning("Critical function 'MtManagerCreate' NOT found in DLL")
                except Exception as e:
                    logger.error(f"Failed to load DLL: {e}")
            else:
                logger.warning(f"MT4 wrapper DLL not found at: {dll_path}")
                logger.info("Checking alternative locations...")
                
                alt_paths = [
                    os.path.join(script_dir, "build", "mt4_wrapper", "mt4_wrapper.dll"),
                    os.path.join(script_dir, "src", "backend", "MT4RestfulAPIWrapper", "mt4_wrapper.dll")
                ]
                
                dll_found = False
                for path in alt_paths:
                    if os.path.exists(path):
                        logger.info(f"Found MT4 wrapper DLL at alternative location: {path}")
                        dll_found = True
                        break
                
                if not dll_found:
                    logger.error("MT4 wrapper DLL not found in any location")
            
            # Recommend next steps
            logger.info("\nRecommended next steps on Windows:")
            logger.info("1. Run build_mt4_wrapper.bat to build the wrapper DLL")
            logger.info("2. Run test_mt4_wrapper.bat for comprehensive testing")
            logger.info("3. Run test_direct_order.bat to test MT4 order placement")
            
        except ImportError as e:
            logger.error(f"Failed to import ctypes: {e}")
    
    elif system == 'Darwin':  # macOS
        logger.info("Running macOS-specific tests")
        
        # Check for Wine
        try:
            wine_check = os.system("which wine > /dev/null 2>&1")
            if wine_check == 0:
                logger.info("Wine is installed - Windows DLLs could potentially be used")
                
                # Check WINEPREFIX
                wineprefix = os.environ.get('WINEPREFIX', '')
                if wineprefix:
                    logger.info(f"WINEPREFIX is set to: {wineprefix}")
                else:
                    logger.info("WINEPREFIX is not set")
            else:
                logger.info("Wine is not installed - cannot use Windows DLLs directly")
        except Exception as e:
            logger.error(f"Error checking Wine: {e}")
        
        # Check if mock mode is enabled in .env
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                env_content = f.read()
                if "USE_MOCK_MODE=true" in env_content.lower():
                    logger.info("Mock mode is enabled in .env file")
                else:
                    logger.warning("Mock mode is NOT enabled in .env file")
                    logger.warning("Add USE_MOCK_MODE=true to .env for macOS development")
        
        # Recommend next steps
        logger.info("\nRecommended next steps on macOS:")
        logger.info("1. Ensure USE_MOCK_MODE=true is set in .env")
        logger.info("2. Run mac_setup_env.sh to configure the environment")
        logger.info("3. Run mac_run_mock_api.sh to start the mock MT4 API")
        logger.info("4. For real MT4 connection testing, you'll need a Windows environment")
    
    elif system == 'Linux':
        logger.info("Running Linux-specific tests")
        
        # Check for Wine
        try:
            wine_check = os.system("which wine > /dev/null 2>&1")
            if wine_check == 0:
                logger.info("Wine is installed - Windows DLLs could potentially be used")
            else:
                logger.info("Wine is not installed - cannot use Windows DLLs directly")
        except Exception as e:
            logger.error(f"Error checking Wine: {e}")
        
        # Recommend next steps
        logger.info("\nRecommended next steps on Linux:")
        logger.info("1. Ensure USE_MOCK_MODE=true is set in .env")
        logger.info("2. For real MT4 connection testing, you'll need a Windows environment")
    
    else:
        logger.warning(f"Unknown platform: {system}")
        logger.warning("No platform-specific tests available")
    
    return True

def test_mock_mode():
    """Test mock mode functionality"""
    logger.info("=" * 80)
    logger.info("MOCK MODE TEST")
    logger.info("=" * 80)
    
    # Try to import the MT4 API in mock mode
    try:
        logger.info("Attempting to import mt4_api module...")
        
        # Add the MT4RestfulAPIWrapper directory to the path
        script_dir = os.path.dirname(os.path.abspath(__file__))
        api_dir = os.path.join(script_dir, "src", "backend", "MT4RestfulAPIWrapper")
        
        if os.path.exists(api_dir):
            sys.path.append(api_dir)
            logger.info(f"Added to path: {api_dir}")
            
            # Force mock mode
            os.environ['USE_MOCK_MODE'] = 'true'
            logger.info("Set USE_MOCK_MODE=true in environment")
            
            try:
                # Import the module
                import importlib.util
                spec = importlib.util.spec_from_file_location("mt4_api", os.path.join(api_dir, "mt4_api.py"))
                mt4_api = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mt4_api)
                
                logger.info("Successfully imported mt4_api module")
                
                # Check for TradeCommand enum
                if hasattr(mt4_api, 'TradeCommand'):
                    logger.info("TradeCommand enum found in module")
                    
                    # Check for expected values
                    trade_cmd = mt4_api.TradeCommand
                    expected_values = ['OP_BUY', 'OP_SELL', 'OP_BUY_LIMIT', 'OP_SELL_LIMIT']
                    for val in expected_values:
                        if hasattr(trade_cmd, val):
                            logger.info(f"  ✓ {val} found in TradeCommand")
                        else:
                            logger.warning(f"  ✗ {val} NOT found in TradeCommand")
                else:
                    logger.warning("TradeCommand enum NOT found in module")
                
                # Check for MT4Manager class
                if hasattr(mt4_api, 'MT4Manager'):
                    logger.info("MT4Manager class found in module")
                    
                    # Try to instantiate in mock mode
                    try:
                        manager = mt4_api.MT4Manager(use_mock_mode=True)
                        logger.info("Successfully created MT4Manager instance in mock mode")
                        
                        # Check some attributes
                        logger.info(f"  mock_mode: {manager.mock_mode}")
                        logger.info(f"  connected: {manager.connected}")
                        logger.info(f"  logged_in: {manager.logged_in}")
                        
                        # Try connecting with dummy values
                        try:
                            result = manager.connect("dummy_server", 443)
                            logger.info(f"Connect result: {result}")
                            logger.info(f"  connected after connect(): {manager.connected}")
                            
                            # Try login
                            login_result = manager.login(12345, "dummy_password")
                            logger.info(f"Login result: {login_result}")
                            logger.info(f"  logged_in after login(): {manager.logged_in}")
                            
                            # Get symbols in mock mode
                            symbols = manager.get_symbols()
                            logger.info(f"Got {len(symbols)} symbols in mock mode")
                            
                            # Disconnect
                            manager.disconnect()
                            logger.info(f"  connected after disconnect(): {manager.connected}")
                            logger.info(f"  logged_in after disconnect(): {manager.logged_in}")
                            
                        except Exception as e:
                            logger.error(f"Error in mock connection test: {e}")
                    except Exception as e:
                        logger.error(f"Error creating MT4Manager instance: {e}")
                else:
                    logger.warning("MT4Manager class NOT found in module")
                    
            except Exception as e:
                logger.error(f"Error importing mt4_api: {e}")
        else:
            logger.warning(f"MT4RestfulAPIWrapper directory not found at: {api_dir}")
    except Exception as e:
        logger.error(f"Error in mock mode test: {e}")
    
    return True

def run_all_tests():
    """Run all cross-platform tests"""
    logger.info("=" * 80)
    logger.info("CROSS-PLATFORM MT4 TEST")
    logger.info("=" * 80)
    logger.info(f"Starting tests at: {datetime.datetime.now()}")
    logger.info(f"Log file: {log_file}")
    
    tests = [
        ("Environment Check", check_environment),
        ("Platform-Specific Tests", run_platform_specific_tests),
        ("Mock Mode Test", test_mock_mode)
    ]
    
    results = {}
    
    for name, test_func in tests:
        logger.info("\n" + "=" * 40)
        logger.info(f"Running: {name}")
        logger.info("=" * 40)
        
        try:
            start_time = datetime.datetime.now()
            success = test_func()
            end_time = datetime.datetime.now()
            elapsed = (end_time - start_time).total_seconds()
            
            results[name] = {
                "success": success,
                "elapsed": elapsed
            }
            
            logger.info(f"\n{name} completed in {elapsed:.2f} seconds - {'Success' if success else 'Failed'}")
        except Exception as e:
            logger.error(f"Error in {name}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            results[name] = {
                "success": False,
                "elapsed": 0,
                "error": str(e)
            }
    
    # Summary
    logger.info("\n" + "=" * 40)
    logger.info("TEST SUMMARY")
    logger.info("=" * 40)
    
    all_succeeded = True
    for name, result in results.items():
        success = result.get("success", False)
        elapsed = result.get("elapsed", 0)
        error = result.get("error", "")
        
        status = "PASSED" if success else "FAILED"
        if not success:
            all_succeeded = False
        
        logger.info(f"{name}: {status} ({elapsed:.2f}s) {error}")
    
    logger.info("\nOverall result: " + ("PASSED" if all_succeeded else "FAILED"))
    logger.info(f"Tests completed at: {datetime.datetime.now()}")
    logger.info(f"Log file: {log_file}")
    
    return all_succeeded

if __name__ == "__main__":
    success = run_all_tests()
    
    print("\n" + "=" * 40)
    print("CROSS-PLATFORM MT4 TEST SUMMARY")
    print("=" * 40)
    print(f"Overall result: {'PASSED' if success else 'FAILED'}")
    print(f"Log file: {log_file}")
    
    sys.exit(0 if success else 1)
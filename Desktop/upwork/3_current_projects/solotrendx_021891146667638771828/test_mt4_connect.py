#!/usr/bin/env python3
"""
MT4 Connection Test

This script tests connecting to MT4 using the wrapper DLL.
"""

import os
import sys
import ctypes
from ctypes import c_int, c_char_p, c_double
import logging
import time
import datetime
import traceback
import platform

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "logs")
os.makedirs(log_dir, exist_ok=True)
timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")
log_file = os.path.join(log_dir, f"mt4_connect_test_{timestamp}.log")

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

def find_dll_path():
    """Find the MT4 wrapper DLL"""
    # First check if MT4_DLL_PATH environment variable is set
    if 'MT4_DLL_PATH' in os.environ and os.path.exists(os.environ['MT4_DLL_PATH']):
        dll_path = os.environ['MT4_DLL_PATH']
        logger.info(f"Using MT4 DLL from environment variable: {dll_path}")
        return dll_path
    
    # Check in several possible locations
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = current_dir  # Current directory is project root
    
    possible_paths = [
        # Wrapper DLL
        os.path.join(current_dir, "mt4_wrapper.dll"),
        os.path.join(current_dir, "build", "mt4_wrapper", "mt4_wrapper.dll"),
        os.path.join(current_dir, "src", "backend", "MT4RestfulAPIWrapper", "mt4_wrapper.dll"),
        
        # Direct MT4 DLLs
        os.path.join(current_dir, "mtmanapi64.dll"),
        os.path.join(current_dir, "mtmanapi.dll"),
        os.path.join(current_dir, "src", "backend", "MT4ManagerAPI", "mtmanapi64.dll"),
        os.path.join(current_dir, "src", "backend", "MT4ManagerAPI", "mtmanapi.dll"),
    ]
    
    # For Windows UNC paths
    if os.name == 'nt' and '\\\\' in current_dir:
        unc_paths = [
            r'\\Mac\Desktop\upwork\3_current_projects\solotrendx_021891146667638771828\mt4_wrapper.dll',
            r'\\Mac\Desktop\upwork\3_current_projects\solotrendx_021891146667638771828\build\mt4_wrapper\mt4_wrapper.dll',
            r'\\Mac\Desktop\upwork\3_current_projects\solotrendx_021891146667638771828\src\backend\MT4RestfulAPIWrapper\mt4_wrapper.dll',
            r'Z:\upwork\3_current_projects\solotrendx_021891146667638771828\mt4_wrapper.dll',
            r'Z:\upwork\3_current_projects\solotrendx_021891146667638771828\build\mt4_wrapper\mt4_wrapper.dll',
            r'Z:\upwork\3_current_projects\solotrendx_021891146667638771828\src\backend\MT4RestfulAPIWrapper\mt4_wrapper.dll',
        ]
        possible_paths.extend(unc_paths)
    
    # Try each path
    for path in possible_paths:
        if os.path.exists(path):
            logger.info(f"Found MT4 DLL at: {path}")
            return path
    
    logger.error("MT4 DLL not found in any location!")
    return None

def test_mt4_connect():
    """Test MT4 connection using the wrapper DLL"""
    logger.info("=" * 80)
    logger.info("MT4 CONNECTION TEST")
    logger.info("=" * 80)
    
    # System information
    logger.info(f"System: {platform.system()} {platform.release()}")
    logger.info(f"Python: {platform.python_version()} ({platform.architecture()[0]})")
    logger.info(f"Executable: {sys.executable}")
    
    # Find DLL path
    dll_path = find_dll_path()
    if not dll_path:
        logger.error("No MT4 DLL found. Cannot continue test.")
        return False
    
    # Also check if the file actually exists and is accessible
    try:
        file_size = os.path.getsize(dll_path)
        logger.info(f"DLL file size: {file_size} bytes")
        
        # Try to check the file type (basic validation for DLL)
        with open(dll_path, 'rb') as f:
            header = f.read(2)
            if header == b'MZ':
                logger.info("DLL header validation: OK (MZ signature found)")
            else:
                logger.warning(f"DLL header seems invalid: {header}")
    except Exception as e:
        logger.error(f"Error accessing DLL file: {e}")
        return False
    
    # Check if we're on Windows - MT4 DLLs only work on Windows
    if platform.system() != 'Windows':
        logger.error(f"Cannot test MT4 DLL on {platform.system()} - MT4 requires Windows")
        logger.error("This test will be skipped on non-Windows platforms")
        print(f"\nCannot test MT4 DLL on {platform.system()} - MT4 requires Windows")
        print("The test can only be run on Windows.")
        print("If you're using macOS or Linux, please run this test on a Windows machine or VM.")
        return False
        
    # Try to load the DLL
    try:
        logger.info(f"Loading DLL: {dll_path}")
        mt4_dll = ctypes.CDLL(dll_path)
        logger.info("DLL loaded successfully")
        
        # Check for the wrapper functions
        wrapper_functions = [
            "MtManagerCreate",
            "MtManagerConnect",
            "MtManagerLogin",
            "MtManagerIsConnected",
            "MtManagerIsLoggedIn",
            "MtManagerDisconnect",
            "MtManagerGetLastError",
            "MtManagerRelease"
        ]
        
        found_functions = []
        missing_functions = []
        
        for func_name in wrapper_functions:
            try:
                func = getattr(mt4_dll, func_name)
                found_functions.append(func_name)
            except AttributeError:
                missing_functions.append(func_name)
        
        if found_functions:
            logger.info(f"Found functions: {', '.join(found_functions)}")
        if missing_functions:
            logger.warning(f"Missing functions: {', '.join(missing_functions)}")
        
        # If we don't have the core functions, we can't proceed
        if "MtManagerCreate" not in found_functions or "MtManagerConnect" not in found_functions:
            logger.error("Critical functions missing from DLL. Cannot continue test.")
            return False
        
        # Set up function prototypes
        mt4_dll.MtManagerCreate.argtypes = [c_char_p]
        mt4_dll.MtManagerCreate.restype = c_int
        
        mt4_dll.MtManagerConnect.argtypes = [c_int, c_char_p, c_int, c_char_p, c_char_p]
        mt4_dll.MtManagerConnect.restype = c_int
        
        if "MtManagerLogin" in found_functions:
            mt4_dll.MtManagerLogin.argtypes = [c_int, c_int, c_char_p]
            mt4_dll.MtManagerLogin.restype = c_int
        
        if "MtManagerIsConnected" in found_functions:
            mt4_dll.MtManagerIsConnected.argtypes = [c_int]
            mt4_dll.MtManagerIsConnected.restype = c_int
        
        if "MtManagerIsLoggedIn" in found_functions:
            mt4_dll.MtManagerIsLoggedIn.argtypes = [c_int]
            mt4_dll.MtManagerIsLoggedIn.restype = c_int
        
        if "MtManagerDisconnect" in found_functions:
            mt4_dll.MtManagerDisconnect.argtypes = [c_int]
        
        if "MtManagerGetLastError" in found_functions:
            mt4_dll.MtManagerGetLastError.argtypes = [c_int]
            mt4_dll.MtManagerGetLastError.restype = c_char_p
        
        if "MtManagerRelease" in found_functions:
            mt4_dll.MtManagerRelease.argtypes = [c_int]
        
        # Create a manager instance
        logger.info("Creating MT4 Manager instance")
        handle = mt4_dll.MtManagerCreate(None)
        
        if handle <= 0:
            logger.error(f"Failed to create MT4 Manager instance: handle={handle}")
            
            # Try to get error message
            if "MtManagerGetLastError" in found_functions:
                error_msg = mt4_dll.MtManagerGetLastError(handle)
                if error_msg:
                    logger.error(f"Error message: {error_msg.decode('utf-8')}")
            
            return False
        
        logger.info(f"MT4 Manager instance created: handle={handle}")
        
        # Connect to server (if credentials are available)
        server = os.environ.get('MT4_SERVER', '')
        port = int(os.environ.get('MT4_PORT', '443'))
        login = os.environ.get('MT4_LOGIN', '')
        password = os.environ.get('MT4_PASSWORD', '')
        domain = os.environ.get('MT4_DOMAIN', '')
        
        # Mask password in logs
        password_mask = '*' * len(password) if password else ''
        logger.info(f"Server info: {server}:{port} Login: {login} Password: {password_mask} Domain: {domain}")
        
        if server and login and password:
            logger.info(f"Connecting to server: {server}:{port}")
            
            # Prepare connection string with domain if provided
            connection_string = server
            if domain:
                # Format: server:port\\domain
                connection_string = f"{server}\\{domain}"
                logger.info(f"Using domain in connection string: {connection_string}")
            
            # Connect to server
            try:
                logger.info(f"Connecting with: Server={connection_string}, Port={port}, Login={login}")
                result = mt4_dll.MtManagerConnect(
                    handle,
                    connection_string.encode('utf-8'),
                    port,
                    login.encode('utf-8'),
                    password.encode('utf-8')
                )
                
                if result != 0:
                    logger.error(f"Connection failed: result={result}")
                    
                    # Try to get error message
                    if "MtManagerGetLastError" in found_functions:
                        error_msg = mt4_dll.MtManagerGetLastError(handle)
                        if error_msg:
                            logger.error(f"Error message: {error_msg.decode('utf-8')}")
                    
                    # Clean up before returning
                    if "MtManagerRelease" in found_functions:
                        mt4_dll.MtManagerRelease(handle)
                    
                    return False
                
                logger.info("Connection successful")
                
                # Check connection status
                if "MtManagerIsConnected" in found_functions:
                    connected = mt4_dll.MtManagerIsConnected(handle)
                    logger.info(f"IsConnected check: {connected == 1}")
                
                # Now login to start the session
                if "MtManagerLogin" in found_functions:
                    logger.info(f"Logging in with login ID: {login}")
                    login_id = int(login)
                    login_result = mt4_dll.MtManagerLogin(handle, login_id, password.encode('utf-8'))
                    
                    if login_result != 0:
                        logger.error(f"Login failed: result={login_result}")
                        
                        # Try to get error message
                        if "MtManagerGetLastError" in found_functions:
                            error_msg = mt4_dll.MtManagerGetLastError(handle)
                            if error_msg:
                                logger.error(f"Error message: {error_msg.decode('utf-8')}")
                    else:
                        logger.info("Login successful")
                        
                        # Check login status
                        if "MtManagerIsLoggedIn" in found_functions:
                            logged_in = mt4_dll.MtManagerIsLoggedIn(handle)
                            logger.info(f"IsLoggedIn check: {logged_in == 1}")
                
                # Disconnect when done
                if "MtManagerDisconnect" in found_functions:
                    logger.info("Disconnecting from server")
                    mt4_dll.MtManagerDisconnect(handle)
                    
                    # Check connection status again
                    if "MtManagerIsConnected" in found_functions:
                        connected = mt4_dll.MtManagerIsConnected(handle)
                        logger.info(f"IsConnected check after disconnect: {connected == 1}")
            except Exception as e:
                logger.error(f"Error during connection test: {e}")
                logger.error(traceback.format_exc())
                
                # Clean up before returning
                if "MtManagerRelease" in found_functions:
                    mt4_dll.MtManagerRelease(handle)
                
                return False
        else:
            logger.warning("MT4 server credentials not found. Skipping connection test.")
        
        # Clean up
        if "MtManagerRelease" in found_functions:
            logger.info("Releasing MT4 Manager instance")
            mt4_dll.MtManagerRelease(handle)
        
        logger.info("MT4 connection test completed successfully")
        return True
    
    except Exception as e:
        logger.error(f"Error loading or using DLL: {e}")
        logger.error(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = test_mt4_connect()
    if success:
        logger.info("Test PASSED")
        print(f"\nTest PASSED. See log file for details: {log_file}")
        sys.exit(0)
    else:
        logger.error("Test FAILED")
        print(f"\nTest FAILED. See log file for details: {log_file}")
        sys.exit(1)
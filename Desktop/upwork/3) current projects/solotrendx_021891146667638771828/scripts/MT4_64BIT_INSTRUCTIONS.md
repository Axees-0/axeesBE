# MT4 64-bit Integration Instructions

This guide will help you resolve the architecture mismatch between 64-bit Python and 32-bit MT4 DLLs.

## The Problem

You're experiencing this error:
```
Failed to initialize MT4 Manager API DLL: [WinError 193] %1 is not a valid Win32 application
```

This happens because:
1. You're running 64-bit Python (3.13.2)
2. But trying to load a 32-bit DLL (mtmanapi.dll)

Windows cannot load 32-bit DLLs in 64-bit processes (or vice versa). This is a fundamental architectural limitation.

## Solution: Use the 64-bit DLL

To fix this issue, follow these steps:

1. **Copy the 64-bit DLL**
   - Run `copy_mt4_dll64.bat` to copy mtmanapi64.dll to the required locations
   - This script will look for the 64-bit DLL in standard MT4 installation directories
   - If not found, you'll need to manually locate and copy it

2. **Verify the updated code**
   - The `_find_dll_path()` method in mt4_api.py has been updated to:
     - Detect Python architecture (32-bit vs 64-bit)
     - Prioritize mtmanapi64.dll when using 64-bit Python
     - Search multiple paths including Parallels paths
     - Fall back to 32-bit DLL only if necessary

3. **Restart all services**
   - Run `start_all_services.bat` to restart all components
   - The MT4 REST API should now correctly load the 64-bit DLL

## Verification

To verify the fix:
1. Run the services and check the logs
2. Look for: "Detected 64-bit Python, prioritizing 64-bit DLL (mtmanapi64.dll)"
3. And: "Found mtmanapi64.dll at [path]"
4. The error message about "not a valid Win32 application" should be gone

## Alternative Solutions

If you cannot obtain the 64-bit DLL:

1. **Use 32-bit Python instead**
   - Create a new virtual environment with 32-bit Python
   - Install all requirements
   - Configure services to use this environment

2. **Continue using mock mode**
   - Set USE_MOCK_MODE=true in your environment
   - The system will simulate MT4 trading functionality

## Troubleshooting

If you still encounter issues:

1. Run `check_python_architecture.bat` to confirm Python is 64-bit
2. Run `check_dll_architecture_simple.bat` to verify DLL availability
3. Check logs in data/logs/ directory for detailed error messages
4. Ensure MT4 terminal is properly installed and running
5. Check that login credentials are correct in your .env file
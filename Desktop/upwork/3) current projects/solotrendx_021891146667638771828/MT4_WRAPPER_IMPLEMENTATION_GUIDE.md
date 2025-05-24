# MT4 Manager API C Wrapper Implementation Guide

This document provides a step-by-step guide to create a C wrapper DLL that will bridge the gap between your Python code and the MT4 Manager API.

## Understanding the Problem

Your Python code expects the following functions in the DLL:
- `MtManagerCreate`
- `MtManagerConnect`
- `MtManagerLogin`
- etc.

However, the MT4 Manager API is a C++ class-based API that doesn't export these functions directly. Instead, it uses:
- `CManagerFactory` class
- `CManagerInterface` class
- Factory pattern for object creation

## Step 1: Set Up Development Environment

1. **Install Visual Studio**
   - Download Visual Studio Community edition from https://visualstudio.microsoft.com/
   - During installation, select "Desktop development with C++"
   - Ensure Windows SDK is included

2. **Prepare Working Directory**
   - Create a new folder for the wrapper project
   - Copy MT4 Manager API files:
     - MT4ManagerAPI.h
     - mtmanapi64.dll (for 64-bit Python)

## Step 2: Create Visual Studio Project

1. **Create a New Project**
   - Open Visual Studio
   - File → New → Project
   - Select "Dynamic-Link Library (DLL)" under Visual C++
   - Name: "MT4ManagerWrapper"

2. **Configure Project Settings**
   - Right-click project → Properties
   - Configuration: Release
   - Platform: x64 (for 64-bit Python)
   - C/C++ → Code Generation → Runtime Library: "Multi-threaded DLL (/MD)"
   - C/C++ → Advanced → Compile As: "Compile as C++ Code (/TP)"

## Step 3: Create Header File

Create a file named `MT4ManagerWrapper.h` with this content:

```cpp
#pragma once

#ifdef MT4MANAGERAPI_EXPORTS
#define MT4MANAGERAPI_API __declspec(dllexport)
#else
#define MT4MANAGERAPI_API __declspec(dllimport)
#endif

// These are the functions your Python code is expecting
extern "C" {
    // Core functions
    MT4MANAGERAPI_API void* MtManagerCreate();
    MT4MANAGERAPI_API int MtManagerConnect(void* manager, const char* server, int port);
    MT4MANAGERAPI_API int MtManagerLogin(void* manager, int login, const char* password);
    MT4MANAGERAPI_API int MtManagerDisconnect(void* manager);
    
    // Data access functions
    MT4MANAGERAPI_API int MtManagerGetUserInfo(void* manager, int login, void* user_record);
    MT4MANAGERAPI_API int MtManagerGetSymbolInfo(void* manager, const char* symbol, void* symbol_info);
    MT4MANAGERAPI_API int MtManagerGetTrades(void* manager, int login, void* trades, int total);
    MT4MANAGERAPI_API int MtManagerTradeTransaction(void* manager, void* trade_record);
    
    // Additional function for cleanup
    MT4MANAGERAPI_API void MtManagerRelease(void* manager);
}
```

## Step 4: Create Implementation File

Create a file named `MT4ManagerWrapper.cpp` with this content:

```cpp
#include "MT4ManagerWrapper.h"
#include "MT4ManagerAPI.h"
#include <windows.h>
#include <map>
#include <string>

// Global factory
static CManagerFactory g_factory;
// Map of handles to manager instances
static std::map<intptr_t, CManagerInterface*> g_managers;
// Next available handle
static intptr_t g_next_handle = 1;

// Initialize/cleanup Winsock
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpvReserved) {
    switch (fdwReason) {
        case DLL_PROCESS_ATTACH:
            g_factory.WinsockStartup();
            break;
        case DLL_PROCESS_DETACH:
            // Clean up any remaining manager instances
            for (auto& pair : g_managers) {
                if (pair.second) {
                    pair.second->Disconnect();
                    pair.second->Release();
                }
            }
            g_managers.clear();
            g_factory.WinsockCleanup();
            break;
    }
    return TRUE;
}

// Implementation of exported functions
extern "C" {

    MT4MANAGERAPI_API void* MtManagerCreate() {
        if (!g_factory.IsValid()) 
            return nullptr;
        
        CManagerInterface* manager = g_factory.Create(ManAPIVersion);
        if (manager) {
            intptr_t handle = g_next_handle++;
            g_managers[handle] = manager;
            return (void*)handle;
        }
        return nullptr;
    }
    
    MT4MANAGERAPI_API int MtManagerConnect(void* manager_handle, const char* server, int port) {
        intptr_t handle = (intptr_t)manager_handle;
        if (g_managers.find(handle) == g_managers.end())
            return RET_ERROR;
            
        // The MT4 Manager API Connect() doesn't use the port parameter
        // We'll need to append it to the server string if it's not standard
        std::string server_with_port = server;
        if (port != 443) { // If not default port
            server_with_port += ":" + std::to_string(port);
        }
        
        return g_managers[handle]->Connect(server_with_port.c_str());
    }
    
    MT4MANAGERAPI_API int MtManagerLogin(void* manager_handle, int login, const char* password) {
        intptr_t handle = (intptr_t)manager_handle;
        if (g_managers.find(handle) == g_managers.end())
            return RET_ERROR;
            
        return g_managers[handle]->Login(login, password);
    }
    
    MT4MANAGERAPI_API int MtManagerDisconnect(void* manager_handle) {
        intptr_t handle = (intptr_t)manager_handle;
        if (g_managers.find(handle) == g_managers.end())
            return RET_ERROR;
            
        g_managers[handle]->Disconnect();
        return RET_OK;
    }
    
    MT4MANAGERAPI_API int MtManagerGetUserInfo(void* manager_handle, int login, void* user_record) {
        intptr_t handle = (intptr_t)manager_handle;
        if (g_managers.find(handle) == g_managers.end())
            return RET_ERROR;
            
        return g_managers[handle]->UserRecordGet(login, (UserRecord*)user_record);
    }
    
    MT4MANAGERAPI_API int MtManagerGetSymbolInfo(void* manager_handle, const char* symbol, void* symbol_info) {
        intptr_t handle = (intptr_t)manager_handle;
        if (g_managers.find(handle) == g_managers.end())
            return RET_ERROR;
            
        return g_managers[handle]->SymbolInfoGet(symbol, (SymbolInfo*)symbol_info);
    }
    
    MT4MANAGERAPI_API int MtManagerGetTrades(void* manager_handle, int login, void* trades, int max_count) {
        intptr_t handle = (intptr_t)manager_handle;
        if (g_managers.find(handle) == g_managers.end())
            return RET_ERROR;
            
        int total = 0;
        TradeRecord* records = nullptr;
        
        if (login > 0) {
            records = g_managers[handle]->TradesGetByLogin(login, nullptr, &total);
        } else {
            records = g_managers[handle]->TradesGet(&total);
        }
        
        if (!records)
            return 0;
            
        // Copy records to the provided buffer
        int count = max_count < total ? max_count : total;
        if (count > 0 && trades) {
            memcpy(trades, records, count * sizeof(TradeRecord));
        }
        
        // Free the records
        g_managers[handle]->MemFree(records);
        
        return count;
    }
    
    MT4MANAGERAPI_API int MtManagerTradeTransaction(void* manager_handle, void* trade_record) {
        intptr_t handle = (intptr_t)manager_handle;
        if (g_managers.find(handle) == g_managers.end())
            return RET_ERROR;
            
        return g_managers[handle]->TradeTransaction((TradeTransInfo*)trade_record);
    }
    
    MT4MANAGERAPI_API void MtManagerRelease(void* manager_handle) {
        intptr_t handle = (intptr_t)manager_handle;
        if (g_managers.find(handle) == g_managers.end())
            return;
            
        g_managers[handle]->Disconnect();
        g_managers[handle]->Release();
        g_managers.erase(handle);
    }
}
```

## Step 5: Create Import Library for MT4 Manager API

1. **Create a .def File**
   - Create a file named `mtmanapi64.def`
   - This file will define the exports from the original DLL
   - Use the following command:
   ```
   dumpbin /exports mtmanapi64.dll > exports.txt
   echo LIBRARY mtmanapi64.dll > mtmanapi64.def
   echo EXPORTS >> mtmanapi64.def
   ```
   - Parse exports.txt and add each export to the .def file
   
2. **Create the Import Library**
   ```
   lib /def:mtmanapi64.def /out:mtmanapi64.lib /machine:x64
   ```

3. **Add the Library to the Project**
   - Project → Properties → Linker → Input → Additional Dependencies
   - Add "mtmanapi64.lib"
   - Project → Properties → Linker → General → Additional Library Directories
   - Add the directory containing mtmanapi64.lib

## Step 6: Build the DLL

1. **Build Solution**
   - Build → Build Solution (F7)
   - Verify the DLL is created in the output directory (typically x64/Release)

2. **Copy the DLL**
   - Copy MT4ManagerWrapper.dll and MT4ManagerWrapper.lib to your project directory
   - Also ensure mtmanapi64.dll is available in the same location or system path

## Step 7: Modify Python Code

1. **Update Python Wrapper**
   - Modify `mt4_api.py` to look for the new wrapper DLL

```python
def _find_dll_path(self):
    """Find the MT4 Manager API Wrapper DLL"""
    import os
    import struct
    
    # Determine if we're running 64-bit Python
    is_64bit_python = struct.calcsize("P") == 8
    
    # Define DLL name
    wrapper_dll = "MT4ManagerWrapper.dll"
    
    # Define search paths
    search_paths = [
        os.getcwd(),  # Current directory
        os.path.dirname(os.path.abspath(__file__)),  # Script directory
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")),  # Project root
    ]
    
    for base_path in search_paths:
        dll_path = os.path.join(base_path, wrapper_dll)
        if os.path.exists(dll_path):
            logger.info(f"Found MT4 Manager Wrapper DLL at {dll_path}")
            return dll_path
    
    logger.warning("MT4 Manager Wrapper DLL not found")
    return wrapper_dll  # Default fallback
```

## Step 8: Create a Test Script

Create a file named `test_wrapper.py` with this content:

```python
import os
import sys
import ctypes
from pathlib import Path

# Add path to import our module
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir))

# Import our module
from src.backend.MT4RestfulAPIWrapper.mt4_api import MT4Manager

# Test the wrapper
def test_wrapper():
    print("Testing MT4 Manager Wrapper...")
    
    # Create manager instance with real mode
    manager = MT4Manager(use_mock_mode=False)
    
    # Test connection
    server = "localhost"
    port = 443
    print(f"Connecting to {server}:{port}...")
    if manager.connect(server, port):
        print("Connection successful")
        
        # Test login
        login = 80000300  # Use your actual MT4 login
        password = "password"  # Use your actual MT4 password
        print(f"Logging in with {login}...")
        if manager.login(login, password):
            print("Login successful")
            
            # Test server status
            print("Connected:", manager.connected)
            print("Logged in:", manager.logged_in)
            
            # Disconnect
            manager.disconnect()
            print("Disconnected")
        else:
            print("Login failed")
    else:
        print("Connection failed")

if __name__ == "__main__":
    test_wrapper()
```

## Step 9: Debug and Test

1. **Check DLL Dependencies**
   - Use Dependency Walker to verify all required DLLs are available
   - Ensure the original MT4 Manager API DLL is in the path

2. **Run Test Script**
   - Execute the test script to verify the wrapper works
   - Check for any errors in loading the DLL or calling functions

3. **Debug Issues**
   - If there are problems, run Visual Studio with debugging
   - Set breakpoints in your C++ code to trace issues

## Step 10: Create Installation Batch Script

Create a file named `install_wrapper.bat` with this content:

```batch
@echo off
echo Installing MT4 Manager Wrapper...

set PROJECT_ROOT=%~dp0
set WRAPPER_DLL=%PROJECT_ROOT%MT4ManagerWrapper.dll
set MT4_API_DIR=%PROJECT_ROOT%src\backend\MT4RestfulAPIWrapper

echo Copying wrapper DLL to Python directory...
copy /Y "%WRAPPER_DLL%" "%MT4_API_DIR%\"
copy /Y "%WRAPPER_DLL%" "%PROJECT_ROOT%\"

echo Ensuring MT4 Manager API DLL is available...
if exist "%MT4_API_DIR%\mtmanapi64.dll" (
    echo MT4 Manager API DLL already in place.
) else (
    echo WARNING: MT4 Manager API DLL not found in target directory.
    echo Please run copy_mt4_dll64.bat first.
)

echo Installation complete.
echo Please restart your application to use the wrapper.
pause
```

## Summary

This implementation provides a C-style wrapper around the C++ MT4 Manager API. The wrapper:

1. Creates a bridge between Python's ctypes expectations and the C++ class-based API
2. Manages MT4 Manager API instances using a handle-based approach
3. Translates function calls to the appropriate C++ method calls
4. Provides proper memory management and cleanup

By following this guide, you'll be able to create a DLL that exposes the functions your Python code expects, allowing it to communicate with the real MT4 Manager API without significant changes to your Python code.
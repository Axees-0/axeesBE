//+------------------------------------------------------------------+
//|                                       MT4 Manager API C Wrapper |
//+------------------------------------------------------------------+
// This wrapper provides C functions to access the MT4 Manager API from Python
// using ctypes. It encapsulates the C++ Manager API and exposes simple C functions.

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <map>
#include <string>
#include <mutex>
#include "mt4_wrapper.h"

// MT4 Manager API includes
#include "MT4Manager.h"

// Manager instances map and mutex for thread safety
static std::map<MTMANAGER_HANDLE, MT4Manager*> g_managers;
static std::mutex g_mutex;
static int g_next_handle = 1;
static char g_last_error[1024] = {0};

// Helper function to set the last error
static void SetLastError(const char* error) {
    std::lock_guard<std::mutex> lock(g_mutex);
    strncpy(g_last_error, error, sizeof(g_last_error) - 1);
    g_last_error[sizeof(g_last_error) - 1] = '\0';
}

// Create a new manager instance
extern "C" MT4_WRAPPER_API MTMANAGER_HANDLE MtManagerCreate(const char* path) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Create a new MT4Manager instance
    MT4Manager* manager = new MT4Manager();
    
    // Check if the instance is valid
    if (!manager->isValid()) {
        delete manager;
        SetLastError("Failed to create MT4Manager instance");
        return MT4_ERROR;
    }
    
    // Add to map and assign a handle
    int handle = g_next_handle++;
    g_managers[handle] = manager;
    
    return handle;
}

// Connect to MT4 server
extern "C" MT4_WRAPPER_API int MtManagerConnect(MTMANAGER_HANDLE handle, const char* server, int port, const char* login, const char* password) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return MT4_ERROR;
    }
    
    MT4Manager* manager = it->second;
    std::string server_with_port = server;
    
    // Append port if not already in server string
    if (port != 0 && server_with_port.find(":") == std::string::npos) {
        server_with_port += ":" + std::to_string(port);
    }
    
    // Connect to server
    if (!manager->connect(server_with_port.c_str())) {
        SetLastError(manager->getLastError());
        return MT4_ERROR;
    }
    
    return MT4_OK;
}

// Login to MT4 server
extern "C" MT4_WRAPPER_API int MtManagerLogin(MTMANAGER_HANDLE handle, int login, const char* password) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return MT4_ERROR;
    }
    
    MT4Manager* manager = it->second;
    
    // Login to server
    if (!manager->login(login, password)) {
        SetLastError(manager->getLastError());
        return MT4_ERROR;
    }
    
    return MT4_OK;
}

// Check if connected
extern "C" MT4_WRAPPER_API int MtManagerIsConnected(MTMANAGER_HANDLE handle) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return 0;
    }
    
    MT4Manager* manager = it->second;
    return manager->isConnected() ? 1 : 0;
}

// Check if logged in
extern "C" MT4_WRAPPER_API int MtManagerIsLoggedIn(MTMANAGER_HANDLE handle) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return 0;
    }
    
    MT4Manager* manager = it->second;
    return manager->isLoggedIn() ? 1 : 0;
}

// Disconnect from MT4 server
extern "C" MT4_WRAPPER_API void MtManagerDisconnect(MTMANAGER_HANDLE handle) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return;
    }
    
    MT4Manager* manager = it->second;
    manager->disconnect();
}

// Get server time
extern "C" MT4_WRAPPER_API int MtManagerGetServerTime(MTMANAGER_HANDLE handle) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return 0;
    }
    
    MT4Manager* manager = it->second;
    return manager->getServerTime();
}

// Place an order
extern "C" MT4_WRAPPER_API int MtManagerPlaceOrder(MTMANAGER_HANDLE handle, int login, const char* symbol, int cmd, double volume, double price, double sl, double tp, const char* comment) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return 0;
    }
    
    MT4Manager* manager = it->second;
    
    // Convert from our constants to MT4 constants if needed
    int mt4_cmd = cmd;
    
    // Place order
    int ticket = manager->openTrade(login, symbol, mt4_cmd, volume, price, sl, tp, comment);
    
    if (ticket == 0) {
        SetLastError(manager->getLastError());
    }
    
    return ticket;
}

// Get margin level
extern "C" MT4_WRAPPER_API int MtManagerGetMarginLevel(MTMANAGER_HANDLE handle, int login, double* balance, double* equity, double* margin, double* free_margin, double* margin_level) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return MT4_ERROR;
    }
    
    MT4Manager* manager = it->second;
    
    // Get margin level
    if (!manager->getMarginLevel(login, *balance, *equity, *margin, *free_margin, *margin_level)) {
        SetLastError(manager->getLastError());
        return MT4_ERROR;
    }
    
    return MT4_OK;
}

// Get last error
extern "C" MT4_WRAPPER_API const char* MtManagerGetLastError(MTMANAGER_HANDLE handle) {
    return g_last_error;
}

// Get online users count
extern "C" MT4_WRAPPER_API int MtManagerGetOnlineCount(MTMANAGER_HANDLE handle) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return 0;
    }
    
    MT4Manager* manager = it->second;
    return manager->getOnlineUsersCount();
}

// Check if user is online
extern "C" MT4_WRAPPER_API int MtManagerIsUserOnline(MTMANAGER_HANDLE handle, int login) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        SetLastError("Invalid manager handle");
        return 0;
    }
    
    MT4Manager* manager = it->second;
    return manager->isUserOnline(login) ? 1 : 0;
}

// Release manager instance
extern "C" MT4_WRAPPER_API void MtManagerRelease(MTMANAGER_HANDLE handle) {
    std::lock_guard<std::mutex> lock(g_mutex);
    
    // Find the manager instance
    auto it = g_managers.find(handle);
    if (it == g_managers.end()) {
        return;
    }
    
    // Clean up
    delete it->second;
    g_managers.erase(it);
}
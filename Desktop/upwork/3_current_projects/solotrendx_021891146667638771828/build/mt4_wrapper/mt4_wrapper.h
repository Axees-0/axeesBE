#ifndef MT4_WRAPPER_H
#define MT4_WRAPPER_H

#ifdef __cplusplus
extern "C" {
#endif

#define MT4_WRAPPER_API __declspec(dllexport)

// Manager handle type (just an integer ID)
typedef int MTMANAGER_HANDLE;

// Error codes
#define MT4_OK 0
#define MT4_ERROR -1

// Trade operation types - Note: These are now just constants for Python
// DO NOT define as macros to avoid conflicts with MT4ManagerAPI.h
enum {
    MT4W_OP_BUY = 0,       // Buy
    MT4W_OP_SELL = 1,      // Sell
    MT4W_OP_BUY_LIMIT = 2, // Buy Limit pending order
    MT4W_OP_SELL_LIMIT = 3, // Sell Limit pending order
    MT4W_OP_BUY_STOP = 4,  // Buy Stop pending order
    MT4W_OP_SELL_STOP = 5, // Sell Stop pending order
    MT4W_OP_BALANCE = 6,   // Balance
    MT4W_OP_CREDIT = 7     // Credit
};

// Create manager instance
MT4_WRAPPER_API MTMANAGER_HANDLE MtManagerCreate(const char* path);

// Connect to MT4 server
MT4_WRAPPER_API int MtManagerConnect(MTMANAGER_HANDLE handle, const char* server, int port, const char* login, const char* password);

// Login to MT4 server
MT4_WRAPPER_API int MtManagerLogin(MTMANAGER_HANDLE handle, int login, const char* password);

// Check if connected
MT4_WRAPPER_API int MtManagerIsConnected(MTMANAGER_HANDLE handle);

// Check if logged in
MT4_WRAPPER_API int MtManagerIsLoggedIn(MTMANAGER_HANDLE handle);

// Disconnect from MT4 server
MT4_WRAPPER_API void MtManagerDisconnect(MTMANAGER_HANDLE handle);

// Get server time
MT4_WRAPPER_API int MtManagerGetServerTime(MTMANAGER_HANDLE handle);

// Place an order
MT4_WRAPPER_API int MtManagerPlaceOrder(MTMANAGER_HANDLE handle, int login, const char* symbol, int cmd, double volume, double price, double sl, double tp, const char* comment);

// Get margin level
MT4_WRAPPER_API int MtManagerGetMarginLevel(MTMANAGER_HANDLE handle, int login, double* balance, double* equity, double* margin, double* free_margin, double* margin_level);

// Get last error message
MT4_WRAPPER_API const char* MtManagerGetLastError(MTMANAGER_HANDLE handle);

// Get online users count
MT4_WRAPPER_API int MtManagerGetOnlineCount(MTMANAGER_HANDLE handle);

// Check if user is online
MT4_WRAPPER_API int MtManagerIsUserOnline(MTMANAGER_HANDLE handle, int login);

// Release manager instance
MT4_WRAPPER_API void MtManagerRelease(MTMANAGER_HANDLE handle);

#ifdef __cplusplus
}
#endif

#endif // MT4_WRAPPER_H
# Connecting to Live MT4 Terminal

This document provides step-by-step instructions for connecting the MT4 REST API to a live MT4 terminal for real trading operations.

## Prerequisites

1. **Windows Environment**:
   - You must use a Windows system
   - MT4 Manager API works only on Windows

2. **MT4 Terminal**:
   - MT4 terminal installed and running
   - Manager API enabled (check with your broker)
   - Valid manager login credentials

3. **Required Files**:
   - `mtmanapi.dll` available in the correct location
   - Python environment properly set up

## Configuration Steps

### 1. Ensure DLL Files Are Properly Located

The MT4 Manager API requires the `mtmanapi.dll` file to interact with the MT4 terminal. This file should be in the `src/backend/MT4RestfulAPIWrapper` directory.

To ensure this:
```batch
copy "src\backend\MT4ManagerAPI\mtmanapi.dll" "src\backend\MT4RestfulAPIWrapper\"
```

### 2. Set Environment Variables

Set these environment variables before starting the MT4 REST API:

```batch
SET USE_MOCK_MODE=false
SET MT4_SERVER=localhost
SET MT4_PORT=443
SET MT4_LOGIN=your_manager_login_id
SET MT4_PASSWORD=your_manager_password
```

Replace `your_manager_login_id` and `your_manager_password` with your actual MT4 manager credentials.

### 3. Start the MT4 Terminal

Make sure your MT4 terminal is running before starting the MT4 REST API. The API will attempt to connect to the terminal at the address specified by `MT4_SERVER` and `MT4_PORT`.

### 4. Start the MT4 REST API

```batch
python src\backend\MT4RestfulAPIWrapper\mt4_rest_api_implementation.py
```

### 5. Test the Connection

Run the direct order test to verify the connection is working:

```batch
test_direct_order.bat
```

## Troubleshooting

### Common Issues

1. **"Failed to initialize MT4 Manager API DLL"**
   - Check that `mtmanapi.dll` is in the correct location
   - Run: `copy "src\backend\MT4ManagerAPI\mtmanapi.dll" "src\backend\MT4RestfulAPIWrapper\"`

2. **"Failed to connect to MT4 server"**
   - Ensure MT4 terminal is running
   - Verify `MT4_SERVER` and `MT4_PORT` settings
   - Check that the terminal allows API connections

3. **"Failed to login to MT4 server"**
   - Verify manager credentials (`MT4_LOGIN` and `MT4_PASSWORD`)
   - Confirm that your account has manager access

4. **API Running in Mock Mode When It Shouldn't**
   - Check that `USE_MOCK_MODE` is set to `false`
   - Verify that you're running on Windows (API falls back to mock mode on non-Windows platforms)

## Testing Real Trading

1. **Start Small**: Begin with minimal lot sizes (0.01) to verify functionality
2. **Use Demo Accounts**: Test on demo accounts before using real money
3. **Verify Orders**: Check that orders appear in the MT4 terminal
4. **Confirm Details**: Verify symbol, price, volume, and other parameters

## Security Considerations

1. **Manager Credentials**: Protect your manager login credentials
2. **API Access**: Limit access to the MT4 REST API to trusted sources
3. **Request Validation**: Verify all trading requests before execution
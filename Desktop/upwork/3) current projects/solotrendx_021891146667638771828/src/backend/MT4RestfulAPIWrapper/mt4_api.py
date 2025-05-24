"""
MT4 Manager API Python Wrapper

This module provides a Python wrapper around the MT4 Manager API DLL.
It supports both real MT4 API and mock mode for development.
"""

import os
import sys
import logging
import time
import random
import enum
from typing import Dict, List, Optional, Union, Any
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# TradeCommand Enum for order types
class TradeCommand(enum.IntEnum):
    OP_BUY = 0
    OP_SELL = 1
    OP_BUY_LIMIT = 2
    OP_SELL_LIMIT = 3
    OP_BUY_STOP = 4
    OP_SELL_STOP = 5
    OP_BALANCE = 6
    OP_CREDIT = 7

class MT4Manager:
    """
    Python wrapper for MT4 Manager API.
    Supports both real MT4 API (via DLL) and mock mode for development.
    """
    
    def __init__(self, use_mock_mode: bool = False, dll_path: str = None):
        """
        Initialize the MT4 Manager API wrapper.
        
        Args:
            use_mock_mode: Whether to use mock mode (True) or real MT4 API (False)
            dll_path: Path to the MT4 Manager API DLL file
        """
        self.mock_mode = use_mock_mode
        self.connected = False
        self.logged_in = False
        self.server = ""
        self.port = 0
        self.login_number = 0  # Renamed from login to avoid conflict with login method
        self.password = ""
        self.dll_path = dll_path or self._find_dll_path()
        
        
        # Mocked data for development
        self._mock_users = []
        self._mock_trades = []
        self._mock_symbols = []
        
        if self.mock_mode:
            logger.info("MT4 Manager running in MOCK mode")
            self._initialize_mock_data()
        else:
            logger.info("MT4 Manager running in REAL mode")
            self._initialize_dll()
            
    def _find_dll_path(self):
        """Find the MT4 Manager API DLL in various locations, prioritizing 64-bit DLL for 64-bit Python"""
        import os
        import struct
        import platform
        
        # Determine if we're running 64-bit Python
        is_64bit_python = struct.calcsize("P") == 8
        
        # Define root project path for absolute referencing
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        
        # Define DLL file names based on Python architecture
        if is_64bit_python:
            logger.info("Detected 64-bit Python, prioritizing 64-bit DLL (mtmanapi64.dll)")
            primary_dll = "mtmanapi64.dll"
            fallback_dll = "mtmanapi.dll"
        else:
            logger.info("Detected 32-bit Python, using 32-bit DLL (mtmanapi.dll)")
            primary_dll = "mtmanapi.dll"
            fallback_dll = None  # No fallback for 32-bit
        
        # Define search paths in order of priority
        search_paths = [
            # Current working directory
            os.getcwd(),
            
            # Script directory
            os.path.dirname(os.path.abspath(__file__)),
            
            # MT4ManagerAPI directory
            os.path.join(project_root, "src", "backend", "MT4ManagerAPI"),
            
            # Project root
            project_root,
            
            # Parallels-specific paths (if running in Parallels)
            "\\\\Mac\\Home\\Desktop\\upwork\\3) current projects\\solotrendx_021891146667638771828",
            "\\\\Mac\\Home\\Desktop\\upwork\\3) current projects\\solotrendx_021891146667638771828\\src\\backend\\MT4RestfulAPIWrapper",
            "\\\\Mac\\Home\\Desktop\\upwork\\3) current projects\\solotrendx_021891146667638771828\\src\\backend\\MT4ManagerAPI"
        ]
        
        # First try to find primary DLL
        for base_path in search_paths:
            dll_path = os.path.join(base_path, primary_dll) if base_path else primary_dll
            if os.path.exists(dll_path):
                logger.info(f"Found {primary_dll} at {dll_path}")
                return dll_path
        
        # If primary DLL not found and we have a fallback, try fallback
        if fallback_dll:
            logger.warning(f"{primary_dll} not found, trying fallback DLL ({fallback_dll})")
            for base_path in search_paths:
                dll_path = os.path.join(base_path, fallback_dll) if base_path else fallback_dll
                if os.path.exists(dll_path):
                    logger.info(f"Found {fallback_dll} at {dll_path}")
                    return dll_path
        
        # If still nothing found, return default
        logger.warning("MT4 Manager API DLL not found in any of the standard locations")
        return primary_dll  # Default fallback to current directory
    
    def _initialize_dll(self):
        """Initialize the MT4 Manager API DLL"""
        if sys.platform != "win32":
            raise RuntimeError("MT4 Manager API only works on Windows")
        
        try:
            # Import ctypes for DLL interaction
            import ctypes
            from ctypes import c_int, c_uint, c_ulong, c_double, c_char_p, c_void_p, POINTER, Structure, c_long, c_wchar_p, create_string_buffer, byref
            
            # Try to load the DLL
            if os.path.exists(self.dll_path):
                logger.info(f"Loading MT4 Manager API DLL from {self.dll_path}")
                self.dll = ctypes.cdll.LoadLibrary(self.dll_path)
                logger.info("MT4 Manager API DLL loaded successfully")
                
                # Define necessary structures for MT4 Manager API
                class TradeRecord(Structure):
                    _fields_ = [
                        ("order", c_int),
                        ("login", c_int),
                        ("symbol", c_char_p * 12),
                        ("digits", c_int),
                        ("cmd", c_int),
                        ("volume", c_int),
                        ("open_time", c_int),
                        ("state", c_int),
                        ("open_price", c_double),
                        ("sl", c_double),
                        ("tp", c_double),
                        ("close_time", c_int),
                        ("expiration", c_int),
                        ("reason", c_int),
                        ("close_price", c_double),
                        ("commission", c_double),
                        ("commission_agent", c_double),
                        ("swaps", c_double),
                        ("close_price_profit", c_double),
                        ("profit", c_double),
                        ("taxes", c_double),
                        ("comment", c_char_p * 32),
                        ("gw_volume", c_int),
                        ("activation", c_int),
                        ("gw_order", c_int),
                        ("gw_open_price", c_double),
                        ("gw_close_price", c_double),
                        ("margin_rate", c_double),
                        ("timestamp", c_int),
                        ("api_data", c_int * 4),
                        ("reserved", c_int * 2)
                    ]
                
                class UserRecord(Structure):
                    _fields_ = [
                        ("login", c_int),
                        ("password", c_char_p * 16),
                        ("group", c_char_p * 16),
                        ("name", c_char_p * 128),
                        ("leverage", c_int),
                        ("email", c_char_p * 48),
                        ("phone", c_char_p * 32),
                        ("address", c_char_p * 96),
                        ("city", c_char_p * 32),
                        ("state", c_char_p * 32),
                        ("zipcode", c_char_p * 16),
                        ("country", c_char_p * 32),
                        ("comment", c_char_p * 64),
                        ("id", c_char_p * 32),
                        ("status", c_char_p * 16),
                        ("regdate", c_int),
                        ("lastdate", c_int),
                        ("prevbalance", c_double),
                        ("balance", c_double),
                        ("prevequity", c_double),
                        ("equity", c_double),
                        ("margin", c_double),
                        ("margin_level", c_double),
                        ("margin_free", c_double),
                        ("flags", c_int),
                        ("enable", c_int),
                        ("reserved", c_int * 3)
                    ]
                
                class SymbolInfo(Structure):
                    _fields_ = [
                        ("name", c_char_p * 12),
                        ("description", c_char_p * 64),
                        ("source", c_char_p * 12),
                        ("currency", c_char_p * 12),
                        ("type", c_int),
                        ("digits", c_int),
                        ("trade", c_int),
                        ("background_color", c_int),
                        ("count", c_int),
                        ("count_original", c_int),
                        ("starting", c_int),
                        ("reserved", c_int * 3),
                        ("bid", c_double),
                        ("ask", c_double),
                        ("point", c_double),
                        ("lot_min", c_double),
                        ("lot_max", c_double),
                        ("lot_step", c_double),
                        ("commission", c_double),
                        ("swap_long", c_double),
                        ("swap_short", c_double),
                        ("stops_level", c_int),
                        ("margin_call", c_int),
                        ("margin_mode", c_int),
                        ("margin_initial", c_double),
                        ("margin_hedge", c_double),
                        ("margin_maintenance", c_double),
                        ("tick_value", c_double),
                        ("tick_size", c_double)
                    ]
                
                # Define function types and return values
                self.TradeRecord = TradeRecord
                self.UserRecord = UserRecord
                self.SymbolInfo = SymbolInfo
                
                # MT4 function signatures
                # Manager connection/initialization functions
                self.dll.MtManagerCreate.restype = c_void_p
                self.dll.MtManagerConnect.argtypes = [c_void_p, c_char_p, c_int]
                self.dll.MtManagerConnect.restype = c_int
                self.dll.MtManagerLogin.argtypes = [c_void_p, c_int, c_char_p]
                self.dll.MtManagerLogin.restype = c_int
                self.dll.MtManagerDisconnect.argtypes = [c_void_p]
                self.dll.MtManagerDisconnect.restype = c_int
                
                # Manager API functions for data access
                self.dll.MtManagerGetUserInfo.argtypes = [c_void_p, c_int, POINTER(UserRecord)]
                self.dll.MtManagerGetUserInfo.restype = c_int
                self.dll.MtManagerGetSymbolInfo.argtypes = [c_void_p, c_char_p, POINTER(SymbolInfo)]
                self.dll.MtManagerGetSymbolInfo.restype = c_int
                self.dll.MtManagerGetTrades.argtypes = [c_void_p, c_int, POINTER(TradeRecord), c_int]
                self.dll.MtManagerGetTrades.restype = c_int
                self.dll.MtManagerTradeTransaction.argtypes = [c_void_p, POINTER(TradeRecord)]
                self.dll.MtManagerTradeTransaction.restype = c_int
                
                # Create MT4 Manager instance
                self.manager = self.dll.MtManagerCreate()
                if not self.manager:
                    raise RuntimeError("Failed to create MT4 Manager instance")
                
                logger.info("MT4 Manager DLL functions initialized successfully")
            else:
                raise FileNotFoundError(f"MT4 Manager API DLL not found at {self.dll_path}")
        except Exception as e:
            logger.error(f"Failed to initialize MT4 Manager API DLL: {e}")
            # Fall back to mock mode if DLL initialization fails
            logger.warning("Falling back to MOCK mode")
            self.mock_mode = True
            self._initialize_mock_data()
    
    def _initialize_mock_data(self):
        """Initialize mock data for development"""
        # Mock users
        self._mock_users = [
            {
                "login": 80001413,
                "group": "demoforex",
                "name": "Demo User",
                "balance": 10000.0,
                "equity": 10000.0,
                "margin": 0.0,
                "margin_level": 0.0,
                "leverage": 100,
                "email": "demo@example.com",
                "agent": 0,
                "enabled": True
            }
        ]
        
        # Mock trades
        self._mock_trades = []
        
        # Mock symbols
        self._mock_symbols = [
            {
                "name": "EURUSD",
                "description": "Euro vs US Dollar",
                "bid": 1.08123,
                "ask": 1.08125,
                "digits": 5,
                "spread": 2,
                "point": 0.00001,
                "lot_min": 0.01,
                "lot_max": 100.0,
                "lot_step": 0.01,
                "stops_level": 10,
                "margin_initial": 0.0,
                "margin_maintenance": 0.0,
                "tick_value": 1.0,
                "tick_size": 0.00001
            },
            {
                "name": "GBPUSD",
                "description": "Great Britain Pound vs US Dollar",
                "bid": 1.27543,
                "ask": 1.27547,
                "digits": 5,
                "spread": 4,
                "point": 0.00001,
                "lot_min": 0.01,
                "lot_max": 100.0,
                "lot_step": 0.01,
                "stops_level": 10,
                "margin_initial": 0.0,
                "margin_maintenance": 0.0,
                "tick_value": 1.0,
                "tick_size": 0.00001
            },
            {
                "name": "USDJPY",
                "description": "US Dollar vs Japanese Yen",
                "bid": 150.234,
                "ask": 150.239,
                "digits": 3,
                "spread": 5,
                "point": 0.001,
                "lot_min": 0.01,
                "lot_max": 100.0,
                "lot_step": 0.01,
                "stops_level": 10,
                "margin_initial": 0.0,
                "margin_maintenance": 0.0,
                "tick_value": 1.0,
                "tick_size": 0.001
            }
        ]
    
    def connect(self, server: str, port: int) -> bool:
        """
        Connect to MT4 server.
        
        Args:
            server: MT4 server address
            port: MT4 server port
            
        Returns:
            bool: True if connection successful, False otherwise
        """
        self.server = server
        self.port = port
        
        if self.mock_mode:
            # Mock connection
            logger.info(f"Mock connecting to {server}:{port}")
            self.connected = True
            return True
        else:
            try:
                # Implement real MT4 API connection here
                logger.info(f"Connecting to MT4 server {server}:{port}")
                
                # Convert parameters to correct types
                server_bytes = server.encode('utf-8')
                
                # Call the MtManagerConnect function
                result = self.dll.MtManagerConnect(self.manager, server_bytes, port)
                
                # Check result
                if result > 0:
                    logger.info(f"Successfully connected to MT4 server {server}:{port}")
                    self.connected = True
                else:
                    error_codes = {
                        0: "Failed to connect",
                        -1: "Unknown error",
                        -2: "Invalid parameters",
                        -3: "Connection failed",
                        -4: "Server returned error"
                    }
                    error_msg = error_codes.get(result, f"Unknown error code: {result}")
                    logger.error(f"MT4 connection error: {error_msg}")
                    self.connected = False
                
                return self.connected
            except Exception as e:
                logger.error(f"Failed to connect to MT4 server: {e}")
                self.connected = False
                return False
    
    def disconnect(self) -> bool:
        """
        Disconnect from MT4 server.
        
        Returns:
            bool: True if disconnection successful, False otherwise
        """
        if not self.connected:
            return True
            
        if self.mock_mode:
            # Mock disconnection
            logger.info("Mock disconnecting")
            self.connected = False
            self.logged_in = False
            return True
        else:
            try:
                # Implement real MT4 API disconnection here
                logger.info("Disconnecting from MT4 server")
                # Call DLL function to disconnect
                # Example: self.dll.Disconnect()
                self.connected = False
                self.logged_in = False
                return True
            except Exception as e:
                logger.error(f"Failed to disconnect from MT4 server: {e}")
                return False
    
    def login(self, login: int, password: str) -> bool:
        """
        Login to MT4 server.
        
        Args:
            login: MT4 login ID
            password: MT4 password
            
        Returns:
            bool: True if login successful, False otherwise
        """
        if not self.connected:
            logger.error("Cannot login: Not connected to MT4 server")
            return False
        
        # Store the login ID and password as properties
        # Renamed from login_id to login_number to avoid conflict with the login method
        self.login_number = login
        self.password = password
        
        if self.mock_mode:
            # Mock login
            logger.info(f"Mock login with ID {login}")
            self.logged_in = True
            return True
        else:
            try:
                # Implement real MT4 API login here
                logger.info(f"Logging in to MT4 server with ID {login}")
                
                # Convert parameters to correct types
                password_bytes = password.encode('utf-8')
                
                # Call DLL function to login
                result = self.dll.MtManagerLogin(self.manager, login, password_bytes)
                
                # Check result
                if result > 0:
                    logger.info(f"Successfully logged in to MT4 server with ID {login}")
                    self.logged_in = True
                else:
                    error_codes = {
                        0: "Failed to login",
                        -1: "Login not found",
                        -2: "Invalid password",
                        -3: "Not connected to server",
                        -4: "Server returned error"
                    }
                    error_msg = error_codes.get(result, f"Unknown error code: {result}")
                    logger.error(f"MT4 login error: {error_msg}")
                    self.logged_in = False
                
                return self.logged_in
            except Exception as e:
                logger.error(f"Failed to login to MT4 server: {e}")
                self.logged_in = False
                return False
    
    def get_users(self) -> List[Dict[str, Any]]:
        """
        Get list of all users.
        
        Returns:
            list: List of user dictionaries
        """
        if not self.logged_in:
            logger.error("Cannot get users: Not logged in")
            return []
        
        if self.mock_mode:
            # Return mock users
            return self._mock_users
        else:
            try:
                # Implement real MT4 API get users here
                logger.info("Getting users from MT4 server")
                # Call DLL function to get users
                # Example: result = self.dll.GetUsers()
                # Parse result and return as list of dictionaries
                return []  # Replace with actual result
            except Exception as e:
                logger.error(f"Failed to get users: {e}")
                return []
    
    def get_user_by_login(self, login: int) -> Optional[Dict[str, Any]]:
        """
        Get user by login ID.
        
        Args:
            login: MT4 login ID
            
        Returns:
            dict: User information or None if not found
        """
        if not self.logged_in:
            logger.error("Cannot get user: Not logged in")
            return None
        
        if self.mock_mode:
            # Find user in mock data
            for user in self._mock_users:
                if user['login'] == login:
                    return user
            return None
        else:
            try:
                # Implement real MT4 API get user here
                logger.info(f"Getting user with login {login}")
                # Call DLL function to get user
                # Example: result = self.dll.GetUserByLogin(login)
                # Parse result and return as dictionary
                return None  # Replace with actual result
            except Exception as e:
                logger.error(f"Failed to get user {login}: {e}")
                return None
    
    def get_symbols(self) -> List[Dict[str, Any]]:
        """
        Get list of all symbols.
        
        Returns:
            list: List of symbol dictionaries
        """
        if not self.logged_in:
            logger.error("Cannot get symbols: Not logged in")
            return []
        
        if self.mock_mode:
            # Return mock symbols
            return self._mock_symbols
        else:
            try:
                # Implement real MT4 API get symbols here
                logger.info("Getting symbols from MT4 server")
                # Call DLL function to get symbols
                # Example: result = self.dll.GetSymbols()
                # Parse result and return as list of dictionaries
                return []  # Replace with actual result
            except Exception as e:
                logger.error(f"Failed to get symbols: {e}")
                return []
    
    def get_symbol_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get symbol information.
        
        Args:
            symbol: Symbol name (e.g., 'EURUSD')
            
        Returns:
            dict: Symbol information or None if not found
        """
        if not self.logged_in:
            logger.error("Cannot get symbol info: Not logged in")
            return None
        
        if self.mock_mode:
            # Find symbol in mock data
            for sym in self._mock_symbols:
                if sym['name'].upper() == symbol.upper():
                    return sym
            return None
        else:
            try:
                # Implement real MT4 API get symbol info here
                logger.info(f"Getting symbol info for {symbol}")
                # Call DLL function to get symbol info
                # Example: result = self.dll.GetSymbolInfo(symbol.encode())
                # Parse result and return as dictionary
                return None  # Replace with actual result
            except Exception as e:
                logger.error(f"Failed to get symbol info for {symbol}: {e}")
                return None
    
    def get_trades(self, login: int = 0) -> List[Dict[str, Any]]:
        """
        Get list of trades, optionally filtered by login ID.
        
        Args:
            login: MT4 login ID (0 for all trades)
            
        Returns:
            list: List of trade dictionaries
        """
        if not self.logged_in:
            logger.error("Cannot get trades: Not logged in")
            return []
        
        if self.mock_mode:
            # Return mock trades, filtered by login if specified
            if login > 0:
                return [t for t in self._mock_trades if t['login'] == login]
            return self._mock_trades
        else:
            try:
                # Implement real MT4 API get trades here
                logger.info(f"Getting trades {'' if login == 0 else f'for login {login}'}")
                # Call DLL function to get trades
                # Example: result = self.dll.GetTrades(login)
                # Parse result and return as list of dictionaries
                return []  # Replace with actual result
            except Exception as e:
                logger.error(f"Failed to get trades: {e}")
                return []
    
    def place_order(self, login: int, symbol: str, cmd: TradeCommand, volume: float,
                   price: float, sl: float = 0, tp: float = 0, comment: str = '') -> int:
        """
        Place a new trade order.
        
        Args:
            login: MT4 login ID
            symbol: Symbol name (e.g., 'EURUSD')
            cmd: Trade command (see TradeCommand enum)
            volume: Trade volume in lots
            price: Order price
            sl: Stop loss price (0 for none)
            tp: Take profit price (0 for none)
            comment: Order comment
            
        Returns:
            int: Order ticket number (0 if failed)
        """
        if not self.logged_in:
            logger.error("Cannot place order: Not logged in")
            return 0
        
        if self.mock_mode:
            # Create mock trade
            logger.info(f"Mock placing order: {symbol} {cmd.name} {volume} lots at {price}")
            
            # Generate a ticket number
            ticket = random.randint(10000, 99999)
            
            # Get current time
            now = datetime.now()
            
            # Create the trade
            trade = {
                'order': ticket,
                'login': login,
                'symbol': symbol,
                'cmd': int(cmd),
                'volume': volume,
                'open_price': price,
                'open_time': now.strftime('%Y-%m-%d %H:%M:%S'),
                'sl': sl,
                'tp': tp,
                'comment': comment,
                'profit': 0.0,
                'commission': 0.0,
                'swaps': 0.0,
                'close_price': 0.0,
                'close_time': '',
                'state': 'OPEN'
            }
            
            # Add to mock trades
            self._mock_trades.append(trade)
            
            return ticket
        else:
            try:
                # Import ctypes locally if needed
                import ctypes
                from ctypes import byref, create_string_buffer
                
                # Implement real MT4 API place order here
                logger.info(f"Placing order: {symbol} {cmd.name} {volume} lots at {price}")
                
                # Create a trade record
                trade_rec = self.TradeRecord()
                
                # Initialize with zeros
                ctypes.memset(byref(trade_rec), 0, ctypes.sizeof(trade_rec))
                
                # Set order parameters
                trade_rec.login = login
                
                # Convert string to bytes and copy to char array
                symbol_bytes = symbol.encode('utf-8')
                for i, b in enumerate(symbol_bytes[:11]):  # Copy up to 11 chars (12th is null terminator)
                    trade_rec.symbol[i] = b
                
                trade_rec.cmd = int(cmd)
                trade_rec.volume = int(volume * 100)  # Convert to MT4 volume format (0.01 lot = 1)
                trade_rec.open_price = price
                trade_rec.sl = sl
                trade_rec.tp = tp
                
                # Set comment if provided
                if comment:
                    comment_bytes = comment.encode('utf-8')
                    for i, b in enumerate(comment_bytes[:31]):  # Copy up to 31 chars (32nd is null terminator)
                        trade_rec.comment[i] = b
                
                # Call DLL function to place order
                result = self.dll.MtManagerTradeTransaction(self.manager, byref(trade_rec))
                
                if result > 0:
                    logger.info(f"Order placed successfully with ticket {result}")
                    return result
                else:
                    error_codes = {
                        0: "Failed to place order",
                        -1: "Invalid order parameters",
                        -2: "Server rejected order",
                        -3: "Not enough money",
                        -4: "Invalid price",
                        -5: "Invalid stops"
                    }
                    error_msg = error_codes.get(result, f"Unknown error code: {result}")
                    logger.error(f"MT4 order error: {error_msg}")
                    return 0
            except Exception as e:
                logger.error(f"Failed to place order: {e}")
                return 0
    
    def modify_order(self, login: int, order: int, price: Optional[float] = None,
                    sl: Optional[float] = None, tp: Optional[float] = None) -> bool:
        """
        Modify an existing trade order.
        
        Args:
            login: MT4 login ID
            order: Order ticket number
            price: New price (None to keep current)
            sl: New stop loss price (None to keep current)
            tp: New take profit price (None to keep current)
            
        Returns:
            bool: True if modification successful, False otherwise
        """
        if not self.logged_in:
            logger.error("Cannot modify order: Not logged in")
            return False
        
        if self.mock_mode:
            # Find the trade in mock data
            for i, trade in enumerate(self._mock_trades):
                if trade['login'] == login and trade['order'] == order:
                    logger.info(f"Mock modifying order {order}")
                    
                    # Update the trade
                    if price is not None:
                        self._mock_trades[i]['open_price'] = price
                    
                    if sl is not None:
                        self._mock_trades[i]['sl'] = sl
                    
                    if tp is not None:
                        self._mock_trades[i]['tp'] = tp
                    
                    return True
            
            logger.error(f"Order {order} not found for login {login}")
            return False
        else:
            try:
                # Implement real MT4 API modify order here
                logger.info(f"Modifying order {order}")
                # Call DLL function to modify order
                # Example: result = self.dll.TradeOrderModify(login, order, price, sl, tp)
                # Return success or failure
                return False  # Replace with actual result
            except Exception as e:
                logger.error(f"Failed to modify order {order}: {e}")
                return False
    
    def close_order(self, login: int, order: int, lots: float = 0) -> bool:
        """
        Close an existing trade order.
        
        Args:
            login: MT4 login ID
            order: Order ticket number
            lots: Lots to close (0 for all)
            
        Returns:
            bool: True if closing successful, False otherwise
        """
        if not self.logged_in:
            logger.error("Cannot close order: Not logged in")
            return False
        
        if self.mock_mode:
            # Find the trade in mock data
            for i, trade in enumerate(self._mock_trades):
                if trade['login'] == login and trade['order'] == order:
                    logger.info(f"Mock closing order {order}")
                    
                    # Partial close
                    if lots > 0 and lots < trade['volume']:
                        # Create a new trade for the remaining volume
                        remaining_trade = trade.copy()
                        remaining_trade['volume'] -= lots
                        self._mock_trades.append(remaining_trade)
                        
                        # Update the original trade
                        self._mock_trades[i]['volume'] = lots
                    
                    # Update the trade
                    self._mock_trades[i]['close_price'] = self._get_mock_close_price(trade)
                    self._mock_trades[i]['close_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    self._mock_trades[i]['state'] = 'CLOSED'
                    
                    # Calculate profit (simplified)
                    price_diff = 0
                    if trade['cmd'] == TradeCommand.OP_BUY:
                        price_diff = trade['close_price'] - trade['open_price']
                    elif trade['cmd'] == TradeCommand.OP_SELL:
                        price_diff = trade['open_price'] - trade['close_price']
                    
                    self._mock_trades[i]['profit'] = price_diff * trade['volume'] * 100000
                    
                    return True
            
            logger.error(f"Order {order} not found for login {login}")
            return False
        else:
            try:
                # Implement real MT4 API close order here
                logger.info(f"Closing order {order}")
                # Call DLL function to close order
                # Example: result = self.dll.TradeOrderClose(login, order, lots)
                # Return success or failure
                return False  # Replace with actual result
            except Exception as e:
                logger.error(f"Failed to close order {order}: {e}")
                return False
    
    def _get_mock_close_price(self, trade: Dict[str, Any]) -> float:
        """Get a realistic close price for a mock trade"""
        # Find the symbol in mock data
        for sym in self._mock_symbols:
            if sym['name'] == trade['symbol']:
                if trade['cmd'] == TradeCommand.OP_BUY:
                    return sym['bid']
                elif trade['cmd'] == TradeCommand.OP_SELL:
                    return sym['ask']
                else:
                    return trade['open_price']
        
        # If symbol not found, return a slightly different price
        return round(trade['open_price'] * (1 + random.uniform(-0.001, 0.001)), 5)
import ctypes
import os
import sys
from ctypes import c_int, c_char_p, c_double

def test_mt4_wrapper():
    print("Testing MT4 Wrapper DLL...")
    
    # Find the DLL
    dll_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mt4_wrapper.dll")
    
    if not os.path.exists(dll_path):
        print(f"ERROR: DLL not found at {dll_path}")
        alt_path = os.path.join("../..", "src", "backend", "MT4RestfulAPIWrapper", "mt4_wrapper.dll")
        alt_path = os.path.abspath(alt_path)
        print(f"Checking alternative path: {alt_path}")
        
        if os.path.exists(alt_path):
            dll_path = alt_path
            print(f"Found DLL at alternative path: {dll_path}")
        else:
            print(f"ERROR: DLL not found at alternative path either")
            return False
    
    try:
        # Load the DLL
        print(f"Loading DLL from: {dll_path}")
        mt4_wrapper = ctypes.CDLL(dll_path)
        print("DLL loaded successfully!")
        
        # Test creating a manager
        create_manager = mt4_wrapper.MtManagerCreate
        create_manager.argtypes = [c_char_p]
        create_manager.restype = c_int
        
        # Test function call
        handle = create_manager(None)
        print(f"Manager handle: {handle}")
        
        if handle <= 0:
            print("ERROR: Failed to create manager")
            get_last_error = mt4_wrapper.MtManagerGetLastError
            get_last_error.argtypes = [c_int]
            get_last_error.restype = c_char_p
            error = get_last_error(handle)
            if error:
                print(f"Error: {error.decode('utf-8')}")
            else:
                print("No error message returned")
            return False
        
        # Test some other functions
        is_connected = mt4_wrapper.MtManagerIsConnected
        is_connected.argtypes = [c_int]
        is_connected.restype = c_int
        
        connected = is_connected(handle)
        print(f"Is connected: {connected == 1}")
        
        # Test releasing the manager
        release_manager = mt4_wrapper.MtManagerRelease
        release_manager.argtypes = [c_int]
        release_manager(handle)
        print("Manager released successfully!")
        
        # Print all exported functions
        print("\nExported Functions:")
        for func_name in [
            "MtManagerCreate", 
            "MtManagerConnect", 
            "MtManagerLogin", 
            "MtManagerIsConnected", 
            "MtManagerIsLoggedIn", 
            "MtManagerDisconnect", 
            "MtManagerGetServerTime", 
            "MtManagerPlaceOrder", 
            "MtManagerGetMarginLevel", 
            "MtManagerGetLastError", 
            "MtManagerGetOnlineCount", 
            "MtManagerIsUserOnline", 
            "MtManagerRelease"
        ]:
            try:
                func = getattr(mt4_wrapper, func_name)
                print(f"  [OK] {func_name}")
            except AttributeError:
                print(f"  [MISSING] {func_name}")
        
        return True
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_mt4_wrapper()
    if success:
        print("\nTEST PASSED: MT4 Wrapper DLL loaded and basic functions work correctly.")
        sys.exit(0)
    else:
        print("\nTEST FAILED: MT4 Wrapper DLL is not working correctly.")
        sys.exit(1)
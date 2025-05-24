#!/bin/bash
# Start the real MT4 API with RESTful wrapper

# Default values
PORT=5003
SERVER="demo.metaquotes.com"
LOGIN=0
PASSWORD="password"
DLL_PATH="mtmanapi.dll"
DEBUG=false
MODE="live"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --server=*)
      SERVER="${1#*=}"
      shift
      ;;
    --server)
      SERVER="$2"
      shift 2
      ;;
    --login=*)
      LOGIN="${1#*=}"
      shift
      ;;
    --login)
      LOGIN="$2"
      shift 2
      ;;
    --password=*)
      PASSWORD="${1#*=}"
      shift
      ;;
    --password)
      PASSWORD="$2"
      shift 2
      ;;
    --dll=*)
      DLL_PATH="${1#*=}"
      shift
      ;;
    --dll)
      DLL_PATH="$2"
      shift 2
      ;;
    --debug)
      DEBUG=true
      shift
      ;;
    --mock)
      MODE="mock"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Set environment variables
export MT4_SERVER="$SERVER"
export MT4_PORT=443  # Default MT4 server port
export MT4_LOGIN="$LOGIN"
export MT4_PASSWORD="$PASSWORD"
export PORT="$PORT"
export USE_MOCK_MODE="false"
if [ "$MODE" == "mock" ]; then
  export USE_MOCK_MODE="true"
fi

# Create logs directory if it doesn't exist
mkdir -p data/logs

# Change to the project root directory
cd "$(dirname "$0")/.."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

echo "Starting MT4 API in $MODE mode..."
echo "Server: $SERVER"
echo "Login: $LOGIN"
echo "Port: $PORT"

# Determine the platform-specific DLL path
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Warning: Running on macOS. MT4 API will run in mock mode unless --mock is specified."
  
  if [ "$MODE" == "live" ]; then
    echo "MT4 Manager API only works on Windows. Switching to mock mode."
    export USE_MOCK_MODE="true"
    MODE="mock"
  fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "Warning: Running on Linux. MT4 API will run in mock mode unless --mock is specified."
  
  if [ "$MODE" == "live" ]; then
    echo "MT4 Manager API only works on Windows. Switching to mock mode."
    export USE_MOCK_MODE="true"
    MODE="mock"
  fi
fi

# Determine which script to run based on mode
if [ "$MODE" == "mock" ]; then
  echo "Starting MT4 Mock API..."
  python src/backend/mt4_mock_api/run_server.py --port "$PORT" $([ "$DEBUG" == "true" ] && echo "--debug")
else
  echo "Starting MT4 Real API with RESTful wrapper..."
  python src/backend/MT4RestfulAPIWrapper/mt4_rest_api_implementation.py --port "$PORT" --server "$SERVER" --login "$LOGIN" --password "$PASSWORD" --dll "$DLL_PATH" $([ "$DEBUG" == "true" ] && echo "--debug")
fi
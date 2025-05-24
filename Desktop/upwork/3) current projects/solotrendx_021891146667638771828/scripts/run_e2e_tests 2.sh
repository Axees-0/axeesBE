#!/bin/bash
# Run end-to-end tests against the real MT4 environment

# Create logs directory if it doesn't exist
mkdir -p data/logs

# Set environment variables from .env file if it exists
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
  echo "Loaded environment variables from .env file"
fi

# Check if the services are running
function check_service {
  local url="$1"
  local service_name="$2"
  local max_attempts=5
  local attempt=1
  
  echo "Checking $service_name at $url..."
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s "$url" > /dev/null 2>&1; then
      echo "$service_name is running"
      return 0
    else
      echo "Attempt $attempt: $service_name is not running. Retrying in 2 seconds..."
      sleep 2
      ((attempt++))
    fi
  done
  
  echo "ERROR: $service_name is not running. Please start the services before running tests."
  return 1
}

# Check that all required services are running
check_service "http://localhost:5003/api/health" "MT4 API" || exit 1
check_service "http://localhost:5000/health" "Webhook API" || exit 1
check_service "http://localhost:5001/health" "Telegram Connector" || exit 1

echo "All services are running. Starting end-to-end tests..."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  source venv/bin/activate
fi

# Run the end-to-end tests
python -m pytest tests/e2e -v

# Generate HTML report if xmlrunner is installed
if python -c "import pytest_html" &> /dev/null; then
  echo "Generating HTML test report..."
  python -m pytest tests/e2e -v --html=data/reports/e2e_test_report.html
fi

echo "End-to-end tests completed. Check the log files for details."
# SoloTrend X Trading System

A trading system that integrates TradingView signals and Dynamic Trailing Stop EA with MT4 via Telegram for human-verified trading.

## Overview

SoloTrend X combines automated signal generation with human decision-making through a Telegram interface. It allows traders to receive signals from TradingView indicators and MT4 EAs, verify them manually, and execute trades with a single tap.

## Architecture

The system consists of these key components:

1. **Signal Sources**:
   - TradingView Custom Indicators
   - MT4 Dynamic Trailing Stop EA

2. **Signal Processing**:
   - Webhook API for receiving signals
   - Signal validation and enrichment

3. **User Interface**:
   - Telegram Bot for notifications and commands
   - Interactive buttons for trade execution

4. **Trade Execution**:
   - MT4 Manager API (via RESTful wrapper)
   - MT4 Terminal running on Windows Server

For more details, see the [Architecture Diagram](docs/architecture/architecture_diagram.md).

## Development Approach

This project follows a Mac-first development approach:

1. Develop and test as much as possible on macOS using mocks
2. Use test-driven development (TDD) for all components
3. Only integrate with the real MT4 API on Windows at the final stage

For detailed development steps, see the [Development Guide](docs/user-guides/DEV_STEPS.md).

## Progress

- ✅ Project structure set up
- ✅ MT4 Mock API implemented
- ✅ MT4 Real API with Windows integration implemented
- ✅ Webhook API implemented
- ✅ Telegram Bot implemented
- ✅ End-to-end tests implemented for both mock and real environments
- ✅ Integration tests implemented
- ✅ System tested under load with stress tests
- ✅ Windows deployment scripts for production environment
- ✅ Path handling stabilized for all Windows environments including UNC paths

See [PROGRESS.md](PROGRESS.md) for detailed status.

## Directory Structure

This project follows the Universal Directory Structure as outlined in the [universal_directory.md](docs/architecture/universal_directory.md) file.

```
project-root/                         # Root directory of the project
├── src/                              # All source code for the project
│   ├── frontend/                     # Frontend (client-side) code
│   └── backend/                      # Backend (server-side) code
│       ├── MT4RestfulAPIWrapper/     # MT4 Manager API REST wrapper
│       ├── webhook_api/              # Webhook API for receiving signals
│       ├── telegram_connector/       # Telegram bot and connector
│       └── mt4_mock_api/             # Mock implementation of MT4 API
├── tests/                            # Automated tests
│   ├── unit/                         # Unit tests for individual components
│   ├── integration/                  # Integration tests for module interactions
│   └── e2e/                          # End-to-end tests for complete workflows
├── docs/                             # Documentation and design specifications
├── config/                           # Configuration and environment files
├── data/                             # Data files and logs
│   ├── input/                        # Input data files
│   ├── output/                       # Output data files
│   └── logs/                         # Log files for all components
└── scripts/                          # Development and deployment scripts
```

## Getting Started

### Prerequisites

#### For Development (macOS/Linux)
- Python 3.8+
- Telegram Bot API token
- Git

#### For Production (Windows)
- Windows Server 2019 or newer
- Python 3.8+
- MetaTrader 4 Terminal (with Manager API)
- Telegram Bot API token
- Azure account (for cloud deployment)

### Development Setup (macOS/Linux)

```bash
# Clone the repository
git clone <repository_url>
cd solotrendx

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run tests
python -m pytest tests/unit  # Unit tests
python -m pytest tests/integration  # Integration tests
./scripts/run_e2e_tests.sh  # End-to-end tests

# Start the full development environment (using mock MT4 API)
./scripts/start_dev_environment.sh

# Or start individual components
./scripts/start_mt4_mock_api.sh
./scripts/start_webhook_api.sh
./scripts/start_telegram_connector.sh

# Generate test signals
./scripts/generate_test_signal.py --url http://localhost:5001/webhook --direct
```

### Production Setup (Windows)

```powershell
# Clone the repository
git clone <repository_url>
cd solotrendx

# Run the Windows environment setup script (as Administrator)
powershell -ExecutionPolicy Bypass -File .\scripts\setup_windows_environment.ps1

# Edit the .env file to add your MT4 and Telegram credentials
notepad .env

# Start all services
.\start_all_services.bat

# Run end-to-end tests against the real MT4 environment
.\run_e2e_tests.bat
```

### Component URLs

- MT4 REST API: http://localhost:5002/api
  - Health: http://localhost:5002/api/health
  - Server Status: http://localhost:5002/api/server/status
  - Trades: http://localhost:5002/api/trades

- Webhook API: http://localhost:5003
  - Health: http://localhost:5003/health
  - Webhook: http://localhost:5003/webhook
  - TradingView signals: http://localhost:5003/webhook/tradingview
  - EA signals: http://localhost:5003/webhook/ea

- Telegram Connector: http://localhost:5001
  - Health: http://localhost:5001/health
  - Webhook: http://localhost:5001/webhook
  - Bot: Running as a background service

## Debugging and Monitoring

Several tools are available for debugging and monitoring the services:

```bash
# Debug and fix service issues
python scripts/debug_services.py

# Test signal flow between components
python scripts/test_signal_flow.py

# Continuously monitor and fix service issues
python scripts/fix_service_issues.py --iterations 3
```

## Azure Deployment

For deploying to Azure:

1. Create a Windows VM in Azure
2. Install MT4 and configure with your broker account
3. Clone the repository and run the setup script
4. Configure environment variables with your credentials
5. Start all services
6. Configure domain and SSL certificates for the webhook endpoints

See the [Architecture Diagram](docs/architecture/architecture_diagram.md) for the recommended Azure setup.

## Documentation

Refer to the `docs/` directory for detailed documentation:

- Universal Directory Structure: `/docs/architecture/universal_directory.md`
- Architecture Diagram: `/docs/architecture/architecture_diagram.md`
- Development Steps: `/docs/user-guides/DEV_STEPS.md`
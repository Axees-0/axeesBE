# SoloTrend X Trading System v2.3

A trading system that integrates TradingView signals and Dynamic Trailing Stop EA with MT4 via Telegram for human-verified trading.

## Overview

SoloTrend X combines automated signal generation with human decision-making through a Telegram interface. It allows traders to receive signals from TradingView indicators and MT4 EAs, verify them manually, and execute trades with a single tap. The system uses a modular architecture that works across Windows and macOS environments.

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
- ✅ Telegram integration with robust error handling and cross-platform compatibility
- ✅ Test signal tools for debugging and verification

See [docs/PROGRESS.md](docs/PROGRESS.md) for detailed status.

## Directory Structure

This project follows the Universal Directory Structure as outlined in the [universal_directory.md](docs/architecture/universal_directory.md) file.

```
project-root/                         # Root directory of the project
├── src/                              # All source code for the project
│   └── backend/                      # Backend (server-side) code
│       ├── MT4ManagerAPI/            # MT4 Manager API direct integration
│       ├── MT4RestfulAPIWrapper/     # MT4 Manager API REST wrapper
│       ├── webhook_api/              # Webhook API for receiving signals
│       ├── telegram_connector/       # Telegram bot and connector
│       ├── mt4_mock_api/             # Mock implementation of MT4 API
│       └── instance/                 # Flask instance configuration
├── tests/                            # Automated tests
│   ├── unit/                         # Unit tests for individual components
│   ├── e2e/                          # End-to-end tests for complete workflows
│   ├── data/                         # Test data files
│   └── mac/                          # Mac-specific tests
├── docs/                             # Documentation and design specifications
│   ├── architecture/                 # System architecture diagrams
│   └── user-guides/                  # User guides and tutorials
├── data/                             # Data files and logs
│   ├── input/                        # Input data files
│   └── logs/                         # Log files for all components
├── scripts/                          # Development and deployment scripts
│   └── mac_tests/                    # Mac-specific test scripts
└── environment/                      # Environment configuration
    └── python/                       # Python virtual environments
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

# Set up the virtual environment with required dependencies
.\setup_venv.bat

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

- Telegram Connector: http://localhost:5005 (updated in v2.3)
  - Health: http://localhost:5005/health
  - Webhook: http://localhost:5005/webhook
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

# Test Telegram Bot token validity
python scripts/test_telegram_token.py

# Generate test signals for the system
python scripts/generate_test_signal.py

# Test an individual trading signal with Telegram
python src/backend/telegram_connector/test_signal.py
```

## Telegram Bot Configuration

The Telegram Bot requires proper configuration to function correctly:

### Setting Up a Bot Token

1. Create a new bot with BotFather on Telegram:
   - Open Telegram and search for @BotFather
   - Send `/newbot` command and follow the instructions
   - Copy the API token (format: `NUMBER:STRING`)

2. Configure the token in your environment:
   - Add to `.env` file: `TELEGRAM_BOT_TOKEN=your_token_here`
   - Or set as environment variable: `export TELEGRAM_BOT_TOKEN=your_token_here`

3. Verify token format:
   - Must follow the pattern `NUMBER:STRING` (e.g., `123456789:ABCDefGhiJklmNoPQRstUvwxyz`)
   - First part must be numeric
   - Second part is the secret key

4. Test the token:
   ```bash
   python scripts/test_telegram_token.py
   ```

### Configuring User Access

Configure which users can interact with the bot in your environment:

- `ADMIN_USER_IDS`: Comma-separated list of Telegram user IDs for administrators
- `ALLOWED_USER_IDS`: Comma-separated list of Telegram user IDs for regular users

Example in `.env`:
```
# Telegram connector configuration
TELEGRAM_BOT_TOKEN=123456789:ABCDefGhiJklmNoPQRstUvwxyz
TELEGRAM_BOT_LINK=https://t.me/your_bot_username
TELEGRAM_CHAT_ID=123456789
ADMIN_USER_IDS=123456789
ALLOWED_USER_IDS=123456789,987654321
FLASK_PORT=5005
```

You can find your Telegram user ID by sending a message to @userinfobot on Telegram. The `TELEGRAM_BOT_LINK` is important for users to start the bot, which is required before they can receive messages.

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
- Telegram Bot Guide: `/docs/user-guides/TELEGRAM_BOT_GUIDE.md`
- Telegram Bot Setup: `/docs/user-guides/TELEGRAM_BOT_SETUP.md`
- Production Setup: `/docs/PRODUCTION_SETUP.md`

## Version History

- **v2.3**: Stable Telegram integration with improved path handling
  - Fixed Telegram connector to use project root .env file correctly
  - Added robust error handling for the health check endpoint
  - Updated test_signal.py script with better error handling
  - Improved path resolution for cross-platform compatibility

- **v2.2**: Path handling stabilization
  - Added stable path handling for all Windows environments
  - Fixed issues with UNC paths
  - Improved cross-platform compatibility

- **v2.1**: Full Telegram integration
  - Added Telegram Bot implementation
  - Added signal processing with interactive buttons
  - Added admin notification system
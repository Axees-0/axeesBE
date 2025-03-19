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
- 🔄 Webhook API implementation in progress
- 🔄 Telegram Bot implementation in progress

See [PROGRESS.md](PROGRESS.md) for detailed status.

## Directory Structure

This project follows the Universal Directory Structure as outlined in the [universal_directory.md](docs/architecture/universal_directory.md) file.

```
project-root/                         # Root directory of the project
├── src/                              # All source code for the project
│   ├── frontend/                     # Frontend (client-side) code
│   └── backend/                      # Backend (server-side) code
├── tests/                            # Automated tests
│   ├── unit/                         # Unit tests for individual components
│   ├── integration/                  # Integration tests for module interactions
│   └── e2e/                          # End-to-end tests for complete workflows
├── docs/                             # Documentation and design specifications
├── config/                           # Configuration and environment files
├── data/                             # Data files and logs
└── scripts/                          # Development and deployment scripts
```

## Getting Started

### Prerequisites

- Python 3.8+
- Telegram Bot API token
- MT4 Terminal (for final deployment only)

### Setup

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
python -m pytest tests/

# Start the MT4 Mock API
./scripts/start_mt4_mock_api.sh
```

## Documentation

Refer to the `docs/` directory for detailed documentation:

- Universal Directory Structure: `/docs/architecture/universal_directory.md`
- Architecture Diagram: `/docs/architecture/architecture_diagram.md`
- Development Steps: `/docs/user-guides/DEV_STEPS.md`
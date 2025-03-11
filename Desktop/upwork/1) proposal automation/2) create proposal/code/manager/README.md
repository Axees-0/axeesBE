# Claude Task Manager

A comprehensive management system for Claude AI tasks and sessions.

## Overview

The Claude Task Manager provides a web-based dashboard and CLI tools to:
- Create and manage Claude instances
- Monitor running Claude sessions
- Send prompts to Claude
- View and interact with Claude responses
- Organize Claude tasks by project

## Installation

1. Clone the repository
2. Install dependencies:
```
pip install -r requirements.txt
```

## Usage

### Launch Web Dashboard

```
./manage.py dashboard
```
or simply:
```
./manage.py
```

### Launch Claude Monitor

```
./manage.py monitor
```

## Project Structure

- `src/` - Core application code
  - `cli/` - Command-line interface implementation
  - `core/` - Core business logic
  - `infrastructure/` - Infrastructure services
  - `monitoring/` - Monitoring scripts and tools
  - `utils/` - Utility functions
  - `web/` - Web dashboard implementation
- `docs/` - Documentation
- `examples/` - Example scripts and usage
- `tests/` - Test suites and test data
- `config/` - Configuration files
- `logs/` - Log files
- `data/` - Data storage
- `run/` - Runtime files
- `patches/` - Patch files
- `scripts/` - Utility scripts
- `archive/` - Archived code

## Configuration

Configuration is stored in `config/claude_instances.json`.

## License

See the LICENSE file for details.

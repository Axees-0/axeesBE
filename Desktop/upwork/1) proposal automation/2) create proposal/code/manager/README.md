# Claude Task Manager

A comprehensive management system for Claude AI tasks and sessions.

## Overview

The Claude Task Manager provides a web-based dashboard and CLI tools to:
- Create and manage Claude instances
- Monitor running Claude sessions
- Send prompts to Claude
- View and interact with Claude responses
- Organize Claude tasks by project
- Auto-respond to Claude prompts and commands

## Features

- Support for both tmux and Terminal.app based Claude sessions
- Auto-detection of "yes/no" prompts and statistics tracking
- Web dashboard with filtering, sorting, and multi-select capabilities
- Project ID lookup (automatically finds projects with matching ID numbers)
- Direct text input for prompts (automatically creates temp files)
- Create Claude instances from a prompt file or direct text
- Choose between tmux and Terminal.app runtimes
- Option to open a terminal window automatically (or not)
- Auto-monitoring system for handling Claude prompts
- Comprehensive synchronization between tmux sessions and UI

## Installation

1. Clone the repository
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Quick Start

### Launch Web Dashboard

```bash
./manage.py dashboard
```
or simply:
```bash
./manage.py
```

### Launch Claude Monitor

```bash
./manage.py monitor
```

### Create an Instance with a Prompt

```bash
python scripts/quick_start.py --prompt "Analyze this codebase and suggest improvements"
```

## Usage

### Web Dashboard

Start the web dashboard to manage all Claude instances:

```bash
./manage.py dashboard
```

### Using the Core Library

```python
from src.claude_task_manager import ClaudeTaskManager

# Initialize manager
manager = ClaudeTaskManager()

# Start a new instance with a prompt file
instance_id = manager.start_instance(
    project_dir="/path/to/project", 
    prompt_path="/path/to/prompt.txt",
    use_tmux=True  # Use tmux for better reliability
)

# Start a new instance with direct text
instance_id = manager.start_instance(
    project_dir="/path/to/project", 
    prompt_text="Hello Claude, please analyze this project",
    use_tmux=True
)

# Stop an instance
manager.stop_instance(instance_id)

# List all instances
instances = manager.list_instances()
```

### Auto-Monitoring Service

The auto-monitoring service can automatically respond to Claude prompts:

```bash
# Start the monitoring service
./src/infrastructure/service/claude_monitor_service.sh start

# Check the status
./src/infrastructure/service/claude_monitor_service.sh status

# Stop the service
./src/infrastructure/service/claude_monitor_service.sh stop
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

## Documentation

Additional documentation is available in the `docs/` directory:
- [API Refactoring Guide](docs/API_REFACTORING.md) - Transition guide from legacy to modern API
- [Prompt Features](docs/README_PROMPT_FEATURES.md) - Automated prompt handling features
- [TMUX and UI Synchronization](docs/README_TMUX_UI_SYNC.md) - Synchronization between tmux and UI
- [Web Auto Monitor Setup](docs/WEB_AUTO_MONITOR_SETUP.md) - Setting up automated monitoring
- [Changelog](docs/CHANGELOG.md) - Project change history

## License

See the LICENSE file for details.
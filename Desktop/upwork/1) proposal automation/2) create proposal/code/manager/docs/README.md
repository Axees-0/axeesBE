# Claude Task Manager

A management system for automating and monitoring Claude CLI tasks.

## Core Components

- **claude_task_manager.py**: Core library for managing Claude instances
- **claude_dashboard_web.py**: Web dashboard for monitoring and controlling instances
- **claude_monitor.py**: Terminal-based monitor for Claude CLI instances
- **claude_monitor_direct.py**: tmux-based monitor for Claude CLI instances
- **quick_start.py**: Command-line utility for quickly starting new Claude instances

## Usage

### Starting the Web Dashboard

```bash
python3 claude_dashboard_web.py
```

### Quick Start from Command Line

```bash
python3 quick_start.py --project-dir /path/to/project --prompt-path /path/to/prompt.txt
```

### Using the Core Library

```python
from claude_task_manager import ClaudeTaskManager

# Initialize manager
manager = ClaudeTaskManager()

# Start a new instance
instance_id = manager.start_instance(
    project_dir="/path/to/project", 
    prompt_path="/path/to/prompt.txt",
    use_tmux=True  # Use tmux for better reliability
)

# Stop an instance
manager.stop_instance(instance_id)

# List all instances
instances = manager.list_instances()
```

## Features

- Support for both tmux and Terminal.app based Claude sessions
- Auto-detection of "yes/no" prompts and statistics tracking
- Web dashboard with filtering, sorting, and multi-select capabilities
- Project ID lookup (automatically finds projects with matching ID numbers)
- Direct text input for prompts (automatically creates temp files)
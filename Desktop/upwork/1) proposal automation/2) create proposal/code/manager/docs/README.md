# Claude Task Manager Documentation

Welcome to the Claude Task Manager documentation. This directory contains detailed documentation on various aspects of the system.

## Documentation Index

### Core Documentation
- [API Refactoring Guide](API_REFACTORING.md) - Guide to transitioning from legacy to modern API
- [Prompt Features](README_PROMPT_FEATURES.md) - Documentation on automated prompt handling features
- [TMUX and UI Synchronization](README_TMUX_UI_SYNC.md) - How the system maintains perfect sync between tmux and UI
- [Web Auto Monitor Setup](WEB_AUTO_MONITOR_SETUP.md) - Setting up the automated monitoring service
- [Instance Creator](README_instance_creator.md) - Guide to programmatically creating Claude instances
- [Changelog](CHANGELOG.md) - Project change history

### GitHub Templates
- [PR Template](PR_TEMPLATE.md) - Template for creating pull requests

## Core Components

The Claude Task Manager consists of several key components:

1. **Task Manager**: Core library for managing Claude instances
   - Handles starting and stopping Claude instances
   - Tracks instance status and metadata
   - Provides API for interacting with instances

2. **Web Dashboard**: Web interface for monitoring and controlling instances
   - Displays all Claude instances and their status
   - Allows filtering, searching, and bulk operations
   - Shows prompt responses and statistics

3. **Monitoring System**: Tools for monitoring Claude instances
   - Automatically responds to Claude prompts
   - Tracks statistics such as "yes" count
   - Can run as a background service

4. **CLI Tools**: Command-line utilities for working with Claude
   - Quick start tools for creating instances
   - Monitoring tools for terminal usage
   - Import/export utilities

## API Usage

The Claude Task Manager supports both legacy and modern APIs:

### Legacy API
```python
manager.start_instance(
    project_dir="/path/to/project", 
    prompt_path="/path/to/prompt.txt",
    use_tmux=True
)
```

### Modern API
```python
from src.core.models.instance import RuntimeType

manager.start_instance(
    project_dir="/path/to/project", 
    prompt_path="/path/to/prompt.txt",
    runtime_type=RuntimeType.TMUX
)
```

See the [API Refactoring Guide](API_REFACTORING.md) for more details on API usage.

## Feature Overview

The system includes these key features:

- **Prompt Handling**: Delivers prompts to Claude and handles responses
- **Auto-Response**: Automatically responds to Claude prompts like "Do you want to create a file?"
- **Command Approval**: Automatically approves shell command execution
- **Yes Count Tracking**: Tracks how many times prompts have been auto-responded to
- **TMUX Support**: Reliable execution via tmux sessions
- **Terminal.app Support**: Alternative to tmux for certain workflows
- **Web Dashboard**: Complete monitoring and control interface
- **Synchronization**: Perfect sync between UI and actual tmux sessions
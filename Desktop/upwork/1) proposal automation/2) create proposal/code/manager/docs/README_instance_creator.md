# Programmatic Claude Instance Creator

This utility allows you to create and manage Claude instances programmatically. The instances created are fully compatible with the Claude Task Manager web interface.

## Features

- Create Claude instances from a prompt file or direct text
- Run with no arguments to quickly create a test instance
- Choose between tmux and Terminal.app runtimes
- Option to open a terminal window automatically (or not)
- Save prompts permanently or use temporary files
- List all current Claude instances
- Stop running instances
- Import existing tmux sessions that aren't in the interface
- Usable as both a command-line tool and a Python module

## Usage

### Command-line Examples

#### Quick create an instance with default settings:
```bash
python3 test_instance.py
```

#### Create an instance with a prompt file:
```bash
python3 test_instance.py --prompt example_prompt.txt
```

#### Create an instance with direct text prompt:
```bash
python3 test_instance.py --prompt "Analyze this codebase and suggest improvements"
```

#### Create an instance with Terminal.app instead of tmux:
```bash
python3 test_instance.py --prompt example_prompt.txt --no_tmux
```

#### Create an instance and save the prompt permanently:
```bash
python3 test_instance.py --prompt "Analyze this code" --save_prompt
```

#### Create an instance and open a terminal window for it:
```bash
python3 test_instance.py --prompt "Analyze this code" --open_terminal
```

#### List all instances:
```bash
python3 test_instance.py --list
```

#### Stop a specific instance:
```bash
python3 test_instance.py --stop instance_id
```

#### Import existing tmux sessions:
```bash
python3 test_instance.py --import-tmux
```

### Python Module Examples

You can also use this as a Python module in your own scripts:

```python
from test_instance import create_claude_instance, list_instances, stop_instance, import_tmux_sessions

# Import any existing tmux sessions
import_tmux_sessions()

# Create a new Claude instance
instance_id = create_claude_instance(
    prompt="Analyze this codebase",
    project_dir="/path/to/project",
    use_tmux=True,
    save_prompt=True,
    open_terminal=False  # Don't automatically open a terminal window
)

# List all instances
instances = list_instances()
for instance in instances:
    print(f"Instance ID: {instance['id']}, Status: {instance['status']}")

# Stop an instance
stop_instance(instance_id)
```

## Arguments

- `--prompt`, `-t`: Prompt text or path to prompt file (required for creating instances)
- `--project_dir`, `-p`: Path to project directory (defaults to current directory)
- `--use_tmux`, `-m`: Use tmux (default) instead of Terminal.app
- `--no_tmux`, `-n`: Use Terminal.app instead of tmux
- `--save_prompt`, `-s`: Save the prompt text to a permanent file
- `--open_terminal`, `-o`: Automatically open a terminal window for the session
- `--list`, `-l`: List all Claude instances
- `--stop`, `-k`: Stop a Claude instance by ID
- `--import-tmux`, `-i`: Import existing tmux sessions into the manager

## Integration with Web Interface

Instances created with this script will appear in the Claude Task Manager web interface. You can start the web interface with:

```bash
python3 start_dashboard.py
```

Then use the web interface to monitor, view, or stop instances that were created programmatically.
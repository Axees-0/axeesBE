# Claude Manager Prompt Handling Features

This document describes the prompt handling features of the Claude Task Manager system, which enables automated interaction with Claude instances.

## Overview

The Claude Task Manager provides robust functionality for handling prompts and automating interactions with Claude instances, including:

1. **Prompt Delivery**: Send prompts to Claude instances via file or direct text
2. **Auto-Response**: Automatically respond to various Claude prompts (yes/no questions)
3. **Command Approval**: Automatically approve shell command execution requests
4. **Yes Count Tracking**: Track the number of auto-responses provided to Claude

## Prompt Delivery

The system supports two main methods of sending prompts to Claude:

### File-Based Prompts

```python
manager.start_instance(
    project_dir="/path/to/project",
    prompt_path="/path/to/prompt.txt",
    use_tmux=True
)
```

### Direct Text Prompts

```python
manager.start_instance(
    project_dir="/path/to/project",
    prompt_text="Hello Claude, please help me with...",
    use_tmux=True
)
```

## Auto-Response System

The system automatically monitors Claude instances for various prompts that require user interaction and responds appropriately.

### Types of Auto-Responses

1. **Trust Prompts**: "Do you trust the files in this folder?" prompts are automatically accepted
2. **Yes/No Prompts**: Standard yes/no questions are automatically handled 
3. **Command Execution**: Shell command execution requests are automatically approved

### Yes Count Tracking

The system keeps track of how many times it has automatically responded to Claude prompts:

```python
# Check the yes count for an instance
yes_count = manager.instances[instance_id].yes_count

# Also tracked in the instance listing
instances = manager.list_instances()
for instance in instances:
    print(f"Instance {instance['id']} yes count: {instance['yes_count']}")
```

## Implementation

The automatic prompt handling is implemented in the `_monitor_instance` method of the `ClaudeTaskManager` class, which:

1. Continually checks the content of Claude's tmux session
2. Detects various types of prompts using pattern matching
3. Sends appropriate responses using tmux commands
4. Increments the yes_count for tracking

## Testing

The prompt handling features are verified using the following test scripts:

- `test_basic_prompt.py`: Tests basic prompt delivery
- `test_yes_prompt.py`: Tests auto-response to yes/no prompts
- `test_command_approval.py`: Tests command execution auto-approval
- `test_prompt_features.py`: Runs all prompt handling tests

To run the tests:

```bash
python tests/test_prompt_features.py
```

## Example Usage

```python
from claude_task_manager import ClaudeTaskManager

# Initialize the manager
manager = ClaudeTaskManager()

# Start an instance with a prompt
instance_id = manager.start_instance(
    project_dir="/path/to/project",
    prompt_text="Hello Claude! Please create a file called test.txt with the content 'Hello World'.",
    use_tmux=True
)

# The system will automatically:
# 1. Send the prompt to Claude
# 2. Accept the trust prompt
# 3. Approve the command execution request
# 4. Increment the yes_count

# Check the yes count
print(f"Auto-responses: {manager.instances[instance_id].yes_count}")
```
# API Refactoring Guide

This document outlines the transition from the legacy API to the modern API in the Claude Task Manager codebase. The refactoring aims to address technical debt while maintaining backward compatibility.

## API Evolution

### Legacy API (Original)

The original implementation used simple boolean flags and separate fields:

- `use_tmux`: Boolean flag to determine if using tmux-based sessions
- `tmux_session_name`: String containing the tmux session name
- `terminal_id`: String containing Terminal.app ID

Example usage:
```python
instance_id = manager.start_instance(
    project_dir="/path/to/project",
    prompt_path="/path/to/prompt.txt",
    use_tmux=True,
    open_terminal=False
)
```

### Modern API (New)

The modern implementation uses enum types and unified fields:

- `runtime_type`: Enum value (TMUX or TERMINAL) replacing use_tmux
- `runtime_id`: String ID field for either tmux session or terminal ID

Example usage:
```python
from src.core.models.instance import RuntimeType

instance_id = manager.start_instance(
    project_dir="/path/to/project",
    prompt_path="/path/to/prompt.txt",
    runtime_type=RuntimeType.TMUX,
    open_terminal=False
)
```

## Implementation Details

### Backward Compatibility

The implementation has been refactored to support both APIs simultaneously:

1. The `start_instance` method accepts both `use_tmux` and `runtime_type` parameters
2. If `runtime_type` is provided, it takes precedence over `use_tmux`
3. If neither is provided, it defaults to `RuntimeType.TMUX` (equivalent to `use_tmux=True`)

### Field Mapping

The fields are mapped as follows:

| Legacy Field       | Modern Field                         | Notes                                      |
|--------------------|-------------------------------------|---------------------------------------------|
| `use_tmux=True`    | `runtime_type=RuntimeType.TMUX`     | Boolean to Enum                            |
| `use_tmux=False`   | `runtime_type=RuntimeType.TERMINAL` | Boolean to Enum                            |
| `tmux_session_name`| `runtime_id`                        | If using TMUX runtime                       |
| `terminal_id`      | `runtime_id`                        | If using TERMINAL runtime                   |

### Instance Serialization

When serializing instances to JSON:
- Both sets of fields are included for maximum compatibility
- The `to_dict()` method returns both legacy and modern fields
- When deserializing, the code checks for the presence of either field type

## Migration Guide

### For New Code

New code should prefer the modern API:

```python
from src.core.models.instance import RuntimeType

# Start an instance with the modern API
instance_id = manager.start_instance(
    project_dir="/path/to/project",
    prompt_path="/path/to/prompt.txt",
    runtime_type=RuntimeType.TMUX  # or RuntimeType.TERMINAL
)
```

### For Existing Code

Existing code using the legacy API will continue to work without changes:

```python
# Legacy code still works
instance_id = manager.start_instance(
    project_dir="/path/to/project",
    prompt_path="/path/to/prompt.txt",
    use_tmux=True  # or False
)
```

However, it's recommended to gradually migrate to the new API when modifying existing code.

## CLI Usage

The command-line interface has been updated to use the modern API:

```bash
# Using the modern runtime_type parameter
python -m src.create_claude_task \
    --project-dir /path/to/project \
    --prompt-path /path/to/prompt.txt \
    --runtime-type tmux  # or terminal
```

## Next Steps

Future work may include:

1. Complete deprecation of the legacy API fields with appropriate warnings
2. Additional tests specifically for the API transition
3. Documentation updates to standardize on the new API
4. Cleanup of redundant code once the transition is complete
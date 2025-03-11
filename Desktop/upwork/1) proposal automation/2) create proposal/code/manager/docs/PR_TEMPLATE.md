# API Refactoring: Consolidated use_tmux and runtime_type parameters

## Summary

This PR addresses the technical debt in the ClaudeTaskManager class by refactoring the API to use the modern `runtime_type` parameter while maintaining backward compatibility with the legacy `use_tmux` parameter. It also standardizes the use of `runtime_id` as a unified field for both tmux session names and terminal IDs.

## Changes

- Added support for `runtime_type` parameter in the ClaudeTaskManager
- Modified `start_instance()` to accept both old and new API parameters
- Updated `list_instances()` to include both legacy and modern field values
- Enhanced `view_terminal()` and `get_instance_content()` to work with both APIs
- Added unit tests for both API styles
- Added comprehensive API documentation in API_REFACTORING.md
- Updated CLI tools to use the new API

## Migration Path

This PR provides a clear migration path from the legacy API to the modern API:

1. New code should use the modern API with `runtime_type`
2. Existing code can continue to use `use_tmux` without changes
3. Methods detect and handle both parameter styles automatically

## Test Plan

- Added dedicated test_api_refactoring.py test script that verifies both APIs
- Manual testing with both API styles
- Existing tests continue to pass with the refactored code

## Documentation

- Created detailed API_REFACTORING.md document
- Updated inline documentation with parameter descriptions
- Added deprecation notices in docstrings for legacy parameters
- Added examples of both API usage patterns

## Notes

This change is fully backward compatible and should not require any immediate changes to existing code. The modern API provides a more structured and type-safe approach for future development.
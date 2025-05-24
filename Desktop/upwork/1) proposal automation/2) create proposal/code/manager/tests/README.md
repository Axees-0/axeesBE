# Claude Task Manager Tests

This directory contains the test suite for the Claude Task Manager application. Tests are organized by component/layer of the application.

## Test Organization

- **core/**: Tests for core instance and task management functionality
- **api/**: Tests for the API layer and API compatibility
- **process/**: Tests for process management (tmux, terminal)
- **web/**: Tests for the web dashboard UI, routes and components
- **prompt/**: Tests for prompt handling and auto-response functionality 
- **monitoring/**: Tests for monitoring service and thread functionality
- **utils/**: Tests for utility functions (path handling, date parsing, etc.)
- **integration/**: End-to-end integration tests
- **data/**: Test data and fixtures
- **runners/**: Test runner scripts for running multiple tests

## Running Tests

### Running All Tests
```bash
python -m unittest discover tests
```

### Running Tests for a Specific Category
```bash
python -m unittest discover tests/core
python -m unittest discover tests/web
```

### Running a Specific Test
```bash
python -m unittest tests/core/test_instance.py
```

### Using Test Runners
```bash
python tests/runners/run_monitoring_tests.py
python tests/runners/run_sync_tests.py
```

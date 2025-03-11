# Claude Task Manager Guidelines

## Testing Policy

Every time you make code changes, remember to run relevant tests to ensure your changes haven't broken existing functionality. This helps maintain the stability and reliability of the application.

### Test-Driven Development (TDD) Approach

For all new features and UI enhancements:

1. **Write Tests First**: Before implementing a new feature, write a test that defines the expected behavior
2. **Run the Test**: Verify it fails (since the feature doesn't exist yet)
3. **Implement the Feature**: Write the minimum code needed to pass the test
4. **Run Tests Again**: Verify your implementation passes the test
5. **Run Regression Tests**: Ensure your changes don't break existing functionality
6. **Refactor**: Clean up your code while keeping the tests passing

### Core Testing Principles

- **Test each feature layer**: UI, API, and backend logic
- **Mock external dependencies**: Avoid hitting external services in unit tests
- **Focus on behavior**: Test what the code does, not how it's implemented
- **Keep tests independent**: One test should not depend on another

### Test Commands

To run basic tests:
```bash
# Run a single test file (replace with specific test file)
python -m tests.test_basic_prompt

# Run UI-specific tests
python -m tests.test_dashboard_ui

# Run runtime integration tests
python -m tests.test_runtime_integration

# Run all monitoring tests
python -m tests.run_monitoring_tests

# Run a comprehensive test suite
python -m unittest discover -s tests
```

### Testing Strategy Based on Change Type

1. **UI Changes**: Run `tests.test_dashboard_ui` to verify UI functionality
2. **API Changes**: Run API-specific tests and ensure UI tests still pass
3. **Core Logic Changes**: Run specific component tests plus integration tests
4. **Feature Additions**: Add a new test file specific to the feature

### Code Style Guidelines

- Follow the existing code style in each file
- Use meaningful variable and function names
- Add docstrings to new functions and classes
- Keep functions small and focused on a single task
- Include typing annotations for better IDE support

### Build and Launch Commands

To launch the dashboard:
```bash
python manage.py dashboard
# or simply
python manage.py
```

To launch the monitor:
```bash
python manage.py monitor
```

Quick start script that automatically sets up the environment:
```bash
python quick_start.py
```

Direct dashboard launch:
```bash
python launcher.py
```
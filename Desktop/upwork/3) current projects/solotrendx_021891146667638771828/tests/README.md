# SoloTrend X Test Suite

This directory contains tests for the SoloTrend X trading system, organized according to the Universal Directory Structure.

## Test Organization

- **Unit Tests** (`/unit/`): Tests for individual components in isolation
- **Integration Tests** (`/integration/`): Tests for interactions between components
- **End-to-End Tests** (`/e2e/`): Tests for complete workflows

## Running Tests

```bash
# Run all tests
pytest

# Run unit tests only
pytest tests/unit

# Run integration tests only
pytest tests/integration

# Run e2e tests only
pytest tests/e2e

# Run tests with specific markers
pytest -m "unit and not slow"
pytest -m "mock"
```

## Test Development Guidelines

1. Follow the test-driven development approach:
   - Write tests before implementing features
   - Ensure each component has comprehensive tests
   - Use mocks for external dependencies

2. Test naming conventions:
   - Files: `test_*.py`
   - Classes: `Test*`
   - Functions: `test_*`

3. Mock usage:
   - Create mocks for any Windows/MT4-specific components
   - Use fixtures to provide consistent test data
   - Place mock implementations in the appropriate `mocks` directory

4. Coverage goals:
   - Unit tests: 90%+ coverage
   - Integration tests: Key workflows covered
   - E2E tests: Main user journeys covered
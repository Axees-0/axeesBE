# MT4Connector Tests

This directory contains tests for the MT4Connector project, including specific tests for the Telegram bot integration.

## Running Tests

Run all tests with the test runner:

```bash
python tests/run_all_tests.py
```

For verbose output:

```bash
python tests/run_all_tests.py -v
```

## Test Structure

- `test_telegram_bot.py`: Unit tests for the TelegramBot and TelegramSignalHandler classes
- `test_integration.py`: Integration tests for the Telegram bot with MT4 connector
- `run_all_tests.py`: Test runner script

## Test Dependencies

Tests use the python `unittest` module and mocking features to simulate the behavior of external dependencies like the Telegram API and MT4 API.

## Adding New Tests

When adding new functionality:

1. Create a corresponding test file in this directory
2. Make sure the test filename starts with `test_`
3. Add the new test to the test runner by adding the file to this directory
4. Run all tests to ensure everything passes
# MT4Connector Development Guidelines

## Development Workflow

1. **Code modification/addition workflow**:
   - Update code
   - Create/update tests for the modified code
   - Add test to the `run_all_tests.py` file if it's a new test
   - Run ALL tests using `python run_all_tests.py`
   - Debug failed tests until all tests pass
   - Only then, commit changes to git

## Important Commands

### Testing
- Run all tests: `python run_all_tests.py`
- Run individual test: `python tests/test_<module>.py`

### Development
- Start MT4 Connector: `python run_mt4_connector.py --mock`
- Start MT4 Connector with Telegram: `python run_with_telegram.py --skip-checks`
- Generate test signal: `python generate_test_signal.py --type buy`

### Project Rules

1. **NEVER commit code without running tests**
2. **ALL tests MUST pass before committing**
3. New features MUST have corresponding tests
4. Keep test coverage high
5. Follow existing code style and patterns

## Project Structure

- `app.py` - Main application logic
- `config.py` - Configuration settings
- `mt4_api.py` - MT4 Manager API integration
- `signal_processor.py` - Signal processing logic
- `telegram_bot/` - Telegram bot functionality
  - `bot.py` - TelegramBot class implementation
  - `signal_handler.py` - TelegramSignalHandler for integration
- `tests/` - Test suite
  - Individual test modules
  - `run_all_tests.py` - Test runner
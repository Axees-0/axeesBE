"""
Claude Task Manager Test Suite

This package contains tests organized into the following categories:
- core: Core instance and task management
- api: API functionality and compatibility
- process: Process management (tmux, terminal)
- web: Web dashboard UI, routes and components
- prompt: Prompt handling and auto-responses
- monitoring: Monitoring service and thread functionality
- utils: Utility functions and helpers
- integration: End-to-end integration tests
"""

import os
import sys

# Add the project root to the path so tests can find the src module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
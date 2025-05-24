"""
Web dashboard and UI components for the Claude Task Manager.

This module contains the web server, routes, and UI components.
"""

from .dashboard import app, dashboard, refresh, api_project_dir
from .app import create_app
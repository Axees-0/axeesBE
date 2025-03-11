"""
Web dashboard application for Claude Task Manager.
"""
import os
import threading
import time
from flask import Flask, render_template, redirect, url_for, request, jsonify, send_file

from src.utils.logging import get_task_manager_logger
from src.utils.config import get_config
from src.core.task_manager import ClaudeTaskManager
from src.core.models.instance import RuntimeType
from src.infrastructure.persistence.json_store import JSONInstanceStorage
from src.infrastructure.process.tmux import TmuxProcessManager
from src.infrastructure.process.terminal import TerminalProcessManager


def create_app():
    """Create and configure the Flask application."""
    # Get configuration
    config = get_config()
    
    # Set up paths
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    static_folder = os.path.join(root_dir, "static")
    template_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
    
    # Get instance file path
    instance_file = config.get("storage.instances_file", "config/claude_instances.json")
    if not os.path.isabs(instance_file):
        instance_file = os.path.join(root_dir, instance_file)
    
    # Set up logger
    logger = get_task_manager_logger()
    logger.info(f"Web dashboard using instance file: {instance_file}")
    
    # Set up task manager
    storage = JSONInstanceStorage(instance_file, logger)
    tmux_manager = TmuxProcessManager(logger)
    terminal_manager = TerminalProcessManager(logger)
    
    task_manager = ClaudeTaskManager(
        storage=storage,
        tmux_manager=tmux_manager,
        terminal_manager=terminal_manager,
        logger=logger
    )
    
    # Create Flask app
    app = Flask(__name__, 
                static_folder=static_folder, 
                static_url_path='/static',
                template_folder=template_folder)
    
    # Store task manager in app context
    app.config['TASK_MANAGER'] = task_manager
    
    # Register routes
    from src.web.routes.api_routes import api_bp
    from src.web.routes.ui_routes import ui_bp
    
    app.register_blueprint(api_bp)
    app.register_blueprint(ui_bp)
    
    return app


def run_dashboard(host="0.0.0.0", port=5000, debug=False):
    """Run the dashboard application."""
    app = create_app()
    
    # Start background thread to open browser
    threading.Thread(target=lambda: open_browser(port), daemon=True).start()
    
    # Run the app
    app.run(host=host, port=port, debug=debug)


def open_browser(port):
    """Open a web browser to the dashboard."""
    import webbrowser
    import socket
    
    # No sleep needed - we're using a separate thread
    
    # Get the computer's hostname for a more reliable connection
    hostname = socket.gethostname()
    
    # Try to open with the hostname first
    url = f'http://{hostname}:{port}'
    print(f"Opening browser to {url}")
    
    # Use a more reliable approach for opening browser
    import subprocess
    import platform
    
    if platform.system() == 'Darwin':  # macOS
        try:
            subprocess.run(['open', url])
            return
        except:
            pass
    
    # Fallback to standard method
    try:
        webbrowser.open(url)
    except:
        # Last resort - try localhost
        print("Fallback to localhost...")
        webbrowser.open(f'http://localhost:{port}')

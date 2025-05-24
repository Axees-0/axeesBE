"""
UI routes for the web dashboard.
"""
import os
import time
from datetime import datetime
from flask import Blueprint, render_template, redirect, url_for, current_app, request, send_file


ui_bp = Blueprint('ui', __name__)


@ui_bp.route('/')
def dashboard():
    """Main dashboard page."""
    # Get the task manager
    task_manager = current_app.config['TASK_MANAGER']
    
    # Get instance list first without synchronization for faster initial load
    instance_list = task_manager.list_instances()
    
    # Get current time
    current_time = datetime.now().strftime("%H:%M:%S")
    
    # Add current timestamp for time calculations
    current_timestamp = time.time()
    
    # Render the dashboard template
    return render_template('dashboard.html', 
                          instances=instance_list,
                          current_time=current_time,
                          current_timestamp=current_timestamp,
                          task_manager=task_manager,
                          os=os)


@ui_bp.route('/refresh')
def refresh():
    """Refresh dashboard data."""
    # Get the task manager
    task_manager = current_app.config['TASK_MANAGER']
    
    # Force reload of instances from storage
    task_manager.load_instances()
    
    # Run synchronization
    task_manager.sync_with_system()
    
    # Get updated instance list
    instance_list = task_manager.list_instances()
    
    # Get current time
    current_time = datetime.now().strftime("%H:%M:%S")
    
    # Add current timestamp for time calculations
    current_timestamp = time.time()
    
    # Render the dashboard template
    return render_template('dashboard.html', 
                          instances=instance_list,
                          current_time=current_time,
                          current_timestamp=current_timestamp,
                          task_manager=task_manager,
                          os=os)


@ui_bp.route('/svg/<path:svg_path>')
def serve_svg(svg_path):
    """Serve SVG files with proper encoding."""
    import urllib.parse
    
    # Decode the path which may contain spaces and special characters
    decoded_path = urllib.parse.unquote(svg_path)
    full_path = f"/{decoded_path}"  # Add the leading slash back
    
    if not os.path.exists(full_path):
        return "", 404
    
    try:
        # Read the SVG file
        with open(full_path, 'rb') as f:
            svg_data = f.read()
        
        # Return the SVG with the correct MIME type
        from flask import Response
        return Response(svg_data, mimetype='image/svg+xml')
    except Exception:
        return "", 500


@ui_bp.route('/shutdown')
def shutdown():
    """Shutdown the server."""
    import os
    
    # Just log the shutdown request - the server will continue running
    print("Server shutdown requested but ignored for safety")
    
    # Return empty response
    return ""


@ui_bp.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors."""
    return render_template('error.html', error=str(e)), 404


@ui_bp.errorhandler(500)
def server_error(e):
    """Handle 500 errors."""
    return render_template('error.html', error=str(e)), 500

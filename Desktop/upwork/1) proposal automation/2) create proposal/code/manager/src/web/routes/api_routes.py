"""
API routes for the web dashboard.
"""
import os
import tempfile
import time
import json
from flask import Blueprint, jsonify, request, current_app, Response

from src.core.models.instance import RuntimeType


api_bp = Blueprint('api', __name__, url_prefix='/api')


@api_bp.route('/instances', methods=['GET'])
def get_instances():
    """Get all instances."""
    task_manager = current_app.config['TASK_MANAGER']
    
    # Get query parameter for sync (default to False)
    sync = request.args.get('sync', 'false').lower() == 'true'
    
    # Only synchronize with system if explicitly requested
    if sync:
        task_manager.sync_with_system()
        
    instances = task_manager.list_instances()
    return jsonify(instances)


@api_bp.route('/instances/<instance_id>', methods=['GET'])
def get_instance(instance_id):
    """Get a specific instance."""
    task_manager = current_app.config['TASK_MANAGER']
    instance = task_manager.get_instance(instance_id)
    
    if not instance:
        return jsonify({"error": "Instance not found"}), 404
        
    return jsonify(instance.to_dict())


@api_bp.route('/instances', methods=['POST'])
def create_instance():
    """Create a new instance."""
    task_manager = current_app.config['TASK_MANAGER']
    
    # Get request data
    project_dir = request.form.get('project_dir')
    prompt_path = request.form.get('prompt_path')
    prompt_text = request.form.get('prompt_text')
    runtime_type_str = request.form.get('runtime_type', 'tmux')
    open_window = request.form.get('open_window') == 'on'
    
    # Validate project_dir
    if not project_dir:
        return jsonify({"error": "Project directory is required"}), 400
        
    # Validate prompt
    if not prompt_path and not prompt_text:
        return jsonify({"error": "Either prompt_path or prompt_text is required"}), 400
        
    # Convert runtime_type to enum
    runtime_type = RuntimeType.TMUX if runtime_type_str.lower() == 'tmux' else RuntimeType.TERMINAL
    
    # Handle direct prompt text by creating a temporary file
    if not prompt_path and prompt_text:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.txt', mode='w') as temp_file:
            temp_file.write(prompt_text)
            prompt_path = temp_file.name
    
    try:
        # Create the instance
        instance_id = task_manager.start_instance(
            project_dir=project_dir,
            prompt_path=prompt_path, 
            runtime_type=runtime_type,
            open_terminal=open_window
        )
        
        # Return the instance ID
        return jsonify({"instance_id": instance_id, "success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route('/instances/<instance_id>', methods=['DELETE'])
def delete_instance(instance_id):
    """Delete an instance."""
    task_manager = current_app.config['TASK_MANAGER']
    
    success = task_manager.delete_instance(instance_id)
    
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to delete instance"}), 500


@api_bp.route('/instances/batch/delete', methods=['POST'])
def delete_instances():
    """Delete multiple instances."""
    task_manager = current_app.config['TASK_MANAGER']
    
    # Get instance IDs from request
    data = request.json
    if not data or 'instances' not in data:
        return jsonify({"error": "No instances specified"}), 400
        
    instance_ids = data['instances']
    
    # Validate instance IDs
    if not instance_ids or not isinstance(instance_ids, list):
        return jsonify({"error": "Invalid instance IDs"}), 400
        
    # Delete instances
    deleted_ids = []
    errors = []
    
    for instance_id in instance_ids:
        try:
            success = task_manager.delete_instance(instance_id)
            if success:
                deleted_ids.append(instance_id)
            else:
                errors.append(f"Failed to delete instance {instance_id}")
        except Exception as e:
            errors.append(f"Error deleting instance {instance_id}: {str(e)}")
            
    # Return result
    return jsonify({
        "success": True,
        "deleted_ids": deleted_ids,
        "errors": errors,
        "remaining_ids": [i['id'] for i in task_manager.list_instances()]
    })


@api_bp.route('/instances/<instance_id>/stop', methods=['POST'])
def stop_instance(instance_id):
    """Stop an instance."""
    task_manager = current_app.config['TASK_MANAGER']
    
    success = task_manager.stop_instance(instance_id)
    
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to stop instance"}), 500


@api_bp.route('/instances/<instance_id>/interrupt', methods=['POST'])
def interrupt_instance(instance_id):
    """Interrupt an instance."""
    task_manager = current_app.config['TASK_MANAGER']
    
    success = task_manager.interrupt_instance(instance_id)
    
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to interrupt instance"}), 500


@api_bp.route('/instances/<instance_id>/view', methods=['POST'])
def view_instance(instance_id):
    """Open a terminal window to view an instance."""
    task_manager = current_app.config['TASK_MANAGER']
    
    success = task_manager.view_terminal(instance_id)
    
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to open terminal window"}), 500


@api_bp.route('/instances/<instance_id>/prompt', methods=['POST'])
def send_prompt(instance_id):
    """Send a prompt to an instance."""
    task_manager = current_app.config['TASK_MANAGER']
    
    # Get request data
    data = request.json
    prompt = data.get('prompt')
    submit = data.get('submit', True)
    
    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400
        
    success = task_manager.send_prompt_to_instance(
        instance_id=instance_id,
        prompt_text=prompt,
        submit=submit
    )
    
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Failed to send prompt"}), 500


@api_bp.route('/instances/<instance_id>/content', methods=['GET'])
def get_instance_content(instance_id):
    """Get the current content from an instance."""
    task_manager = current_app.config['TASK_MANAGER']
    
    content = task_manager.get_instance_content(instance_id)
    
    if content is not None:
        return jsonify({"content": content})
    else:
        return jsonify({"error": "Failed to get instance content"}), 500


@api_bp.route('/sync', methods=['POST'])
def sync_instances():
    """Synchronize instances with system processes."""
    task_manager = current_app.config['TASK_MANAGER']
    
    updated_count = task_manager.sync_with_system()
    
    return jsonify({
        "success": True,
        "updated": updated_count > 0,
        "count": updated_count
    })


@api_bp.route('/prompt_files', methods=['GET'])
def get_prompt_files():
    """Get a list of prompt files."""
    # Get search query
    search_term = request.args.get('q', '').lower()
    
    # Get prompt directory from configuration (use default if not found)
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_app.root_path)))
    prompt_dir = os.path.join(root_dir, 'prompts')
    
    prompt_files = []
    
    if os.path.exists(prompt_dir) and os.path.isdir(prompt_dir):
        for file in os.listdir(prompt_dir):
            if file.endswith('.txt'):
                file_path = os.path.join(prompt_dir, file)
                
                # If search term is provided, filter by name
                if search_term and search_term not in file.lower():
                    continue
                    
                # Add file to list
                prompt_files.append({
                    "path": file_path,
                    "name": file
                })
                
    # Sort files by name
    prompt_files.sort(key=lambda x: x["name"])
    
    return jsonify(prompt_files)


@api_bp.route('/prompt_file', methods=['GET'])
def load_prompt_file():
    """Load a prompt file's content."""
    file_path = request.args.get('path')
    
    if not file_path:
        return jsonify({"error": "No file path provided"}), 400
        
    try:
        if os.path.exists(file_path) and os.path.isfile(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
                
            return jsonify({"success": True, "content": content})
        else:
            return jsonify({"error": f"File not found: {file_path}"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route('/file_upload', methods=['POST'])
def upload_file():
    """Handle file upload and extract its path."""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    is_directory = request.form.get('is_directory') == '1'
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    # Save the file temporarily to get its content
    temp_dir = tempfile.mkdtemp()
    try:
        temp_file_path = os.path.join(temp_dir, file.filename)
        file.save(temp_file_path)
        
        # Return the file path or name
        return jsonify({"path": file.filename})
    finally:
        # Clean up
        import shutil
        shutil.rmtree(temp_dir)


@api_bp.route('/directory_find', methods=['POST'])
def find_directory():
    """Find a directory path based on a name."""
    # Get directory name
    dir_name = request.form.get('directory_name', '')
    
    if not dir_name:
        return jsonify({"error": "No directory name provided"}), 400
        
    # Clean up the directory name
    import re
    dir_name = re.sub(r'\([^)]*\)', '', dir_name).strip()
    dir_name = dir_name.replace("'", "").replace("'", "").strip()
    
    # If it's a full path and exists, return it
    if os.path.isdir(dir_name):
        return jsonify({"path": os.path.normpath(dir_name)})
        
    # Try common locations
    common_locations = [
        os.path.join(os.path.expanduser('~'), dir_name),
        os.path.join(os.path.expanduser('~'), 'Desktop', dir_name),
        os.path.join(os.path.expanduser('~'), 'Documents', dir_name),
        os.path.join(os.path.expanduser('~'), 'Desktop', 'upwork', dir_name)
    ]
    
    for loc in common_locations:
        if os.path.isdir(loc):
            return jsonify({"path": os.path.normpath(loc)})
            
    # If not found, return the original name
    return jsonify({"path": dir_name})


@api_bp.route('/project_dir/<project_id>', methods=['GET'])
def get_project_dir(project_id):
    """Get a project directory by ID."""
    task_manager = current_app.config['TASK_MANAGER']
    
    project_dir = task_manager.find_project_dir_by_id(project_id)
    
    if project_dir:
        return jsonify({"project_dir": project_dir})
    else:
        return jsonify({"error": "Project directory not found"}), 404

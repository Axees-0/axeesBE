"""
Main entry point for Claude Task Manager.
"""
import os
import sys
import argparse
from src.utils.logging import get_task_manager_logger
from src.utils.config import get_config


def main():
    """Main entry point for the application."""
    # Set up argument parser
    parser = argparse.ArgumentParser(description="Claude Task Manager")
    
    # Add subparsers for different commands
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Dashboard command
    dashboard_parser = subparsers.add_parser("dashboard", help="Launch the web dashboard")
    dashboard_parser.add_argument("--port", type=int, help="Port to run the dashboard on")
    dashboard_parser.add_argument("--host", type=str, help="Host to bind the dashboard to")
    
    # Monitor command
    monitor_parser = subparsers.add_parser("monitor", help="Monitor Claude instances")
    
    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new Claude instance")
    create_parser.add_argument("--project-dir", "-p", type=str, required=True, 
                               help="Project directory")
    create_parser.add_argument("--prompt-file", "-f", type=str, 
                               help="Path to prompt file")
    create_parser.add_argument("--prompt-text", "-t", type=str, 
                               help="Direct prompt text")
    create_parser.add_argument("--runtime", "-r", type=str, default="tmux",
                               choices=["tmux", "terminal"], 
                               help="Runtime type (tmux or terminal)")
    create_parser.add_argument("--open", "-o", action="store_true",
                               help="Open terminal window")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List Claude instances")
    list_parser.add_argument("--status", "-s", type=str,
                             choices=["all", "running", "stopped"],
                             default="all", help="Filter by status")
    
    # Stop command
    stop_parser = subparsers.add_parser("stop", help="Stop a Claude instance")
    stop_parser.add_argument("instance_id", type=str, help="Instance ID to stop")
    
    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete a Claude instance")
    delete_parser.add_argument("instance_id", type=str, help="Instance ID to delete")
    
    # View command
    view_parser = subparsers.add_parser("view", help="View a Claude instance")
    view_parser.add_argument("instance_id", type=str, help="Instance ID to view")
    
    # Send command
    send_parser = subparsers.add_parser("send", help="Send a prompt to a Claude instance")
    send_parser.add_argument("instance_id", type=str, help="Instance ID to send to")
    send_parser.add_argument("--prompt-file", "-f", type=str, 
                           help="Path to prompt file")
    send_parser.add_argument("--prompt-text", "-t", type=str, 
                           help="Direct prompt text")
    send_parser.add_argument("--no-submit", "-n", action="store_true",
                           help="Don't submit the prompt (don't send Enter)")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Get logger
    logger = get_task_manager_logger()
    
    # Get config
    config = get_config()
    
    # Execute the appropriate command
    if args.command == "dashboard":
        logger.info("Starting dashboard")
        from src.web.app import run_dashboard
        
        port = args.port or config.get("dashboard.port", 5000)
        host = args.host or config.get("dashboard.host", "0.0.0.0")
        
        run_dashboard(host=host, port=port)
    elif args.command == "monitor":
        logger.info("Starting monitor")
        from src.infrastructure.monitoring.monitor import run_monitor
        
        run_monitor()
    elif args.command == "create":
        logger.info(f"Creating instance in {args.project_dir}")
        from src.cli.commands.create import create_instance
        
        instance_id = create_instance(
            project_dir=args.project_dir,
            prompt_file=args.prompt_file,
            prompt_text=args.prompt_text,
            runtime=args.runtime,
            open_terminal=args.open
        )
        
        print(f"Created instance: {instance_id}")
    elif args.command == "list":
        from src.cli.commands.list import list_instances
        
        instances = list_instances(status_filter=args.status)
        
        # Print instances in a table format
        print(f"{'ID':<36} {'Status':<10} {'Runtime':<10} {'Project Directory':<50}")
        print("-" * 106)
        
        for instance in instances:
            print(f"{instance['id']:<36} {instance['status']:<10} "
                  f"{instance['runtime_type_display']:<10} {instance['project_dir']:<50}")
    elif args.command == "stop":
        from src.cli.commands.manage import stop_instance
        
        success = stop_instance(args.instance_id)
        
        if success:
            print(f"Stopped instance: {args.instance_id}")
        else:
            print(f"Failed to stop instance: {args.instance_id}")
            sys.exit(1)
    elif args.command == "delete":
        from src.cli.commands.manage import delete_instance
        
        success = delete_instance(args.instance_id)
        
        if success:
            print(f"Deleted instance: {args.instance_id}")
        else:
            print(f"Failed to delete instance: {args.instance_id}")
            sys.exit(1)
    elif args.command == "view":
        from src.cli.commands.manage import view_instance
        
        success = view_instance(args.instance_id)
        
        if not success:
            print(f"Failed to view instance: {args.instance_id}")
            sys.exit(1)
    elif args.command == "send":
        from src.cli.commands.manage import send_prompt
        
        if not args.prompt_file and not args.prompt_text:
            print("Error: Either --prompt-file or --prompt-text must be provided")
            sys.exit(1)
            
        success = send_prompt(
            instance_id=args.instance_id,
            prompt_file=args.prompt_file,
            prompt_text=args.prompt_text,
            submit=not args.no_submit
        )
        
        if success:
            print(f"Prompt sent to instance: {args.instance_id}")
        else:
            print(f"Failed to send prompt to instance: {args.instance_id}")
            sys.exit(1)
    else:
        # Default to dashboard if no command is specified
        from src.web.app import run_dashboard
        
        port = config.get("dashboard.port", 5000)
        host = config.get("dashboard.host", "0.0.0.0")
        
        run_dashboard(host=host, port=port)
        

if __name__ == "__main__":
    main()
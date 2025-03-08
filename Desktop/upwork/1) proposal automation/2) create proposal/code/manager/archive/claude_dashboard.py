#!/usr/bin/env python3
import os
import subprocess
import time
import json
from datetime import datetime
import curses
import functools
from claude_task_manager import ClaudeTaskManager

def draw_header(stdscr, max_y, max_x):
    """Draw the header for the dashboard."""
    header_text = "CLAUDE TASK MANAGER DASHBOARD"
    stdscr.attron(curses.color_pair(3) | curses.A_BOLD)
    stdscr.addstr(0, max_x//2 - len(header_text)//2, header_text)
    stdscr.attroff(curses.color_pair(3) | curses.A_BOLD)
    
    # Draw a line under the header
    stdscr.attron(curses.color_pair(2))
    stdscr.addstr(1, 0, "=" * (max_x-1))
    stdscr.attroff(curses.color_pair(2))

def draw_footer(stdscr, max_y, max_x, filter_active=False, sort_key=None, sort_reverse=False, multi_select=False):
    """Draw the footer with command options."""
    base_commands = "[Q]uit  [A]dd  [S]top  [R]efresh"
    advanced_commands = "[F]ilter  [O]rder  [D]elete  [M]ulti-select"
    filter_status = f" | Filter: {'Active' if filter_active else 'None'}"
    sort_status = f" | Sort: {sort_key if sort_key else 'None'}{' (Rev)' if sort_reverse else ''}"
    select_status = f" | {'Multi-select: ON' if multi_select else ''}"
    
    footer_commands = f"{base_commands} | {advanced_commands}{filter_status}{sort_status}{select_status}"
    
    stdscr.attron(curses.color_pair(2))
    # Use max_x-1 to avoid writing to the last column
    stdscr.addstr(max_y-1, 0, "=" * (max_x-1))
    stdscr.attroff(curses.color_pair(2))
    
    # Ensure footer text doesn't exceed screen width
    if len(footer_commands) > max_x - 4:
        footer_commands = footer_commands[:max_x-7] + "..."
    
    stdscr.attron(curses.color_pair(4) | curses.A_BOLD)
    stdscr.addstr(max_y-1, 2, footer_commands)
    stdscr.attroff(curses.color_pair(4) | curses.A_BOLD)

def draw_instance_table(stdscr, max_y, max_x, instances, selected_idx=None, selected_items=None):
    """Draw the table of Claude instances."""
    if not instances:
        stdscr.addstr(3, 2, "No Claude instances running. Press 'A' to add a new instance.")
        return
    
    # Table headers
    headers = ["ID", "STATUS", "UPTIME", "YES COUNT", "LAST YES", "DIRECTORY", "PROMPT FILE"]
    
    # Draw column headers
    col_widths = [10, 10, 12, 12, 12, 30, 30]  # Adjust based on your terminal size
    x_pos = 2
    
    stdscr.attron(curses.color_pair(1) | curses.A_BOLD)
    for i, header in enumerate(headers):
        if x_pos + col_widths[i] <= max_x - 2:
            stdscr.addstr(3, x_pos, f"{header:<{col_widths[i]}}")
            x_pos += col_widths[i]
    stdscr.attroff(curses.color_pair(1) | curses.A_BOLD)
    
    # Draw a line under the headers
    stdscr.addstr(4, 2, "-" * (min(max_x-5, sum(col_widths))))
    
    # Draw instance rows
    for i, instance in enumerate(instances):
        y_pos = 5 + i
        
        # Skip if row would be below screen
        if y_pos > max_y - 2:
            break
        
        # Highlight selected row or multi-selected items
        selected = False
        if selected_idx is not None and i == selected_idx:
            stdscr.attron(curses.color_pair(5))
            selected = True
        elif selected_items and instance["id"] in selected_items:
            stdscr.attron(curses.color_pair(6))  # Different color for multi-selected
            selected = True
        
        # Get status color
        status_color = curses.color_pair(3)  # Default green
        if instance["status"] == "stopped":
            status_color = curses.color_pair(2)  # Yellow
        
        # Draw each cell
        x_pos = 2
        cols = [
            instance["id"],
            instance["status"],
            instance["uptime"],
            str(instance["yes_count"]),
            instance["last_yes"],
            instance["project_dir"],
            instance["prompt_path"]
        ]
        
        for j, col in enumerate(cols):
            # Make sure we don't try to write too close to the edge
            if x_pos + col_widths[j] < max_x - 2:
                displayed_width = col_widths[j]
            else:
                # Limit width to avoid writing off screen
                displayed_width = max_x - x_pos - 3
                if displayed_width <= 0:
                    break
                
            # Use status color only for the status column
            if j == 1:  # Status column
                stdscr.attron(status_color | curses.A_BOLD)
                stdscr.addstr(y_pos, x_pos, f"{col:<{displayed_width}}")
                stdscr.attroff(status_color | curses.A_BOLD)
            else:
                # Truncate long strings to fit within the column
                display_str = str(col)
                if len(display_str) > displayed_width:
                    display_str = display_str[:displayed_width-3] + "..."
                stdscr.addstr(y_pos, x_pos, f"{display_str:<{displayed_width}}")
                
            x_pos += col_widths[j]
        
        # Turn off highlight
        if selected:
            if i == selected_idx:
                stdscr.attroff(curses.color_pair(5))
            else:
                stdscr.attroff(curses.color_pair(6))

def add_instance_dialog(stdscr, max_y, max_x):
    """Display a dialog to add a new instance."""
    proj_dir = ""
    prompt_path = ""
    
    try:
        # Clear screen
        stdscr.clear()
        
        # Draw dialog border
        dialog_height = 8
        dialog_width = min(60, max_x - 4)
        start_y = max(1, max_y // 2 - dialog_height // 2)
        start_x = max(1, max_x // 2 - dialog_width // 2)
        
        # Make sure we don't exceed screen boundaries
        if start_y + dialog_height >= max_y:
            dialog_height = max_y - start_y - 1
        if start_x + dialog_width >= max_x:
            dialog_width = max_x - start_x - 1
        
        # Draw border
        for i in range(dialog_height):
            for j in range(dialog_width):
                if i == 0 or i == dialog_height - 1:
                    if j < dialog_width - 1:  # Avoid the last column
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_HLINE)
                elif j == 0 or j == dialog_width - 1:
                    if i < dialog_height - 1:  # Avoid the last row
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_VLINE)
        
        # Draw corners
        stdscr.addch(start_y, start_x, curses.ACS_ULCORNER)
        stdscr.addch(start_y, start_x + dialog_width - 1, curses.ACS_URCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x, curses.ACS_LLCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x + dialog_width - 1, curses.ACS_LRCORNER)
        
        # Dialog title
        title = "Add New Claude Instance"
        title_pos = max(start_x + 2, start_x + (dialog_width - len(title)) // 2)
        stdscr.attron(curses.color_pair(3) | curses.A_BOLD)
        stdscr.addstr(start_y, title_pos, title)
        stdscr.attroff(curses.color_pair(3) | curses.A_BOLD)
        
        # Form fields
        stdscr.addstr(start_y + 2, start_x + 2, "Project Directory:")
        stdscr.addstr(start_y + 4, start_x + 2, "Prompt File Path:")
        stdscr.addstr(start_y + 6, start_x + 2, "Press Enter to confirm or Esc to cancel")
        
        # Input box width
        input_width = min(40, dialog_width - 22)
        
        # Get input
        curses.echo()
        
        # Get project directory
        stdscr.move(start_y + 2, start_x + 20)
        try:
            proj_dir = stdscr.getstr(input_width).decode("utf-8")
        except Exception as e:
            pass
        
        # Get prompt file path
        stdscr.move(start_y + 4, start_x + 20)
        try:
            prompt_path = stdscr.getstr(input_width).decode("utf-8")
        except Exception as e:
            pass
        
        curses.noecho()
    
    except Exception as e:
        # Handle any curses errors gracefully
        pass
    
    return proj_dir, prompt_path

def stop_instance_dialog(stdscr, max_y, max_x, instances):
    """Display a dialog to stop an instance."""
    if not instances:
        return None
    
    try:
        # Clear screen
        stdscr.clear()
        
        # Count running instances
        running_instances = [i for i in instances if i["status"] == "running"]
        if not running_instances:
            stdscr.addstr(max_y//2, max_x//2 - 15, "No running instances to stop!")
            stdscr.refresh()
            time.sleep(2)
            return None
        
        # Make sure dialog fits on screen
        dialog_height = min(len(running_instances) + 6, max_y - 4)
        dialog_width = min(60, max_x - 4)
        start_y = max(1, max_y // 2 - dialog_height // 2)
        start_x = max(1, max_x // 2 - dialog_width // 2)
        
        # Make sure we don't exceed screen boundaries
        if start_y + dialog_height >= max_y:
            dialog_height = max_y - start_y - 1
        if start_x + dialog_width >= max_x:
            dialog_width = max_x - start_x - 1
        
        # Draw border
        for i in range(dialog_height):
            for j in range(dialog_width):
                if i == 0 or i == dialog_height - 1:
                    if j < dialog_width - 1:  # Avoid the last column
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_HLINE)
                elif j == 0 or j == dialog_width - 1:
                    if i < dialog_height - 1:  # Avoid the last row
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_VLINE)
        
        # Draw corners
        stdscr.addch(start_y, start_x, curses.ACS_ULCORNER)
        stdscr.addch(start_y, start_x + dialog_width - 1, curses.ACS_URCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x, curses.ACS_LLCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x + dialog_width - 1, curses.ACS_LRCORNER)
        
        # Dialog title
        title = "Stop Claude Instance"
        title_pos = max(start_x + 2, start_x + (dialog_width - len(title)) // 2)
        stdscr.attron(curses.color_pair(2) | curses.A_BOLD)
        stdscr.addstr(start_y, title_pos, title)
        stdscr.attroff(curses.color_pair(2) | curses.A_BOLD)
        
        # List instances
        stdscr.addstr(start_y + 2, start_x + 2, "Select instance to stop:")
        
        # Limit number of instances shown to fit dialog
        max_instances = dialog_height - 6
        shown_instances = running_instances[:max_instances]
        
        for i, instance in enumerate(shown_instances):
            # Truncate project_dir if needed
            proj_dir = instance['project_dir']
            max_dir_len = dialog_width - 10  # Leave room for index and ID
            if len(proj_dir) > max_dir_len:
                proj_dir = "..." + proj_dir[-(max_dir_len-3):]
                
            stdscr.addstr(start_y + 3 + i, start_x + 4, 
                        f"{i+1}. {instance['id']} - {proj_dir}")
        
        if len(running_instances) > max_instances:
            stdscr.addstr(start_y + 3 + max_instances, start_x + 4, 
                        f"...and {len(running_instances) - max_instances} more instances")
        
        prompt = f"Enter number (1-{len(shown_instances)}) or 0 to cancel: "
        stdscr.addstr(start_y + dialog_height - 2, start_x + 2, prompt)
        
        # Get input
        curses.echo()
        input_pos = min(start_x + 2 + len(prompt), max_x - 3)
        stdscr.move(start_y + dialog_height - 2, input_pos)
        
        try:
            choice = stdscr.getstr(2).decode("utf-8")
            if choice.isdigit():
                choice = int(choice)
                if 1 <= choice <= len(shown_instances):
                    return shown_instances[choice-1]["id"]
        except Exception as e:
            # Just ignore input errors and return None
            pass
        
        curses.noecho()
    except Exception as e:
        # Handle any curses errors gracefully
        pass
        
    return None

def filter_dialog(stdscr, max_y, max_x):
    """Display a dialog to set a filter."""
    try:
        # Clear screen
        stdscr.clear()
        
        # Draw dialog box
        dialog_height = 7
        dialog_width = min(60, max_x - 4)
        start_y = max(1, max_y // 2 - dialog_height // 2)
        start_x = max(1, max_x // 2 - dialog_width // 2)
        
        # Make sure we don't exceed screen boundaries
        if start_y + dialog_height >= max_y:
            dialog_height = max_y - start_y - 1
        if start_x + dialog_width >= max_x:
            dialog_width = max_x - start_x - 1
        
        # Draw dialog box
        for i in range(dialog_height):
            for j in range(dialog_width):
                if i == 0 or i == dialog_height - 1:
                    if j < dialog_width - 1:
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_HLINE)
                elif j == 0 or j == dialog_width - 1:
                    if i < dialog_height - 1:
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_VLINE)
        
        # Draw corners
        stdscr.addch(start_y, start_x, curses.ACS_ULCORNER)
        stdscr.addch(start_y, start_x + dialog_width - 1, curses.ACS_URCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x, curses.ACS_LLCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x + dialog_width - 1, curses.ACS_LRCORNER)
        
        # Dialog title
        title = "Filter Instances"
        title_pos = max(start_x + 2, start_x + (dialog_width - len(title)) // 2)
        stdscr.attron(curses.color_pair(1) | curses.A_BOLD)
        stdscr.addstr(start_y, title_pos, title)
        stdscr.attroff(curses.color_pair(1) | curses.A_BOLD)
        
        # Options
        options = ["1. Show all instances", 
                   "2. Show only running instances", 
                   "3. Show only stopped instances",
                   "4. Filter by keyword"]
        
        for i, option in enumerate(options):
            stdscr.addstr(start_y + 2 + i, start_x + 4, option)
        
        # Get user choice
        stdscr.addstr(start_y + dialog_height - 2, start_x + 4, "Enter choice (1-4) or 0 to cancel: ")
        
        curses.echo()
        stdscr.refresh()
        
        try:
            choice = stdscr.getstr(2).decode("utf-8")
            curses.noecho()
            
            if choice == "0":
                return None, None
            elif choice == "1":
                return "all", None
            elif choice == "2":
                return "status", "running"
            elif choice == "3":
                return "status", "stopped"
            elif choice == "4":
                # Get keyword
                stdscr.clear()
                stdscr.addstr(start_y + 3, start_x + 4, "Enter keyword to filter by: ")
                stdscr.refresh()
                curses.echo()
                keyword = stdscr.getstr(20).decode("utf-8")
                curses.noecho()
                return "keyword", keyword
        except Exception as e:
            pass
        
        curses.noecho()
    except Exception as e:
        pass
    
    return None, None

def sort_dialog(stdscr, max_y, max_x, current_sort=None, current_reverse=False):
    """Display a dialog to set sorting."""
    try:
        # Clear screen
        stdscr.clear()
        
        # Draw dialog box
        dialog_height = 9
        dialog_width = min(60, max_x - 4)
        start_y = max(1, max_y // 2 - dialog_height // 2)
        start_x = max(1, max_x // 2 - dialog_width // 2)
        
        # Draw dialog box
        for i in range(dialog_height):
            for j in range(dialog_width):
                if i == 0 or i == dialog_height - 1:
                    if j < dialog_width - 1:
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_HLINE)
                elif j == 0 or j == dialog_width - 1:
                    if i < dialog_height - 1:
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_VLINE)
        
        # Draw corners
        stdscr.addch(start_y, start_x, curses.ACS_ULCORNER)
        stdscr.addch(start_y, start_x + dialog_width - 1, curses.ACS_URCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x, curses.ACS_LLCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x + dialog_width - 1, curses.ACS_LRCORNER)
        
        # Dialog title
        title = "Sort Instances"
        title_pos = max(start_x + 2, start_x + (dialog_width - len(title)) // 2)
        stdscr.attron(curses.color_pair(1) | curses.A_BOLD)
        stdscr.addstr(start_y, title_pos, title)
        stdscr.attroff(curses.color_pair(1) | curses.A_BOLD)
        
        # Current sort
        current = f"Current: {current_sort or 'None'}"
        if current_sort and current_reverse:
            current += " (Reverse)"
        stdscr.addstr(start_y + 1, start_x + 4, current)
        
        # Options
        options = ["1. No sorting (default)", 
                   "2. Sort by ID",
                   "3. Sort by Status",
                   "4. Sort by Uptime",
                   "5. Sort by Yes Count",
                   "6. Toggle Reverse Order"]
        
        for i, option in enumerate(options):
            stdscr.addstr(start_y + 3 + i, start_x + 4, option)
        
        # Get user choice
        stdscr.addstr(start_y + dialog_height - 2, start_x + 4, "Enter choice (1-6) or 0 to cancel: ")
        
        curses.echo()
        stdscr.refresh()
        
        try:
            choice = stdscr.getstr(2).decode("utf-8")
            curses.noecho()
            
            if choice == "0":
                return current_sort, current_reverse
            elif choice == "1":
                return None, False
            elif choice == "2":
                return "id", current_reverse
            elif choice == "3":
                return "status", current_reverse
            elif choice == "4":
                return "uptime", current_reverse
            elif choice == "5":
                return "yes_count", current_reverse
            elif choice == "6":
                return current_sort, not current_reverse
        except Exception as e:
            pass
        
        curses.noecho()
    except Exception as e:
        pass
    
    return current_sort, current_reverse

def confirm_dialog(stdscr, max_y, max_x, message, title="Confirm"):
    """Display a confirmation dialog."""
    try:
        # Clear screen
        stdscr.clear()
        
        # Draw dialog box
        dialog_height = 6
        dialog_width = min(60, max_x - 4)
        start_y = max(1, max_y // 2 - dialog_height // 2)
        start_x = max(1, max_x // 2 - dialog_width // 2)
        
        # Draw dialog box
        for i in range(dialog_height):
            for j in range(dialog_width):
                if i == 0 or i == dialog_height - 1:
                    if j < dialog_width - 1:
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_HLINE)
                elif j == 0 or j == dialog_width - 1:
                    if i < dialog_height - 1:
                        stdscr.addch(start_y + i, start_x + j, curses.ACS_VLINE)
        
        # Draw corners
        stdscr.addch(start_y, start_x, curses.ACS_ULCORNER)
        stdscr.addch(start_y, start_x + dialog_width - 1, curses.ACS_URCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x, curses.ACS_LLCORNER)
        stdscr.addch(start_y + dialog_height - 1, start_x + dialog_width - 1, curses.ACS_LRCORNER)
        
        # Dialog title
        title_pos = max(start_x + 2, start_x + (dialog_width - len(title)) // 2)
        stdscr.attron(curses.color_pair(2) | curses.A_BOLD)
        stdscr.addstr(start_y, title_pos, title)
        stdscr.attroff(curses.color_pair(2) | curses.A_BOLD)
        
        # Message
        # Handle multi-line messages
        message_lines = message.split('\n')
        for i, line in enumerate(message_lines):
            if i < dialog_height - 4:  # Leave room for prompt
                stdscr.addstr(start_y + 2 + i, start_x + 4, line[:dialog_width-8])
        
        # Prompt
        prompt_y = start_y + 2 + min(len(message_lines), dialog_height - 4)
        stdscr.addstr(prompt_y, start_x + 4, "Confirm? (y/n): ")
        
        curses.echo()
        stdscr.refresh()
        
        try:
            response = stdscr.getstr(1).decode("utf-8").lower()
            curses.noecho()
            return response == 'y'
        except Exception as e:
            pass
        
        curses.noecho()
    except Exception as e:
        pass
    
    return False

def dashboard_main(stdscr):
    """Main function for the curses dashboard."""
    try:
        # Set up colors
        curses.start_color()
        curses.init_pair(1, curses.COLOR_CYAN, curses.COLOR_BLACK)    # Headers
        curses.init_pair(2, curses.COLOR_YELLOW, curses.COLOR_BLACK)  # Status: stopped
        curses.init_pair(3, curses.COLOR_GREEN, curses.COLOR_BLACK)   # Status: running
        curses.init_pair(4, curses.COLOR_WHITE, curses.COLOR_BLACK)   # Normal text
        curses.init_pair(5, curses.COLOR_BLACK, curses.COLOR_WHITE)   # Selected row
        curses.init_pair(6, curses.COLOR_BLACK, curses.COLOR_CYAN)    # Multi-selected row
        
        # Hide cursor
        curses.curs_set(0)
        
        # Initialize task manager
        manager = ClaudeTaskManager()
        
        # Main loop
        selected_idx = 0
        running = True
        
        # Filter and sort state
        filter_type = None
        filter_value = None
        sort_key = None
        sort_reverse = False
        multi_select_mode = False
        selected_items = set()
        
        while running:
            try:
                # Clear screen
                stdscr.clear()
                
                # Get terminal size
                max_y, max_x = stdscr.getmaxyx()
                
                # Draw UI components
                draw_header(stdscr, max_y, max_x)
                
                # Get current instances and apply filters
                instances = manager.list_instances()
                
                # Apply filter
                if filter_type and filter_value:
                    if filter_type == "status":
                        instances = [i for i in instances if i["status"] == filter_value]
                    elif filter_type == "keyword":
                        instances = [i for i in instances if (
                            filter_value.lower() in i["id"].lower() or
                            filter_value.lower() in i["project_dir"].lower() or
                            filter_value.lower() in i["prompt_path"].lower()
                        )]
                
                # Apply sorting
                if sort_key:
                    if sort_key == "uptime":
                        # Parse uptime strings like "2h 30m" or "45s" into seconds for sorting
                        def parse_uptime(uptime_str):
                            total_seconds = 0
                            if 'h' in uptime_str:
                                hours = int(uptime_str.split('h')[0])
                                total_seconds += hours * 3600
                                uptime_str = uptime_str.split('h')[1].strip()
                            if 'm' in uptime_str:
                                minutes = int(uptime_str.split('m')[0])
                                total_seconds += minutes * 60
                                uptime_str = uptime_str.split('m')[1].strip()
                            if 's' in uptime_str:
                                seconds = int(uptime_str.split('s')[0])
                                total_seconds += seconds
                            return total_seconds
                        
                        instances = sorted(instances, key=lambda i: parse_uptime(i["uptime"]), reverse=sort_reverse)
                    elif sort_key == "yes_count":
                        instances = sorted(instances, key=lambda i: int(i["yes_count"]), reverse=sort_reverse)
                    else:
                        instances = sorted(instances, key=lambda i: i[sort_key], reverse=sort_reverse)
                
                # Draw instances table
                draw_instance_table(stdscr, max_y, max_x, instances, selected_idx, selected_items)
                
                # Draw status line
                status_text = f"Total: {len(instances)} | Active: {sum(1 for i in instances if i['status'] == 'running')} | Selected: {len(selected_items)} | {datetime.now().strftime('%H:%M:%S')}"
                if max_y > 4:  # Make sure we have room
                    safe_y = min(max_y-3, max_y-1)
                    stdscr.addstr(safe_y, 2, status_text[:max_x-4])
                
                # Draw footer
                draw_footer(stdscr, max_y, max_x, 
                           filter_active=(filter_type is not None),
                           sort_key=sort_key,
                           sort_reverse=sort_reverse,
                           multi_select=multi_select_mode)
                
                # Refresh screen
                stdscr.refresh()
                
                # Get user input with timeout
                stdscr.timeout(1000)  # 1 second timeout
                key = stdscr.getch()
                
                if key == ord('q') or key == ord('Q'):
                    running = False
                elif key == ord('a') or key == ord('A'):
                    # Add new instance
                    proj_dir, prompt_path = add_instance_dialog(stdscr, max_y, max_x)
                    if proj_dir and prompt_path:
                        if os.path.exists(proj_dir):
                            manager.start_instance(proj_dir, prompt_path)
                elif key == ord('s') or key == ord('S'):
                    # Stop instance or multiple instances
                    if multi_select_mode and selected_items:
                        # Stop all selected instances
                        confirm_msg = f"Stop {len(selected_items)} selected instances?"
                        if confirm_dialog(stdscr, max_y, max_x, confirm_msg, "Stop Instances"):
                            for instance_id in selected_items:
                                manager.stop_instance(instance_id)
                            selected_items.clear()
                    else:
                        # Stop single instance
                        instance_id = stop_instance_dialog(stdscr, max_y, max_x, instances)
                        if instance_id:
                            manager.stop_instance(instance_id)
                elif key == ord('r') or key == ord('R'):
                    # Just refresh (happens on next loop)
                    pass
                elif key == ord('f') or key == ord('F'):
                    # Filter instances
                    filter_type, filter_value = filter_dialog(stdscr, max_y, max_x)
                    selected_idx = 0
                    selected_items.clear()
                elif key == ord('o') or key == ord('O'):
                    # Sort instances
                    sort_key, sort_reverse = sort_dialog(stdscr, max_y, max_x, sort_key, sort_reverse)
                    selected_idx = 0
                elif key == ord('d') or key == ord('D'):
                    # Delete instances from list
                    if multi_select_mode and selected_items:
                        # Delete all selected instances
                        confirm_msg = f"Remove {len(selected_items)} instances from the dashboard?\n(This only removes them from the dashboard, not your system)"
                        if confirm_dialog(stdscr, max_y, max_x, confirm_msg, "Delete Instances"):
                            for instance_id in selected_items:
                                if instance_id in manager.instances:
                                    del manager.instances[instance_id]
                            manager.save_instances()
                            selected_items.clear()
                    elif instances and selected_idx < len(instances):
                        # Delete single instance
                        instance_id = instances[selected_idx]["id"]
                        confirm_msg = f"Remove instance {instance_id} from the dashboard?\n(This only removes it from the dashboard, not your system)"
                        if confirm_dialog(stdscr, max_y, max_x, confirm_msg, "Delete Instance"):
                            if instance_id in manager.instances:
                                del manager.instances[instance_id]
                            manager.save_instances()
                            if selected_idx >= len(instances) - 1:
                                selected_idx = max(0, len(instances) - 2)
                elif key == ord('m') or key == ord('M'):
                    # Toggle multi-select mode
                    multi_select_mode = not multi_select_mode
                    if not multi_select_mode:
                        selected_items.clear()
                elif key == ord(' ') and multi_select_mode and instances:
                    # Space key to toggle selection in multi-select mode
                    if selected_idx < len(instances):
                        instance_id = instances[selected_idx]["id"]
                        if instance_id in selected_items:
                            selected_items.remove(instance_id)
                        else:
                            selected_items.add(instance_id)
                elif key == ord('a') - 96:  # Ctrl+A
                    # Select all instances
                    if multi_select_mode:
                        if len(selected_items) == len(instances):  # If all selected, deselect all
                            selected_items.clear()
                        else:  # Otherwise select all
                            selected_items = set(instance["id"] for instance in instances)
                elif key == curses.KEY_UP and instances:
                    selected_idx = (selected_idx - 1) % len(instances)
                elif key == curses.KEY_DOWN and instances:
                    selected_idx = (selected_idx + 1) % len(instances)
                
                # Keep selected index in bounds
                if instances and selected_idx >= len(instances):
                    selected_idx = len(instances) - 1
                    
            except Exception as e:
                # Handle any rendering errors and continue
                # We could log the error here if needed
                pass
    except Exception as e:
        # If setup fails, just exit gracefully
        return

def main():
    """Start the dashboard."""
    try:
        curses.wrapper(dashboard_main)
    except KeyboardInterrupt:
        print("Dashboard terminated by user")

if __name__ == "__main__":
    main()
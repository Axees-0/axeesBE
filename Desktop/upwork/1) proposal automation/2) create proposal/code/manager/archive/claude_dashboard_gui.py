#!/usr/bin/env python3
import os
import subprocess
import time
import json
from datetime import datetime
import threading
import PySimpleGUI as sg
from claude_task_manager import ClaudeTaskManager

class ClaudeDashboardGUI:
    def __init__(self):
        self.manager = ClaudeTaskManager()
        sg.theme('DarkGrey13')  # Set dark theme
        
        # Define the window layout with enhanced controls
        self.layout = [
            [sg.Text('CLAUDE TASK MANAGER DASHBOARD', font=('Any', 16, 'bold'), justification='center', expand_x=True, text_color='#00BFFF')],
            [sg.HSep()],
            [
                sg.Button('Refresh', key='-REFRESH-', button_color=('#FFFFFF', '#505050')),
                sg.Button('Add Instance (Terminal)', key='-ADD_TERMINAL-', button_color=('#FFFFFF', '#2E6DA4')),
                sg.Button('Add Instance (tmux)', key='-ADD_TMUX-', button_color=('#FFFFFF', '#2E8B57')),
                sg.Button('Stop Instance', key='-STOP-', button_color=('#FFFFFF', '#C62828')),
                sg.Push(),
                sg.Button('Interrupt Task', key='-INTERRUPT-', button_color=('#FFFFFF', '#FF8C00')),
                sg.Button('View Terminal', key='-VIEW-', button_color=('#FFFFFF', '#6A5ACD'))
            ],
            [
                sg.Table(
                    values=[], 
                    headings=['ID', 'Status', 'Runtime Type', 'Uptime', 'Yes Count', 'Last Yes', 'Directory', 'Prompt File'],
                    auto_size_columns=False,
                    col_widths=[10, 10, 10, 12, 10, 12, 30, 25],
                    justification='left',
                    num_rows=15,
                    key='-TABLE-',
                    enable_events=True,
                    expand_x=True,
                    expand_y=True,
                    select_mode=sg.TABLE_SELECT_MODE_BROWSE,
                    background_color='#2D2D2D',
                    text_color='#FFFFFF',
                    alternating_row_color='#383838',
                    header_background_color='#1E1E1E',
                    header_text_color='#00BFFF'
                )
            ],
            [sg.Text('', key='-STATUS-', size=(80, 1), text_color='#AAAAAA')]
        ]
        
        # Create the window
        self.window = sg.Window(
            'Claude Task Manager', 
            self.layout,
            size=(1300, 600),
            resizable=True,
            finalize=True,
            background_color='#222222',
            titlebar_background_color='#1E1E1E',
            icon=None  # You can add an icon here if needed
        )
        
        # Set up auto refresh
        self.should_refresh = True
        threading.Thread(target=self.auto_refresh, daemon=True).start()
        
        # Initial refresh
        self.refresh_instances()
    
    def auto_refresh(self):
        """Auto refresh the instances list every 3 seconds."""
        while self.should_refresh:
            time.sleep(3)
            if self.should_refresh and not self.window.was_closed():
                self.window.write_event_value('-AUTO_REFRESH-', None)
    
    def refresh_instances(self):
        """Refresh the instances list."""
        instances = self.manager.list_instances()
        
        # Convert instances to table data
        table_data = []
        for instance in instances:
            # Get the runtime type (tmux or terminal)
            instance_obj = self.manager.instances.get(instance["id"])
            runtime_type = "tmux" if instance_obj and hasattr(instance_obj, 'use_tmux') and instance_obj.use_tmux else "terminal"
            
            table_data.append([
                instance["id"],
                instance["status"],
                runtime_type,
                instance["uptime"],
                instance["yes_count"],
                instance["last_yes"],
                instance["project_dir"],
                instance["prompt_path"]
            ])
        
        # Update table with color formatting based on status
        self.window['-TABLE-'].update(values=table_data)
        
        # Update status bar
        now = datetime.now().strftime("%H:%M:%S")
        running_count = sum(1 for i in instances if i["status"] == "running")
        self.window['-STATUS-'].update(f"Total instances: {len(instances)} | Active: {running_count} | Last updated: {now}")
    
    def add_instance(self, use_tmux=True):
        """Show dialog to add a new instance."""
        method = "tmux" if use_tmux else "Terminal"
        
        # Create dark theme layout for add dialog
        add_layout = [
            [sg.Text(f'Add New Claude Instance ({method})', font=('Any', 12, 'bold'), text_color='#00BFFF')],
            [sg.Text('Project Directory:'), sg.Input(key='-DIR-', background_color='#333333', text_color='#FFFFFF'), 
             sg.FolderBrowse(button_color=('#FFFFFF', '#505050'))],
            [sg.Text('Prompt File Path:'), sg.Input(key='-PROMPT-', background_color='#333333', text_color='#FFFFFF'), 
             sg.FileBrowse(button_color=('#FFFFFF', '#505050'))],
            [sg.Checkbox('Open terminal window when done', key='-OPEN_WINDOW-', default=True)],
            [sg.Button('OK', button_color=('#FFFFFF', '#2E8B57')), sg.Button('Cancel', button_color=('#FFFFFF', '#C62828'))]
        ]
        
        add_window = sg.Window(f'Add Instance ({method})', add_layout, modal=True, background_color='#222222')
        
        while True:
            event, values = add_window.read()
            
            if event in (sg.WIN_CLOSED, 'Cancel'):
                break
            
            if event == 'OK':
                proj_dir = values['-DIR-'].strip()
                prompt_path = values['-PROMPT-'].strip()
                open_window = values['-OPEN_WINDOW-']
                
                if not proj_dir or not prompt_path:
                    sg.popup_error('Both fields are required', background_color='#333333', text_color='#FFFFFF')
                    continue
                
                if not os.path.exists(proj_dir):
                    sg.popup_error(f'Project directory does not exist: {proj_dir}', background_color='#333333', text_color='#FFFFFF')
                    continue
                
                # Start the instance
                instance_id = self.manager.start_instance(proj_dir, prompt_path, use_tmux=use_tmux)
                
                # If user wants to open the window and it's a tmux session, do it
                if open_window and use_tmux:
                    instance = self.manager.instances.get(instance_id)
                    if instance and instance.tmux_session_name:
                        self.open_tmux_window(instance.tmux_session_name)
                
                sg.popup(f'Started new instance with ID: {instance_id}', background_color='#333333', text_color='#FFFFFF')
                break
        
        add_window.close()
        self.refresh_instances()
    
    def stop_instance(self):
        """Stop the selected instance."""
        # Get selected row
        selected_row = self.window['-TABLE-'].SelectedRows
        if not selected_row:
            sg.popup_warning('Please select an instance to stop', background_color='#333333', text_color='#FFFFFF')
            return
        
        # Get table data
        table_data = self.window['-TABLE-'].Values
        instance_id = table_data[selected_row[0]][0]  # ID is in first column
        status = table_data[selected_row[0]][1]  # Status is in second column
        
        # Check if already stopped
        if status.lower() == 'stopped':
            sg.popup_warning(f'Instance {instance_id} is already stopped', background_color='#333333', text_color='#FFFFFF')
            return
        
        # Confirm
        if sg.popup_yes_no(f'Are you sure you want to stop instance {instance_id}?', 
                          background_color='#333333', text_color='#FFFFFF') == 'Yes':
            if self.manager.stop_instance(instance_id):
                sg.popup(f'Instance {instance_id} stopped', background_color='#333333', text_color='#FFFFFF')
                self.refresh_instances()
            else:
                sg.popup_error(f'Failed to stop instance {instance_id}', background_color='#333333', text_color='#FFFFFF')
    
    def interrupt_task(self):
        """Send ESC key to interrupt the current task."""
        # Get selected row
        selected_row = self.window['-TABLE-'].SelectedRows
        if not selected_row:
            sg.popup_warning('Please select an instance to interrupt', background_color='#333333', text_color='#FFFFFF')
            return
        
        # Get table data
        table_data = self.window['-TABLE-'].Values
        instance_id = table_data[selected_row[0]][0]  # ID is in first column
        runtime_type = table_data[selected_row[0]][2]  # Runtime type is in third column
        status = table_data[selected_row[0]][1]  # Status is in second column
        
        # Check if instance is running
        if status.lower() != 'running':
            sg.popup_warning(f'Instance {instance_id} is not running', background_color='#333333', text_color='#FFFFFF')
            return
        
        # Get the instance object
        instance = self.manager.instances.get(instance_id)
        if not instance:
            sg.popup_error(f'Instance {instance_id} not found', background_color='#333333', text_color='#FFFFFF')
            return
        
        # Confirm
        if sg.popup_yes_no(f'Send interrupt (ESC key) to instance {instance_id}?', 
                          background_color='#333333', text_color='#FFFFFF') == 'Yes':
            
            try:
                if runtime_type == 'tmux' and instance.tmux_session_name:
                    # Send ESC key to tmux session
                    subprocess.run([
                        "tmux", "send-keys", "-t", instance.tmux_session_name, 
                        "Escape"
                    ], check=True)
                    sg.popup(f'Interrupt signal sent to tmux session {instance.tmux_session_name}', 
                            background_color='#333333', text_color='#FFFFFF')
                else:
                    # Use AppleScript to send ESC key to terminal
                    if instance.terminal_id:
                        # First activate the terminal
                        activate_cmd = f'''
                        tell application "Terminal"
                            activate
                            set frontmost of (first window whose id is {instance.terminal_id}) to true
                        end tell
                        '''
                        subprocess.run(["osascript", "-e", activate_cmd])
                        
                        # Then send ESC key
                        subprocess.run(["osascript", "-e", 'tell application "System Events" to key code 53'])  # 53 is ESC
                        sg.popup(f'Interrupt signal sent to terminal for instance {instance_id}', 
                                background_color='#333333', text_color='#FFFFFF')
                    else:
                        sg.popup_error(f'Terminal ID not found for instance {instance_id}', 
                                      background_color='#333333', text_color='#FFFFFF')
            except Exception as e:
                sg.popup_error(f'Error sending interrupt: {e}', background_color='#333333', text_color='#FFFFFF')
    
    def view_terminal(self):
        """Open or focus the terminal window for the selected instance."""
        # Get selected row
        selected_row = self.window['-TABLE-'].SelectedRows
        if not selected_row:
            sg.popup_warning('Please select an instance to view', background_color='#333333', text_color='#FFFFFF')
            return
        
        # Get table data
        table_data = self.window['-TABLE-'].Values
        instance_id = table_data[selected_row[0]][0]  # ID is in first column
        runtime_type = table_data[selected_row[0]][2]  # Runtime type is in third column
        
        # Get the instance object
        instance = self.manager.instances.get(instance_id)
        if not instance:
            sg.popup_error(f'Instance {instance_id} not found', background_color='#333333', text_color='#FFFFFF')
            return
        
        try:
            if runtime_type == 'tmux' and instance.tmux_session_name:
                # Open a terminal window with the tmux session
                self.open_tmux_window(instance.tmux_session_name)
                sg.popup(f'Opened terminal window for tmux session {instance.tmux_session_name}', 
                        background_color='#333333', text_color='#FFFFFF')
            else:
                # Focus the existing terminal window
                if instance.terminal_id:
                    activate_cmd = f'''
                    tell application "Terminal"
                        activate
                        set frontmost of (first window whose id is {instance.terminal_id}) to true
                    end tell
                    '''
                    subprocess.run(["osascript", "-e", activate_cmd])
                    sg.popup(f'Activated terminal window for instance {instance_id}', 
                            background_color='#333333', text_color='#FFFFFF')
                else:
                    sg.popup_error(f'Terminal ID not found for instance {instance_id}', 
                                  background_color='#333333', text_color='#FFFFFF')
        except Exception as e:
            sg.popup_error(f'Error viewing terminal: {e}', background_color='#333333', text_color='#FFFFFF')
    
    def open_tmux_window(self, session_name):
        """Open a terminal window attached to the specified tmux session."""
        try:
            # Open a terminal window and attach to the tmux session
            subprocess.run([
                "osascript", "-e", 
                f'tell application "Terminal" to do script "tmux attach -t {session_name}"'
            ], check=True)
            return True
        except Exception as e:
            print(f"Error opening tmux window: {e}")
            return False
    
    def run(self):
        """Run the main event loop."""
        while True:
            event, values = self.window.read()
            
            if event == sg.WIN_CLOSED:
                break
            
            if event == '-REFRESH-' or event == '-AUTO_REFRESH-':
                self.refresh_instances()
            
            elif event == '-ADD_TERMINAL-':
                self.add_instance(use_tmux=False)
            
            elif event == '-ADD_TMUX-':
                self.add_instance(use_tmux=True)
            
            elif event == '-STOP-':
                self.stop_instance()
            
            elif event == '-INTERRUPT-':
                self.interrupt_task()
            
            elif event == '-VIEW-':
                self.view_terminal()
            
            elif event == '-TABLE-' and values['-TABLE-'] and len(values['-TABLE-']) > 0:
                # Double-click on table row
                if isinstance(event, tuple) and event[0] == '-TABLE-' and event[2][0] == 'double':
                    self.view_terminal()
        
        # Clean up
        self.should_refresh = False
        self.window.close()

def main():
    """Start the GUI dashboard."""
    try:
        dashboard = ClaudeDashboardGUI()
        dashboard.run()
    except Exception as e:
        print(f"Error in GUI: {e}")
        sg.popup_error(f"An error occurred: {e}", background_color='#333333', text_color='#FFFFFF')

if __name__ == "__main__":
    main()
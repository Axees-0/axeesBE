#!/usr/bin/env python3
import os
import subprocess
import time
import json
import re
from datetime import datetime
import threading
from flask import Flask, render_template_string, redirect, url_for, request, jsonify
from claude_task_manager import ClaudeTaskManager

# Initialize task manager with absolute path to ensure consistency with test_instance.py
import os
manager_dir = os.path.dirname(os.path.abspath(__file__))
save_file = os.path.join(manager_dir, "claude_instances.json")
print(f"Web dashboard using instance file: {save_file}")
manager = ClaudeTaskManager(save_file=save_file)

# Create Flask app
app = Flask(__name__)

# HTML template for dashboard
DASHBOARD_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Claude Task Manager Dashboard</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        /* Modern Dark Theme Colors */
        :root {
            --bg-dark: #0f172a;
            --bg-darker: #1e293b;
            --bg-card: #334155;
            --text-primary: #f8fafc;
            --text-secondary: #cbd5e1;
            --accent-blue: #3b82f6;
            --accent-indigo: #6366f1;
            --accent-green: #10b981;
            --accent-red: #ef4444;
            --accent-orange: #f97316;
            --accent-purple: #8b5cf6;
            --border-color: #475569;
            --hover-color: #475569;
            --header-bg: #1e293b;
            --input-bg: #1e293b;
            --card-shadow: 0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1);
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--bg-dark);
            color: var(--text-primary);
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1 {
            text-align: center;
            color: var(--text-primary);
            font-weight: 800;
            margin-bottom: 1.5rem;
            font-size: 2rem;
            letter-spacing: -0.5px;
        }
        
        h2 {
            color: var(--text-primary);
            font-weight: 600;
            font-size: 1.25rem;
            margin-bottom: 1rem;
        }
        
        .app-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        .app-logo {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .app-logo svg {
            color: var(--accent-blue);
            height: 2rem;
            width: 2rem;
        }
        
        .app-logo h1 {
            margin: 0;
            text-align: left;
        }
        
        .header-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .card {
            background-color: var(--bg-darker);
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            box-shadow: var(--card-shadow);
        }
        
        .quick-add {
            display: grid;
            grid-template-columns: 1fr 1fr auto auto;
            gap: 1rem;
            align-items: center;
        }
        
        .input-group {
            position: relative;
        }
        
        .input-group label {
            position: absolute;
            top: -0.5rem;
            left: 0.75rem;
            background-color: var(--bg-darker);
            padding: 0 0.25rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
        
        .input-field {
            width: 100%;
            padding: 0.75rem 1rem;
            background-color: var(--input-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 0.375rem;
            font-family: inherit;
            font-size: 0.875rem;
        }
        
        .input-field:focus {
            border-color: var(--accent-blue);
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        .runtime-toggle {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
        
        .runtime-toggle label {
            font-size: 0.875rem;
            user-select: none;
        }
        
        .switch {
            position: relative;
            display: inline-block;
            width: 48px;
            height: 24px;
        }
        
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--bg-card);
            transition: .4s;
            border-radius: 24px;
        }
        
        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background-color: var(--accent-green);
        }
        
        input:checked + .slider:before {
            transform: translateX(24px);
        }
        
        .filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .search-box {
            padding: 0.75rem 1rem;
            background-color: var(--input-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 0.375rem;
            min-width: 250px;
            font-family: inherit;
            font-size: 0.875rem;
        }
        
        .search-box:focus {
            border-color: var(--accent-blue);
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        .filter-dropdown {
            padding: 0.75rem 1rem;
            background-color: var(--input-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 0.375rem;
            cursor: pointer;
            font-family: inherit;
            font-size: 0.875rem;
        }
        
        .filter-dropdown:focus {
            border-color: var(--accent-blue);
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        .btn {
            padding: 0.75rem 1rem;
            background-color: var(--accent-green);
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: all 0.2s ease;
            font-size: 0.875rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .btn:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }
        
        .btn svg {
            width: 1rem;
            height: 1rem;
        }
        
        .btn-blue {
            background-color: var(--accent-blue);
        }
        
        .btn-red {
            background-color: var(--accent-red);
        }
        
        .btn-orange {
            background-color: var(--accent-orange);
        }
        
        .btn-purple {
            background-color: var(--accent-purple);
        }
        
        .btn-green {
            background-color: var(--accent-green);
        }
        
        .btn-indigo {
            background-color: var(--accent-indigo);
        }
        
        .btn-gray {
            background-color: var(--border-color);
        }
        
        .actions-bar {
            display: flex;
            gap: 0.75rem;
            margin: 1rem 0;
            flex-wrap: wrap;
        }
        
        .spacer {
            flex-grow: 1;
        }
        
        .checkbox-container {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .checkbox-container input[type="checkbox"] {
            width: 1rem;
            height: 1rem;
            cursor: pointer;
        }
        
        .sortable {
            cursor: pointer;
            user-select: none;
        }
        
        .sortable:hover {
            color: var(--accent-blue);
        }
        
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 1rem;
            background-color: var(--bg-darker);
            box-shadow: var(--card-shadow);
            border-radius: 0.5rem;
            overflow: hidden;
        }
        
        th, td {
            padding: 1rem;
            text-align: left;
        }
        
        th {
            background-color: var(--header-bg);
            color: var(--text-secondary);
            font-weight: 600;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        td {
            border-bottom: 1px solid var(--border-color);
            font-size: 0.875rem;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        tbody tr {
            transition: all 0.2s ease;
        }
        
        tbody tr:hover {
            background-color: var(--hover-color);
        }
        
        tr.selected {
            background-color: rgba(59, 130, 246, 0.15);
            box-shadow: inset 3px 0 0 var(--accent-blue);
        }
        
        /* Status badges */
        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            line-height: 1;
        }
        
        .running {
            background-color: rgba(16, 185, 129, 0.2);
            color: var(--accent-green);
        }
        
        .stopped {
            background-color: rgba(239, 68, 68, 0.2);
            color: var(--accent-red);
        }
        
        .error {
            background-color: rgba(249, 115, 22, 0.2);
            color: var(--accent-orange);
        }
        
        .runtime-tag {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            line-height: 1;
        }
        
        .tmux-tag {
            background-color: rgba(16, 185, 129, 0.2);
            color: var(--accent-green);
        }
        
        .terminal-tag {
            background-color: rgba(99, 102, 241, 0.2);
            color: var(--accent-indigo);
        }
        
        .status-bar {
            margin-top: 1.5rem;
            background-color: var(--bg-darker);
            color: var(--text-secondary);
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            box-shadow: var(--card-shadow);
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 10;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(4px);
            animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .modal-content {
            background-color: var(--bg-darker);
            margin: 8% auto;
            padding: 2rem;
            border-radius: 0.75rem;
            width: min(500px, 90%);
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from { transform: translateY(-30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-header {
            margin-bottom: 1.5rem;
        }
        
        .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
        }
        
        .form-group {
            margin-bottom: 1.5rem;
            position: relative;
        }
        
        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
        }
        
        .form-control {
            width: 100%;
            padding: 0.75rem 1rem;
            background-color: var(--input-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 0.375rem;
            font-family: inherit;
            font-size: 0.875rem;
            transition: all 0.2s ease;
        }
        
        .form-control:focus {
            border-color: var(--accent-blue);
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        select.form-control {
            appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23cbd5e1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 0.75rem center;
            background-size: 1rem;
            padding-right: 2.5rem;
        }
        
        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
            margin-top: 2rem;
        }
        
        .modal-note {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-top: 0.5rem;
        }
        
        .checkbox-group {
            display: flex;
            align-items: center;
            margin-top: 15px;
        }
        
        .checkbox-group input[type="checkbox"] {
            margin-right: 8px;
            transform: scale(1.2);
        }
        
        /* Drag and drop styles */
        .dropzone {
            border: 2px dashed var(--border-color);
            border-radius: 6px;
            padding: 20px;
            text-align: center;
            margin-bottom: 15px;
            background-color: var(--bg-darker);
            transition: all 0.3s;
        }
        
        .dropzone.dragover {
            border-color: var(--accent-green);
            background-color: rgba(46, 139, 87, 0.2);
            transform: scale(1.01);
        }
        
        .dropzone p {
            margin: 0;
            color: var(--text-secondary);
        }
        
        /* Tooltip styles */
        .tooltip {
            position: relative;
            display: inline-block;
        }
        
        .tooltip .tooltiptext {
            visibility: hidden;
            width: 200px;
            background-color: var(--bg-darker);
            color: var(--text-primary);
            text-align: center;
            border-radius: 6px;
            padding: 8px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -100px;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            font-size: 14px;
        }
        
        .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
        }
        
        .runtime-type {
            font-size: 14px;
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: bold;
        }
        
        .tmux-tag {
            background-color: rgba(46, 139, 87, 0.2);
            color: #4CAF50;
            border: 1px solid rgba(76, 175, 80, 0.3);
        }
        
        .terminal-tag {
            background-color: rgba(33, 150, 243, 0.2);
            color: #2196F3;
            border: 1px solid rgba(33, 150, 243, 0.3);
        }
        
        /* Toast notification */
        #toast {
            visibility: hidden;
            min-width: 300px;
            margin-left: -150px;
            background-color: var(--bg-darker);
            color: var(--text-primary);
            text-align: center;
            border-radius: 0.5rem;
            padding: 1rem 1.5rem;
            position: fixed;
            z-index: 100;
            left: 50%;
            bottom: 2rem;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1);
            font-size: 0.875rem;
            line-height: 1.5;
            border-left: 4px solid var(--accent-green);
        }
        
        #toast.show {
            visibility: visible;
            animation: toast-in 0.3s ease-out, toast-out 0.3s ease-in 2.7s;
        }
        
        #toast.error {
            border-left-color: var(--accent-red);
        }
        
        #toast.info {
            border-left-color: var(--accent-blue);
        }
        
        #toast.warning {
            border-left-color: var(--accent-orange);
        }
        
        @keyframes toast-in {
            from {transform: translateY(20px); opacity: 0;}
            to {transform: translateY(0); opacity: 1;}
        }
        
        @keyframes toast-out {
            from {transform: translateY(0); opacity: 1;}
            to {transform: translateY(20px); opacity: 0;}
        }
        
        /* Spinner animation */
        .animate-spin {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from {transform: rotate(0deg);}
            to {transform: rotate(360deg);}
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="app-header">
            <div class="app-logo">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <h1>CLAUDE TASK MANAGER</h1>
            </div>
            <div class="header-actions">
                <button class="btn btn-blue" onclick="manualRefresh()">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>
        </div>
        
        <!-- Quick Add Card -->
        <div class="card">
            <form id="quick-add-form" class="quick-add" onsubmit="event.preventDefault(); addInstanceFromQuickForm();">
                <div class="input-group">
                    <label for="quick-project-dir">Project Directory or ID</label>
                    <input type="text" id="quick-project-dir" class="input-field" placeholder="Project path or just ID number" required>
                </div>
                <div class="input-group">
                    <label for="quick-prompt-path">Prompt File or Text</label>
                    <input type="text" id="quick-prompt-path" class="input-field" placeholder="Prompt file path or direct text" required>
                </div>
                <div class="runtime-toggle">
                    <label class="switch">
                        <input type="checkbox" id="quick-use-tmux" checked>
                        <span class="slider"></span>
                    </label>
                    <label for="quick-use-tmux">Use tmux</label>
                </div>
                <button type="submit" class="btn btn-green">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Instance
                </button>
            </form>
        </div>
        
        <!-- Filters & Actions -->
        <div class="filters">
            <input type="text" class="search-box" id="instance-search" placeholder="Search instances..." oninput="filterInstances()">
            
            <select class="filter-dropdown" id="status-filter" onchange="filterInstances()">
                <option value="all">All Statuses</option>
                <option value="running">Running Only</option>
                <option value="stopped">Stopped Only</option>
            </select>
            
            <select class="filter-dropdown" id="runtime-filter" onchange="filterInstances()">
                <option value="all">All Runtimes</option>
                <option value="tmux">tmux Only</option>
                <option value="terminal">Terminal Only</option>
            </select>
            
            <div class="checkbox-container">
                <input type="checkbox" id="multi-select" onchange="toggleMultiSelect()">
                <label for="multi-select">Multi-select</label>
            </div>
            
            <button class="btn btn-gray" onclick="selectAll()" id="select-all-btn" style="display: none;">
                Select All
            </button>
        </div>
        
        <div class="actions-bar">
            <button class="btn btn-red" onclick="stopInstance()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Stop Instance
            </button>
            <button class="btn btn-red" onclick="deleteSelected()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Selected
            </button>
            
            <div class="spacer"></div>
            
            <button class="btn btn-orange" onclick="interruptTask()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Interrupt Task
            </button>
            <button class="btn btn-purple" onclick="viewTerminal()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                View Terminal
            </button>
        </div>
        
        <table id="instance-table">
            <thead>
                <tr>
                    <th class="sortable" data-sort="id">ID ↕</th>
                    <th class="sortable" data-sort="status">Status ↕</th>
                    <th class="sortable" data-sort="runtime">Runtime Type ↕</th>
                    <th class="sortable" data-sort="uptime">Uptime ↕</th>
                    <th class="sortable" data-sort="yes_count">Yes Count ↕</th>
                    <th class="sortable" data-sort="last_yes">Last Yes ↕</th>
                    <th class="sortable" data-sort="directory">Directory ↕</th>
                    <th class="sortable" data-sort="prompt_file">Prompt File ↕</th>
                </tr>
            </thead>
            <tbody id="instance-list">
                {% for instance in instances %}
                {% set instance_obj = manager.instances.get(instance.id) %}
                {% set use_tmux = instance_obj.use_tmux if instance_obj and 'use_tmux' in instance_obj.__dict__ else False %}
                {% set runtime_type = "tmux" if use_tmux else "terminal" %}
                <tr data-id="{{ instance.id }}" data-runtime="{{ runtime_type }}">
                    <td>{{ instance.id }}</td>
                    <td>
                        <span class="status-badge {{ instance.status }}">{{ instance.status }}</span>
                    </td>
                    <td>
                        <span class="runtime-tag {% if runtime_type == 'tmux' %}tmux-tag{% else %}terminal-tag{% endif %}">
                            {{ runtime_type }}
                            {% if runtime_type == 'tmux' and instance.tmux_status is defined %}
                            ({{ instance.tmux_status }})
                            {% endif %}
                        </span>
                        {% if runtime_type == 'tmux' and instance.tmux_session is defined %}
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            {{ instance.tmux_session }}
                        </div>
                        {% endif %}
                    </td>
                    <td>{{ instance.uptime }}</td>
                    <td>{{ instance.yes_count }}</td>
                    <td>{{ instance.last_yes }}</td>
                    <td>{{ instance.project_dir }}</td>
                    <td>{{ instance.prompt_path }}</td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
        
        <div class="status-bar" id="status-bar">
            <span>
                Total instances: {{ instances|length }} | 
                Active: {{ instances|selectattr('status', 'equalto', 'running')|list|length }} | 
                tmux: {{ instances|selectattr('tmux_status', 'defined')|list|length }} |
                terminal: {{ instances|length - (instances|selectattr('tmux_status', 'defined')|list|length) }}
            </span>
            <span>Last updated: {{ current_time }}</span>
        </div>
        
        <!-- Add Instance Modal -->
        <div id="add-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="add-modal-title">Add New Claude Instance</h3>
                </div>
                <form id="add-form" action="/add" method="post">
                    <input type="hidden" id="runtime_type" name="runtime_type" value="tmux">
                    
                    <div class="form-group">
                        <label class="form-label" for="project_dir">Project Directory or ID:</label>
                        <div id="dir-dropzone" class="dropzone">
                            <p>Drag & drop folder here or just enter project ID</p>
                        </div>
                        <input type="text" id="project_dir" name="project_dir" class="form-control" required>
                        <p class="modal-note">For IDs, we'll search for matching projects in proposals and current projects folders</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="prompt_path">Prompt File Path or Direct Text:</label>
                        <div id="file-dropzone" class="dropzone">
                            <p>Drag & drop prompt file here or enter prompt text directly</p>
                        </div>
                        <input type="text" id="prompt_path" name="prompt_path" class="form-control" required>
                        <p class="modal-note">If this isn't a valid file path, it will be treated as prompt text</p>
                    </div>
                    
                    <div class="checkbox-container">
                        <input type="checkbox" id="open_window" name="open_window" checked>
                        <label for="open_window">Open terminal window when done</label>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-gray" onclick="closeAddModal()">Cancel</button>
                        <button type="submit" class="btn btn-green">Add Instance</button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Stop Instance Modal -->
        <div id="stop-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Stop Claude Instance</h3>
                </div>
                <p>Are you sure you want to stop instance <span id="stop-instance-id" class="font-medium"></span>?</p>
                <p class="modal-note">This will terminate the Claude process running in your terminal.</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-gray" onclick="closeStopModal()">Cancel</button>
                    <button type="button" class="btn btn-red" onclick="confirmStop()">Stop Instance</button>
                </div>
            </div>
        </div>
        
        <!-- Delete Instance Modal -->
        <div id="delete-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Delete Claude Instance</h3>
                </div>
                <p id="delete-message">Are you sure you want to delete the selected instance(s)?</p>
                <p class="modal-note">This only removes the instance(s) from the dashboard, not from your system.</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-gray" onclick="closeDeleteModal()">Cancel</button>
                    <button type="button" class="btn btn-red" onclick="confirmDelete()">Delete</button>
                </div>
            </div>
        </div>
        
        <!-- Interrupt Task Modal -->
        <div id="interrupt-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Interrupt Claude Task</h3>
                </div>
                <p>Send interrupt signal (ESC key) to instance <span id="interrupt-instance-id" class="font-medium"></span>?</p>
                <p class="modal-note">This will send an ESC key to the terminal, which may interrupt Claude's current generation.</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-gray" onclick="closeInterruptModal()">Cancel</button>
                    <button type="button" class="btn btn-orange" onclick="confirmInterrupt()">Send Interrupt</button>
                </div>
            </div>
        </div>
        
        <!-- Toast notification -->
        <div id="toast"></div>
    </div>
    
    <script>
        let selectedInstanceId = null;
        let selectedRuntimeType = null;
        let selectedInstances = new Set();
        let multiSelectEnabled = false;
        let currentSortColumn = null;
        let sortDirection = 'asc';
        
        // Toast notification function
        function showToast(message, isError = false) {
            const toast = document.getElementById("toast");
            toast.textContent = message;
            
            if (isError) {
                toast.classList.add("error");
            } else {
                toast.classList.remove("error");
            }
            
            toast.classList.add("show");
            
            // After 3 seconds, remove the show class
            setTimeout(function() { 
                toast.classList.remove("show");
            }, 3000);
        }
        
        // Toggle multi-select mode
        function toggleMultiSelect() {
            multiSelectEnabled = document.getElementById('multi-select').checked;
            const selectAllBtn = document.getElementById('select-all-btn');
            
            if (multiSelectEnabled) {
                selectAllBtn.style.display = 'inline-block';
            } else {
                selectAllBtn.style.display = 'none';
                // Clear selected instances when turning off multi-select
                selectedInstances.clear();
                
                // Remove selected class from all rows
                document.querySelectorAll('tbody tr').forEach(row => {
                    if (row.dataset.id !== selectedInstanceId) {
                        row.classList.remove('selected');
                    }
                });
            }
        }
        
        // Select all visible instances
        function selectAll() {
            if (!multiSelectEnabled) return;
            
            const visibleRows = Array.from(document.querySelectorAll('tbody tr')).filter(row => 
                row.style.display !== 'none'
            );
            
            // If all visible rows are already selected, deselect all
            const allSelected = visibleRows.every(row => selectedInstances.has(row.dataset.id));
            
            if (allSelected) {
                // Deselect all
                selectedInstances.clear();
                visibleRows.forEach(row => {
                    row.classList.remove('selected');
                });
            } else {
                // Select all visible
                visibleRows.forEach(row => {
                    row.classList.add('selected');
                    selectedInstances.add(row.dataset.id);
                });
            }
        }
        
        // Select a row in the table
        document.addEventListener('click', function(e) {
            const row = e.target.closest('tr');
            if (row && row.parentNode.tagName === 'TBODY') {
                const instanceId = row.dataset.id;
                const runtimeType = row.dataset.runtime;
                
                if (multiSelectEnabled) {
                    // Toggle selection for this row
                    if (selectedInstances.has(instanceId)) {
                        selectedInstances.delete(instanceId);
                        row.classList.remove('selected');
                    } else {
                        selectedInstances.add(instanceId);
                        row.classList.add('selected');
                    }
                } else {
                    // Single selection mode
                    // Remove selected class from all rows
                    document.querySelectorAll('tbody tr').forEach(r => {
                        r.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked row
                    row.classList.add('selected');
                    
                    // Store the selected instance ID and runtime type
                    selectedInstanceId = instanceId;
                    selectedRuntimeType = runtimeType;
                }
                
                console.log(`Selected instance: ${instanceId}, Runtime: ${runtimeType}`);
            }
        });
        
        // Handle header click for sorting
        document.addEventListener('click', function(e) {
            const header = e.target.closest('th.sortable');
            if (header) {
                const sortBy = header.dataset.sort;
                if (sortBy) {
                    // Toggle direction if clicking the same column
                    if (currentSortColumn === sortBy) {
                        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                    } else {
                        currentSortColumn = sortBy;
                        sortDirection = 'asc';
                    }
                    
                    sortInstances(sortBy, sortDirection);
                }
            }
        });
        
        // Double-click to view terminal
        document.addEventListener('dblclick', function(e) {
            const row = e.target.closest('tr');
            if (row && row.parentNode.tagName === 'TBODY') {
                // Get the instance ID from the row
                const instanceId = row.dataset.id;
                const runtimeType = row.dataset.runtime;
                
                // Make sure the instance is selected
                selectedInstanceId = instanceId;
                selectedRuntimeType = runtimeType;
                
                // Visually select the row
                document.querySelectorAll('tbody tr').forEach(r => {
                    r.classList.remove('selected');
                });
                row.classList.add('selected');
                
                // Open the terminal window
                viewTerminal();
            }
        });
        
        // Add instance from quick form
        function addInstanceFromQuickForm() {
            const projectDir = document.getElementById('quick-project-dir').value;
            const promptPath = document.getElementById('quick-prompt-path').value;
            const useTmux = document.getElementById('quick-use-tmux').checked;
            
            if (!projectDir || !promptPath) {
                showToast('Please fill in all fields', true);
                return;
            }
            
            // Create form data
            const formData = new FormData();
            formData.append('project_dir', projectDir);
            formData.append('prompt_path', promptPath);
            formData.append('runtime_type', useTmux ? 'tmux' : 'terminal');
            formData.append('open_window', 'on'); // Always open window for quick add
            
            // Send request
            fetch('/add', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    // Clear form
                    document.getElementById('quick-project-dir').value = '';
                    document.getElementById('quick-prompt-path').value = '';
                    
                    // Refresh instances
                    refreshInstances();
                    showToast('Instance created successfully');
                } else {
                    return response.text().then(text => {
                        throw new Error(text);
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('Failed to create instance: ' + error.message, true);
            });
        }
        
        // Add instance modal
        function openAddModal(runtimeType = 'tmux') {
            const modal = document.getElementById('add-modal');
            const title = document.getElementById('add-modal-title');
            const runtimeInput = document.getElementById('runtime_type');
            
            // Set the runtime type
            runtimeInput.value = runtimeType;
            
            // Update the title
            title.textContent = `Add New Claude Instance (${runtimeType})`;
            
            // Show the modal
            modal.style.display = 'block';
        }
        
        function closeAddModal() {
            document.getElementById('add-modal').style.display = 'none';
        }
        
        // Stop instance modal
        function stopInstance() {
            if (!selectedInstanceId) {
                showToast('Please select an instance to stop', true);
                return;
            }
            
            // Check if instance is already stopped
            const row = document.querySelector(`tr[data-id="${selectedInstanceId}"]`);
            const statusCell = row.querySelector('td:nth-child(2)');
            
            if (statusCell.textContent.trim().toLowerCase() === 'stopped') {
                showToast('This instance is already stopped', true);
                return;
            }
            
            document.getElementById('stop-instance-id').textContent = selectedInstanceId;
            document.getElementById('stop-modal').style.display = 'block';
        }
        
        function closeStopModal() {
            document.getElementById('stop-modal').style.display = 'none';
        }
        
        function confirmStop() {
            fetch('/stop/' + selectedInstanceId, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        closeStopModal();
                        refreshInstances();
                        showToast(`Instance ${selectedInstanceId} stopped successfully`);
                    } else {
                        showToast('Failed to stop instance: ' + data.error, true);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred while stopping the instance', true);
                });
        }
        
        // Interrupt task modal
        function interruptTask() {
            if (!selectedInstanceId) {
                showToast('Please select an instance to interrupt', true);
                return;
            }
            
            // Check if instance is running
            const row = document.querySelector(`tr[data-id="${selectedInstanceId}"]`);
            const statusCell = row.querySelector('td:nth-child(2)');
            
            if (statusCell.textContent.trim().toLowerCase() !== 'running') {
                showToast('Cannot interrupt a non-running instance', true);
                return;
            }
            
            document.getElementById('interrupt-instance-id').textContent = selectedInstanceId;
            document.getElementById('interrupt-modal').style.display = 'block';
        }
        
        function closeInterruptModal() {
            document.getElementById('interrupt-modal').style.display = 'none';
        }
        
        function confirmInterrupt() {
            fetch('/interrupt/' + selectedInstanceId, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        closeInterruptModal();
                        showToast(`Interrupt signal sent to instance ${selectedInstanceId}`);
                    } else {
                        showToast('Failed to interrupt: ' + data.error, true);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred while sending interrupt', true);
                });
        }
        
        // View terminal function
        function viewTerminal() {
            if (!selectedInstanceId) {
                showToast('Please select an instance to view', true);
                return;
            }
            
            fetch('/view_terminal/' + selectedInstanceId, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showToast(`Opened terminal for instance ${selectedInstanceId}`);
                    } else {
                        showToast('Failed to open terminal: ' + data.error, true);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('An error occurred while opening terminal', true);
                });
        }
        
        // Parse path to remove parentheses and single quotes
        function parsePath(path) {
            // Remove any parentheses and their content
            let cleaned = path.replace(/\\([^)]*\\)/g, '');
            // Remove single quotes
            cleaned = cleaned.replace(/['ʼ]/g, '');
            return cleaned.trim();
        }
        
        // Drag and drop functionality
        document.addEventListener('DOMContentLoaded', function() {
            const dirDropzone = document.getElementById('dir-dropzone');
            const fileDropzone = document.getElementById('file-dropzone');
            const dirInput = document.getElementById('project_dir');
            const fileInput = document.getElementById('prompt_path');
            
            // Directory dropzone
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dirDropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                dirDropzone.addEventListener(eventName, () => {
                    dirDropzone.classList.add('dragover');
                }, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                dirDropzone.addEventListener(eventName, () => {
                    dirDropzone.classList.remove('dragover');
                }, false);
            });
            
            dirDropzone.addEventListener('drop', e => {
                // We need to extract the file paths from the drop event
                handleDroppedFiles(e, true, dirInput);
            }, false);
            
            // File dropzone
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                fileDropzone.addEventListener(eventName, preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                fileDropzone.addEventListener(eventName, () => {
                    fileDropzone.classList.add('dragover');
                }, false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                fileDropzone.addEventListener(eventName, () => {
                    fileDropzone.classList.remove('dragover');
                }, false);
            });
            
            fileDropzone.addEventListener('drop', e => {
                // We need to extract the file paths from the drop event
                handleDroppedFiles(e, false, fileInput);
            }, false);
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Function to handle dropped files and extract paths
            function handleDroppedFiles(e, isDirectory, inputElement) {
                const dt = e.dataTransfer;
                const files = dt.files;
                
                if (!files || files.length === 0) {
                    return;
                }
                
                try {
                    // For directory drops, check if any entry is a directory
                    if (isDirectory && dt.items && dt.items.length > 0) {
                        for (let i = 0; i < dt.items.length; i++) {
                            const item = dt.items[i];
                            if (item.kind === 'file' && typeof item.webkitGetAsEntry === 'function') {
                                const entry = item.webkitGetAsEntry();
                                if (entry && entry.isDirectory) {
                                    // This is a directory drop - we need to handle it differently
                                    console.log("Directory detected:", entry.name);
                                    
                                    // For directories, check for getAs methods
                                    if (typeof item.getAsFile === 'function') {
                                        const file = item.getAsFile();
                                        if (file) {
                                            // Get the directory path - some browsers may support this
                                            console.log("Directory file info:", file);
                                            
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            formData.append('is_directory', '1');
                                            formData.append('directory_name', entry.name);
                                            
                                            // Let the server try to locate this directory
                                            fetch('/find_directory', {
                                                method: 'POST',
                                                body: formData
                                            })
                                            .then(response => response.json())
                                            .then(data => {
                                                if (data.path) {
                                                    inputElement.value = parsePath(data.path);
                                                } else {
                                                    // Just use directory name as fallback
                                                    inputElement.value = entry.name;
                                                    console.log("Could not determine full directory path");
                                                }
                                            })
                                            .catch(error => {
                                                console.error('Error finding directory:', error);
                                                inputElement.value = entry.name;
                                            });
                                            
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // For regular files or as a fallback for directories
                    const reader = new FileReader();
                    
                    reader.onload = function(event) {
                        try {
                            // Extract just the name for the UI
                            const filename = files[0].name;
                            
                            // We need to send this file to the server to handle the path extraction
                            // This is because browsers restrict access to real file paths
                            const formData = new FormData();
                            formData.append('file', files[0]);
                            formData.append('is_directory', isDirectory ? '1' : '0');
                            
                            fetch('/upload_file', {
                                method: 'POST',
                                body: formData
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.path) {
                                    inputElement.value = parsePath(data.path);
                                } else {
                                    // If server couldn't determine path, just use filename
                                    inputElement.value = filename;
                                    if (isDirectory) {
                                        showToast('Please enter the full directory path. We could only extract the folder name.', true);
                                    }
                                }
                            })
                            .catch(error => {
                                console.error('Error uploading file:', error);
                                // If upload fails, just use filename
                                inputElement.value = filename;
                            });
                        } catch (error) {
                            console.error('Error in reader.onload:', error);
                            inputElement.value = files[0].name;
                        }
                    };
                    
                    reader.onerror = function(error) {
                        console.error('Error reading file:', error);
                        inputElement.value = files[0].name;
                    };
                    
                    // Start reading the file
                    reader.readAsDataURL(files[0]);
                } catch (error) {
                    console.error('Error setting up file reader:', error);
                    inputElement.value = files[0].name;
                }
            }
            
            // Handle form submission
            document.getElementById('add-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                
                fetch('/add', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {
                    if (response.ok) {
                        closeAddModal();
                        refreshInstances();
                        showToast('Instance created successfully');
                    } else {
                        return response.text().then(text => {
                            throw new Error(text);
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('Failed to create instance: ' + error.message, true);
                });
            });
        });
        
        // Refresh instances
        function refreshInstances() {
            fetch('/refresh')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Update table content
                    document.getElementById('instance-list').innerHTML = doc.getElementById('instance-list').innerHTML;
                    
                    // Update status bar
                    document.getElementById('status-bar').innerHTML = doc.getElementById('status-bar').innerHTML;
                    
                    // Reselect instance if still exists
                    if (selectedInstanceId) {
                        const row = document.querySelector(`tr[data-id="${selectedInstanceId}"]`);
                        if (row) {
                            row.classList.add('selected');
                        } else {
                            selectedInstanceId = null;
                            selectedRuntimeType = null;
                        }
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('Error refreshing data', true);
                });
        }
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Refresh - F5 or Ctrl+R
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                refreshInstances();
            }
            
            // Stop - Del key with selected row
            if (e.key === 'Delete' && selectedInstanceId) {
                e.preventDefault();
                stopInstance();
            }
            
            // Interrupt - Escape key with selected row
            if (e.key === 'Escape' && selectedInstanceId) {
                e.preventDefault();
                interruptTask();
            }
            
            // View terminal - Enter key with selected row
            if (e.key === 'Enter' && selectedInstanceId) {
                e.preventDefault();
                viewTerminal();
            }
        });
        
        // Filter instances based on search and filter criteria
        function filterInstances() {
            const searchText = document.getElementById('instance-search').value.toLowerCase();
            const statusFilter = document.getElementById('status-filter').value;
            const runtimeFilter = document.getElementById('runtime-filter').value;
            
            const rows = document.querySelectorAll('#instance-table tbody tr');
            
            rows.forEach(row => {
                const id = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
                const status = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const runtime = row.querySelector('td:nth-child(3)').textContent.trim().toLowerCase();
                const directory = row.querySelector('td:nth-child(7)').textContent.toLowerCase();
                const promptFile = row.querySelector('td:nth-child(8)').textContent.toLowerCase();
                
                // Apply status filter
                const statusMatch = statusFilter === 'all' || status === statusFilter;
                
                // Apply runtime filter
                const runtimeMatch = runtimeFilter === 'all' || runtime === runtimeFilter;
                
                // Apply search filter
                const searchMatch = searchText === '' || 
                    id.includes(searchText) || 
                    directory.includes(searchText) || 
                    promptFile.includes(searchText);
                
                // Show/hide row based on all filters
                row.style.display = (statusMatch && runtimeMatch && searchMatch) ? '' : 'none';
            });
        }
        
        // Sort instances by a column
        function sortInstances(column, direction) {
            const table = document.getElementById('instance-table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            // Helper function to get comparable value based on column
            function getCellValue(row, col) {
                // Map column to index and type
                const columnMap = {
                    'id': { index: 0, type: 'string' },
                    'status': { index: 1, type: 'string' },
                    'runtime': { index: 2, type: 'string' },
                    'uptime': { index: 3, type: 'time' },
                    'yes_count': { index: 4, type: 'number' },
                    'last_yes': { index: 5, type: 'time' },
                    'directory': { index: 6, type: 'string' },
                    'prompt_file': { index: 7, type: 'string' }
                };
                
                const colInfo = columnMap[col];
                if (!colInfo) return '';
                
                const cell = row.querySelector(`td:nth-child(${colInfo.index + 1})`);
                if (!cell) return '';
                
                let value = cell.textContent.trim();
                
                // Process value based on type
                if (colInfo.type === 'number') {
                    return parseInt(value) || 0;
                } else if (colInfo.type === 'time') {
                    // Parse time strings like "2h 30m" into seconds for comparison
                    let seconds = 0;
                    if (value.includes('h')) {
                        const hours = parseInt(value.split('h')[0]);
                        seconds += hours * 3600;
                        value = value.split('h')[1].trim();
                    }
                    if (value.includes('m')) {
                        const minutes = parseInt(value.split('m')[0]);
                        seconds += minutes * 60;
                        value = value.split('m')[1].trim();
                    }
                    if (value.includes('s')) {
                        const secs = parseInt(value.split('s')[0]);
                        seconds += secs;
                    }
                    return seconds;
                } else {
                    return value.toLowerCase();
                }
            }
            
            // Sort rows
            rows.sort((a, b) => {
                const valA = getCellValue(a, column);
                const valB = getCellValue(b, column);
                
                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
            
            // Re-append rows in sorted order
            rows.forEach(row => tbody.appendChild(row));
            
            // Update headers to show sort direction
            document.querySelectorAll('th.sortable').forEach(th => {
                const sortIndicator = th.dataset.sort === column 
                    ? (direction === 'asc' ? ' ↑' : ' ↓') 
                    : ' ↕';
                th.textContent = th.textContent.replace(/[↑↓↕]$/, '') + sortIndicator;
            });
        }
        
        // Delete selected instances
        function deleteSelected() {
            let instancesToDelete = [];
            
            if (multiSelectEnabled && selectedInstances.size > 0) {
                // Multi-select mode with selected instances
                instancesToDelete = Array.from(selectedInstances);
                document.getElementById('delete-message').textContent = 
                    `Are you sure you want to delete ${instancesToDelete.length} selected instances?`;
            } else if (selectedInstanceId) {
                // Single select mode with one selected instance
                instancesToDelete = [selectedInstanceId];
                document.getElementById('delete-message').textContent = 
                    `Are you sure you want to delete instance ${selectedInstanceId}?`;
            } else {
                showToast('Please select at least one instance to delete', true);
                return;
            }
            
            document.getElementById('delete-modal').style.display = 'block';
        }
        
        function closeDeleteModal() {
            document.getElementById('delete-modal').style.display = 'none';
        }
        
        function confirmDelete() {
            let instancesToDelete = multiSelectEnabled && selectedInstances.size > 0 
                ? Array.from(selectedInstances)
                : [selectedInstanceId];
                
            if (instancesToDelete.length === 0) {
                closeDeleteModal();
                return;
            }
            
            // Send deletion request to server
            fetch('/delete_instances', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ instances: instancesToDelete })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    closeDeleteModal();
                    refreshInstances();
                    showToast(`Successfully deleted ${instancesToDelete.length} instance(s)`);
                    
                    // Clear selections
                    selectedInstanceId = null;
                    selectedRuntimeType = null;
                    selectedInstances.clear();
                } else {
                    showToast('Failed to delete instances: ' + data.error, true);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred while deleting instances', true);
            });
        }
        
        // Manual refresh function with sync and visual feedback
        function manualRefresh() {
            const refreshBtn = document.querySelector('.header-actions .btn-blue');
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Syncing...';
            }
            
            // Run a full sync first
            fetch('/sync_tmux')
                .then(response => response.json())
                .then(data => {
                    if (data.updated) {
                        showToast(`Synchronized with tmux: Found ${data.count} updates`, false);
                    }
                    
                    // Then refresh the UI
                    refreshInstances();
                    
                    // Reset button
                    if (refreshBtn) {
                        setTimeout(() => {
                            refreshBtn.disabled = false;
                            refreshBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Refresh';
                        }, 500);
                    }
                })
                .catch(error => {
                    console.error("Sync error:", error);
                    refreshInstances(); // Still refresh the UI even if sync fails
                    showToast("Error syncing with tmux sessions", true);
                    
                    // Reset button
                    if (refreshBtn) {
                        refreshBtn.disabled = false;
                        refreshBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Refresh';
                    }
                });
        }
        
        // Auto refresh every 3 seconds with a more robust refresh
        function autoRefresh() {
            fetch('/sync_tmux')
                .then(response => response.json())
                .then(data => {
                    if (data.updated) {
                        console.log("Updated instances from tmux sessions: " + data.count);
                    }
                    refreshInstances();
                })
                .catch(error => {
                    console.error("Sync error:", error);
                    refreshInstances(); // Still refresh the UI even if sync fails
                });
        }
        
        setInterval(autoRefresh, 3000);
    </script>
</body>
</html>
'''

@app.route('/')
def dashboard():
    """Main dashboard page."""
    # Reload instances from file first
    manager.load_instances()
    
    # Run a synchronization to ensure we're showing the latest state
    # This now runs both verification and import in one step
    manager._verify_loaded_instances()
    manager._import_unregistered_tmux_sessions()
    
    # Get fresh instance list with accurate tmux status
    instances = manager.list_instances()
    current_time = datetime.now().strftime("%H:%M:%S")
    return render_template_string(
        DASHBOARD_TEMPLATE, 
        instances=instances,
        current_time=current_time,
        manager=manager
    )

def get_tmux_sessions():
    """Get all existing tmux sessions for Claude."""
    try:
        # Run tmux ls to get all sessions
        result = subprocess.run(
            ["tmux", "ls"], 
            capture_output=True, 
            text=True, 
            check=False
        )
        
        if result.returncode != 0:
            # No sessions or tmux not running
            print("No tmux sessions found or tmux not running")
            return []
        
        print(f"Raw tmux output: {result.stdout.strip()}")
        
        # Parse the output to extract session names and creation times
        sessions = []
        for line in result.stdout.strip().split('\n'):
            # First extract any session name (anything before the first colon)
            session_match = re.search(r'^([^:]+):', line)
            if session_match:
                session_name = session_match.group(1).strip()
                print(f"Processing tmux session: {session_name}")
                
                # For any session, capture it (not just those with claude_ prefix)
                instance_id = session_name
                
                # If session has claude_ prefix, extract the ID part
                if session_name.startswith('claude_'):
                    instance_id = session_name[7:]  # Remove 'claude_' prefix
                    print(f"Extracted instance ID from claude_ prefix: {instance_id}")
                
                # Extract full date pattern from "created" portion of the tmux output
                time_match = re.search(r'created ((?:\w+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+\d+))', line)
                
                # If the full pattern doesn't match, try a generic pattern and check for relative times
                if not time_match:
                    # Try the older generic pattern
                    time_match = re.search(r'created (.+?)(?:\)|\s*$)', line)
                
                if time_match:
                    # Parse the creation time from the tmux output
                    try:
                        created_str = time_match.group(1)
                        self_time = time.time()
                        
                        # Extract actual timestamp instead of using heuristics
                        if "second" in created_str:
                            # Few seconds ago - extract the number
                            seconds_match = re.search(r'(\d+) seconds?', created_str)
                            seconds = int(seconds_match.group(1)) if seconds_match else 5
                            creation_timestamp = self_time - seconds
                        elif "minute" in created_str:
                            # Few minutes ago - extract the number
                            minutes_match = re.search(r'(\d+) minutes?', created_str)
                            minutes = int(minutes_match.group(1)) if minutes_match else 1
                            creation_timestamp = self_time - (minutes * 60)
                        elif "hour" in created_str:
                            # Few hours ago - extract the number
                            hours_match = re.search(r'(\d+) hours?', created_str)
                            hours = int(hours_match.group(1)) if hours_match else 1
                            creation_timestamp = self_time - (hours * 3600)
                        else:
                            # Try to parse date directly like "Fri Mar 7 19:53:52 2025"
                            try:
                                # Format: "Day Month DD HH:MM:SS YYYY"
                                creation_time = datetime.strptime(created_str, "%a %b %d %H:%M:%S %Y")
                                creation_timestamp = creation_time.timestamp()
                                print(f"Parsed absolute date: {created_str} -> {creation_time.strftime('%Y-%m-%d %H:%M:%S')}")
                            except Exception as parse_error:
                                # Log error for debugging
                                print(f"Failed to parse date: '{created_str}' - Error: {parse_error}")
                                
                                # Try alternative formats
                                try:
                                    # In case we're missing specific format details, try a more tolerant parser
                                    import time as pytime
                                    parsed_time = pytime.strptime(created_str, "%a %b %d %H:%M:%S %Y")
                                    creation_timestamp = pytime.mktime(parsed_time)
                                    print(f"Parsed using time.strptime: {pytime.strftime('%Y-%m-%d %H:%M:%S', parsed_time)}")
                                except Exception as alt_error:
                                    print(f"Alternative parsing also failed: {alt_error}")
                                    # Default - assume very recent (5 seconds ago)
                                    print(f"WARNING: Using recent timestamp for {session_name} - couldn't parse date format")
                                    creation_timestamp = self_time - 5
                    except Exception as e:
                        print(f"Error parsing creation time for {session_name}: {e}, using recent timestamp")
                        creation_timestamp = time.time() - 5  # Just 5 seconds ago
                else:
                    # Default - assume very recently created (5 seconds ago)
                    print(f"WARNING: No time info found for {session_name}, using recent timestamp")
                    creation_timestamp = time.time() - 5
                
                sessions.append({
                    'session_name': session_name,
                    'instance_id': instance_id,
                    'creation_time': creation_timestamp
                })
        
        return sessions
    
    except Exception as e:
        print(f"Error getting tmux sessions: {e}")
        return []

def import_tmux_sessions():
    """Import all detected Claude tmux sessions into the task manager."""
    # First run direct tmux ls command to see actual sessions
    print("Running direct tmux ls command...")
    try:
        result = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
        if result.returncode == 0:
            print(f"Direct tmux ls result: {result.stdout.strip()}")
        else:
            print("No direct tmux sessions found")
    except Exception as e:
        print(f"Error running direct tmux ls: {e}")
    
    # Get existing tmux sessions through our parser
    tmux_sessions = get_tmux_sessions()
    
    print(f"Parsed tmux sessions: {[s['session_name'] for s in tmux_sessions]}")
    
    # Create a set of active session IDs for status checking
    active_session_ids = {session['instance_id'] for session in tmux_sessions}
    
    if not tmux_sessions:
        print("No Claude tmux sessions detected.")
        # Update status of any instances that may have been terminated outside
        update_count = _update_terminated_instances(active_session_ids)
        return 0
    
    print(f"Found {len(tmux_sessions)} potential Claude tmux sessions.")
    
    # Current working directory 
    cwd = os.getcwd()
    
    # Import each session
    imported_count = 0
    for session in tmux_sessions:
        session_name = session['session_name']
        instance_id = session['instance_id']
        
        print(f"Importing session: {session_name}, ID: {instance_id}")
        
        # Look for direct matches and also session-within-ID matches
        matched_instance = None
        
        # Try direct ID match first
        if instance_id in manager.instances:
            matched_instance = manager.instances[instance_id]
            print(f"Direct match found for instance {instance_id}")
        else:
            # Try matching the session name against existing instance IDs
            for existing_id, existing_instance in manager.instances.items():
                if hasattr(existing_instance, 'tmux_session_name'):
                    if existing_instance.tmux_session_name == session_name:
                        matched_instance = existing_instance
                        print(f"Session name match: {session_name} -> instance {existing_id}")
                        break
                
                # Also try substring matches
                if instance_id in existing_id or existing_id in instance_id:
                    matched_instance = existing_instance
                    print(f"Substring match: {instance_id} <-> {existing_id}")
                    break
        
        # If we found a match, update it
        if matched_instance:
            # Always update the tmux session name to ensure consistency
            matched_instance.tmux_session_name = session_name
            
            # Update status to running if it wasn't already
            if matched_instance.status != "running":
                matched_instance.status = "running"
                print(f"Updated instance {matched_instance.id} status to 'running'")
                imported_count += 1
        else:
            # Create a new instance object
            from claude_task_manager import ClaudeInstance
            
            # For the ID, prefer using the "021xxx" style ID if it looks like that
            # Otherwise use the session name
            if re.match(r'^[0-9]{12,}$', instance_id):
                # This looks like a numeric ID, use it
                new_id = instance_id
            else:
                # Otherwise use the session name
                new_id = session_name
                
            print(f"Creating new instance with ID: {new_id}")
            
            instance = ClaudeInstance(
                id=new_id,
                project_dir=cwd,
                prompt_path="Unknown (imported from existing tmux session)",
                start_time=session['creation_time'],
                status="running",
                tmux_session_name=session_name,
                use_tmux=True,
                open_terminal=False
            )
            
            # Add to manager
            manager.instances[new_id] = instance
            imported_count += 1
            print(f"Imported session {session_name} as instance {new_id}")
    
    # Update status of any instances that may have been terminated outside
    update_count = _update_terminated_instances(active_session_ids)
    if update_count > 0:
        imported_count += update_count
    
    # Save the updated instances
    if imported_count > 0:
        manager.save_instances()
        print(f"Successfully imported/updated {imported_count} tmux sessions.")
    
    return imported_count

def _update_terminated_instances(active_session_ids):
    """Update status of instances whose tmux sessions no longer exist."""
    update_count = 0
    for instance_id, instance in manager.instances.items():
        # Only check instances that use tmux
        if hasattr(instance, 'use_tmux') and instance.use_tmux:
            # If instance is running but its session doesn't exist, mark as stopped
            if instance.status == "running" and instance_id not in active_session_ids:
                instance.status = "stopped"
                print(f"Marked instance {instance_id} as stopped (tmux session gone)")
                update_count += 1
    return update_count

@app.route('/sync_tmux')
def sync_tmux():
    """Synchronize the dashboard with existing tmux sessions using improved methods."""
    # Force reload from disk first
    manager.load_instances()
    
    # Track how many updates were made
    updates_count = 0
    
    try:
        # First verify and update existing instances against actual tmux sessions
        print("=== SYNC: Verifying existing instances against tmux sessions")
        manager._verify_loaded_instances()
        
        # Next import any unregistered tmux sessions
        print("=== SYNC: Importing any unregistered tmux sessions")
        imported_count = manager._import_unregistered_tmux_sessions()
        if imported_count > 0:
            updates_count += imported_count
            print(f"=== SYNC: Imported {imported_count} new tmux sessions")
            
        # Get the current state of all instances for logging
        instances = manager.instances
        active_instances = [id for id, instance in instances.items() 
                          if instance.status == "running"]
        
        print(f"=== SYNC: Current state: {len(instances)} total instances, {len(active_instances)} active")
        
    except Exception as e:
        print(f"=== SYNC: Error during synchronization: {e}")
        # Still return success=True to avoid breaking the UI, but indicate no updates
        return jsonify({
            "success": True,
            "updated": False,
            "count": 0,
            "error": str(e)
        })
    
    # Save instances after synchronization
    manager.save_instances()
    
    # Return success response with count of updated instances
    return jsonify({
        "success": True,
        "updated": updates_count > 0,
        "count": updates_count
    })

@app.route('/refresh')
def refresh():
    """Refresh instances data."""
    # Just reload instances from file - syncing is done separately
    manager.load_instances()
    
    # Get fresh instance list
    instances = manager.list_instances()
    current_time = datetime.now().strftime("%H:%M:%S")
    return render_template_string(
        DASHBOARD_TEMPLATE, 
        instances=instances,
        current_time=current_time,
        manager=manager
    )

@app.route('/add', methods=['POST'])
def add_instance():
    """Add a new Claude instance."""
    # Sync with tmux sessions first to ensure consistent state
    import_tmux_sessions()
    
    proj_dir = request.form.get('project_dir', '').strip()
    prompt_path = request.form.get('prompt_path', '').strip()
    runtime_type = request.form.get('runtime_type', 'tmux').strip().lower()
    open_window = request.form.get('open_window') == 'on'
    
    # Parse out parentheses and single quotes
    import re
    import tempfile
    import glob
    
    # Remove parentheses and their content
    proj_dir = re.sub(r'\([^)]*\)', '', proj_dir).strip()
    prompt_path = re.sub(r'\([^)]*\)', '', prompt_path).strip()
    
    # Remove single quotes
    proj_dir = proj_dir.replace("'", "").replace("'", "")
    prompt_path = prompt_path.replace("'", "").replace("'", "")
    
    # Clean up any extra spaces
    proj_dir = proj_dir.strip()
    prompt_path = prompt_path.strip()
    
    # Check if project directory is just an ID number
    if re.match(r'^\d+$', proj_dir):
        project_id = proj_dir
        # Define search paths
        search_paths = [
            '/Users/Mike/Desktop/upwork/3) current projects',
            '/Users/Mike/Desktop/upwork/2) proposals'
        ]
        
        found_dir = None
        
        # Search for a directory containing the ID in its name
        for base_path in search_paths:
            if os.path.exists(base_path):
                # Check all directories in the base path
                for dir_name in os.listdir(base_path):
                    dir_path = os.path.join(base_path, dir_name)
                    if os.path.isdir(dir_path) and project_id in dir_name:
                        found_dir = dir_path
                        break
            
            if found_dir:
                break
                
        if found_dir:
            proj_dir = found_dir
            print(f"Found project directory: {proj_dir} for ID: {project_id}")
        else:
            return f"Could not find a project directory containing ID: {project_id}", 400
    
    # Check if prompt_path is a file or just text
    is_prompt_text = False
    temp_prompt_file = None
    
    if not os.path.exists(prompt_path) or not os.path.isfile(prompt_path):
        # If it doesn't end with .txt, assume it's text content
        if not prompt_path.lower().endswith('.txt'):
            is_prompt_text = True
    
    # If it's prompt text, create a temporary file
    if is_prompt_text:
        try:
            # Create a temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.txt', mode='w')
            temp_file.write(prompt_path)  # Write the prompt text to the file
            temp_file.close()
            
            temp_prompt_file = temp_file.name
            prompt_path = temp_prompt_file
            
            print(f"Created temporary prompt file: {prompt_path} with content: {prompt_path[:50]}...")
        except Exception as e:
            print(f"Error creating temporary prompt file: {e}")
            return f"Error creating temporary prompt file: {e}", 400
    
    print(f"Adding instance: Directory: {proj_dir}, Prompt: {prompt_path}, Runtime: {runtime_type}")
    
    if not proj_dir or not prompt_path:
        return "Both fields are required", 400
    
    if not os.path.exists(proj_dir):
        return f"Project directory does not exist: {proj_dir}", 400
    
    # Determine whether to use tmux
    use_tmux = runtime_type == 'tmux'
    
    # Start the instance
    instance_id = manager.start_instance(proj_dir, prompt_path, use_tmux=use_tmux)
    
    # If open_window is checked and it's a tmux instance, open a terminal window
    if open_window and use_tmux:
        instance = manager.instances.get(instance_id)
        if instance and instance.tmux_session_name:
            # Open a terminal window attached to the tmux session
            try:
                subprocess.run([
                    "osascript", "-e", 
                    f'tell application "Terminal" to do script "tmux attach -t {instance.tmux_session_name}"'
                ], check=True)
            except Exception as e:
                print(f"Error opening tmux window: {e}")
    
    return redirect(url_for('dashboard'))

def ensure_tmux_session_exists(instance):
    """Ensure that the tmux session for an instance exists."""
    if not hasattr(instance, 'tmux_session_name') or not instance.tmux_session_name:
        return False
        
    # Check if the tmux session exists
    result = subprocess.run(
        ["tmux", "has-session", "-t", instance.tmux_session_name],
        capture_output=True, 
        check=False
    )
    
    return result.returncode == 0

@app.route('/stop/<instance_id>', methods=['POST'])
def stop_instance(instance_id):
    """Stop a running Claude instance."""
    # Sync with tmux first
    import_tmux_sessions()
    
    # Check if the instance exists
    if instance_id not in manager.instances:
        return jsonify({"success": False, "error": f"Instance {instance_id} not found"})
    
    # Verify the tmux session exists if this is a tmux instance
    instance = manager.instances[instance_id]
    if hasattr(instance, 'use_tmux') and instance.use_tmux:
        if not ensure_tmux_session_exists(instance):
            # Session doesn't exist but instance is still marked as running
            if instance.status == "running":
                instance.status = "stopped"
                manager.save_instances()
                return jsonify({"success": True, "message": "Instance was already stopped (tmux session gone)"})
    
    # Try to stop the instance
    success = manager.stop_instance(instance_id)
    
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "error": f"Failed to stop instance {instance_id}"})

@app.route('/interrupt/<instance_id>', methods=['POST'])
def interrupt_instance(instance_id):
    """Send interrupt signal (ESC key) to a running Claude instance."""
    # Get the instance
    instance = manager.instances.get(instance_id)
    if not instance:
        return jsonify({"success": False, "error": f"Instance {instance_id} not found"})
    
    # Check if instance is running
    if instance.status != "running":
        return jsonify({"success": False, "error": f"Instance {instance_id} is not running"})
    
    try:
        if hasattr(instance, 'use_tmux') and instance.use_tmux and instance.tmux_session_name:
            # Send ESC key to tmux session
            subprocess.run([
                "tmux", "send-keys", "-t", instance.tmux_session_name, 
                "Escape"
            ], check=True)
            return jsonify({"success": True})
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
                return jsonify({"success": True})
            else:
                return jsonify({"success": False, "error": f"Terminal ID not found for instance {instance_id}"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/delete_instances', methods=['POST'])
def delete_instances():
    """Delete one or more Claude instances from both the dashboard and the system."""
    data = request.json
    if not data or 'instances' not in data:
        return jsonify({"success": False, "error": "No instances specified"})
    
    instance_ids = data['instances']
    if not instance_ids:
        return jsonify({"success": False, "error": "Empty instance list"})
    
    deleted_count = 0
    errors = []
    
    for instance_id in instance_ids:
        if instance_id in manager.instances:
            # Check if instance is running and stop it first
            instance = manager.instances[instance_id]
            if instance.status == "running":
                # Stop the running instance and its processes
                success = manager.stop_instance(instance_id)
                if not success:
                    errors.append(f"Failed to stop running instance {instance_id}")
                    continue
            
            # Ensure tmux sessions are forcefully killed
            try:
                if hasattr(instance, 'tmux_session_name') and instance.tmux_session_name:
                    session_name = instance.tmux_session_name
                    try:
                        # First try gentle kill
                        app.logger.info(f"Killing tmux session for instance {instance_id}: {session_name}")
                        subprocess.run(["tmux", "kill-session", "-t", session_name], 
                                      check=False, stderr=subprocess.PIPE)
                        
                        # Check if the session still exists
                        check_result = subprocess.run(
                            ["tmux", "has-session", "-t", session_name],
                            capture_output=True, 
                            check=False
                        )
                        
                        # If session still exists, use more aggressive measures
                        if check_result.returncode == 0:
                            app.logger.info(f"Session {session_name} still exists, using forceful kill")
                            
                            # Safer approach to checking tmux sessions with output redirected
                            subprocess.run(
                                ["bash", "-c", "tmux list-sessions 2>/dev/null || echo 'No sessions'"],
                                check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE
                            )
                            
                            # Try pkill to kill any processes related to this tmux session
                            subprocess.run([
                                "pkill", "-f", f"tmux.*{session_name}"
                            ], check=False)
                            
                            # Kill any claude processes related to this session
                            subprocess.run([
                                "pkill", "-f", f"claude.*{session_name}"
                            ], check=False)
                    except Exception as tmux_error:
                        app.logger.error(f"Error killing tmux session: {tmux_error}")
                        
                # For terminal-based instances, ensure terminal is closed
                elif hasattr(instance, 'terminal_id') and instance.terminal_id:
                    terminal_id = instance.terminal_id
                    try:
                        # Close the terminal window
                        close_script = f'''
                        tell application "Terminal"
                            try
                                close (first tab of first window whose id is {terminal_id})
                            end try
                        end tell
                        '''
                        subprocess.run(["osascript", "-e", close_script], capture_output=True, check=False)
                    except Exception as term_error:
                        app.logger.error(f"Error closing terminal window: {term_error}")
            except Exception as e:
                app.logger.error(f"Error cleaning up session resources: {e}")
            
            # Delete the instance from the manager
            try:
                # Remove from instances dictionary
                del manager.instances[instance_id]
                deleted_count += 1
                app.logger.info(f"Successfully deleted instance {instance_id} from manager")
            except Exception as e:
                errors.append(f"Error deleting instance {instance_id}: {str(e)}")
        else:
            errors.append(f"Instance {instance_id} not found")
    
    # Save updated instances to persist the changes
    manager.save_instances()
    
    if errors:
        return jsonify({
            "success": True,
            "message": f"Deleted {deleted_count} instances with {len(errors)} errors",
            "errors": errors
        })
    else:
        return jsonify({
            "success": True,
            "message": f"Successfully deleted {deleted_count} instances from dashboard and system"
        })

@app.route('/view_terminal/<instance_id>', methods=['POST'])
def view_terminal(instance_id):
    """Open or focus the terminal window for the specified instance."""
    # Get the instance
    instance = manager.instances.get(instance_id)
    if not instance:
        return jsonify({"success": False, "error": f"Instance {instance_id} not found"})
    
    try:
        if hasattr(instance, 'use_tmux') and instance.use_tmux:
            # Get the canonical session name
            session_name = manager.get_canonical_session_name(instance)
            print(f"Opening terminal for tmux session: {session_name}")

            # Check if the session exists before trying to attach
            session_exists = manager.is_tmux_session_active(session_name)
            
            if session_exists:
                # Open a terminal window with the existing tmux session - simply attach to it
                print(f"Session {session_name} exists, attaching to it")
                subprocess.run([
                    "osascript", "-e", 
                    f'tell application "Terminal" to do script "tmux attach -t {session_name}"'
                ], check=True)
                return jsonify({"success": True})
            else:
                # Session doesn't exist but was supposed to - might have died or been killed
                print(f"Session {session_name} doesn't exist. Creating a new one with exact claude_monitor_direct approach")
                
                # Verify we have valid prompt path and project dir
                if not os.path.exists(instance.project_dir):
                    return jsonify({"success": False, "error": f"Project directory not found at: {instance.project_dir}"})
                
                prompt_exists = os.path.exists(instance.prompt_path)
                if not prompt_exists and instance.prompt_path != "Unknown (imported from existing tmux session)":
                    return jsonify({"success": False, "error": f"Prompt file not found at: {instance.prompt_path}"})
                
                # Try to create a new session using the exact approach from claude_monitor_direct.py
                try:
                    # First create a detached tmux session 
                    subprocess.run(["tmux", "new-session", "-d", "-s", session_name], check=True)
                    time.sleep(0.5)
                    
                    # Change to the project directory
                    subprocess.run([
                        "tmux", "send-keys", "-t", session_name, 
                        f"cd '{instance.project_dir}'", "Enter"
                    ], check=True)
                    time.sleep(0.5)
                    
                    # Run the Claude CLI
                    subprocess.run([
                        "tmux", "send-keys", "-t", session_name, 
                        "claude", "Enter"
                    ], check=True)
                    time.sleep(5)  # Extra time to ensure Claude initializes
                    
                    # Wait for Claude to initialize and the trust prompt to appear
                    time.sleep(5)  # Wait longer to ensure Claude initializes fully
                    print(f"Waited 5 seconds for Claude to initialize in session {session_name}")
                    
                    # Auto-accept the trust prompt
                    print(f"Handling trust prompt by sending Enter in session {session_name}")
                    subprocess.run([
                        "tmux", "send-keys", "-t", session_name, 
                        "Enter"
                    ], check=True)
                    time.sleep(2)  # Wait for trust prompt to be processed
                    
                    # Send the prompt content if we have a valid prompt file
                    if prompt_exists and instance.prompt_path != "Unknown (imported from existing tmux session)":
                        # Wait additional time to ensure Claude is fully initialized before sending prompt
                        print(f"Waiting 5 more seconds for Claude to initialize fully in session {session_name}...")
                        time.sleep(5)
                        
                        # Read the prompt content
                        with open(instance.prompt_path, 'r') as f:
                            prompt_content = f.read()
                        
                        if prompt_content.strip():
                            print(f"Read prompt file. Size: {len(prompt_content)} bytes")
                            print(f"Prompt preview: {prompt_content[:100]}...")
                            
                            # Break the prompt into manageable chunks to avoid issues with long lines
                            chunk_size = 500  # Send in 500 character chunks
                            
                            for i in range(0, len(prompt_content), chunk_size):
                                chunk = prompt_content[i:i+chunk_size]
                                print(f"Sending chunk {i//chunk_size + 1} of {(len(prompt_content) + chunk_size - 1)//chunk_size}")
                                
                                # Send the chunk as literal text to the tmux session
                                subprocess.run([
                                    "tmux", "send-keys", "-l", "-t", session_name, 
                                    chunk
                                ], check=True)
                                
                                # Brief pause between chunks
                                time.sleep(0.2)
                            
                            # Wait longer to ensure prompt content is fully processed
                            time.sleep(2)
                            
                            # Make sure we're still in the tmux session
                            check_result = subprocess.run(
                                ["tmux", "has-session", "-t", session_name],
                                capture_output=True, 
                                check=False
                            )
                            if check_result.returncode != 0:
                                print(f"tmux session {session_name} does not exist anymore!")
                                return jsonify({"success": False, "error": "The tmux session was terminated during prompt delivery"})
                            
                            # Send the first Enter key
                            print(f"Sending first Enter key to submit prompt in session {session_name}...")
                            time.sleep(1)  # Wait a bit before sending Enter to make sure the paste is complete
                            
                            enter_result = subprocess.run([
                                "tmux", "send-keys", "-t", session_name, 
                                "Enter"
                            ], check=True, capture_output=True)
                            
                            # Send a second Enter after a brief pause to ensure it's processed
                            time.sleep(1)
                            second_enter = subprocess.run([
                                "tmux", "send-keys", "-t", session_name, 
                                "Enter"
                            ], check=True, capture_output=True)
                            print(f"Sent second Enter to ensure prompt submission in session {session_name}")
                            
                            # Wait to ensure Claude begins processing
                            time.sleep(1)
                    
                    # Now open a terminal window attached to this session
                    subprocess.run([
                        "osascript", "-e", 
                        f'tell application "Terminal" to do script "tmux attach -t {session_name}"'
                    ], check=True)
                    
                    # Update the instance status to running
                    instance.status = "running"
                    instance.tmux_session_name = session_name
                    manager.save_instances()
                    
                    return jsonify({"success": True, "message": "Created new tmux session"})
                except Exception as e:
                    print(f"Error creating new session: {e}")
                    return jsonify({"success": False, "error": f"Failed to create session: {e}"})
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
                return jsonify({"success": True})
            else:
                return jsonify({"success": False, "error": f"Terminal ID not found for instance {instance_id}"})
    except Exception as e:
        print(f"Error opening terminal: {e}")
        return jsonify({"success": False, "error": str(e)})

@app.route('/upload_file', methods=['POST'])
def upload_file():
    """Handle file upload and path extraction."""
    import tempfile
    import os
    import subprocess
    import shutil
    from pathlib import Path
    
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    is_directory = request.form.get('is_directory') == '1'
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # On macOS, we can use mdfind to locate files and directories
    # First save the file to a temp location
    temp_dir = tempfile.mkdtemp()
    try:
        temp_file_path = os.path.join(temp_dir, file.filename)
        file.save(temp_file_path)
        
        # For Mac, try to get the file's original path using mdfind
        if os.path.exists('/usr/bin/mdfind'):
            try:
                # Use the file's name (without path) to find matching files on the system
                filename = os.path.basename(file.filename)
                
                # Use mdfind to search for files with the same name
                cmd = ['/usr/bin/mdfind', f'kMDItemFSName == "{filename}"']
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                paths = result.stdout.strip().split('\n')
                
                # Filter out empty paths
                paths = [p for p in paths if p.strip()]
                
                if paths:
                    # For directory request, try to find directories
                    if is_directory:
                        # First try to find directories in the paths
                        dir_paths = [p for p in paths if os.path.isdir(p)]
                        if dir_paths:
                            # Prioritize directories in the home folder
                            home_dir = str(Path.home())
                            for p in dir_paths:
                                if p.startswith(home_dir):
                                    return jsonify({"path": p})
                            
                            # If no match in home dir, just return the first directory
                            return jsonify({"path": dir_paths[0]})
                    
                    # Otherwise handle like a regular file
                    # If multiple results, try to find the most relevant one (e.g., home directory)
                    home_dir = str(Path.home())
                    for p in paths:
                        if p.startswith(home_dir):
                            return jsonify({"path": p})
                    
                    # If no match in home dir, just return the first match
                    return jsonify({"path": paths[0]})
            except Exception as e:
                print(f"Error using mdfind: {e}")
        
        # Fallback: If directory and the filename looks like it could be a directory name
        if is_directory:
            # Try to find a matching directory name in some common locations
            potential_dirs = [
                os.path.join(str(Path.home()), file.filename),
                os.path.join(str(Path.home()), 'Desktop', file.filename),
                os.path.join(str(Path.home()), 'Documents', file.filename),
                os.path.join('/Users/Mike/Desktop/upwork', file.filename)
            ]
            
            for dir_path in potential_dirs:
                if os.path.isdir(dir_path):
                    return jsonify({"path": dir_path})
            
            # Last resort, return a placeholder with the directory name
            return jsonify({"path": f"/path/to/{file.filename}"})
        else:
            # For files, return the filename
            return jsonify({"path": file.filename})
    
    finally:
        # Clean up
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            print(f"Error removing temp directory: {e}")

@app.route('/find_directory', methods=['POST'])
def find_directory():
    """Specialized endpoint to find directory paths."""
    import os
    import subprocess
    import re
    from pathlib import Path
    
    # Debug the incoming request
    print("Request form data:", request.form)
    print("Request files:", request.files)
    
    # First try to get the directory name
    dir_name = request.form.get('directory_name', '')
    if not dir_name and 'file' in request.files:
        file = request.files['file']
        dir_name = file.filename
    
    if not dir_name:
        print("No directory name found in request")
        # Return a more forgiving response instead of an error
        return jsonify({"path": ""})
    
    # Clean the directory name
    # Remove parentheses and their content
    dir_name = re.sub(r'\([^)]*\)', '', dir_name).strip()
    # Remove single quotes
    dir_name = dir_name.replace("'", "").replace("'", "")
    # Clean up any extra spaces
    dir_name = dir_name.strip()
    
    print(f"Searching for directory: {dir_name} (cleaned)")
    
    # Method 0: If we can directly check the path and it exists, return it
    if os.path.isdir(dir_name):
        return jsonify({"path": dir_name})
    
    # Method 1: Check if directory exists in common locations (fastest method)
    # This is now our first method because it's fastest and most reliable
    common_locations = [
        os.path.join(str(Path.home()), dir_name),
        os.path.join(str(Path.home()), 'Desktop', dir_name),
        os.path.join(str(Path.home()), 'Documents', dir_name),
        os.path.join('/Users/Mike/Desktop/upwork', dir_name),
        os.path.join('/Users/Mike/Desktop/upwork/1) proposal automation', dir_name),
        os.path.join('/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal', dir_name),
        os.path.join('/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code', dir_name)
    ]
    
    for loc in common_locations:
        if os.path.isdir(loc):
            print(f"Found directory in common location: {loc}")
            return jsonify({"path": loc})
    
    # Method 2: Use find command to locate the directory
    try:
        # Start with the most likely places: User's home dir, Desktop, Documents, and Upwork folder
        search_paths = [
            str(Path.home()),
            os.path.join(str(Path.home()), 'Desktop'),
            os.path.join(str(Path.home()), 'Documents'),
            '/Users/Mike/Desktop/upwork'
        ]
        
        for search_path in search_paths:
            if not os.path.exists(search_path):
                continue
                
            cmd = ['find', search_path, '-type', 'd', '-name', dir_name, '-maxdepth', '4']
            print(f"Running find command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            paths = result.stdout.strip().split('\n')
            
            # Filter out empty paths
            paths = [p for p in paths if p.strip()]
            
            if paths:
                # Return the first matching directory
                print(f"Found directory using find: {paths[0]}")
                return jsonify({"path": paths[0]})
    except Exception as e:
        print(f"Error using find command: {e}")
    
    # Method 3: Use mdfind for macOS
    try:
        if os.path.exists('/usr/bin/mdfind'):
            cmd = ['/usr/bin/mdfind', '-onlyin', str(Path.home()), f'kMDItemDisplayName == "{dir_name}"']
            print(f"Running mdfind command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            paths = result.stdout.strip().split('\n')
            
            # Filter out empty paths
            paths = [p for p in paths if p.strip()]
            
            # Filter to directories only
            dir_paths = [p for p in paths if os.path.isdir(p)]
            
            if dir_paths:
                # Return the first matching directory
                print(f"Found directory using mdfind: {dir_paths[0]}")
                return jsonify({"path": dir_paths[0]})
    except Exception as e:
        print(f"Error using mdfind: {e}")
    
    # If we couldn't find a match, return the directory name as fallback
    print(f"No match found, returning directory name: {dir_name}")
    return jsonify({"path": dir_name})

def open_browser():
    """Open the web browser after a short delay."""
    time.sleep(2)  # Wait a bit longer to ensure server is ready
    import webbrowser
    import socket
    
    # Get the computer's hostname for a more reliable connection
    hostname = socket.gethostname()
    
    # Try to open with the hostname first
    url = f'http://{hostname}:5000'
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
        webbrowser.open('http://localhost:5000')

def check_server_running():
    """Check if the server is already running on port 5000."""
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        s.connect(("127.0.0.1", 5000))
        s.close()
        return True
    except:
        return False

def shutdown_existing_server():
    """Attempt to shut down an existing server if one is running."""
    import requests
    try:
        # Try making a request to shut down the server
        print("Attempting to shut down existing server...")
        requests.get("http://127.0.0.1:5000/shutdown", timeout=2)
        # Wait a moment for the server to shut down
        import time
        time.sleep(2)
        return True
    except:
        return False

# Add a shutdown route to the Flask app
@app.route('/shutdown')
def shutdown():
    """Shutdown the server."""
    import os
    # Using os._exit because Flask's shutdown request doesn't always work reliably
    print("Server shutting down...")
    os._exit(0)
    return "Server shutting down..."

def main():
    """Start the web dashboard."""
    # Force kill any existing Python processes using port 5000
    import sys
    import platform
    import os
    import signal
    
    print("Ensuring no previous server instances are running...")
    
    # Get platform-specific command to find processes using port 5000
    if platform.system() == "Darwin":  # macOS
        # Find processes using port 5000
        find_cmd = "lsof -i:5000 -t"
        try:
            import subprocess
            process_ids = subprocess.check_output(find_cmd, shell=True).decode('utf-8').strip().split('\n')
            for pid in process_ids:
                if pid:  # Check if pid is not empty
                    pid = int(pid)
                    print(f"Killing process {pid} using port 5000")
                    try:
                        os.kill(pid, signal.SIGKILL)
                    except Exception as e:
                        print(f"Failed to kill process {pid}: {e}")
        except Exception as e:
            print(f"Error checking for running processes: {e}")
    
    # Wait for the port to be freed
    import time
    import socket
    for _ in range(5):  # Try up to 5 times
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.connect(("127.0.0.1", 5000))
            # Port is still in use
            s.close()
            print("Port 5000 is still in use, waiting...")
            time.sleep(1)
        except:
            # Port is free
            print("Port 5000 is free, starting server...")
            break
        finally:
            s.close()
    
    # Start browser in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Start Flask app with host='0.0.0.0' to allow access from all network interfaces
    print("Starting server...")
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == "__main__":
    main()
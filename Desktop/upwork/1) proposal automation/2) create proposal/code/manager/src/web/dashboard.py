#!/usr/bin/env python3
import os
import subprocess
import time
import json
import re
from datetime import datetime
import threading
from flask import Flask, render_template_string, redirect, url_for, request, jsonify, send_file
from src.claude_task_manager import ClaudeTaskManager

# Initialize task manager with absolute path to ensure consistency with test_instance.py
import os
manager_dir = os.path.dirname(os.path.abspath(__file__))
save_file = os.path.join(manager_dir, "..", "config", "claude_instances.json")
print(f"Web dashboard using instance file: {save_file}")
manager = ClaudeTaskManager(save_file=save_file)

# Create Flask app with static folder
static_folder = os.path.join(manager_dir, "..", "static")
app = Flask(__name__, static_folder=static_folder, static_url_path='/static')

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
            width: 100vw;
            overflow-x: hidden;
        }
        
        .container {
            width: calc(100vw - 40px);
            max-width: calc(100vw - 40px);
            margin: 0 auto;
            padding: 20px;
            overflow-x: auto;
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
            margin-bottom: 2.5rem;  /* Increased from 1.5rem */
            padding-bottom: 1.5rem;  /* Increased from 1rem */
            border-bottom: 1px solid var(--border-color);
        }
        
        .app-logo {
            display: flex;
            align-items: center;
            gap: 1.5rem;  /* Increased from 0.75rem */
        }
        
        .app-logo svg {
            color: var(--accent-blue);
            height: 4rem;  /* Doubled from 2rem to 4rem */
            width: 4rem;   /* Doubled from 2rem to 4rem */
        }
        
        .app-logo h1 {
            margin: 0;
            text-align: left;
            font-size: 2.5rem;  /* Increased from default */
            letter-spacing: -0.5px;
            font-weight: 800;
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
        
        table {
            background-color: var(--bg-darker);
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            box-shadow: var(--card-shadow);
        }
        
        /* Tab styles for Settings */
        .tabs {
            display: flex;
            margin-bottom: 0;
            border-bottom: 1px solid var(--border-color);
        }
        
        .tab {
            padding: 0.75rem 1rem;
            cursor: pointer;
            color: var(--text-secondary);
            background-color: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            font-family: inherit;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .tab:hover {
            color: var(--text-primary);
            background-color: rgba(75, 85, 99, 0.1);
        }
        
        .tab.active {
            color: var(--accent-blue);
            border-bottom: 2px solid var(--accent-blue);
        }
        
        .tab-content {
            display: none;
            padding: 1.5rem;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .quick-add {
            display: grid;
            grid-template-columns: 1fr 1fr auto auto;
            gap: 1rem;
            align-items: center;
        }
        
        .input-group {
            position: relative;
            margin-bottom: 1rem;
        }
        
        .input-group label {
            position: absolute;
            top: -0.5rem;
            left: 0.75rem;
            background-color: var(--bg-darker);
            padding: 0 0.25rem;
            font-size: 0.75rem;
            color: var(--text-secondary);
            z-index: 10;
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
        
        .prompt-selector {
            position: relative;
            width: 100%;
        }
        
        .prompt-dropdown {
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            padding: 0.75rem 1rem;
            background-color: var(--accent-blue);
            color: white;
            border: 1px solid var(--accent-blue);
            border-top-right-radius: 0.375rem;
            border-bottom-right-radius: 0.375rem;
            font-family: inherit;
            font-size: 0.875rem;
            cursor: pointer;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* Autocomplete styles */
        .autocomplete-container {
            position: relative;
            width: 100%;
            margin-top: 0;
        }
        
        .autocomplete-items {
            position: absolute;
            border: 1px solid var(--border-color);
            border-top: none;
            z-index: 99;
            top: 100%;
            left: 0;
            right: 0;
            border-radius: 0 0 0.375rem 0.375rem;
            background-color: var(--bg-darker);
            max-height: 200px;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .autocomplete-items div {
            padding: 0.75rem 1rem;
            cursor: pointer;
            font-size: 0.875rem;
            color: var(--text-primary);
            border-bottom: 1px solid var(--border-color);
        }
        
        .autocomplete-items div:hover,
        .autocomplete-items div.autocomplete-active {
            background-color: var(--hover-color);
        }
        
        .autocomplete-items .highlight {
            font-weight: bold;
            color: var(--accent-blue);
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
            gap: 1.5rem;
            margin: 2rem 0 1.5rem;
            align-items: center;
            flex-wrap: wrap;
            padding: 0.5rem 0;
        }
        
        .search-box {
            padding: 0.85rem 1.2rem;
            background-color: var(--input-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            min-width: 300px;
            font-family: inherit;
            font-size: 1rem;
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .search-box:focus {
            border-color: var(--accent-blue);
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        .filter-dropdown {
            padding: 0.85rem 1.2rem;
            background-color: var(--input-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            border-radius: 0.5rem;
            cursor: pointer;
            font-family: inherit;
            font-size: 1rem;
            min-width: 180px;
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .filter-dropdown:focus {
            border-color: var(--accent-blue);
            outline: none;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        .btn {
            padding: 0.85rem 1.2rem;
            background-color: var(--accent-green);
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: all 0.2s ease;
            font-size: 1rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .btn:hover {
            filter: brightness(1.1);
            transform: translateY(-1px);
        }
        
        .btn svg {
            width: 1.25rem;
            height: 1.25rem;
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
        
        .send-prompt-container {
            display: flex;
            gap: 0.75rem;
            margin-top: 1rem;
            align-items: center;
            background-color: var(--bg-darker);
            padding: 0.75rem;
            border-radius: 0.5rem;
            box-shadow: var(--card-shadow);
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
            max-width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin-top: 1rem;
            overflow: hidden;
            table-layout: fixed;
            padding: 1rem;
        }
        
        th, td {
            padding: 1.25rem;  /* Increased from 1rem */
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        /* Specific overrides for project and prompt columns to allow text wrapping */
        td:nth-child(5), td:nth-child(6), td:nth-child(7) {
            white-space: normal;
            word-break: break-word;
            box-sizing: border-box;
            padding-right: 0.75rem;
        }
        
        th {
            background-color: var(--header-bg);
            color: var(--text-secondary);
            font-weight: 600;
            font-size: 0.9rem;  /* Increased from 0.75rem */
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        td {
            border-bottom: 1px solid var(--border-color);
            font-size: 1rem;  /* Increased from 0.875rem */
            line-height: 1.6;  /* Added for better readability */
            max-width: 0; /* This forces td to respect the table layout */
            box-sizing: border-box;
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
            padding: 0.4rem 0.8rem;  /* Increased from 0.25rem 0.5rem */
            border-radius: 9999px;
            font-size: 0.9rem;  /* Increased from 0.75rem */
            font-weight: 600;  /* Increased from 500 */
            line-height: 1.2;  /* Increased from 1 */
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);  /* Added subtle shadow */
            width: 90px;
            justify-content: center;
        }
        
        /* Row action buttons */
        .row-actions {
            display: none;
            position: absolute;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
            background-color: var(--bg-card);
            padding: 0.25rem;
            border-radius: 0.375rem;
            box-shadow: var(--card-shadow);
            z-index: 5;
        }
        
        tr:hover .row-actions {
            display: flex;
            gap: 0.25rem;
        }
        
        .row-action-btn {
            width: 32px;
            height: 32px;
            padding: 0.25rem;
            border: none;
            border-radius: 0.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            color: white;
        }
        
        .row-action-btn:hover {
            transform: translateY(-1px);
            filter: brightness(1.2);
        }
        
        .row-action-btn svg {
            width: 16px;
            height: 16px;
        }
        
        .view-btn {
            background-color: var(--accent-purple);
        }
        
        .interrupt-btn {
            background-color: var(--accent-orange);
        }
        
        .stop-btn {
            background-color: var(--accent-red);
        }
        
        .delete-btn {
            background-color: #444;
        }
        
        /* Ensure table rows have relative positioning for absolute positioning of buttons */
        tbody tr {
            position: relative;
        }
        
        .running {
            background-color: rgba(16, 185, 129, 0.2);
            color: var(--accent-green);
        }
        
        .stopped {
            background-color: rgba(239, 68, 68, 0.2);
            color: var(--accent-red);
        }
        
        .ready {
            background-color: rgba(16, 185, 129, 0.2);
            color: var(--accent-green); /* Green color */
        }
        
        .running {
            background-color: rgba(234, 179, 8, 0.2);
            color: #EAB308; /* Yellow color */
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
            z-index: 10;
            position: relative;
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
        
        /* Input styles */
        .input-container {
            border: 2px solid var(--border-color);
            border-radius: 6px;
            padding: 20px;
            text-align: center;
            margin-bottom: 15px;
            background-color: var(--bg-darker);
            transition: all 0.3s;
        }
        
        .input-container p {
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
        
        /* Response styles */
        .response-container {
            scrollbar-width: thin;
            scrollbar-color: var(--accent-blue) var(--bg-darker);
            /* Prevent scroll flash during refresh */
            contain: paint;
            content-visibility: auto;
            max-height: 300px;
            overflow-y: auto;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 0.375rem;
            background-color: var(--bg-darker);
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            width: 100%;
            box-sizing: border-box;
        }
        
        .response-preview {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem;
            background-color: var(--bg-card);
            border-radius: 0.375rem;
            margin-bottom: 0.5rem;
            border: 1px solid var(--border-color);
            position: relative;
            width: calc(100% - 10px);
            max-width: 100%;
            box-sizing: border-box;
        }
        
        .preview-text-container {
            flex-grow: 1;
            overflow: hidden;
            margin-right: 10px;
        }

        .preview-text {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            display: inline-block;
        }
        
        .expand-btn, .collapse-btn {
            margin-left: 0.5rem;
            font-size: 0.8rem;
            padding: 0.25rem 0.5rem;
            background-color: var(--accent-green);
            color: white;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
            display: inline-block;
            flex-shrink: 0;
            white-space: nowrap;
            font-weight: 600;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            min-width: 75px;
        }
        
        .expand-btn:hover, .collapse-btn:hover {
            background-color: var(--accent-indigo);
        }
        
        /* Response modal popup styles */
        .response-popup {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .response-popup-content {
            background-color: var(--bg-darker);
            padding: 2rem;
            border-radius: 0.5rem;
            width: 95%;
            max-width: 95vw;
            max-height: 90%;
            overflow-y: auto;
            overflow-x: hidden;
            position: relative;
            box-shadow: var(--card-shadow);
        }
        
        .close-popup {
            position: absolute;
            top: 10px;
            right: 10px;
            color: var(--text-primary);
            font-size: 1.5rem;
            cursor: pointer;
            background: none;
            border: none;
        }
        
        .close-popup:hover {
            color: var(--accent-red);
        }
        
        .popup-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
            color: var(--accent-blue);
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        /* Prevents flash of unstyled content during refresh */
        .refreshing .response-container {
            opacity: 0.6;
            transition: opacity 0.05s ease;
        }
        
        .response-container::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        .response-container::-webkit-scrollbar-track {
            background: var(--bg-darker);
            border-radius: 4px;
        }
        
        .response-container::-webkit-scrollbar-thumb {
            background-color: var(--accent-blue);
            border-radius: 4px;
            border: 2px solid var(--bg-darker);
        }
        
        .response-container::-webkit-scrollbar-thumb:hover {
            background-color: var(--accent-indigo);
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
                <button class="btn btn-purple" onclick="showSettingsModal()">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                </button>
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
            <form id="quick-add-form" class="quick-add" onsubmit="event.preventDefault(); smartSubmitAction();">
                <div class="input-group">
                    <label for="quick-project-dir">Project Directory or ID</label>
                    <input type="text" id="quick-project-dir" class="input-field" placeholder="Project path or just ID number">
                </div>
                <div class="input-group">
                    <label for="quick-prompt-path">Prompt File or Text</label>
                    <div class="autocomplete-container">
                        <input type="text" id="quick-prompt-path" class="input-field" placeholder="Prompt file path or direct text" required autocomplete="off">
                    </div>
                </div>
                <div class="runtime-toggle">
                    <label class="switch">
                        <input type="checkbox" id="quick-use-tmux" checked>
                        <span class="slider"></span>
                    </label>
                    <label for="quick-use-tmux">Use tmux</label>
                </div>
                <div class="runtime-toggle">
                    <label class="switch">
                        <input type="checkbox" id="quick-open-window">
                        <span class="slider"></span>
                    </label>
                    <label for="quick-open-window">Open terminal</label>
                </div>
                <button type="submit" class="btn btn-green">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span id="submit-button-text">Create Instance</span>
                </button>
            </form>
        </div>
        
        <!-- Filters & Actions -->
        <div class="filters">
            <input type="text" class="search-box" id="instance-search" placeholder="Search projects, prompts..." oninput="filterInstances()">
            
            <select class="filter-dropdown" id="status-filter" onchange="filterInstances()">
                <option value="all">All Statuses</option>
                <option value="ready">Ready Only</option>
                <option value="running">Running Only</option>
                <option value="stopped">Stopped Only</option>
            </select>
            
            <select class="filter-dropdown" id="runtime-filter" onchange="filterInstances()">
                <option value="all">All Types</option>
                <option value="tmux">tmux Only</option>
                <option value="terminal">Terminal Only</option>
            </select>
            
            <!-- Multi-select and Select All options removed -->
            <div></div>
        </div>
        
        <!-- Action buttons removed from toolbar since they're now available per row -->
        
        <table id="instance-table">
            <thead>
                <tr>
                    <th class="sortable" data-sort="id" style="display:none;">ID ↕</th>
                    <th class="sortable" data-sort="status" style="width:120px;">Status ↕</th>
                    <th class="sortable" data-sort="active_time" style="width:90px;">Time ↕</th>
                    <th class="sortable" data-sort="yes_count" style="width:80px;">Count ↕</th>
                    <th class="sortable" data-sort="directory" style="width:25%;">Project ↕</th>
                    <th class="sortable" data-sort="prompt_file" style="width:25%;">Prompt ↕</th>
                    <th class="sortable" data-sort="response" style="width:30%;">Response ↕</th>
                </tr>
            </thead>
            <tbody id="instance-list">
                {% for instance in instances %}
                {% set instance_obj = manager.instances.get(instance.get('id', '')) %}
                {% set use_tmux = instance_obj.__dict__.get('use_tmux', False) if instance_obj else False %}
                {% set runtime_type = "tmux" if use_tmux else "terminal" %}
                {# Get the detailed status directly from the instance dictionary #}
                {% set detailed_status = instance.get('detailed_status', 'ready') %}
                <tr data-id="{{ instance.get('id', '') }}" data-runtime="{{ runtime_type }}">
                    <td style="display:none;">{{ instance.get('id', '') }}</td>
                    <td style="width:120px;">
                        <!-- Row action buttons that appear on hover -->
                        <div class="row-actions">
                            <!-- View Terminal -->
                            <button class="row-action-btn view-btn" onclick="viewTerminalForRow('{{ instance.get('id', '') }}')">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            
                            <!-- Stop Instance -->
                            <button class="row-action-btn stop-btn" onclick="stopInstanceForRow('{{ instance.get('id', '') }}')">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            
                            <!-- Delete Instance -->
                            <button class="row-action-btn delete-btn" onclick="deleteInstanceForRow('{{ instance.get('id', '') }}')">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    
                        {% if instance.get('status', '') == 'running' %}
                            {% if detailed_status == 'running' %}
                                <span class="status-badge running">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                                        <circle cx="12" cy="12" r="12" />
                                    </svg>
                                    running
                                </span>
                            {% else %}
                                <span class="status-badge ready">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                                        <circle cx="12" cy="12" r="12" />
                                    </svg>
                                    ready
                                </span>
                            {% endif %}
                        {% else %}
                            <span class="status-badge {{ instance.get('status', 'stopped') }}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                                    <circle cx="12" cy="12" r="12" />
                                </svg>
                                {{ instance.get('status', 'stopped') }}
                            </span>
                        {% endif %}
                    </td>
                    <td style="width:90px;">
                        {% if detailed_status == 'running' and instance.get('generation_time', '') and instance.get('generation_time', '') != '0s' %}
                            <span style="color: #EAB308; font-size: 1.1rem; font-weight: 600;">{{ instance.get('generation_time', '') }}</span>
                        {% else %}
                            {% set ready_time = '' %}
                            {% set instance_obj = manager.instances.get(instance.get('id', '')) %}
                            {% if instance_obj and instance_obj.ready_since %}
                                {% set elapsed_seconds = current_timestamp - instance_obj.ready_since %}
                                {% if elapsed_seconds < 60 %}
                                    {% set ready_time = '%ds' % elapsed_seconds %}
                                {% elif elapsed_seconds < 3600 %}
                                    {% set minutes = elapsed_seconds // 60 %}
                                    {% set seconds = elapsed_seconds % 60 %}
                                    {% set ready_time = '%dm %ds' % (minutes, seconds) %}
                                {% else %}
                                    {% set hours = elapsed_seconds // 3600 %}
                                    {% set minutes = (elapsed_seconds % 3600) // 60 %}
                                    {% set ready_time = '%dh %dm' % (hours, minutes) %}
                                {% endif %}
                                <span style="color: var(--text-primary); font-size: 1.1rem;">{{ ready_time }}</span>
                            {% else %}
                                <span style="color: var(--text-primary); font-size: 1.1rem;">0s</span>
                            {% endif %}
                        {% endif %}
                    </td>
                    <td style="width:80px;"><span style="font-size: 1.1rem; font-weight: 500;">{{ instance.get('yes_count', 0) }}</span></td>
                    <td style="width:25%;">
                        {% if instance_obj is defined and instance_obj.__dict__.get('project_dir', '') %}
                            {% set project_dir = instance_obj.__dict__.get('project_dir', '') %}
                            {% set project_logo = None %}
                            
                            {# Check for logo in demo subdirectory first (most common location) #}
                            {% set demo_path = os.path.join(project_dir, 'demo') %}
                            {% if os.path.isdir(demo_path) %}
                                {% set demo_logo = os.path.join(demo_path, "PROJECT_UI_LOGO.svg") %}
                                {% if os.path.exists(demo_logo) %}
                                    {% set project_logo = demo_logo %}
                                {% endif %}
                            {% endif %}
                            
                            {# If not found in demo, check directly in project directory #}
                            {% if not project_logo %}
                                {% set direct_logo = os.path.join(project_dir, "PROJECT_UI_LOGO.svg") %}
                                {% if os.path.exists(direct_logo) %}
                                    {% set project_logo = direct_logo %}
                                {% endif %}
                            {% endif %}
                            
                            {# If not found in either location, check other subdirectories #}
                            {% if not project_logo %}
                                {% set found_logo = false %}
                                {% for item in os.listdir(project_dir) if os.path.isdir(os.path.join(project_dir, item)) and not found_logo %}
                                    {% set subdir_path = os.path.join(project_dir, item) %}
                                    {% if subdir_path != demo_path %}  {# Skip demo if already checked #}
                                        {% set subdir_logo = os.path.join(subdir_path, "PROJECT_UI_LOGO.svg") %}
                                        {% if os.path.exists(subdir_logo) and not found_logo %}
                                            {% set project_logo = subdir_logo %}
                                            {% set found_logo = true %}
                                        {% endif %}
                                    {% endif %}
                                {% endfor %}
                            {% endif %}
                            
                            {% if project_logo %}
                                <div style="display: flex; align-items: center;">
                                    <div style="width: 36px; height: 36px; margin-right: 12px; display: flex; align-items: center; justify-content: center;">
                                        <img src="{{ url_for('serve_svg', svg_path=project_logo[1:]) }}" 
                                             width="36" height="36" alt="Project Logo"
                                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                                             style="max-width: 36px; max-height: 36px;">
                                             
                                        <!-- Fallback SVG that displays only if the image fails to load -->
                                        {% set dir_name = os.path.basename(project_dir) %}
                                        {% set first_letter = dir_name[0]|upper if dir_name else 'P' %}
                                        <svg width="36" height="36" viewBox="0 0 36 36" style="display: none;">
                                            <rect width="36" height="36" rx="6" fill="#3b82f6" />
                                            <text x="18" y="24" text-anchor="middle" fill="white" font-weight="bold" font-size="20" font-family="Arial, sans-serif">{{ first_letter }}</text>
                                        </svg>
                                    </div>
                                    {{ project_dir }}
                                </div>
                            {% else %}
                                {{ project_dir }}
                            {% endif %}
                        {% else %}
                            {{ instance.get('project_dir', '') }}
                        {% endif %}
                    </td>
                    <td style="width:25%;">{{ instance.get('prompt_path', '') }}</td>
                    <td style="width:30%;">
                        {% if instance_obj is defined and use_tmux and instance.get('status', '') == 'running' %}
                            {% set tmux_content = "" %}
                            
                            {# First try to get content from instance dict (passed in context) #}
                            {% if instance.get('tmux_content') %}
                                {% set tmux_content = instance.get('tmux_content') %}
                            {# Then try instance_obj (in-memory object) #}
                            {% elif instance_obj is defined and instance_obj.__dict__.get('tmux_content') %}
                                {% set tmux_content = instance_obj.tmux_content %}
                            {# Fallback to direct tmux fetch if necessary #}
                            {% elif instance_obj is defined and instance_obj.__dict__.get('tmux_session_name') %}
                                {% set capture_cmd = "tmux capture-pane -p -t " + instance_obj.tmux_session_name %}
                                {% set capture_result = "" %}
                                
                                {# Use a simpler approach without try/except: call the command and use the result if successful #}
                                {% set temp = os.popen(capture_cmd) %}
                                {% set capture_result = temp.read() %}
                                {% set rc = temp.close() %}
                                
                                {% if capture_result %}
                                    {% set tmux_content = capture_result %}
                                {% endif %}
                            {% endif %}
                            
                            {% if tmux_content %}
                                {# Only show content if we are in ready state (not running) #}
                                {% if detailed_status != 'running' %}
                                    {# Store the response - everything before the ready state #}
                                    {% if '╭──────────────────────────────────────────────────────────────────────────────╮' in tmux_content %}
                                        {% set cutoff_index = tmux_content.find('╭──────────────────────────────────────────────────────────────────────────────╮') %}
                                        {% set response_snippet = tmux_content[:cutoff_index] %}
                                    {% else %}
                                        {% set response_snippet = tmux_content %}
                                    {% endif %}
                                    
                                    {% if response_snippet %}
                                        {% set short_text = response_snippet[:150].replace('\n', ' ').strip() %}
                                        
                                        <div class="response-preview" data-instance-id="{{ instance.get('id', '') }}">
                                            <div class="preview-text-container">
                                                <span class="preview-text">{{ short_text }}{% if response_snippet|length > 150 %}...{% endif %}</span>
                                            </div>
                                            <button class="expand-btn" data-full-content="{{ response_snippet|replace('\n', ' ')|replace('<', '&lt;')|replace('>', '&gt;')|replace('"', '&quot;')|replace("'", '&#39;') }}" onclick="showResponsePopup(event, '{{ instance.get('id', '') }}', this.getAttribute('data-full-content'))">Show more</button>
                                        </div>
                                    {% else %}
                                        <span style="font-style: italic; color: var(--text-secondary);">No response content</span>
                                    {% endif %}
                                {% else %}
                                    <span class="generating-indicator" data-instance-id="{{ instance.get('id', '') }}" style="font-style: italic; color: var(--text-secondary);">Generating response...</span>
                                {% endif %}
                            {% else %}
                                <span style="font-style: italic; color: var(--text-secondary);">Unable to retrieve content</span>
                            {% endif %}
                        {% elif instance.get('status', '') != 'running' %}
                            <span style="font-style: italic; color: var(--text-secondary);">Instance not running</span>
                        {% else %}
                            <span style="font-style: italic; color: var(--text-secondary);">Not available</span>
                        {% endif %}
                    </td>
                </tr>
                {% endfor %}
            </tbody>
        </table>
        
        <div class="status-bar" id="status-bar">
            <span>
                {% set active_count = 0 %}
                {% set standby_count = 0 %}
                {% set stopped_count = 0 %}
                
                {% for inst in instances %}
                    {% set status = inst.get('status', 'stopped') %}
                    {% set detailed = inst.get('detailed_status', '') %}
                    
                    {% if status == 'running' %}
                        {% if detailed == 'running' %}
                            {% set active_count = active_count + 1 %}
                        {% else %}
                            {% set standby_count = standby_count + 1 %}
                        {% endif %}
                    {% else %}
                        {% set stopped_count = stopped_count + 1 %}
                    {% endif %}
                {% endfor %}
                
                Total instances: {{ instances|length }} | 
                Running: {{ active_count }} | 
                Ready: {{ standby_count }} | 
                Stopped: {{ stopped_count }}
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
                        <div id="dir-input" class="input-container">
                            <p>Enter project ID or directory path</p>
                        </div>
                        <input type="text" id="project_dir" name="project_dir" class="form-control" required>
                        <p class="modal-note">For IDs, we'll search for matching projects in proposals and current projects folders</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="prompt_path">Prompt File Path or Direct Text:</label>
                        <div class="autocomplete-container" style="margin-bottom: 10px;">
                            <input type="text" id="add_prompt_file_path" class="form-control" placeholder="Type to search prompt files..." autocomplete="off">
                        </div>
                        <div id="file-input" class="input-container">
                            <p>Enter prompt file path or text directly</p>
                        </div>
                        <input type="text" id="prompt_path" name="prompt_path" class="form-control" required>
                        <p class="modal-note">If this isn't a valid file path, it will be treated as prompt text</p>
                    </div>
                    
                    <div class="checkbox-container">
                        <input type="checkbox" id="open_window" name="open_window">
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
        
        <!-- Send Prompt Modal -->
        <div id="send-prompt-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Send Prompt to Instance</h3>
                </div>
                <form id="send-prompt-form" onsubmit="event.preventDefault(); sendPrompt();">
                    <input type="hidden" id="prompt-instance-id" name="instance_id" value="">
                    
                    <div class="form-group">
                        <label class="form-label" for="prompt_file_path">Prompt File Path (Optional):</label>
                        <div class="autocomplete-container" style="margin-bottom: 10px;">
                            <input type="text" id="prompt_file_path" class="form-control" placeholder="Type to search prompt files..." autocomplete="off">
                        </div>
                        <div id="prompt-file-input" class="input-container">
                            <p>Enter prompt text directly below</p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="prompt_text">Prompt Text:</label>
                        <textarea id="prompt_text" name="prompt_text" class="form-control" rows="8" style="resize: vertical;"></textarea>
                        <p class="modal-note">Enter prompt text directly or load from a file using the field above</p>
                    </div>
                    
                    <div class="checkbox-container">
                        <input type="checkbox" id="submit_prompt" name="submit_prompt" checked>
                        <label for="submit_prompt">Submit prompt (press Enter after sending)</label>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-gray" onclick="closeSendPromptModal()">Cancel</button>
                        <button type="submit" class="btn btn-blue">Send Prompt</button>
                    </div>
                </form>
            </div>
        </div>
        <!-- Settings Modal -->
        <div id="settings-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Settings</h3>
                </div>

                <div class="tabs">
                    <button class="tab active" onclick="openTab(event, 'general-settings')">General</button>
                    <button class="tab" onclick="openTab(event, 'interruption-settings')">Auto Interruption</button>
                </div>

                <div id="general-settings" class="tab-content active">
                    <h4 style="margin-bottom: 1rem; color: var(--text-primary);">General Settings</h4>
                    
                    <div class="form-group">
                        <label class="form-label" for="refresh-interval">Dashboard Auto-Refresh Interval (seconds)</label>
                        <input type="number" id="refresh-interval" class="form-control" min="1" max="60" value="3">
                        <p class="modal-note">How often the dashboard automatically refreshes (1-60 seconds)</p>
                    </div>
                </div>
                
                <div id="interruption-settings" class="tab-content">
                    <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Auto Interruption Settings</h4>
                    
                    <div class="form-group">
                        <label class="form-label" for="max-active-time">Max Active Time Before Action (minutes)</label>
                        <input type="number" id="max-active-time" class="form-control" min="0" max="240" value="240">
                        <p class="modal-note">Maximum time Claude can be continuously generating before taking action (0 = disabled)</p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="timeout-action">Action After Timeout</label>
                        <select id="timeout-action" class="form-control">
                            <option value="interrupt">Interrupt (send ESC)</option>
                            <option value="stop">Stop instance</option>
                            <option value="delete">Delete instance</option>
                        </select>
                        <p class="modal-note">What action to take when an instance exceeds the max active time</p>
                    </div>
                    
                    <div class="checkbox-container" style="margin-top: 1rem;">
                        <input type="checkbox" id="interrupt-active-enabled">
                        <label for="interrupt-active-enabled">Enable timeout actions for active generations</label>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-gray" onclick="closeSettingsModal()">Cancel</button>
                    <button type="button" class="btn btn-green" onclick="saveSettings()">Save Settings</button>
                </div>
            </div>
        </div>

        <!-- Toast notification -->
        <div id="toast"></div>
    </div>
    
    <script>
        // App settings
        let appSettings = {
            refreshInterval: 3, // seconds
            maxActiveTime: 0, // minutes (0 = disabled)
            interruptActiveEnabled: false, // disabled by default
            timeoutAction: 'interrupt', // interrupt, stop, or delete
        };
        
        // Track instance states to detect changes
        let instanceStates = {};
        
        // Selection state that will be persisted
        let selectedInstanceId = null;
        let selectedRuntimeType = null;
        let selectedInstances = new Set();
        let multiSelectEnabled = true; // Always enabled, no UI toggle needed
        let currentSortColumn = null;
        let sortDirection = 'asc';
        
        // Function to save selection state to localStorage
        function saveSelectionState() {
            try {
                const selectionState = {
                    selectedInstanceId,
                    selectedRuntimeType,
                    selectedInstances: Array.from(selectedInstances),
                    multiSelectEnabled,
                    currentSortColumn,
                    sortDirection
                };
                localStorage.setItem('claudeManagerSelectionState', JSON.stringify(selectionState));
                console.log('Saved selection state to localStorage:', selectionState);
            } catch (e) {
                console.error('Failed to save selection state to localStorage:', e);
            }
        }
        
        // Function to load selection state from localStorage
        function loadSelectionState() {
            try {
                const savedState = localStorage.getItem('claudeManagerSelectionState');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    console.log('Loaded selection state from localStorage:', state);
                    
                    // Restore simple values
                    selectedInstanceId = state.selectedInstanceId;
                    selectedRuntimeType = state.selectedRuntimeType;
                    multiSelectEnabled = state.multiSelectEnabled;
                    currentSortColumn = state.currentSortColumn;
                    sortDirection = state.sortDirection;
                    
                    // Restore selected instances set
                    selectedInstances = new Set(state.selectedInstances || []);
                    
                    // Update checkbox state
                    const multiSelectCheckbox = document.getElementById('multi-select');
                    if (multiSelectCheckbox) {
                        multiSelectCheckbox.checked = multiSelectEnabled;
                    }
                    
                    // Call toggleMultiSelect to update UI based on checkbox
                    toggleMultiSelect();
                    
                    // If we have a sort column, sort the table
                    if (currentSortColumn) {
                        setTimeout(() => {
                            sortInstances(currentSortColumn, sortDirection);
                        }, 100);
                    }
                    
                    return true;
                }
            } catch (e) {
                console.error('Failed to load selection state from localStorage:', e);
            }
            return false;
        }
        
        // Try to load settings from localStorage
        try {
            const savedSettings = localStorage.getItem('claudeManagerSettings');
            if (savedSettings) {
                appSettings = {...appSettings, ...JSON.parse(savedSettings)};
                console.log('Loaded settings from localStorage:', appSettings);
            }
        } catch (e) {
            console.error('Failed to load settings from localStorage:', e);
        }
        
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
        
        // Multi-select mode is now always enabled by default, so these functions are removed
        
        
        // DEBUG: Add a global variable to track control key state for debugging
        window.controlKeyState = {
            bodyHasClass: false,
            keyDown: false,
            eventCtrl: false
        };
        
        // Update debug info
        function updateControlDebug(source, ctrlKey, metaKey, bodyClass) {
            window.controlKeyState = {
                bodyHasClass: bodyClass,
                keyDown: window.controlKeyState.keyDown,
                eventCtrl: ctrlKey || metaKey
            };
            console.log(`[${source}] Control state:`, 
                `ctrlKey=${ctrlKey}`, 
                `metaKey=${metaKey}`, 
                `bodyClass=${bodyClass}`,
                `time=${new Date().toISOString().substr(11, 12)}`);
        }
        
        // Prevent default behavior for control key to avoid Chrome's context menu
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                console.log("KEYDOWN: Control key pressed!", e.type, e.ctrlKey, e.metaKey);
                document.body.classList.add('ctrl-pressed');
                window.controlKeyState.keyDown = true;
                updateControlDebug('keydown', e.ctrlKey, e.metaKey, document.body.classList.contains('ctrl-pressed'));
            }
        }, true);
        
        document.addEventListener('keyup', function(e) {
            if (e.key === 'Control' || e.key === 'Meta') {
                console.log("KEYUP: Control key released!", e.type, e.key);
                document.body.classList.remove('ctrl-pressed');
                window.controlKeyState.keyDown = false;
                updateControlDebug('keyup', false, false, document.body.classList.contains('ctrl-pressed'));
            }
        }, true);
        
        // DEBUG: Add mousedown event to catch control+click more reliably
        document.addEventListener('mousedown', function(e) {
            console.log("MOUSEDOWN:", e.type, "ctrlKey:", e.ctrlKey, "metaKey:", e.metaKey);
            if (e.ctrlKey || e.metaKey) {
                console.log("MOUSEDOWN with Control/Meta key!");
                document.body.classList.add('ctrl-pressed');
                updateControlDebug('mousedown', e.ctrlKey, e.metaKey, document.body.classList.contains('ctrl-pressed'));
            }
        }, true);
        
        // Prevent context menu on table rows when we're in selection mode
        document.querySelector('#instance-table tbody').addEventListener('contextmenu', function(e) {
            console.log("CONTEXT MENU:", "ctrl-pressed class =", document.body.classList.contains('ctrl-pressed'));
            if (document.body.classList.contains('ctrl-pressed')) {
                e.preventDefault();
                return false;
            }
        }, true);
        
        // Force update control key status when clicking with control
        document.addEventListener('click', function(e) {
            console.log("CLICK EVENT:", e.type, "ctrlKey:", e.ctrlKey, "metaKey:", e.metaKey, 
                       "bodyClass:", document.body.classList.contains('ctrl-pressed'));
            
            if (e.ctrlKey || e.metaKey) {
                console.log("CLICK with Control key detected! Adding ctrl-pressed class");
                document.body.classList.add('ctrl-pressed');
                updateControlDebug('click', e.ctrlKey, e.metaKey, document.body.classList.contains('ctrl-pressed'));
                
                // Remove the class after a short delay to prevent state issues
                setTimeout(function() {
                    if (!e.ctrlKey && !e.metaKey) {
                        document.body.classList.remove('ctrl-pressed');
                        updateControlDebug('click-timeout', false, false, document.body.classList.contains('ctrl-pressed'));
                    }
                }, 200);
            }
        }, true);
        
        // Select a row in the table
        document.addEventListener('click', function(e) {
            // Skip if clicking on action buttons to prevent double selection
            if (e.target.closest('.row-action-btn')) {
                return;
            }
            
            const row = e.target.closest('tr');
            if (row && row.parentNode.tagName === 'TBODY') {
                const instanceId = row.dataset.id;
                const runtimeType = row.dataset.runtime;
                
                // DEBUG: Log selection info
                console.log("ROW SELECTION:", 
                    "e.ctrlKey =", e.ctrlKey, 
                    "e.metaKey =", e.metaKey, 
                    "bodyClass =", document.body.classList.contains('ctrl-pressed'),
                    "for row ID:", instanceId);
                
                // Get the control key state from multiple sources to be extra sure
                const ctrlKey = e.ctrlKey;
                const metaKey = e.metaKey;
                const bodyHasClass = document.body.classList.contains('ctrl-pressed');
                const globalKeyDown = window.controlKeyState?.keyDown || false;
                
                // Try every possible way to detect the control key
                const ctrlPressed = ctrlKey || metaKey || bodyHasClass || globalKeyDown;
                
                // Check which selection mode to use based on modifier keys
                if ((ctrlPressed) && !e.shiftKey) {
                    // Control key pressed: Toggle selection of this row
                    console.log("🎯 CONTROL+CLICK - toggling selection for row", instanceId);
                    
                    if (selectedInstances.has(instanceId)) {
                        // Deselect if already selected
                        selectedInstances.delete(instanceId);
                        row.classList.remove('selected');
                    } else {
                        // Select if not already selected
                        selectedInstances.add(instanceId);
                        row.classList.add('selected');
                    }
                } 
                else if (e.shiftKey && selectedInstanceId) {
                    // Shift key pressed: Select a range of rows
                    console.log("SHIFT+CLICK - selecting range");
                    
                    const rows = Array.from(document.querySelectorAll('tbody tr'));
                    const visibleRows = rows.filter(r => r.style.display !== 'none');
                    
                    // Find indices of the previously selected row and current row
                    const lastSelectedIndex = visibleRows.findIndex(r => r.dataset.id === selectedInstanceId);
                    const currentIndex = visibleRows.findIndex(r => r.dataset.id === instanceId);
                    
                    if (lastSelectedIndex > -1 && currentIndex > -1) {
                        // Determine start and end indices for the range
                        const startIdx = Math.min(lastSelectedIndex, currentIndex);
                        const endIdx = Math.max(lastSelectedIndex, currentIndex);
                        
                        // Clear previous selections unless Ctrl/Cmd is also pressed
                        if (!ctrlPressed) {
                            selectedInstances.clear();
                            rows.forEach(r => r.classList.remove('selected'));
                        }
                        
                        // Select all rows in the range
                        for (let i = startIdx; i <= endIdx; i++) {
                            const rowInRange = visibleRows[i];
                            rowInRange.classList.add('selected');
                            selectedInstances.add(rowInRange.dataset.id);
                        }
                    }
                } 
                else {
                    // Regular click (no modifier keys): Single selection
                    console.log("REGULAR CLICK - selecting single row");
                    
                    // Clear all current selections
                    document.querySelectorAll('tbody tr').forEach(r => {
                        r.classList.remove('selected');
                    });
                    selectedInstances.clear();
                    
                    // Select only this row
                    row.classList.add('selected');
                    selectedInstances.add(instanceId);
                }
                
                // Always update the last selected ID
                selectedInstanceId = instanceId;
                selectedRuntimeType = runtimeType;
                
                console.log(`Selected instance: ${instanceId}, Runtime: ${runtimeType}, Total selected: ${selectedInstances.size}`);
                
                // Save selection state after any click selection
                saveSelectionState();
            }
        });
        
        // Additional event listener for mousedown to prevent text selection
        // and handle ctrl+click more reliably
        document.addEventListener('mousedown', function(e) {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
                const row = e.target.closest('tr');
                if (row && row.parentNode.tagName === 'TBODY') {
                    // Prevent text selection when using modifier keys
                    e.preventDefault();
                    
                    // DIRECT HANDLING: For Ctrl+click, immediately handle the row selection
                    // right at mousedown time, which may be more reliable than waiting for click
                    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
                        console.log("🔴 DIRECT MOUSEDOWN CONTROL+CLICK HANDLING for row", row.dataset.id);
                        
                        // Toggle selection directly here
                        const instanceId = row.dataset.id;
                        if (selectedInstances.has(instanceId)) {
                            console.log("Directly removing instance from selection:", instanceId);
                            selectedInstances.delete(instanceId);
                            row.classList.remove('selected');
                        } else {
                            console.log("Directly adding instance to selection:", instanceId);
                            selectedInstances.add(instanceId);
                            row.classList.add('selected');
                        }
                        
                        // Store the selected instance ID (just like in the click handler)
                        selectedInstanceId = instanceId;
                        selectedRuntimeType = row.dataset.runtime;
                        
                        // Save selection state
                        saveSelectionState();
                        
                        // Stop propagation to prevent the click event from also handling this
                        e.stopPropagation();
                    }
                }
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
        
        // Functions for row action buttons
        function viewTerminalForRow(instanceId) {
            // Set this instance as selected
            selectedInstanceId = instanceId;
            const row = document.querySelector(`tr[data-id="${instanceId}"]`);
            if (row) {
                selectedRuntimeType = row.dataset.runtime;
                
                // Visually select the row
                document.querySelectorAll('tbody tr').forEach(r => {
                    r.classList.remove('selected');
                });
                row.classList.add('selected');
                
                // Open the terminal window
                viewTerminal();
            }
        }
        
        
        function stopInstanceForRow(instanceId) {
            // Set this instance as selected
            selectedInstanceId = instanceId;
            const row = document.querySelector(`tr[data-id="${instanceId}"]`);
            if (row) {
                selectedRuntimeType = row.dataset.runtime;
                
                // Visually select the row
                document.querySelectorAll('tbody tr').forEach(r => {
                    r.classList.remove('selected');
                });
                row.classList.add('selected');
                
                // Stop the instance
                stopInstance();
            }
        }
        
        function deleteInstanceForRow(instanceId) {
            // Set this instance as selected
            selectedInstanceId = instanceId;
            const row = document.querySelector(`tr[data-id="${instanceId}"]`);
            if (row) {
                selectedRuntimeType = row.dataset.runtime;
                
                // Visually select the row
                document.querySelectorAll('tbody tr').forEach(r => {
                    r.classList.remove('selected');
                });
                row.classList.add('selected');
                
                // Delete the instance
                deleteSelected();
            }
        }
        
        // Create a new instance with the entered prompt
        function smartSubmitAction() {
            // Get form values
            const projectDir = document.getElementById('quick-project-dir').value;
            const promptPath = document.getElementById('quick-prompt-path').value;
            const useTmux = document.getElementById('quick-use-tmux').checked;
            const openWindow = document.getElementById('quick-open-window').checked;
            
            // Validate inputs
            if (!promptPath) {
                showToast('Please enter a prompt', true);
                return;
            }
            
            if (!projectDir) {
                showToast('Please enter a project directory', true);
                return;
            }
            
            // Always create a new instance regardless of whether an instance is selected
            createNewInstance(projectDir, promptPath, useTmux, openWindow);
        }
        
        
        // Function to create a new instance
        function createNewInstance(projectDir, promptPath, useTmux, openWindow) {
            // Create form data
            const formData = new FormData();
            formData.append('project_dir', projectDir);
            formData.append('prompt_path', promptPath);
            formData.append('runtime_type', useTmux ? 'tmux' : 'terminal');
            
            // Only add open_window if it's checked
            if (openWindow) {
                formData.append('open_window', 'on');
            }
            
            // Send request
            fetch('/add', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    // Clear the prompt field but keep the project dir for easy reuse
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
            // Trim whitespace
            cleaned = cleaned.trim();
            // Remove trailing slashes (similar to os.path.normpath in Python)
            while (cleaned.endsWith('/') && cleaned.length > 1) {
                cleaned = cleaned.slice(0, -1);
            }
            return cleaned;
        }
        
        // Input element setup
        document.addEventListener('DOMContentLoaded', function() {
            const dirInput = document.getElementById('project_dir');
            const fileInput = document.getElementById('prompt_path');
            const promptTextArea = document.getElementById('prompt_text');
            
            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
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
            // We no longer need to save ready state times since we're using consistent state tracking
            // that persists across refreshes
            
            // Add a class to the body during refresh to control styling during refresh
            document.body.classList.add('refreshing');
            
            // 🔒 CRITICAL FIX: Save selection state BEFORE refreshing
            const selectedRows = [];
            document.querySelectorAll('tbody tr.selected').forEach(row => {
                selectedRows.push(row.dataset.id);
            });
            console.log("🔒 PRE-REFRESH: Saving selection state for", selectedRows.length, "rows:", selectedRows);
            
            // Save scroll positions of response containers
            const scrollPositions = {};
            document.querySelectorAll('tbody tr').forEach(row => {
                const id = row.dataset.id;
                const responseContainer = row.querySelector('td:last-child div.response-container');
                if (responseContainer && responseContainer.scrollHeight > responseContainer.clientHeight) {
                    scrollPositions[id] = {
                        scrollTop: responseContainer.scrollTop,
                        scrollLeft: responseContainer.scrollLeft
                    };
                }
            });
            console.log("Saved scroll positions for response containers:", Object.keys(scrollPositions).length);
            
            fetch('/refresh')
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // Instead of replacing the entire table content, update only what's changed
                    // Get all rows from both the current table and the new table
                    const currentRows = document.querySelectorAll('#instance-list tr');
                    const newRows = doc.querySelectorAll('#instance-list tr');
                    
                    // Create a map of current row elements by ID
                    const currentRowsMap = {};
                    currentRows.forEach(row => {
                        if (row.dataset.id) {
                            currentRowsMap[row.dataset.id] = row;
                        }
                    });
                    
                    // First pass: Update existing rows in place without replacing response cells
                    // that haven't changed, to avoid text glitching
                    let instanceListUpdated = false;
                    
                    newRows.forEach(newRow => {
                        const rowId = newRow.dataset.id;
                        if (rowId && currentRowsMap[rowId]) {
                            // This row exists in both tables
                            const currentRow = currentRowsMap[rowId];
                            
                            // Get all cells except the last one (response column)
                            const currentCells = Array.from(currentRow.querySelectorAll('td:not(:last-child)'));
                            const newCells = Array.from(newRow.querySelectorAll('td:not(:last-child)'));
                            
                            // Update all cells except the response column
                            for (let i = 0; i < Math.min(currentCells.length, newCells.length); i++) {
                                // Only update if content has changed
                                if (currentCells[i].innerHTML !== newCells[i].innerHTML) {
                                    currentCells[i].innerHTML = newCells[i].innerHTML;
                                    instanceListUpdated = true;
                                }
                            }
                            
                            // For the response column, only update if the instance is no longer running or the content has changed
                            const currentResponseCell = currentRow.querySelector('td:last-child');
                            const newResponseCell = newRow.querySelector('td:last-child');
                            
                            if (currentResponseCell && newResponseCell) {
                                // Check if we have a generating indicator in the current cell
                                const currentGeneratingIndicator = currentResponseCell.querySelector('.generating-indicator');
                                
                                // Check if we have a preview in the current cell
                                const currentPreview = currentResponseCell.querySelector('.response-preview');
                                
                                // Check if we have a generating indicator in the new cell
                                const newGeneratingIndicator = newResponseCell.querySelector('.generating-indicator');
                                
                                // Check if we have a preview in the new cell
                                const newPreview = newResponseCell.querySelector('.response-preview');
                                
                                // Case 1: Status changed from generating to ready (showing preview)
                                if (currentGeneratingIndicator && newPreview) {
                                    console.log(`Instance ${rowId} changed from generating to ready with preview`);
                                    currentResponseCell.innerHTML = newResponseCell.innerHTML;
                                    instanceListUpdated = true;
                                }
                                // Case 2: Status changed from ready to generating
                                else if (currentPreview && newGeneratingIndicator) {
                                    console.log(`Instance ${rowId} changed from ready to generating`);
                                    currentResponseCell.innerHTML = newResponseCell.innerHTML;
                                    instanceListUpdated = true;
                                }
                                // Case 3: Response content changed while staying in ready state
                                else if (currentPreview && newPreview && 
                                         currentPreview.innerHTML !== newPreview.innerHTML) {
                                    console.log(`Instance ${rowId} got updated response content`);
                                    
                                    // Only update the preview-text span to preserve the button
                                    const currentPreviewText = currentPreview.querySelector('.preview-text');
                                    const newPreviewText = newPreview.querySelector('.preview-text');
                                    
                                    if (currentPreviewText && newPreviewText) {
                                        // Update the text content
                                        currentPreviewText.innerHTML = newPreviewText.innerHTML;
                                        
                                        // Also update the data attribute of the expand button
                                        const currentExpandBtn = currentPreview.querySelector('.expand-btn');
                                        const newExpandBtn = newPreview.querySelector('.expand-btn');
                                        
                                        if (currentExpandBtn && newExpandBtn) {
                                            // Update the data attribute containing the full response
                                            const newResponseContent = newExpandBtn.getAttribute('data-full-content');
                                            if (newResponseContent) {
                                                currentExpandBtn.setAttribute('data-full-content', newResponseContent);
                                                
                                                // Also ensure the onclick attribute uses the updated data
                                                currentExpandBtn.setAttribute('onclick', 
                                                    `showResponsePopup(event, '${rowId}', this.getAttribute('data-full-content'))`);
                                            }
                                            
                                            console.log(`Updated response text content for ${rowId}`);
                                        }
                                    } else {
                                        // Fallback to replacing the entire cell if we can't find the elements
                                        console.log(`Fallback: replacing entire response cell for ${rowId}`);
                                        currentResponseCell.innerHTML = newResponseCell.innerHTML;
                                    }
                                    
                                    instanceListUpdated = true;
                                }
                                // Case 4: Any other state change
                                else if (currentResponseCell.innerHTML !== newResponseCell.innerHTML &&
                                        !currentResponseCell.querySelector('.response-container')) {
                                    console.log(`Instance ${rowId} other content change`);
                                    currentResponseCell.innerHTML = newResponseCell.innerHTML;
                                    instanceListUpdated = true;
                                }
                            }
                            
                            // Remove the row from the map to track which ones have been processed
                            delete currentRowsMap[rowId];
                        } else {
                            // This is a new row - it will be added in the second pass
                            instanceListUpdated = true;
                        }
                    });
                    
                    // If nothing was updated in the first pass, and we don't have new or removed rows,
                    // skip the second pass to avoid unnecessary DOM operations
                    if (!instanceListUpdated && Object.keys(currentRowsMap).length === 0) {
                        console.log("No changes detected in instance list, skipping DOM update");
                    } else {
                        // Second pass: Full update of the table content
                        // Only do this if we detected changes or have new/removed rows
                        document.getElementById('instance-list').innerHTML = doc.getElementById('instance-list').innerHTML;
                    }
                    
                    // 🔑 DIRECT FIX: Immediately re-apply selections to maintain multi-select
                    console.log("🔑 POST-REFRESH: Restoring", selectedRows.length, "selections");
                    selectedRows.forEach(id => {
                        const row = document.querySelector(`tr[data-id="${id}"]`);
                        if (row) {
                            row.classList.add('selected');
                            console.log(`✅ Restored selection for row ${id}`);
                            // Also ensure it's in the selectedInstances set
                            selectedInstances.add(id);
                        } else {
                            console.log(`❌ Row ${id} no longer exists in DOM after refresh`);
                        }
                    });
                    
                    // Update status bar
                    document.getElementById('status-bar').innerHTML = doc.getElementById('status-bar').innerHTML;
                    
                    // Get all current visible rows after refresh
                    const currentIds = new Set();
                    document.querySelectorAll('tr[data-id]').forEach(row => {
                        currentIds.add(row.dataset.id);
                    });
                    
                    // Restore scroll positions for response containers - this needs to happen
                    // regardless of whether we did a full update or incremental update
                    setTimeout(() => {
                        for (const id in scrollPositions) {
                            const row = document.querySelector(`tr[data-id="${id}"]`);
                            if (row) {
                                const responseContainer = row.querySelector('td:last-child div.response-container');
                                if (responseContainer) {
                                    responseContainer.scrollTop = scrollPositions[id].scrollTop;
                                    responseContainer.scrollLeft = scrollPositions[id].scrollLeft;
                                }
                            }
                        }
                        console.log("Restored scroll positions for response containers");
                        
                        // Remove the refreshing class to complete the refresh
                        document.body.classList.remove('refreshing');
                        
                        // Make sure scrollbars are properly restored
                        setTimeout(() => {
                            // First restore overflow property to enable scrollbars
                            document.querySelectorAll('.response-container').forEach(container => {
                                // Force a reflow to ensure scrollbars are shown if needed
                                container.style.overflow = '';
                                void container.offsetHeight; // Trigger reflow
                                
                                // Find the container's ID and restore properties if we have them
                                const instanceId = container.getAttribute('data-instance-id');
                                if (instanceId && visibleContainers[instanceId]) {
                                    // Restore saved properties
                                    const savedProps = visibleContainers[instanceId];
                                    container.scrollTop = savedProps.scrollTop;
                                    container.scrollLeft = savedProps.scrollLeft;
                                }
                            });
                        }, 20);
                    }, 50);
                    
                    // Remove any tracked instances that no longer exist
                    Object.keys(instanceStates).forEach(id => {
                        if (!currentIds.has(id)) {
                            console.log(`Instance ${id} is no longer in the table, removing from tracking`);
                            delete instanceStates[id];
                        }
                    });
                    
                    // Multi-select is always enabled now, so no need to check or set it
                    
                    // Keep selectedInstanceId updated (use first selected row if available)
                    if (selectedInstances.size > 0) {
                        const firstSelectedId = Array.from(selectedInstances)[0];
                        const rowExists = document.querySelector(`tr[data-id="${firstSelectedId}"]`);
                        if (rowExists) {
                            selectedInstanceId = firstSelectedId;
                            selectedRuntimeType = rowExists.dataset.runtime;
                        } else {
                            // If first row disappeared, use another
                            const existingSelectedIds = Array.from(selectedInstances)
                                .filter(id => document.querySelector(`tr[data-id="${id}"]`));
                            
                            if (existingSelectedIds.length > 0) {
                                selectedInstanceId = existingSelectedIds[0];
                                const row = document.querySelector(`tr[data-id="${selectedInstanceId}"]`);
                                selectedRuntimeType = row ? row.dataset.runtime : null;
                            } else {
                                // No selected rows exist anymore
                                selectedInstanceId = null;
                                selectedRuntimeType = null;
                                selectedInstances.clear();
                            }
                        }
                    }
                    
                    // Run checkForLongGenerations to update time displays consistently
                    setTimeout(checkForLongGenerations, 100);
                    
                    // After restoring selections, find the runtime type if needed
                    if (selectedInstanceId && !selectedRuntimeType) {
                        const row = document.querySelector(`tr[data-id="${selectedInstanceId}"]`);
                        if (row) {
                            selectedRuntimeType = row.dataset.runtime;
                        }
                    }
                    
                    console.log("Selections after restore:", 
                        "selectedInstanceId =", selectedInstanceId,
                        "selectedInstances =", Array.from(selectedInstances));
                    
                    // Save the updated selection state after refresh
                    saveSelectionState();
                })
                .catch(error => {
                    console.error('Error:', error);
                    showToast('Error refreshing data', true);
                });
        }
        
        // Set up autocomplete fields
        document.addEventListener('DOMContentLoaded', function() {
            // Set up autocomplete for quick prompt path
            setupAutocomplete(document.getElementById('quick-prompt-path'), function(selectedFile) {
                document.getElementById('quick-prompt-path').value = selectedFile.path;
            });
            
            // Set up autocomplete for add instance modal
            setupAutocomplete(document.getElementById('add_prompt_file_path'), function(selectedFile) {
                document.getElementById('prompt_path').value = selectedFile.path;
            });
            
            // Set up autocomplete for send prompt modal
            setupAutocomplete(document.getElementById('prompt_file_path'), function(selectedFile) {
                // Load the file content automatically
                loadPromptFileContent(selectedFile.path);
            });
        });
        
        // Function to set up autocomplete on an input element
        function setupAutocomplete(inputElement, onSelectCallback) {
            if (!inputElement) return;
            
            let currentFocus = -1;
            let files = [];
            
            // Function to fetch matching prompt files
            function fetchPromptFiles(searchTerm) {
                fetch('/api/prompt_files?q=' + encodeURIComponent(searchTerm))
                    .then(response => response.json())
                    .then(data => {
                        files = data;
                        showAutocompleteItems(files, searchTerm);
                    })
                    .catch(error => {
                        console.error('Error fetching prompt files:', error);
                    });
            }
            
            // Function to show autocomplete items
            function showAutocompleteItems(files, searchTerm) {
                // Clear existing items
                closeAllLists();
                
                if (!files.length) return;
                
                // Create container for items
                const itemsContainer = document.createElement('div');
                itemsContainer.setAttribute('id', inputElement.id + '-autocomplete-list');
                itemsContainer.setAttribute('class', 'autocomplete-items');
                inputElement.parentNode.appendChild(itemsContainer);
                
                // Add each matching file as an item
                files.forEach(file => {
                    // Create item element
                    const item = document.createElement('div');
                    
                    // Highlight the matching part
                    let displayName = file.name;
                    if (searchTerm) {
                        const startIndex = displayName.toLowerCase().indexOf(searchTerm.toLowerCase());
                        if (startIndex > -1) {
                            const endIndex = startIndex + searchTerm.length;
                            displayName = 
                                displayName.substring(0, startIndex) + 
                                '<span class="highlight">' + 
                                displayName.substring(startIndex, endIndex) + 
                                '</span>' + 
                                displayName.substring(endIndex);
                        }
                    }
                    
                    // Set item content
                    item.innerHTML = displayName;
                    
                    // Add click event
                    item.addEventListener('click', function() {
                        onSelectCallback(file);
                        closeAllLists();
                    });
                    
                    // Add item to container
                    itemsContainer.appendChild(item);
                });
            }
            
            // Function to close all autocomplete lists
            function closeAllLists(excludeElement) {
                const items = document.getElementsByClassName('autocomplete-items');
                for (let i = 0; i < items.length; i++) {
                    if (excludeElement != items[i] && excludeElement != inputElement) {
                        items[i].parentNode.removeChild(items[i]);
                    }
                }
            }
            
            // Input event - fetch files when typing
            inputElement.addEventListener('input', function() {
                const searchTerm = this.value;
                fetchPromptFiles(searchTerm);
            });
            
            // Focus event - show all files when focusing
            inputElement.addEventListener('focus', function() {
                fetchPromptFiles(this.value);
            });
            
            // Keyboard navigation
            inputElement.addEventListener('keydown', function(e) {
                let items = document.getElementById(this.id + '-autocomplete-list');
                if (!items) return;
                
                items = items.getElementsByTagName('div');
                
                if (e.key === 'ArrowDown') {
                    // Down key
                    currentFocus++;
                    addActive(items);
                    e.preventDefault();
                } else if (e.key === 'ArrowUp') {
                    // Up key
                    currentFocus--;
                    addActive(items);
                    e.preventDefault();
                } else if (e.key === 'Enter') {
                    // Enter key
                    e.preventDefault();
                    if (currentFocus > -1 && items) {
                        items[currentFocus].click();
                    }
                }
            });
            
            // Function to highlight the active item
            function addActive(items) {
                if (!items) return;
                
                // Remove active class from all items
                for (let i = 0; i < items.length; i++) {
                    items[i].classList.remove('autocomplete-active');
                }
                
                // Set limits for currentFocus
                if (currentFocus >= items.length) currentFocus = 0;
                if (currentFocus < 0) currentFocus = items.length - 1;
                
                // Add active class to current item
                items[currentFocus].classList.add('autocomplete-active');
            }
            
            // Close lists when clicking elsewhere
            document.addEventListener('click', function(e) {
                closeAllLists(e.target);
            });
        }
        
        // Load prompt file content
        function loadPromptFileContent(filePath) {
            if (!filePath) return;
            
            console.log("Loading prompt file: " + filePath);
            
            fetch('/load_prompt_file?path=' + encodeURIComponent(filePath))
                .then(response => {
                    console.log("Response status: " + response.status);
                    return response.json();
                })
                .then(data => {
                    console.log("Got response data:", data);
                    if (data.success) {
                        document.getElementById('prompt_text').value = data.content;
                        
                        // Also set the prompt_path for the main form if we're in the modal
                        if (document.getElementById('prompt_path')) {
                            document.getElementById('prompt_path').value = filePath;
                        }
                        
                        showToast('Prompt file loaded successfully');
                    } else {
                        showToast('Failed to load prompt file: ' + data.error, true);
                    }
                })
                .catch(error => {
                    console.error('Error loading prompt file:', error);
                    showToast('Error loading prompt file', true);
                });
        }
        
        // Override default behavior - the function is disabled
        function showAllPromptFiles() {
            // Do nothing - deliberately empty
            return false;
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
            
            // Send prompt - Enter key with selected row
            if (e.key === 'Enter' && selectedInstanceId) {
                e.preventDefault();
                showSendPromptModal();
            }
        });
        
        // Filter instances based on search and filter criteria
        function filterInstances() {
            const searchText = document.getElementById('instance-search').value.toLowerCase();
            const statusFilter = document.getElementById('status-filter').value;
            const runtimeFilter = document.getElementById('runtime-filter').value;
            
            const rows = document.querySelectorAll('#instance-table tbody tr');
            
            rows.forEach(row => {
                // Get the status badge text which contains "running", "ready", or "stopped"
                const statusBadge = row.querySelector('td:nth-child(2) .status-badge');
                const statusText = statusBadge ? statusBadge.textContent.trim().toLowerCase() : '';
                
                // Status can be inside different elements, so extract carefully
                let status = '';
                if (statusText.includes('running')) status = 'running';
                else if (statusText.includes('ready')) status = 'ready';
                else if (statusText.includes('stopped')) status = 'stopped';
                else if (statusText.includes('error')) status = 'error';
                
                // Get data for searching
                const directory = row.querySelector('td:nth-child(5)').textContent.toLowerCase().trim();
                const promptFile = row.querySelector('td:nth-child(6)').textContent.toLowerCase().trim();
                const id = row.dataset.id.toLowerCase(); // Get ID from data attribute
                
                // Apply status filter
                const statusMatch = statusFilter === 'all' || status === statusFilter;
                
                // Apply runtime filter - now using data attribute
                const runtime = row.dataset.runtime.toLowerCase();
                const runtimeMatch = runtimeFilter === 'all' || runtime === runtimeFilter;
                
                // Apply search filter - improved to search in all columns
                const timeText = row.querySelector('td:nth-child(3)').textContent.toLowerCase().trim();
                const countText = row.querySelector('td:nth-child(4)').textContent.toLowerCase().trim();
                
                const searchMatch = searchText === '' || 
                    id.includes(searchText) || 
                    directory.includes(searchText) || 
                    promptFile.includes(searchText) ||
                    status.includes(searchText) ||
                    timeText.includes(searchText) ||
                    countText.includes(searchText);
                
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
                    'status': { index: 1, type: 'status' },
                    'active_time': { index: 2, type: 'time' },
                    'yes_count': { index: 3, type: 'number' },
                    'directory': { index: 4, type: 'string' },
                    'prompt_file': { index: 5, type: 'string' }
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
                } else if (colInfo.type === 'status') {
                    // Convert status to numeric order for sorting: running=3, ready=2, stopped=1, error=0
                    const statusText = value.toLowerCase();
                    if (statusText.includes('running')) return 3;
                    if (statusText.includes('ready')) return 2;
                    if (statusText.includes('stopped')) return 1;
                    if (statusText.includes('error')) return 0;
                    return -1; // Unknown status
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
        
        // Send prompt modal functions
        function showSendPromptModal() {
            if (!selectedInstanceId) {
                showToast('Please select an instance to send a prompt to', true);
                return;
            }
            
            // Check if instance is running
            const row = document.querySelector(`tr[data-id="${selectedInstanceId}"]`);
            if (row) {
                const statusCell = row.querySelector('td:nth-child(2)');
                const statusText = statusCell ? statusCell.textContent.trim().toLowerCase() : '';
                
                if (!statusText.includes('running')) {
                    showToast('Selected instance is not running', true);
                    return;
                }
                
                // Set the instance ID in the form
                document.getElementById('prompt-instance-id').value = selectedInstanceId;
                
                // Clear any previous values
                document.getElementById('prompt_file_path').value = '';
                document.getElementById('prompt_text').value = '';
                
                // Display the modal
                document.getElementById('send-prompt-modal').style.display = 'block';
            } else {
                showToast('Failed to find the selected instance row', true);
            }
        }
        
        function closeSendPromptModal() {
            document.getElementById('send-prompt-modal').style.display = 'none';
        }
        
        function sendPrompt() {
            const instanceId = document.getElementById('prompt-instance-id').value;
            const promptText = document.getElementById('prompt_text').value;
            const shouldSubmit = document.getElementById('submit_prompt').checked;
            
            if (!instanceId) {
                showToast('No instance selected', true);
                return;
            }
            
            if (!promptText || promptText.trim() === '') {
                showToast('Please enter prompt text', true);
                return;
            }
            
            // Send the prompt to the instance
            fetch(`/send_prompt/${instanceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: promptText,
                    submit: shouldSubmit
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    closeSendPromptModal();
                    showToast('Prompt sent successfully');
                } else {
                    showToast('Failed to send prompt: ' + data.error, true);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred while sending prompt', true);
            });
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
                    
                    // Use the returned deleted_ids to ensure we only clear what was actually deleted
                    if (data.deleted_ids && data.deleted_ids.length > 0) {
                        // If the currently selected instance was deleted, clear the selection
                        if (selectedInstanceId && data.deleted_ids.includes(selectedInstanceId)) {
                            selectedInstanceId = null;
                            selectedRuntimeType = null;
                        }
                        
                        // Remove any deleted instances from multi-select
                        if (multiSelectEnabled && selectedInstances.size > 0) {
                            data.deleted_ids.forEach(id => {
                                selectedInstances.delete(id);
                            });
                        }
                        
                        // Immediately remove the deleted rows from the table for a faster visual response
                        data.deleted_ids.forEach(id => {
                            const row = document.querySelector(`tr[data-id="${id}"]`);
                            if (row) {
                                row.remove();
                            }
                        });
                    }
                    
                    // Log the deletion status for debugging
                    console.log(`Delete operation completed. Deleted IDs: ${JSON.stringify(data.deleted_ids)}`);
                    console.log(`Remaining IDs: ${JSON.stringify(data.remaining_ids)}`);
                    
                    // Force a complete refresh of instances with sync first
                    manualRefresh();
                    
                    // Show success message after brief delay to ensure UI is updated
                    setTimeout(() => {
                        showToast(`Successfully deleted ${data.deleted_ids ? data.deleted_ids.length : instancesToDelete.length} instance(s)`);
                    }, 500);
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
            
            // Log current selection state for comparison
            console.log("Selection before manual refresh:", 
                "selectedInstanceId =", selectedInstanceId,
                "multiSelectEnabled =", multiSelectEnabled,
                "selectedInstances =", Array.from(selectedInstances));
            
            // Run a full sync first
            fetch('/sync_tmux')
                .then(response => response.json())
                .then(data => {
                    if (data.updated) {
                        showToast(`Synchronized with tmux: Found ${data.count} updates`, false);
                    }
                    
                    // Then refresh the UI
                    refreshInstances();
                    
                    // Add a small delay to ensure everything is updated
                    setTimeout(() => {
                        console.log("Selection after manual refresh:", 
                            "selectedInstanceId =", selectedInstanceId,
                            "multiSelectEnabled =", multiSelectEnabled,
                            "selectedInstances =", Array.from(selectedInstances));
                    }, 300);
                    
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
        
        // Auto refresh with a more robust refresh using configured interval
        function autoRefresh() {
            // 🛑 SUPER SIMPLE DIRECT APPROACH
            // Directly read the selected rows from the DOM before refresh
            const selectedRowIds = [];
            document.querySelectorAll('tbody tr.selected').forEach(row => {
                selectedRowIds.push(row.dataset.id);
            });
            
            // Minimize logging - only log if we have selections
            if (selectedRowIds.length > 0) {
                console.log("💾 Auto-refresh: Saving", selectedRowIds.length, "selected row IDs");
            }
            
            fetch('/sync_tmux')
                .then(response => response.json())
                .then(data => {
                    if (data.updated && data.count > 0) {
                        console.log("Updated instances from tmux sessions: " + data.count);
                    }
                    
                    // The refreshInstances function has been fixed to preserve selections
                    refreshInstances();
                    
                    // After refresh, check for any new instances for tracking
                    setTimeout(() => {
                        // Verify any selections were preserved
                        if (selectedRowIds.length > 0) {
                            const currentSelectedCount = document.querySelectorAll('tbody tr.selected').length;
                            
                            // If we've actually lost selections, force them back
                            if (currentSelectedCount < selectedRowIds.length) {
                                console.log(`⚠️ Lost selections! Should have ${selectedRowIds.length}, but only have ${currentSelectedCount}`);
                                
                                // Multi-select is always enabled now
                                
                                // Force every selected ID to be selected again
                                selectedRowIds.forEach(id => {
                                    const row = document.querySelector(`tr[data-id="${id}"]`);
                                    if (row) {
                                        // Force selection on this row
                                        row.classList.add('selected');
                                        selectedInstances.add(id);
                                    }
                                });
                                
                                console.log("🔄 Selections restored. Now have:", selectedInstances.size);
                            }
                        }
                        
                        // Initialize tracking for any new instances
                        document.querySelectorAll('tr[data-id]').forEach(row => {
                            const instanceId = row.dataset.id;
                            if (!instanceStates[instanceId]) {
                                const statusCell = row.querySelector('td:nth-child(2)');
                                if (statusCell) {
                                    const statusBadge = statusCell.querySelector('.status-badge');
                                    const statusText = statusBadge ? statusBadge.textContent.trim().toLowerCase() : statusCell.textContent.trim().toLowerCase();
                                    
                                    // Initialize tracking for new instance
                                    instanceStates[instanceId] = {
                                        status: statusText,
                                        startTime: Date.now(),
                                        activeSeconds: 0
                                    };
                                }
                            }
                        });
                        
                        // Run a check to update ready state times
                        checkForLongGenerations();
                    }, 100);
                })
                .catch(error => {
                    console.error("Sync error:", error);
                    refreshInstances(); // Still refresh the UI even if sync fails
                });
        }
        
        // Settings modal functions
        function showSettingsModal() {
            // Load current settings into form
            document.getElementById('refresh-interval').value = appSettings.refreshInterval;
            document.getElementById('max-active-time').value = appSettings.maxActiveTime;
            document.getElementById('interrupt-active-enabled').checked = appSettings.interruptActiveEnabled;
            document.getElementById('timeout-action').value = appSettings.timeoutAction || 'interrupt';
            
            // Show the modal
            document.getElementById('settings-modal').style.display = 'block';
        }
        
        function closeSettingsModal() {
            document.getElementById('settings-modal').style.display = 'none';
        }
        
        function saveSettings() {
            // Get values from form
            const refreshInterval = parseInt(document.getElementById('refresh-interval').value);
            const maxActiveTime = parseInt(document.getElementById('max-active-time').value);
            const interruptActiveEnabled = document.getElementById('interrupt-active-enabled').checked;
            const timeoutAction = document.getElementById('timeout-action').value;
            
            // Validate
            if (refreshInterval < 1 || refreshInterval > 60) {
                showToast('Refresh interval must be between 1 and 60 seconds', true);
                return;
            }
            
            if (maxActiveTime < 0 || maxActiveTime > 240) {
                showToast('Max active time must be between 0 and 240 minutes', true);
                return;
            }
            
            // Validate timeout action
            if (!['interrupt', 'stop', 'delete'].includes(timeoutAction)) {
                showToast('Invalid timeout action', true);
                return;
            }
            
            // Update settings
            appSettings.refreshInterval = refreshInterval;
            appSettings.maxActiveTime = maxActiveTime;
            appSettings.interruptActiveEnabled = interruptActiveEnabled;
            appSettings.timeoutAction = timeoutAction;
            
            // Save to localStorage
            try {
                localStorage.setItem('claudeManagerSettings', JSON.stringify(appSettings));
                console.log('Saved settings to localStorage:', appSettings);
            } catch (e) {
                console.error('Failed to save settings to localStorage:', e);
            }
            
            // Update refresh interval if it changed
            clearInterval(autoRefreshIntervalId);
            autoRefreshIntervalId = setInterval(autoRefresh, appSettings.refreshInterval * 1000);
            
            // Close modal
            closeSettingsModal();
            showToast('Settings saved successfully');
        }
        
        function openTab(evt, tabName) {
            // Hide all tab content
            const tabContents = document.getElementsByClassName('tab-content');
            for (let i = 0; i < tabContents.length; i++) {
                tabContents[i].classList.remove('active');
            }
            
            // Remove active class from all tabs
            const tabs = document.getElementsByClassName('tab');
            for (let i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove('active');
            }
            
            // Show the selected tab content and mark the button as active
            document.getElementById(tabName).classList.add('active');
            evt.currentTarget.classList.add('active');
        }
        
        // Function to check state times and take appropriate action
        function checkForLongGenerations() {
            // Bypass the automated interrupts but still update timers
            updateReadyTimes();
            
            // Exit early if interruption is disabled (which is the default now)
            if (!appSettings.interruptActiveEnabled || appSettings.maxActiveTime <= 0) {
                return; // Auto timeout action is disabled
            }
        }
        
        // Function to just update instance ready times without taking any actions
        function updateReadyTimes() {
            const currentTime = Date.now();
            
            // Check each running instance
            const instances = document.querySelectorAll('tr[data-id]');
            instances.forEach(row => {
                const instanceId = row.dataset.id;
                
                // Check instance status
                const statusCell = row.querySelector('td:nth-child(2)');
                const timeCell = row.querySelector('td:nth-child(3)');
                
                if (statusCell && timeCell) {
                    const statusBadge = statusCell.querySelector('.status-badge');
                    const statusText = statusBadge ? statusBadge.textContent.trim().toLowerCase() : statusCell.textContent.trim().toLowerCase();
                    
                    // Initialize instance state if needed
                    if (!instanceStates[instanceId]) {
                        instanceStates[instanceId] = {
                            status: statusText,
                            startTime: currentTime,
                            activeSeconds: 0, 
                            lastUpdated: currentTime,
                            readyStartTime: currentTime // Add ready start time
                        };
                    }
                    
                    // Check for state change
                    if (instanceStates[instanceId].status !== statusText) {
                        console.log(`Instance ${instanceId} state changed from ${instanceStates[instanceId].status} to ${statusText}`);
                        
                        // If changing from running to ready, record the ready start time
                        if (statusText.includes('ready')) {
                            console.log(`Instance ${instanceId} entered ready state, recording readyStartTime`);
                            instanceStates[instanceId].readyStartTime = currentTime;
                        }
                        
                        // Update status but preserve readyStartTime
                        const readyStartTime = instanceStates[instanceId].readyStartTime;
                        instanceStates[instanceId] = {
                            status: statusText,
                            startTime: currentTime,
                            activeSeconds: 0,
                            lastUpdated: currentTime,
                            readyStartTime: statusText.includes('ready') ? currentTime : readyStartTime
                        };
                    }
                    
                    // Calculate elapsed time since the last update
                    const elapsedSinceLastUpdate = currentTime - instanceStates[instanceId].lastUpdated;
                    
                    // Only update the actual elapsed time if it's been at least 1 second
                    if (elapsedSinceLastUpdate >= 1000) {
                        // Update active time for this instance incrementally based on real elapsed time
                        instanceStates[instanceId].activeSeconds += Math.floor(elapsedSinceLastUpdate / 1000);
                        instanceStates[instanceId].lastUpdated = currentTime;
                        
                        // If in ready state, update the time display
                        if (statusText.includes('ready') && !statusText.includes('running') && instanceStates[instanceId].readyStartTime) {
                            const readySeconds = Math.floor((currentTime - instanceStates[instanceId].readyStartTime) / 1000);
                            const readyTimeFormatted = formatSeconds(readySeconds);
                            timeCell.innerHTML = `<span style="color: var(--text-primary);">${readyTimeFormatted}</span>`;
                        }
                    }
                }
            });
        
        // Helper function to format seconds to a readable string
        function formatSeconds(seconds) {
            if (seconds < 60) {
                return `${seconds}s`;
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${minutes}m ${secs}s`;
            } else {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                return `${hours}h ${minutes}m ${secs}s`;
            }
        }
        
        // Function to initialize instance tracking on page load
        function initializeInstanceTracking() {
            // Initialize tracking for all instances
            document.querySelectorAll('tr[data-id]').forEach(row => {
                const instanceId = row.dataset.id;
                const statusCell = row.querySelector('td:nth-child(2)');
                
                if (statusCell) {
                    const statusBadge = statusCell.querySelector('.status-badge');
                    const statusText = statusBadge ? statusBadge.textContent.trim().toLowerCase() : statusCell.textContent.trim().toLowerCase();
                    
                    // Initialize state tracking
                    instanceStates[instanceId] = {
                        status: statusText,
                        startTime: Date.now(),
                        activeSeconds: 0
                    };
                }
            });
            
            // Run initial check to set up ready state times
            checkForLongGenerations();
        }
        
        // Check for control key state on page load
        function checkControlKeyState() {
            document.addEventListener('mousemove', function onFirstMove(e) {
                // Check if control key is pressed (useful when page loads with Ctrl already pressed)
                if (e.ctrlKey || e.metaKey) {
                    document.body.classList.add('ctrl-pressed');
                    console.log("Control key detected during initial mouse move");
                }
                document.removeEventListener('mousemove', onFirstMove); // Only run once
            });
        }
        
        // Run initialization after DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize instance tracking first
            initializeInstanceTracking();
            
            // Load saved selection state from localStorage
            loadSelectionState();
            
            // Check control key state
            checkControlKeyState();
            
            console.log("DOM loaded - initialization complete");
        });
        
        // Also initialize right away in case DOMContentLoaded already fired
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            initializeInstanceTracking();
            loadSelectionState();
            checkControlKeyState();
            console.log("DOM already loaded - initialization complete");
        }
        
        // Response popup function
        function showResponsePopup(event, instanceId, content) {
            event.preventDefault();
            event.stopPropagation();
            
            // Create popup if it doesn't exist yet
            let popup = document.getElementById('response-popup');
            if (!popup) {
                popup = document.createElement('div');
                popup.id = 'response-popup';
                popup.className = 'response-popup';
                
                const popupContent = document.createElement('div');
                popupContent.className = 'response-popup-content';
                
                const closeBtn = document.createElement('button');
                closeBtn.className = 'close-popup';
                closeBtn.innerHTML = '×';
                closeBtn.onclick = closeResponsePopup;
                
                const contentDiv = document.createElement('div');
                contentDiv.id = 'popup-content';
                
                popupContent.appendChild(closeBtn);
                popupContent.appendChild(contentDiv);
                popup.appendChild(popupContent);
                
                // Add click event to close when clicking outside
                popup.addEventListener('click', function(e) {
                    if (e.target === popup) {
                        closeResponsePopup();
                    }
                });
                
                document.body.appendChild(popup);
            }
            
            // Set the content
            const contentDiv = document.getElementById('popup-content');
            
            // Properly decode the HTML entities
            let decodedContent = content.replace(/&lt;/g, '<')
                                        .replace(/&gt;/g, '>')
                                        .replace(/&quot;/g, '"')
                                        .replace(/&#39;/g, "'")
                                        .replace(/&amp;/g, '&');
            
            // Replace spaces with actual line breaks
            decodedContent = decodedContent.replace(/ {2,}/g, '<br>');
            
            // Create a container for the response that ensures line breaks at word boundaries
            const formattedContent = `<div style="white-space: pre-wrap; word-break: break-word; width: 100%;">${decodedContent}</div>`;
            contentDiv.innerHTML = formattedContent;
            
            // Add title with instance ID
            const titleDiv = document.createElement('div');
            titleDiv.className = 'popup-title';
            titleDiv.textContent = `Response from instance ${instanceId}`;
            contentDiv.insertBefore(titleDiv, contentDiv.firstChild);
            
            // Show the popup
            popup.style.display = 'flex';
        }
        
        function closeResponsePopup() {
            const popup = document.getElementById('response-popup');
            if (popup) {
                popup.style.display = 'none';
            }
        }
        
        // Initialize auto-refresh interval with settings
        let autoRefreshIntervalId = setInterval(autoRefresh, appSettings.refreshInterval * 1000);
        
        // Update instance timers every 5 seconds (but don't interrupt)
        setInterval(updateReadyTimes, 5000);
    </script>
</body>
</html>
'''

@app.route('/')
def dashboard():
    """Main dashboard page.
    
    This is the primary entry point to the dashboard UI, which must always
    accurately reflect the state of all tmux sessions. The UI and tmux sessions
    must be perfectly in sync at all times.
    
    Returns:
        str: Rendered HTML template with current instance data
    """
    print("======== DASHBOARD MAIN PAGE: BEGIN ========")
    # Step 1: Reload instances from file first
    print("DASHBOARD STEP 1: Loading instances from disk")
    manager.load_instances()
    
    # Step 2: Run a full synchronization with tmux to ensure perfect sync
    print("DASHBOARD STEP 2: Running complete tmux sync")
    
    # First get the current tmux sessions directly to use as ground truth
    tmux_sessions = []
    try:
        result = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
        if result.returncode == 0:
            for line in result.stdout.strip().split('\n'):
                if ':' in line:
                    session_name = line.split(':')[0].strip()
                    tmux_sessions.append(session_name)
            print(f"Found {len(tmux_sessions)} tmux sessions: {tmux_sessions}")
        else:
            print("No tmux sessions found")
    except Exception as e:
        print(f"Error getting tmux sessions: {e}")
    
    # Run a synchronization to ensure we're showing the latest state
    # This runs both verification and import in one step
    print("Running verification and import of tmux sessions")
    import_count = import_tmux_sessions()
    print(f"Imported/updated {import_count} tmux sessions")
    
    # Step 3: Get fresh instance list with all metadata
    print("DASHBOARD STEP 3: Building final instance list")
    instance_list = manager.list_instances()
    
    # Track statistics
    tmux_running_count = 0
    tmux_ready_count = 0
    tmux_generating_count = 0
    tmux_stopped_count = 0
    
    # Process the instance list to add any additional UI-specific fields
    instances = []
    for instance_dict in instance_list:
        instance_id = instance_dict['id']
        instance_obj = manager.instances.get(instance_id)
        
        if not instance_obj:
            print(f"WARNING: Instance {instance_id} from list_instances not found in manager.instances")
            continue
        
        # Add detailed_status if available
        detailed_status = 'ready'
        if hasattr(instance_obj, 'detailed_status'):
            detailed_status = instance_obj.detailed_status
        instance_dict['detailed_status'] = detailed_status
        
        # Count by status for reporting
        if instance_obj.status == 'stopped':
            tmux_stopped_count += 1
        elif hasattr(instance_obj, 'use_tmux') and instance_obj.use_tmux:
            if instance_obj.status == 'running':
                tmux_running_count += 1
                # Further categorize by detailed status
                if detailed_status == 'running':
                    tmux_generating_count += 1
                else:
                    tmux_ready_count += 1
        
        # Add generation_time if available
        if hasattr(instance_obj, 'generation_time'):
            instance_dict['generation_time'] = instance_obj.generation_time
        
        # Add tmux_content if available - this is used for the response column
        if hasattr(instance_obj, 'tmux_content') and instance_obj.tmux_content:
            # Truncate to avoid huge JSON payloads
            instance_dict['tmux_content'] = instance_obj.tmux_content[:2000]
        
        # Verify tmux session consistency for all running instances
        if (instance_obj.status == 'running' and 
            hasattr(instance_obj, 'use_tmux') and instance_obj.use_tmux and
            hasattr(instance_obj, 'tmux_session_name') and instance_obj.tmux_session_name):
            
            session_exists = instance_obj.tmux_session_name in tmux_sessions
            
            if not session_exists:
                print(f"CRITICAL: Instance {instance_id} status is 'running' but tmux session {instance_obj.tmux_session_name} not found")
                # Fix the inconsistency immediately
                instance_obj.status = 'stopped'
                instance_obj.detailed_status = 'ready'
                instance_dict['status'] = 'stopped'
                instance_dict['detailed_status'] = 'ready'
                tmux_running_count -= 1
                if detailed_status == 'running':
                    tmux_generating_count -= 1
                else:
                    tmux_ready_count -= 1
                tmux_stopped_count += 1
                # Save changes
                manager.save_instances()
        
        instances.append(instance_dict)
    
    # Step 4: Final data preparation
    print("DASHBOARD STEP 4: Final preparation")
    
    # Sort by start time if available (most recent first)
    instances.sort(key=lambda x: manager.instances[x['id']].start_time if x['id'] in manager.instances else 0, reverse=True)
    
    # Get list of prompt files for the dropdown
    prompt_files = get_prompt_files()
    
    # Get current time for display
    current_time = datetime.now().strftime("%H:%M:%S")
    
    # Add current timestamp for time calculations
    current_timestamp = time.time()
    
    # Print statistics
    print(f"DASHBOARD COMPLETE: {len(instances)} total instances")
    print(f"- {tmux_running_count} tmux running instances")
    print(f"- {tmux_generating_count} actively generating")
    print(f"- {tmux_ready_count} in ready state")
    print(f"- {tmux_stopped_count} stopped instances")
    print("======== DASHBOARD MAIN PAGE: COMPLETE ========")
    
    # Render the template with all our data
    return render_template_string(
        DASHBOARD_TEMPLATE, 
        instances=instances,
        current_time=current_time,
        current_timestamp=current_timestamp,
        manager=manager,
        os=os,
        prompt_files=prompt_files
    )

def get_tmux_sessions():
    """Get all existing tmux sessions for Claude.
    
    This is a critical core function for ensuring UI and tmux sessions are always
    perfectly in sync. It gets the raw list of tmux sessions directly from tmux ls.
    
    Returns:
        list: List of dictionaries with session information for all available sessions
    """
    try:
        # Run tmux ls to get all sessions with error handling
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
        
        # Save raw output for debugging
        raw_output = result.stdout.strip()
        print(f"Raw tmux output: {raw_output}")
        
        # Parse the output to extract session names and creation times
        sessions = []
        for line in raw_output.split('\n'):
            # Skip empty lines
            if not line.strip():
                continue
                
            # First extract any session name (anything before the first colon)
            session_match = re.search(r'^([^:]+):', line)
            if not session_match:
                print(f"Warning: Could not extract session name from line: {line}")
                continue
                
            session_name = session_match.group(1).strip()
            print(f"Processing tmux session: {session_name}")
            
            # For any session, first use the full name as the instance ID
            instance_id = session_name
            
            # If session has claude_ prefix, extract the ID part
            if session_name.startswith('claude_'):
                instance_id = session_name[7:]  # Remove 'claude_' prefix
                print(f"Extracted instance ID from claude_ prefix: {instance_id}")
            
            # Store the original line for debugging
            session_info = line
            
            # Extract creation time info from the session line
            creation_timestamp = None
            try:
                # Extract full date pattern from "created" portion of the tmux output
                time_match = re.search(r'created ((?:\w+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+\d+))', line)
                
                # If the full pattern doesn't match, try a generic pattern for relative times
                if not time_match:
                    time_match = re.search(r'created (.+?)(?:\)|\s*$)', line)
                
                if time_match:
                    # Parse the creation time from the tmux output
                    created_str = time_match.group(1)
                    current_time = time.time()
                    
                    # Parse different time formats
                    if "second" in created_str:
                        # Few seconds ago - extract the number
                        seconds_match = re.search(r'(\d+) seconds?', created_str)
                        seconds = int(seconds_match.group(1)) if seconds_match else 5
                        creation_timestamp = current_time - seconds
                        print(f"  Time: {seconds} seconds ago")
                    elif "minute" in created_str:
                        # Few minutes ago - extract the number
                        minutes_match = re.search(r'(\d+) minutes?', created_str)
                        minutes = int(minutes_match.group(1)) if minutes_match else 1
                        creation_timestamp = current_time - (minutes * 60)
                        print(f"  Time: {minutes} minutes ago")
                    elif "hour" in created_str:
                        # Few hours ago - extract the number
                        hours_match = re.search(r'(\d+) hours?', created_str)
                        hours = int(hours_match.group(1)) if hours_match else 1
                        creation_timestamp = current_time - (hours * 3600)
                        print(f"  Time: {hours} hours ago")
                    else:
                        # Try to parse absolute date directly
                        try:
                            # Format: "Day Month DD HH:MM:SS YYYY"
                            creation_time = datetime.strptime(created_str, "%a %b %d %H:%M:%S %Y")
                            creation_timestamp = creation_time.timestamp()
                            print(f"  Time: {creation_time.strftime('%Y-%m-%d %H:%M:%S')}")
                        except Exception as parse_error:
                            # Try alternative formats
                            try:
                                # Use a more tolerant parser
                                parsed_time = time.strptime(created_str, "%a %b %d %H:%M:%S %Y")
                                creation_timestamp = time.mktime(parsed_time)
                                print(f"  Time: {time.strftime('%Y-%m-%d %H:%M:%S', parsed_time)} (alt parser)")
                            except Exception:
                                # Default to recent (5 seconds ago)
                                print(f"  Warning: Using default time for {session_name}")
                                creation_timestamp = current_time - 5
                else:
                    # If no creation time info is found, default to recent
                    creation_timestamp = time.time() - 5
                    print(f"  Warning: No time info found for {session_name}")
            except Exception as e:
                # If time parsing fails, default to recent
                creation_timestamp = time.time() - 5
                print(f"  Error parsing time for {session_name}: {e}")
            
            # Double-check that the session still exists before adding it
            verify_result = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True, check=False
            )
            
            if verify_result.returncode == 0:
                # Session exists, add it to our list
                sessions.append({
                    'session_name': session_name,
                    'instance_id': instance_id,
                    'creation_time': creation_timestamp,
                    'raw_info': session_info
                })
                print(f"  Added session {session_name} to list")
            else:
                print(f"  Warning: Session {session_name} no longer exists, skipping")
        
        # Verify the list against tmux ls again to ensure perfect sync
        # This guarantees that no sessions have been added or removed during processing
        final_check = subprocess.run(
            ["tmux", "ls"], 
            capture_output=True, 
            text=True, 
            check=False
        )
        
        if final_check.returncode == 0:
            final_sessions = []
            for line in final_check.stdout.strip().split('\n'):
                if ':' in line:
                    name = line.split(':')[0].strip()
                    final_sessions.append(name)
            
            # Check for any discrepancies
            session_names = [s['session_name'] for s in sessions]
            
            # Sessions that disappeared during processing
            disappeared = [name for name in session_names if name not in final_sessions]
            # Sessions that appeared during processing
            appeared = [name for name in final_sessions if name not in session_names]
            
            if disappeared or appeared:
                print(f"Warning: Tmux sessions changed during processing!")
                if disappeared:
                    print(f"  Sessions disappeared: {', '.join(disappeared)}")
                    # Remove disappeared sessions from our list
                    sessions = [s for s in sessions if s['session_name'] not in disappeared]
                if appeared:
                    print(f"  Sessions appeared: {', '.join(appeared)}")
                    # We'll handle new sessions on the next refresh
        
        return sessions
    
    except Exception as e:
        print(f"Error getting tmux sessions: {e}")
        return []

def import_tmux_sessions():
    """Import all detected Claude tmux sessions into the task manager.
    
    This function is responsible for syncing the state between tmux sessions
    and the Claude Task Manager. It ensures UI and tmux are always in perfect sync.
    
    It performs the following key tasks:
    1. Gets the actual tmux sessions directly from tmux
    2. Updates existing instances in the manager to match tmux state
    3. Creates new instances for tmux sessions not already tracked
    4. Marks stopped instances that no longer have tmux sessions
    
    Returns:
        int: Count of imported or updated sessions
    """
    # First run direct tmux ls command to see actual sessions
    print("======== TMUX-UI SYNC: Start Import Process ========")
    print("Running direct tmux ls command...")
    
    # Capture the raw tmux session state
    raw_tmux_sessions = []
    try:
        result = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
        if result.returncode == 0:
            raw_output = result.stdout.strip()
            print(f"Raw tmux ls result: {raw_output}")
            
            # Store the raw session names
            for line in raw_output.split('\n'):
                if ':' in line:
                    session_name = line.split(':')[0].strip()
                    raw_tmux_sessions.append(session_name)
        else:
            print("No direct tmux sessions found")
    except Exception as e:
        print(f"Error running direct tmux ls: {e}")
    
    # Get existing tmux sessions through our parser
    tmux_sessions = get_tmux_sessions()
    
    # Double verify that our parser results match the raw results
    parser_session_names = [s['session_name'] for s in tmux_sessions]
    
    # Check for any discrepancies between raw names and parser results
    missing_in_parser = [name for name in raw_tmux_sessions if name not in parser_session_names]
    extra_in_parser = [name for name in parser_session_names if name not in raw_tmux_sessions]
    
    if missing_in_parser:
        print(f"WARNING: {len(missing_in_parser)} sessions in raw tmux ls but missed by parser:")
        print(f"  Missing: {', '.join(missing_in_parser)}")
        
        # Try to recover missing sessions by directly checking them
        for session_name in missing_in_parser:
            # Verify it really exists
            try:
                verify_result = subprocess.run(
                    ["tmux", "has-session", "-t", session_name],
                    capture_output=True, check=False
                )
                
                if verify_result.returncode == 0:
                    # Session exists but was missed - create a minimal entry
                    instance_id = session_name
                    if session_name.startswith('claude_'):
                        instance_id = session_name[7:]  # Remove 'claude_' prefix
                        
                    # Add it with minimal information
                    tmux_sessions.append({
                        'session_name': session_name,
                        'instance_id': instance_id,
                        'creation_time': time.time() - 10,  # Default to 10 seconds ago
                        'raw_info': f"{session_name}: (recovered missing session)",
                        'recovered': True
                    })
                    print(f"  Recovered missing session: {session_name}")
            except Exception as e:
                print(f"  Error verifying missing session {session_name}: {e}")
    
    if extra_in_parser:
        print(f"WARNING: {len(extra_in_parser)} sessions in parser but not in raw tmux ls:")
        print(f"  Extra: {', '.join(extra_in_parser)}")
        
        # Remove the extra sessions from our list
        tmux_sessions = [s for s in tmux_sessions if s['session_name'] not in extra_in_parser]
        print(f"  Removed extra sessions from parser results")
    
    # Final verification of parser sessions - check one-by-one that each exists
    verified_sessions = []
    for session in tmux_sessions:
        session_name = session['session_name']
        try:
            verify_result = subprocess.run(
                ["tmux", "has-session", "-t", session_name],
                capture_output=True, check=False
            )
            
            if verify_result.returncode == 0:
                # Session exists, keep it
                verified_sessions.append(session)
                print(f"Verified session exists: {session_name}")
            else:
                print(f"WARNING: Session {session_name} failed verification, will be excluded")
        except Exception as e:
            print(f"Error verifying session {session_name}: {e}")
    
    # Replace our sessions list with only verified sessions
    tmux_sessions = verified_sessions
    
    print(f"Final verified tmux sessions: {[s['session_name'] for s in tmux_sessions]}")
    
    # Create a set of active session IDs for status checking
    active_session_ids = {session['instance_id'] for session in tmux_sessions}
    active_session_names = {session['session_name'] for session in tmux_sessions}
    
    if not tmux_sessions:
        print("No Claude tmux sessions detected.")
        # Update status of any instances that may have been terminated outside
        update_count = _update_terminated_instances(active_session_ids)
        return 0
    
    print(f"Found {len(tmux_sessions)} verified tmux sessions.")
    
    # Current working directory 
    cwd = os.getcwd()
    
    # Import each session
    imported_count = 0
    for session in tmux_sessions:
        session_name = session['session_name']
        instance_id = session['instance_id']
        
        print(f"Processing session: {session_name}, ID: {instance_id}")
        
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
            from src.claude_task_manager import ClaudeInstance
            
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
    
    # Comprehensive update of instance status based on tmux state
    # This ensures that ANY instance with a tmux_session_name will have its
    # status correctly set based on whether the tmux session exists
    updated_count = 0
    for instance_id, instance in manager.instances.items():
        # Only check instances that use tmux
        if hasattr(instance, 'use_tmux') and instance.use_tmux:
            tmux_session_name = None
            
            # Get the tmux session name
            if hasattr(instance, 'tmux_session_name') and instance.tmux_session_name:
                tmux_session_name = instance.tmux_session_name
            
            if tmux_session_name:
                # Check if this session exists in active sessions
                session_exists = tmux_session_name in active_session_names
                
                # Update status based on session existence
                if session_exists and instance.status != "running":
                    # Session exists but instance isn't running - update to running
                    instance.status = "running"
                    print(f"Updated instance {instance_id} status to 'running' (session exists)")
                    updated_count += 1
                elif not session_exists and instance.status == "running":
                    # Session doesn't exist but instance is running - update to stopped
                    instance.status = "stopped"
                    print(f"Updated instance {instance_id} status to 'stopped' (session gone)")
                    updated_count += 1
    
    # Save the updated instances
    total_changes = imported_count + updated_count
    if total_changes > 0:
        manager.save_instances()
        print(f"Successfully imported/updated {total_changes} tmux sessions.")
    
    print("======== TMUX-UI SYNC: Import Process Complete ========")
    return total_changes

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
    """Synchronize the dashboard with existing tmux sessions using improved methods.
    
    This is the API endpoint that ensures UI and tmux sessions are always in sync.
    It performs both full verification of existing instances and imports any new
    tmux sessions that might have been created outside the manager.
    
    Always returns JSON indicating success and count of updates.
    """
    try:
        # Begin sync process
        print("======== DASHBOARD TMUX SYNC: BEGIN ========")
        
        # First, force reload instances from disk
        manager.load_instances()
        
        # Get the original state - used to determine if any changes were made
        original_instances = {id: instance.status for id, instance in manager.instances.items()}
        original_tmux_count = len([i for i in manager.instances.values() 
                                  if hasattr(i, 'use_tmux') and i.use_tmux and i.status == "running"])
        
        # Step 1: Run the enhanced importer that fully verifies tmux state and UI
        print("SYNC STEP 1: Running enhanced import_tmux_sessions()")
        import_count = import_tmux_sessions()
        
        # Step 2: Verify remaining session content and update detailed status
        print("SYNC STEP 2: Updating content and detailed status")
        content_updates = 0
        
        # Only update content for instances with active tmux sessions
        for instance_id, instance in manager.instances.items():
            if (instance.status == "running" and 
                hasattr(instance, 'use_tmux') and instance.use_tmux and 
                hasattr(instance, 'tmux_session_name') and instance.tmux_session_name):
                
                # First verify session still exists (redundant but crucial)
                try:
                    verify_result = subprocess.run(
                        ["tmux", "has-session", "-t", instance.tmux_session_name],
                        capture_output=True, check=False
                    )
                    
                    if verify_result.returncode != 0:
                        print(f"WARNING: Instance {instance_id} session {instance.tmux_session_name} no longer exists")
                        instance.status = "stopped"
                        instance.detailed_status = "ready"  # Reset detailed status as well
                        content_updates += 1
                        continue  # Skip to next instance
                    
                    # Session exists, capture content
                    capture_result = subprocess.run(
                        ["tmux", "capture-pane", "-p", "-t", instance.tmux_session_name],
                        capture_output=True, text=True, check=False
                    )
                    
                    if capture_result.returncode == 0:
                        output = capture_result.stdout
                        
                        # Store the full tmux output for display in the response column
                        output_changed = False
                        if not hasattr(instance, 'tmux_content'):
                            instance.tmux_content = output
                            output_changed = True
                        elif instance.tmux_content != output:
                            instance.tmux_content = output
                            output_changed = True
                        
                        if output_changed:
                            content_updates += 1
                            print(f"Updated content for instance {instance_id}")
                        
                        # Check for active generation indicators
                        current_time = time.time()
                        is_active = False
                        generation_seconds = None
                        
                        # Check for common Claude generation indicators
                        if '█' in output or '▓' in output or '░' in output or '···' in output:
                            # Mark as active if we found any generation indicators
                            is_active = True
                            print(f"Instance {instance_id}: RUNNING - found generation indicators")
                            
                            # If state changed from ready to running, record the time
                            old_status = getattr(instance, 'detailed_status', 'ready')
                            if old_status != 'running':
                                instance.active_since = current_time
                                print(f"Instance {instance_id}: State changed from {old_status} to running, recording active_since={current_time}")
                                content_updates += 1
                            
                            # Extract the seconds if available
                            seconds_pattern = re.search(r'(\d+)s', output)
                            if seconds_pattern:
                                generation_seconds = seconds_pattern.group(1)
                                print(f"Instance {instance_id}: Generation time: {generation_seconds}s")
                                instance.generation_time = f"{generation_seconds}s"
                                content_updates += 1
                        else:
                            print(f"Instance {instance_id}: READY - no generation indicators found")
                            
                            # If state changed from running to ready, record the time
                            old_status = getattr(instance, 'detailed_status', 'ready')
                            if old_status != 'ready':
                                instance.ready_since = current_time
                                print(f"Instance {instance_id}: State changed from {old_status} to ready, recording ready_since={current_time}")
                                content_updates += 1
                                
                            # Initialize ready_since if it doesn't exist yet
                            if not hasattr(instance, 'ready_since') or instance.ready_since is None:
                                instance.ready_since = current_time
                        
                        # Update detailed status based on generation indicators
                        if is_active:
                            instance.detailed_status = 'running'
                        else:
                            instance.detailed_status = 'ready'
                        
                        # ADDITIONAL FEATURE: Auto-respond to common prompts
                        auto_respond_phrases = [
                            'Do you want to',
                            'Would you like to',
                            'Shall I proceed',
                            'Continue?',
                            'Proceed?',
                            'Press Enter to continue',
                            'Press any key to continue'
                        ]
                        
                        for phrase in auto_respond_phrases:
                            if phrase in output:
                                print(f"Instance {instance_id}: Detected '{phrase}' prompt - sending Enter")
                                try:
                                    # Send an Enter key to automatically confirm
                                    subprocess.run([
                                        "tmux", "send-keys", "-t", instance.tmux_session_name, 
                                        "Enter"
                                    ], check=True)
                                    print(f"Instance {instance_id}: Successfully sent Enter key")
                                    break  # Only respond to the first matching phrase
                                except Exception as e:
                                    print(f"Instance {instance_id}: Error sending Enter key: {e}")
                
                except Exception as e:
                    print(f"Error processing instance {instance_id}: {e}")
        
        # Step 3: Do one final verification of all tmux sessions to ensure perfect sync
        print("SYNC STEP 3: Final verification")
        
        # Get current tmux sessions directly
        final_check = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
        final_tmux_sessions = set()
        
        if final_check.returncode == 0:
            for line in final_check.stdout.strip().split('\n'):
                if ':' in line:
                    session_name = line.split(':')[0].strip()
                    final_tmux_sessions.add(session_name)
        
        # Check that all running instances have existing tmux sessions
        for instance_id, instance in manager.instances.items():
            if (instance.status == "running" and 
                hasattr(instance, 'use_tmux') and instance.use_tmux and
                hasattr(instance, 'tmux_session_name') and instance.tmux_session_name):
                
                if instance.tmux_session_name not in final_tmux_sessions:
                    print(f"CRITICAL: Final check found instance {instance_id} tmux session {instance.tmux_session_name} is gone")
                    instance.status = "stopped"
                    instance.detailed_status = "ready"
                    content_updates += 1
        
        # Save all changes to ensure persistence
        manager.save_instances()
        
        # Calculate total updates
        total_updates = import_count + content_updates
        
        # Compare with original state to detect changes
        changed_instances = 0
        for id, instance in manager.instances.items():
            if id in original_instances and original_instances[id] != instance.status:
                changed_instances += 1
        
        new_tmux_count = len([i for i in manager.instances.values() 
                              if hasattr(i, 'use_tmux') and i.use_tmux and i.status == "running"])
        
        print(f"DASHBOARD TMUX SYNC: Complete with {total_updates} updates")
        print(f"- Imported/updated: {import_count} sessions")
        print(f"- Content changes: {content_updates} instances")
        print(f"- Status changes: {changed_instances} instances")
        print(f"- Tmux sessions: {original_tmux_count} → {new_tmux_count}")
        print("======== DASHBOARD TMUX SYNC: COMPLETE ========")
        
        # Return success response with count of updated instances
        return jsonify({
            "success": True,
            "updated": total_updates > 0,
            "count": total_updates,
            "tmux_count": new_tmux_count,
            "status_changes": changed_instances
        })
        
    except Exception as e:
        print(f"CRITICAL ERROR during tmux sync: {e}")
        # Include error details but still return success=True to avoid breaking the UI
        return jsonify({
            "success": True,  # Keep UI working
            "updated": False,
            "count": 0,
            "error": str(e)
        })

@app.route('/refresh')
def refresh():
    """Refresh instances data for the dashboard UI.
    
    This endpoint is called when the user manually refreshes the dashboard
    or when the automatic refresh occurs. It ensures that the dashboard
    accurately reflects the current state of all tmux sessions.
    
    Returns:
        str: Rendered HTML template with updated instance data
    """
    print("======== DASHBOARD REFRESH: BEGIN ========")
    
    # Step 1: Force reload from disk to get latest state
    print("REFRESH STEP 1: Loading instances from disk")
    manager.load_instances()
    
    # Step 2: Run a full synchronization with tmux
    print("REFRESH STEP 2: Running complete tmux sync")
    # Call the sync_tmux function directly instead of the endpoint
    # This gives us more control and avoids HTTP overhead
    try:
        # Get current tmux sessions
        tmux_before = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
        if tmux_before.returncode == 0:
            tmux_sessions_before = set()
            for line in tmux_before.stdout.strip().split('\n'):
                if ':' in line:
                    session_name = line.split(':')[0].strip()
                    tmux_sessions_before.add(session_name)
            print(f"Current tmux sessions before sync: {len(tmux_sessions_before)}")
        else:
            tmux_sessions_before = set()
            print("No tmux sessions found before sync")
        
        # Force a complete import_tmux_sessions operation to sync everything
        print("Running full import_tmux_sessions to sync all tmux state")
        import_count = import_tmux_sessions()
        print(f"Tmux sync complete: {import_count} updates")
        
        # Verify that all tmux sessions are now properly represented
        tmux_after = subprocess.run(["tmux", "ls"], capture_output=True, text=True, check=False)
        if tmux_after.returncode == 0:
            tmux_sessions_after = set()
            for line in tmux_after.stdout.strip().split('\n'):
                if ':' in line:
                    session_name = line.split(':')[0].strip()
                    tmux_sessions_after.add(session_name)
            print(f"Current tmux sessions after sync: {len(tmux_sessions_after)}")
        else:
            tmux_sessions_after = set()
            print("No tmux sessions found after sync")
        
        # Detect any session changes during the sync process
        if tmux_sessions_before != tmux_sessions_after:
            print("Tmux sessions changed during sync!")
            added = tmux_sessions_after - tmux_sessions_before
            removed = tmux_sessions_before - tmux_sessions_after
            
            if added:
                print(f"New sessions: {', '.join(added)}")
            if removed:
                print(f"Removed sessions: {', '.join(removed)}")
                
            # If sessions were added, run another import to catch them
            if added:
                print("Running additional sync to catch new sessions")
                import_tmux_sessions()
    except Exception as e:
        print(f"Error during tmux sync: {e}")
    
    # Step 3: Save any changes to disk
    print("REFRESH STEP 3: Saving instances to disk")
    manager.save_instances()
    
    # Step 4: Get properly formatted instance list with all UI fields
    print("REFRESH STEP 4: Building instance list for UI")
    # Use list_instances which triggers another verification pass
    instance_list = manager.list_instances()
    
    # Process the instance list to add any additional UI-specific fields
    instances = []
    
    # Track statistics for reporting
    tmux_running_count = 0
    stopped_count = 0
    ready_count = 0
    generating_count = 0
    
    for instance_dict in instance_list:
        instance_id = instance_dict['id']
        instance_obj = manager.instances.get(instance_id)
        
        if not instance_obj:
            print(f"Warning: Instance {instance_id} not found in manager")
            continue
            
        # Add detailed_status if available
        if hasattr(instance_obj, 'detailed_status'):
            instance_dict['detailed_status'] = instance_obj.detailed_status
            if instance_obj.detailed_status == 'running':
                generating_count += 1
            elif instance_obj.detailed_status == 'ready' and instance_obj.status == 'running':
                ready_count += 1
        else:
            instance_dict['detailed_status'] = 'ready'
            if instance_obj.status == 'running':
                ready_count += 1
        
        # Count statuses
        if instance_obj.status == 'stopped':
            stopped_count += 1
        elif hasattr(instance_obj, 'use_tmux') and instance_obj.use_tmux and instance_obj.status == 'running':
            tmux_running_count += 1
            
        # Add generation_time if available
        if hasattr(instance_obj, 'generation_time'):
            instance_dict['generation_time'] = instance_obj.generation_time
        
        # Only include tmux content for tmux-based instances that are running
        tmux_content = None
        if (hasattr(instance_obj, 'use_tmux') and instance_obj.use_tmux and 
            instance_obj.status == 'running' and hasattr(instance_obj, 'tmux_session_name')):
            
            # First check if we have cached content
            if hasattr(instance_obj, 'tmux_content') and instance_obj.tmux_content:
                tmux_content = instance_obj.tmux_content[:2000]  # Truncate to avoid huge payloads
            else:
                # Try to fetch fresh content
                try:
                    # Verify the session exists before trying to capture
                    verify_result = subprocess.run(
                        ["tmux", "has-session", "-t", instance_obj.tmux_session_name],
                        capture_output=True, check=False
                    )
                    
                    if verify_result.returncode == 0:
                        # Session exists, capture content
                        capture_result = subprocess.run(
                            ["tmux", "capture-pane", "-p", "-t", instance_obj.tmux_session_name],
                            capture_output=True, text=True, check=False
                        )
                        
                        if capture_result.returncode == 0:
                            tmux_content = capture_result.stdout[:2000]  # Truncate to avoid huge payloads
                            instance_obj.tmux_content = tmux_content  # Cache the content
                    else:
                        # Session no longer exists
                        print(f"Warning: Tmux session {instance_obj.tmux_session_name} for instance {instance_id} not found")
                        instance_obj.status = "stopped"
                        manager.save_instances()
                except Exception as e:
                    print(f"Error capturing tmux content for {instance_id}: {e}")
        
        # Add tmux content to the dictionary if available
        if tmux_content:
            instance_dict['tmux_content'] = tmux_content
        
        instances.append(instance_dict)
    
    # Sort by start time if available (most recent first)
    instances.sort(key=lambda x: manager.instances[x['id']].start_time if x['id'] in manager.instances else 0, reverse=True)
    
    # Print statistics
    print(f"REFRESH COMPLETE: {len(instances)} total instances")
    print(f"- {tmux_running_count} tmux running instances")
    print(f"- {generating_count} actively generating")
    print(f"- {ready_count} in ready state")
    print(f"- {stopped_count} stopped instances")
    print("======== DASHBOARD REFRESH: COMPLETE ========")
    
    # Get list of prompt files for the dropdown
    prompt_files = get_prompt_files()
    
    # Get current time for display
    current_time = datetime.now().strftime("%H:%M:%S")
    
    # Add current timestamp for time calculations
    current_timestamp = time.time()
    
    # Render the template with all our data
    return render_template_string(
        DASHBOARD_TEMPLATE, 
        instances=instances,
        current_time=current_time,
        current_timestamp=current_timestamp,
        manager=manager,
        os=os,
        prompt_files=prompt_files
    )

@app.route('/api/prompt_files')
def api_prompt_files():
    """Get list of prompt files that match a search term."""
    search_term = request.args.get('q', '').lower()
    prompt_files = get_prompt_files()
    
    # Filter files based on search term
    if search_term:
        filtered_files = []
        for file in prompt_files:
            if search_term in file['name'].lower() or search_term in file['path'].lower():
                filtered_files.append(file)
        return jsonify(filtered_files)
    else:
        return jsonify(prompt_files)

@app.route('/load_prompt_file')
def load_prompt_file():
    """Load a prompt file's content."""
    import os  # Explicitly import os here to fix the reference issue
    
    file_path = request.args.get('path')
    if not file_path:
        return jsonify({"success": False, "error": "No file path provided"})
    
    try:
        if os.path.exists(file_path) and os.path.isfile(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
            return jsonify({"success": True, "content": content})
        else:
            return jsonify({"success": False, "error": f"File not found: {file_path}"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/add', methods=['POST'])
def add_instance():
    """Add a new Claude instance."""
    # Import necessary modules explicitly to avoid reference issues
    import os
    import re
    import tempfile
    import glob
    
    # Sync with tmux sessions first to ensure consistent state
    import_tmux_sessions()
    
    proj_dir = request.form.get('project_dir', '').strip()
    prompt_path = request.form.get('prompt_path', '').strip()
    runtime_type = request.form.get('runtime_type', 'tmux').strip().lower()
    open_window = request.form.get('open_window') == 'on'
    
    print(f"Received form data: proj_dir={proj_dir}, prompt_path={prompt_path}, runtime_type={runtime_type}, open_window={open_window}")
    
    # Parse out parentheses and single quotes
    # Remove parentheses and their content
    proj_dir = re.sub(r'\([^)]*\)', '', proj_dir).strip()
    prompt_path = re.sub(r'\([^)]*\)', '', prompt_path).strip()
    
    # Remove single quotes
    proj_dir = proj_dir.replace("'", "").replace("'", "")
    prompt_path = prompt_path.replace("'", "").replace("'", "")
    
    # Clean up any extra spaces
    proj_dir = proj_dir.strip()
    prompt_path = prompt_path.strip()
    
    print(f"After cleaning: proj_dir={proj_dir}, prompt_path={prompt_path}")
    
    # Normalize paths to match exactly how the task manager will normalize them
    # This ensures consistent comparison for instance reuse
    proj_dir = os.path.normpath(proj_dir)
    
    # Check if project directory is just an ID number
    if re.match(r'^\d+$', proj_dir):
        project_id = proj_dir
        # Get search paths from config
        from src.utils.config import get_search_paths
        search_paths = get_search_paths()
        
        print(f"Searching for project ID {project_id} in configured paths: {search_paths}")
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
            # Format the error message with the search paths to make it more helpful
            paths_str = ", ".join(search_paths)
            return f"Could not find a project directory containing ID: {project_id}\nSearched in: {paths_str}", 400
    
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
    
    try:
        # Start the instance - let the start_instance method handle opening the terminal
        instance_id = manager.start_instance(proj_dir, prompt_path, use_tmux=use_tmux, open_terminal=open_window)
        print(f"Successfully started instance {instance_id}")
        return redirect(url_for('dashboard'))
    except Exception as e:
        print(f"Error starting instance: {e}")
        import traceback
        traceback.print_exc()
        return f"Error starting instance: {str(e)}", 500

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
        # Use the new method in the manager that properly handles deletion
        if instance_id in manager.instances:
            success = manager.delete_instance(instance_id)
            if success:
                deleted_count += 1
                app.logger.info(f"Successfully deleted instance {instance_id}")
            else:
                errors.append(f"Failed to delete instance {instance_id}")
        else:
            errors.append(f"Instance {instance_id} not found")
    
    # Save updated instances to persist the changes
    manager.save_instances()
    
    # Force a reload of instances from file to ensure we have a clean state
    manager.load_instances()
    
    # Return detailed information
    if errors:
        return jsonify({
            "success": True,
            "message": f"Deleted {deleted_count} instances with {len(errors)} errors",
            "deleted_ids": [id for id in instance_ids if id not in manager.instances],
            "remaining_ids": list(manager.instances.keys()),
            "errors": errors
        })
    else:
        return jsonify({
            "success": True,
            "message": f"Successfully deleted {deleted_count} instances from dashboard and system",
            "deleted_ids": instance_ids,
            "remaining_ids": list(manager.instances.keys())
        })

@app.route('/send_prompt/<instance_id>', methods=['POST'])
def send_prompt(instance_id):
    """Send a prompt to a running Claude instance."""
    # Import necessary modules explicitly to avoid reference issues
    import os
    
    # Get the instance
    instance = manager.instances.get(instance_id)
    if not instance:
        return jsonify({"success": False, "error": f"Instance {instance_id} not found"})
    
    # Check if instance is running
    if instance.status != "running":
        return jsonify({"success": False, "error": f"Instance {instance_id} is not running"})
    
    # Get the prompt text and submit flag from the request
    data = request.json
    prompt_text = data.get('prompt', '')
    should_submit = data.get('submit', True)
    
    try:
        print(f"Sending prompt to instance {instance_id}: {prompt_text[:50]}...")
        
        # Check if prompt_text is a file path
        if prompt_text.startswith('/') or prompt_text.startswith('~'):
            # Expand home directory if needed
            if prompt_text.startswith('~'):
                prompt_text = os.path.expanduser(prompt_text)
                
            # Check if the file exists
            if not os.path.exists(prompt_text):
                return jsonify({"success": False, "error": f"File not found: {prompt_text}"})
                
            # Read the file content
            try:
                with open(prompt_text, 'r') as f:
                    file_content = f.read()
                prompt_text = file_content
                print(f"Read file content ({len(file_content)} chars) from {prompt_text}")
            except Exception as e:
                return jsonify({"success": False, "error": f"Error reading file: {e}"})
        
        # Send the prompt to the instance based on its runtime type
        if hasattr(instance, 'use_tmux') and instance.use_tmux and instance.tmux_session_name:
            # For tmux sessions, use tmux send-keys
            session_name = instance.tmux_session_name
            
            # Break the prompt into manageable chunks to avoid issues with long lines
            chunk_size = 100  # Smaller chunks to avoid tmux issues
            for i in range(0, len(prompt_text), chunk_size):
                chunk = prompt_text[i:i+chunk_size]
                
                try:
                    # Handle special characters by creating a temporary file and using loadb
                    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as tmp:
                        tmp.write(chunk)
                        tmp_path = tmp.name
                    
                    # Use paste-buffer approach which is more reliable for special characters
                    subprocess.run(["tmux", "load-buffer", tmp_path], check=True)
                    subprocess.run(["tmux", "paste-buffer", "-t", session_name], check=True)
                    
                    # Clean up temp file
                    os.unlink(tmp_path)
                    
                    # Brief pause between chunks
                    time.sleep(0.1)
                except Exception as e:
                    print(f"Error sending chunk: {e}")
                    
                    # Fallback to direct send-keys if load-buffer fails
                    try:
                        # Try without the -l flag which can cause issues with special chars
                        print(f"Trying fallback method without -l flag, chunk length: {len(chunk)}")
                        subprocess.run([
                            "tmux", "send-keys", "-t", session_name,
                            chunk
                        ], check=True)
                    except Exception as nested_e:
                        print(f"Fallback also failed: {nested_e}")
                        # If both methods fail, just log it but continue with next chunk
                        print(f"WARNING: Could not send chunk: {chunk[:20]}...")
                        # Don't raise the exception, try to continue
                
            
            # If requested, submit the prompt by sending Enter
            if should_submit:
                time.sleep(0.5)  # Wait a bit before sending Enter
                subprocess.run([
                    "tmux", "send-keys", "-t", session_name, 
                    "Enter"
                ], check=True)
                
            return jsonify({"success": True})
        else:
            # For terminal sessions, use AppleScript
            if instance.terminal_id:
                # First activate the terminal
                activate_cmd = f'''
                tell application "Terminal"
                    activate
                    set frontmost of (first window whose id is {instance.terminal_id}) to true
                end tell
                '''
                subprocess.run(["osascript", "-e", activate_cmd])
                
                # Then send the text using AppleScript
                text_escaped = prompt_text.replace('"', '\\"').replace('\\', '\\\\')
                send_text_cmd = f'''
                tell application "System Events"
                    keystroke "{text_escaped}"
                end tell
                '''
                subprocess.run(["osascript", "-e", send_text_cmd])
                
                # If requested, submit the prompt by sending Enter
                if should_submit:
                    time.sleep(0.5)  # Wait a bit before sending Enter
                    subprocess.run(["osascript", "-e", 'tell application "System Events" to keystroke return'])
                
                return jsonify({"success": True})
            else:
                return jsonify({"success": False, "error": f"Terminal ID not found for instance {instance_id}"})
    except Exception as e:
        print(f"Error sending prompt: {e}")
        return jsonify({"success": False, "error": str(e)})

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
                                    return jsonify({"path": os.path.normpath(p)})
                            
                            # If no match in home dir, just return the first directory
                            return jsonify({"path": os.path.normpath(dir_paths[0])})
                    
                    # Otherwise handle like a regular file
                    # If multiple results, try to find the most relevant one (e.g., home directory)
                    home_dir = str(Path.home())
                    for p in paths:
                        if p.startswith(home_dir):
                            return jsonify({"path": os.path.normpath(p)})
                    
                    # If no match in home dir, just return the first match
                    return jsonify({"path": os.path.normpath(paths[0])})
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
                    return jsonify({"path": os.path.normpath(dir_path)})
            
            # Last resort, return a placeholder with the directory name
            return jsonify({"path": os.path.normpath(f"/path/to/{file.filename}")})
        else:
            # For files, return the filename (no need to normalize non-path filenames)
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
        return jsonify({"path": os.path.normpath(dir_name)})
    
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
            normalized_path = os.path.normpath(loc)
            print(f"Found directory in common location: {normalized_path}")
            return jsonify({"path": normalized_path})
    
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
                normalized_path = os.path.normpath(paths[0])
                print(f"Found directory using find: {normalized_path}")
                return jsonify({"path": normalized_path})
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
                normalized_path = os.path.normpath(dir_paths[0])
                print(f"Found directory using mdfind: {normalized_path}")
                return jsonify({"path": normalized_path})
    except Exception as e:
        print(f"Error using mdfind: {e}")
    
    # If we couldn't find a match, return the directory name as fallback
    normalized_path = os.path.normpath(dir_name)
    print(f"No match found, returning normalized directory name: {normalized_path}")
    return jsonify({"path": normalized_path})

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
        import time, os
        time.sleep(2)
        return True
    except:
        return False

# Add a shutdown route to the Flask app
def get_svg_content(file_path):
    """Helper function to read SVG file content safely."""
    try:
        with open(file_path, 'r') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading SVG file {file_path}: {e}")
        return None

@app.route('/svg/<path:svg_path>')
def serve_svg(svg_path):
    """Serve SVG content with proper encoding of path."""
    # Decode the path which may contain spaces and special characters
    import urllib.parse
    decoded_path = urllib.parse.unquote(svg_path)
    full_path = f"/{decoded_path}"  # Add the leading slash back
    
    print(f"Attempting to serve SVG from: {full_path}")
    
    if not os.path.exists(full_path):
        print(f"SVG file not found: {full_path}")
        return "", 404
    
    try:
        # Read the SVG file
        with open(full_path, 'rb') as f:
            svg_data = f.read()
        
        # Return the SVG with the correct MIME type
        from flask import Response
        return Response(svg_data, mimetype='image/svg+xml')
    except Exception as e:
        print(f"Error serving SVG: {e}")
        return "", 500

@app.route('/shutdown')
def shutdown():
    """Shutdown the server."""
    import os
    # Using os._exit because Flask's shutdown request doesn't always work reliably
    print("Server shutting down...")
    os._exit(0)
    return "Server shutting down..."

def get_prompt_files():
    """Get a list of prompt files from the prompts directory."""
    prompt_dir = "/Users/Mike/Desktop/upwork/1) proposal automation/2) create proposal/code/prompts"
    prompt_files = []
    
    if os.path.exists(prompt_dir) and os.path.isdir(prompt_dir):
        for file in os.listdir(prompt_dir):
            if file.endswith('.txt'):
                file_path = os.path.join(prompt_dir, file)
                # Create an object with both path and name
                prompt_files.append({
                    "path": file_path,
                    "name": file
                })
    
    # Sort files by name
    prompt_files.sort(key=lambda x: x["name"])
    return prompt_files

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
    import time, os
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
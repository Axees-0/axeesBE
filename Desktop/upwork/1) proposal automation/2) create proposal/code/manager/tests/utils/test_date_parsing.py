#!/usr/bin/env python3
"""
Test script to diagnose date parsing issues.
"""
import unittest
import re
import time
import subprocess
from datetime import datetime
from unittest.mock import patch, MagicMock

# Import helpers
from tests.helpers import import_module

class TestDateParsing(unittest.TestCase):
    """Tests for date parsing functionality."""
    
    def test_standard_date_format(self):
        """Test parsing a standard date format from tmux."""
        # Example date string from tmux
        date_str = "Fri Mar 7 19:53:52 2025"
        
        # Parse using strptime
        dt = datetime.strptime(date_str, "%a %b %d %H:%M:%S %Y")
        
        # Verify the parsed date
        self.assertEqual(dt.year, 2025)
        self.assertEqual(dt.month, 3)
        self.assertEqual(dt.day, 7)
        self.assertEqual(dt.hour, 19)
        self.assertEqual(dt.minute, 53)
        self.assertEqual(dt.second, 52)
    
    def test_alternative_date_format(self):
        """Test parsing a date format with double space after month."""
        # Example date string with double space
        date_str = "Fri Mar  7 19:53:52 2025"
        
        # Parse using strptime with the appropriate format
        dt = datetime.strptime(date_str, "%a %b  %d %H:%M:%S %Y")
        
        # Verify the parsed date
        self.assertEqual(dt.year, 2025)
        self.assertEqual(dt.month, 3)
        self.assertEqual(dt.day, 7)
        self.assertEqual(dt.hour, 19)
        self.assertEqual(dt.minute, 53)
        self.assertEqual(dt.second, 52)
    
    def test_relative_time_parsing(self):
        """Test parsing relative time strings from tmux."""
        # Example relative time strings
        time_strings = {
            "5 seconds ago": 5,
            "1 minute ago": 60,
            "3 minutes ago": 180,
            "1 hour ago": 3600,
            "2 hours ago": 7200
        }
        
        current_time = time.time()
        
        # Test each relative time string
        for time_str, expected_seconds in time_strings.items():
            # For seconds
            if "second" in time_str:
                seconds_match = re.search(r'(\d+) seconds?', time_str)
                seconds = int(seconds_match.group(1)) if seconds_match else 0
                self.assertEqual(seconds, expected_seconds)
                
            # For minutes
            elif "minute" in time_str:
                minutes_match = re.search(r'(\d+) minutes?', time_str)
                minutes = int(minutes_match.group(1)) if minutes_match else 0
                self.assertEqual(minutes * 60, expected_seconds)
                
            # For hours
            elif "hour" in time_str:
                hours_match = re.search(r'(\d+) hours?', time_str)
                hours = int(hours_match.group(1)) if hours_match else 0
                self.assertEqual(hours * 3600, expected_seconds)

def manual_test_date_parsing():
    """Manual test for date parsing from tmux."""
    # Get actual sample from tmux
    result = subprocess.run(
        ["tmux", "ls"], 
        capture_output=True, 
        text=True, 
        check=False
    )
    
    if result.returncode != 0:
        print("No tmux sessions running")
        return
    
    # Extract a sample line with a claude session
    claude_line = None
    for line in result.stdout.strip().split('\n'):
        if line.startswith('claude_'):
            claude_line = line
            break
    
    if not claude_line:
        print("No Claude sessions found")
        return
    
    print(f"Sample line: {claude_line}")
    
    # Extract the creation time string
    time_match = re.search(r'created (.+?)(?:\)|\s*$)', claude_line)
    if not time_match:
        print("No creation time found in line")
        return
    
    created_str = time_match.group(1)
    
    # Test the full line approach
    full_match = re.search(r'created ((?:\w+\s+\w+\s+\d+\s+\d+:\d+:\d+\s+\d+))', claude_line)
    if full_match:
        print(f"Found full date match: '{full_match.group(1)}'")
        created_str = full_match.group(1)
    print(f"Extracted creation time string: '{created_str}'")
    
    # Try various date parsing approaches
    
    # 1. Using strptime with various formats
    formats = [
        "%a %b %d %H:%M:%S %Y",  # e.g. "Fri Mar 7 19:53:52 2025"
        "%a %b %d %H:%M:%S",     # without year
        "%a %b  %d %H:%M:%S %Y", # with double space after month (common in some systems)
        "%a %b  %d %H:%M:%S"     # double space, no year
    ]
    
    for fmt in formats:
        try:
            print(f"\nTrying format: '{fmt}'")
            dt = datetime.strptime(created_str, fmt)
            print(f"SUCCESS! Parsed as: {dt}")
            
            # Convert to timestamp for claude_task_manager
            timestamp = dt.timestamp()
            print(f"Timestamp: {timestamp}")
            
            # Calculate uptime
            uptime = time.time() - timestamp
            print(f"Uptime: {uptime:.2f} seconds")
        except Exception as e:
            print(f"Error: {e}")
    
    # 2. Using regex parsing for more flexibility
    print("\nTrying regex-based parsing:")
    # This pattern looks for day, month, date, time, and year
    regex = r'(\w+) (\w+)\s+(\d+) (\d+):(\d+):(\d+) (\d+)'
    match = re.search(regex, created_str)
    
    if match:
        print("Regex match found!")
        day, month, date, hour, minute, second, year = match.groups()
        print(f"Day: {day}, Month: {month}, Date: {date}, Time: {hour}:{minute}:{second}, Year: {year}")
        
        # Convert month name to number
        month_map = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        }
        
        if month in month_map:
            month_num = month_map[month]
            print(f"Month number: {month_num}")
            
            # Create datetime object
            try:
                dt = datetime(int(year), month_num, int(date), int(hour), int(minute), int(second))
                print(f"Created datetime: {dt}")
                
                # Convert to timestamp
                timestamp = dt.timestamp()
                print(f"Timestamp: {timestamp}")
                
                # Calculate uptime
                uptime = time.time() - timestamp
                print(f"Uptime: {uptime:.2f} seconds")
            except Exception as e:
                print(f"Error creating datetime: {e}")
    else:
        print("No regex match found")

if __name__ == "__main__":
    # If called directly, run the manual test
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--manual":
        manual_test_date_parsing()
    else:
        # Run the unit tests
        unittest.main()
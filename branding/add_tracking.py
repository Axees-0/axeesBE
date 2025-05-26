#!/usr/bin/env python3
"""
Website Tracking Code Injector
Programmatically adds analytics tracking to multiple websites
"""

import json
import os
import shutil
from datetime import datetime
import re
import argparse
from pathlib import Path


class TrackingInjector:
    def __init__(self, config_file='tracking_config.json'):
        self.config_file = config_file
        self.config = self.load_config()
        self.backup_dir = None
        self.modified_files = []
        
    def load_config(self):
        """Load configuration from JSON file"""
        with open(self.config_file, 'r') as f:
            return json.load(f)
    
    def create_backup(self):
        """Create backup of all HTML files before modification"""
        if not self.config['backup']['enabled']:
            return
            
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.backup_dir = os.path.join(
            self.config['backup']['folder'], 
            f'backup_{timestamp}'
        )
        
        print(f"Creating backup in: {self.backup_dir}")
        
        for website_key, website_data in self.config['websites'].items():
            for file_path in website_data['files']:
                if os.path.exists(file_path):
                    backup_path = os.path.join(self.backup_dir, file_path)
                    os.makedirs(os.path.dirname(backup_path), exist_ok=True)
                    shutil.copy2(file_path, backup_path)
                    print(f"  Backed up: {file_path}")
    
    def check_existing_tracking(self, content):
        """Check if tracking code already exists in the file"""
        tracking_patterns = [
            r'google-analytics\.com',
            r'googletagmanager\.com',
            r'gtag\(',
            r'GTM-',
            r'G-[A-Z0-9]+',
            r'UA-[0-9]+'
        ]
        
        for pattern in tracking_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return True
        return False
    
    def inject_ga_tracking(self, content, tracking_id):
        """Inject Google Analytics tracking code"""
        ga_script = self.config['tracking_services']['google_analytics']['script_template']
        ga_script = ga_script.format(tracking_id=tracking_id)
        
        # Try to inject before </head>
        if '</head>' in content:
            return content.replace('</head>', f'{ga_script}\n</head>')
        # Fallback to before </body>
        elif '</body>' in content:
            return content.replace('</body>', f'{ga_script}\n</body>')
        else:
            print("Warning: No </head> or </body> tag found!")
            return content
    
    def inject_gtm_tracking(self, content, container_id):
        """Inject Google Tag Manager tracking code"""
        head_script = self.config['tracking_services']['google_tag_manager']['head_script']
        body_script = self.config['tracking_services']['google_tag_manager']['body_script']
        
        head_script = head_script.format(container_id=container_id)
        body_script = body_script.format(container_id=container_id)
        
        # Inject head script
        if '</head>' in content:
            content = content.replace('</head>', f'{head_script}\n</head>')
        
        # Inject body script
        if '<body' in content:
            # Find the end of the opening body tag
            body_match = re.search(r'<body[^>]*>', content)
            if body_match:
                body_tag_end = body_match.end()
                content = content[:body_tag_end] + f'\n{body_script}\n' + content[body_tag_end:]
        
        return content
    
    def process_file(self, file_path, website_config):
        """Process a single HTML file"""
        print(f"\nProcessing: {file_path}")
        
        if not os.path.exists(file_path):
            print(f"  ERROR: File not found!")
            return False
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for existing tracking
        if self.check_existing_tracking(content):
            print(f"  WARNING: Tracking code already exists! Skipping...")
            return False
        
        original_content = content
        
        # Apply Google Analytics if enabled
        if self.config['tracking_services']['google_analytics']['enabled']:
            tracking_id = website_config.get('custom_tracking', {}).get(
                'google_analytics_id',
                self.config['tracking_services']['google_analytics']['tracking_id']
            )
            content = self.inject_ga_tracking(content, tracking_id)
            print(f"  Added Google Analytics: {tracking_id}")
        
        # Apply Google Tag Manager if enabled
        if self.config['tracking_services']['google_tag_manager']['enabled']:
            container_id = website_config.get('custom_tracking', {}).get(
                'gtm_container_id',
                self.config['tracking_services']['google_tag_manager']['container_id']
            )
            content = self.inject_gtm_tracking(content, container_id)
            print(f"  Added Google Tag Manager: {container_id}")
        
        # Write the modified content back
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            self.modified_files.append(file_path)
            print(f"  ✓ File updated successfully")
            return True
        else:
            print(f"  No changes made")
            return False
    
    def run(self, dry_run=False):
        """Run the tracking injection process"""
        print("="*60)
        print("Website Tracking Code Injector")
        print("="*60)
        
        # Check if any tracking service is enabled
        ga_enabled = self.config['tracking_services']['google_analytics']['enabled']
        gtm_enabled = self.config['tracking_services']['google_tag_manager']['enabled']
        
        if not ga_enabled and not gtm_enabled:
            print("\nERROR: No tracking services are enabled!")
            print("Please enable at least one service in tracking_config.json")
            return
        
        print(f"\nEnabled services:")
        if ga_enabled:
            print(f"  - Google Analytics: {self.config['tracking_services']['google_analytics']['tracking_id']}")
        if gtm_enabled:
            print(f"  - Google Tag Manager: {self.config['tracking_services']['google_tag_manager']['container_id']}")
        
        if dry_run:
            print("\n*** DRY RUN MODE - No files will be modified ***")
        
        # Create backup
        if not dry_run:
            self.create_backup()
        
        # Process each website
        total_files = 0
        modified_count = 0
        
        for website_key, website_data in self.config['websites'].items():
            print(f"\n\nProcessing website: {website_data['name']}")
            print("-" * 40)
            
            for file_path in website_data['files']:
                total_files += 1
                if not dry_run:
                    if self.process_file(file_path, website_data):
                        modified_count += 1
                else:
                    print(f"  Would process: {file_path}")
        
        # Summary
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        print(f"Total files scanned: {total_files}")
        print(f"Files modified: {modified_count}")
        
        if self.backup_dir and not dry_run:
            print(f"\nBackup location: {self.backup_dir}")
        
        if self.modified_files:
            print("\nModified files:")
            for f in self.modified_files:
                print(f"  - {f}")
    
    def rollback(self, backup_timestamp):
        """Rollback to a specific backup"""
        backup_path = os.path.join(
            self.config['backup']['folder'],
            f'backup_{backup_timestamp}'
        )
        
        if not os.path.exists(backup_path):
            print(f"ERROR: Backup not found: {backup_path}")
            return
        
        print(f"Rolling back from backup: {backup_path}")
        
        for root, dirs, files in os.walk(backup_path):
            for file in files:
                if file.endswith('.html'):
                    backup_file = os.path.join(root, file)
                    relative_path = os.path.relpath(backup_file, backup_path)
                    original_file = relative_path
                    
                    print(f"  Restoring: {original_file}")
                    shutil.copy2(backup_file, original_file)
        
        print("Rollback complete!")


def main():
    parser = argparse.ArgumentParser(description='Add tracking codes to websites')
    parser.add_argument('--dry-run', action='store_true', 
                        help='Show what would be changed without modifying files')
    parser.add_argument('--rollback', type=str, 
                        help='Rollback to a backup (provide timestamp, e.g., 20240101_120000)')
    parser.add_argument('--config', default='tracking_config.json',
                        help='Path to configuration file')
    
    args = parser.parse_args()
    
    injector = TrackingInjector(args.config)
    
    if args.rollback:
        injector.rollback(args.rollback)
    else:
        injector.run(dry_run=args.dry_run)


if __name__ == '__main__':
    main()
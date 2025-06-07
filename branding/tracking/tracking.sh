#!/bin/bash

# Website Tracking Management Script

echo "🔍 Website Tracking Manager"
echo "=========================="
echo ""

case "$1" in
    "setup")
        echo "📝 Opening tracking configuration..."
        ${EDITOR:-nano} tracking_config.json
        ;;
    
    "test")
        echo "🧪 Running in test mode (dry-run)..."
        python3 add_tracking.py --dry-run
        ;;
    
    "apply")
        echo "🚀 Applying tracking to all websites..."
        echo "⚠️  This will modify your HTML files!"
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            python3 add_tracking.py
        else
            echo "Cancelled."
        fi
        ;;
    
    "rollback")
        if [ -z "$2" ]; then
            echo "❌ Error: Please provide backup timestamp"
            echo "Usage: ./tracking.sh rollback YYYYMMDD_HHMMSS"
            echo ""
            echo "Available backups:"
            ls -la tracking_backups/ 2>/dev/null | grep "backup_" || echo "No backups found"
        else
            python3 add_tracking.py --rollback $2
        fi
        ;;
    
    "status")
        echo "📊 Checking tracking status..."
        echo ""
        for site in personal_brand vespera xenodex; do
            echo "Website: $site"
            echo "-------------------"
            find $site -name "*.html" -type f | while read file; do
                if grep -q "google-analytics\|googletagmanager" "$file" 2>/dev/null; then
                    echo "  ✅ $file - Tracking present"
                else
                    echo "  ❌ $file - No tracking"
                fi
            done
            echo ""
        done
        ;;
    
    *)
        echo "Usage: ./tracking.sh [command]"
        echo ""
        echo "Commands:"
        echo "  setup    - Edit tracking configuration"
        echo "  test     - Run in test mode (no changes)"
        echo "  apply    - Apply tracking to all websites"
        echo "  status   - Check current tracking status"
        echo "  rollback - Restore from backup"
        echo ""
        echo "Examples:"
        echo "  ./tracking.sh setup"
        echo "  ./tracking.sh test"
        echo "  ./tracking.sh apply"
        echo "  ./tracking.sh rollback 20240526_143022"
        ;;
esac
# Website Tracking Setup Guide

This tool programmatically adds analytics tracking (Google Analytics and/or Google Tag Manager) to all your GoDaddy websites.

## Quick Start

1. **Configure your tracking IDs** in `tracking_config.json`:
   ```json
   {
     "tracking_services": {
       "google_analytics": {
         "enabled": true,
         "tracking_id": "G-YOUR-ID-HERE"
       },
       "google_tag_manager": {
         "enabled": false,
         "container_id": "GTM-YOUR-ID"
       }
     }
   }
   ```

2. **Test with dry run** (no files will be changed):
   ```bash
   python add_tracking.py --dry-run
   ```

3. **Apply tracking to all websites**:
   ```bash
   python add_tracking.py
   ```

## Features

- ✅ Automatically adds tracking to all HTML files
- ✅ Creates backups before making changes
- ✅ Prevents duplicate tracking codes
- ✅ Supports both Google Analytics 4 and Google Tag Manager
- ✅ Website-specific tracking IDs (optional)

## Your Websites

The tool will add tracking to:

1. **Personal Brand** - `personal_brand/index.html`
2. **Vespera** - 3 pages (index, consultation, api-docs)
3. **Xenodex Sciences** - 3 pages (index, plan, science)

## Usage Examples

### Enable Google Analytics Only
Edit `tracking_config.json`:
```json
"google_analytics": {
  "enabled": true,
  "tracking_id": "G-XXXXXXXXXX"
},
"google_tag_manager": {
  "enabled": false
}
```

### Use Different Tracking IDs Per Website
Add custom tracking in the website config:
```json
"vespera": {
  "name": "Vespera Trading Platform",
  "files": [...],
  "custom_tracking": {
    "google_analytics_id": "G-VESPERA123"
  }
}
```

### Rollback Changes
If something goes wrong, rollback to a backup:
```bash
python add_tracking.py --rollback 20240526_143022
```

## What Gets Added

### Google Analytics 4
Adds before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
<!-- End Google Analytics -->
```

### Google Tag Manager
Adds to `<head>` and after `<body>`:
```html
<!-- In <head> -->
<!-- Google Tag Manager -->
<script>...</script>
<!-- End Google Tag Manager -->

<!-- After <body> -->
<!-- Google Tag Manager (noscript) -->
<noscript>...</noscript>
<!-- End Google Tag Manager (noscript) -->
```

## Backups

Backups are automatically created in `tracking_backups/backup_YYYYMMDD_HHMMSS/`

## Safety Features

- Won't add tracking if it already exists
- Creates full backups before modifying
- Dry-run mode for testing
- Clear logging of all changes

## Next Steps

1. Get your tracking IDs from:
   - [Google Analytics](https://analytics.google.com/)
   - [Google Tag Manager](https://tagmanager.google.com/)

2. Update `tracking_config.json` with your IDs

3. Run with `--dry-run` first to preview changes

4. Run without flags to apply tracking

5. Upload modified files to GoDaddy hosting
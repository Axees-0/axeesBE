# Web Scraping Utilities

A collection of Python utilities for scraping web content and Google Sheets data.

## Features

- Extract all links from a webpage
- Extract YouTube video IDs from links
- Generate YouTube playlist URLs from extracted video IDs
- Scrape data from published Google Sheets
- Export scraped data to CSV, avoiding duplicates
- Download YouTube videos and transcripts

## Google Sheet Table Structure

The table in the Google Sheet has the following structure:
- **Column 0**: ID/Number value (numeric identifier)
- **Column 1**: Freezebar cell (empty separation column)
- **Column 2**: Name (contains hyperlinked text)
- **Column 3**: Email address
- **Column 4**: Type/Classification (contains hyperlinked text with personality type codes)
- **Column 5**: Status indicator (contains "DONE" with colored formatting)
- **Column 6**: Empty/notes column

**Link Structure**:
- Names in column 2 are hyperlinked to Google documents
- Type information in column 4 is also hyperlinked, often to Google documents
- Links are formatted as Google redirect URLs that need to be extracted
- Real content starts around row 15

## Data Flow

```
                             ┌───────────────┐
                             │               │
                             │master_scraper │
                             │               │
                             └───┬───────┬───┘
                                 │       │
                 ┌───────────────┘       └───────────────┐
                 │                                       │
                 ▼                                       ▼
        ┌──────────────────┐                   ┌──────────────┐
        │                  │                   │              │
        │scrape_google_sheets│◄──┐             │extract_links │
        │                  │     │             │              │
        └────────┬─────────┘     │             └───────┬──────┘
                 │               │                     │
                 │               │                     │
                 ▼               │                     │
        ┌─────────────┐          │                     │
        │             │          │                     │
        │Google Sheets│          │                     │
        │             │          │                     │
        └─────────────┘          │                     │
                                 │                     │
                                 │                     │
                                 │                     │
                         ┌───────┴─────────┐           │
                         │                 │           │
                         │   output.csv    │◄──────────┘
                         │                 │
                         └────────┬────────┘
```

## Requirements

```
requests
beautifulsoup4
selenium
webdriver-manager
pytube
youtube-transcript-api
```

## Usage

### Extract Links and YouTube Videos

```python
from extract_links import process_url

# Process a webpage to extract links and YouTube videos
links, youtube_playlist = process_url("https://example.com")

# Print all extracted links
print(f"Found {len(links)} links")

# If YouTube videos were found, display the playlist URL
if youtube_playlist:
    print(f"YouTube playlist: {youtube_playlist}")
```

### Scrape Google Sheets Data

```python
from scrape_google_sheets import update_csv

# Update the URL in scrape_google_sheets.py first:
# URL = "https://docs.google.com/spreadsheets/d/your-sheet-id/pubhtml"

# Run the script to fetch data and update the CSV
update_csv()
```

### Master Scraper (Combined Workflow)

```python
from master_scraper import process_links_from_csv

# Run the master scraper to:
# 1. Get latest data from Google Sheets
# 2. Process each link from the CSV
# 3. Add extracted links and YouTube playlists to the CSV
process_links_from_csv()
```

### Download YouTube Videos and Transcripts

```python
from download_youtube import process_youtube_url

# Download a video and its transcript
process_youtube_url("https://www.youtube.com/watch?v=VIDEO_ID")

# Download only the transcript
process_youtube_url("https://www.youtube.com/watch?v=VIDEO_ID", transcript_only=True)

# Process a playlist
process_youtube_url("https://www.youtube.com/playlist?list=PLAYLIST_ID")

# Command-line usage
# python download_youtube.py https://www.youtube.com/watch?v=VIDEO_ID --transcript-only --output-format json
```
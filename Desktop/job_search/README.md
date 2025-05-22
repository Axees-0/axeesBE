# Job Application Automation System

A comprehensive system that integrates job scraping, resume customization, and AI-powered matching to streamline the job application process.

## Overview

This project combines three main components:

1. **Job Scraper**: Collects job listings from various websites and stores them in a structured format
2. **Resume Customizer**: Tailors your resume to highlight relevant experience for specific job applications
3. **AI Integration**: Uses ChatGPT to analyze job descriptions and optimize resume content for better matching

## Project Structure

```
job_search/
├── config/                         # Configuration files
│   ├── __init__.py
│   ├── resume_config.py            # Resume customizer settings
│   ├── scraper_config.py           # Job scraper settings
│   └── openai_config.py            # OpenAI API settings
│
├── resume_customizer/              # Resume customization module
│   ├── __init__.py
│   ├── core/                       # Core resume functionality
│   │   ├── __init__.py
│   │   ├── formatter.py            # Document formatting functions
│   │   ├── template_manager.py     # Template manipulation
│   │   └── pdf_converter.py        # PDF conversion utilities
│   ├── templates/                  # Resume templates
│   └── output/                     # Generated resumes
│       ├── finals/                 # Final PDF versions
│       └── drafts/                 # Working copies
│
├── job_scraper/                    # Job scraping module
│   ├── __init__.py
│   ├── providers/                  # Website-specific scrapers
│   │   ├── __init__.py
│   │   ├── builtin.py              # BuiltIn scraper
│   │   ├── linkedin.py             # LinkedIn scraper
│   │   └── indeed.py               # Indeed scraper
│   ├── parser/                     # Parsing utilities
│   │   ├── __init__.py
│   │   └── html_parser.py          # HTML parsing functions
│   └── data/                       # Scraped job data
│       ├── jobs.csv                # Main jobs database
│       └── html/                   # Raw HTML job descriptions
│
├── ai_integration/                 # ChatGPT integration module
│   ├── __init__.py
│   ├── analyzer/                   # Analysis components
│   │   ├── __init__.py
│   │   ├── job_analyzer.py         # Job description analysis
│   │   ├── resume_analyzer.py      # Resume content analysis
│   │   └── skills_matcher.py       # Skills matching algorithm
│   ├── generator/                  # Generation components
│   │   ├── __init__.py
│   │   ├── resume_generator.py     # Resume content generation
│   │   └── cover_letter_generator.py # Cover letter generation
│   └── prompts/                    # ChatGPT prompt templates
│       ├── __init__.py
│       ├── resume_prompts.py       # Resume-related prompts
│       └── job_prompts.py          # Job analysis prompts
│
├── data/                           # Shared data storage
│   ├── user_profile/               # User profile information
│   │   └── base_resume.json        # Core resume data
│   └── job_matches/                # Job-resume match data
│
├── utils/                          # Shared utilities
│   ├── __init__.py
│   ├── file_handler.py             # File I/O operations
│   ├── text_processor.py           # Text processing utilities
│   └── logger.py                   # Logging functionality
│
├── web/                            # Optional web interface
│   ├── __init__.py
│   ├── app.py                      # Web application
│   ├── templates/                  # HTML templates
│   └── static/                     # Static assets
│
├── main.py                         # Main application entry point
├── run.py                          # Command-line interface
├── requirements.txt                # Project dependencies
└── README.md                       # Project documentation
```

## Workflow

### 1. Job Scraping Phase

The system collects job listings from configured websites:

- Scrapes job listings from multiple sources (BuiltIn, LinkedIn, Indeed)
- Extracts key information (title, company, requirements, etc.)
- Stores data in a structured format for analysis

### 2. Analysis Phase

AI analyzes both job descriptions and your base resume:

- Extracts key skills and requirements from job listings
- Identifies company values and culture indicators
- Analyzes your resume to understand skills and experience
- Determines match points and areas to emphasize

### 3. Customization Phase

The system creates a tailored resume for each application:

- AI generates optimized content based on job-resume matching
- Resume customizer applies changes to your template while preserving formatting
- Final PDF is generated with proper styling and layout

## Usage

### Command-line Interface

```bash
# Scrape job listings from configured websites
python run.py scrape

# Analyze a specific job
python run.py analyze <job_id>

# Generate a customized resume for a job
python run.py customize <job_id>

# Run the complete workflow (analyze + customize)
python run.py full-process <job_id>
```

### Resume Customization

```bash
# Customize resume with specific parameters
python run.py customize --company "Target Company" --role "Position Title" --id "JobID123"

# Optional flags
--keep-docx       # Keep the DOCX file in addition to PDF
--remove-unused   # Remove unused company entries
```

## Components

### Resume Customizer

- Reads a DOCX resume file and maintains its formatting
- Updates job details based on configuration in JSON
- Converts the customized resume to PDF
- Preserves careful spacing and styling
- Version control system for tracking job applications

### Job Scraper

- Scrapes job listings from multiple websites
- Extracts key information from job descriptions
- Saves data to CSV for further processing
- Downloads and parses full job descriptions
- Rate limiting to avoid overloading target sites

### AI Integration

- Connects to OpenAI API for job and resume analysis
- Generates optimized content for job applications
- Matches your skills to job requirements
- Identifies keywords and phrases to include
- Can generate cover letters and application materials

## Requirements

- Python 3.8+
- OpenAI API key for AI integration
- LibreOffice (for PDF conversion)
- Required packages (see requirements.txt)

## Installation

1. Clone the repository
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure API keys:
   ```bash
   cp config/openai_config.example.py config/openai_config.py
   # Edit the file to add your API key
   ```

## Configuration

- `config/resume_config.py`: Settings for resume customization
- `config/scraper_config.py`: Job site configurations and scraping parameters
- `config/openai_config.py`: OpenAI API settings and prompt configurations

## License

MIT
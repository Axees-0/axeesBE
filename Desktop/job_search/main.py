#!/usr/bin/env python3
"""
Job Application Automation System

This script provides a unified interface for the job application automation system.
"""

import os
import sys
import json
import logging
import argparse
import subprocess
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Define base directory and paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRAPE_JOBS_DIR = os.path.join(BASE_DIR, "scrape_jobs")
RESUME_CUSTOMIZER_DIR = os.path.join(BASE_DIR, "resume_customizer")
AI_INTEGRATION_DIR = os.path.join(BASE_DIR, "ai_integration")
JOBS_CSV = os.path.join(SCRAPE_JOBS_DIR, "jobs.csv")
CORE_TEMPLATE_PATH = os.path.join(RESUME_CUSTOMIZER_DIR, "src", "core_template.json")

def run_scraper(args: List[str]) -> None:
    """
    Run the job scraper.
    
    Args:
        args: Command line arguments for the scraper.
    """
    logger.info("Running job scraper...")
    
    # Build the command
    cmd = [sys.executable, os.path.join(SCRAPE_JOBS_DIR, "scrape.py")]
    cmd.extend(args)
    
    # Run the command
    try:
        subprocess.run(cmd, check=True)
        logger.info("Job scraper completed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Job scraper failed with exit code {e.returncode}")
        sys.exit(1)

def run_job_analyzer(job_id: str) -> None:
    """
    Run the job analyzer.
    
    Args:
        job_id: The ID of the job to analyze.
    """
    logger.info(f"Analyzing job {job_id}...")
    
    # Import the job analyzer
    from ai_integration.analyzer.job_analyzer import JobAnalyzer
    
    # Get the job description
    try:
        import pandas as pd
        df = pd.read_csv(JOBS_CSV)
        job_df = df[df['url'].str.contains(job_id, na=False)]
        
        # If not found in URL, check if it's a row index
        if job_df.empty:
            try:
                index = int(job_id)
                if 0 <= index < len(df):
                    job_df = df.iloc[[index]]
            except ValueError:
                pass
        
        if job_df.empty:
            logger.error(f"Job {job_id} not found in {JOBS_CSV}")
            sys.exit(1)
        
        job_description = job_df.iloc[0]['Description']
        
        # Analyze the job
        analyzer = JobAnalyzer()
        result = analyzer.analyze_job_description(job_description)
        
        # Print the result
        print("\n==== JOB ANALYSIS ====")
        print("\nRequired Skills:")
        for skill in result.get('required_skills', []):
            print(f"- {skill}")
        
        print("\nPreferred Skills:")
        for skill in result.get('preferred_skills', []):
            print(f"- {skill}")
        
        print("\nKey Responsibilities:")
        for resp in result.get('key_responsibilities', []):
            print(f"- {resp}")
        
        print("\nCompany Values:")
        for value in result.get('company_values', []):
            print(f"- {value}")
        
        print("\nKeywords:")
        for keyword in result.get('keywords', []):
            print(f"- {keyword}")
        
        logger.info("Job analysis completed successfully")
        
    except Exception as e:
        logger.error(f"Job analysis failed: {str(e)}")
        sys.exit(1)

def run_resume_customizer(job_id: str, options: Dict[str, Any]) -> None:
    """
    Run the resume customizer.
    
    Args:
        job_id: The ID of the job to customize for.
        options: Additional options for customization.
    """
    logger.info(f"Customizing resume for job {job_id}...")
    
    # Build the command
    cmd = [sys.executable, os.path.join(RESUME_CUSTOMIZER_DIR, "run.py")]
    
    # Add options
    if "company" in options and options["company"]:
        cmd.extend(["--company", options["company"]])
    
    if "role" in options and options["role"]:
        cmd.extend(["--role", options["role"]])
    
    cmd.extend(["--id", job_id])
    
    if options.get("keep_docx", False):
        cmd.append("--keep-docx")
    
    if options.get("remove_unused", False):
        cmd.append("--remove-unused")
    
    # Run the command
    try:
        subprocess.run(cmd, check=True)
        logger.info("Resume customization completed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Resume customization failed with exit code {e.returncode}")
        sys.exit(1)

def get_job_info(job_id: str) -> Tuple[str, str, str, str]:
    """
    Get job information from the jobs CSV file.
    
    Args:
        job_id: The ID of the job to retrieve.
        
    Returns:
        A tuple containing (job_description, company, role, job_id).
    """
    logger.info(f"Retrieving job information for {job_id}...")
    
    try:
        df = pd.read_csv(JOBS_CSV)
        job_df = df[df['url'].str.contains(job_id, na=False)]
        
        # If not found in URL, check if it's a row index
        if job_df.empty:
            try:
                index = int(job_id)
                if 0 <= index < len(df):
                    job_df = df.iloc[[index]]
            except ValueError:
                pass
        
        if job_df.empty:
            logger.error(f"Job {job_id} not found in {JOBS_CSV}")
            sys.exit(1)
        
        job_description = job_df.iloc[0]['Description']
        company = job_df.iloc[0].get('company', '')
        role = job_df.iloc[0].get('role', '')
        
        return job_description, company, role, job_id
        
    except Exception as e:
        logger.error(f"Error retrieving job information: {str(e)}")
        sys.exit(1)

def run_direct_gpt_to_pdf(job_id: str, options: Dict[str, Any]) -> None:
    """
    Run a direct process from job ID to PDF without needing a resume file.
    
    This function:
    1. Gets the job description from jobs.csv
    2. Sends the job description and core_template.json to GPT
    3. Gets the JSON response
    4. Passes it directly to run.py
    
    Args:
        job_id: The ID of the job to process.
        options: Additional options for the process.
    """
    logger.info(f"Running direct GPT-to-PDF process for job {job_id}...")
    
    # 1. Get the job description from jobs.csv
    job_description, company, role, _ = get_job_info(job_id)
    
    # 2-3. Send to GPT and get response
    try:
        # Import the skills matcher
        from ai_integration.analyzer.skills_matcher import SkillsMatcher
        
        # Create a skills matcher
        skills_matcher = SkillsMatcher()
        
        # Load the core template
        with open(CORE_TEMPLATE_PATH, 'r') as f:
            template_data = json.load(f)
            template_content = json.dumps(template_data, indent=2)
        
        # Generate the optimized template
        logger.info("Generating optimized resume template with GPT...")
        optimized_template = skills_matcher.match_resume_to_job(
            resume_content=template_content,  # Using template as "resume"
            job_description=job_description,
            job_title=role,
            company=company,
            job_id=job_id,
            template_path=CORE_TEMPLATE_PATH
        )
        
        # Save the optimized template to a temporary file
        output_dir = os.path.dirname(CORE_TEMPLATE_PATH)
        optimized_template_path = os.path.join(output_dir, "optimized_template.json")
        with open(optimized_template_path, 'w') as f:
            json.dump(optimized_template, f, indent=2)
        
        logger.info(f"Optimized template saved to {optimized_template_path}")
        
        # 4. Pass the JSON to run.py
        logger.info("Generating resume with optimized template...")
        cmd = [sys.executable, os.path.join(RESUME_CUSTOMIZER_DIR, "run.py")]
        cmd.extend(["--json-file", optimized_template_path])
        
        if options.get("keep_docx", False):
            cmd.append("--keep-docx")
        
        if options.get("remove_unused", False):
            cmd.append("--remove-unused")
        
        # Run the command
        subprocess.run(cmd, check=True)
        
        # Get the output file path - using simplified naming convention
        app_info = optimized_template.get("application_info", {})
        company = app_info.get("company", "Unknown")
        role = app_info.get("role", "Unknown")
        job_id_str = app_info.get("id", job_id)
        
        # Extract just the base company name and role (no location or parentheses)
        if '(' in company:
            company = company.split('(')[0].strip()
        if ',' in company:
            company = company.split(',')[0].strip()
            
        if '(' in role:
            role = role.split('(')[0].strip()
        
        # Create safe filename components
        safe_company = company.replace(" ", "_")
        safe_role = role.replace(" ", "_")
        safe_job_id = job_id_str.replace(" ", "_")
        
        # Remove special characters
        for char in ['/', ':', ',', '(', ')', '[', ']', '{', '}', '?', '*', '|', '<', '>', '"', "'", '&', '#', '%', '@', '!', ';', '=', '+']:
            safe_company = safe_company.replace(char, "")
            safe_role = safe_role.replace(char, "")
            safe_job_id = safe_job_id.replace(char, "")
        
        output_file = f"Michael_Abdo_Resume_{safe_company}_{safe_role}_{safe_job_id}.pdf"
        output_path = os.path.join(RESUME_CUSTOMIZER_DIR, "output", "finals", output_file)
        
        logger.info(f"Direct GPT-to-PDF process completed successfully. Output file: {output_path}")
        print(f"\nGenerated resume: {output_path}")
        print(f"Optimized template: {optimized_template_path}")
        
    except Exception as e:
        logger.error(f"Direct GPT-to-PDF process failed: {str(e)}")
        sys.exit(1)

def run_ai_integration(resume_path: str, job_id: str, options: Dict[str, Any]) -> None:
    """
    Run the AI integration to generate core_template.json.
    
    Args:
        resume_path: Path to the resume file.
        job_id: The ID of the job to match with.
        options: Additional options for the AI integration.
    """
    logger.info(f"Running AI integration for job {job_id}...")
    
    # Ensure the src directory exists
    os.makedirs(os.path.dirname(CORE_TEMPLATE_PATH), exist_ok=True)
    
    # Build the command
    cmd = [sys.executable, os.path.join(AI_INTEGRATION_DIR, "demo.py")]
    cmd.extend(["--resume", resume_path])
    cmd.extend(["--jobs-csv", JOBS_CSV])
    cmd.extend(["--job-id", job_id])
    
    # Always output to the core_template.json location
    cmd.extend(["--output", CORE_TEMPLATE_PATH])
    
    # Use the core_template.json as input template as well
    cmd.extend(["--template", CORE_TEMPLATE_PATH])
    
    if "cover_letter" in options and options["cover_letter"]:
        cmd.extend(["--cover-letter", options["cover_letter"]])
    
    # Run the command
    try:
        subprocess.run(cmd, check=True)
        logger.info("AI integration completed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"AI integration failed with exit code {e.returncode}")
        sys.exit(1)

def run_full_process(resume_path: str, job_id: str, options: Dict[str, Any]) -> None:
    """
    Run the full job application process.
    
    Args:
        resume_path: Path to the resume file.
        job_id: The ID of the job to process.
        options: Additional options for the process.
    """
    logger.info(f"Running full job application process for job {job_id}...")
    
    # 1. Analyze the job
    run_job_analyzer(job_id)
    
    # 2. Run AI integration to generate the core_template.json
    run_ai_integration(resume_path, job_id, options)
    
    # 3. Run resume customizer with the generated template
    customizer_options = {
        "keep_docx": options.get("keep_docx", False),
        "remove_unused": options.get("remove_unused", False)
    }
    
    # Run the resume customizer
    run_resume_customizer(job_id, customizer_options)
    
    # Get the output file path from the template data
    try:
        import json
        with open(CORE_TEMPLATE_PATH, 'r') as f:
            template_data = json.load(f)
        
        app_info = template_data.get("application_info", {})
        company = app_info.get("company", "Unknown")
        role = app_info.get("role", "Unknown")
        job_id_str = app_info.get("id", job_id)
        
        # Extract just the base company name and role (no location or parentheses)
        if '(' in company:
            company = company.split('(')[0].strip()
        if ',' in company:
            company = company.split(',')[0].strip()
            
        if '(' in role:
            role = role.split('(')[0].strip()
        
        # Create safe filename components
        safe_company = company.replace(" ", "_")
        safe_role = role.replace(" ", "_")
        safe_job_id = job_id_str.replace(" ", "_")
        
        # Remove special characters
        for char in ['/', ':', ',', '(', ')', '[', ']', '{', '}', '?', '*', '|', '<', '>', '"', "'", '&', '#', '%', '@', '!', ';', '=', '+']:
            safe_company = safe_company.replace(char, "")
            safe_role = safe_role.replace(char, "")
            safe_job_id = safe_job_id.replace(char, "")
        
        output_file = f"Michael_Abdo_Resume_{safe_company}_{safe_role}_{safe_job_id}.pdf"
        output_path = os.path.join(RESUME_CUSTOMIZER_DIR, "output", "finals", output_file)
        
        debug_json_path = os.path.join(os.path.dirname(output_path), f"resume_data_{safe_company}_{safe_role}_{safe_job_id}.json")
        gpt_output_path = os.path.join(RESUME_CUSTOMIZER_DIR, "src", "gpt_output_debug.json")
        
        logger.info(f"Full process completed successfully. Output file: {output_path}")
        print(f"\nGenerated resume: {output_path}")
        print(f"Debug JSON file: {debug_json_path}")
        print(f"GPT output JSON: {gpt_output_path}")
    except Exception as e:
        logger.warning(f"Could not determine output file: {str(e)}")
        logger.info("Full job application process completed successfully")

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='Job Application Automation System')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Scraper command
    scraper_parser = subparsers.add_parser('scrape', help='Scrape job listings')
    scraper_parser.add_argument('--site', help='Site URL to scrape')
    scraper_parser.add_argument('--job', help='Job URL to scrape')
    scraper_parser.add_argument('--max-pages', type=int, help='Maximum number of pages to scrape')
    
    # Analyze command
    analyze_parser = subparsers.add_parser('analyze', help='Analyze a job description')
    analyze_parser.add_argument('job_id', help='Job ID to analyze')
    
    # Customize command
    customize_parser = subparsers.add_parser('customize', help='Customize a resume for a job')
    customize_parser.add_argument('job_id', help='Job ID to customize for')
    customize_parser.add_argument('--company', help='Company name')
    customize_parser.add_argument('--role', help='Job role')
    customize_parser.add_argument('--keep-docx', action='store_true', help='Keep the DOCX file')
    customize_parser.add_argument('--remove-unused', action='store_true', help='Remove unused company entries')
    
    # AI integration command
    ai_parser = subparsers.add_parser('ai', help='Run AI integration')
    ai_parser.add_argument('--resume', required=True, help='Path to the resume file')
    ai_parser.add_argument('--job-id', required=True, help='Job ID to match with')
    ai_parser.add_argument('--cover-letter', help='Path to save the generated cover letter')
    
    # Full process command
    full_parser = subparsers.add_parser('full-process', help='Run the full job application process')
    full_parser.add_argument('--resume', required=True, help='Path to the resume file')
    full_parser.add_argument('--job-id', required=True, help='Job ID to process')
    full_parser.add_argument('--cover-letter', help='Path to save the generated cover letter')
    full_parser.add_argument('--keep-docx', action='store_true', help='Keep the DOCX file')
    full_parser.add_argument('--remove-unused', action='store_true', help='Remove unused company entries')
    
    # Direct GPT to PDF command
    gpt_parser = subparsers.add_parser('gpt-to-pdf', help='Run a direct GPT-to-PDF process')
    gpt_parser.add_argument('job_id', help='Job ID to process')
    gpt_parser.add_argument('--keep-docx', action='store_true', help='Keep the DOCX file')
    gpt_parser.add_argument('--remove-unused', action='store_true', help='Remove unused company entries')
    
    args = parser.parse_args()
    
    # Run the appropriate command
    if args.command == 'scrape':
        scraper_args = []
        if args.site:
            scraper_args.extend(['site', args.site])
        elif args.job:
            scraper_args.extend(['job', args.job])
        if args.max_pages:
            scraper_args.append(str(args.max_pages))
        run_scraper(scraper_args)
    
    elif args.command == 'analyze':
        run_job_analyzer(args.job_id)
    
    elif args.command == 'customize':
        options = {
            'company': args.company,
            'role': args.role,
            'keep_docx': args.keep_docx,
            'remove_unused': args.remove_unused
        }
        run_resume_customizer(args.job_id, options)
    
    elif args.command == 'ai':
        options = {
            'cover_letter': args.cover_letter
        }
        run_ai_integration(args.resume, args.job_id, options)
    
    elif args.command == 'full-process':
        options = {
            'cover_letter': args.cover_letter,
            'keep_docx': args.keep_docx,
            'remove_unused': args.remove_unused
        }
        run_full_process(args.resume, args.job_id, options)
    
    elif args.command == 'gpt-to-pdf':
        options = {
            'keep_docx': args.keep_docx,
            'remove_unused': args.remove_unused
        }
        run_direct_gpt_to_pdf(args.job_id, options)
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
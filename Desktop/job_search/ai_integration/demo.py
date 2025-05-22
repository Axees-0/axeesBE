#!/usr/bin/env python3
"""
GPT Integration Demo

This script demonstrates the GPT integration by matching a resume to a job description.
"""

import os
import sys
import json
import logging
import argparse
import pandas as pd
from typing import Dict, Any, Optional

# Add parent directory to path to allow importing from sibling packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai_integration.analyzer.skills_matcher import SkillsMatcher
from ai_integration.generator.resume_generator import ResumeGenerator
from ai_integration.generator.cover_letter_generator import CoverLetterGenerator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_resume(resume_path: str) -> str:
    """
    Load a resume from a file.
    
    Args:
        resume_path: Path to the resume file.
        
    Returns:
        The resume content as a string.
    """
    with open(resume_path, 'r') as f:
        return f.read()

def load_job_description_from_csv(csv_path: str, job_id: Optional[str] = None) -> str:
    """
    Load a job description from a CSV file.
    
    Args:
        csv_path: Path to the CSV file.
        job_id: Optional job ID to filter by. If not provided, uses the first job.
        
    Returns:
        The job description as a string.
    """
    # Load the CSV
    df = pd.read_csv(csv_path)
    
    # If job_id is provided, filter by it
    if job_id:
        # Check if the job_id is in the URL
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
            raise ValueError(f"Job ID {job_id} not found in CSV")
        
        # Get the job description
        job_description = job_df.iloc[0]['Description']
    else:
        # Use the first job with a non-empty description
        job_df = df[df['Description'].notna() & (df['Description'] != '')]
        
        if job_df.empty:
            raise ValueError("No jobs with descriptions found in CSV")
        
        job_description = job_df.iloc[0]['Description']
    
    return job_description

def load_resume_template(template_path: str) -> Dict[str, Any]:
    """
    Load a resume template from a JSON file.
    
    Args:
        template_path: Path to the template file.
        
    Returns:
        The template data as a dictionary.
    """
    with open(template_path, 'r') as f:
        return json.load(f)

def save_updated_template(template_data: Dict[str, Any], output_path: str) -> None:
    """
    Save an updated template to a JSON file.
    
    Args:
        template_data: The template data to save.
        output_path: Path to save the template to.
    """
    with open(output_path, 'w') as f:
        json.dump(template_data, f, indent=2)

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description='GPT Integration Demo')
    parser.add_argument('--resume', required=True, help='Path to the resume file')
    parser.add_argument('--jobs-csv', required=True, help='Path to the jobs CSV file')
    parser.add_argument('--job-id', help='Optional job ID to use')
    parser.add_argument('--template', help='Path to the resume template JSON file')
    parser.add_argument('--output', help='Path to save the updated template JSON file')
    parser.add_argument('--cover-letter', help='Path to save the generated cover letter')
    
    args = parser.parse_args()
    
    try:
        # Load the resume
        logger.info(f"Loading resume from {args.resume}")
        resume_content = load_resume(args.resume)
        
        # Load the job description
        logger.info(f"Loading job description from {args.jobs_csv}")
        job_description = load_job_description_from_csv(args.jobs_csv, args.job_id)
        
        # Create a skills matcher
        skills_matcher = SkillsMatcher()
        
        # Match the resume to the job description
        logger.info("Matching resume to job description")
        match_result = skills_matcher.match_resume_to_job(resume_content, job_description)
        
        # Print the match result
        print("\n==== MATCH RESULT ====")
        print(f"Summary: {match_result.get('summary', '')}")
        print("\nSkills to emphasize:")
        for skill in match_result.get('skills_to_emphasize', []):
            print(f"- {skill}")
        
        print("\nUpdated jobs:")
        for job in match_result.get('updated_jobs', []):
            print(f"\nCompany: {job.get('company', '')}")
            print(f"Location: {job.get('location', '')}")
            print(f"Title: {job.get('title', '')}")
            print(f"Dates: {job.get('dates', '')}")
            print(f"Description: {job.get('description', '')}")
        
        # If a template path is provided, update the template
        if args.template:
            logger.info(f"Loading resume template from {args.template}")
            template_data = load_resume_template(args.template)
            
            # Create a resume generator
            resume_generator = ResumeGenerator()
            
            # Update the template
            logger.info("Updating resume template")
            updated_template = resume_generator.update_resume_template(
                template_data=template_data,
                job_description=job_description,
                resume_text=resume_content
            )
            
            # Save the updated template if an output path is provided
            if args.output:
                logger.info(f"Saving updated template to {args.output}")
                save_updated_template(updated_template, args.output)
        
        # If a cover letter path is provided, generate a cover letter
        if args.cover_letter:
            logger.info("Generating cover letter")
            cover_letter_generator = CoverLetterGenerator()
            cover_letter = cover_letter_generator.generate_cover_letter(resume_content, job_description)
            
            logger.info(f"Saving cover letter to {args.cover_letter}")
            cover_letter_generator.save_cover_letter(cover_letter, args.cover_letter)
            
            print("\n==== COVER LETTER ====")
            print(cover_letter)
        
        logger.info("Demo completed successfully")
        
    except Exception as e:
        logger.error(f"Error in demo: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
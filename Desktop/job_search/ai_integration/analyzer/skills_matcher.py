"""
Skills Matcher

This module provides functionality to match resume skills with job requirements.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple

from ai_integration.openai_client import openai_client
from config.openai_config import RESUME_JOB_MATCHING_PROMPT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SkillsMatcher:
    """Matches resume skills with job requirements."""
    
    def __init__(self, client=None):
        """
        Initialize the skills matcher.
        
        Args:
            client: OpenAI client to use. If not provided, uses the default.
        """
        self.client = client or openai_client
    
    def match_resume_to_job(
        self, 
        resume_content: str, 
        job_description: str,
        job_title: Optional[str] = None,
        company: Optional[str] = None,
        job_id: Optional[str] = "JobID123",
        template_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Match a resume to a job description.
        
        Args:
            resume_content: The resume content in text format.
            job_description: The job description text.
            job_title: Optional job title to use in application_info.
            company: Optional company name to use in application_info.
            job_id: Optional job ID to use in application_info.
            
        Returns:
            A dictionary containing match results in core_template.json format.
        """
        logger.info("Matching resume to job description")
        
        # Load existing template if provided, otherwise use resume content directly
        template_content = resume_content
        if template_path and os.path.exists(template_path):
            try:
                with open(template_path, 'r') as f:
                    template_data = json.load(f)
                    # Update application info with provided values
                    if 'application_info' in template_data:
                        if job_title:
                            template_data['application_info']['role'] = job_title
                        if company:
                            template_data['application_info']['company'] = company
                        if job_id:
                            template_data['application_info']['id'] = job_id
                    # Convert template to string for prompt
                    template_content = json.dumps(template_data, indent=2)
                    logger.info(f"Loaded existing template from {template_path}")
            except Exception as e:
                logger.error(f"Error loading template: {str(e)}")
                # Fall back to resume content if template loading fails
                template_content = resume_content
        
        # Add job information to the prompt if available
        job_info = ""
        if job_title:
            job_info += f"\nJOB TITLE: {job_title}"
        if company:
            job_info += f"\nCOMPANY: {company}"
        if job_id:
            job_info += f"\nJOB ID: {job_id}"
        
        prompt = RESUME_JOB_MATCHING_PROMPT.format(
            resume_content=template_content,
            job_description=job_description + job_info
        )
        
        try:
            result = self.client.generate_json(
                prompt=prompt,
                system_message="You are a skilled resume writer that helps tailor resumes to specific job descriptions. Always output in valid JSON format exactly matching the core_template.json structure."
            )
            
            # Ensure the application_info is correctly set
            if "application_info" not in result and (job_title or company):
                result["application_info"] = {}
                if company:
                    result["application_info"]["company"] = company
                if job_title:
                    result["application_info"]["role"] = job_title
                if job_id:
                    result["application_info"]["id"] = job_id
            
            logger.info("Resume matching complete")
            return result
        except Exception as e:
            logger.error(f"Error matching resume to job: {str(e)}")
            raise
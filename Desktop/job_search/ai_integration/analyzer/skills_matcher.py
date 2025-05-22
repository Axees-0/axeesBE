"""
Skills Matcher

This module provides functionality to match resume skills with job requirements.
"""

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
        job_description: str
    ) -> Dict[str, Any]:
        """
        Match a resume to a job description.
        
        Args:
            resume_content: The resume content in text format.
            job_description: The job description text.
            
        Returns:
            A dictionary containing match results and suggested updates.
        """
        logger.info("Matching resume to job description")
        
        prompt = RESUME_JOB_MATCHING_PROMPT.format(
            resume_content=resume_content,
            job_description=job_description
        )
        
        try:
            result = self.client.generate_json(
                prompt=prompt,
                system_message="You are a skilled resume writer that helps tailor resumes to specific job descriptions."
            )
            
            logger.info("Resume matching complete")
            return result
        except Exception as e:
            logger.error(f"Error matching resume to job: {str(e)}")
            raise
    
    def get_updated_jobs(
        self, 
        resume_content: str, 
        job_description: str
    ) -> List[Dict[str, str]]:
        """
        Get updated job entries for a resume based on a job description.
        
        Args:
            resume_content: The resume content in text format.
            job_description: The job description text.
            
        Returns:
            A list of updated job entries.
        """
        match_result = self.match_resume_to_job(resume_content, job_description)
        return match_result.get("updated_jobs", [])
    
    def get_skills_to_emphasize(
        self, 
        resume_content: str, 
        job_description: str
    ) -> List[str]:
        """
        Get skills to emphasize based on a job description.
        
        Args:
            resume_content: The resume content in text format.
            job_description: The job description text.
            
        Returns:
            A list of skills to emphasize.
        """
        match_result = self.match_resume_to_job(resume_content, job_description)
        return match_result.get("skills_to_emphasize", [])
    
    def get_match_summary(
        self, 
        resume_content: str, 
        job_description: str
    ) -> str:
        """
        Get a summary of the match between a resume and job description.
        
        Args:
            resume_content: The resume content in text format.
            job_description: The job description text.
            
        Returns:
            A summary of the match.
        """
        match_result = self.match_resume_to_job(resume_content, job_description)
        return match_result.get("summary", "")
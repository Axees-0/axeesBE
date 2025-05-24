"""
Job Analyzer

This module provides functionality to analyze job descriptions using AI.
"""

import logging
from typing import Dict, Any, List, Optional

from ai_integration.openai_client import openai_client
from config.openai_config import JOB_ANALYSIS_PROMPT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class JobAnalyzer:
    """Analyzes job descriptions to extract key information."""
    
    def __init__(self, client=None):
        """
        Initialize the job analyzer.
        
        Args:
            client: OpenAI client to use. If not provided, uses the default.
        """
        self.client = client or openai_client
    
    def analyze_job_description(self, job_description: str) -> Dict[str, Any]:
        """
        Analyze a job description to extract key information.
        
        Args:
            job_description: The job description text.
            
        Returns:
            A dictionary containing extracted information.
        """
        logger.info("Analyzing job description")
        
        prompt = JOB_ANALYSIS_PROMPT.format(job_description=job_description)
        
        try:
            result = self.client.generate_json(
                prompt=prompt,
                system_message="You are a skilled job market analyst that extracts structured information from job descriptions."
            )
            
            logger.info("Job analysis complete")
            return result
        except Exception as e:
            logger.error(f"Error analyzing job description: {str(e)}")
            raise
    
    def extract_required_skills(self, job_description: str) -> List[str]:
        """
        Extract required skills from a job description.
        
        Args:
            job_description: The job description text.
            
        Returns:
            A list of required skills.
        """
        analysis = self.analyze_job_description(job_description)
        return analysis.get("required_skills", [])
    
    def extract_preferred_skills(self, job_description: str) -> List[str]:
        """
        Extract preferred/nice-to-have skills from a job description.
        
        Args:
            job_description: The job description text.
            
        Returns:
            A list of preferred skills.
        """
        analysis = self.analyze_job_description(job_description)
        return analysis.get("preferred_skills", [])
    
    def extract_key_responsibilities(self, job_description: str) -> List[str]:
        """
        Extract key responsibilities from a job description.
        
        Args:
            job_description: The job description text.
            
        Returns:
            A list of key responsibilities.
        """
        analysis = self.analyze_job_description(job_description)
        return analysis.get("key_responsibilities", [])
    
    def extract_keywords(self, job_description: str) -> List[str]:
        """
        Extract industry-specific terminology and keywords from a job description.
        
        Args:
            job_description: The job description text.
            
        Returns:
            A list of keywords.
        """
        analysis = self.analyze_job_description(job_description)
        return analysis.get("keywords", [])
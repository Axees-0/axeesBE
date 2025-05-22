"""
Resume Generator

This module provides functionality to generate optimized resume content.
"""

import json
import logging
from typing import Dict, Any, List, Optional

from ai_integration.openai_client import openai_client
from ai_integration.analyzer.skills_matcher import SkillsMatcher

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ResumeGenerator:
    """Generates optimized resume content."""
    
    def __init__(self, client=None):
        """
        Initialize the resume generator.
        
        Args:
            client: OpenAI client to use. If not provided, uses the default.
        """
        self.client = client or openai_client
        self.skills_matcher = SkillsMatcher(client)
    
    def generate_optimized_resume(
        self, 
        resume_content: str, 
        job_description: str
    ) -> Dict[str, Any]:
        """
        Generate an optimized resume based on a job description.
        
        Args:
            resume_content: The resume content in text format.
            job_description: The job description text.
            
        Returns:
            A dictionary containing the optimized resume content in core_template.json format.
        """
        logger.info("Generating optimized resume")
        
        # Use the skills matcher to get updated job entries in core_template.json format
        match_result = self.skills_matcher.match_resume_to_job(
            resume_content=resume_content,
            job_description=job_description
        )
        
        return match_result
    
    def update_resume_template(
        self, 
        template_data: Dict[str, Any], 
        job_description: str,
        resume_text: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update a resume template with optimized content.
        
        Args:
            template_data: The current resume template data.
            job_description: The job description text.
            resume_text: Optional plain text version of the resume. If not provided,
                         a text representation will be generated from template_data.
            
        Returns:
            The updated template data.
        """
        logger.info("Updating resume template with optimized content")
        
        # If resume_text is not provided, generate it from template_data
        if resume_text is None:
            resume_text = self._generate_resume_text(template_data)
        
        # Generate optimized resume content - this will now be in core_template.json format
        updated_template = self.generate_optimized_resume(
            resume_content=resume_text,
            job_description=job_description
        )
        
        # The result should already be in the correct format for core_template.json
        return updated_template
    
    def _generate_resume_text(self, template_data: Dict[str, Any]) -> str:
        """
        Generate a plain text representation of a resume from template data.
        
        Args:
            template_data: The resume template data.
            
        Returns:
            A plain text representation of the resume.
        """
        resume_text = []
        
        # Add company entries
        for key, details in template_data.items():
            # Skip non-job entries
            if key == "application_info":
                continue
                
            if isinstance(details, dict) and "company" in details:
                company_name = details.get("company", "")
                location = details.get("location", "")
                title = details.get("title", "")
                dates = details.get("dates", "")
                description = details.get("description", "")
                
                resume_text.append(f"{company_name}, {location} — {title}")
                resume_text.append(f"{dates}")
                resume_text.append(f"{description}")
                resume_text.append("")
        
        return "\n".join(resume_text)
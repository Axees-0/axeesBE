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
            A dictionary containing the optimized resume content.
        """
        logger.info("Generating optimized resume")
        
        # Use the skills matcher to get updated job entries
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
        
        # Generate optimized resume content
        optimized_resume = self.generate_optimized_resume(
            resume_content=resume_text,
            job_description=job_description
        )
        
        # Update the template data with the optimized content
        updated_template = template_data.copy()
        
        # Update job entries
        for updated_job in optimized_resume.get("updated_jobs", []):
            company_name = updated_job.get("company")
            if company_name in updated_template:
                # Update existing job entry
                job_entry = updated_template[company_name]
                if "title" in updated_job:
                    job_entry["title"] = updated_job["title"]
                if "description" in updated_job:
                    job_entry["description"] = updated_job["description"]
        
        # Add skills to emphasize and summary as metadata
        if "application_info" not in updated_template:
            updated_template["application_info"] = {}
        
        updated_template["application_info"]["skills_to_emphasize"] = optimized_resume.get("skills_to_emphasize", [])
        updated_template["application_info"]["match_summary"] = optimized_resume.get("summary", "")
        
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
        
        # Add header if available
        if "header" in template_data:
            header = template_data["header"]
            resume_text.append(f"{header.get('name', '')}")
            resume_text.append(f"{header.get('email', '')} | {header.get('phone', '')}")
            resume_text.append(f"{header.get('location', '')}")
            resume_text.append("")
        
        # Add summary if available
        if "summary" in template_data:
            resume_text.append("SUMMARY")
            resume_text.append(template_data["summary"])
            resume_text.append("")
        
        # Add experience
        resume_text.append("EXPERIENCE")
        
        # Process each job entry
        for company, details in template_data.items():
            # Skip non-job entries
            if company in ["application_info", "header", "summary", "education", "skills"]:
                continue
            
            company_name = details.get("company", company)
            location = details.get("location", "")
            title = details.get("title", "")
            dates = details.get("dates", "")
            description = details.get("description", "")
            
            resume_text.append(f"{company_name}, {location} — {title}")
            resume_text.append(f"{dates}")
            resume_text.append(f"{description}")
            resume_text.append("")
        
        # Add education if available
        if "education" in template_data:
            resume_text.append("EDUCATION")
            for edu in template_data["education"]:
                resume_text.append(f"{edu.get('institution', '')}, {edu.get('location', '')}")
                resume_text.append(f"{edu.get('degree', '')}, {edu.get('dates', '')}")
                resume_text.append("")
        
        # Add skills if available
        if "skills" in template_data:
            resume_text.append("SKILLS")
            resume_text.append(", ".join(template_data["skills"]))
        
        return "\n".join(resume_text)
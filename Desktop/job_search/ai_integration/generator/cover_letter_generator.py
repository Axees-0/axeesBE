"""
Cover Letter Generator

This module provides functionality to generate custom cover letters.
"""

import logging
from typing import Dict, Any, Optional

from ai_integration.openai_client import openai_client
from config.openai_config import COVER_LETTER_PROMPT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CoverLetterGenerator:
    """Generates custom cover letters."""
    
    def __init__(self, client=None):
        """
        Initialize the cover letter generator.
        
        Args:
            client: OpenAI client to use. If not provided, uses the default.
        """
        self.client = client or openai_client
    
    def generate_cover_letter(
        self, 
        resume_content: str, 
        job_description: str
    ) -> str:
        """
        Generate a cover letter based on a resume and job description.
        
        Args:
            resume_content: The resume content in text format.
            job_description: The job description text.
            
        Returns:
            The generated cover letter.
        """
        logger.info("Generating cover letter")
        
        prompt = COVER_LETTER_PROMPT.format(
            resume_content=resume_content,
            job_description=job_description
        )
        
        try:
            result = self.client.generate_text(
                prompt=prompt,
                system_message="You are a professional cover letter writer that creates tailored, compelling cover letters."
            )
            
            logger.info("Cover letter generation complete")
            return result
        except Exception as e:
            logger.error(f"Error generating cover letter: {str(e)}")
            raise
    
    def save_cover_letter(
        self, 
        cover_letter: str, 
        output_path: str
    ) -> None:
        """
        Save a cover letter to a file.
        
        Args:
            cover_letter: The cover letter text.
            output_path: The path to save the cover letter to.
        """
        logger.info(f"Saving cover letter to {output_path}")
        
        try:
            with open(output_path, "w") as f:
                f.write(cover_letter)
            
            logger.info("Cover letter saved successfully")
        except Exception as e:
            logger.error(f"Error saving cover letter: {str(e)}")
            raise
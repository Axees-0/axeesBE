"""
Job Prompts

This module provides templates for job-related prompts.
"""

# Prompt for analyzing a job description
JOB_ANALYSIS_PROMPT = """
Please analyze the following job description and extract key information:

JOB DESCRIPTION:
{job_description}

Please provide:
1. A list of required skills and qualifications
2. A list of preferred/nice-to-have skills
3. Key responsibilities of the role
4. Company values and culture indicators
5. Industry-specific terminology and keywords

Format your response as JSON with the following structure:
{{
  "required_skills": ["Skill 1", "Skill 2", ...],
  "preferred_skills": ["Skill 1", "Skill 2", ...],
  "key_responsibilities": ["Responsibility 1", "Responsibility 2", ...],
  "company_values": ["Value 1", "Value 2", ...],
  "keywords": ["Keyword 1", "Keyword 2", ...]
}}
"""

# Prompt for extracting job requirements
JOB_REQUIREMENTS_PROMPT = """
From the job description below, please extract and categorize all requirements:

JOB DESCRIPTION:
{job_description}

Please categorize the requirements into:
1. Education requirements
2. Experience requirements (years and types)
3. Technical skills required
4. Soft skills required
5. Certifications required
6. Any other specific requirements

Format your response as JSON with clear categories.
"""

# Prompt for identifying company culture
COMPANY_CULTURE_PROMPT = """
Please analyze the following job description and identify indicators of company culture:

JOB DESCRIPTION:
{job_description}

Analyze the text for:
1. Stated company values
2. Work environment descriptions
3. Team dynamics mentioned
4. Management style indicators
5. Work-life balance clues
6. Diversity and inclusion statements

Format your response as JSON with these categories, including direct quotes where relevant.
"""

# Prompt for salary range estimation
SALARY_RANGE_PROMPT = """
Based on the job description below, please estimate a reasonable salary range:

JOB DESCRIPTION:
{job_description}

JOB TITLE: {job_title}
LOCATION: {location}
INDUSTRY: {industry}

Please consider:
1. The seniority level of the position
2. Required skills and experience
3. Industry standards
4. Location factors
5. Company size (if indicated)

Provide your estimation as a range with supporting reasoning.
"""
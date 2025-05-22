"""
Resume Prompts

This module provides templates for resume-related prompts.
"""

# Prompt for tailoring a resume to a job description
RESUME_TAILORING_PROMPT = """
Please analyze the following resume and job description:

RESUME:
{resume_content}

JOB DESCRIPTION:
{job_description}

Based on the job description, please:
1. Identify which job experiences from the resume are most relevant
2. Suggest revisions to job titles and descriptions to better align with the target role
3. Highlight specific skills that should be emphasized
4. Recommend any additional changes to make the resume more effective for this position

Your suggestions should maintain truthfulness while optimizing how the experience is presented.

Format your response as JSON with the following structure:
{{
  "updated_jobs": [
    {{
      "company": "Original Company Name",
      "location": "Original Location",
      "title": "Updated Job Title",
      "dates": "Original Date Range",
      "description": "Updated job description with better matching keywords and focus areas."
    }},
    ...
  ],
  "skills_to_emphasize": ["Skill 1", "Skill 2", "Skill 3"],
  "summary": "Brief analysis of the changes made and why they better match the job description."
}}
"""

# Prompt for generating a skills section
SKILLS_SECTION_PROMPT = """
Based on the resume content and job description below, please generate an optimized skills section.

RESUME:
{resume_content}

JOB DESCRIPTION:
{job_description}

Create a comprehensive list of skills that:
1. Accurately reflects the candidate's actual skills based on their experience
2. Highlights skills that are most relevant to the target position
3. Includes both technical and soft skills where appropriate
4. Organizes skills in a logical way (e.g., by category or importance)

Format your response as a JSON object with categorized skills.
"""

# Prompt for generating a resume summary
SUMMARY_PROMPT = """
Please create a powerful professional summary for a resume based on the following information:

RESUME CONTENT:
{resume_content}

TARGET JOB DESCRIPTION:
{job_description}

Create a concise, impactful summary that:
1. Highlights the candidate's most relevant experience and skills
2. Aligns with the target position's requirements
3. Showcases the candidate's unique value proposition
4. Is approximately 2-4 sentences in length
5. Uses active, engaging language

The summary should be truthful to the candidate's actual experience while optimized for the target role.
"""
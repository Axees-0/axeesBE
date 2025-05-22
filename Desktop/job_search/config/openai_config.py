"""
OpenAI API Configuration

This module contains configuration settings for the OpenAI API integration.
"""

# API Configuration
OPENAI_API_KEY = "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"
OPENAI_ORG_ID = ""  # Leave empty if not using an organization

# Model Configuration
DEFAULT_MODEL = "gpt-4o"  # Default model to use
DEFAULT_TEMPERATURE = 0.1  # Lower temperature for more deterministic outputs
MAX_TOKENS = 4000  # Maximum tokens for response
TIMEOUT_SECONDS = 60  # API request timeout

# Retry Configuration
MAX_RETRIES = 3  # Maximum number of retries for API calls
RETRY_DELAY = 2  # Initial delay between retries (in seconds)
RETRY_BACKOFF = 2  # Backoff factor for retry delay

# Rate Limiting
REQUESTS_PER_MINUTE = 15  # Maximum requests per minute
ENFORCE_RATE_LIMIT = True  # Whether to enforce rate limiting

# Prompt Templates
RESUME_JOB_MATCHING_PROMPT = """
Below is a resume followed by a job description. Please update the resume to better match the job's focus, while remaining truthful to the underlying experience. Output the result as a JSON object matching EXACTLY the core_template.json format shown.

RESUME:
{resume_content}

JOB DESCRIPTION:
{job_description}

CORE_TEMPLATE FORMAT:
{{
  "application_info": {{
    "company": "Target Company Name",
    "role": "Position Title",
    "id": "JobID123"
  }},
  "Company1": {{
    "company": "Company Name",
    "location": "Location",
    "title": "Job Title",
    "dates": "Start Date - End Date",
    "description": "Job description paragraph focusing on relevant experience."
  }},
  "Company2": {{
    "company": "Company Name",
    "location": "Location",
    "title": "Job Title",
    "dates": "Start Date - End Date",
    "description": "Job description paragraph focusing on relevant experience."
  }},
  ... and so on for each company
}}

IMPORTANT:
1. Use the EXACT format of core_template.json with CompanyN keys
2. Maintain the original company names, locations, and date ranges
3. Only modify job titles and descriptions to better match the job requirements
4. Keep the exact same number of company entries
5. Ensure descriptions are concise, focused on relevant experience, and truthful
6. Fill in the application_info section with the target job details

Output a JSON object matching this exact structure. Do not include any explanations or notes outside the JSON.
"""

JOB_ANALYSIS_PROMPT = """
Please analyze the following job description and extract key information.

JOB DESCRIPTION:
{job_description}

Please provide:
1. A list of required skills and qualifications
2. A list of preferred/nice-to-have skills
3. Key responsibilities of the role
4. Company values and culture indicators
5. Industry-specific terminology and keywords

Output as a structured JSON object.
"""

COVER_LETTER_PROMPT = """
Please generate a professional cover letter for the following job description, using my resume information.

JOB DESCRIPTION:
{job_description}

MY RESUME INFORMATION:
{resume_content}

The cover letter should:
1. Be professionally formatted with appropriate greeting and closing
2. Reference 2-3 specific elements from my resume that match key requirements
3. Demonstrate knowledge of the company's industry or specific challenges
4. Express enthusiasm for the role
5. Keep to approximately 350-400 words

Please craft a compelling letter that highlights my relevant experience while matching the job description's tone and requirements.
"""
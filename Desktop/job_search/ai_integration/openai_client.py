"""
OpenAI Client

This module provides a client for interacting with the OpenAI API.
"""

import os
import time
import json
import logging
from typing import Dict, Any, List, Optional, Union
import openai
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from config.openai_config import (
    OPENAI_API_KEY,
    OPENAI_ORG_ID,
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    MAX_TOKENS,
    TIMEOUT_SECONDS,
    MAX_RETRIES,
    RETRY_DELAY,
    RETRY_BACKOFF,
    ENFORCE_RATE_LIMIT,
    REQUESTS_PER_MINUTE
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class OpenAIClient:
    """Client for interacting with the OpenAI API."""
    
    def __init__(self, api_key: Optional[str] = None, org_id: Optional[str] = None):
        """
        Initialize the OpenAI client.
        
        Args:
            api_key: OpenAI API key. If not provided, uses the value from config.
            org_id: OpenAI organization ID. If not provided, uses the value from config.
        """
        self.api_key = api_key or OPENAI_API_KEY
        self.org_id = org_id or OPENAI_ORG_ID
        
        # Configure the OpenAI client
        self.client = OpenAI(
            api_key=self.api_key,
            organization=self.org_id if self.org_id else None,
            timeout=TIMEOUT_SECONDS
        )
        
        # Track request timestamps for rate limiting
        self._request_timestamps = []
    
    def _enforce_rate_limit(self):
        """
        Enforce rate limiting to prevent API abuse.
        
        This method tracks request timestamps and delays if too many requests
        have been made in the last minute.
        """
        if not ENFORCE_RATE_LIMIT:
            return
            
        # Remove timestamps older than 1 minute
        current_time = time.time()
        self._request_timestamps = [
            ts for ts in self._request_timestamps 
            if current_time - ts < 60
        ]
        
        # If we've hit the rate limit, sleep until we can make another request
        if len(self._request_timestamps) >= REQUESTS_PER_MINUTE:
            sleep_time = 60 - (current_time - self._request_timestamps[0]) + 0.1
            if sleep_time > 0:
                logger.info(f"Rate limit reached. Sleeping for {sleep_time:.2f} seconds")
                time.sleep(sleep_time)
        
        # Add current timestamp
        self._request_timestamps.append(time.time())
    
    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=RETRY_DELAY, min=RETRY_DELAY, max=RETRY_DELAY * RETRY_BACKOFF ** MAX_RETRIES)
    )
    def create_chat_completion(
        self, 
        messages: List[Dict[str, str]],
        model: str = DEFAULT_MODEL,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = MAX_TOKENS,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Create a chat completion using the OpenAI API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'.
            model: The model to use for completion.
            temperature: Sampling temperature (0-1).
            max_tokens: Maximum tokens to generate.
            **kwargs: Additional parameters to pass to the API.
            
        Returns:
            The API response.
        """
        self._enforce_rate_limit()
        
        try:
            logger.info(f"Sending request to OpenAI API using model {model}")
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            return response
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            raise
    
    def generate_text(
        self, 
        prompt: str,
        system_message: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = MAX_TOKENS,
        **kwargs
    ) -> str:
        """
        Generate text using a prompt.
        
        Args:
            prompt: The user prompt.
            system_message: Optional system message to guide the model.
            model: The model to use.
            temperature: Sampling temperature (0-1).
            max_tokens: Maximum tokens to generate.
            **kwargs: Additional parameters to pass to the API.
            
        Returns:
            The generated text.
        """
        messages = []
        
        if system_message:
            messages.append({"role": "system", "content": system_message})
            
        messages.append({"role": "user", "content": prompt})
        
        response = self.create_chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )
        
        return response.choices[0].message.content
    
    def generate_json(
        self, 
        prompt: str,
        system_message: Optional[str] = "You are a helpful assistant that always responds in JSON format.",
        model: str = DEFAULT_MODEL,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = MAX_TOKENS,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate a JSON response.
        
        Args:
            prompt: The user prompt.
            system_message: System message to guide the model.
            model: The model to use.
            temperature: Sampling temperature (0-1).
            max_tokens: Maximum tokens to generate.
            **kwargs: Additional parameters to pass to the API.
            
        Returns:
            The parsed JSON response.
        """
        response_text = self.generate_text(
            prompt=prompt,
            system_message=system_message,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
            **kwargs
        )
        
        try:
            return json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON response: {str(e)}")
            logger.error(f"Response text: {response_text}")
            raise ValueError(f"Failed to parse JSON response: {str(e)}")


# Singleton instance for easy import
openai_client = OpenAIClient()
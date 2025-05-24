#!/bin/bash

# Prompt for job title
echo "Enter the job title:"
read -r job_title

# Check if job title is empty
if [ -z "$job_title" ]; then
    echo "Error: Job title cannot be empty"
    exit 1
fi

# Prompt for job description
echo "Enter the job description (what would you like Claude to help with?):"
read -r job_description

# Check if job description is empty
if [ -z "$job_description" ]; then
    echo "Error: Job description cannot be empty"
    exit 1
fi

# Rename terminal title
echo -ne "\033]0;$job_title\007"

# Start claude with the job description
echo "Starting Claude for job: $job_title"
echo "Terminal title set to: $job_title"
echo ""

/Users/Mike/.claude/local/claude --dangerously-skip-permissions "$job_description"
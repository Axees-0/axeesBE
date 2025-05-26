#!/bin/bash

# Set up trap to handle Ctrl+C gracefully
trap 'echo -e "\n\nScript interrupted. Exiting..."; exit 1' INT TERM

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

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    # Not in a git repo - initialize one and work here
    echo ""
    echo "Current directory is not a git repository."
    echo "Initializing a new git repository in $(pwd)..."
    git init
    
    # Create initial .gitignore
    cat > .gitignore << 'GITIGNORE_EOF'
# Claude job info
.claude-job-info.md

# OS files
.DS_Store
Thumbs.db

# Editor directories
.vscode/
.idea/

# Dependencies
node_modules/
venv/
__pycache__/
*.pyc

# Environment files
.env
.env.local
GITIGNORE_EOF
    
    git add .gitignore
    git commit -m "Initial commit" 2>/dev/null || true
    
    echo ""
    echo "Working in current directory: $(pwd)"
    
    # Create a job info file in current directory
    cat > .claude-job-info.md << EOF
# Claude Job: $job_title

## Description
$job_description

## Working Directory
$(pwd)

## Created
$(date)

## Mode
Working in newly initialized git repository
EOF

else
    # We're in a git repo - create a worktree automatically
    echo ""
    echo "Git repository detected. Creating a new worktree..."
    
    # Create a sanitized branch name from job title
    # Replace spaces with hyphens and remove special characters
    branch_name=$(echo "$job_title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

    # Add timestamp to make branch name unique
    timestamp=$(date +"%Y%m%d_%H%M%S")
    branch_name="${branch_name}-${timestamp}"

    # Get the root of the current git repository
    GIT_ROOT=$(git rev-parse --show-toplevel)

    # Set base directory for worktrees
    # Default to a .worktrees directory inside the git root (avoids permission issues)
    WORKTREE_BASE="${CLAUDE_WORKTREE_BASE:-$GIT_ROOT/.worktrees}"

    # Create worktree base directory if it doesn't exist
    if ! mkdir -p "$WORKTREE_BASE" 2>/dev/null; then
        echo "Error: Cannot create worktree directory at $WORKTREE_BASE"
        echo "Please set CLAUDE_WORKTREE_BASE to a writable directory or check permissions."
        exit 1
    fi

    # Create worktree directory path
    worktree_dir="$WORKTREE_BASE/$branch_name"

    # Create a new git worktree with a new branch
    echo "Creating new git worktree: $worktree_dir"
    echo "Creating new branch: $branch_name"

    # Create the worktree with a new branch based on main/master
    if git show-ref --verify --quiet refs/heads/main; then
        git worktree add -b "$branch_name" "$worktree_dir" main || { echo "Error: Failed to create worktree"; exit 1; }
    elif git show-ref --verify --quiet refs/heads/master; then
        git worktree add -b "$branch_name" "$worktree_dir" master || { echo "Error: Failed to create worktree"; exit 1; }
    else
        # Fall back to current branch
        git worktree add -b "$branch_name" "$worktree_dir" || { echo "Error: Failed to create worktree"; exit 1; }
    fi

    # Stay in the main repository (don't cd to worktree)
    echo "Staying in main repository for full git access: $GIT_ROOT"
    
    # Update the job description to include worktree focus
    job_description="$job_description

IMPORTANT: While you have full access to the main repository for git operations, please focus your work on the worktree directory at: $worktree_dir

This worktree contains branch: $branch_name

You should:
- Make all code changes in the worktree directory: $worktree_dir
- Use the main repository location for git operations like merging, branch management, etc.
- The worktree is already checked out to branch: $branch_name"

    # Create a job info file in the worktree
    cat > "$worktree_dir/.claude-job-info.md" << EOF
# Claude Job: $job_title

## Description
$job_description

## Branch
$branch_name

## Created
$(date)

## Worktree Location
$worktree_dir

## To merge back to main:
\`\`\`bash
# From this worktree:
git add .
git commit -m "Your commit message"
git push -u origin $branch_name

# Then create a PR or merge directly:
git checkout main
git merge $branch_name
git push

# Optional: Remove worktree when done
git worktree remove "$worktree_dir"
\`\`\`
EOF

    # Commit the job info file in the worktree
    (cd "$worktree_dir" && git add .claude-job-info.md && git commit -m "Start Claude job: $job_title" 2>/dev/null || true)
    
    # Also create a reference file in the main repo
    cat > .claude-current-worktree << EOF
Current worktree: $worktree_dir
Branch: $branch_name
Created: $(date)
Job: $job_title
EOF
fi

# Rename terminal title
echo -ne "\033]0;$job_title\007"

# Configure claude settings
echo "Configuring Claude settings..."
claude config add allowedTools "*"
claude config set hasTrustDialogAccepted true

# Start claude with the job description
echo "Starting Claude for job: $job_title"
echo "Terminal title set to: $job_title"
echo "Worktree created at: $worktree_dir"
echo ""

/Users/Mike/.claude/local/claude --dangerously-skip-permissions "$job_description"
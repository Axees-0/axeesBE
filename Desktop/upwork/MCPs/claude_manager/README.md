# Claude Job MCP

Minimal MCP server for job management in Claude.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add to your Claude MCP settings:
   ```json
   {
     "mcpServers": {
       "job": {
         "command": "node",
         "args": ["/Users/Mike/Desktop/upwork/MCPs/claude_manager/index.js"]
       }
     }
   }
   ```

## Usage

In Claude CLI, type:
```
new job: Developer | Fix login bug
```

This will:
- Set your terminal title to "Developer"
- Send the task "Fix login bug" to Claude for processing

## How it works

The MCP server:
1. Parses the command format: `new job: title | description`
2. Updates your current terminal's title
3. Returns the job context to Claude
4. Claude continues processing in the same conversation
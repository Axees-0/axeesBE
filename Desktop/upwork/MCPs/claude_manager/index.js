#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "claude-job",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {}
  }
});

// Tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "new_job",
    description: "Set job: 'new job: title | description'",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string" }
      },
      required: ["input"]
    }
  }]
}));

// Tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "new_job") {
    const input = request.params.arguments.input;
    const match = input.match(/new job:\s*([^|]+)\|\s*(.+)/i);
    
    if (!match) {
      return {
        content: [{
          type: "text",
          text: "Error: Invalid format. Use: new job: title | description"
        }]
      };
    }
    
    const title = match[1].trim();
    const description = match[2].trim();
    
    // Update terminal title
    process.stdout.write(`\x1b]0;${title}\x07`);
    
    return {
      content: [{
        type: "text",
        text: `Job: ${title}\nTask: ${description}`
      }]
    };
  }
  
  return {
    content: [{
      type: "text",
      text: "Unknown tool"
    }]
  };
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
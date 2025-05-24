#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer, { Browser, Page } from 'puppeteer';
import { WorkflowEngine } from './workflow-engine.js';
import { WorkflowParser } from './parsers/workflow-parser.js';
import { WorkflowValidator } from './validators/workflow-validator.js';

interface BrowserContext {
  browser?: Browser;
  page?: Page;
}

const browserContext: BrowserContext = {};
const workflowEngine = new WorkflowEngine();

const server = new Server(
  {
    name: 'puppeteer-test-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'execute_workflow',
      description: 'Execute a complete test workflow with steps, assertions, and reporting',
      inputSchema: {
        type: 'object',
        properties: {
          workflow: {
            type: 'string',
            description: 'The workflow definition as JSON or YAML string',
          },
          workflowPath: {
            type: 'string',
            description: 'Path to a workflow file (alternative to workflow string)',
          },
          format: {
            type: 'string',
            enum: ['json', 'yaml', 'auto'],
            description: 'Format of the workflow definition',
            default: 'auto',
          },
          reportFormat: {
            type: 'string',
            enum: ['markdown', 'json'],
            description: 'Format for the test report',
            default: 'markdown',
          },
        },
        oneOf: [
          { required: ['workflow'] },
          { required: ['workflowPath'] }
        ],
      },
    },
    {
      name: 'validate_workflow',
      description: 'Validate a workflow definition without executing it',
      inputSchema: {
        type: 'object',
        properties: {
          workflow: {
            type: 'string',
            description: 'The workflow definition to validate',
          },
          format: {
            type: 'string',
            enum: ['json', 'yaml', 'auto'],
            description: 'Format of the workflow definition',
            default: 'auto',
          },
        },
        required: ['workflow'],
      },
    },
    {
      name: 'launch_browser',
      description: 'Launch a new browser instance',
      inputSchema: {
        type: 'object',
        properties: {
          headless: {
            type: 'boolean',
            description: 'Run browser in headless mode',
            default: true,
          },
        },
      },
    },
    {
      name: 'navigate',
      description: 'Navigate to a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to navigate to',
          },
          waitUntil: {
            type: 'string',
            enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
            description: 'When to consider navigation succeeded',
            default: 'networkidle2',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'click',
      description: 'Click an element',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element to click',
          },
          waitForSelector: {
            type: 'boolean',
            description: 'Wait for element to appear before clicking',
            default: true,
          },
        },
        required: ['selector'],
      },
    },
    {
      name: 'type',
      description: 'Type text into an input field',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the input field',
          },
          text: {
            type: 'string',
            description: 'Text to type',
          },
          delay: {
            type: 'number',
            description: 'Delay between key presses in milliseconds',
            default: 0,
          },
        },
        required: ['selector', 'text'],
      },
    },
    {
      name: 'screenshot',
      description: 'Take a screenshot of the current page',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to save the screenshot',
          },
          fullPage: {
            type: 'boolean',
            description: 'Capture full page screenshot',
            default: false,
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'get_text',
      description: 'Get text content of an element',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element',
          },
        },
        required: ['selector'],
      },
    },
    {
      name: 'wait_for_selector',
      description: 'Wait for an element to appear',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector to wait for',
          },
          timeout: {
            type: 'number',
            description: 'Maximum time to wait in milliseconds',
            default: 30000,
          },
        },
        required: ['selector'],
      },
    },
    {
      name: 'evaluate',
      description: 'Execute JavaScript in the page context',
      inputSchema: {
        type: 'object',
        properties: {
          script: {
            type: 'string',
            description: 'JavaScript code to execute',
          },
        },
        required: ['script'],
      },
    },
    {
      name: 'close_browser',
      description: 'Close the browser instance',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args = {} } = request.params;

    switch (name) {
      case 'execute_workflow': {
        let workflow;
        
        // Parse workflow from string or file
        if ((args as any).workflowPath) {
          workflow = await WorkflowParser.parseFile((args as any).workflowPath);
        } else if ((args as any).workflow) {
          workflow = WorkflowParser.parse(
            (args as any).workflow,
            (args as any).format || 'auto'
          );
        } else {
          throw new Error('Either workflow or workflowPath must be provided');
        }

        // Execute workflow
        const result = await workflowEngine.execute(workflow);
        
        // Generate report
        const report = await workflowEngine.generateReport(
          result,
          (args as any).reportFormat || 'markdown'
        );

        return {
          content: [
            {
              type: 'text',
              text: report,
            },
          ],
        };
      }

      case 'validate_workflow': {
        try {
          const workflow = WorkflowParser.parse(
            (args as any).workflow,
            (args as any).format || 'auto'
          );
          
          const validationResult = WorkflowValidator.validate(workflow);
          
          if (validationResult.valid) {
            return {
              content: [
                {
                  type: 'text',
                  text: '✅ Workflow is valid',
                },
              ],
            };
          } else {
            const errors = validationResult.errors!
              .map(err => `- ${err.path}: ${err.message}`)
              .join('\n');
            
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Workflow validation failed:\n${errors}`,
                },
              ],
            };
          }
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Failed to parse workflow: ${error}`,
              },
            ],
          };
        }
      }

      case 'launch_browser': {
        if (browserContext.browser) {
          await browserContext.browser.close();
        }
        browserContext.browser = await puppeteer.launch({
          headless: (args as any).headless ?? true,
        });
        browserContext.page = await browserContext.browser.newPage();
        return {
          content: [
            {
              type: 'text',
              text: 'Browser launched successfully',
            },
          ],
        };
      }

      case 'navigate': {
        if (!browserContext.page) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'No browser instance. Call launch_browser first.'
          );
        }
        await browserContext.page.goto((args as any).url, {
          waitUntil: (args as any).waitUntil || 'networkidle2',
        });
        return {
          content: [
            {
              type: 'text',
              text: `Navigated to ${(args as any).url}`,
            },
          ],
        };
      }

      case 'click': {
        if (!browserContext.page) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'No browser instance. Call launch_browser first.'
          );
        }
        if ((args as any).waitForSelector) {
          await browserContext.page.waitForSelector((args as any).selector);
        }
        await browserContext.page.click((args as any).selector);
        return {
          content: [
            {
              type: 'text',
              text: `Clicked element: ${(args as any).selector}`,
            },
          ],
        };
      }

      case 'type': {
        if (!browserContext.page) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'No browser instance. Call launch_browser first.'
          );
        }
        await browserContext.page.type((args as any).selector, (args as any).text, {
          delay: (args as any).delay || 0,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Typed text into: ${(args as any).selector}`,
            },
          ],
        };
      }

      case 'screenshot': {
        if (!browserContext.page) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'No browser instance. Call launch_browser first.'
          );
        }
        await browserContext.page.screenshot({
          path: (args as any).path,
          fullPage: (args as any).fullPage || false,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Screenshot saved to: ${(args as any).path}`,
            },
          ],
        };
      }

      case 'get_text': {
        if (!browserContext.page) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'No browser instance. Call launch_browser first.'
          );
        }
        const text = await browserContext.page.$eval(
          (args as any).selector,
          (el) => el.textContent
        );
        return {
          content: [
            {
              type: 'text',
              text: text || '',
            },
          ],
        };
      }

      case 'wait_for_selector': {
        if (!browserContext.page) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'No browser instance. Call launch_browser first.'
          );
        }
        await browserContext.page.waitForSelector((args as any).selector, {
          timeout: (args as any).timeout || 30000,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Element found: ${(args as any).selector}`,
            },
          ],
        };
      }

      case 'evaluate': {
        if (!browserContext.page) {
          throw new McpError(
            ErrorCode.InvalidRequest,
            'No browser instance. Call launch_browser first.'
          );
        }
        const result = await browserContext.page.evaluate((args as any).script);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'close_browser': {
        if (browserContext.browser) {
          await browserContext.browser.close();
          browserContext.browser = undefined;
          browserContext.page = undefined;
        }
        return {
          content: [
            {
              type: 'text',
              text: 'Browser closed',
            },
          ],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool: ${error}`
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Puppeteer MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
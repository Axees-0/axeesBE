#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const puppeteer_1 = __importDefault(require("puppeteer"));
const workflow_engine_js_1 = require("./workflow-engine.js");
const workflow_parser_js_1 = require("./parsers/workflow-parser.js");
const workflow_validator_js_1 = require("./validators/workflow-validator.js");
const browserContext = {};
const workflowEngine = new workflow_engine_js_1.WorkflowEngine();
const server = new index_js_1.Server({
    name: 'puppeteer-test-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
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
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args = {} } = request.params;
        switch (name) {
            case 'execute_workflow': {
                let workflow;
                // Parse workflow from string or file
                if (args.workflowPath) {
                    workflow = await workflow_parser_js_1.WorkflowParser.parseFile(args.workflowPath);
                }
                else if (args.workflow) {
                    workflow = workflow_parser_js_1.WorkflowParser.parse(args.workflow, args.format || 'auto');
                }
                else {
                    throw new Error('Either workflow or workflowPath must be provided');
                }
                // Execute workflow
                const result = await workflowEngine.execute(workflow);
                // Generate report
                const report = await workflowEngine.generateReport(result, args.reportFormat || 'markdown');
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
                    const workflow = workflow_parser_js_1.WorkflowParser.parse(args.workflow, args.format || 'auto');
                    const validationResult = workflow_validator_js_1.WorkflowValidator.validate(workflow);
                    if (validationResult.valid) {
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: '✅ Workflow is valid',
                                },
                            ],
                        };
                    }
                    else {
                        const errors = validationResult.errors
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
                }
                catch (error) {
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
                browserContext.browser = await puppeteer_1.default.launch({
                    headless: args.headless ?? true,
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
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'No browser instance. Call launch_browser first.');
                }
                await browserContext.page.goto(args.url, {
                    waitUntil: args.waitUntil || 'networkidle2',
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Navigated to ${args.url}`,
                        },
                    ],
                };
            }
            case 'click': {
                if (!browserContext.page) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'No browser instance. Call launch_browser first.');
                }
                if (args.waitForSelector) {
                    await browserContext.page.waitForSelector(args.selector);
                }
                await browserContext.page.click(args.selector);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Clicked element: ${args.selector}`,
                        },
                    ],
                };
            }
            case 'type': {
                if (!browserContext.page) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'No browser instance. Call launch_browser first.');
                }
                await browserContext.page.type(args.selector, args.text, {
                    delay: args.delay || 0,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Typed text into: ${args.selector}`,
                        },
                    ],
                };
            }
            case 'screenshot': {
                if (!browserContext.page) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'No browser instance. Call launch_browser first.');
                }
                await browserContext.page.screenshot({
                    path: args.path,
                    fullPage: args.fullPage || false,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Screenshot saved to: ${args.path}`,
                        },
                    ],
                };
            }
            case 'get_text': {
                if (!browserContext.page) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'No browser instance. Call launch_browser first.');
                }
                const text = await browserContext.page.$eval(args.selector, (el) => el.textContent);
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
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'No browser instance. Call launch_browser first.');
                }
                await browserContext.page.waitForSelector(args.selector, {
                    timeout: args.timeout || 30000,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Element found: ${args.selector}`,
                        },
                    ],
                };
            }
            case 'evaluate': {
                if (!browserContext.page) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidRequest, 'No browser instance. Call launch_browser first.');
                }
                const result = await browserContext.page.evaluate(args.script);
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
                throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (error) {
        if (error instanceof types_js_1.McpError) {
            throw error;
        }
        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Error executing tool: ${error}`);
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Puppeteer MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});

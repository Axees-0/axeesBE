"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEngine = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const workflow_validator_js_1 = require("./validators/workflow-validator.js");
const factory_js_1 = require("./step-executors/factory.js");
const console_capture_js_1 = require("./utils/console-capture.js");
const screenshot_manager_js_1 = require("./utils/screenshot-manager.js");
const report_generator_js_1 = require("./utils/report-generator.js");
class WorkflowEngine {
    browser = null;
    page = null;
    consoleCapture;
    screenshotManager;
    reportGenerator;
    consoleLogs = [];
    networkActivity = [];
    screenshots = [];
    constructor() {
        this.consoleCapture = new console_capture_js_1.ConsoleCapture();
        this.screenshotManager = new screenshot_manager_js_1.ScreenshotManager();
        this.reportGenerator = new report_generator_js_1.ReportGenerator();
    }
    /**
     * Execute a complete workflow
     */
    async execute(workflow) {
        const startTime = new Date();
        const stepResults = [];
        let status = 'success';
        let error;
        try {
            // Validate workflow
            workflow_validator_js_1.WorkflowValidator.assertValid(workflow);
            // Initialize browser
            await this.initializeBrowser(workflow);
            // Execute each step
            for (let i = 0; i < workflow.steps.length; i++) {
                const step = workflow.steps[i];
                const stepResult = await this.executeStep(step, i);
                stepResults.push(stepResult);
                if (!stepResult.success && !step.continueOnError) {
                    status = 'partial';
                    break;
                }
                else if (!stepResult.success) {
                    status = 'partial';
                }
            }
            // Run assertions if all steps passed
            if (status === 'success' && workflow.assertions) {
                for (const assertion of workflow.assertions) {
                    const assertionResult = await this.runAssertion(assertion);
                    if (!assertionResult.success) {
                        status = 'failure';
                        break;
                    }
                }
            }
            // Run cleanup steps
            if (workflow.cleanup && workflow.cleanup.length > 0) {
                for (const cleanupStep of workflow.cleanup) {
                    try {
                        await this.executeStep(cleanupStep, -1);
                    }
                    catch (e) {
                        // Log but don't fail on cleanup errors
                        console.error('Cleanup step failed:', e);
                    }
                }
            }
        }
        catch (e) {
            status = 'failure';
            error = e;
        }
        finally {
            // Clean up browser
            await this.cleanup();
        }
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        // Create result
        const result = {
            workflow,
            startTime,
            endTime,
            duration,
            status,
            steps: stepResults,
            summary: {
                totalSteps: workflow.steps.length,
                passedSteps: stepResults.filter(r => r.success).length,
                failedSteps: stepResults.filter(r => !r.success).length,
                skippedSteps: workflow.steps.length - stepResults.length
            },
            screenshots: this.screenshots,
            consoleLogs: this.consoleLogs,
            networkActivity: this.networkActivity,
            error: error?.message
        };
        return result;
    }
    /**
     * Initialize browser and page
     */
    async initializeBrowser(workflow) {
        const config = workflow.config || {};
        // Launch browser
        this.browser = await puppeteer_1.default.launch({
            headless: config.headless !== false,
            slowMo: config.slowMo || 0,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        // Create page
        this.page = await this.browser.newPage();
        // Set viewport
        if (config.viewport) {
            await this.page.setViewport(config.viewport);
        }
        // Set user agent
        if (config.userAgent) {
            await this.page.setUserAgent(config.userAgent);
        }
        // Set default timeout
        if (config.timeout) {
            this.page.setDefaultTimeout(config.timeout);
        }
        // Attach listeners
        this.attachListeners();
        // Navigate to base URL if provided
        if (config.baseUrl) {
            await this.page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
        }
    }
    /**
     * Execute a single step
     */
    async executeStep(step, index) {
        if (!this.page) {
            throw new Error('Page not initialized');
        }
        const startTime = Date.now();
        let result;
        try {
            // Get executor for step type
            const executor = factory_js_1.StepExecutorFactory.getExecutor(step.type);
            // Attach listeners to executor
            executor.attachConsoleListener(this.page);
            executor.attachNetworkListener(this.page);
            // Execute step
            result = await executor.execute(this.page, step);
            // Add step metadata
            result.stepId = step.id || `step_${index}`;
            result.duration = Date.now() - startTime;
            // Save screenshot if taken
            if (result.screenshot) {
                const screenshotPath = await this.screenshotManager.save(result.screenshot, `${result.stepId}_${step.type}`);
                this.screenshots.push(screenshotPath);
            }
            // Collect logs
            if (result.consoleLogs) {
                this.consoleLogs.push(...result.consoleLogs);
            }
            if (result.networkActivity) {
                this.networkActivity.push(...result.networkActivity);
            }
        }
        catch (error) {
            result = {
                stepId: step.id || `step_${index}`,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime
            };
        }
        return result;
    }
    /**
     * Run an assertion
     */
    async runAssertion(assertion) {
        if (!this.page) {
            throw new Error('Page not initialized');
        }
        try {
            const element = await this.page.$(assertion.selector);
            if (!element) {
                throw new Error(`Element not found: ${assertion.selector}`);
            }
            const value = await element.evaluate((el, prop) => {
                return el[prop];
            }, assertion.property);
            let success = false;
            const operator = assertion.operator || 'equals';
            switch (operator) {
                case 'equals':
                    success = value === assertion.expected;
                    break;
                case 'contains':
                    success = String(value).includes(String(assertion.expected));
                    break;
                case 'matches':
                    success = new RegExp(assertion.expected).test(String(value));
                    break;
                case 'exists':
                    success = value !== null && value !== undefined;
                    break;
            }
            if (!success) {
                throw new Error(assertion.message ||
                    `Assertion failed: ${assertion.selector}.${assertion.property} ${operator} ${assertion.expected}`);
            }
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Attach event listeners to page
     */
    attachListeners() {
        if (!this.page)
            return;
        // Console logs
        this.page.on('console', (msg) => {
            this.consoleLogs.push({
                timestamp: new Date(),
                level: msg.type(),
                message: msg.text(),
                source: msg.location().url
            });
        });
        // Page errors
        this.page.on('pageerror', (error) => {
            this.consoleLogs.push({
                timestamp: new Date(),
                level: 'error',
                message: error.message,
                stackTrace: error.stack
            });
        });
        // Network requests
        this.page.on('request', (request) => {
            const activity = {
                timestamp: new Date(),
                method: request.method(),
                url: request.url()
            };
            const index = this.networkActivity.push(activity) - 1;
            const responsePromise = request.response();
            if (responsePromise && responsePromise.then) {
                responsePromise.then((response) => {
                    if (response) {
                        this.networkActivity[index].status = response.status();
                        this.networkActivity[index].responseTime = Date.now() - activity.timestamp.getTime();
                    }
                }).catch(() => {
                    this.networkActivity[index].error = 'Failed to get response';
                });
            }
        });
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
    /**
     * Generate a report from results
     */
    async generateReport(result, format = 'markdown') {
        return this.reportGenerator.generate(result, format);
    }
}
exports.WorkflowEngine = WorkflowEngine;

import puppeteer, { Browser, Page } from 'puppeteer';
import { 
  TestWorkflow, 
  WorkflowResult, 
  StepResult, 
  ConsoleLog, 
  NetworkActivity,
  TestStep 
} from './types/workflow.js';
import { WorkflowValidator } from './validators/workflow-validator.js';
import { StepExecutorFactory } from './step-executors/factory.js';
import { ConsoleCapture } from './utils/console-capture.js';
import { ScreenshotManager } from './utils/screenshot-manager.js';
import { ReportGenerator } from './utils/report-generator.js';

export class WorkflowEngine {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private consoleCapture: ConsoleCapture;
  private screenshotManager: ScreenshotManager;
  private reportGenerator: ReportGenerator;
  private consoleLogs: ConsoleLog[] = [];
  private networkActivity: NetworkActivity[] = [];
  private screenshots: string[] = [];

  constructor() {
    this.consoleCapture = new ConsoleCapture();
    this.screenshotManager = new ScreenshotManager();
    this.reportGenerator = new ReportGenerator();
  }

  /**
   * Execute a complete workflow
   */
  async execute(workflow: TestWorkflow): Promise<WorkflowResult> {
    const startTime = new Date();
    const stepResults: StepResult[] = [];
    let status: 'success' | 'failure' | 'partial' = 'success';
    let error: Error | undefined;

    try {
      // Validate workflow
      WorkflowValidator.assertValid(workflow);

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
        } else if (!stepResult.success) {
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
          } catch (e) {
            // Log but don't fail on cleanup errors
            console.error('Cleanup step failed:', e);
          }
        }
      }

    } catch (e) {
      status = 'failure';
      error = e as Error;
    } finally {
      // Clean up browser
      await this.cleanup();
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Create result
    const result: WorkflowResult = {
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
  private async initializeBrowser(workflow: TestWorkflow): Promise<void> {
    const config = workflow.config || {};
    
    // Launch browser
    this.browser = await puppeteer.launch({
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
  private async executeStep(step: TestStep, index: number): Promise<StepResult> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const startTime = Date.now();
    let result: StepResult;

    try {
      // Get executor for step type
      const executor = StepExecutorFactory.getExecutor(step.type);
      
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
        const screenshotPath = await this.screenshotManager.save(
          result.screenshot,
          `${result.stepId}_${step.type}`
        );
        this.screenshots.push(screenshotPath);
      }

      // Collect logs
      if (result.consoleLogs) {
        this.consoleLogs.push(...result.consoleLogs);
      }
      if (result.networkActivity) {
        this.networkActivity.push(...result.networkActivity);
      }

    } catch (error) {
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
  private async runAssertion(assertion: any): Promise<StepResult> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    try {
      const element = await this.page.$(assertion.selector);
      if (!element) {
        throw new Error(`Element not found: ${assertion.selector}`);
      }

      const value = await element.evaluate((el, prop) => {
        return (el as any)[prop];
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
        throw new Error(
          assertion.message || 
          `Assertion failed: ${assertion.selector}.${assertion.property} ${operator} ${assertion.expected}`
        );
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Attach event listeners to page
   */
  private attachListeners(): void {
    if (!this.page) return;

    // Console logs
    this.page.on('console', (msg) => {
      this.consoleLogs.push({
        timestamp: new Date(),
        level: msg.type() as any,
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
      const activity: NetworkActivity = {
        timestamp: new Date(),
        method: request.method(),
        url: request.url()
      };
      
      const index = this.networkActivity.push(activity) - 1;
      
      const responsePromise = request.response() as Promise<any> | null;
      if (responsePromise && responsePromise.then) {
        responsePromise.then((response: any) => {
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
  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Generate a report from results
   */
  async generateReport(result: WorkflowResult, format: 'markdown' | 'json' = 'markdown'): Promise<string> {
    return this.reportGenerator.generate(result, format);
  }
}
import { Page } from 'puppeteer';
import { TestStep, StepResult, ConsoleLog, NetworkActivity } from '../types/workflow.js';

export abstract class StepExecutor {
  protected consoleLogs: ConsoleLog[] = [];
  protected networkActivity: NetworkActivity[] = [];

  constructor() {
    this.consoleLogs = [];
    this.networkActivity = [];
  }

  /**
   * Execute the step
   */
  abstract execute(page: Page, step: TestStep, context?: any): Promise<StepResult>;

  /**
   * Get step type this executor handles
   */
  abstract get stepType(): string;

  /**
   * Common pre-execution setup
   */
  protected async preExecute(page: Page, step: TestStep): Promise<void> {
    // Wait before execution if specified
    if (step.waitBefore) {
      await this.delay(step.waitBefore);
    }

    // Set timeout for the step
    if (step.timeout) {
      page.setDefaultTimeout(step.timeout);
    }
  }

  /**
   * Common post-execution cleanup
   */
  protected async postExecute(page: Page, step: TestStep, result: StepResult): Promise<void> {
    // Wait after execution if specified
    if (step.waitAfter) {
      await this.delay(step.waitAfter);
    }

    // Take screenshot if requested
    if (step.screenshot) {
      result.screenshot = await this.takeScreenshot(page, step);
    }

    // Attach console logs and network activity
    result.consoleLogs = [...this.consoleLogs];
    result.networkActivity = [...this.networkActivity];

    // Clear logs for next execution
    this.consoleLogs = [];
    this.networkActivity = [];
  }

  /**
   * Execute with retry logic
   */
  protected async executeWithRetry(
    fn: () => Promise<any>,
    step: TestStep
  ): Promise<any> {
    const maxRetries = step.retryCount || 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  /**
   * Take screenshot with options
   */
  protected async takeScreenshot(page: Page, step: TestStep): Promise<Buffer> {
    const options: any = {
      encoding: 'binary',
      fullPage: true  // Default to full page screenshots
    };

    if (typeof step.screenshot === 'object') {
      const screenshotOpts = step.screenshot;
      
      if (screenshotOpts.fullPage !== undefined) {
        options.fullPage = screenshotOpts.fullPage;
      }
      
      if (screenshotOpts.quality !== undefined) {
        options.quality = screenshotOpts.quality;
      }
      
      if (screenshotOpts.type) {
        options.type = screenshotOpts.type;
      }
      
      if (screenshotOpts.clip) {
        options.clip = screenshotOpts.clip;
      }

      // Highlight elements before screenshot
      if (screenshotOpts.highlight && screenshotOpts.highlight.length > 0) {
        await this.highlightElements(page, screenshotOpts.highlight);
      }
    }

    const screenshot = await page.screenshot(options);
    return Buffer.from(screenshot as string, 'binary');
  }

  /**
   * Highlight elements on the page
   */
  protected async highlightElements(page: Page, selectors: string[]): Promise<void> {
    await page.evaluate((selectors) => {
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const element = el as HTMLElement;
          element.style.outline = '3px solid red';
          element.style.outlineOffset = '2px';
        });
      });
    }, selectors);

    // Wait a bit for visual effect
    await this.delay(100);
  }

  /**
   * Wait for a specified amount of time
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Attach console listener to page
   */
  attachConsoleListener(page: Page): void {
    page.on('console', (msg) => {
      this.consoleLogs.push({
        timestamp: new Date(),
        level: msg.type() as any,
        message: msg.text(),
        source: msg.location().url
      });
    });
  }

  /**
   * Attach network listener to page
   */
  attachNetworkListener(page: Page): void {
    page.on('request', (request) => {
      const activity: NetworkActivity = {
        timestamp: new Date(),
        method: request.method(),
        url: request.url()
      };
      
      const index = this.networkActivity.push(activity) - 1;
      
      // Update with response data when available
      const responsePromise = request.response() as Promise<any> | null;
      if (responsePromise && responsePromise.then) {
        responsePromise.then((response: any) => {
          if (response) {
            this.networkActivity[index].status = response.status();
            this.networkActivity[index].size = Number(response.headers()['content-length']) || 0;
          }
        }).catch(() => {
          // Response failed
          this.networkActivity[index].error = 'Failed to get response';
        });
      }
    });

    page.on('requestfailed', (request) => {
      this.networkActivity.push({
        timestamp: new Date(),
        method: request.method(),
        url: request.url(),
        error: request.failure()?.errorText || 'Unknown error'
      });
    });
  }

  /**
   * Create a successful result
   */
  protected createSuccessResult(data?: any): StepResult {
    return {
      success: true,
      data
    };
  }

  /**
   * Create a failed result
   */
  protected createErrorResult(error: Error | string): StepResult {
    return {
      success: false,
      error: error instanceof Error ? error.message : error
    };
  }
}
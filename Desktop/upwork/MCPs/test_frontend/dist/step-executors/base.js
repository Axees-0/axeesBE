"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepExecutor = void 0;
class StepExecutor {
    consoleLogs = [];
    networkActivity = [];
    constructor() {
        this.consoleLogs = [];
        this.networkActivity = [];
    }
    /**
     * Common pre-execution setup
     */
    async preExecute(page, step) {
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
    async postExecute(page, step, result) {
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
    async executeWithRetry(fn, step) {
        const maxRetries = step.retryCount || 0;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
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
    async takeScreenshot(page, step) {
        const options = {
            encoding: 'binary'
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
        return Buffer.from(screenshot, 'binary');
    }
    /**
     * Highlight elements on the page
     */
    async highlightElements(page, selectors) {
        await page.evaluate((selectors) => {
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const element = el;
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
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Attach console listener to page
     */
    attachConsoleListener(page) {
        page.on('console', (msg) => {
            this.consoleLogs.push({
                timestamp: new Date(),
                level: msg.type(),
                message: msg.text(),
                source: msg.location().url
            });
        });
    }
    /**
     * Attach network listener to page
     */
    attachNetworkListener(page) {
        page.on('request', (request) => {
            const activity = {
                timestamp: new Date(),
                method: request.method(),
                url: request.url()
            };
            const index = this.networkActivity.push(activity) - 1;
            // Update with response data when available
            const responsePromise = request.response();
            if (responsePromise && responsePromise.then) {
                responsePromise.then((response) => {
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
    createSuccessResult(data) {
        return {
            success: true,
            data
        };
    }
    /**
     * Create a failed result
     */
    createErrorResult(error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : error
        };
    }
}
exports.StepExecutor = StepExecutor;

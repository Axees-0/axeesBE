"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClickExecutor = void 0;
const base_js_1 = require("./base.js");
class ClickExecutor extends base_js_1.StepExecutor {
    get stepType() {
        return 'click';
    }
    async execute(page, step) {
        try {
            await this.preExecute(page, step);
            if (!step.selector) {
                throw new Error('Click step requires a selector');
            }
            // Wait for element and click
            await this.executeWithRetry(async () => {
                // Wait for element to be visible
                await page.waitForSelector(step.selector, {
                    visible: true,
                    timeout: step.timeout || 30000
                });
                // Scroll element into view
                await page.evaluate((selector) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, step.selector);
                // Small delay for scroll
                await this.delay(200);
                // Click the element
                await page.click(step.selector);
            }, step);
            const result = this.createSuccessResult({
                clicked: step.selector
            });
            await this.postExecute(page, step, result);
            return result;
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
}
exports.ClickExecutor = ClickExecutor;

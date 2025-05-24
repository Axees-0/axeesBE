"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigateExecutor = void 0;
const base_js_1 = require("./base.js");
class NavigateExecutor extends base_js_1.StepExecutor {
    get stepType() {
        return 'navigate';
    }
    async execute(page, step) {
        try {
            await this.preExecute(page, step);
            if (!step.url) {
                throw new Error('Navigate step requires a URL');
            }
            // Navigate to the URL
            await this.executeWithRetry(async () => {
                await page.goto(step.url, {
                    waitUntil: step.waitUntil || 'networkidle2',
                    timeout: step.timeout || 30000
                });
            }, step);
            const result = this.createSuccessResult({
                url: page.url(),
                title: await page.title()
            });
            await this.postExecute(page, step, result);
            return result;
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
}
exports.NavigateExecutor = NavigateExecutor;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitForSelectorExecutor = void 0;
const base_js_1 = require("./base.js");
class WaitForSelectorExecutor extends base_js_1.StepExecutor {
    get stepType() {
        return 'waitForSelector';
    }
    async execute(page, step) {
        try {
            await this.preExecute(page, step);
            if (!step.selector) {
                throw new Error('WaitForSelector step requires a selector');
            }
            await this.executeWithRetry(async () => {
                await page.waitForSelector(step.selector, {
                    visible: true,
                    timeout: step.timeout || 30000
                });
            }, step);
            const result = this.createSuccessResult({
                found: step.selector
            });
            await this.postExecute(page, step, result);
            return result;
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
}
exports.WaitForSelectorExecutor = WaitForSelectorExecutor;

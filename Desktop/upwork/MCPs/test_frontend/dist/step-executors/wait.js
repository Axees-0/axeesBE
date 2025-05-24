"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitExecutor = void 0;
const base_js_1 = require("./base.js");
class WaitExecutor extends base_js_1.StepExecutor {
    get stepType() {
        return 'wait';
    }
    async execute(page, step) {
        try {
            await this.preExecute(page, step);
            if (typeof step.value === 'number') {
                // Wait for specified milliseconds
                await this.delay(step.value);
                const result = this.createSuccessResult({
                    waited: `${step.value}ms`
                });
                await this.postExecute(page, step, result);
                return result;
            }
            else if (step.selector) {
                // Wait for selector
                await page.waitForSelector(step.selector, {
                    timeout: step.timeout || 30000
                });
                const result = this.createSuccessResult({
                    waited: `for selector: ${step.selector}`
                });
                await this.postExecute(page, step, result);
                return result;
            }
            else {
                throw new Error('Wait step requires either a value (ms) or selector');
            }
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
}
exports.WaitExecutor = WaitExecutor;

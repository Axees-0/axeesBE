"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssertTextExecutor = void 0;
const base_js_1 = require("./base.js");
class AssertTextExecutor extends base_js_1.StepExecutor {
    get stepType() {
        return 'assertText';
    }
    async execute(page, step) {
        try {
            await this.preExecute(page, step);
            if (!step.selector) {
                throw new Error('AssertText step requires a selector');
            }
            if (step.expected === undefined) {
                throw new Error('AssertText step requires an expected value');
            }
            const actualText = await page.$eval(step.selector, el => el.textContent?.trim() || '');
            const expectedText = String(step.expected);
            if (actualText !== expectedText) {
                throw new Error(`Text assertion failed\n` +
                    `Expected: "${expectedText}"\n` +
                    `Actual: "${actualText}"`);
            }
            const result = this.createSuccessResult({
                selector: step.selector,
                expected: expectedText,
                actual: actualText
            });
            await this.postExecute(page, step, result);
            return result;
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
}
exports.AssertTextExecutor = AssertTextExecutor;

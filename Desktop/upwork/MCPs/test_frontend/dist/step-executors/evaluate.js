"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluateExecutor = void 0;
const base_js_1 = require("./base.js");
class EvaluateExecutor extends base_js_1.StepExecutor {
    get stepType() {
        return 'evaluate';
    }
    async execute(page, step) {
        try {
            await this.preExecute(page, step);
            if (!step.script) {
                throw new Error('Evaluate step requires a script');
            }
            const result = await this.executeWithRetry(async () => {
                // Evaluate the script directly
                return await page.evaluate(step.script);
            }, step);
            const stepResult = this.createSuccessResult({
                evaluated: result
            });
            await this.postExecute(page, step, stepResult);
            return stepResult;
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
}
exports.EvaluateExecutor = EvaluateExecutor;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotExecutor = void 0;
const base_js_1 = require("./base.js");
class ScreenshotExecutor extends base_js_1.StepExecutor {
    get stepType() {
        return 'screenshot';
    }
    async execute(page, step) {
        try {
            await this.preExecute(page, step);
            // Force screenshot for this step
            const originalScreenshot = step.screenshot;
            step.screenshot = true;
            const result = this.createSuccessResult({
                screenshot: 'captured'
            });
            await this.postExecute(page, step, result);
            // Restore original setting
            step.screenshot = originalScreenshot;
            return result;
        }
        catch (error) {
            return this.createErrorResult(error);
        }
    }
}
exports.ScreenshotExecutor = ScreenshotExecutor;

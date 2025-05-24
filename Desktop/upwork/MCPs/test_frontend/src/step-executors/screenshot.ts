import { Page } from 'puppeteer';
import { TestStep, StepResult } from '../types/workflow.js';
import { StepExecutor } from './base.js';

export class ScreenshotExecutor extends StepExecutor {
  get stepType(): string {
    return 'screenshot';
  }

  async execute(page: Page, step: TestStep): Promise<StepResult> {
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
    } catch (error) {
      return this.createErrorResult(error as Error);
    }
  }
}
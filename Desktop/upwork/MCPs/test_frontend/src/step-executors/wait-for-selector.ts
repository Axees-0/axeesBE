import { Page } from 'puppeteer';
import { TestStep, StepResult } from '../types/workflow.js';
import { StepExecutor } from './base.js';

export class WaitForSelectorExecutor extends StepExecutor {
  get stepType(): string {
    return 'waitForSelector';
  }

  async execute(page: Page, step: TestStep): Promise<StepResult> {
    try {
      await this.preExecute(page, step);

      if (!step.selector) {
        throw new Error('WaitForSelector step requires a selector');
      }

      await this.executeWithRetry(
        async () => {
          await page.waitForSelector(step.selector!, {
            visible: true,
            timeout: step.timeout || 30000
          });
        },
        step
      );

      const result = this.createSuccessResult({
        found: step.selector
      });

      await this.postExecute(page, step, result);
      return result;
    } catch (error) {
      return this.createErrorResult(error as Error);
    }
  }
}
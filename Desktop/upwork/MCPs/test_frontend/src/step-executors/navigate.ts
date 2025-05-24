import { Page } from 'puppeteer';
import { TestStep, StepResult } from '../types/workflow.js';
import { StepExecutor } from './base.js';

export class NavigateExecutor extends StepExecutor {
  get stepType(): string {
    return 'navigate';
  }

  async execute(page: Page, step: TestStep): Promise<StepResult> {
    try {
      await this.preExecute(page, step);

      if (!step.url) {
        throw new Error('Navigate step requires a URL');
      }

      // Navigate to the URL
      await this.executeWithRetry(
        async () => {
          await page.goto(step.url!, {
            waitUntil: step.waitUntil || 'networkidle2',
            timeout: step.timeout || 30000
          });
        },
        step
      );

      const result = this.createSuccessResult({
        url: page.url(),
        title: await page.title()
      });

      await this.postExecute(page, step, result);
      return result;
    } catch (error) {
      return this.createErrorResult(error as Error);
    }
  }
}
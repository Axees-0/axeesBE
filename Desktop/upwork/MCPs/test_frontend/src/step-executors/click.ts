import { Page } from 'puppeteer';
import { TestStep, StepResult } from '../types/workflow.js';
import { StepExecutor } from './base.js';

export class ClickExecutor extends StepExecutor {
  get stepType(): string {
    return 'click';
  }

  async execute(page: Page, step: TestStep): Promise<StepResult> {
    try {
      await this.preExecute(page, step);

      if (!step.selector) {
        throw new Error('Click step requires a selector');
      }

      // Wait for element and click
      await this.executeWithRetry(
        async () => {
          // Wait for element to be visible
          await page.waitForSelector(step.selector!, {
            visible: true,
            timeout: step.timeout || 30000
          });

          // Scroll element into view
          await page.evaluate((selector: string) => {
            const element = document.querySelector(selector);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, step.selector!);

          // Small delay for scroll
          await this.delay(200);

          // Click the element
          await page.click(step.selector!);
        },
        step
      );

      const result = this.createSuccessResult({
        clicked: step.selector
      });

      await this.postExecute(page, step, result);
      return result;
    } catch (error) {
      return this.createErrorResult(error as Error);
    }
  }
}
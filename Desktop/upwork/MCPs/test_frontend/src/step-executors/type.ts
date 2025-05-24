import { Page } from 'puppeteer';
import { TestStep, StepResult } from '../types/workflow.js';
import { StepExecutor } from './base.js';

export class TypeExecutor extends StepExecutor {
  get stepType(): string {
    return 'type';
  }

  async execute(page: Page, step: TestStep): Promise<StepResult> {
    try {
      await this.preExecute(page, step);

      if (!step.selector) {
        throw new Error('Type step requires a selector');
      }

      if (step.value === undefined) {
        throw new Error('Type step requires a value');
      }

      const text = String(step.value);

      await this.executeWithRetry(
        async () => {
          // Wait for element
          await page.waitForSelector(step.selector!, {
            visible: true,
            timeout: step.timeout || 30000
          });

          // Clear existing value if needed
          await page.evaluate((selector: string) => {
            const element = document.querySelector(selector) as HTMLInputElement;
            if (element) {
              element.value = '';
            }
          }, step.selector!);

          // Type the text
          await page.type(step.selector!, text, {
            delay: 0
          });
        },
        step
      );

      const result = this.createSuccessResult({
        typed: text,
        selector: step.selector
      });

      await this.postExecute(page, step, result);
      return result;
    } catch (error) {
      return this.createErrorResult(error as Error);
    }
  }
}
import { Page } from 'puppeteer';
import { TestStep, StepResult } from '../types/workflow.js';
import { StepExecutor } from './base.js';

export class AssertTextExecutor extends StepExecutor {
  get stepType(): string {
    return 'assertText';
  }

  async execute(page: Page, step: TestStep): Promise<StepResult> {
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
        throw new Error(
          `Text assertion failed\n` +
          `Expected: "${expectedText}"\n` +
          `Actual: "${actualText}"`
        );
      }

      const result = this.createSuccessResult({
        selector: step.selector,
        expected: expectedText,
        actual: actualText
      });

      await this.postExecute(page, step, result);
      return result;
    } catch (error) {
      return this.createErrorResult(error as Error);
    }
  }
}
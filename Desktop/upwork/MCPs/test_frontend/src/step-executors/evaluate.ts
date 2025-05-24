import { Page } from 'puppeteer';
import { TestStep, StepResult } from '../types/workflow.js';
import { StepExecutor } from './base.js';

export class EvaluateExecutor extends StepExecutor {
  get stepType(): string {
    return 'evaluate';
  }

  async execute(page: Page, step: TestStep): Promise<StepResult> {
    try {
      await this.preExecute(page, step);

      if (!step.script) {
        throw new Error('Evaluate step requires a script');
      }

      const result = await this.executeWithRetry(
        async () => {
          // Evaluate the script directly
          return await page.evaluate(step.script!);
        },
        step
      );

      const stepResult = this.createSuccessResult({
        evaluated: result
      });

      await this.postExecute(page, step, stepResult);
      return stepResult;
    } catch (error) {
      return this.createErrorResult(error as Error);
    }
  }
}
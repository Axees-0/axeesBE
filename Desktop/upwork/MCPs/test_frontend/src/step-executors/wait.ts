import { Page } from 'puppeteer';
import { TestStep, StepResult } from '../types/workflow.js';
import { StepExecutor } from './base.js';

export class WaitExecutor extends StepExecutor {
  get stepType(): string {
    return 'wait';
  }

  async execute(page: Page, step: TestStep): Promise<StepResult> {
    try {
      await this.preExecute(page, step);

      if (typeof step.value === 'number') {
        // Wait for specified milliseconds
        await this.delay(step.value);
        
        const result = this.createSuccessResult({
          waited: `${step.value}ms`
        });
        
        await this.postExecute(page, step, result);
        return result;
      } else if (step.selector) {
        // Wait for selector
        await page.waitForSelector(step.selector, {
          timeout: step.timeout || 30000
        });
        
        const result = this.createSuccessResult({
          waited: `for selector: ${step.selector}`
        });
        
        await this.postExecute(page, step, result);
        return result;
      } else {
        throw new Error('Wait step requires either a value (ms) or selector');
      }
    } catch (error) {
      return this.createErrorResult(error as Error);
    }
  }
}
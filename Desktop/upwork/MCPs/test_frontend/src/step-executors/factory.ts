import { StepExecutor } from './base.js';
import { NavigateExecutor } from './navigate.js';
import { ClickExecutor } from './click.js';
import { TypeExecutor } from './type.js';
import { WaitExecutor } from './wait.js';
import { ScreenshotExecutor } from './screenshot.js';
import { EvaluateExecutor } from './evaluate.js';
import { AssertTextExecutor } from './assert-text.js';
import { WaitForSelectorExecutor } from './wait-for-selector.js';

export class StepExecutorFactory {
  private static executors: Map<string, StepExecutor> = new Map();

  static {
    // Register all executors
    this.register(new NavigateExecutor());
    this.register(new ClickExecutor());
    this.register(new TypeExecutor());
    this.register(new WaitExecutor());
    this.register(new ScreenshotExecutor());
    this.register(new EvaluateExecutor());
    this.register(new AssertTextExecutor());
    this.register(new WaitForSelectorExecutor());
  }

  /**
   * Register a step executor
   */
  static register(executor: StepExecutor): void {
    this.executors.set(executor.stepType, executor);
  }

  /**
   * Get executor for a step type
   */
  static getExecutor(stepType: string): StepExecutor {
    const executor = this.executors.get(stepType);
    if (!executor) {
      throw new Error(`No executor found for step type: ${stepType}`);
    }
    return executor;
  }

  /**
   * Check if executor exists for a step type
   */
  static hasExecutor(stepType: string): boolean {
    return this.executors.has(stepType);
  }

  /**
   * Get all registered step types
   */
  static getRegisteredTypes(): string[] {
    return Array.from(this.executors.keys());
  }
}
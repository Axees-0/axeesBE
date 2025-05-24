import Joi from 'joi';
import { TestWorkflow, ValidationResult, ValidationError } from '../types/workflow.js';

export class WorkflowValidator {
  private static readonly stepTypeSchema = Joi.string().valid(
    'navigate', 'click', 'type', 'select', 'upload', 'wait', 'waitForSelector',
    'scroll', 'hover', 'evaluate', 'screenshot', 'assertText', 'assertVisible',
    'assertValue', 'assertNotVisible', 'clear', 'customScript'
  );

  private static readonly screenshotOptionsSchema = Joi.alternatives().try(
    Joi.boolean(),
    Joi.object({
      name: Joi.string(),
      fullPage: Joi.boolean(),
      quality: Joi.number().min(0).max(100),
      type: Joi.string().valid('png', 'jpeg'),
      clip: Joi.object({
        x: Joi.number().required(),
        y: Joi.number().required(),
        width: Joi.number().positive().required(),
        height: Joi.number().positive().required()
      }),
      highlight: Joi.array().items(Joi.string())
    })
  );

  private static readonly stepSchema = Joi.object({
    id: Joi.string(),
    type: this.stepTypeSchema.required(),
    description: Joi.string(),
    selector: Joi.string(),
    value: Joi.any(),
    url: Joi.string().uri({ allowRelative: true }),
    script: Joi.string(),
    property: Joi.string(),
    expected: Joi.any(),
    condition: Joi.string(),
    waitUntil: Joi.string().valid('load', 'domcontentloaded', 'networkidle0', 'networkidle2'),
    waitBefore: Joi.number().positive(),
    waitAfter: Joi.number().positive(),
    timeout: Joi.number().positive(),
    retryCount: Joi.number().integer().min(0),
    screenshot: this.screenshotOptionsSchema,
    continueOnError: Joi.boolean()
  }).custom((value, helpers) => {
    // Custom validation for step type requirements
    const { type } = value;
    
    switch (type) {
      case 'navigate':
        if (!value.url) {
          return helpers.error('any.custom', { message: 'Navigate step requires url' });
        }
        break;
      
      case 'click':
      case 'type':
      case 'hover':
      case 'assertText':
      case 'assertVisible':
      case 'assertNotVisible':
      case 'assertValue':
      case 'clear':
        if (!value.selector) {
          return helpers.error('any.custom', { message: `${type} step requires selector` });
        }
        break;
      
      case 'type':
        if (!value.value) {
          return helpers.error('any.custom', { message: 'Type step requires value' });
        }
        break;
      
      case 'evaluate':
      case 'customScript':
        if (!value.script) {
          return helpers.error('any.custom', { message: `${type} step requires script` });
        }
        break;
      
      case 'wait':
        if (!value.value && !value.selector) {
          return helpers.error('any.custom', { message: 'Wait step requires value (ms) or selector' });
        }
        break;
    }
    
    return value;
  });

  private static readonly assertionSchema = Joi.object({
    selector: Joi.string().required(),
    property: Joi.string().required(),
    operator: Joi.string().valid('equals', 'contains', 'matches', 'exists'),
    expected: Joi.any().required(),
    message: Joi.string()
  });

  private static readonly workflowConfigSchema = Joi.object({
    baseUrl: Joi.string().uri({ allowRelative: false }),
    viewport: Joi.object({
      width: Joi.number().positive().required(),
      height: Joi.number().positive().required()
    }),
    timeout: Joi.number().positive(),
    headless: Joi.boolean(),
    slowMo: Joi.number().min(0),
    userAgent: Joi.string()
  });

  private static readonly workflowSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    version: Joi.string(),
    config: this.workflowConfigSchema,
    variables: Joi.object().pattern(Joi.string(), Joi.any()),
    steps: Joi.array().items(this.stepSchema).min(1).required(),
    assertions: Joi.array().items(this.assertionSchema),
    cleanup: Joi.array().items(this.stepSchema)
  });

  /**
   * Validate a workflow
   */
  static validate(workflow: any): ValidationResult {
    const { error } = this.workflowSchema.validate(workflow, {
      abortEarly: false,
      allowUnknown: false
    });

    if (!error) {
      return { valid: true };
    }

    const errors: ValidationError[] = error.details.map(detail => ({
      path: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    return {
      valid: false,
      errors
    };
  }

  /**
   * Validate a single step
   */
  static validateStep(step: any): ValidationResult {
    const { error } = this.stepSchema.validate(step, {
      abortEarly: false,
      allowUnknown: false
    });

    if (!error) {
      return { valid: true };
    }

    const errors: ValidationError[] = error.details.map(detail => ({
      path: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    return {
      valid: false,
      errors
    };
  }

  /**
   * Check if a workflow is valid (throws on error)
   */
  static assertValid(workflow: any): void {
    const result = this.validate(workflow);
    
    if (!result.valid) {
      const errorMessages = result.errors!.map(e => `  - ${e.path}: ${e.message}`).join('\n');
      throw new Error(`Workflow validation failed:\n${errorMessages}`);
    }
  }
}
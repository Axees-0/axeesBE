"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowValidator = void 0;
const joi_1 = __importDefault(require("joi"));
class WorkflowValidator {
    static stepTypeSchema = joi_1.default.string().valid('navigate', 'click', 'type', 'select', 'upload', 'wait', 'waitForSelector', 'scroll', 'hover', 'evaluate', 'screenshot', 'assertText', 'assertVisible', 'assertValue', 'assertNotVisible', 'clear', 'customScript');
    static screenshotOptionsSchema = joi_1.default.alternatives().try(joi_1.default.boolean(), joi_1.default.object({
        name: joi_1.default.string(),
        fullPage: joi_1.default.boolean(),
        quality: joi_1.default.number().min(0).max(100),
        type: joi_1.default.string().valid('png', 'jpeg'),
        clip: joi_1.default.object({
            x: joi_1.default.number().required(),
            y: joi_1.default.number().required(),
            width: joi_1.default.number().positive().required(),
            height: joi_1.default.number().positive().required()
        }),
        highlight: joi_1.default.array().items(joi_1.default.string())
    }));
    static stepSchema = joi_1.default.object({
        id: joi_1.default.string(),
        type: this.stepTypeSchema.required(),
        description: joi_1.default.string(),
        selector: joi_1.default.string(),
        value: joi_1.default.any(),
        url: joi_1.default.string().uri({ allowRelative: true }),
        script: joi_1.default.string(),
        property: joi_1.default.string(),
        expected: joi_1.default.any(),
        condition: joi_1.default.string(),
        waitUntil: joi_1.default.string().valid('load', 'domcontentloaded', 'networkidle0', 'networkidle2'),
        waitBefore: joi_1.default.number().positive(),
        waitAfter: joi_1.default.number().positive(),
        timeout: joi_1.default.number().positive(),
        retryCount: joi_1.default.number().integer().min(0),
        screenshot: this.screenshotOptionsSchema,
        continueOnError: joi_1.default.boolean()
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
    static assertionSchema = joi_1.default.object({
        selector: joi_1.default.string().required(),
        property: joi_1.default.string().required(),
        operator: joi_1.default.string().valid('equals', 'contains', 'matches', 'exists'),
        expected: joi_1.default.any().required(),
        message: joi_1.default.string()
    });
    static workflowConfigSchema = joi_1.default.object({
        baseUrl: joi_1.default.string().uri({ allowRelative: false }),
        viewport: joi_1.default.object({
            width: joi_1.default.number().positive().required(),
            height: joi_1.default.number().positive().required()
        }),
        timeout: joi_1.default.number().positive(),
        headless: joi_1.default.boolean(),
        slowMo: joi_1.default.number().min(0),
        userAgent: joi_1.default.string()
    });
    static workflowSchema = joi_1.default.object({
        name: joi_1.default.string().required(),
        description: joi_1.default.string(),
        version: joi_1.default.string(),
        config: this.workflowConfigSchema,
        variables: joi_1.default.object().pattern(joi_1.default.string(), joi_1.default.any()),
        steps: joi_1.default.array().items(this.stepSchema).min(1).required(),
        assertions: joi_1.default.array().items(this.assertionSchema),
        cleanup: joi_1.default.array().items(this.stepSchema)
    });
    /**
     * Validate a workflow
     */
    static validate(workflow) {
        const { error } = this.workflowSchema.validate(workflow, {
            abortEarly: false,
            allowUnknown: false
        });
        if (!error) {
            return { valid: true };
        }
        const errors = error.details.map(detail => ({
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
    static validateStep(step) {
        const { error } = this.stepSchema.validate(step, {
            abortEarly: false,
            allowUnknown: false
        });
        if (!error) {
            return { valid: true };
        }
        const errors = error.details.map(detail => ({
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
    static assertValid(workflow) {
        const result = this.validate(workflow);
        if (!result.valid) {
            const errorMessages = result.errors.map(e => `  - ${e.path}: ${e.message}`).join('\n');
            throw new Error(`Workflow validation failed:\n${errorMessages}`);
        }
    }
}
exports.WorkflowValidator = WorkflowValidator;

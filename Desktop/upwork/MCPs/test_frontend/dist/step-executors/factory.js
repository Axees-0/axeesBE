"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepExecutorFactory = void 0;
const navigate_js_1 = require("./navigate.js");
const click_js_1 = require("./click.js");
const type_js_1 = require("./type.js");
const wait_js_1 = require("./wait.js");
const screenshot_js_1 = require("./screenshot.js");
const evaluate_js_1 = require("./evaluate.js");
const assert_text_js_1 = require("./assert-text.js");
const wait_for_selector_js_1 = require("./wait-for-selector.js");
class StepExecutorFactory {
    static executors = new Map();
    static {
        // Register all executors
        this.register(new navigate_js_1.NavigateExecutor());
        this.register(new click_js_1.ClickExecutor());
        this.register(new type_js_1.TypeExecutor());
        this.register(new wait_js_1.WaitExecutor());
        this.register(new screenshot_js_1.ScreenshotExecutor());
        this.register(new evaluate_js_1.EvaluateExecutor());
        this.register(new assert_text_js_1.AssertTextExecutor());
        this.register(new wait_for_selector_js_1.WaitForSelectorExecutor());
    }
    /**
     * Register a step executor
     */
    static register(executor) {
        this.executors.set(executor.stepType, executor);
    }
    /**
     * Get executor for a step type
     */
    static getExecutor(stepType) {
        const executor = this.executors.get(stepType);
        if (!executor) {
            throw new Error(`No executor found for step type: ${stepType}`);
        }
        return executor;
    }
    /**
     * Check if executor exists for a step type
     */
    static hasExecutor(stepType) {
        return this.executors.has(stepType);
    }
    /**
     * Get all registered step types
     */
    static getRegisteredTypes() {
        return Array.from(this.executors.keys());
    }
}
exports.StepExecutorFactory = StepExecutorFactory;

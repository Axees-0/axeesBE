"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowParser = void 0;
const yaml = __importStar(require("js-yaml"));
class WorkflowParser {
    /**
     * Parse a workflow from string content
     * Supports both JSON and YAML formats
     */
    static parse(content, format = 'auto') {
        if (format === 'auto') {
            format = this.detectFormat(content);
        }
        try {
            if (format === 'yaml') {
                return this.parseYAML(content);
            }
            else {
                return this.parseJSON(content);
            }
        }
        catch (error) {
            throw new Error(`Failed to parse workflow: ${error.message}`);
        }
    }
    /**
     * Parse a JSON workflow
     */
    static parseJSON(content) {
        try {
            const workflow = JSON.parse(content);
            return this.processWorkflow(workflow);
        }
        catch (error) {
            throw new Error(`Invalid JSON format: ${error.message}`);
        }
    }
    /**
     * Parse a YAML workflow
     */
    static parseYAML(content) {
        try {
            const workflow = yaml.load(content);
            return this.processWorkflow(workflow);
        }
        catch (error) {
            throw new Error(`Invalid YAML format: ${error.message}`);
        }
    }
    /**
     * Detect content format
     */
    static detectFormat(content) {
        const trimmed = content.trim();
        // Check for JSON indicators
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return 'json';
        }
        // Check for YAML indicators
        if (trimmed.includes(':') && !trimmed.startsWith('{')) {
            return 'yaml';
        }
        // Try to parse as JSON first
        try {
            JSON.parse(content);
            return 'json';
        }
        catch {
            return 'yaml';
        }
    }
    /**
     * Process and normalize workflow data
     */
    static processWorkflow(data) {
        // Ensure required fields
        if (!data.name) {
            throw new Error('Workflow must have a name');
        }
        if (!data.steps || !Array.isArray(data.steps) || data.steps.length === 0) {
            throw new Error('Workflow must have at least one step');
        }
        // Process variables and substitute them in steps
        const processedSteps = this.processVariables(data.steps, data.variables || {});
        return {
            name: data.name,
            description: data.description,
            version: data.version,
            config: data.config || {},
            variables: data.variables || {},
            steps: processedSteps,
            assertions: data.assertions || [],
            cleanup: data.cleanup || []
        };
    }
    /**
     * Process variables in steps
     */
    static processVariables(steps, variables) {
        const processedSteps = [];
        for (const step of steps) {
            const processedStep = { ...step };
            // Replace variables in string values
            for (const key in processedStep) {
                if (typeof processedStep[key] === 'string') {
                    processedStep[key] = this.replaceVariables(processedStep[key], variables);
                }
            }
            processedSteps.push(processedStep);
        }
        return processedSteps;
    }
    /**
     * Replace variables in a string
     */
    static replaceVariables(str, variables) {
        return str.replace(/\${(\w+)}/g, (match, varName) => {
            if (varName === 'timestamp') {
                return Date.now().toString();
            }
            return variables[varName] !== undefined ? variables[varName] : match;
        });
    }
    /**
     * Parse a workflow from a file
     */
    static async parseFile(filePath) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const content = await fs.readFile(filePath, 'utf-8');
        // Determine format from file extension
        const format = filePath.endsWith('.yaml') || filePath.endsWith('.yml') ? 'yaml' : 'json';
        return this.parse(content, format);
    }
}
exports.WorkflowParser = WorkflowParser;

import * as yaml from 'js-yaml';
import { TestWorkflow } from '../types/workflow.js';

export class WorkflowParser {
  /**
   * Parse a workflow from string content
   * Supports both JSON and YAML formats
   */
  static parse(content: string, format: 'json' | 'yaml' | 'auto' = 'auto'): TestWorkflow {
    if (format === 'auto') {
      format = this.detectFormat(content);
    }

    try {
      if (format === 'yaml') {
        return this.parseYAML(content);
      } else {
        return this.parseJSON(content);
      }
    } catch (error) {
      throw new Error(`Failed to parse workflow: ${error.message}`);
    }
  }

  /**
   * Parse a JSON workflow
   */
  private static parseJSON(content: string): TestWorkflow {
    try {
      const workflow = JSON.parse(content);
      return this.processWorkflow(workflow);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * Parse a YAML workflow
   */
  private static parseYAML(content: string): TestWorkflow {
    try {
      const workflow = yaml.load(content) as any;
      return this.processWorkflow(workflow);
    } catch (error) {
      throw new Error(`Invalid YAML format: ${error.message}`);
    }
  }

  /**
   * Detect content format
   */
  private static detectFormat(content: string): 'json' | 'yaml' {
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
    } catch {
      return 'yaml';
    }
  }

  /**
   * Process and normalize workflow data
   */
  private static processWorkflow(data: any): TestWorkflow {
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
  private static processVariables(steps: any[], variables: Record<string, any>): any[] {
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
  private static replaceVariables(str: string, variables: Record<string, any>): string {
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
  static async parseFile(filePath: string): Promise<TestWorkflow> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Determine format from file extension
    const format = filePath.endsWith('.yaml') || filePath.endsWith('.yml') ? 'yaml' : 'json';
    
    return this.parse(content, format);
  }
}
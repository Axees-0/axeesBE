/**
 * TimeoutManager - Unified timeout configuration and management
 * 
 * Provides centralized timeout handling to prevent hierarchy mismatches
 * and ensure consistent timeout behavior across all workflow engines.
 */

import { TestStep } from '../types/workflow.js';

export interface TimeoutConfig {
  stepDefault: number;        // 30000ms (30s) - Default for most steps
  navigationDefault: number;  // 15000ms (15s) - Page navigation
  selectorDefault: number;    // 30000ms (30s) - Wait for elements
  screenshotDefault: number;  // 10000ms (10s) - Screenshot capture
  protocolDefault: number;    // 600000ms (10min) - Browser protocol
  workflowMax: number;        // 180000ms (3min) - External script limit
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
}

export interface ValidationIssue {
  type: 'timeout_hierarchy_violation' | 'excessive_timeout' | 'insufficient_timeout';
  step?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestedFix?: string;
}

export interface ValidationWarning {
  type: 'potential_slow_selector' | 'timeout_recommendation';
  step: string;
  message: string;
  recommendation: string;
}

export class TimeoutManager {
  private static defaultConfig: TimeoutConfig = {
    stepDefault: 30000,       // 30 seconds
    navigationDefault: 15000, // 15 seconds  
    selectorDefault: 30000,   // 30 seconds
    screenshotDefault: 10000, // 10 seconds
    protocolDefault: 600000,  // 10 minutes
    workflowMax: 180000       // 3 minutes
  };

  /**
   * Get the appropriate timeout for a step based on type and configuration
   */
  static getTimeoutForStep(step: TestStep, config?: TimeoutConfig): number {
    const cfg = config || this.defaultConfig;
    
    // Step-specific timeout takes highest precedence
    if (step.timeout && step.timeout > 0) {
      return step.timeout;
    }
    
    // Step-type specific defaults
    switch (step.type) {
      case 'navigate':
        return cfg.navigationDefault;
      case 'wait-for-selector':
        return cfg.selectorDefault;
      case 'screenshot':
        return cfg.screenshotDefault;
      case 'click':
      case 'type':
      case 'assertText':
      case 'wait':
      case 'evaluate':
      default:
        return cfg.stepDefault;
    }
  }

  /**
   * Validate timeout hierarchy to prevent conflicts
   */
  static validateTimeoutHierarchy(workflow: any, config?: TimeoutConfig): ValidationResult {
    const cfg = config || this.defaultConfig;
    const issues: ValidationIssue[] = [];
    const warnings: ValidationWarning[] = [];
    
    const workflowTimeout = workflow.config?.timeout || cfg.workflowMax;
    
    // Check each step's timeout against workflow timeout
    if (workflow.steps) {
      workflow.steps.forEach((step: any, index: number) => {
        const stepTimeout = this.getTimeoutForStep(step, config);
        const stepId = step.id || `step_${index}`;
        
        // Critical: Step timeout exceeds workflow timeout
        if (stepTimeout > workflowTimeout) {
          issues.push({
            type: 'timeout_hierarchy_violation',
            step: stepId,
            message: `Step timeout (${stepTimeout}ms) exceeds workflow timeout (${workflowTimeout}ms)`,
            severity: 'error',
            suggestedFix: `Reduce step timeout to ${workflowTimeout - 5000}ms or increase workflow timeout`
          });
        }
        
        // Warning: Very long timeouts that might indicate problems
        if (stepTimeout > 60000) { // 1 minute
          warnings.push({
            type: 'excessive_timeout',
            step: stepId,
            message: `Very long timeout (${stepTimeout}ms) may indicate selector issues`,
            recommendation: `Consider optimizing selector: ${step.selector || 'N/A'}`
          });
        }
        
        // Warning: Complex selectors that might need longer timeouts
        if (step.selector && this.isComplexSelector(step.selector) && stepTimeout < 15000) {
          warnings.push({
            type: 'potential_slow_selector',
            step: stepId,
            message: `Complex selector may need longer timeout`,
            recommendation: `Consider increasing timeout to 15000ms or higher`
          });
        }
      });
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Check if a selector is complex and likely to need longer timeouts
   */
  private static isComplexSelector(selector: string): boolean {
    const complexPatterns = [
      /\.[\w-]+:last-child/,           // :last-child pseudo-selectors
      /\.[\w-]+:nth-child/,            // :nth-child pseudo-selectors  
      /\.[\w-]+\.[\w-]+\.[\w-]+/,      // Multiple class combinations
      /\[data-[\w-]+\]/,               // Data attribute selectors
      /\.timeline|\.modal|\.response/, // Known slow-loading elements
      /\.hero-section|\.chat-main/,    // Complex layout sections
      /\.api-layout|\.architecture/    // Technical content areas
    ];
    
    return complexPatterns.some(pattern => pattern.test(selector));
  }

  /**
   * Get optimal timeout based on selector complexity and step type
   */
  static getOptimalTimeout(step: TestStep, config?: TimeoutConfig): number {
    const baseTimeout = this.getTimeoutForStep(step, config);
    
    // Increase timeout for complex selectors
    if (step.selector && this.isComplexSelector(step.selector)) {
      return Math.max(baseTimeout, 15000); // Minimum 15s for complex selectors
    }
    
    // Increase timeout for known slow operations
    if (step.type === 'navigate' && step.url?.includes('file://')) {
      return Math.max(baseTimeout, 10000); // File URLs can be slow
    }
    
    return baseTimeout;
  }

  /**
   * Create environment-specific configuration
   */
  static createEnvironmentConfig(env: 'development' | 'production' | 'ci'): TimeoutConfig {
    const base = this.defaultConfig;
    
    switch (env) {
      case 'development':
        return {
          ...base,
          stepDefault: 45000,       // More time for debugging
          selectorDefault: 45000,
          navigationDefault: 20000
        };
        
      case 'ci':
        return {
          ...base,
          stepDefault: 60000,       // CI environments can be slow
          selectorDefault: 60000,
          navigationDefault: 30000,
          workflowMax: 300000      // 5 minutes for CI
        };
        
      case 'production':
      default:
        return base;
    }
  }

  /**
   * Generate timeout recommendations based on patterns
   */
  static generateRecommendations(workflow: any): string[] {
    const recommendations: string[] = [];
    const validation = this.validateTimeoutHierarchy(workflow);
    
    if (validation.issues.length > 0) {
      recommendations.push('⚠️ Timeout hierarchy violations detected - see validation results');
    }
    
    if (validation.warnings.length > 0) {
      recommendations.push(`💡 ${validation.warnings.length} optimization opportunities available`);
    }
    
    // Check for file:// URLs
    const hasFileUrls = workflow.steps?.some((step: any) => 
      step.url?.startsWith('file://') || 
      (step.type === 'navigate' && step.url?.startsWith('file://'))
    );
    
    if (hasFileUrls) {
      recommendations.push('📁 File:// URLs detected - consider using REUSE session strategy for better performance');
    }
    
    return recommendations;
  }
}

export default TimeoutManager;
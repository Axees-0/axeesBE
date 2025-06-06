/**
 * TimeoutManager - Fixes the hardcoded 5-second timeout issue
 */
class TimeoutManager {
  static getStepTimeout(step, defaultTimeout = 30000) {
    if (step.timeout && step.timeout > 0) {
      return step.timeout;
    }
    
    const typeTimeouts = {
      'navigate': 15000,
      'wait-for-selector': 30000, // Was hardcoded to 5000 - this fixes the bug
      'screenshot': 10000,
      'click': 5000,
      'type': 5000,
      'wait': step.duration || step.value || 1000,
      'evaluate': 10000,
      'assertText': 5000
    };
    
    const timeout = typeTimeouts[step.type] || defaultTimeout;
    
    // Increase timeout for complex selectors that were failing
    if (step.selector && this.isComplexSelector(step.selector)) {
      return Math.max(timeout, 15000);
    }
    
    return timeout;
  }
  
  static isComplexSelector(selector) {
    const complexPatterns = [
      /\.hero-section/, /\.chat-main/, /\.timeline/, /\.api-layout/,
      /\.architecture-diagram/, /\.product-card/, /\.response-section/,
      /:last-child/, /:nth-child/, /\[data-/, /\.modal/, /\.loading/
    ];
    
    return complexPatterns.some(pattern => pattern.test(selector));
  }
}

module.exports = TimeoutManager;
/**
 * Selector Resilience Utility
 * 
 * Prevents test failures when frontend selectors change.
 * Uses fallback selector strategy to ensure tests remain stable.
 * 
 * Critical for preventing the "grain of sand" that breaks everything
 * when developers change CSS classes or HTML structure.
 */

class SelectorResilience {
    constructor(page) {
        this.page = page;
        this.selectorStats = {
            attempts: 0,
            fallbacksUsed: 0,
            failures: 0
        };
    }

    /**
     * Find element using fallback selector strategy
     * Tries multiple selector approaches until one succeeds
     */
    async findElement(selectorOptions, options = {}) {
        const { timeout = 5000, visible = false } = options;
        this.selectorStats.attempts++;
        
        // Ensure selectorOptions is an array
        const selectors = Array.isArray(selectorOptions) ? selectorOptions : [selectorOptions];
        
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            
            try {
                // Track if we're using fallbacks
                if (i > 0) {
                    this.selectorStats.fallbacksUsed++;
                    console.log(`🔄 Using fallback selector [${i+1}/${selectors.length}]: ${selector}`);
                }
                
                // Try to find the element
                await this.page.waitForSelector(selector, { timeout: timeout / selectors.length, visible });
                const element = await this.page.$(selector);
                
                if (element) {
                    return element;
                }
            } catch (error) {
                // Continue to next selector if this one fails
                continue;
            }
        }
        
        // All selectors failed
        this.selectorStats.failures++;
        throw new Error(`None of these selectors found an element: ${selectors.join(', ')}`);
    }

    /**
     * Find multiple elements using fallback strategy
     */
    async findElements(selectorOptions, options = {}) {
        const { timeout = 5000 } = options;
        const selectors = Array.isArray(selectorOptions) ? selectorOptions : [selectorOptions];
        
        for (let i = 0; i < selectors.length; i++) {
            const selector = selectors[i];
            
            try {
                if (i > 0) {
                    console.log(`🔄 Using fallback selector for multiple elements: ${selector}`);
                }
                
                const elements = await this.page.$$(selector);
                if (elements && elements.length > 0) {
                    return elements;
                }
            } catch (error) {
                continue;
            }
        }
        
        return []; // Return empty array if no elements found
    }

    /**
     * Type text into input using fallback selectors
     */
    async typeIntoInput(selectorOptions, text, options = {}) {
        const element = await this.findElement(selectorOptions, options);
        
        // Clear existing content and type new text
        await element.click({ clickCount: 3 }); // Select all
        await element.type(text);
        
        return element;
    }

    /**
     * Click element using fallback selectors
     */
    async clickElement(selectorOptions, options = {}) {
        const element = await this.findElement(selectorOptions, { ...options, visible: true });
        await element.click();
        return element;
    }

    /**
     * Get element text using fallback selectors
     */
    async getElementText(selectorOptions, options = {}) {
        const element = await this.findElement(selectorOptions, options);
        return await this.page.evaluate(el => el.textContent, element);
    }

    /**
     * Check if element exists using fallback selectors
     */
    async elementExists(selectorOptions, options = { timeout: 1000 }) {
        try {
            await this.findElement(selectorOptions, options);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Wait for element to disappear
     */
    async waitForElementToDisappear(selectorOptions, timeout = 5000) {
        const selectors = Array.isArray(selectorOptions) ? selectorOptions : [selectorOptions];
        
        for (const selector of selectors) {
            try {
                await this.page.waitForSelector(selector, { hidden: true, timeout });
                return true;
            } catch (error) {
                continue;
            }
        }
        
        return false;
    }

    /**
     * Generate resilient selector options for common patterns
     */
    static createSelectorOptions(baseSelector, options = {}) {
        const {
            testId,
            id,
            className,
            name,
            type,
            placeholder,
            role,
            ariaLabel
        } = options;
        
        const selectors = [];
        
        // Primary: data-testid (most stable)
        if (testId) {
            selectors.push(`[data-testid="${testId}"]`);
        }
        
        // Secondary: ID (fairly stable)
        if (id) {
            selectors.push(`#${id}`);
        }
        
        // Tertiary: Base selector (provided by caller)
        if (baseSelector) {
            selectors.push(baseSelector);
        }
        
        // Additional fallbacks based on attributes
        if (name) {
            selectors.push(`[name="${name}"]`);
        }
        
        if (type) {
            selectors.push(`input[type="${type}"]`);
        }
        
        if (placeholder) {
            selectors.push(`[placeholder="${placeholder}"]`);
            selectors.push(`[placeholder*="${placeholder.split(' ')[0]}"]`); // Partial match
        }
        
        if (className) {
            selectors.push(`.${className}`);
        }
        
        if (role) {
            selectors.push(`[role="${role}"]`);
        }
        
        if (ariaLabel) {
            selectors.push(`[aria-label="${ariaLabel}"]`);
            selectors.push(`[aria-label*="${ariaLabel.split(' ')[0]}"]`); // Partial match
        }
        
        return selectors;
    }

    /**
     * Common selector patterns for typical form elements
     */
    static getCommonSelectors() {
        return {
            emailInput: [
                '[data-testid="email"]',
                '[data-testid="email-input"]', 
                '#email',
                'input[type="email"]',
                'input[name="email"]',
                '[placeholder*="email" i]',
                '[placeholder*="Email"]'
            ],
            
            passwordInput: [
                '[data-testid="password"]',
                '[data-testid="password-input"]',
                '#password',
                'input[type="password"]',
                'input[name="password"]',
                '[placeholder*="password" i]',
                '[placeholder*="Password"]'
            ],
            
            submitButton: [
                '[data-testid="submit"]',
                '[data-testid="submit-button"]',
                '[data-testid="login-button"]',
                '#submit',
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("Submit")',
                'button:contains("Login")',
                'button:contains("Sign In")',
                '.submit-button',
                '.login-button'
            ],
            
            errorMessage: [
                '[data-testid="error"]',
                '[data-testid="error-message"]',
                '.error',
                '.error-message',
                '.alert-error',
                '[role="alert"]',
                '.text-red-500', // Tailwind
                '.text-danger'   // Bootstrap
            ],
            
            loadingSpinner: [
                '[data-testid="loading"]',
                '[data-testid="spinner"]',
                '.loading',
                '.spinner',
                '.loading-spinner',
                '[role="progressbar"]'
            ]
        };
    }

    /**
     * Get performance statistics
     */
    getStats() {
        return {
            ...this.selectorStats,
            fallbackRate: this.selectorStats.attempts > 0 
                ? (this.selectorStats.fallbacksUsed / this.selectorStats.attempts * 100).toFixed(1) + '%'
                : '0%',
            successRate: this.selectorStats.attempts > 0
                ? ((this.selectorStats.attempts - this.selectorStats.failures) / this.selectorStats.attempts * 100).toFixed(1) + '%'
                : '0%'
        };
    }

    /**
     * Log performance statistics
     */
    logStats() {
        const stats = this.getStats();
        console.log('\n📊 Selector Resilience Statistics:');
        console.log(`   Total Attempts: ${stats.attempts}`);
        console.log(`   Fallbacks Used: ${stats.fallbacksUsed} (${stats.fallbackRate})`);
        console.log(`   Failures: ${stats.failures}`);
        console.log(`   Success Rate: ${stats.successRate}`);
    }
}

module.exports = SelectorResilience;
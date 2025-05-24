# Implementation Guide: MCP Frontend Testing

## Quick Start Overview

### What This System Does

The MCP Frontend Testing system allows Claude to:
1. **Understand** natural language test requests
2. **Execute** complex browser-based workflows
3. **Capture** screenshots, console logs, and network activity
4. **Report** detailed results back to you

### Example Conversation Flow

```
You: "Test the login flow on my React app, try both valid and invalid credentials"

Claude: I'll test your React app's login flow. Let me execute this workflow:

[Executing Test Workflow: Login Flow Test]
✅ Step 1: Launching browser
✅ Step 2: Navigating to http://localhost:3000
✅ Step 3: Testing invalid credentials
   - Entered: invalid@email / wrongpass
   - Screenshot: login-invalid-attempt.png
   - Console: Error: "Invalid credentials" (expected)
✅ Step 4: Testing valid credentials  
   - Entered: user@example.com / correctpass
   - Screenshot: login-success.png
   - Console: Info: "User authenticated successfully"
✅ Step 5: Verifying redirect to dashboard
   - Current URL: /dashboard
   - Found element: [data-testid="user-welcome"]

Test Summary:
- Duration: 8.3 seconds
- All 5 steps passed
- 2 screenshots captured
- No unexpected errors
```

## Core Components

### 1. MCP Server (`src/index.ts`)
The main server that provides tools to Claude:

```typescript
// Key tools exposed to Claude
tools: [
  'execute_workflow',     // Run complete test workflows
  'capture_screenshot',   // Take screenshots with annotations
  'get_console_logs',     // Retrieve browser console output
  'analyze_performance',  // Get performance metrics
  'validate_element',     // Check element state/properties
]
```

### 2. Workflow Engine (`src/workflow-engine.ts`)
Interprets and executes test workflows:

```typescript
class WorkflowEngine {
  async executeWorkflow(workflow: TestWorkflow) {
    // 1. Validate workflow structure
    // 2. Launch browser with options
    // 3. Execute each step sequentially
    // 4. Capture data at each step
    // 5. Generate comprehensive report
  }
}
```

### 3. Step Executors (`src/step-executors/`)
Individual handlers for each step type:

```typescript
// Example: ClickExecutor
export class ClickExecutor {
  async execute(page: Page, step: ClickStep) {
    // Wait for element if needed
    if (step.waitForSelector) {
      await page.waitForSelector(step.selector);
    }
    
    // Highlight element before clicking (for screenshots)
    await this.highlightElement(page, step.selector);
    
    // Perform click
    await page.click(step.selector);
    
    // Capture post-click state
    return {
      success: true,
      screenshot: await page.screenshot(),
      consoleLogs: this.getNewConsoleLogs()
    };
  }
}
```

## Usage Patterns

### Pattern 1: Simple Action Testing
```
You: "Click the submit button and check if it shows a success message"

Claude executes:
- Click action on submit button
- Wait for response
- Check for success message element
- Capture screenshot of result
```

### Pattern 2: Complex Form Workflow
```
You: "Fill out the registration form with test data and submit"

Claude executes:
- Navigate to registration page
- Fill each form field
- Handle dropdowns/checkboxes
- Submit form
- Verify success/error states
- Capture validation messages
```

### Pattern 3: Visual Regression Testing
```
You: "Compare the homepage layout with the previous version"

Claude executes:
- Navigate to page
- Take full-page screenshot
- Compare with baseline
- Highlight differences
- Report visual changes
```

## MCP Configuration

### Adding to Claude Settings

```json
{
  "mcpServers": {
    "frontend-test": {
      "command": "node",
      "args": ["/path/to/test_frontend/dist/index.js"],
      "env": {
        "SCREENSHOTS_DIR": "/path/to/screenshots",
        "WORKFLOWS_DIR": "/path/to/workflows"
      }
    }
  }
}
```

### Environment Variables

```bash
# Optional configuration
PUPPETEER_HEADLESS=false      # Show browser window
SCREENSHOT_QUALITY=90          # JPEG quality
DEFAULT_TIMEOUT=30000          # Step timeout in ms
CAPTURE_NETWORK=true           # Log network requests
CAPTURE_CONSOLE=true           # Log console output
```

## Workflow Definition Format

### YAML Format (Recommended)
```yaml
name: "User Journey Test"
description: "Test complete user journey from landing to purchase"
config:
  baseUrl: "${BASE_URL}"
  headless: ${HEADLESS}
  slowMo: 50  # Slow down for visibility

variables:
  testEmail: "test_${timestamp}@example.com"
  
steps:
  - name: "Visit Homepage"
    type: navigate
    url: "/"
    screenshot: 
      name: "01-homepage"
      fullPage: true
      
  - name: "Search for Product"  
    type: type
    selector: "#search-input"
    value: "laptop"
    enter: true  # Press enter after typing
    
  - name: "Select First Result"
    type: click
    selector: ".product-card:first-child"
    waitFor: ".product-details"
    
  - name: "Add to Cart"
    type: click
    selector: "[data-action='add-to-cart']"
    screenshot:
      name: "02-product-added"
      highlight: ".cart-indicator"
      
assertions:
  - selector: ".cart-count"
    property: "innerText"
    equals: "1"
    
cleanup:
  - type: "clear-cookies"
  - type: "clear-localstorage"
```

### JSON Format
```json
{
  "name": "API Integration Test",
  "steps": [
    {
      "type": "evaluate",
      "description": "Mock API responses",
      "code": "window.fetch = mockFetch(window.fetch, { '/api/user': { name: 'Test User' } })"
    },
    {
      "type": "navigate",
      "url": "/profile"
    },
    {
      "type": "waitFor",
      "selector": "[data-loaded='true']"
    },
    {
      "type": "assertText",
      "selector": ".user-name",
      "value": "Test User"
    }
  ]
}
```

## Advanced Features

### 1. Conditional Execution
```yaml
steps:
  - type: evaluate
    id: check-feature
    code: "localStorage.getItem('feature-flag') === 'enabled'"
    
  - type: click
    when: "${check-feature} === true"
    selector: ".new-feature-button"
    
  - type: click
    when: "${check-feature} === false"
    selector: ".old-feature-button"
```

### 2. Retry Logic
```yaml
steps:
  - type: click
    selector: ".flaky-button"
    retry:
      times: 3
      delay: 1000
      condition: "element.disabled === false"
```

### 3. Custom Scripts
```yaml
steps:
  - type: custom
    description: "Set up test environment"
    script: |
      // Inject test utilities
      window.testHelpers = {
        fillForm: (data) => { /* ... */ },
        mockDate: (date) => { /* ... */ }
      };
```

### 4. Parallel Execution
```yaml
parallel:
  - branch: "Desktop Test"
    config:
      viewport: { width: 1920, height: 1080 }
    steps: [...]
    
  - branch: "Mobile Test"
    config:
      viewport: { width: 375, height: 667 }
      userAgent: "Mobile Safari"
    steps: [...]
```

## Error Handling

### Automatic Recovery
```typescript
const recoveryStrategies = {
  'element-not-found': async (page, step) => {
    // Try alternative selectors
    const alternatives = [
      step.selector,
      `[data-testid="${step.testId}"]`,
      `[aria-label="${step.ariaLabel}"]`
    ];
    
    for (const selector of alternatives) {
      if (await page.$(selector)) {
        return { recovered: true, selector };
      }
    }
    return { recovered: false };
  },
  
  'timeout': async (page, step) => {
    // Reload and retry
    await page.reload();
    return { retry: true };
  }
};
```

### Error Reporting
```
Test Failed at Step 3: "Click checkout button"
Error: Element not found: button#checkout

Context:
- Previous step: "Add item to cart" (success)
- Page URL: /cart
- Console errors: None
- Network failures: None

Recovery attempted:
- Tried alternative selector: [data-action="checkout"] (not found)
- Tried waiting additional 5s (no change)

Screenshot: error-step-3-1698765432.png
DOM snapshot: error-step-3-1698765432.html
```

## Best Practices

### 1. Descriptive Selectors
```yaml
# Good
selector: "[data-testid='submit-order']"
selector: "button[aria-label='Submit Order']"

# Avoid
selector: ".btn-2"
selector: "div > div > button"
```

### 2. Wait Strategies
```yaml
# Explicit waits
- type: waitFor
  selector: "[data-loaded='true']"
  
# Smart waits
- type: waitFor
  condition: "document.readyState === 'complete' && !document.querySelector('.spinner')"
```

### 3. Screenshot Strategy
```yaml
screenshots:
  onError: always
  onSuccess: key-steps  # Only important steps
  format: png
  path: "./screenshots/${workflow-name}/${timestamp}"
```

### 4. Console Filtering
```yaml
consoleCapture:
  levels: ["error", "warn"]
  exclude: [
    "Third-party script",
    "[HMR]",  # Hot module reload
    "DevTools"
  ]
```

## Integration Examples

### With CI/CD
```bash
# GitHub Actions
- name: Run Frontend Tests
  run: |
    claude-mcp test-frontend \
      --workflow=./tests/checkout-flow.yaml \
      --headless=true \
      --report=junit
```

### With Test Frameworks
```javascript
// Jest integration
describe('Frontend Workflows', () => {
  it('should complete checkout flow', async () => {
    const result = await mcp.executeWorkflow('./checkout.yaml');
    expect(result.status).toBe('success');
    expect(result.steps.failed).toHaveLength(0);
  });
});
```

### With Monitoring
```typescript
// Send results to monitoring service
mcp.on('workflow:complete', async (result) => {
  await fetch('https://monitoring.example.com/api/tests', {
    method: 'POST',
    body: JSON.stringify({
      workflow: result.name,
      duration: result.duration,
      success: result.status === 'success',
      errors: result.errors
    })
  });
});
```
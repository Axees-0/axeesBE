# Workflow Execution Flow

## How Claude Orchestrates Frontend Testing

### 1. Workflow Initiation
```
Claude Code CLI
    │
    ├─> "Test the checkout flow on my e-commerce site"
    │
    └─> MCP Server receives request with:
        - Natural language description
        - Context about the frontend
        - Expected outcomes
```

### 2. Workflow Translation
```
MCP Server
    │
    ├─> Parses natural language into structured workflow
    │
    ├─> Identifies key actions:
    │   - Navigate to product page
    │   - Add to cart
    │   - Proceed to checkout
    │   - Fill payment details
    │   - Submit order
    │
    └─> Generates TestWorkflow object
```

### 3. Step-by-Step Execution

#### Step 1: Navigate
```yaml
- type: navigate
  value: "https://example-store.com/products/laptop"
  screenshot: true
  consoleCapture: true
```
**Actions**:
- Opens browser
- Navigates to URL
- Waits for page load
- Captures initial state

#### Step 2: Add to Cart
```yaml
- type: click
  selector: "[data-testid='add-to-cart']"
  waitAfter: 2000
  screenshot: true
```
**Actions**:
- Locates button
- Clicks element
- Waits for animation
- Captures result

#### Step 3: Cart Verification
```yaml
- type: assertText
  selector: ".cart-count"
  value: "1"
  screenshot: true
```
**Actions**:
- Checks cart updated
- Verifies count
- Documents state

### 4. Data Collection During Execution

```typescript
interface ExecutionContext {
  // Console logs from each step
  consoleLogs: {
    step1: [
      { level: 'info', message: 'Product loaded', timestamp: '...' },
      { level: 'warn', message: 'Slow API response', timestamp: '...' }
    ],
    step2: [
      { level: 'log', message: 'Add to cart clicked', timestamp: '...' },
      { level: 'error', message: 'Analytics failed to load', timestamp: '...' }
    ]
  },
  
  // Screenshots at each step
  screenshots: {
    step1: 'screenshots/001-product-page.png',
    step2: 'screenshots/002-cart-updated.png',
    step3: 'screenshots/003-checkout-page.png'
  },
  
  // Network activity
  networkActivity: {
    apiCalls: [
      { url: '/api/cart/add', status: 200, duration: 234 },
      { url: '/api/inventory/check', status: 200, duration: 123 }
    ],
    failures: []
  },
  
  // Performance metrics
  performance: {
    step1: { loadTime: 1234, FCP: 456 },
    step2: { interactionDelay: 100 },
    step3: { totalTime: 5678 }
  }
}
```

### 5. Report Generation

```markdown
# Test Execution Report

## Workflow: E-commerce Checkout
**Status**: ✅ Success
**Duration**: 45.3 seconds
**Steps**: 8/8 passed

### Timeline
1. [00:00] Navigate to product page ✅
2. [00:03] Add item to cart ✅
3. [00:05] Navigate to checkout ✅
4. [00:08] Fill shipping info ✅
5. [00:15] Enter payment details ✅
6. [00:20] Submit order ✅
7. [00:25] Wait for confirmation ✅
8. [00:30] Verify order number ✅

### Console Output Highlights
- ⚠️ Warning: Deprecation notice for analytics library
- ❌ Error: Failed to load marketing pixel (non-critical)
- ℹ️ Info: Order #12345 created successfully

### Screenshots
[Generated grid of thumbnails with links to full images]

### Performance Summary
- Page Load Time: 1.2s (Good)
- Time to Interactive: 2.3s (Needs Improvement)
- Total Workflow Time: 45.3s
```

## Example Workflows for Different Frameworks

### React SPA with Router
```yaml
name: "React Router Navigation Test"
config:
  baseUrl: "http://localhost:3000"
steps:
  - type: navigate
    value: "/"
  - type: wait
    selector: "[data-testid='home-page']"
  - type: click
    selector: "a[href='/products']"
  - type: wait
    selector: "[data-testid='products-page']"
  - type: evaluate
    value: "window.location.pathname === '/products'"
  - type: screenshot
    options:
      fullPage: true
```

### Vue.js with Vuex State
```yaml
name: "Vue State Management Test"
steps:
  - type: navigate
    value: "/"
  - type: evaluate
    value: "window.__VUE_DEVTOOLS_GLOBAL_HOOK__ !== undefined"
  - type: click
    selector: ".increment-button"
  - type: wait
    value: 100
  - type: evaluate
    value: "document.querySelector('.counter').innerText === '1'"
```

### Angular with Forms
```yaml
name: "Angular Reactive Form Test"
steps:
  - type: navigate
    value: "/register"
  - type: type
    selector: "input[formControlName='email']"
    value: "invalid-email"
  - type: assertVisible
    selector: "mat-error"
  - type: clear
    selector: "input[formControlName='email']"
  - type: type
    selector: "input[formControlName='email']"
    value: "valid@email.com"
  - type: assertNotVisible
    selector: "mat-error"
```

## Advanced Features

### 1. Conditional Steps
```yaml
steps:
  - type: evaluate
    id: "check-feature-flag"
    value: "window.featureFlags?.newCheckout === true"
  - type: click
    condition: "check-feature-flag === true"
    selector: ".new-checkout-button"
  - type: click
    condition: "check-feature-flag === false"
    selector: ".legacy-checkout-button"
```

### 2. Loop Constructs
```yaml
steps:
  - type: loop
    count: 3
    steps:
      - type: click
        selector: ".add-item"
      - type: wait
        value: 500
  - type: assertText
    selector: ".item-count"
    value: "3"
```

### 3. Dynamic Selectors
```yaml
steps:
  - type: click
    selector: "button:contains('${productName}')"
    variables:
      productName: "Laptop Pro 2024"
```

## Integration with Claude Code

### Command Examples
```bash
# Run a predefined workflow
claude> test frontend workflow checkout-flow

# Run with custom parameters
claude> test frontend workflow checkout-flow --headless=false --slowMo=100

# Debug a specific step
claude> test frontend debug-step "click .submit-button" --highlight

# Generate workflow from description
claude> test frontend generate "Test the login flow with invalid credentials"
```

### Natural Language Processing
Claude can interpret requests like:
- "Test the payment form with invalid credit card"
- "Verify the search results update when typing"
- "Check if the modal closes when clicking outside"
- "Ensure the cart persists after page refresh"

And automatically generate appropriate workflow steps.
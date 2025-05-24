# Frontend Framework Testing Examples

## React Application Testing

### Scenario: Testing a React E-commerce Application

```yaml
name: "React E-commerce Full Flow"
description: "Test product search, filtering, and purchase flow"
config:
  baseUrl: "https://react-store.example.com"
  viewport: { width: 1280, height: 720 }
  headless: false  # Show browser for demo
  
steps:
  # Test search functionality
  - id: "search-products"
    type: "type"
    selector: "input[data-testid='search-input']"
    value: "wireless headphones"
    screenshot: true
    description: "Search for wireless headphones"
    
  - type: "evaluate"
    value: |
      // Wait for React to update
      return new Promise(resolve => {
        const checkUpdate = () => {
          const results = document.querySelectorAll('[data-testid="product-card"]');
          if (results.length > 0) resolve(true);
          else setTimeout(checkUpdate, 100);
        };
        checkUpdate();
      });
    
  # Test filtering
  - type: "click"
    selector: "button[data-testid='filter-price']"
    description: "Open price filter"
    
  - type: "type"
    selector: "input[data-testid='max-price']"
    value: "200"
    
  - type: "click"
    selector: "button[data-testid='apply-filters']"
    screenshot: true
    
  # Verify Redux state update
  - type: "evaluate"
    value: |
      // Check Redux DevTools
      const state = window.__REDUX_DEVTOOLS_EXTENSION__.getState();
      return state.products.filters.maxPrice === 200;
    description: "Verify Redux state updated with filter"
    
  # Add to cart
  - type: "click"
    selector: "[data-testid='product-card']:first-child button[data-testid='add-to-cart']"
    waitAfter: 1000
    
  # Check cart indicator
  - type: "assertText"
    selector: "[data-testid='cart-count']"
    value: "1"
    screenshot: true
    
consoleCapture:
  levels: ["error", "warn"]
  filter: "!localhost:3001"  # Exclude dev server logs
```

### React-Specific Considerations
```typescript
// Helper for React testing
const reactHelpers = {
  waitForReactUpdate: async (page) => {
    await page.evaluate(() => {
      return new Promise(resolve => {
        if (window.React && window.React.version) {
          // Use React's act() if available
          const act = window.ReactTestUtils?.act || (fn => fn());
          act(() => {
            setTimeout(resolve, 0);
          });
        } else {
          setTimeout(resolve, 100);
        }
      });
    });
  },
  
  getReactProps: async (page, selector) => {
    return page.evaluate((sel) => {
      const element = document.querySelector(sel);
      const key = Object.keys(element).find(key => key.startsWith('__reactInternalInstance'));
      return element[key]?.memoizedProps;
    }, selector);
  }
};
```

## Vue.js Application Testing

### Scenario: Testing a Vue.js Dashboard

```yaml
name: "Vue Dashboard Analytics Test"
description: "Test dashboard data loading and interactions"
config:
  baseUrl: "https://vue-dashboard.example.com"
  
steps:
  # Wait for Vue app mount
  - type: "wait"
    selector: "#app[data-v-app]"
    description: "Wait for Vue app to mount"
    
  # Login flow
  - type: "type"
    selector: "input[v-model='username']"
    value: "demo@example.com"
    
  - type: "type"
    selector: "input[v-model='password']"
    value: "demo123"
    
  - type: "click"
    selector: "button.login-btn"
    
  # Wait for Vue Router navigation
  - type: "evaluate"
    value: |
      return new Promise(resolve => {
        const unwatch = window.app.$router.afterEach(() => {
          unwatch();
          resolve(true);
        });
      });
    description: "Wait for Vue Router navigation"
    
  # Test Vuex store
  - type: "evaluate"
    value: |
      const store = window.app.$store;
      return store.state.user.isAuthenticated === true;
    description: "Verify Vuex authentication state"
    
  # Test date picker component
  - type: "click"
    selector: ".v-date-picker-trigger"
    
  - type: "click"
    selector: ".v-date-picker-table td:contains('15')"
    
  # Test chart interactions
  - type: "hover"
    selector: ".chart-container .bar:nth-child(3)"
    screenshot: true
    description: "Hover over chart bar to show tooltip"
    
  # Verify data binding
  - type: "evaluate"
    value: |
      const vm = window.app;
      return vm.chartData.datasets[0].data.length > 0;
    
networkMonitor:
  trackAPIs: ["/api/dashboard/*", "/api/analytics/*"]
  alertOnError: true
```

### Vue-Specific Helpers
```typescript
const vueHelpers = {
  getVueComponent: async (page, selector) => {
    return page.evaluate((sel) => {
      const element = document.querySelector(sel);
      return element.__vue__;
    }, selector);
  },
  
  waitForVuexAction: async (page, actionName) => {
    return page.evaluate((action) => {
      return new Promise(resolve => {
        const unsubscribe = window.app.$store.subscribeAction({
          after: (action, state) => {
            if (action.type === actionName) {
              unsubscribe();
              resolve(state);
            }
          }
        });
      });
    }, actionName);
  }
};
```

## Angular Application Testing

### Scenario: Testing an Angular Enterprise Form

```yaml
name: "Angular Complex Form Workflow"
description: "Test multi-step form with validation"
config:
  baseUrl: "https://angular-app.example.com"
  
steps:
  # Wait for Angular
  - type: "evaluate"
    value: "window.getAllAngularRootElements !== undefined"
    description: "Verify Angular is loaded"
    
  # Step 1: Personal Information
  - type: "type"
    selector: "input[formControlName='firstName']"
    value: "John"
    
  - type: "type"
    selector: "input[formControlName='lastName']"
    value: "Doe"
    
  - type: "type"
    selector: "input[formControlName='email']"
    value: "invalid-email"
    
  # Check Angular validation
  - type: "assertVisible"
    selector: "mat-error:contains('Valid email required')"
    screenshot: true
    
  - type: "clear"
    selector: "input[formControlName='email']"
    
  - type: "type"
    selector: "input[formControlName='email']"
    value: "john.doe@example.com"
    
  # Material Design interactions
  - type: "click"
    selector: "mat-select[formControlName='country']"
    
  - type: "click"
    selector: "mat-option:contains('United States')"
    
  # Next step
  - type: "click"
    selector: "button:contains('Next')"
    
  # Step 2: With CDK Virtual Scroll
  - type: "scroll"
    selector: "cdk-virtual-scroll-viewport"
    value: { top: 500 }
    
  - type: "click"
    selector: ".item-row:contains('Premium Plan')"
    
  # Test Angular animations
  - type: "evaluate"
    value: |
      // Wait for Angular animations
      return new Promise(resolve => {
        window.ng.getComponent(document.querySelector('app-root'))
          .animationsDone.subscribe(() => resolve(true));
      });
    
  # Submit form
  - type: "click"
    selector: "button[type='submit']"
    description: "Submit the form"
    
  # Wait for HTTP call
  - type: "evaluate"
    value: |
      return new Promise(resolve => {
        const interval = setInterval(() => {
          const spinner = document.querySelector('mat-spinner');
          if (!spinner) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
      });
    
performanceMetrics:
  captureAngularPerfMetrics: true
  checkChangeDetectionCycles: true
```

### Angular-Specific Helpers
```typescript
const angularHelpers = {
  getAngularComponent: async (page, selector) => {
    return page.evaluate((sel) => {
      const element = document.querySelector(sel);
      return window.ng.getComponent(element);
    }, selector);
  },
  
  triggerChangeDetection: async (page) => {
    return page.evaluate(() => {
      const appRef = window.ng.getInjector(document.querySelector('app-root'))
        .get(window.ng.ApplicationRef);
      appRef.tick();
    });
  },
  
  waitForHttpComplete: async (page) => {
    return page.evaluate(() => {
      return new Promise(resolve => {
        const http = window.ng.getInjector(document.querySelector('app-root'))
          .get(window.ng.HttpClient);
        // Implementation specific to Angular version
      });
    });
  }
};
```

## Framework Detection and Auto-Configuration

```typescript
interface FrameworkDetector {
  detect: async (page: Page) => {
    const frameworks = await page.evaluate(() => {
      const detected = [];
      
      // React
      if (window.React || document.querySelector('[data-reactroot]')) {
        detected.push({
          name: 'react',
          version: window.React?.version,
          devTools: !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__
        });
      }
      
      // Vue
      if (window.Vue || document.querySelector('[data-server-rendered]')) {
        detected.push({
          name: 'vue',
          version: window.Vue?.version,
          devTools: !!window.__VUE_DEVTOOLS_GLOBAL_HOOK__
        });
      }
      
      // Angular
      if (window.ng || document.querySelector('[ng-version]')) {
        detected.push({
          name: 'angular',
          version: document.querySelector('[ng-version]')?.getAttribute('ng-version')
        });
      }
      
      // Next.js
      if (window.__NEXT_DATA__) {
        detected.push({
          name: 'nextjs',
          version: window.__NEXT_DATA__.version
        });
      }
      
      return detected;
    });
    
    return frameworks;
  };
}
```

## Cross-Framework Testing Patterns

### 1. Form Validation Testing
```yaml
# Works across all frameworks
steps:
  - type: "type"
    selector: "input[type='email']"
    value: "invalid"
  - type: "evaluate"
    value: |
      // Generic validation check
      const input = document.querySelector("input[type='email']");
      return !input.validity.valid || 
             document.querySelector('.error-message') !== null;
```

### 2. API Mocking
```yaml
steps:
  - type: "evaluate"
    value: |
      // Intercept fetch calls
      window.fetch = new Proxy(window.fetch, {
        apply: (target, thisArg, args) => {
          const [url, options] = args;
          console.log('API Call:', url);
          if (url.includes('/api/test')) {
            return Promise.resolve(new Response(JSON.stringify({ 
              success: true 
            })));
          }
          return target.apply(thisArg, args);
        }
      });
```

### 3. Performance Monitoring
```yaml
steps:
  - type: "evaluate"
    value: |
      window.performanceMarks = {
        start: performance.now()
      };
  # ... perform actions ...
  - type: "evaluate"
    value: |
      window.performanceMarks.end = performance.now();
      const duration = window.performanceMarks.end - window.performanceMarks.start;
      return {
        duration,
        entries: performance.getEntriesByType('measure')
      };
```
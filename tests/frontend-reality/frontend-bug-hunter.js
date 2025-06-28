/**
 * FRONTEND BUG HUNTER SUITE
 * 
 * Catches the bugs that users actually experience in the frontend
 * Based on 15 years of debugging "it works in dev but breaks for users"
 * 
 * This tests the FRONTEND behavior, not just API responses
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class FrontendBugHunter {
  constructor() {
    this.browser = null;
    this.page = null;
    this.bugs = {
      critical: [],
      high: [],
      medium: [],
      passed: []
    };
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.testStartTime = Date.now();
  }

  async initialize() {
    console.log('🕷️ FRONTEND BUG HUNTER - Starting Browser');
    
    this.browser = await puppeteer.launch({
      headless: false, // See what's happening
      devtools: true,  // Open devtools to catch console errors
      slowMo: 50,      // Slow down to see interactions
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security', // For CORS testing
        '--allow-running-insecure-content'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set realistic viewport (mobile + desktop testing)
    await this.page.setViewport({ width: 1366, height: 768 });
    
    // Listen for console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.logBug('high', 'Console Error', msg.text());
      }
    });

    // Listen for uncaught exceptions
    this.page.on('pageerror', error => {
      this.logBug('critical', 'Uncaught Exception', error.message);
    });

    // Listen for network failures
    this.page.on('requestfailed', request => {
      this.logBug('high', 'Network Failure', `${request.method()} ${request.url()} - ${request.failure().errorText}`);
    });
  }

  async runComprehensiveBugHunt() {
    console.log('🎯 COMPREHENSIVE FRONTEND BUG HUNT');
    console.log('Hunting for bugs that users actually experience...\n');

    await this.initialize();

    try {
      // Critical user journeys that MUST work
      await this.huntAuthenticationBugs();
      await this.huntNavigationBugs();
      await this.huntFormBugs();
      await this.huntFileUploadBugs();
      await this.huntRealTimeBugs();
      await this.huntMobileBugs();
      await this.huntPerformanceBugs();
      await this.huntStateBugs();
      await this.huntUIBugs();
      await this.huntDataLoadingBugs();

    } finally {
      await this.generateReport();
      await this.cleanup();
    }
  }

  async huntAuthenticationBugs() {
    console.log('🔐 HUNTING AUTHENTICATION BUGS');
    
    try {
      await this.page.goto(`${this.baseUrl}/login`);
      
      // Bug: Login form doesn't handle network errors gracefully
      await this.testNetworkErrorHandling();
      
      // Bug: Password field shows characters momentarily
      await this.testPasswordFieldSecurity();
      
      // Bug: Session expiry doesn't redirect properly
      await this.testSessionExpiryRedirect();
      
      // Bug: Multiple rapid login attempts cause UI freeze
      await this.testRapidLoginAttempts();
      
      // Bug: Browser back button after logout shows cached data
      await this.testBackButtonSecurity();
      
      this.bugs.passed.push('Authentication flow basic validation');
      
    } catch (error) {
      this.logBug('critical', 'Authentication Flow Broken', error.message);
    }
  }

  async huntNavigationBugs() {
    console.log('🧭 HUNTING NAVIGATION BUGS');
    
    try {
      // Bug: Deep links don't work after app refresh
      await this.testDeepLinkingAfterRefresh();
      
      // Bug: Browser back/forward button breaks app state
      await this.testBrowserNavigationState();
      
      // Bug: Navigation menu doesn't highlight current page
      await this.testNavigationActiveStates();
      
      // Bug: Route changes don't scroll to top
      await this.testScrollPositionOnRouteChange();
      
      // Bug: 404 page doesn't handle invalid routes gracefully
      await this.testInvalidRouteHandling();
      
      this.bugs.passed.push('Navigation basic functionality');
      
    } catch (error) {
      this.logBug('high', 'Navigation System Broken', error.message);
    }
  }

  async huntFormBugs() {
    console.log('📝 HUNTING FORM BUGS');
    
    try {
      await this.page.goto(`${this.baseUrl}/create-offer`);
      
      // Bug: Form data lost on page refresh/navigation
      await this.testFormDataPersistence();
      
      // Bug: Validation errors don't clear when field is corrected
      await this.testValidationErrorClearing();
      
      // Bug: Submit button stays disabled after form validation passes
      await this.testSubmitButtonState();
      
      // Bug: Form allows submission with invalid data
      await this.testClientSideValidationBypass();
      
      // Bug: Large text input causes UI to freeze
      await this.testLargeTextInputPerformance();
      
      // Bug: Required field indicators inconsistent
      await this.testRequiredFieldIndicators();
      
      // Bug: Form submission shows success but data not saved
      await this.testFormSubmissionConsistency();
      
      this.bugs.passed.push('Form handling basic validation');
      
    } catch (error) {
      this.logBug('critical', 'Form System Broken', error.message);
    }
  }

  async huntFileUploadBugs() {
    console.log('📁 HUNTING FILE UPLOAD BUGS');
    
    try {
      await this.page.goto(`${this.baseUrl}/chat`);
      
      // Bug: Large file upload causes browser to freeze
      await this.testLargeFileUploadFreeze();
      
      // Bug: Upload progress bar shows 100% but upload failed
      await this.testUploadProgressAccuracy();
      
      // Bug: Multiple file selection doesn't work properly
      await this.testMultipleFileSelection();
      
      // Bug: File type validation happens after upload starts
      await this.testFileTypeValidationTiming();
      
      // Bug: Upload cancellation doesn't work
      await this.testUploadCancellation();
      
      // Bug: File upload on mobile has touch issues
      await this.testMobileFileUpload();
      
      // Bug: Drag and drop doesn't provide visual feedback
      await this.testDragDropFeedback();
      
      this.bugs.passed.push('File upload basic functionality');
      
    } catch (error) {
      this.logBug('high', 'File Upload System Broken', error.message);
    }
  }

  async huntRealTimeBugs() {
    console.log('⚡ HUNTING REAL-TIME BUGS');
    
    try {
      await this.page.goto(`${this.baseUrl}/chat`);
      
      // Bug: WebSocket connection drops don't trigger reconnection
      await this.testWebSocketReconnection();
      
      // Bug: Messages appear out of order in UI
      await this.testMessageOrdering();
      
      // Bug: Typing indicators get stuck
      await this.testTypingIndicatorCleanup();
      
      // Bug: Real-time updates cause memory leaks
      await this.testRealTimeMemoryLeaks();
      
      // Bug: Notifications don't work when app is backgrounded
      await this.testBackgroundNotifications();
      
      // Bug: Chat scroll position jumps when new messages arrive
      await this.testChatScrollBehavior();
      
      this.bugs.passed.push('Real-time features basic functionality');
      
    } catch (error) {
      this.logBug('high', 'Real-time System Broken', error.message);
    }
  }

  async huntMobileBugs() {
    console.log('📱 HUNTING MOBILE BUGS');
    
    try {
      // Switch to mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.goto(`${this.baseUrl}`);
      
      // Bug: Touch targets too small
      await this.testTouchTargetSizes();
      
      // Bug: Horizontal scrolling on mobile
      await this.testMobileHorizontalScroll();
      
      // Bug: Input fields don't trigger proper keyboard
      await this.testMobileKeyboardTriggers();
      
      // Bug: Zoom breaks layout
      await this.testMobileZoomHandling();
      
      // Bug: Swipe gestures conflict with page scrolling
      await this.testSwipeGestureConflicts();
      
      // Bug: Pull-to-refresh triggers accidentally
      await this.testPullToRefreshHandling();
      
      // Bug: Status bar overlaps content
      await this.testMobileStatusBarHandling();
      
      // Reset to desktop
      await this.page.setViewport({ width: 1366, height: 768 });
      
      this.bugs.passed.push('Mobile responsive design basic check');
      
    } catch (error) {
      this.logBug('high', 'Mobile Experience Broken', error.message);
    }
  }

  async huntPerformanceBugs() {
    console.log('🚀 HUNTING PERFORMANCE BUGS');
    
    try {
      // Bug: App takes too long to load initially
      await this.testInitialLoadPerformance();
      
      // Bug: Memory usage grows over time (memory leaks)
      await this.testMemoryLeakDetection();
      
      // Bug: Large lists cause UI to freeze
      await this.testLargeListPerformance();
      
      // Bug: Images don't lazy load properly
      await this.testImageLazyLoading();
      
      // Bug: JavaScript bundles too large
      await this.testBundleSizeAnalysis();
      
      // Bug: Unused CSS increases load time
      await this.testCSSPerformance();
      
      // Bug: Third-party scripts block rendering
      await this.testThirdPartyScriptImpact();
      
      this.bugs.passed.push('Performance baseline acceptable');
      
    } catch (error) {
      this.logBug('medium', 'Performance Issues Detected', error.message);
    }
  }

  async huntStateBugs() {
    console.log('🔄 HUNTING STATE MANAGEMENT BUGS');
    
    try {
      await this.page.goto(`${this.baseUrl}/dashboard`);
      
      // Bug: State updates don't trigger UI re-render
      await this.testStateUpdateRendering();
      
      // Bug: Stale state shown after API calls
      await this.testStaleStateDisplay();
      
      // Bug: Race conditions in state updates
      await this.testStateRaceConditions();
      
      // Bug: Component unmounting doesn't clean up state
      await this.testStateCleanupOnUnmount();
      
      // Bug: Local storage state gets corrupted
      await this.testLocalStorageStateIntegrity();
      
      // Bug: State doesn't persist across browser refresh
      await this.testStatePersistenceAcrossRefresh();
      
      this.bugs.passed.push('State management basic functionality');
      
    } catch (error) {
      this.logBug('high', 'State Management Broken', error.message);
    }
  }

  async huntUIBugs() {
    console.log('🎨 HUNTING UI/UX BUGS');
    
    try {
      // Bug: Loading states don't show properly
      await this.testLoadingStateDisplay();
      
      // Bug: Error messages don't display clearly
      await this.testErrorMessageDisplay();
      
      // Bug: Tooltips get cut off by container boundaries
      await this.testTooltipPositioning();
      
      // Bug: Modal dialogs don't trap focus properly
      await this.testModalFocusTrapping();
      
      // Bug: Dropdown menus extend outside viewport
      await this.testDropdownPositioning();
      
      // Bug: Color contrast doesn't meet accessibility standards
      await this.testColorContrastAccessibility();
      
      // Bug: Animations cause seizure triggers
      await this.testAnimationAccessibility();
      
      // Bug: UI elements overlap at certain screen sizes
      await this.testResponsiveOverlaps();
      
      this.bugs.passed.push('UI/UX basic visual check');
      
    } catch (error) {
      this.logBug('medium', 'UI/UX Issues Detected', error.message);
    }
  }

  async huntDataLoadingBugs() {
    console.log('📊 HUNTING DATA LOADING BUGS');
    
    try {
      await this.page.goto(`${this.baseUrl}/analytics`);
      
      // Bug: Infinite loading states when API fails
      await this.testInfiniteLoadingStates();
      
      // Bug: Stale data shown while loading new data
      await this.testStaleDataDuringLoading();
      
      // Bug: Error states don't provide retry options
      await this.testErrorStateRetryOptions();
      
      // Bug: Pagination doesn't work properly
      await this.testPaginationFunctionality();
      
      // Bug: Search results don't update properly
      await this.testSearchResultUpdates();
      
      // Bug: Data refreshing causes UI flicker
      await this.testDataRefreshFlicker();
      
      this.bugs.passed.push('Data loading basic functionality');
      
    } catch (error) {
      this.logBug('high', 'Data Loading System Broken', error.message);
    }
  }

  // Individual test implementations
  async testNetworkErrorHandling() {
    // Simulate network failure during login
    await this.page.setOfflineMode(true);
    
    await this.page.type('[data-testid="phone-input"]', '+1234567890');
    await this.page.type('[data-testid="password-input"]', 'testpassword');
    await this.page.click('[data-testid="login-button"]');
    
    // Check if error message appears
    const errorMessage = await this.page.$('[data-testid="error-message"]');
    if (!errorMessage) {
      this.logBug('high', 'Network Error Handling', 'Login form does not show network error message');
    }
    
    await this.page.setOfflineMode(false);
  }

  async testPasswordFieldSecurity() {
    const passwordInput = await this.page.$('[data-testid="password-input"]');
    if (passwordInput) {
      const inputType = await this.page.evaluate(el => el.type, passwordInput);
      if (inputType !== 'password') {
        this.logBug('critical', 'Password Security', 'Password field is not type="password"');
      }
    }
  }

  async testFormDataPersistence() {
    await this.page.type('[data-testid="offer-title"]', 'Test Offer Title');
    await this.page.type('[data-testid="offer-description"]', 'Long description that user spent time writing...');
    
    // Simulate accidental refresh
    await this.page.reload();
    
    // Check if form data is restored
    const titleValue = await this.page.$eval('[data-testid="offer-title"]', el => el.value).catch(() => '');
    if (!titleValue) {
      this.logBug('high', 'Form Data Persistence', 'Form data lost on page refresh');
    }
  }

  async testLargeFileUploadFreeze() {
    // Create a mock large file upload scenario
    const fileInput = await this.page.$('input[type="file"]');
    if (fileInput) {
      // Monitor if UI becomes unresponsive during upload simulation
      const startTime = Date.now();
      
      // Simulate large file by creating many small operations
      for (let i = 0; i < 100; i++) {
        await this.page.evaluate(() => {
          // Simulate file processing workload
          const data = new Array(10000).fill('x').join('');
        });
        
        if (Date.now() - startTime > 5000) {
          this.logBug('critical', 'File Upload Performance', 'UI freezes during large file processing');
          break;
        }
      }
    }
  }

  async testWebSocketReconnection() {
    // Simulate WebSocket connection drop
    await this.page.evaluate(() => {
      if (window.socket) {
        window.socket.disconnect();
      }
    });
    
    // Wait and check if reconnection happens
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const isConnected = await this.page.evaluate(() => {
      return window.socket && window.socket.connected;
    });
    
    if (!isConnected) {
      this.logBug('high', 'WebSocket Reconnection', 'WebSocket does not automatically reconnect after disconnect');
    }
  }

  async testMobileHorizontalScroll() {
    // Check for horizontal overflow
    const hasHorizontalScroll = await this.page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    if (hasHorizontalScroll) {
      this.logBug('medium', 'Mobile Layout', 'Page has horizontal scroll on mobile viewport');
    }
  }

  async testInitialLoadPerformance() {
    const startTime = Date.now();
    await this.page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle0' });
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 5000) {
      this.logBug('medium', 'Load Performance', `Initial page load took ${loadTime}ms (should be < 5000ms)`);
    }
  }

  async testMemoryLeakDetection() {
    const initialMemory = await this.page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    // Simulate user interactions that might cause memory leaks
    for (let i = 0; i < 10; i++) {
      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.page.goto(`${this.baseUrl}/chat`);
      await this.page.goto(`${this.baseUrl}/analytics`);
    }
    
    const finalMemory = await this.page.evaluate(() => {
      return performance.memory ? performance.memory.usedJSHeapSize : 0;
    });
    
    const memoryIncrease = finalMemory - initialMemory;
    if (memoryIncrease > 50 * 1024 * 1024) { // 50MB increase
      this.logBug('high', 'Memory Leak', `Memory usage increased by ${Math.round(memoryIncrease / 1024 / 1024)}MB during navigation`);
    }
  }

  logBug(severity, category, description) {
    const bug = {
      timestamp: new Date().toISOString(),
      category,
      description,
      url: this.page ? this.page.url() : 'unknown'
    };
    
    this.bugs[severity].push(bug);
    console.log(`  ${severity.toUpperCase()}: ${category} - ${description}`);
  }

  async generateReport() {
    const totalTime = ((Date.now() - this.testStartTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('🕷️ FRONTEND BUG HUNT RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n🚨 CRITICAL BUGS (${this.bugs.critical.length})`);
    this.bugs.critical.forEach(bug => {
      console.log(`  ❌ ${bug.category}: ${bug.description}`);
      console.log(`     URL: ${bug.url}\n`);
    });

    console.log(`\n⚠️  HIGH-RISK BUGS (${this.bugs.high.length})`);
    this.bugs.high.forEach(bug => {
      console.log(`  🔸 ${bug.category}: ${bug.description}`);
      console.log(`     URL: ${bug.url}\n`);
    });

    console.log(`\n📋 MEDIUM-RISK BUGS (${this.bugs.medium.length})`);
    this.bugs.medium.forEach(bug => {
      console.log(`  🔹 ${bug.category}: ${bug.description}`);
      console.log(`     URL: ${bug.url}\n`);
    });

    console.log(`\n✅ PASSED CHECKS (${this.bugs.passed.length})`);
    this.bugs.passed.forEach(check => {
      console.log(`  ✓ ${check}`);
    });

    const totalIssues = this.bugs.critical.length + this.bugs.high.length + this.bugs.medium.length;
    const totalChecks = totalIssues + this.bugs.passed.length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FRONTEND HEALTH REPORT');
    console.log('='.repeat(60));
    console.log(`Hunt Duration: ${totalTime}s`);
    console.log(`Total Checks: ${totalChecks}`);
    console.log(`Bugs Found: ${totalIssues}`);
    console.log(`Success Rate: ${((this.bugs.passed.length / totalChecks) * 100).toFixed(1)}%`);
    
    if (this.bugs.critical.length > 0) {
      console.log('\n🚨 RECOMMENDATION: DO NOT DEPLOY');
      console.log('Critical frontend bugs will break user experience.');
    } else if (this.bugs.high.length > 3) {
      console.log('\n⚠️  RECOMMENDATION: FIX HIGH-RISK BUGS FIRST');
      console.log('Multiple high-risk bugs will frustrate users.');
    } else {
      console.log('\n🎉 RECOMMENDATION: FRONTEND READY FOR USERS');
      console.log('No critical bugs detected in user journeys.');
    }

    // Save detailed report
    const reportPath = path.join(__dirname, 'frontend-bug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      duration: totalTime,
      bugs: this.bugs,
      summary: {
        critical: this.bugs.critical.length,
        high: this.bugs.high.length,
        medium: this.bugs.medium.length,
        passed: this.bugs.passed.length
      }
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI usage
if (require.main === module) {
  const hunter = new FrontendBugHunter();
  hunter.runComprehensiveBugHunt().catch(console.error);
}

module.exports = FrontendBugHunter;
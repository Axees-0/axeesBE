/**
 * AUTHENTICATION FLOW BUG TESTS
 * 
 * Tests the specific ways authentication breaks in real-world usage
 * These are the bugs that create support tickets and user frustration
 */

const puppeteer = require('puppeteer');
const SelectorResilience = require('../utils/selector-resilience');
const RouteValidator = require('../utils/route-validator');
const config = require('../config');

class AuthenticationBugHunter {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = config.frontendUrl || baseUrl;
    this.browser = null;
    this.page = null;
    this.selector = null;
    this.bugs = [];
    this.credentials = config.testCredentials;
  }

  async initialize() {
    this.browser = await puppeteer.launch(config.getBrowserOptions());
    this.page = await this.browser.newPage();
    this.selector = new SelectorResilience(this.page);
    this.routeValidator = new RouteValidator(this.page);
    
    // Validate routes before running tests
    await this.routeValidator.validateTestRoutes('authentication');
    
    // Set up resilient selectors for authentication
    this.selectors = {
      emailInput: SelectorResilience.getCommonSelectors().emailInput,
      passwordInput: SelectorResilience.getCommonSelectors().passwordInput, 
      submitButton: SelectorResilience.getCommonSelectors().submitButton,
      errorMessage: SelectorResilience.getCommonSelectors().errorMessage,
      
      // Authentication-specific selectors with fallbacks
      phoneInput: [
        '[data-testid="phone"]',
        '[data-testid="phone-input"]', 
        '#phone',
        'input[type="tel"]',
        'input[name="phone"]',
        '[placeholder*="phone" i]'
      ],
      
      sessionExpiredMessage: [
        '[data-testid="session-expired"]',
        '[data-testid="session-expired-message"]',
        '.session-expired',
        '.auth-expired',
        '[role="alert"]:contains("session")',
        '.alert:contains("expired")'
      ],
      
      offerTitle: [
        '[data-testid="offer-title"]',
        '[data-testid="title"]',
        '#offer-title',
        '#title',
        'input[name="title"]',
        '.title-input'
      ],
      
      offerDescription: [
        '[data-testid="offer-description"]', 
        '[data-testid="description"]',
        '#offer-description',
        '#description',
        'textarea[name="description"]',
        '.description-input'
      ],
      
      submitOffer: [
        '[data-testid="submit-offer"]',
        '[data-testid="submit"]',
        'button[type="submit"]',
        '.submit-offer',
        '.submit-button'
      ]
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runComprehensiveAuthTests() {
    console.log('🔐 Running comprehensive authentication tests...');
    
    try {
      await this.testTokenExpiryDuringFormFill();
      await this.testMultipleTabLoginConflicts();
      await this.testPasswordVisibilityToggleBugs();
      await this.testLoginRateLimitingUI();
      await this.testRememberMeFunctionality();
      await this.testSocialLoginBugs();
      await this.testBackButtonAfterLogout();
      await this.testSessionTimeoutWarnings();
      await this.testDeepLinkRedirectAfterLogin();
      await this.testAutoLogoutBehavior();
    } catch (error) {
      console.error('Authentication test error:', error.message);
    }

    return {
      totalBugs: this.bugs.length,
      bugs: this.bugs,
      critical: this.bugs.filter(b => b.severity === 'CRITICAL').length,
      high: this.bugs.filter(b => b.severity === 'HIGH').length,
      medium: this.bugs.filter(b => b.severity === 'MEDIUM').length,
      low: this.bugs.filter(b => b.severity === 'LOW').length
    };
  }

  async hunt() {
    console.log('🔐 HUNTING AUTHENTICATION BUGS THAT USERS ACTUALLY EXPERIENCE');
    
    this.browser = await puppeteer.launch({ 
      headless: false, 
      devtools: true,
      slowMo: 100 
    });
    this.page = await this.browser.newPage();

    try {
      await this.testTokenExpiryDuringFormFill();
      await this.testMultipleTabLoginConflicts();
      await this.testPasswordVisibilityToggleBugs();
      await this.testLoginRateLimitingUI();
      await this.testRememberMeFunctionality();
      await this.testSocialLoginBugs();
      await this.testBackButtonAfterLogout();
      await this.testSessionTimeoutWarnings();
      await this.testDeepLinkRedirectAfterLogin();
      await this.testAutoLogoutBehavior();
    } finally {
      await this.browser.close();
      this.reportBugs();
    }
  }

  async testTokenExpiryDuringFormFill() {
    console.log('🕐 Testing: Token expires while user fills out long form');
    
    await this.page.goto(`${this.baseUrl}/login`);
    
    // Login first
    await this.loginUser();
    
    // Go to a form page (like create offer)
    await this.page.goto(`${this.baseUrl}/create-offer`);
    
    // Fill out form slowly (like real user)
    await this.selector.typeIntoInput(this.selectors.offerTitle, 'Important Marketing Campaign');
    await this.selector.typeIntoInput(this.selectors.offerDescription, 'This is a very detailed description that the user is spending a lot of time writing. They are putting thought into each word and really crafting something meaningful for their campaign. This represents real user behavior where they invest time in content creation.');
    
    // Simulate token expiring (manipulate localStorage/sessionStorage)
    await this.page.evaluate(() => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('accessToken');
    });
    
    // Try to submit form using resilient selector
    await this.selector.clickElement(this.selectors.submitOffer);
    
    // Check if user gets proper feedback
    await this.page.waitForTimeout(2000);
    
    const errorMessage = await this.selector.elementExists(this.selectors.sessionExpiredMessage, { timeout: 1000 });
    const redirectedToLogin = this.page.url().includes('/login');
    const formDataPreserved = await this.page.evaluate(() => {
      return localStorage.getItem('draftOffer') || sessionStorage.getItem('draftOffer');
    });
    
    if (!errorMessage && !redirectedToLogin) {
      this.logBug('CRITICAL', 'Token Expiry During Form', 'User gets no feedback when token expires during form submission');
    }
    
    if (!formDataPreserved) {
      this.logBug('HIGH', 'Form Data Loss', 'User loses all form data when session expires');
    }
  }

  async testMultipleTabLoginConflicts() {
    console.log('🗂️ Testing: User logs in from multiple tabs');
    
    // Open second tab
    const page2 = await this.browser.newPage();
    
    // Login from first tab
    await this.page.goto(`${this.baseUrl}/login`);
    await this.loginUser();
    
    // Login from second tab with different user
    await page2.goto(`${this.baseUrl}/login`);
    const selector2 = new SelectorResilience(page2);
    await selector2.typeIntoInput(this.selectors.phoneInput, '+0987654321');
    await selector2.typeIntoInput(this.selectors.passwordInput, 'otherpassword');
    await selector2.clickElement(this.selectors.submitButton);
    
    // Check what happens to first tab
    await this.page.reload();
    await this.page.waitForTimeout(1000);
    
    const stillLoggedIn = !(this.page.url().includes('/login'));
    if (stillLoggedIn) {
      // Check if user data is mixed up
      const userNamePage1 = await this.page.$eval('[data-testid="user-name"]', el => el.textContent).catch(() => '');
      const userNamePage2 = await page2.$eval('[data-testid="user-name"]', el => el.textContent).catch(() => '');
      
      if (userNamePage1 === userNamePage2) {
        this.logBug('CRITICAL', 'Multi-Tab Login Conflict', 'User data gets mixed up between multiple tab logins');
      }
    }
    
    await page2.close();
  }

  async testPasswordVisibilityToggleBugs() {
    console.log('👁️ Testing: Password visibility toggle edge cases');
    
    await this.page.goto(`${this.baseUrl}/login`);
    
    await this.page.type('[data-testid="password-input"]', 'mysecretpassword123');
    
    // Test toggle visibility
    const toggleButton = await this.page.$('[data-testid="password-toggle"]');
    if (toggleButton) {
      await toggleButton.click();
      
      // Check if password is visible
      const passwordVisible = await this.page.evaluate(() => {
        const input = document.querySelector('[data-testid="password-input"]');
        return input && input.type === 'text';
      });
      
      if (passwordVisible) {
        // Toggle back to hidden
        await toggleButton.click();
        
        // Check if it properly hides again
        const passwordHidden = await this.page.evaluate(() => {
          const input = document.querySelector('[data-testid="password-input"]');
          return input && input.type === 'password';
        });
        
        if (!passwordHidden) {
          this.logBug('HIGH', 'Password Toggle Bug', 'Password remains visible after toggling back to hidden');
        }
      }
    } else {
      this.logBug('MEDIUM', 'Missing Password Toggle', 'No password visibility toggle found');
    }
  }

  async testLoginRateLimitingUI() {
    console.log('🚫 Testing: Login rate limiting user feedback');
    
    await this.page.goto(`${this.baseUrl}/login`);
    
    // Try multiple failed login attempts rapidly
    for (let i = 0; i < 5; i++) {
      await this.page.type('[data-testid="phone-input"]', '+1234567890');
      await this.page.type('[data-testid="password-input"]', 'wrongpassword');
      await this.page.click('[data-testid="login-button"]');
      
      await this.page.waitForTimeout(500);
      
      // Clear fields for next attempt
      await this.page.evaluate(() => {
        document.querySelector('[data-testid="phone-input"]').value = '';
        document.querySelector('[data-testid="password-input"]').value = '';
      });
    }
    
    // Check if user gets rate limiting feedback
    const rateLimitMessage = await this.page.$('[data-testid="rate-limit-message"]');
    const loginButtonDisabled = await this.page.evaluate(() => {
      const button = document.querySelector('[data-testid="login-button"]');
      return button && button.disabled;
    });
    
    if (!rateLimitMessage && !loginButtonDisabled) {
      this.logBug('MEDIUM', 'Rate Limiting UI', 'User gets no feedback about being rate limited');
    }
  }

  async testRememberMeFunctionality() {
    console.log('💾 Testing: Remember Me checkbox functionality');
    
    await this.page.goto(`${this.baseUrl}/login`);
    
    // Check remember me checkbox
    const rememberCheckbox = await this.page.$('[data-testid="remember-me"]');
    if (rememberCheckbox) {
      await rememberCheckbox.click();
      
      // Login
      await this.loginUser();
      
      // Logout
      await this.page.click('[data-testid="logout-button"]');
      
      // Close browser and reopen (simulate coming back later)
      await this.browser.close();
      this.browser = await puppeteer.launch({ headless: false });
      this.page = await this.browser.newPage();
      
      await this.page.goto(`${this.baseUrl}`);
      
      // Check if still logged in
      const autoLoggedIn = !(this.page.url().includes('/login'));
      if (!autoLoggedIn) {
        this.logBug('MEDIUM', 'Remember Me Not Working', 'Remember Me checkbox does not keep user logged in');
      }
    } else {
      this.logBug('LOW', 'Missing Remember Me', 'No Remember Me option available');
    }
  }

  async testSocialLoginBugs() {
    console.log('🌐 Testing: Social login edge cases');
    
    await this.page.goto(`${this.baseUrl}/login`);
    
    const googleLoginBtn = await this.page.$('[data-testid="google-login"]');
    if (googleLoginBtn) {
      // Test if popup blocker affects social login
      await googleLoginBtn.click();
      
      await this.page.waitForTimeout(2000);
      
      // Check if popup opened (basic test)
      const pages = await this.browser.pages();
      const popupOpened = pages.length > 2;
      
      if (!popupOpened) {
        // Check if there's user feedback about popup being blocked
        const popupWarning = await this.page.$('[data-testid="popup-blocked-warning"]');
        if (!popupWarning) {
          this.logBug('MEDIUM', 'Social Login Popup', 'No feedback when social login popup is blocked');
        }
      }
    }
  }

  async testBackButtonAfterLogout() {
    console.log('⬅️ Testing: Browser back button after logout');
    
    await this.page.goto(`${this.baseUrl}/login`);
    await this.loginUser();
    
    // Navigate to protected page
    await this.page.goto(`${this.baseUrl}/dashboard`);
    
    // Logout
    await this.page.click('[data-testid="logout-button"]');
    
    // Use browser back button
    await this.page.goBack();
    
    // Check if protected content is shown from cache
    const protectedContentVisible = await this.page.$('[data-testid="dashboard-content"]');
    if (protectedContentVisible) {
      this.logBug('CRITICAL', 'Back Button Security', 'Protected content visible after logout using back button');
    }
  }

  async testSessionTimeoutWarnings() {
    console.log('⏰ Testing: Session timeout warning system');
    
    await this.page.goto(`${this.baseUrl}/login`);
    await this.loginUser();
    
    // Simulate session approaching expiry (if implemented)
    await this.page.evaluate(() => {
      // Trigger session warning if system exists
      if (window.sessionManager) {
        window.sessionManager.triggerTimeoutWarning();
      }
    });
    
    await this.page.waitForTimeout(1000);
    
    const timeoutWarning = await this.page.$('[data-testid="session-timeout-warning"]');
    if (!timeoutWarning) {
      this.logBug('MEDIUM', 'Session Timeout Warning', 'No warning shown before session expires');
    }
  }

  async testDeepLinkRedirectAfterLogin() {
    console.log('🔗 Testing: Deep link redirect after login');
    
    // Try to access protected deep link while logged out
    await this.page.goto(`${this.baseUrl}/offers/create?template=gaming`);
    
    // Should redirect to login
    if (!this.page.url().includes('/login')) {
      this.logBug('HIGH', 'Deep Link Protection', 'Protected deep links accessible without login');
      return;
    }
    
    // Login
    await this.loginUser();
    
    // Check if redirected to original deep link
    await this.page.waitForTimeout(2000);
    const redirectedCorrectly = this.page.url().includes('/offers/create?template=gaming');
    
    if (!redirectedCorrectly) {
      this.logBug('MEDIUM', 'Deep Link Redirect', 'User not redirected to original deep link after login');
    }
  }

  async testAutoLogoutBehavior() {
    console.log('🚪 Testing: Auto-logout behavior');
    
    await this.page.goto(`${this.baseUrl}/login`);
    await this.loginUser();
    
    // Simulate inactivity by not interacting for a period
    await this.page.waitForTimeout(5000);
    
    // Check if user gets warning about inactivity
    const inactivityWarning = await this.page.$('[data-testid="inactivity-warning"]');
    
    // Simulate very long inactivity (if auto-logout is implemented)
    await this.page.evaluate(() => {
      // Fast-forward any inactivity timers
      if (window.inactivityTimer) {
        clearTimeout(window.inactivityTimer);
        if (window.handleInactivityLogout) {
          window.handleInactivityLogout();
        }
      }
    });
    
    await this.page.waitForTimeout(1000);
    
    // Check if user was logged out gracefully
    const loggedOutGracefully = this.page.url().includes('/login') || await this.page.$('[data-testid="auto-logout-message"]');
    
    if (!loggedOutGracefully) {
      this.logBug('LOW', 'Auto-logout Feedback', 'No feedback when user is auto-logged out due to inactivity');
    }
  }

  async loginUser() {
    // Use real credentials from config (will fail if not properly configured)
    await this.selector.typeIntoInput(this.selectors.phoneInput, this.credentials.phone);
    await this.selector.typeIntoInput(this.selectors.passwordInput, this.credentials.password);
    await this.selector.clickElement(this.selectors.submitButton);
    await this.page.waitForTimeout(2000);
  }

  logBug(severity, category, description) {
    this.bugs.push({
      severity,
      category,
      description,
      timestamp: new Date().toISOString(),
      url: this.page.url()
    });
    console.log(`  ${severity}: ${category} - ${description}`);
  }

  reportBugs() {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 AUTHENTICATION BUG HUNT RESULTS');
    console.log('='.repeat(60));
    
    const critical = this.bugs.filter(b => b.severity === 'CRITICAL');
    const high = this.bugs.filter(b => b.severity === 'HIGH');
    const medium = this.bugs.filter(b => b.severity === 'MEDIUM');
    const low = this.bugs.filter(b => b.severity === 'LOW');
    
    console.log(`\n🚨 CRITICAL AUTHENTICATION BUGS (${critical.length})`);
    critical.forEach(bug => console.log(`  ❌ ${bug.category}: ${bug.description}`));
    
    console.log(`\n⚠️  HIGH-RISK AUTHENTICATION BUGS (${high.length})`);
    high.forEach(bug => console.log(`  🔸 ${bug.category}: ${bug.description}`));
    
    console.log(`\n📋 MEDIUM-RISK AUTHENTICATION BUGS (${medium.length})`);
    medium.forEach(bug => console.log(`  🔹 ${bug.category}: ${bug.description}`));
    
    console.log(`\n📝 LOW-RISK AUTHENTICATION BUGS (${low.length})`);
    low.forEach(bug => console.log(`  • ${bug.category}: ${bug.description}`));
    
    if (critical.length > 0) {
      console.log('\n🚨 AUTHENTICATION SYSTEM NOT READY FOR PRODUCTION');
      console.log('Critical authentication bugs will break user login experience.');
    } else if (high.length > 0) {
      console.log('\n⚠️  AUTHENTICATION NEEDS ATTENTION');
      console.log('High-risk bugs will frustrate users and create support tickets.');
    } else {
      console.log('\n✅ AUTHENTICATION SYSTEM LOOKS SOLID');
      console.log('No critical authentication bugs detected.');
    }
  }
}

module.exports = AuthenticationBugHunter;

// Run if called directly
if (require.main === module) {
  const hunter = new AuthenticationBugHunter();
  hunter.hunt().catch(console.error);
}
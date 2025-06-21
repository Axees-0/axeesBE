/**
 * MOBILE INTERFACE BUG TESTS
 * 
 * Tests mobile-specific issues that make apps unusable on mobile devices
 * These bugs cause mobile users to abandon the app immediately
 */

const puppeteer = require('puppeteer');
const config = require('../config');

class MobileInterfaceBugHunter {
  constructor(baseUrl = config.frontendUrl) {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.bugs = [];
  }

  async initialize() {
    this.browser = await puppeteer.launch(config.getBrowserOptions());
    this.page = await this.browser.newPage();
    
    // Set mobile viewport
    await this.page.setViewport({
      width: 375,
      height: 667,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runComprehensiveMobileTests() {
    console.log('📱 Running comprehensive mobile interface bug tests...');
    
    try {
      await this.testTouchTargetSizing();
      await this.testVirtualKeyboardHandling();
      await this.testMobileViewportHandling();
      await this.testTouchGestureSupport();
      await this.testMobileNavigationUsability();
      await this.testFormUsabilityOnMobile();
      await this.testMobilePerformanceIssues();
      await this.testOrientationHandling();
      await this.testMobileAccessibility();
      await this.testMobileNetworkConditions();
    } catch (error) {
      console.error('Mobile test error:', error.message);
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

  async testTouchTargetSizing() {
    console.log('👆 Testing: Touch target sizing and accessibility');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Check touch target sizes
      const touchTargets = await this.page.evaluate(() => {
        const interactiveElements = document.querySelectorAll(
          'button, a, input, select, textarea, [onclick], [data-testid*="button"], [role="button"]'
        );
        
        const smallTargets = [];
        const tooCloseTargets = [];
        
        interactiveElements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);
          
          // Check if element is visible
          if (rect.width > 0 && rect.height > 0 && computedStyle.visibility !== 'hidden') {
            const minSize = 44; // Apple's recommended minimum touch target size
            
            if (rect.width < minSize || rect.height < minSize) {
              smallTargets.push({
                index,
                tag: element.tagName,
                id: element.id,
                className: element.className,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                text: element.textContent?.substring(0, 30) || ''
              });
            }
            
            // Check spacing between touch targets
            interactiveElements.forEach((otherElement, otherIndex) => {
              if (index !== otherIndex) {
                const otherRect = otherElement.getBoundingClientRect();
                
                const distance = Math.sqrt(
                  Math.pow(rect.left - otherRect.left, 2) + 
                  Math.pow(rect.top - otherRect.top, 2)
                );
                
                if (distance < 8 && distance > 0) { // Too close (less than 8px apart)
                  tooCloseTargets.push({
                    element1: { index, text: element.textContent?.substring(0, 20) || '' },
                    element2: { index: otherIndex, text: otherElement.textContent?.substring(0, 20) || '' },
                    distance: Math.round(distance)
                  });
                }
              }
            });
          }
        });
        
        return { smallTargets, tooCloseTargets };
      });
      
      if (touchTargets.smallTargets.length > 0) {
        this.logBug('HIGH', 'Touch Targets Too Small', 
          `${touchTargets.smallTargets.length} interactive elements smaller than 44px minimum`);
        
        touchTargets.smallTargets.slice(0, 3).forEach(target => {
          console.log(`    - ${target.tag} (${target.width}x${target.height}px): "${target.text}"`);
        });
      }
      
      if (touchTargets.tooCloseTargets.length > 0) {
        this.logBug('MEDIUM', 'Touch Targets Too Close', 
          `${touchTargets.tooCloseTargets.length} pairs of touch targets are too close together`);
      }
      
      // Test thumb zone accessibility
      const thumbZoneElements = await this.page.evaluate(() => {
        const viewportHeight = window.innerHeight;
        const thumbZoneStart = viewportHeight * 0.6; // Bottom 40% is easiest to reach
        
        const elementsInThumbZone = document.querySelectorAll('button, a, [role="button"]');
        const primaryActions = [];
        
        elementsInThumbZone.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.top >= thumbZoneStart) {
            const isPrimary = element.textContent?.toLowerCase().includes('submit') ||
                            element.textContent?.toLowerCase().includes('save') ||
                            element.textContent?.toLowerCase().includes('next') ||
                            element.className?.includes('primary');
            
            if (isPrimary) {
              primaryActions.push(element.textContent?.substring(0, 20) || '');
            }
          }
        });
        
        return primaryActions;
      });
      
      if (thumbZoneElements.length === 0) {
        this.logBug('MEDIUM', 'Primary Actions Not in Thumb Zone', 
          'Important buttons not positioned in easy-to-reach thumb zone');
      }
      
    } catch (error) {
      this.logBug('CRITICAL', 'Touch Target Test Failed', `Failed to test touch targets: ${error.message}`);
    }
  }

  async testVirtualKeyboardHandling() {
    console.log('⌨️  Testing: Virtual keyboard layout management');
    
    try {
      await this.page.goto(`${this.baseUrl}/login`);
      
      // Test input field visibility when keyboard appears
      await this.page.evaluate(() => {
        // Simulate virtual keyboard appearing
        const originalHeight = window.innerHeight;
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: originalHeight * 0.5 // Keyboard takes up ~50% of screen
        });
        
        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
      });
      
      await this.page.waitForTimeout(500);
      
      // Focus on password input (usually at bottom of form)
      const inputVisibility = await this.page.evaluate(() => {
        const passwordInput = document.querySelector('[type="password"], [data-testid*="password"]');
        if (!passwordInput) return { found: false };
        
        passwordInput.focus();
        
        const rect = passwordInput.getBoundingClientRect();
        const isVisible = rect.bottom <= window.innerHeight && rect.top >= 0;
        
        return {
          found: true,
          isVisible,
          top: rect.top,
          bottom: rect.bottom,
          windowHeight: window.innerHeight
        };
      });
      
      if (inputVisibility.found && !inputVisibility.isVisible) {
        this.logBug('HIGH', 'Input Field Hidden by Keyboard', 
          'Form inputs hidden when virtual keyboard appears');
      }
      
      // Test keyboard type appropriateness
      const inputTypes = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        const incorrectTypes = [];
        
        inputs.forEach(input => {
          const placeholder = input.placeholder?.toLowerCase() || '';
          const name = input.name?.toLowerCase() || '';
          const id = input.id?.toLowerCase() || '';
          
          if ((placeholder.includes('email') || name.includes('email') || id.includes('email')) && 
              input.type !== 'email') {
            incorrectTypes.push('Email field not using type="email"');
          }
          
          if ((placeholder.includes('phone') || name.includes('phone') || id.includes('phone')) && 
              input.type !== 'tel') {
            incorrectTypes.push('Phone field not using type="tel"');
          }
          
          if ((placeholder.includes('number') || name.includes('number')) && 
              input.type !== 'number') {
            incorrectTypes.push('Number field not using type="number"');
          }
        });
        
        return incorrectTypes;
      });
      
      if (inputTypes.length > 0) {
        this.logBug('MEDIUM', 'Incorrect Input Types', 
          'Input fields not optimized for mobile keyboards');
        
        inputTypes.forEach(issue => {
          console.log(`    - ${issue}`);
        });
      }
      
      // Test viewport meta tag
      const viewportMeta = await this.page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        return meta ? meta.getAttribute('content') : null;
      });
      
      if (!viewportMeta || !viewportMeta.includes('user-scalable=no')) {
        this.logBug('LOW', 'Viewport Meta Tag Missing', 
          'Missing or incomplete viewport meta tag for mobile optimization');
      }
      
    } catch (error) {
      console.log('Virtual keyboard test skipped:', error.message);
    }
  }

  async testMobileViewportHandling() {
    console.log('📐 Testing: Mobile viewport and responsive design');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Test horizontal scrolling
      const horizontalScroll = await this.page.evaluate(() => {
        return {
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        };
      });
      
      if (horizontalScroll.hasHorizontalScroll) {
        this.logBug('HIGH', 'Horizontal Scroll on Mobile', 
          `Content causes horizontal scrolling (${horizontalScroll.scrollWidth}px > ${horizontalScroll.clientWidth}px)`);
      }
      
      // Test element overflow
      const overflowingElements = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const overflowing = [];
        const viewportWidth = window.innerWidth;
        
        elements.forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.right > viewportWidth + 10) { // 10px tolerance
            overflowing.push({
              tag: element.tagName,
              class: element.className,
              right: Math.round(rect.right),
              overflow: Math.round(rect.right - viewportWidth)
            });
          }
        });
        
        return overflowing.slice(0, 5); // Limit to first 5
      });
      
      if (overflowingElements.length > 0) {
        this.logBug('MEDIUM', 'Elements Overflow Viewport', 
          `${overflowingElements.length} elements extend beyond mobile viewport`);
      }
      
      // Test different viewport sizes
      const viewportSizes = [
        { width: 320, height: 568, name: 'iPhone SE' },
        { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
        { width: 360, height: 640, name: 'Samsung Galaxy S5' }
      ];
      
      for (const viewport of viewportSizes) {
        await this.page.setViewport(viewport);
        await this.page.waitForTimeout(500);
        
        const layoutIssues = await this.page.evaluate(() => {
          // Check for overlapping elements
          const buttons = document.querySelectorAll('button, a, [role="button"]');
          const overlapping = [];
          
          for (let i = 0; i < buttons.length; i++) {
            for (let j = i + 1; j < buttons.length; j++) {
              const rect1 = buttons[i].getBoundingClientRect();
              const rect2 = buttons[j].getBoundingClientRect();
              
              if (rect1.left < rect2.right && rect2.left < rect1.right &&
                  rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
                overlapping.push(`${buttons[i].textContent?.substring(0, 15)} overlaps ${buttons[j].textContent?.substring(0, 15)}`);
              }
            }
          }
          
          return overlapping.slice(0, 3);
        });
        
        if (layoutIssues.length > 0) {
          this.logBug('HIGH', `Layout Issues on ${viewport.name}`, 
            `Elements overlap at ${viewport.width}x${viewport.height}`);
        }
      }
      
      // Reset to standard mobile viewport
      await this.page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
      
    } catch (error) {
      console.log('Viewport test skipped:', error.message);
    }
  }

  async testTouchGestureSupport() {
    console.log('👋 Testing: Touch gesture support and behavior');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Test swipe gestures
      const swipeSupport = await this.page.evaluate(() => {
        const container = document.body;
        let swipeDetected = false;
        
        // Simulate swipe gesture
        const touchStart = new TouchEvent('touchstart', {
          touches: [{
            identifier: 1,
            clientX: 100,
            clientY: 200,
            target: container
          }]
        });
        
        const touchMove = new TouchEvent('touchmove', {
          touches: [{
            identifier: 1,
            clientX: 200,
            clientY: 200,
            target: container
          }]
        });
        
        const touchEnd = new TouchEvent('touchend', {
          changedTouches: [{
            identifier: 1,
            clientX: 200,
            clientY: 200,
            target: container
          }]
        });
        
        container.addEventListener('touchstart', () => swipeDetected = true);
        
        container.dispatchEvent(touchStart);
        container.dispatchEvent(touchMove);
        container.dispatchEvent(touchEnd);
        
        return swipeDetected;
      });
      
      // Test pinch zoom behavior
      const zoomBehavior = await this.page.evaluate(() => {
        const meta = document.querySelector('meta[name="viewport"]');
        const content = meta ? meta.getAttribute('content') : '';
        
        return {
          hasViewportMeta: !!meta,
          allowsZoom: !content.includes('user-scalable=no') && !content.includes('maximum-scale=1'),
          content: content
        };
      });
      
      if (zoomBehavior.allowsZoom) {
        // Test if zoom breaks layout
        await this.page.evaluate(() => {
          document.body.style.zoom = '1.5';
        });
        
        await this.page.waitForTimeout(500);
        
        const zoomIssues = await this.page.evaluate(() => {
          const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
          const elementsOffScreen = document.querySelectorAll('*').length;
          
          return { hasHorizontalScroll, elementsOffScreen };
        });
        
        if (zoomIssues.hasHorizontalScroll) {
          this.logBug('MEDIUM', 'Zoom Breaks Layout', 
            'Pinch zoom causes horizontal scrolling and layout issues');
        }
        
        // Reset zoom
        await this.page.evaluate(() => {
          document.body.style.zoom = '1';
        });
      }
      
      // Test pull-to-refresh interference
      const pullToRefreshIssues = await this.page.evaluate(() => {
        let issues = [];
        
        // Check if page has scroll at top
        if (window.scrollY === 0) {
          // Simulate pull down gesture at top of page
          const touchStart = new TouchEvent('touchstart', {
            touches: [{
              identifier: 1,
              clientX: 100,
              clientY: 50,
              target: document.body
            }]
          });
          
          const touchMove = new TouchEvent('touchmove', {
            touches: [{
              identifier: 1,
              clientX: 100,
              clientY: 150,
              target: document.body
            }]
          });
          
          let pullToRefreshTriggered = false;
          
          document.addEventListener('touchstart', (e) => {
            if (e.touches[0].clientY < 100) {
              pullToRefreshTriggered = true;
            }
          });
          
          document.body.dispatchEvent(touchStart);
          document.body.dispatchEvent(touchMove);
          
          if (pullToRefreshTriggered) {
            issues.push('Pull-to-refresh may interfere with app scrolling');
          }
        }
        
        return issues;
      });
      
      if (pullToRefreshIssues.length > 0) {
        this.logBug('LOW', 'Pull-to-Refresh Interference', 
          'Pull-to-refresh gesture may conflict with app functionality');
      }
      
    } catch (error) {
      console.log('Touch gesture test skipped:', error.message);
    }
  }

  async testMobileNavigationUsability() {
    console.log('🧭 Testing: Mobile navigation usability');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Test hamburger menu functionality
      const navigationIssues = await this.page.evaluate(() => {
        const issues = [];
        
        // Look for hamburger menu
        const hamburger = document.querySelector('[data-testid*="menu"], .hamburger, .menu-toggle, [aria-label*="menu"]');
        
        if (hamburger) {
          const rect = hamburger.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            issues.push('Hamburger menu button too small for touch');
          }
        } else {
          // Check if navigation is visible on mobile
          const nav = document.querySelector('nav, [role="navigation"]');
          if (nav) {
            const navRect = nav.getBoundingClientRect();
            const navItems = nav.querySelectorAll('a, button');
            
            if (navItems.length > 4 && navRect.width < window.innerWidth * 0.8) {
              issues.push('Too many navigation items for mobile width');
            }
          }
        }
        
        // Check tab bar positioning
        const tabBar = document.querySelector('[role="tablist"], .tab-bar, .bottom-nav');
        if (tabBar) {
          const rect = tabBar.getBoundingClientRect();
          const isAtBottom = rect.bottom >= window.innerHeight - 20;
          
          if (!isAtBottom) {
            issues.push('Tab bar not positioned at bottom for thumb accessibility');
          }
        }
        
        // Check back button presence
        const backButton = document.querySelector('[data-testid*="back"], .back-button, [aria-label*="back"]');
        if (!backButton && window.location.pathname !== '/') {
          issues.push('No back button found on sub-page');
        }
        
        return issues;
      });
      
      navigationIssues.forEach(issue => {
        this.logBug('MEDIUM', 'Mobile Navigation Issue', issue);
      });
      
      // Test navigation item spacing
      const navSpacing = await this.page.evaluate(() => {
        const navItems = document.querySelectorAll('nav a, nav button, [role="navigation"] a, [role="navigation"] button');
        const tooClose = [];
        
        for (let i = 0; i < navItems.length - 1; i++) {
          const rect1 = navItems[i].getBoundingClientRect();
          const rect2 = navItems[i + 1].getBoundingClientRect();
          
          const distance = Math.abs(rect2.left - rect1.right);
          if (distance < 8) {
            tooClose.push(`Navigation items too close (${distance}px apart)`);
          }
        }
        
        return tooClose.slice(0, 3);
      });
      
      if (navSpacing.length > 0) {
        this.logBug('MEDIUM', 'Navigation Items Too Close', 
          'Navigation items not properly spaced for touch interaction');
      }
      
    } catch (error) {
      console.log('Mobile navigation test skipped:', error.message);
    }
  }

  async testFormUsabilityOnMobile() {
    console.log('📝 Testing: Form usability on mobile devices');
    
    try {
      await this.page.goto(`${this.baseUrl}/profile/edit`);
      
      // Test form field sizing and spacing
      const formIssues = await this.page.evaluate(() => {
        const issues = [];
        const inputs = document.querySelectorAll('input, textarea, select');
        
        inputs.forEach((input, index) => {
          const rect = input.getBoundingClientRect();
          
          // Check minimum height for touch
          if (rect.height < 44) {
            issues.push(`Input field ${index + 1} too short for touch (${Math.round(rect.height)}px)`);
          }
          
          // Check field spacing
          inputs.forEach((otherInput, otherIndex) => {
            if (index !== otherIndex) {
              const otherRect = otherInput.getBoundingClientRect();
              const verticalDistance = Math.abs(rect.bottom - otherRect.top);
              
              if (verticalDistance < 16 && verticalDistance > 0) {
                issues.push(`Form fields too close together (${Math.round(verticalDistance)}px apart)`);
              }
            }
          });
        });
        
        // Check label positioning
        const labels = document.querySelectorAll('label');
        labels.forEach(label => {
          const associatedInput = document.getElementById(label.getAttribute('for')) || 
                                label.querySelector('input, textarea, select');
          
          if (associatedInput) {
            const labelRect = label.getBoundingClientRect();
            const inputRect = associatedInput.getBoundingClientRect();
            
            // Labels should be above inputs on mobile for better UX
            if (labelRect.top > inputRect.top) {
              issues.push('Label positioned below input (should be above on mobile)');
            }
          }
        });
        
        return issues.slice(0, 5);
      });
      
      formIssues.forEach(issue => {
        this.logBug('MEDIUM', 'Mobile Form Usability Issue', issue);
      });
      
      // Test form submission on mobile
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"], [data-testid*="submit"]');
      
      if (submitButton) {
        const submitIssues = await this.page.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          const issues = [];
          
          if (rect.width < 120) {
            issues.push('Submit button too narrow for mobile');
          }
          
          if (rect.height < 44) {
            issues.push('Submit button too short for touch');
          }
          
          // Check if submit button is in thumb zone
          const isInThumbZone = rect.top > window.innerHeight * 0.6;
          if (!isInThumbZone) {
            issues.push('Submit button not in easy-to-reach thumb zone');
          }
          
          return issues;
        }, submitButton);
        
        submitIssues.forEach(issue => {
          this.logBug('MEDIUM', 'Mobile Submit Button Issue', issue);
        });
      }
      
    } catch (error) {
      console.log('Mobile form test skipped:', error.message);
    }
  }

  async testMobilePerformanceIssues() {
    console.log('⚡ Testing: Mobile-specific performance issues');
    
    try {
      // Simulate slower mobile connection
      const cdpSession = await this.page.target().createCDPSession();
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 400 * 1024 / 8,  // 400 Kbps (2G)
        uploadThroughput: 400 * 1024 / 8,
        latency: 800
      });
      
      const loadStart = Date.now();
      await this.page.goto(this.baseUrl, { timeout: 20000 });
      const mobileLoadTime = Date.now() - loadStart;
      
      // Reset network conditions
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      });
      
      if (mobileLoadTime > 15000) {
        this.logBug('CRITICAL', 'Extremely Slow on 2G', 
          `App takes ${mobileLoadTime}ms to load on 2G connection`);
      } else if (mobileLoadTime > 8000) {
        this.logBug('HIGH', 'Slow on 2G Connection', 
          `App takes ${mobileLoadTime}ms to load on 2G (should be < 8s)`);
      }
      
      // Test touch response time
      const touchResponseTime = await this.page.evaluate(() => {
        return new Promise(resolve => {
          const startTime = performance.now();
          let responded = false;
          
          const handler = () => {
            if (!responded) {
              responded = true;
              resolve(performance.now() - startTime);
            }
          };
          
          document.addEventListener('touchstart', handler);
          document.addEventListener('click', handler);
          
          // Simulate touch
          const button = document.querySelector('button, a, [role="button"]');
          if (button) {
            button.click();
          } else {
            resolve(0);
          }
        });
      });
      
      if (touchResponseTime > 300) {
        this.logBug('HIGH', 'Slow Touch Response', 
          `Touch events take ${Math.round(touchResponseTime)}ms to respond`);
      }
      
      // Test memory usage on mobile
      const memoryUsage = await this.page.evaluate(() => {
        if (performance.memory) {
          return {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
          };
        }
        return null;
      });
      
      if (memoryUsage && memoryUsage.used > 50) {
        this.logBug('MEDIUM', 'High Memory Usage on Mobile', 
          `App uses ${memoryUsage.used}MB of memory (mobile devices have limited RAM)`);
      }
      
    } catch (error) {
      console.log('Mobile performance test skipped:', error.message);
    }
  }

  async testOrientationHandling() {
    console.log('🔄 Testing: Screen orientation handling');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Test landscape orientation
      await this.page.setViewport({
        width: 667,
        height: 375,
        isMobile: true,
        hasTouch: true
      });
      
      await this.page.waitForTimeout(1000);
      
      const landscapeIssues = await this.page.evaluate(() => {
        const issues = [];
        
        // Check if content adapts to landscape
        const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        if (hasHorizontalScroll) {
          issues.push('Horizontal scrolling in landscape mode');
        }
        
        // Check if navigation adapts
        const nav = document.querySelector('nav, [role="navigation"]');
        if (nav) {
          const navRect = nav.getBoundingClientRect();
          if (navRect.height > window.innerHeight * 0.3) {
            issues.push('Navigation takes up too much height in landscape');
          }
        }
        
        // Check if virtual keyboard handling is considered
        if (window.innerHeight < 400) {
          const inputs = document.querySelectorAll('input, textarea');
          let inputsInView = 0;
          
          inputs.forEach(input => {
            const rect = input.getBoundingClientRect();
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
              inputsInView++;
            }
          });
          
          if (inputs.length > 0 && inputsInView === 0) {
            issues.push('Form inputs not visible in landscape with small height');
          }
        }
        
        return issues;
      });
      
      landscapeIssues.forEach(issue => {
        this.logBug('MEDIUM', 'Landscape Orientation Issue', issue);
      });
      
      // Test orientation change handling
      await this.page.setViewport({
        width: 375,
        height: 667,
        isMobile: true,
        hasTouch: true
      });
      
      await this.page.waitForTimeout(500);
      
      // Check if layout reflows properly after orientation change
      const orientationChangeIssues = await this.page.evaluate(() => {
        // Trigger resize event to simulate orientation change
        window.dispatchEvent(new Event('resize'));
        
        // Check if elements are still properly positioned
        const overflowing = [];
        document.querySelectorAll('*').forEach(element => {
          const rect = element.getBoundingClientRect();
          if (rect.right > window.innerWidth + 10) {
            overflowing.push(element.tagName);
          }
        });
        
        return overflowing.slice(0, 3);
      });
      
      if (orientationChangeIssues.length > 0) {
        this.logBug('MEDIUM', 'Orientation Change Layout Issues', 
          'Elements overflow after orientation change');
      }
      
    } catch (error) {
      console.log('Orientation test skipped:', error.message);
    }
  }

  async testMobileAccessibility() {
    console.log('♿ Testing: Mobile accessibility features');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Test focus management on mobile
      const focusIssues = await this.page.evaluate(() => {
        const issues = [];
        const focusableElements = document.querySelectorAll(
          'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        // Check if focus indicators are visible
        focusableElements.forEach((element, index) => {
          element.focus();
          const computedStyle = window.getComputedStyle(element, ':focus');
          const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '0px';
          const hasBoxShadow = computedStyle.boxShadow !== 'none';
          
          if (!hasOutline && !hasBoxShadow) {
            issues.push(`Element ${index + 1} has no visible focus indicator`);
          }
        });
        
        // Check aria labels for icons and buttons without text
        const unlabeledElements = [];
        document.querySelectorAll('button, a, [role="button"]').forEach(element => {
          const hasText = element.textContent.trim().length > 0;
          const hasAriaLabel = element.getAttribute('aria-label');
          const hasAriaLabelledBy = element.getAttribute('aria-labelledby');
          const hasTitle = element.getAttribute('title');
          
          if (!hasText && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle) {
            unlabeledElements.push(element.tagName);
          }
        });
        
        if (unlabeledElements.length > 0) {
          issues.push(`${unlabeledElements.length} buttons/links without accessible labels`);
        }
        
        return issues.slice(0, 5);
      });
      
      focusIssues.forEach(issue => {
        this.logBug('MEDIUM', 'Mobile Accessibility Issue', issue);
      });
      
      // Test voice-over/screen reader compatibility
      const screenReaderIssues = await this.page.evaluate(() => {
        const issues = [];
        
        // Check for proper heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
          issues.push('No heading elements found for screen reader navigation');
        }
        
        // Check for alt text on images
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => 
          !img.getAttribute('alt') && !img.getAttribute('aria-label')
        );
        
        if (imagesWithoutAlt.length > 0) {
          issues.push(`${imagesWithoutAlt.length} images without alt text`);
        }
        
        // Check for form labels
        const inputs = document.querySelectorAll('input, textarea, select');
        const unlabeledInputs = Array.from(inputs).filter(input => {
          const id = input.id;
          const hasLabel = id && document.querySelector(`label[for="${id}"]`);
          const hasAriaLabel = input.getAttribute('aria-label');
          const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
          
          return !hasLabel && !hasAriaLabel && !hasAriaLabelledBy;
        });
        
        if (unlabeledInputs.length > 0) {
          issues.push(`${unlabeledInputs.length} form inputs without labels`);
        }
        
        return issues;
      });
      
      screenReaderIssues.forEach(issue => {
        this.logBug('MEDIUM', 'Screen Reader Compatibility Issue', issue);
      });
      
    } catch (error) {
      console.log('Mobile accessibility test skipped:', error.message);
    }
  }

  async testMobileNetworkConditions() {
    console.log('📶 Testing: Mobile network condition handling');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Test offline detection
      await this.page.setOfflineMode(true);
      await this.page.waitForTimeout(1000);
      
      const offlineHandling = await this.page.evaluate(() => {
        const issues = [];
        
        // Check for offline indicator
        const offlineIndicator = document.querySelector('[data-testid*="offline"], .offline-indicator');
        if (!offlineIndicator) {
          issues.push('No offline mode indicator for users');
        }
        
        // Check if app shows cached content
        const hasContent = document.body.textContent.trim().length > 100;
        if (!hasContent) {
          issues.push('App shows blank screen when offline');
        }
        
        return issues;
      });
      
      offlineHandling.forEach(issue => {
        this.logBug('MEDIUM', 'Offline Handling Issue', issue);
      });
      
      // Test poor connection handling
      await this.page.setOfflineMode(false);
      
      const cdpSession = await this.page.target().createCDPSession();
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 50 * 1024 / 8,  // Very slow connection
        uploadThroughput: 50 * 1024 / 8,
        latency: 2000
      });
      
      // Try to navigate to a new page
      const slowLoadStart = Date.now();
      
      try {
        await this.page.goto(`${this.baseUrl}/dashboard`, { timeout: 10000 });
        const slowLoadTime = Date.now() - slowLoadStart;
        
        if (slowLoadTime > 8000) {
          this.logBug('HIGH', 'Poor Slow Connection Handling', 
            'App unusable on very slow connections');
        }
        
      } catch (error) {
        if (error.message.includes('timeout')) {
          this.logBug('HIGH', 'App Fails on Slow Connection', 
            'App fails to load on very slow mobile connections');
        }
      }
      
      // Reset network conditions
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      });
      
    } catch (error) {
      console.log('Mobile network test skipped:', error.message);
    }
  }

  logBug(severity, category, description) {
    this.bugs.push({
      severity,
      category,
      description,
      timestamp: new Date().toISOString(),
      url: this.page ? this.page.url() : 'unknown'
    });
    console.log(`  ${severity}: ${category} - ${description}`);
  }
}

module.exports = MobileInterfaceBugHunter;

// Run if called directly
if (require.main === module) {
  const hunter = new MobileInterfaceBugHunter();
  
  async function runTests() {
    try {
      await hunter.initialize();
      const report = await hunter.runComprehensiveMobileTests();
      
      console.log('\n' + '='.repeat(60));
      console.log('📱 MOBILE INTERFACE BUG HUNT RESULTS');
      console.log('='.repeat(60));
      console.log(`Total bugs found: ${report.totalBugs}`);
      console.log(`Critical: ${report.critical}`);
      console.log(`High: ${report.high}`);
      console.log(`Medium: ${report.medium}`);
      console.log(`Low: ${report.low}`);
      
      if (report.critical > 0) {
        console.log('\n🚨 CRITICAL: Mobile interface blocks user access!');
      }
    } catch (error) {
      console.error('Mobile interface bug hunt failed:', error);
    } finally {
      await hunter.cleanup();
    }
  }
  
  runTests();
}
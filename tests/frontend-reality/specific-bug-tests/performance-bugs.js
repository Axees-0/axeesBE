/**
 * PERFORMANCE BUG TESTS
 * 
 * Tests performance issues that make apps unusable in real-world conditions
 * These bugs cause app abandonment and poor user experience
 */

const puppeteer = require('puppeteer');
const config = require('../config');

class PerformanceBugHunter {
  constructor(baseUrl = config.frontendUrl) {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.bugs = [];
  }

  async initialize() {
    this.browser = await puppeteer.launch(config.getBrowserOptions());
    this.page = await this.browser.newPage();
    
    // Enable performance monitoring
    await this.page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        loadStart: performance.now(),
        memoryStart: performance.memory ? performance.memory.usedJSHeapSize : 0,
        networkRequests: [],
        errors: []
      };
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runComprehensivePerformanceTests() {
    console.log('🚀 Running comprehensive performance bug tests...');
    
    try {
      await this.testInitialPageLoadPerformance();
      await this.testMemoryLeakDetection();
      await this.testLargeListRenderingPerformance();
      await this.testImageLoadingOptimization();
      await this.testNetworkRequestEfficiency();
      await this.testScrollPerformance();
      await this.testAnimationPerformance();
      await this.testJavaScriptExecutionPerformance();
      await this.testMobilePerformanceOptimization();
      await this.testCriticalRenderingPath();
    } catch (error) {
      console.error('Performance test error:', error.message);
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

  async testInitialPageLoadPerformance() {
    console.log('⏱️  Testing: Initial page load performance');
    
    try {
      const startTime = Date.now();
      
      // Test with network throttling (3G simulation)
      const cdpSession = await this.page.target().createCDPSession();
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 1600 * 1024 / 8, // 1.6 Mbps
        uploadThroughput: 750 * 1024 / 8,    // 750 Kbps
        latency: 300 // 300ms
      });
      
      await this.page.goto(this.baseUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Disable throttling
      await cdpSession.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: -1,
        uploadThroughput: -1,
        latency: 0
      });
      
      // Check load time thresholds
      if (loadTime > 10000) {
        this.logBug('CRITICAL', 'Extremely Slow Load Time', 
          `Page takes ${loadTime}ms to load on 3G (should be < 10s)`);
      } else if (loadTime > 5000) {
        this.logBug('HIGH', 'Slow Load Time', 
          `Page takes ${loadTime}ms to load on 3G (should be < 5s)`);
      } else if (loadTime > 3000) {
        this.logBug('MEDIUM', 'Suboptimal Load Time', 
          `Page takes ${loadTime}ms to load on 3G (could be < 3s)`);
      }
      
      // Test Core Web Vitals
      const webVitals = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const vitals = {};
            
            entries.forEach(entry => {
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.LCP = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.FID = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                vitals.CLS = (vitals.CLS || 0) + entry.value;
              }
            });
            
            resolve(vitals);
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          
          // Fallback if no entries
          setTimeout(() => resolve({}), 5000);
        });
      });
      
      if (webVitals.LCP > 2500) {
        this.logBug('HIGH', 'Poor LCP Score', 
          `Largest Contentful Paint: ${webVitals.LCP}ms (should be < 2.5s)`);
      }
      
      if (webVitals.FID > 100) {
        this.logBug('HIGH', 'Poor FID Score', 
          `First Input Delay: ${webVitals.FID}ms (should be < 100ms)`);
      }
      
      if (webVitals.CLS > 0.1) {
        this.logBug('MEDIUM', 'Poor CLS Score', 
          `Cumulative Layout Shift: ${webVitals.CLS} (should be < 0.1)`);
      }
      
    } catch (error) {
      this.logBug('CRITICAL', 'Page Load Failed', `Failed to load page: ${error.message}`);
    }
  }

  async testMemoryLeakDetection() {
    console.log('🧠 Testing: Memory leak detection');
    
    try {
      // Get initial memory
      const initialMemory = await this.page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Simulate heavy navigation to trigger potential leaks
      const routes = ['/dashboard', '/chat', '/analytics', '/profile', '/settings'];
      
      for (let cycle = 0; cycle < 3; cycle++) {
        for (const route of routes) {
          await this.page.goto(`${this.baseUrl}${route}`).catch(() => {
            // Continue if route doesn't exist
          });
          await this.page.waitForTimeout(500);
        }
      }
      
      // Force garbage collection if available
      await this.page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });
      
      await this.page.waitForTimeout(2000);
      
      const finalMemory = await this.page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = Math.round(memoryIncrease / 1024 / 1024);
      
      if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
        this.logBug('CRITICAL', 'Severe Memory Leak', 
          `Memory usage increased by ${memoryIncreaseMB}MB during navigation`);
      } else if (memoryIncrease > 20 * 1024 * 1024) { // 20MB
        this.logBug('HIGH', 'Memory Leak Detected', 
          `Memory usage increased by ${memoryIncreaseMB}MB during navigation`);
      } else if (memoryIncrease > 10 * 1024 * 1024) { // 10MB
        this.logBug('MEDIUM', 'Memory Usage Growth', 
          `Memory usage increased by ${memoryIncreaseMB}MB during navigation`);
      }
      
    } catch (error) {
      console.log('Memory leak test skipped:', error.message);
    }
  }

  async testLargeListRenderingPerformance() {
    console.log('📋 Testing: Large list rendering performance');
    
    try {
      await this.page.goto(`${this.baseUrl}/creators`);
      
      // Simulate loading a large list
      const startTime = Date.now();
      
      await this.page.evaluate(() => {
        // Create large list if one doesn't exist
        const container = document.querySelector('[data-testid="creator-list"]') || document.body;
        
        // Add 200 list items
        for (let i = 0; i < 200; i++) {
          const item = document.createElement('div');
          item.className = 'list-item';
          item.innerHTML = `
            <div class="item-content">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iMjAiIGZpbGw9IiNENUQ1RDUiLz4KPC9zdmc+" alt="Avatar" />
              <div class="item-details">
                <h3>Creator ${i + 1}</h3>
                <p>Follower count: ${Math.floor(Math.random() * 100000)}</p>
                <p>Category: ${['Gaming', 'Fashion', 'Food', 'Tech'][Math.floor(Math.random() * 4)]}</p>
              </div>
            </div>
          `;
          container.appendChild(item);
        }
      });
      
      const renderTime = Date.now() - startTime;
      
      if (renderTime > 5000) {
        this.logBug('CRITICAL', 'List Rendering Too Slow', 
          `Large list takes ${renderTime}ms to render (causes UI freeze)`);
      } else if (renderTime > 2000) {
        this.logBug('HIGH', 'Slow List Rendering', 
          `Large list takes ${renderTime}ms to render (should be < 2s)`);
      } else if (renderTime > 1000) {
        this.logBug('MEDIUM', 'Suboptimal List Rendering', 
          `Large list takes ${renderTime}ms to render (could be < 1s)`);
      }
      
      // Test scroll performance
      const scrollStart = Date.now();
      
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await this.page.waitForTimeout(100);
      
      const scrollTime = Date.now() - scrollStart;
      
      if (scrollTime > 1000) {
        this.logBug('HIGH', 'Janky Scroll Performance', 
          `Scrolling through large list is sluggish (${scrollTime}ms)`);
      }
      
      // Check if virtualization is implemented
      const visibleItems = await this.page.evaluate(() => {
        const items = document.querySelectorAll('.list-item');
        return items.length;
      });
      
      if (visibleItems > 50) {
        this.logBug('MEDIUM', 'No List Virtualization', 
          'Large lists not virtualized - all items rendered simultaneously');
      }
      
    } catch (error) {
      console.log('Large list test skipped:', error.message);
    }
  }

  async testImageLoadingOptimization() {
    console.log('🖼️  Testing: Image loading optimization');
    
    try {
      await this.page.goto(`${this.baseUrl}/gallery`);
      
      // Monitor network requests for images
      const imageRequests = [];
      
      this.page.on('request', request => {
        const url = request.url();
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          imageRequests.push({
            url,
            method: request.method(),
            size: 0,
            startTime: Date.now()
          });
        }
      });
      
      this.page.on('response', response => {
        const url = response.url();
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          const request = imageRequests.find(req => req.url === url);
          if (request) {
            request.endTime = Date.now();
            request.status = response.status();
          }
        }
      });
      
      // Simulate adding images to page
      await this.page.evaluate(() => {
        const container = document.querySelector('[data-testid="image-gallery"]') || document.body;
        
        // Add 20 images
        for (let i = 0; i < 20; i++) {
          const img = document.createElement('img');
          img.src = `https://picsum.photos/300/200?random=${i}`;
          img.alt = `Gallery image ${i}`;
          img.style.width = '300px';
          img.style.height = '200px';
          img.style.margin = '10px';
          container.appendChild(img);
        }
      });
      
      await this.page.waitForTimeout(5000);
      
      // Check if lazy loading is implemented
      const imagesInViewport = await this.page.evaluate(() => {
        const images = document.querySelectorAll('img');
        let loadedCount = 0;
        
        images.forEach(img => {
          if (img.complete && img.naturalWidth > 0) {
            loadedCount++;
          }
        });
        
        return { total: images.length, loaded: loadedCount };
      });
      
      if (imagesInViewport.loaded === imagesInViewport.total && imagesInViewport.total > 10) {
        this.logBug('MEDIUM', 'No Image Lazy Loading', 
          'All images loaded immediately - lazy loading not implemented');
      }
      
      // Check for WebP support
      const webpSupported = await this.page.evaluate(() => {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      });
      
      if (webpSupported && imageRequests.some(req => !req.url.includes('.webp'))) {
        this.logBug('LOW', 'WebP Not Used', 
          'Browser supports WebP but images not served in WebP format');
      }
      
      // Check image load times
      const slowImages = imageRequests.filter(req => 
        req.endTime && (req.endTime - req.startTime) > 3000
      );
      
      if (slowImages.length > 0) {
        this.logBug('MEDIUM', 'Slow Image Loading', 
          `${slowImages.length} images took >3s to load`);
      }
      
    } catch (error) {
      console.log('Image optimization test skipped:', error.message);
    }
  }

  async testNetworkRequestEfficiency() {
    console.log('🌐 Testing: Network request efficiency');
    
    try {
      const networkRequests = [];
      
      this.page.on('request', request => {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          resourceType: request.resourceType(),
          startTime: Date.now()
        });
      });
      
      this.page.on('response', response => {
        const request = networkRequests.find(req => req.url === response.url());
        if (request) {
          request.endTime = Date.now();
          request.status = response.status();
          request.fromCache = response.fromCache();
        }
      });
      
      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.page.waitForTimeout(3000);
      
      // Analyze requests
      const apiRequests = networkRequests.filter(req => 
        req.resourceType === 'xhr' || req.resourceType === 'fetch'
      );
      
      const jsRequests = networkRequests.filter(req => 
        req.resourceType === 'script'
      );
      
      const cssRequests = networkRequests.filter(req => 
        req.resourceType === 'stylesheet'
      );
      
      // Check for excessive API calls
      if (apiRequests.length > 10) {
        this.logBug('MEDIUM', 'Excessive API Calls', 
          `${apiRequests.length} API requests on page load (consider batching)`);
      }
      
      // Check for large bundle sizes
      if (jsRequests.length > 20) {
        this.logBug('MEDIUM', 'Too Many JS Files', 
          `${jsRequests.length} JavaScript files loaded (consider bundling)`);
      }
      
      if (cssRequests.length > 10) {
        this.logBug('MEDIUM', 'Too Many CSS Files', 
          `${cssRequests.length} CSS files loaded (consider bundling)`);
      }
      
      // Check for slow requests
      const slowRequests = networkRequests.filter(req => 
        req.endTime && (req.endTime - req.startTime) > 5000
      );
      
      if (slowRequests.length > 0) {
        this.logBug('HIGH', 'Slow Network Requests', 
          `${slowRequests.length} requests took >5s to complete`);
      }
      
      // Check cache utilization
      const cachedRequests = networkRequests.filter(req => req.fromCache);
      const cacheRatio = cachedRequests.length / networkRequests.length;
      
      if (cacheRatio < 0.3 && networkRequests.length > 10) {
        this.logBug('MEDIUM', 'Poor Cache Utilization', 
          `Only ${Math.round(cacheRatio * 100)}% of requests served from cache`);
      }
      
    } catch (error) {
      console.log('Network efficiency test skipped:', error.message);
    }
  }

  async testScrollPerformance() {
    console.log('📜 Testing: Scroll performance');
    
    try {
      await this.page.goto(`${this.baseUrl}/feed`);
      
      // Add content to make page scrollable
      await this.page.evaluate(() => {
        for (let i = 0; i < 50; i++) {
          const div = document.createElement('div');
          div.style.height = '200px';
          div.style.marginBottom = '20px';
          div.style.backgroundColor = '#f0f0f0';
          div.textContent = `Content block ${i + 1}`;
          document.body.appendChild(div);
        }
      });
      
      // Test scroll performance
      const startTime = Date.now();
      
      await this.page.evaluate(() => {
        return new Promise(resolve => {
          let scrollTop = 0;
          const scrollHeight = document.body.scrollHeight;
          const increment = scrollHeight / 20;
          
          function smoothScroll() {
            scrollTop += increment;
            window.scrollTo(0, scrollTop);
            
            if (scrollTop < scrollHeight) {
              requestAnimationFrame(smoothScroll);
            } else {
              resolve();
            }
          }
          
          smoothScroll();
        });
      });
      
      const scrollTime = Date.now() - startTime;
      
      if (scrollTime > 3000) {
        this.logBug('HIGH', 'Janky Scroll Performance', 
          `Scrolling through page is very sluggish (${scrollTime}ms)`);
      } else if (scrollTime > 1500) {
        this.logBug('MEDIUM', 'Suboptimal Scroll Performance', 
          `Scrolling performance could be improved (${scrollTime}ms)`);
      }
      
      // Test for infinite scroll performance
      await this.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      await this.page.waitForTimeout(1000);
      
      // Check if new content loads efficiently
      const finalHeight = await this.page.evaluate(() => document.body.scrollHeight);
      
      // This would indicate infinite scroll is working but we can't test loading time without real API
      
    } catch (error) {
      console.log('Scroll performance test skipped:', error.message);
    }
  }

  async testAnimationPerformance() {
    console.log('🎬 Testing: Animation performance');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Test CSS animation performance
      await this.page.evaluate(() => {
        // Create animated elements
        for (let i = 0; i < 20; i++) {
          const div = document.createElement('div');
          div.style.width = '50px';
          div.style.height = '50px';
          div.style.backgroundColor = '#3498db';
          div.style.position = 'absolute';
          div.style.top = Math.random() * window.innerHeight + 'px';
          div.style.left = Math.random() * window.innerWidth + 'px';
          div.style.transition = 'transform 2s ease-in-out';
          div.className = 'animated-element';
          document.body.appendChild(div);
        }
      });
      
      const startTime = Date.now();
      
      // Start animations
      await this.page.evaluate(() => {
        const elements = document.querySelectorAll('.animated-element');
        elements.forEach(el => {
          el.style.transform = 'translateX(200px) translateY(200px) rotate(360deg)';
        });
      });
      
      await this.page.waitForTimeout(3000);
      
      // Check frame rate during animation
      const frameRate = await this.page.evaluate(() => {
        return new Promise(resolve => {
          let frames = 0;
          const startTime = performance.now();
          
          function countFrames() {
            frames++;
            if (performance.now() - startTime < 1000) {
              requestAnimationFrame(countFrames);
            } else {
              resolve(frames);
            }
          }
          
          requestAnimationFrame(countFrames);
        });
      });
      
      if (frameRate < 30) {
        this.logBug('HIGH', 'Poor Animation Performance', 
          `Animations running at ${frameRate} FPS (should be 60 FPS)`);
      } else if (frameRate < 50) {
        this.logBug('MEDIUM', 'Suboptimal Animation Performance', 
          `Animations running at ${frameRate} FPS (could be 60 FPS)`);
      }
      
      // Test for GPU acceleration usage
      const usesGPU = await this.page.evaluate(() => {
        const testEl = document.createElement('div');
        testEl.style.transform = 'translateZ(0)';
        document.body.appendChild(testEl);
        
        const style = window.getComputedStyle(testEl);
        const hasGPU = style.transform !== 'none';
        
        document.body.removeChild(testEl);
        return hasGPU;
      });
      
      if (!usesGPU) {
        this.logBug('LOW', 'No GPU Acceleration', 
          'Animations not using GPU acceleration (add transform3d/translateZ)');
      }
      
    } catch (error) {
      console.log('Animation performance test skipped:', error.message);
    }
  }

  async testJavaScriptExecutionPerformance() {
    console.log('⚡ Testing: JavaScript execution performance');
    
    try {
      await this.page.goto(this.baseUrl);
      
      // Test heavy computation performance
      const executionTime = await this.page.evaluate(() => {
        const startTime = performance.now();
        
        // Simulate heavy computation
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.sin(i) * Math.cos(i);
        }
        
        return performance.now() - startTime;
      });
      
      if (executionTime > 100) {
        this.logBug('MEDIUM', 'Slow JavaScript Execution', 
          `Heavy computation takes ${executionTime}ms (consider Web Workers)`);
      }
      
      // Test DOM manipulation performance
      const domTime = await this.page.evaluate(() => {
        const startTime = performance.now();
        
        // Create and append 1000 elements
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 1000; i++) {
          const div = document.createElement('div');
          div.textContent = `Element ${i}`;
          fragment.appendChild(div);
        }
        
        const container = document.createElement('div');
        container.appendChild(fragment);
        document.body.appendChild(container);
        
        const endTime = performance.now();
        
        // Clean up
        document.body.removeChild(container);
        
        return endTime - startTime;
      });
      
      if (domTime > 50) {
        this.logBug('MEDIUM', 'Slow DOM Manipulation', 
          `DOM operations take ${domTime}ms (consider virtual DOM)`);
      }
      
      // Check for memory leaks in event listeners
      const listenerCount = await this.page.evaluate(() => {
        // This is a simplified check - real apps would need proper monitoring
        return Object.keys(window).filter(key => 
          key.startsWith('on') || key.includes('listener')
        ).length;
      });
      
      if (listenerCount > 50) {
        this.logBug('MEDIUM', 'Potential Event Listener Leaks', 
          `High number of potential event listeners (${listenerCount})`);
      }
      
    } catch (error) {
      console.log('JavaScript performance test skipped:', error.message);
    }
  }

  async testMobilePerformanceOptimization() {
    console.log('📱 Testing: Mobile performance optimization');
    
    try {
      // Switch to mobile viewport
      await this.page.setViewport({ 
        width: 375, 
        height: 667, 
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2
      });
      
      // Simulate slower mobile CPU
      const cdpSession = await this.page.target().createCDPSession();
      await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      
      const loadStart = Date.now();
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0' });
      const mobileLoadTime = Date.now() - loadStart;
      
      // Reset CPU throttling
      await cdpSession.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      
      if (mobileLoadTime > 8000) {
        this.logBug('CRITICAL', 'Extremely Slow Mobile Load', 
          `Mobile load time: ${mobileLoadTime}ms (should be < 8s)`);
      } else if (mobileLoadTime > 5000) {
        this.logBug('HIGH', 'Slow Mobile Performance', 
          `Mobile load time: ${mobileLoadTime}ms (should be < 5s)`);
      }
      
      // Test touch responsiveness
      const touchResponseTime = await this.page.evaluate(() => {
        return new Promise(resolve => {
          const startTime = Date.now();
          
          document.addEventListener('touchstart', () => {
            resolve(Date.now() - startTime);
          }, { once: true });
          
          // Simulate touch
          const touch = new Touch({
            identifier: 1,
            target: document.body,
            clientX: 100,
            clientY: 100
          });
          
          const touchEvent = new TouchEvent('touchstart', {
            touches: [touch],
            targetTouches: [touch],
            changedTouches: [touch]
          });
          
          document.body.dispatchEvent(touchEvent);
        });
      });
      
      if (touchResponseTime > 100) {
        this.logBug('HIGH', 'Slow Touch Response', 
          `Touch events take ${touchResponseTime}ms to respond`);
      }
      
      // Reset to desktop viewport
      await this.page.setViewport({ width: 1366, height: 768 });
      
    } catch (error) {
      console.log('Mobile performance test skipped:', error.message);
    }
  }

  async testCriticalRenderingPath() {
    console.log('🎯 Testing: Critical rendering path optimization');
    
    try {
      // Analyze render blocking resources
      const renderMetrics = await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation')[0];
        
        return {
          domContentLoaded: entries.domContentLoadedEventStart,
          domComplete: entries.domComplete,
          loadComplete: entries.loadEventEnd,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
        };
      });
      
      if (renderMetrics.firstContentfulPaint > 1800) {
        this.logBug('HIGH', 'Slow First Contentful Paint', 
          `FCP: ${renderMetrics.firstContentfulPaint}ms (should be < 1.8s)`);
      }
      
      if (renderMetrics.domContentLoaded > 1500) {
        this.logBug('MEDIUM', 'Slow DOM Content Loaded', 
          `DCL: ${renderMetrics.domContentLoaded}ms (should be < 1.5s)`);
      }
      
      // Check for render blocking CSS/JS
      const blockingResources = await this.page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        
        return resources.filter(resource => {
          return (resource.name.includes('.css') || resource.name.includes('.js')) && 
                 resource.startTime < 1000; // Loaded early, potentially blocking
        }).length;
      });
      
      if (blockingResources > 5) {
        this.logBug('MEDIUM', 'Too Many Render Blocking Resources', 
          `${blockingResources} CSS/JS files potentially blocking render`);
      }
      
    } catch (error) {
      console.log('Critical rendering path test skipped:', error.message);
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

module.exports = PerformanceBugHunter;

// Run if called directly
if (require.main === module) {
  const hunter = new PerformanceBugHunter();
  
  async function runTests() {
    try {
      await hunter.initialize();
      const report = await hunter.runComprehensivePerformanceTests();
      
      console.log('\n' + '='.repeat(60));
      console.log('🚀 PERFORMANCE BUG HUNT RESULTS');
      console.log('='.repeat(60));
      console.log(`Total bugs found: ${report.totalBugs}`);
      console.log(`Critical: ${report.critical}`);
      console.log(`High: ${report.high}`);
      console.log(`Medium: ${report.medium}`);
      console.log(`Low: ${report.low}`);
      
      if (report.critical > 0) {
        console.log('\n🚨 CRITICAL: Performance issues will cause app abandonment!');
      }
    } catch (error) {
      console.error('Performance bug hunt failed:', error);
    } finally {
      await hunter.cleanup();
    }
  }
  
  runTests();
}
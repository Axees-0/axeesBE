#!/usr/bin/env node

/**
 * Element Discovery - Finds all interactive elements on each page
 */

const puppeteer = require('puppeteer');
const config = require('./crawler-config');

class ElementDiscovery {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🔍 Starting Element Discovery...\n');
    
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1200, height: 800 });
  }

  async discoverAllPages() {
    for (const pageConfig of config.pages) {
      await this.discoverPageElements(pageConfig);
    }
  }

  async discoverPageElements(pageConfig) {
    console.log(`🔍 Discovering elements on ${pageConfig.name} page...`);
    console.log(`   URL: ${config.baseUrl}${pageConfig.path}\n`);
    
    try {
      // Navigate to page
      await this.page.goto(`${config.baseUrl}${pageConfig.path}`, {
        waitUntil: 'networkidle2',
        timeout: config.timing.pageLoad
      });
      
      // Wait for React to hydrate
      await new Promise(resolve => setTimeout(resolve, config.timing.navigation));
      
      // Discover interactive elements
      const elements = await this.page.evaluate(() => {
        const discovered = [];
        
        // Find buttons
        const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
        buttons.forEach((btn, index) => {
          const text = btn.innerText || btn.value || btn.getAttribute('aria-label') || 'Button';
          const isVisible = btn.offsetParent !== null;
          
          discovered.push({
            type: 'button',
            selector: `button:nth-of-type(${index + 1})`,
            text: text.trim().substring(0, 50),
            visible: isVisible,
            disabled: btn.disabled,
            className: btn.className,
            id: btn.id
          });
        });
        
        // Find links
        const links = document.querySelectorAll('a[href]');
        links.forEach((link, index) => {
          const text = link.innerText || link.getAttribute('aria-label') || 'Link';
          const href = link.getAttribute('href');
          const isVisible = link.offsetParent !== null;
          
          discovered.push({
            type: 'link',
            selector: `a:nth-of-type(${index + 1})`,
            text: text.trim().substring(0, 50),
            href: href,
            visible: isVisible,
            className: link.className,
            id: link.id
          });
        });
        
        // Find form inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach((input, index) => {
          const label = input.getAttribute('placeholder') || 
                       input.getAttribute('aria-label') || 
                       input.getAttribute('name') || 
                       'Input';
          const isVisible = input.offsetParent !== null;
          
          discovered.push({
            type: 'input',
            selector: `${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
            inputType: input.type,
            label: label.substring(0, 50),
            visible: isVisible,
            required: input.required,
            disabled: input.disabled,
            className: input.className,
            id: input.id
          });
        });
        
        // Find tabs
        const tabs = document.querySelectorAll('[role="tab"]');
        tabs.forEach((tab, index) => {
          const text = tab.innerText || tab.getAttribute('aria-label') || 'Tab';
          const isVisible = tab.offsetParent !== null;
          const isSelected = tab.getAttribute('aria-selected') === 'true';
          
          discovered.push({
            type: 'tab',
            selector: `[role="tab"]:nth-of-type(${index + 1})`,
            text: text.trim().substring(0, 50),
            visible: isVisible,
            selected: isSelected,
            className: tab.className,
            id: tab.id
          });
        });
        
        // Find clickable divs/spans (React components)
        const clickables = document.querySelectorAll('[onclick], [data-testid], .clickable, .btn, .button');
        clickables.forEach((elem, index) => {
          if (elem.tagName !== 'BUTTON' && elem.tagName !== 'A') {
            const text = elem.innerText || elem.getAttribute('data-testid') || 'Clickable';
            const isVisible = elem.offsetParent !== null;
            
            discovered.push({
              type: 'clickable',
              selector: `${elem.tagName.toLowerCase()}.${elem.className.split(' ')[0]}:nth-of-type(${index + 1})`,
              text: text.trim().substring(0, 50),
              visible: isVisible,
              tagName: elem.tagName,
              className: elem.className,
              id: elem.id,
              dataTestId: elem.getAttribute('data-testid')
            });
          }
        });
        
        return discovered;
      });
      
      // Filter and display results
      const visibleElements = elements.filter(el => el.visible);
      const hiddenElements = elements.filter(el => !el.visible);
      
      console.log(`   📊 Found ${elements.length} total elements (${visibleElements.length} visible, ${hiddenElements.length} hidden)\n`);
      
      // Display by type
      const types = ['tab', 'button', 'link', 'input', 'clickable'];
      
      types.forEach(type => {
        const typeElements = visibleElements.filter(el => el.type === type);
        if (typeElements.length > 0) {
          console.log(`   🎯 ${type.toUpperCase()}S (${typeElements.length}):`);
          typeElements.forEach((el, i) => {
            const status = el.disabled ? '🚫' : '✅';
            const text = el.text || el.label || el.href || 'N/A';
            console.log(`     ${status} [${i + 1}] ${text}`);
            
            if (el.href) console.log(`         → ${el.href}`);
            if (el.inputType) console.log(`         → Type: ${el.inputType}`);
            if (el.selected) console.log(`         → Selected: ${el.selected}`);
          });
          console.log('');
        }
      });
      
      // Suggest test scenarios
      console.log('   💡 SUGGESTED TEST SCENARIOS:');
      
      const tabs = visibleElements.filter(el => el.type === 'tab');
      if (tabs.length > 0) {
        console.log(`     • Test navigation between ${tabs.length} tabs`);
      }
      
      const buttons = visibleElements.filter(el => el.type === 'button' && !el.disabled);
      if (buttons.length > 0) {
        console.log(`     • Test ${buttons.length} interactive button(s)`);
      }
      
      const forms = visibleElements.filter(el => el.type === 'input');
      if (forms.length > 0) {
        console.log(`     • Test ${forms.length} form input(s)`);
      }
      
      console.log('\n' + '-'.repeat(50) + '\n');
      
    } catch (error) {
      console.log(`   ❌ Error discovering elements: ${error.message}\n`);
    }
  }

  async generateConfig() {
    console.log('🛠️  GENERATING ENHANCED CONFIG...\n');
    
    const enhancedConfig = {
      ...config,
      discoveredElements: {}
    };
    
    for (const pageConfig of config.pages) {
      console.log(`Analyzing ${pageConfig.name}...`);
      
      try {
        await this.page.goto(`${config.baseUrl}${pageConfig.path}`, {
          waitUntil: 'networkidle2',
          timeout: config.timing.pageLoad
        });
        
        await new Promise(resolve => setTimeout(resolve, config.timing.navigation));
        
        const elements = await this.page.evaluate(() => {
          const discovered = [];
          
          // Find all interactive elements
          const interactives = document.querySelectorAll('button, [role="button"], a[href], [role="tab"], input, textarea, select');
          
          interactives.forEach(elem => {
            if (elem.offsetParent !== null && !elem.disabled) {
              const text = elem.innerText || elem.value || elem.getAttribute('aria-label') || elem.getAttribute('placeholder') || '';
              
              discovered.push({
                type: elem.tagName.toLowerCase(),
                role: elem.getAttribute('role'),
                selector: elem.id ? `#${elem.id}` : 
                         elem.className ? `.${elem.className.split(' ')[0]}` :
                         elem.tagName.toLowerCase(),
                text: text.trim().substring(0, 30),
                testable: true
              });
            }
          });
          
          return discovered;
        });
        
        enhancedConfig.discoveredElements[pageConfig.name] = elements;
        console.log(`   Found ${elements.length} testable elements`);
        
      } catch (error) {
        console.log(`   Error: ${error.message}`);
      }
    }
    
    // Save enhanced config
    const fs = require('fs');
    const outputPath = './crawler/enhanced-config.json';
    fs.writeFileSync(outputPath, JSON.stringify(enhancedConfig, null, 2));
    
    console.log(`\n✅ Enhanced config saved to: ${outputPath}`);
    console.log('   Use this for more comprehensive testing!\n');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runDiscovery() {
  const discovery = new ElementDiscovery();
  
  try {
    await discovery.initialize();
    await discovery.discoverAllPages();
    await discovery.generateConfig();
  } catch (error) {
    console.error('Discovery error:', error);
  } finally {
    await discovery.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  runDiscovery().then(() => {
    console.log('🏁 Element discovery complete');
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ElementDiscovery;
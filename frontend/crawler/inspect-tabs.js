#!/usr/bin/env node

/**
 * DOM Inspector - Extract actual tab element attributes
 */

const puppeteer = require('puppeteer');

async function inspectTabElements() {
  console.log('🔍 Starting DOM inspection for tab elements...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  try {
    console.log('📄 Loading page...');
    await page.goto('http://localhost:8081/', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });
    
    // Wait for React hydration
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Extracting tab elements and their attributes...');
    
    const tabData = await page.evaluate(() => {
      const results = [];
      
      // Find tablist
      const tablist = document.querySelector('[role="tablist"]');
      if (tablist) {
        results.push({
          type: 'tablist',
          tag: tablist.tagName,
          attributes: Array.from(tablist.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
          classes: Array.from(tablist.classList),
          textContent: tablist.textContent.trim(),
          fullHTML: tablist.outerHTML.substring(0, 1000)
        });
        
        // Look for all children of tablist
        const tablistChildren = Array.from(tablist.children);
        tablistChildren.forEach((child, index) => {
          results.push({
            type: 'tablist-child',
            index: index,
            tag: child.tagName,
            attributes: Array.from(child.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {}),
            classes: Array.from(child.classList),
            textContent: child.textContent.trim(),
            innerHTML: child.innerHTML.substring(0, 300)
          });
        });
      }
      
      // Find all tabs
      const tabs = document.querySelectorAll('[role="tab"]');
      tabs.forEach((tab, index) => {
        results.push({
          type: 'tab',
          index: index,
          tag: tab.tagName,
          attributes: Array.from(tab.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {}),
          classes: Array.from(tab.classList),
          textContent: tab.textContent.trim(),
          innerHTML: tab.innerHTML.substring(0, 500)
        });
      });
      
      // Look for navigation-like structures that might contain tabs
      const navSelectors = [
        'nav', 
        '[class*="tabbar"]', 
        '[class*="navigation"]',
        '[class*="tab"]',
        'a[href*="/"]' // Navigation links
      ];
      
      navSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, index) => {
          // Skip if already captured
          if (el.getAttribute('role') === 'tab' || el.getAttribute('role') === 'tablist') return;
          
          results.push({
            type: `nav-${selector}`,
            index: index,
            tag: el.tagName,
            attributes: Array.from(el.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {}),
            classes: Array.from(el.classList),
            textContent: el.textContent.trim().substring(0, 50)
          });
        });
      });
      
      return results;
    });
    
    console.log('\n📋 TAB ELEMENT ANALYSIS:');
    console.log('='.repeat(60));
    
    tabData.forEach(item => {
      console.log(`\n${item.type.toUpperCase()} ${item.index !== undefined ? `#${item.index}` : ''}:`);
      console.log(`  Tag: <${item.tag}>`);
      console.log(`  Text: "${item.textContent}"`);
      console.log(`  Classes: [${item.classes.join(', ')}]`);
      console.log(`  Attributes:`);
      Object.entries(item.attributes).forEach(([key, value]) => {
        console.log(`    ${key}="${value}"`);
      });
      if (item.innerHTML) {
        console.log(`  HTML: ${item.innerHTML}`);
      }
    });
    
    // Now let's build proper selectors
    console.log('\n🎯 RECOMMENDED SELECTORS:');
    console.log('='.repeat(60));
    
    const tabs = tabData.filter(item => item.type === 'tab');
    tabs.forEach((tab, index) => {
      const label = tab.textContent;
      console.log(`\n${label} Tab:`);
      
      // Generate possible selectors
      const selectors = [];
      
      // By text content
      if (label) {
        selectors.push(`[role="tab"]:nth-child(${index + 1})`);
        selectors.push(`[role="tab"] >> text="${label}"`);
      }
      
      // By class if unique
      if (tab.classes.length > 0) {
        selectors.push(`[role="tab"].${tab.classes[0]}`);
      }
      
      // By data attributes
      Object.entries(tab.attributes).forEach(([key, value]) => {
        if (key.startsWith('data-')) {
          selectors.push(`[role="tab"][${key}="${value}"]`);
        }
      });
      
      // Generic fallback
      selectors.push(`[role="tab"]:nth-of-type(${index + 1})`);
      
      selectors.forEach(selector => {
        console.log(`  ${selector}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error during inspection:', error);
  } finally {
    await browser.close();
  }
}

inspectTabElements();
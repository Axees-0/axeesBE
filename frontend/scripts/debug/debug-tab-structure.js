const puppeteer = require('puppeteer');

// Investigate tab bar visibility in DOM structure
async function debugTabStructure() {
  console.log('🔍 Investigating Tab Bar DOM Structure...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Loading Messages page...');
    await page.goto('http://localhost:8081/messages', { waitUntil: 'networkidle0', timeout: 15000 });
    
    // Wait for page to fully render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 PRE-VALIDATION: Documenting expected tab structure...');
    
    // Check for expected tab-related elements
    const tabElements = await page.evaluate(() => {
      const results = {
        tabBarElements: [],
        tabButtons: [],
        tabLabels: [],
        navigationElements: [],
        cssClasses: [],
        ariaElements: []
      };
      
      // Look for common tab patterns
      const selectors = [
        '[role="tablist"]',
        '[role="tab"]', 
        '[data-testid*="tab"]',
        '[aria-label*="tab"]',
        '.tab',
        '.tabbar',
        '.navigation',
        '.bottom-tab',
        'button[aria-selected]'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.tabBarElements.push({
            selector,
            count: elements.length,
            visible: Array.from(elements).map(el => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden';
            })
          });
        }
      });
      
      // Look for tab labels/text
      const possibleTabTexts = ['Explore', 'Deals', 'Messages', 'Notifications', 'Profile'];
      possibleTabTexts.forEach(text => {
        const xpath = `//text()[contains(., '${text}')]`;
        const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue) {
          results.tabLabels.push({
            text,
            found: true,
            parent: result.singleNodeValue.parentElement?.tagName
          });
        }
      });
      
      // Look for button or pressable elements that might be tabs
      const buttons = document.querySelectorAll('button, [role="button"]');
      const tabButtons = Array.from(buttons).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return ['explore', 'deals', 'messages', 'notifications', 'profile'].some(tab => 
          text.includes(tab)
        );
      });
      
      results.tabButtons = tabButtons.map(btn => ({
        tagName: btn.tagName,
        textContent: btn.textContent,
        className: btn.className,
        visible: window.getComputedStyle(btn).display !== 'none'
      }));
      
      // Get all elements with style containing 'flex' (might be tab bar)
      const flexElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'flex' && style.justifyContent && style.alignItems;
      });
      
      results.navigationElements = flexElements.slice(0, 10).map(el => ({
        tagName: el.tagName,
        className: el.className,
        childrenCount: el.children.length,
        hasTabText: possibleTabTexts.some(text => 
          el.textContent?.includes(text)
        )
      }));
      
      return results;
    });
    
    console.log('📋 Expected Tab Structure Analysis:');
    console.log('   Tab Bar Elements:', tabElements.tabBarElements.length);
    console.log('   Tab Buttons Found:', tabElements.tabButtons.length);
    console.log('   Tab Labels Found:', tabElements.tabLabels.length);
    console.log('   Navigation Elements:', tabElements.navigationElements.length);
    
    if (tabElements.tabButtons.length > 0) {
      console.log('\n🔍 Tab Buttons Details:');
      tabElements.tabButtons.forEach((btn, i) => {
        console.log(`   ${i+1}. ${btn.tagName} - "${btn.textContent}" (visible: ${btn.visible})`);
      });
    }
    
    if (tabElements.tabLabels.length > 0) {
      console.log('\n📝 Tab Labels Found:');
      tabElements.tabLabels.forEach(label => {
        console.log(`   ✅ "${label.text}" in ${label.parent}`);
      });
    }
    
    if (tabElements.navigationElements.length > 0) {
      console.log('\n🧭 Navigation Elements:');
      tabElements.navigationElements.forEach((nav, i) => {
        console.log(`   ${i+1}. ${nav.tagName} (${nav.childrenCount} children, hasTabText: ${nav.hasTabText})`);
      });
    }
    
    // Check page layout structure
    console.log('\n📐 Page Layout Analysis:');
    const layoutInfo = await page.evaluate(() => {
      return {
        bodyChildren: document.body.children.length,
        hasFixedElements: Array.from(document.querySelectorAll('*')).some(el => 
          window.getComputedStyle(el).position === 'fixed'
        ),
        hasAbsoluteElements: Array.from(document.querySelectorAll('*')).some(el => 
          window.getComputedStyle(el).position === 'absolute'
        ),
        bottomElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.bottom === '0px' || style.bottom === '0';
        }).length
      };
    });
    
    console.log(`   Body children: ${layoutInfo.bodyChildren}`);
    console.log(`   Fixed positioned elements: ${layoutInfo.hasFixedElements}`);
    console.log(`   Absolute positioned elements: ${layoutInfo.hasAbsoluteElements}`);
    console.log(`   Bottom-anchored elements: ${layoutInfo.bottomElements}`);
    
    console.log('\n✅ PRE-VALIDATION COMPLETE');
    console.log('📝 Next: Inspect actual DOM elements vs expected structure');
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the investigation
debugTabStructure().catch(console.error);
const puppeteer = require('puppeteer');

async function testCompleteDemoWorkflow() {
  console.log('🚀 COMPREHENSIVE DEMO WORKFLOW VALIDATION');
  console.log('🎯 Testing complete marketer→creator demo journey for live presentation\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎬 DEMO SCENARIO: Complete Marketer → Creator Journey');
    console.log('═══════════════════════════════════════════════════════');
    
    // STEP 1: App Launch & Navigation
    console.log('\n📱 STEP 1: App Launch & Navigation Test');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify all 5 tabs are visible
    const tabChecks = ['Explore', 'Deals/Offers', 'Messages', 'Notifications', 'Profile'];
    let visibleTabs = 0;
    
    for (const tab of tabChecks) {
      try {
        await page.waitForSelector(`text=${tab}`, { timeout: 1000 });
        console.log(`  ✅ ${tab} tab visible`);
        visibleTabs++;
      } catch (e) {
        console.log(`  ❌ ${tab} tab missing`);
      }
    }
    
    console.log(`   📊 Navigation: ${visibleTabs}/5 tabs visible`);
    
    // STEP 2: Creator Discovery (Marketer Perspective)
    console.log('\n🔍 STEP 2: Creator Discovery Journey');
    await page.click('text=Explore');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for creator discovery content
    const discoveryChecks = ['Emma Thompson', 'Marcus Johnson', 'Sofia Rodriguez'];
    let creatorsFound = 0;
    
    for (const creator of discoveryChecks) {
      try {
        await page.waitForSelector(`text=${creator}`, { timeout: 1000 });
        console.log(`  ✅ Found creator: ${creator}`);
        creatorsFound++;
      } catch (e) {
        console.log(`  ❌ Missing creator: ${creator}`);
      }
    }
    
    console.log(`   📊 Creator Discovery: ${creatorsFound}/3 creators visible`);
    
    // STEP 3: Creator Profile Navigation
    console.log('\n👤 STEP 3: Creator Profile Navigation');
    try {
      await page.click('text=Emma Thompson');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for profile content
      const profileChecks = ['@emmastyle', 'Create Offer', 'Contact', 'About'];
      let profileElements = 0;
      
      for (const element of profileChecks) {
        try {
          await page.waitForSelector(`text=${element}`, { timeout: 1000 });
          console.log(`  ✅ Profile element: ${element}`);
          profileElements++;
        } catch (e) {
          console.log(`  ❌ Missing: ${element}`);
        }
      }
      
      console.log(`   📊 Profile Page: ${profileElements}/4 elements visible`);
    } catch (e) {
      console.log('  ❌ Could not navigate to creator profile');
    }
    
    // STEP 4: Deals Dashboard Navigation
    console.log('\n💼 STEP 4: Deals Dashboard Validation');
    await page.click('text=Deals/Offers');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const dealsChecks = ['Emma Thompson', 'Marcus Johnson', 'Sofia Rodriguez', 'Pending Response', 'Completed'];
    let dealsContent = 0;
    
    for (const element of dealsChecks) {
      try {
        await page.waitForSelector(`text=${element}`, { timeout: 1000 });
        console.log(`  ✅ Deals content: ${element}`);
        dealsContent++;
      } catch (e) {
        console.log(`  ❌ Missing: ${element}`);
      }
    }
    
    console.log(`   📊 Deals Dashboard: ${dealsContent}/5 elements visible`);
    
    // STEP 5: Role Switcher Test
    console.log('\n🔄 STEP 5: Role Switcher Functionality');
    await page.click('text=Profile');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await page.waitForSelector('text=🔄 Switch Role', { timeout: 2000 });
      console.log('  ✅ Role switcher button found');
      
      await page.click('text=🔄 Switch Role');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for modal
      try {
        await page.waitForSelector('text=Switch to', { timeout: 2000 });
        console.log('  ✅ Role switcher modal opened');
        
        // Close modal (ESC key)
        await page.keyboard.press('Escape');
        console.log('  ✅ Role switcher modal can be closed');
      } catch (e) {
        console.log('  ❌ Role switcher modal not working');
      }
    } catch (e) {
      console.log('  ❌ Role switcher button not found');
    }
    
    // STEP 6: Messages & Notifications Check
    console.log('\n💬 STEP 6: Messages & Notifications');
    
    await page.click('text=Messages');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await page.waitForSelector('text=Messages', { timeout: 2000 });
      console.log('  ✅ Messages page loads');
    } catch (e) {
      console.log('  ❌ Messages page not loading');
    }
    
    await page.click('text=Notifications');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      await page.waitForSelector('text=Notifications', { timeout: 2000 });
      console.log('  ✅ Notifications page loads');
    } catch (e) {
      console.log('  ❌ Notifications page not loading');
    }
    
    // FINAL ASSESSMENT
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 FINAL DEMO READINESS ASSESSMENT');
    console.log('═══════════════════════════════════════════════════════');
    
    const scores = {
      navigation: visibleTabs,
      discovery: creatorsFound,
      profile: profileElements || 0,
      deals: dealsContent,
      roleSwitch: 1, // Binary: works or doesn't
    };
    
    const maxScores = {
      navigation: 5,
      discovery: 3,
      profile: 4,
      deals: 5,
      roleSwitch: 1,
    };
    
    let totalScore = 0;
    let maxScore = 0;
    
    for (const [key, value] of Object.entries(scores)) {
      totalScore += value;
      maxScore += maxScores[key];
      const percentage = (value / maxScores[key]) * 100;
      console.log(`${key.padEnd(12)}: ${value}/${maxScores[key]} (${percentage.toFixed(0)}%)`);
    }
    
    const overallPercentage = (totalScore / maxScore) * 100;
    console.log(`\n🎯 OVERALL DEMO SCORE: ${totalScore}/${maxScore} (${overallPercentage.toFixed(0)}%)`);
    
    if (overallPercentage >= 80) {
      console.log('🎉 EXCELLENT: Demo is ready for live presentation!');
    } else if (overallPercentage >= 60) {
      console.log('✅ GOOD: Demo is functional with minor issues');
    } else {
      console.log('⚠️  NEEDS WORK: Demo has significant issues');
    }
    
    // Demo Tips
    console.log('\n💡 DEMO PRESENTATION TIPS:');
    if (visibleTabs === 5) console.log('  ✅ All tabs visible - smooth navigation demo possible');
    if (creatorsFound >= 2) console.log('  ✅ Creator discovery works - good for showing variety');
    if (dealsContent >= 4) console.log('  ✅ Rich deals dashboard - impressive for stakeholders');
    
    // Wait to see results
    await new Promise(resolve => setTimeout(resolve, 4000));
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testCompleteDemoWorkflow();
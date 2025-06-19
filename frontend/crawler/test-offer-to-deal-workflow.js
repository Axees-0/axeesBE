const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:8082';
const DELAY = 1500;

// Test configuration
const TEST_USERS = {
  marketer: {
    email: 'sarah@techstyle.com',
    name: 'Sarah Martinez',
    role: 'marketer'
  },
  creator: {
    email: 'emma@creativestudio.com', 
    name: 'Emma Thompson',
    role: 'creator'
  }
};

// Utility function for delays
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to take screenshots
async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `./screenshots/offer-workflow/${name}.png`,
    fullPage: true 
  });
}

// Test Suite for 03_offer_to_deal_workflow.mmd
async function testOfferToDealWorkflow() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const results = {
    passed: [],
    failed: [],
    totalSteps: 0
  };

  try {
    console.log('🚀 Starting Offer to Deal Workflow Test Suite');
    console.log('=========================================\n');

    // Test 1: Marketer Flow - Search and Create Offer
    console.log('📋 Test 1: Marketer Flow - Search and Create Offer');
    const marketerPage = await browser.newPage();
    await marketerPage.goto(BASE_URL);
    await wait(DELAY);

    // Step: M_SEARCH - Search Creators
    console.log('  ✓ Step: Search Creators');
    await marketerPage.waitForSelector('[href="/explore"]', { timeout: 10000 });
    await marketerPage.click('[href="/explore"]');
    await wait(DELAY);
    await takeScreenshot(marketerPage, '01-marketer-search');
    results.passed.push('M_SEARCH: Search Creators page accessible');
    results.totalSteps++;

    // Step: M_FIND - Find Creator Profile
    console.log('  ✓ Step: Find Creator Profile');
    const creatorCards = await marketerPage.$$('.creator-card');
    if (creatorCards.length > 0) {
      await creatorCards[0].click();
      await wait(DELAY);
      await takeScreenshot(marketerPage, '02-creator-profile');
      results.passed.push('M_FIND: Creator profile found and opened');
    } else {
      results.failed.push('M_FIND: No creator cards found');
    }
    results.totalSteps++;

    // Step: M_DRAFT - Create Offer Draft
    console.log('  ✓ Step: Create Offer Draft');
    const createOfferButton = await marketerPage.$('button:has-text("Create Offer")');
    if (createOfferButton) {
      await createOfferButton.click();
      await wait(DELAY);
      
      // Check for offer modal or navigation to offer page
      const offerModal = await marketerPage.$('.offer-modal');
      const offerPage = await marketerPage.url().includes('/offers/');
      
      if (offerModal || offerPage) {
        await takeScreenshot(marketerPage, '03-create-offer');
        results.passed.push('M_DRAFT: Offer creation interface opened');
      } else {
        results.failed.push('M_DRAFT: Offer creation interface not found');
      }
    } else {
      results.failed.push('M_DRAFT: Create Offer button not found');
    }
    results.totalSteps++;

    // Test 2: Creator Flow - View and Review Offers
    console.log('\n📋 Test 2: Creator Flow - View and Review Offers');
    const creatorPage = await browser.newPage();
    
    // First switch to creator role
    await creatorPage.goto(`${BASE_URL}/profile`);
    await wait(DELAY);
    
    // Click role switcher
    const roleSwitcher = await creatorPage.$('button:has-text("Switch Role")');
    if (roleSwitcher) {
      await roleSwitcher.click();
      await wait(DELAY);
      
      // Select creator role
      const creatorOption = await creatorPage.$('text=Creator');
      if (creatorOption) {
        await creatorOption.click();
        await wait(500);
        
        const switchButton = await creatorPage.$('button:has-text("Switch to Creator")');
        if (switchButton) {
          await switchButton.click();
          await wait(DELAY);
        }
      }
    }

    // Step: C_OFFERS - View Received Offers
    console.log('  ✓ Step: View Received Offers');
    await creatorPage.goto(`${BASE_URL}/deals`);
    await wait(DELAY);
    
    const offersSection = await creatorPage.$('text=Pending Offers');
    if (offersSection) {
      await takeScreenshot(creatorPage, '04-creator-offers-list');
      results.passed.push('C_OFFERS: Creator offers view accessible');
    } else {
      results.failed.push('C_OFFERS: Creator offers view not found');
    }
    results.totalSteps++;

    // Step: C_REVIEW - Review Offer Details
    console.log('  ✓ Step: Review Offer Details');
    const offerCards = await creatorPage.$$('.offer-card');
    if (offerCards.length > 0) {
      await offerCards[0].click();
      await wait(DELAY);
      
      const reviewUrl = await creatorPage.url();
      if (reviewUrl.includes('/offers/review')) {
        await takeScreenshot(creatorPage, '05-offer-review');
        results.passed.push('C_REVIEW: Offer review page opened');
      } else {
        results.failed.push('C_REVIEW: Offer review page not found');
      }
    } else {
      results.failed.push('C_REVIEW: No offer cards found');
    }
    results.totalSteps++;

    // Step: C_DECISION - Creator Decision Options
    console.log('  ✓ Step: Creator Decision Options');
    const acceptButton = await creatorPage.$('button:has-text("Accept Offer")');
    const counterButton = await creatorPage.$('button:has-text("Counter Offer")');
    const declineButton = await creatorPage.$('button:has-text("Decline")');
    
    if (acceptButton && counterButton && declineButton) {
      await takeScreenshot(creatorPage, '06-decision-options');
      results.passed.push('C_DECISION: All decision options available');
    } else {
      results.failed.push('C_DECISION: Missing decision options');
    }
    results.totalSteps++;

    // Test 3: Counter Offer Flow
    console.log('\n📋 Test 3: Counter Offer Flow');
    
    // Step: C_COUNTER - Create Counter Offer
    console.log('  ✓ Step: Create Counter Offer');
    if (counterButton) {
      await counterButton.click();
      await wait(DELAY);
      
      const counterUrl = await creatorPage.url();
      if (counterUrl.includes('/offers/counter')) {
        await takeScreenshot(creatorPage, '07-counter-offer');
        results.passed.push('C_COUNTER: Counter offer page opened');
        
        // Fill counter offer form
        const amountInput = await creatorPage.$('input[type="numeric"]');
        const messageInput = await creatorPage.$('textarea');
        
        if (amountInput && messageInput) {
          await amountInput.click({ clickCount: 3 });
          await amountInput.type('2000');
          await messageInput.type('I appreciate your offer. Based on my engagement rates...');
          await takeScreenshot(creatorPage, '08-counter-filled');
          results.passed.push('Counter offer form filled');
        }
      } else {
        results.failed.push('C_COUNTER: Counter offer page not found');
      }
    }
    results.totalSteps++;

    // Test 4: Deal Creation and Management
    console.log('\n📋 Test 4: Deal Creation and Management');
    
    // Navigate to deals to check active deals
    await creatorPage.goto(`${BASE_URL}/deals`);
    await wait(DELAY);
    
    // Step: DEAL_ACTIVE - Check for Active Deals
    console.log('  ✓ Step: Check Active Deals');
    const activeDeals = await creatorPage.$('text=Active Deals');
    if (activeDeals) {
      await takeScreenshot(creatorPage, '09-active-deals');
      results.passed.push('DEAL_ACTIVE: Active deals section found');
      
      // Click on an active deal
      const dealCards = await creatorPage.$$('.offer-card');
      for (const card of dealCards) {
        const statusText = await card.$eval('.offer-status', el => el.textContent);
        if (statusText && statusText.includes('Deal Active')) {
          await card.click();
          await wait(DELAY);
          break;
        }
      }
    } else {
      results.failed.push('DEAL_ACTIVE: No active deals section');
    }
    results.totalSteps++;

    // Step: MILESTONES - Check Milestone Setup
    console.log('  ✓ Step: Check Milestone Setup');
    const dealUrl = await creatorPage.url();
    if (dealUrl.includes('/deals/')) {
      const milestonesSection = await creatorPage.$('text=Milestones');
      if (milestonesSection) {
        await takeScreenshot(creatorPage, '10-milestones');
        results.passed.push('MILESTONES: Milestone section found');
      } else {
        results.failed.push('MILESTONES: Milestone section not found');
      }
    }
    results.totalSteps++;

    // Step: WORK_PHASE - Work Submission
    console.log('  ✓ Step: Work Submission Phase');
    const submitWorkButton = await creatorPage.$('button:has-text("Submit Work")');
    if (submitWorkButton) {
      await submitWorkButton.click();
      await wait(DELAY);
      
      const submitUrl = await creatorPage.url();
      if (submitUrl.includes('/deals/submit')) {
        await takeScreenshot(creatorPage, '11-work-submission');
        results.passed.push('WORK_PHASE: Work submission page accessible');
      } else {
        results.failed.push('WORK_PHASE: Work submission page not found');
      }
    } else {
      results.failed.push('WORK_PHASE: Submit work button not found');
    }
    results.totalSteps++;

    // Step: PROOF_PHASE - Proof Submission
    console.log('  ✓ Step: Proof Submission Phase');
    await creatorPage.goto(`${BASE_URL}/deals/DEAL-001`);
    await wait(DELAY);
    
    const uploadProofButton = await creatorPage.$('button:has-text("Upload Proof")');
    if (uploadProofButton) {
      await uploadProofButton.click();
      await wait(DELAY);
      
      const proofUrl = await creatorPage.url();
      if (proofUrl.includes('/deals/proof')) {
        await takeScreenshot(creatorPage, '12-proof-upload');
        results.passed.push('PROOF_PHASE: Proof upload page accessible');
      } else {
        results.failed.push('PROOF_PHASE: Proof upload page not found');
      }
    } else {
      results.failed.push('PROOF_PHASE: Upload proof button not found');
    }
    results.totalSteps++;

    // Print results
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    console.log(`✅ Passed: ${results.passed.length}/${results.totalSteps}`);
    console.log(`❌ Failed: ${results.failed.length}/${results.totalSteps}`);
    console.log(`📈 Success Rate: ${((results.passed.length / results.totalSteps) * 100).toFixed(1)}%`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed Steps:');
      results.failed.forEach(fail => console.log(`  - ${fail}`));
    }

    if (results.passed.length > 0) {
      console.log('\n✅ Passed Steps:');
      results.passed.forEach(pass => console.log(`  - ${pass}`));
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
    results.failed.push(`Test suite error: ${error.message}`);
  } finally {
    await browser.close();
  }

  return results;
}

// Run the test suite
if (require.main === module) {
  testOfferToDealWorkflow()
    .then(results => {
      process.exit(results.failed.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testOfferToDealWorkflow };
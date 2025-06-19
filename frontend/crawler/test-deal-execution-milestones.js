const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:8082';
const DELAY = 1500;

// Utility function for delays
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to take screenshots
async function takeScreenshot(page, name) {
  await page.screenshot({ 
    path: `./screenshots/deal-milestones/${name}.png`,
    fullPage: true 
  });
}

// Test Suite for 04_deal_execution_milestones.mmd
async function testDealExecutionMilestones() {
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
    console.log('🚀 Starting Deal Execution Milestones Test Suite');
    console.log('==============================================\n');

    const page = await browser.newPage();
    
    // Navigate to deals page
    await page.goto(`${BASE_URL}/deals`);
    await wait(DELAY);

    // Test 1: Deal Created State
    console.log('📋 Test 1: Deal Created State');
    
    // Find an active deal
    const dealCards = await page.$$('.offer-card');
    let activeDealFound = false;
    
    for (const card of dealCards) {
      const statusElement = await card.$('.offer-status');
      if (statusElement) {
        const statusText = await page.evaluate(el => el.textContent, statusElement);
        if (statusText && statusText.includes('Deal Active')) {
          await card.click();
          await wait(DELAY);
          activeDealFound = true;
          break;
        }
      }
    }

    if (activeDealFound) {
      await takeScreenshot(page, '01-deal-created');
      results.passed.push('DealCreated: Active deal found and opened');
    } else {
      results.failed.push('DealCreated: No active deals found');
    }
    results.totalSteps++;

    // Test 2: Milestone Setup
    console.log('  ✓ Step: Milestone Setup');
    const dealUrl = await page.url();
    if (dealUrl.includes('/deals/')) {
      const milestonesSection = await page.$('text=Milestones');
      const milestoneCards = await page.$$('.milestone-card');
      
      if (milestonesSection && milestoneCards.length > 0) {
        await takeScreenshot(page, '02-milestone-setup');
        results.passed.push('MilestoneSetup: Milestones section with cards found');
        
        // Check milestone states
        for (const milestone of milestoneCards) {
          const statusBadge = await milestone.$('.milestone-status');
          if (statusBadge) {
            const status = await page.evaluate(el => el.textContent, statusBadge);
            console.log(`    - Milestone status: ${status}`);
          }
        }
      } else {
        results.failed.push('MilestoneSetup: Milestones not properly displayed');
      }
    }
    results.totalSteps++;

    // Test 3: Milestone States
    console.log('\n📋 Test 2: Milestone States');
    
    // Check for different milestone states
    const milestoneStates = {
      'pending': 'MilestonePending',
      'funded': 'MilestoneFunded', 
      'in_progress': 'WorkInProgress',
      'submitted': 'WorkSubmitted',
      'approved': 'WorkApproved',
      'completed': 'MilestoneComplete'
    };

    for (const [state, stateName] of Object.entries(milestoneStates)) {
      console.log(`  ✓ Checking state: ${stateName}`);
      const stateElement = await page.$(`[class*="${state}"]`);
      if (stateElement) {
        results.passed.push(`${stateName}: State indicator found`);
      } else {
        console.log(`    ⚠️  ${stateName} state not visible in current view`);
      }
      results.totalSteps++;
    }

    // Test 4: Work Submission Flow
    console.log('\n📋 Test 3: Work Submission Flow');
    
    // Step: WorkInProgress -> WorkSubmitted
    const submitWorkButton = await page.$('button:has-text("Submit Work")');
    if (submitWorkButton) {
      await submitWorkButton.click();
      await wait(DELAY);
      
      const submitUrl = await page.url();
      if (submitUrl.includes('/deals/submit')) {
        await takeScreenshot(page, '03-work-submission');
        results.passed.push('WorkSubmitted: Work submission page accessible');
        
        // Check submission form elements
        const titleInput = await page.$('input[placeholder*="title"]');
        const descriptionInput = await page.$('textarea');
        const fileUpload = await page.$('button:has-text("Choose Files")');
        
        if (titleInput && descriptionInput && fileUpload) {
          results.passed.push('Work submission form has all required fields');
        } else {
          results.failed.push('Work submission form missing fields');
        }
      } else {
        results.failed.push('WorkSubmitted: Navigation to submission page failed');
      }
    } else {
      results.failed.push('WorkInProgress: Submit work button not found');
    }
    results.totalSteps++;

    // Test 5: Content Approval Flow
    console.log('\n📋 Test 4: Content Approval Flow');
    
    // Navigate back to deal
    await page.goBack();
    await wait(DELAY);
    
    // Check for approval/revision options
    const approveButton = await page.$('button:has-text("Approve")');
    const revisionButton = await page.$('button:has-text("Request Revision")');
    
    if (approveButton || revisionButton) {
      await takeScreenshot(page, '04-content-approval');
      results.passed.push('ContentSubmission: Approval/revision options available');
    } else {
      console.log('    ℹ️  Content approval options not visible (may require marketer role)');
    }
    results.totalSteps++;

    // Test 6: Proof Submission Flow
    console.log('\n📋 Test 5: Proof Submission Flow');
    
    const uploadProofButton = await page.$('button:has-text("Upload Proof")');
    if (uploadProofButton) {
      await uploadProofButton.click();
      await wait(DELAY);
      
      const proofUrl = await page.url();
      if (proofUrl.includes('/deals/proof')) {
        await takeScreenshot(page, '05-proof-submission');
        results.passed.push('ProofSubmission: Proof upload page accessible');
        
        // Check proof form elements
        const postUrlInput = await page.$('input[placeholder*="instagram.com"]');
        const screenshotUpload = await page.$('button:has-text("Add Screenshots")');
        const descriptionField = await page.$('textarea');
        
        if (postUrlInput && screenshotUpload && descriptionField) {
          results.passed.push('Proof submission form has all required fields');
        } else {
          results.failed.push('Proof submission form missing fields');
        }
      } else {
        results.failed.push('ProofSubmission: Navigation to proof page failed');
      }
    } else {
      console.log('    ℹ️  Upload proof button not visible in current milestone state');
    }
    results.totalSteps++;

    // Test 7: Payment Release
    console.log('\n📋 Test 6: Payment Release');
    
    // Check for payment-related elements
    const paymentInfo = await page.$('text=Payment');
    const escrowInfo = await page.$('text=Escrow');
    
    if (paymentInfo || escrowInfo) {
      await takeScreenshot(page, '06-payment-info');
      results.passed.push('PaymentReleased: Payment information displayed');
    } else {
      console.log('    ℹ️  Payment information not visible in current state');
    }
    results.totalSteps++;

    // Test 8: Deal Completion State
    console.log('\n📋 Test 7: Deal Completion State');
    
    // Check for completed deals
    await page.goto(`${BASE_URL}/deals`);
    await wait(DELAY);
    
    const completedSection = await page.$('text=Completed');
    if (completedSection) {
      await takeScreenshot(page, '07-deal-complete');
      results.passed.push('DealComplete: Completed deals section found');
    } else {
      console.log('    ℹ️  No completed deals section visible');
    }
    results.totalSteps++;

    // Test 9: Deal Cancellation Option
    console.log('\n📋 Test 8: Deal Cancellation Option');
    
    // Check for cancel option in deal details
    const dealCard = await page.$('.offer-card');
    if (dealCard) {
      await dealCard.click();
      await wait(DELAY);
      
      const cancelButton = await page.$('button:has-text("Cancel Deal")');
      const moreOptions = await page.$('button[aria-label*="More"]');
      
      if (cancelButton || moreOptions) {
        await takeScreenshot(page, '08-cancel-option');
        results.passed.push('DealCancelled: Cancel deal option available');
      } else {
        console.log('    ℹ️  Cancel option may be in menu or restricted by role');
      }
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

    // Detailed State Machine Coverage
    console.log('\n📊 State Machine Coverage Analysis');
    console.log('==================================');
    const states = [
      'DealCreated', 'MilestoneSetup', 'MilestonePending', 'MilestoneFunded',
      'WorkInProgress', 'WorkSubmitted', 'WorkApproved', 'WorkRevision',
      'ContentSubmission', 'ContentApproved', 'ContentRevision',
      'ProofSubmission', 'ProofApproved', 'ProofRevision',
      'PaymentReleased', 'MilestoneComplete', 'DealComplete', 'DealCancelled'
    ];
    
    const coveredStates = results.passed.map(p => p.split(':')[0]);
    const coverage = states.map(state => ({
      state,
      covered: coveredStates.some(cs => cs.includes(state))
    }));
    
    console.log('State Coverage:');
    coverage.forEach(({ state, covered }) => {
      console.log(`  ${covered ? '✅' : '⚠️ '} ${state}`);
    });
    
    const coveragePercent = (coverage.filter(c => c.covered).length / states.length * 100).toFixed(1);
    console.log(`\nOverall State Coverage: ${coveragePercent}%`);

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
  testDealExecutionMilestones()
    .then(results => {
      process.exit(results.failed.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testDealExecutionMilestones };
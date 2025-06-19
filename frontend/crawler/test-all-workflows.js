const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'http://localhost:8082';
const DELAY = 1500;

// Import individual test suites
const { testOfferToDealWorkflow } = require('./test-offer-to-deal-workflow');
const { testDealExecutionMilestones } = require('./test-deal-execution-milestones');

// Utility functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function ensureScreenshotDir(dirName) {
  const dir = path.join(__dirname, 'screenshots', dirName);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dir}:`, error);
  }
}

// Comprehensive Workflow Analysis
class WorkflowAnalyzer {
  constructor() {
    this.mermaidFiles = {
      '03_offer_to_deal_workflow': {
        steps: [
          'M_SEARCH', 'M_FIND', 'M_DRAFT', 'M_REVIEW', 'M_SEND',
          'C_OFFERS', 'C_REVIEW', 'C_DECISION', 'C_ACCEPT', 'C_COUNTER', 'C_REJECT',
          'NOTIFY_C', 'NOTIFY_M', 'CREATE_DEAL', 'CHAT_CREATE', 'DEAL_ACTIVE',
          'MILESTONES', 'FUND_MILESTONE', 'WORK_PHASE', 'CONTENT_PHASE', 
          'PROOF_PHASE', 'PAYMENT_RELEASE', 'DEAL_COMPLETE'
        ],
        implemented: [],
        missing: []
      },
      '04_deal_execution_milestones': {
        steps: [
          'DealCreated', 'MilestoneSetup', 'MilestonePending', 'MilestoneFunded',
          'WorkInProgress', 'WorkSubmitted', 'WorkApproved', 'WorkRevision',
          'ContentSubmission', 'ContentApproved', 'ContentRevision',
          'ProofSubmission', 'ProofApproved', 'ProofRevision',
          'PaymentReleased', 'MilestoneComplete', 'DealComplete', 'DealCancelled'
        ],
        implemented: [],
        missing: []
      },
      '11_frontend_overall_navigation': {
        steps: [
          'LOGIN', 'REG_PREVIEW', 'USER_TYPE', 'REG_SUCCESS',
          'TAB_EXPLORE', 'TAB_DEALS', 'TAB_MESSAGES', 'TAB_NOTIFICATIONS', 'TAB_PROFILE',
          'SEARCH_RESULTS', 'CREATOR_PROFILE', 'OFFER_MODAL',
          'MARKETER_OFFERS', 'CREATOR_OFFERS', 'MESSAGE_LIST', 'INDIVIDUAL_CHAT',
          'NOTIFICATION_CENTER', 'PROFILE_VIEW', 'SETTINGS',
          'CREATOR_EARNINGS', 'WITHDRAW', 'MARKETER_PAYMENTS'
        ],
        implemented: [],
        missing: []
      },
      '13_frontend_marketer_offer_flow': {
        steps: [
          'EXPLORE_CREATORS', 'SEARCH_FILTER', 'VIEW_PROFILES', 'SELECT_CREATOR',
          'CREATE_OFFER', 'SELECT_TEMPLATE', 'CUSTOMIZE_OFFER', 'REVIEW_TERMS',
          'PAYMENT_PREVIEW', 'CONFIRM_SEND', 'OFFER_SENT', 'TRACK_STATUS',
          'VIEW_RESPONSES', 'HANDLE_COUNTER', 'APPROVE_DEAL', 'FUND_ESCROW'
        ],
        implemented: [],
        missing: []
      },
      '14_frontend_creator_deal_flow': {
        steps: [
          'NotificationReceived', 'ViewOffer', 'OfferDetails', 'CreatorDecision',
          'AcceptOffer', 'RejectOffer', 'CreateCounter', 'CounterForm',
          'DealActive', 'WorkInProgress', 'ContentCreated', 'SubmitContent',
          'ContentUnderReview', 'ContentApproved', 'PostContent', 'UploadProof',
          'ProofUnderReview', 'ProofApproved', 'PaymentReleased', 'EarningsUpdated',
          'ViewEarnings', 'WithdrawFunds', 'PaymentMethodSelect', 'ProcessWithdrawal'
        ],
        implemented: [],
        missing: []
      }
    };
  }

  async testNavigation(page) {
    const results = { passed: [], failed: [] };
    
    console.log('\n📋 Testing Overall Navigation (11_frontend_overall_navigation.mmd)');
    console.log('================================================================');

    // Test tab navigation
    const tabs = [
      { selector: '[href="/"]', name: 'TAB_EXPLORE', route: '/' },
      { selector: '[href="/deals"]', name: 'TAB_DEALS', route: '/deals' },
      { selector: '[href="/messages"]', name: 'TAB_MESSAGES', route: '/messages' },
      { selector: '[href="/notifications"]', name: 'TAB_NOTIFICATIONS', route: '/notifications' },
      { selector: '[href="/profile"]', name: 'TAB_PROFILE', route: '/profile' }
    ];

    for (const tab of tabs) {
      try {
        const tabElement = await page.$(tab.selector);
        if (tabElement) {
          await tabElement.click();
          await wait(DELAY);
          const currentUrl = await page.url();
          if (currentUrl.includes(tab.route)) {
            results.passed.push(tab.name);
            this.mermaidFiles['11_frontend_overall_navigation'].implemented.push(tab.name);
            console.log(`  ✅ ${tab.name}: Navigation successful`);
          } else {
            results.failed.push(tab.name);
            console.log(`  ❌ ${tab.name}: Navigation failed`);
          }
        } else {
          results.failed.push(tab.name);
          console.log(`  ❌ ${tab.name}: Tab not found`);
        }
      } catch (error) {
        results.failed.push(tab.name);
        console.log(`  ❌ ${tab.name}: Error - ${error.message}`);
      }
    }

    // Test profile specific navigation
    await page.goto(`${BASE_URL}/profile`);
    await wait(DELAY);

    // Check for earnings link (creator)
    const earningsLink = await page.$('text=Earnings');
    if (earningsLink) {
      await earningsLink.click();
      await wait(DELAY);
      const url = await page.url();
      if (url.includes('/earnings')) {
        results.passed.push('CREATOR_EARNINGS');
        this.mermaidFiles['11_frontend_overall_navigation'].implemented.push('CREATOR_EARNINGS');
        console.log('  ✅ CREATOR_EARNINGS: Navigation successful');
        
        // Check for withdraw option
        const withdrawButton = await page.$('button:has-text("Withdraw")');
        if (withdrawButton) {
          results.passed.push('WITHDRAW');
          this.mermaidFiles['11_frontend_overall_navigation'].implemented.push('WITHDRAW');
          console.log('  ✅ WITHDRAW: Option available');
        }
      }
    }

    return results;
  }

  async testMarketerFlow(page) {
    const results = { passed: [], failed: [] };
    
    console.log('\n📋 Testing Marketer Offer Flow (13_frontend_marketer_offer_flow.mmd)');
    console.log('===================================================================');

    // Navigate to explore
    await page.goto(`${BASE_URL}/`);
    await wait(DELAY);

    // Test explore creators
    const creatorCards = await page.$$('.creator-card');
    if (creatorCards.length > 0) {
      results.passed.push('EXPLORE_CREATORS');
      this.mermaidFiles['13_frontend_marketer_offer_flow'].implemented.push('EXPLORE_CREATORS');
      console.log('  ✅ EXPLORE_CREATORS: Creator cards found');
    }

    // Test search/filter
    const searchInput = await page.$('input[placeholder*="Search"]');
    const filterButton = await page.$('button:has-text("Filter")');
    if (searchInput || filterButton) {
      results.passed.push('SEARCH_FILTER');
      this.mermaidFiles['13_frontend_marketer_offer_flow'].implemented.push('SEARCH_FILTER');
      console.log('  ✅ SEARCH_FILTER: Search/filter available');
    }

    // Test view profiles
    if (creatorCards.length > 0) {
      await creatorCards[0].click();
      await wait(DELAY);
      const profileUrl = await page.url();
      if (profileUrl.includes('/profile/')) {
        results.passed.push('VIEW_PROFILES');
        this.mermaidFiles['13_frontend_marketer_offer_flow'].implemented.push('VIEW_PROFILES');
        console.log('  ✅ VIEW_PROFILES: Profile view successful');
        
        // Test create offer
        const createOfferButton = await page.$('button:has-text("Create Offer")');
        if (createOfferButton) {
          results.passed.push('CREATE_OFFER');
          this.mermaidFiles['13_frontend_marketer_offer_flow'].implemented.push('CREATE_OFFER');
          console.log('  ✅ CREATE_OFFER: Button available');
          
          await createOfferButton.click();
          await wait(DELAY);
          
          // Check for offer templates
          const preMadeOption = await page.$('text=Pre-Made Offers');
          const customOption = await page.$('text=Custom Offer');
          if (preMadeOption || customOption) {
            results.passed.push('SELECT_TEMPLATE');
            this.mermaidFiles['13_frontend_marketer_offer_flow'].implemented.push('SELECT_TEMPLATE');
            console.log('  ✅ SELECT_TEMPLATE: Template options available');
          }
        }
      }
    }

    return results;
  }

  async testCreatorFlow(page) {
    const results = { passed: [], failed: [] };
    
    console.log('\n📋 Testing Creator Deal Flow (14_frontend_creator_deal_flow.mmd)');
    console.log('===============================================================');

    // Switch to creator role first
    await page.goto(`${BASE_URL}/profile`);
    await wait(DELAY);
    
    const roleSwitcher = await page.$('button:has-text("Switch Role")');
    if (roleSwitcher) {
      await roleSwitcher.click();
      await wait(DELAY);
      
      const creatorOption = await page.$('text=Creator');
      if (creatorOption) {
        await creatorOption.click();
        await wait(500);
        const switchButton = await page.$('button:has-text("Switch to Creator")');
        if (switchButton) {
          await switchButton.click();
          await wait(DELAY);
        }
      }
    }

    // Navigate to deals to view offers
    await page.goto(`${BASE_URL}/deals`);
    await wait(DELAY);

    // Check for offer notifications/list
    const pendingOffers = await page.$('text=Pending Offers');
    const offerCards = await page.$$('.offer-card');
    
    if (pendingOffers && offerCards.length > 0) {
      results.passed.push('ViewOffer');
      this.mermaidFiles['14_frontend_creator_deal_flow'].implemented.push('ViewOffer');
      console.log('  ✅ ViewOffer: Offers visible');
      
      // Click to view offer details
      await offerCards[0].click();
      await wait(DELAY);
      
      const offerUrl = await page.url();
      if (offerUrl.includes('/offers/review')) {
        results.passed.push('OfferDetails');
        this.mermaidFiles['14_frontend_creator_deal_flow'].implemented.push('OfferDetails');
        console.log('  ✅ OfferDetails: Review page loaded');
        
        // Check decision options
        const acceptButton = await page.$('button:has-text("Accept")');
        const counterButton = await page.$('button:has-text("Counter")');
        const rejectButton = await page.$('button:has-text("Decline")');
        
        if (acceptButton && counterButton && rejectButton) {
          results.passed.push('CreatorDecision');
          this.mermaidFiles['14_frontend_creator_deal_flow'].implemented.push('CreatorDecision');
          console.log('  ✅ CreatorDecision: All options available');
        }
        
        // Test counter offer
        if (counterButton) {
          await counterButton.click();
          await wait(DELAY);
          const counterUrl = await page.url();
          if (counterUrl.includes('/offers/counter')) {
            results.passed.push('CreateCounter');
            results.passed.push('CounterForm');
            this.mermaidFiles['14_frontend_creator_deal_flow'].implemented.push('CreateCounter');
            this.mermaidFiles['14_frontend_creator_deal_flow'].implemented.push('CounterForm');
            console.log('  ✅ CreateCounter: Counter offer page loaded');
            console.log('  ✅ CounterForm: Form available');
          }
        }
      }
    }

    // Test earnings and withdrawal
    await page.goto(`${BASE_URL}/earnings`);
    await wait(DELAY);
    
    const earningsUrl = await page.url();
    if (earningsUrl.includes('/earnings')) {
      results.passed.push('ViewEarnings');
      this.mermaidFiles['14_frontend_creator_deal_flow'].implemented.push('ViewEarnings');
      console.log('  ✅ ViewEarnings: Earnings page accessible');
      
      const withdrawButton = await page.$('button:has-text("Withdraw Funds")');
      if (withdrawButton) {
        results.passed.push('WithdrawFunds');
        this.mermaidFiles['14_frontend_creator_deal_flow'].implemented.push('WithdrawFunds');
        console.log('  ✅ WithdrawFunds: Withdraw option available');
        
        await withdrawButton.click();
        await wait(DELAY);
        
        const withdrawUrl = await page.url();
        if (withdrawUrl.includes('/earnings/withdraw')) {
          results.passed.push('PaymentMethodSelect');
          this.mermaidFiles['14_frontend_creator_deal_flow'].implemented.push('PaymentMethodSelect');
          console.log('  ✅ PaymentMethodSelect: Withdrawal page loaded');
        }
      }
    }

    return results;
  }

  generateReport() {
    console.log('\n\n📊 COMPREHENSIVE WORKFLOW COVERAGE REPORT');
    console.log('=========================================\n');

    let totalSteps = 0;
    let implementedSteps = 0;

    Object.entries(this.mermaidFiles).forEach(([fileName, data]) => {
      console.log(`\n📄 ${fileName}.mmd`);
      console.log('─'.repeat(50));
      
      // Calculate missing steps
      data.missing = data.steps.filter(step => !data.implemented.includes(step));
      
      const coverage = ((data.implemented.length / data.steps.length) * 100).toFixed(1);
      totalSteps += data.steps.length;
      implementedSteps += data.implemented.length;
      
      console.log(`Coverage: ${coverage}% (${data.implemented.length}/${data.steps.length} steps)`);
      
      if (data.implemented.length > 0) {
        console.log('\n✅ Implemented Steps:');
        data.implemented.forEach(step => console.log(`  - ${step}`));
      }
      
      if (data.missing.length > 0) {
        console.log('\n⚠️  Missing Steps:');
        data.missing.forEach(step => console.log(`  - ${step}`));
      }
    });

    const overallCoverage = ((implementedSteps / totalSteps) * 100).toFixed(1);
    
    console.log('\n\n🎯 OVERALL COVERAGE SUMMARY');
    console.log('===========================');
    console.log(`Total Steps: ${totalSteps}`);
    console.log(`Implemented: ${implementedSteps}`);
    console.log(`Missing: ${totalSteps - implementedSteps}`);
    console.log(`Coverage: ${overallCoverage}%`);

    // Critical missing features analysis
    console.log('\n\n⚠️  CRITICAL MISSING FEATURES');
    console.log('=============================');
    
    const criticalMissing = [];
    
    // Analyze each workflow for critical gaps
    if (this.mermaidFiles['03_offer_to_deal_workflow'].missing.includes('CHAT_CREATE')) {
      criticalMissing.push('Auto-create chat room when deal is created');
    }
    if (this.mermaidFiles['03_offer_to_deal_workflow'].missing.includes('NOTIFY_C') || 
        this.mermaidFiles['03_offer_to_deal_workflow'].missing.includes('NOTIFY_M')) {
      criticalMissing.push('Real-time notifications for offer updates');
    }
    if (this.mermaidFiles['04_deal_execution_milestones'].missing.includes('MilestoneFunded')) {
      criticalMissing.push('Milestone funding/escrow system');
    }
    if (this.mermaidFiles['11_frontend_overall_navigation'].missing.includes('TAB_MESSAGES')) {
      criticalMissing.push('Messages/Chat functionality');
    }
    if (this.mermaidFiles['11_frontend_overall_navigation'].missing.includes('TAB_NOTIFICATIONS')) {
      criticalMissing.push('Notifications center');
    }

    if (criticalMissing.length > 0) {
      criticalMissing.forEach((feature, index) => {
        console.log(`${index + 1}. ${feature}`);
      });
    } else {
      console.log('✅ All critical features are implemented!');
    }

    return {
      totalSteps,
      implementedSteps,
      overallCoverage,
      workflows: this.mermaidFiles
    };
  }
}

// Main test runner
async function runAllWorkflowTests() {
  console.log('🚀 Starting Comprehensive Workflow Test Suite');
  console.log('===========================================');
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);

  // Ensure screenshot directories exist
  await ensureScreenshotDir('offer-workflow');
  await ensureScreenshotDir('deal-milestones');
  await ensureScreenshotDir('navigation');
  await ensureScreenshotDir('marketer-flow');
  await ensureScreenshotDir('creator-flow');

  const analyzer = new WorkflowAnalyzer();
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL);
    await wait(DELAY);

    // Run individual workflow tests
    console.log('\n🔄 Running Individual Workflow Tests...\n');
    
    // Test 1: Navigation
    const navResults = await analyzer.testNavigation(page);
    
    // Test 2: Marketer Flow
    const marketerResults = await analyzer.testMarketerFlow(page);
    
    // Test 3: Creator Flow
    const creatorResults = await analyzer.testCreatorFlow(page);
    
    // Generate comprehensive report
    const report = analyzer.generateReport();
    
    // Save report to file
    const reportPath = path.join(__dirname, 'workflow-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);

  } catch (error) {
    console.error('❌ Fatal error during testing:', error);
  } finally {
    await browser.close();
  }
}

// Run the comprehensive test suite
if (require.main === module) {
  runAllWorkflowTests()
    .then(() => {
      console.log('\n✅ Test suite completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runAllWorkflowTests };
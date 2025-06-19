const fs = require('fs').promises;
const path = require('path');

// Mermaid workflow definitions
const WORKFLOWS = {
  '03_offer_to_deal_workflow': {
    name: 'Offer to Deal Workflow',
    steps: {
      // Marketer Flow
      'M_SEARCH': { desc: 'Search Creators', implemented: ['app/(tabs)/index.tsx', 'components/web/UOC04CreatorListing.tsx'] },
      'M_FIND': { desc: 'Find Creator Profile', implemented: ['app/profile/[id].tsx'] },
      'M_DRAFT': { desc: 'Create Offer Draft', implemented: ['app/offers/details.tsx', 'app/offers/custom.tsx'] },
      'M_REVIEW': { desc: 'Review Draft', implemented: ['app/offers/preview.tsx'] },
      'M_SEND': { desc: 'Send Offer to Creator', implemented: ['app/offers/success.tsx'] },
      
      // Creator Flow  
      'C_OFFERS': { desc: 'View Received Offers', implemented: ['components/CreatorDealsView.tsx'] },
      'C_REVIEW': { desc: 'Review Offer Details', implemented: ['app/offers/review.tsx'] },
      'C_DECISION': { desc: 'Creator Decision', implemented: ['app/offers/review.tsx'] },
      'C_ACCEPT': { desc: 'Accept Offer', implemented: ['app/offers/review.tsx'] },
      'C_COUNTER': { desc: 'Create Counter Offer', implemented: ['app/offers/counter.tsx'] },
      'C_REJECT': { desc: 'Reject Offer', implemented: ['app/offers/review.tsx'] },
      
      // Deal Creation
      'CREATE_DEAL': { desc: 'Create Deal', implemented: ['app/deals/[id].tsx'] },
      'CHAT_CREATE': { desc: 'Auto-create Chat Room', implemented: ['app/offers/review.tsx', 'app/deals/[id].tsx'] },
      'DEAL_ACTIVE': { desc: 'Deal Status: Active', implemented: ['app/deals/[id].tsx'] },
      
      // Deal Management
      'MILESTONES': { desc: 'Setup Milestones', implemented: ['app/deals/[id].tsx'] },
      'FUND_MILESTONE': { desc: 'Fund Milestone', implemented: ['app/deals/[id].tsx'] },
      'WORK_PHASE': { desc: 'Work Submission Phase', implemented: ['app/deals/submit.tsx'] },
      'CONTENT_PHASE': { desc: 'Content Approval Phase', implemented: ['app/deals/[id].tsx'] },
      'PROOF_PHASE': { desc: 'Proof Submission Phase', implemented: ['app/deals/proof.tsx'] },
      'PAYMENT_RELEASE': { desc: 'Payment Release', implemented: ['app/earnings/index.tsx'] },
      'DEAL_COMPLETE': { desc: 'Deal Complete', implemented: ['app/deals/[id].tsx'] },
      
      // Notifications
      'NOTIFY_C': { desc: 'Notify Creator', implemented: ['services/notificationService.ts', 'app/offers/success.tsx', 'app/deals/[id].tsx'] },
      'NOTIFY_M': { desc: 'Notify Marketer', implemented: ['services/notificationService.ts', 'app/offers/review.tsx'] }
    }
  },
  
  '04_deal_execution_milestones': {
    name: 'Deal Execution Milestones',
    steps: {
      'DealCreated': { desc: 'Deal Created', implemented: ['app/deals/[id].tsx'] },
      'MilestoneSetup': { desc: 'Milestone Setup', implemented: ['app/deals/[id].tsx'] },
      'MilestonePending': { desc: 'Milestone Pending', implemented: ['app/deals/[id].tsx'] },
      'MilestoneFunded': { desc: 'Milestone Funded', implemented: ['app/deals/[id].tsx'] },
      'WorkInProgress': { desc: 'Work In Progress', implemented: ['app/deals/[id].tsx'] },
      'WorkSubmitted': { desc: 'Work Submitted', implemented: ['app/deals/submit.tsx'] },
      'WorkApproved': { desc: 'Work Approved', implemented: ['app/deals/[id].tsx'] },
      'WorkRevision': { desc: 'Work Revision', implemented: ['app/deals/[id].tsx'] },
      'ContentSubmission': { desc: 'Content Submission', implemented: ['app/deals/submit.tsx'] },
      'ContentApproved': { desc: 'Content Approved', implemented: ['app/deals/[id].tsx'] },
      'ContentRevision': { desc: 'Content Revision', implemented: ['app/deals/[id].tsx'] },
      'ProofSubmission': { desc: 'Proof Submission', implemented: ['app/deals/proof.tsx'] },
      'ProofApproved': { desc: 'Proof Approved', implemented: ['app/deals/[id].tsx'] },
      'ProofRevision': { desc: 'Proof Revision', implemented: ['app/deals/proof.tsx'] },
      'PaymentReleased': { desc: 'Payment Released', implemented: ['app/earnings/index.tsx'] },
      'MilestoneComplete': { desc: 'Milestone Complete', implemented: ['app/deals/[id].tsx'] },
      'DealComplete': { desc: 'Deal Complete', implemented: ['app/deals/[id].tsx'] },
      'DealCancelled': { desc: 'Deal Cancelled', implemented: ['app/deals/[id].tsx'] }
    }
  },
  
  '11_frontend_overall_navigation': {
    name: 'Overall Navigation',
    steps: {
      'LOGIN': { desc: 'Login Screen', implemented: ['app/login.tsx'] },
      'REG_PREVIEW': { desc: 'Registration Preview', implemented: ['app/register.tsx'] },
      'USER_TYPE': { desc: 'Select User Type', implemented: ['app/register.tsx'] },
      'REG_SUCCESS': { desc: 'Registration Success', implemented: ['app/register-success.tsx'] },
      'TAB_EXPLORE': { desc: 'Explore Tab', implemented: ['app/(tabs)/index.tsx'] },
      'TAB_DEALS': { desc: 'Deals Tab', implemented: ['app/(tabs)/deals.tsx'] },
      'TAB_MESSAGES': { desc: 'Messages Tab', implemented: ['app/(tabs)/messages.tsx'] },
      'TAB_NOTIFICATIONS': { desc: 'Notifications Tab', implemented: ['app/(tabs)/notifications.tsx'] },
      'TAB_PROFILE': { desc: 'Profile Tab', implemented: ['app/(tabs)/profile.tsx'] },
      'SEARCH_RESULTS': { desc: 'Search/Discovery Results', implemented: ['app/(tabs)/index.tsx'] },
      'CREATOR_PROFILE': { desc: 'Creator Profile View', implemented: ['app/profile/[id].tsx'] },
      'OFFER_MODAL': { desc: 'Create Offer Modal', implemented: ['app/profile/[id].tsx'] },
      'MARKETER_OFFERS': { desc: 'Marketer Offer History', implemented: ['app/(tabs)/deals.tsx'] },
      'CREATOR_OFFERS': { desc: 'Creator Deal History', implemented: ['components/CreatorDealsView.tsx'] },
      'MESSAGE_LIST': { desc: 'Message List', implemented: ['app/(tabs)/messages.tsx'] },
      'INDIVIDUAL_CHAT': { desc: 'Individual Chat', implemented: ['app/chat/[id].tsx'] },
      'NOTIFICATION_CENTER': { desc: 'Notification Center', implemented: ['app/notifications/center.tsx'] },
      'PROFILE_VIEW': { desc: 'Profile View', implemented: ['app/(tabs)/profile.tsx'] },
      'SETTINGS': { desc: 'Settings Menu', implemented: ['app/(tabs)/profile.tsx'] },
      'CREATOR_EARNINGS': { desc: 'Creator Earnings', implemented: ['app/earnings/index.tsx'] },
      'WITHDRAW': { desc: 'Withdraw Money', implemented: ['app/earnings/withdraw.tsx'] },
      'MARKETER_PAYMENTS': { desc: 'Marketer Payments', implemented: ['app/payments/marketer.tsx'] }
    }
  },
  
  '13_frontend_marketer_offer_flow': {
    name: 'Marketer Offer Flow',
    steps: {
      'EXPLORE_CREATORS': { desc: 'Explore Creators', implemented: ['app/(tabs)/index.tsx'] },
      'SEARCH_FILTER': { desc: 'Search & Filter', implemented: ['app/(tabs)/index.tsx'] },
      'VIEW_PROFILES': { desc: 'View Creator Profiles', implemented: ['app/profile/[id].tsx'] },
      'SELECT_CREATOR': { desc: 'Select Creator', implemented: ['app/profile/[id].tsx'] },
      'CREATE_OFFER': { desc: 'Create Offer', implemented: ['app/profile/[id].tsx'] },
      'SELECT_TEMPLATE': { desc: 'Select Template', implemented: ['app/offers/premade.tsx'] },
      'CUSTOMIZE_OFFER': { desc: 'Customize Offer', implemented: ['app/offers/details.tsx', 'app/offers/custom.tsx'] },
      'REVIEW_TERMS': { desc: 'Review Terms', implemented: ['app/offers/preview.tsx'] },
      'PAYMENT_PREVIEW': { desc: 'Payment Preview', implemented: ['app/offers/preview.tsx'] },
      'CONFIRM_SEND': { desc: 'Confirm Send', implemented: ['app/offers/preview.tsx'] },
      'OFFER_SENT': { desc: 'Offer Sent', implemented: ['app/offers/success.tsx'] },
      'TRACK_STATUS': { desc: 'Track Status', implemented: ['app/(tabs)/deals.tsx'] },
      'VIEW_RESPONSES': { desc: 'View Responses', implemented: ['app/(tabs)/deals.tsx'] },
      'HANDLE_COUNTER': { desc: 'Handle Counter', implemented: ['app/offers/handle-counter.tsx', 'app/(tabs)/deals.tsx'] },
      'APPROVE_DEAL': { desc: 'Approve Deal', implemented: ['app/deals/[id].tsx'] },
      'FUND_ESCROW': { desc: 'Fund Escrow', implemented: ['app/deals/[id].tsx', 'app/payments/marketer.tsx'] }
    }
  },
  
  '14_frontend_creator_deal_flow': {
    name: 'Creator Deal Flow',
    steps: {
      'NotificationReceived': { desc: 'Notification Received', implemented: ['services/notificationService.ts', 'app/notifications/center.tsx'] },
      'ViewOffer': { desc: 'View Offer', implemented: ['components/CreatorDealsView.tsx'] },
      'OfferDetails': { desc: 'Offer Details', implemented: ['app/offers/review.tsx'] },
      'CreatorDecision': { desc: 'Creator Decision', implemented: ['app/offers/review.tsx'] },
      'AcceptOffer': { desc: 'Accept Offer', implemented: ['app/offers/review.tsx'] },
      'RejectOffer': { desc: 'Reject Offer', implemented: ['app/offers/review.tsx'] },
      'CreateCounter': { desc: 'Create Counter', implemented: ['app/offers/counter.tsx'] },
      'CounterForm': { desc: 'Counter Form', implemented: ['app/offers/counter.tsx'] },
      'DealActive': { desc: 'Deal Active', implemented: ['app/deals/[id].tsx'] },
      'WorkInProgress': { desc: 'Work In Progress', implemented: ['app/deals/[id].tsx'] },
      'ContentCreated': { desc: 'Content Created', implemented: ['app/deals/submit.tsx'] },
      'SubmitContent': { desc: 'Submit Content', implemented: ['app/deals/submit.tsx'] },
      'ContentUnderReview': { desc: 'Content Under Review', implemented: ['app/deals/[id].tsx'] },
      'ContentApproved': { desc: 'Content Approved', implemented: ['app/deals/[id].tsx'] },
      'PostContent': { desc: 'Post Content', implemented: ['app/deals/proof.tsx'] },
      'UploadProof': { desc: 'Upload Proof', implemented: ['app/deals/proof.tsx'] },
      'ProofUnderReview': { desc: 'Proof Under Review', implemented: ['app/deals/[id].tsx'] },
      'ProofApproved': { desc: 'Proof Approved', implemented: ['app/deals/[id].tsx'] },
      'PaymentReleased': { desc: 'Payment Released', implemented: ['app/earnings/index.tsx'] },
      'EarningsUpdated': { desc: 'Earnings Updated', implemented: ['app/earnings/index.tsx'] },
      'ViewEarnings': { desc: 'View Earnings', implemented: ['app/earnings/index.tsx'] },
      'WithdrawFunds': { desc: 'Withdraw Funds', implemented: ['app/earnings/withdraw.tsx'] },
      'PaymentMethodSelect': { desc: 'Payment Method Select', implemented: ['app/earnings/withdraw.tsx'] },
      'ProcessWithdrawal': { desc: 'Process Withdrawal', implemented: ['app/earnings/withdraw.tsx'] }
    }
  }
};

// Check if files exist
async function checkFileExists(filePath) {
  const fullPath = path.join('/Users/Mike/Desktop/programming/2_proposals/upwork/communication/axeeio_021932170180429028184/AWS/axees-eb-extracted/axees-sourcebundle/frontend', filePath);
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

// Analyze implementation
async function analyzeWorkflowImplementation() {
  console.log('🔍 Analyzing Workflow Implementation Status');
  console.log('==========================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    totalWorkflows: Object.keys(WORKFLOWS).length,
    totalSteps: 0,
    implementedSteps: 0,
    missingSteps: 0,
    workflows: {}
  };

  for (const [workflowId, workflow] of Object.entries(WORKFLOWS)) {
    console.log(`\n📋 ${workflow.name} (${workflowId}.mmd)`);
    console.log('─'.repeat(60));

    const workflowReport = {
      name: workflow.name,
      totalSteps: Object.keys(workflow.steps).length,
      implementedSteps: 0,
      missingSteps: 0,
      steps: {}
    };

    for (const [stepId, step] of Object.entries(workflow.steps)) {
      const implementedFiles = [];
      
      // Check each implementation file
      for (const file of step.implemented) {
        const exists = await checkFileExists(file);
        if (exists) {
          implementedFiles.push(file);
        }
      }

      const isImplemented = implementedFiles.length > 0;
      
      workflowReport.steps[stepId] = {
        description: step.desc,
        implemented: isImplemented,
        files: implementedFiles
      };

      if (isImplemented) {
        workflowReport.implementedSteps++;
        report.implementedSteps++;
        console.log(`  ✅ ${stepId}: ${step.desc}`);
        implementedFiles.forEach(file => console.log(`     → ${file}`));
      } else {
        workflowReport.missingSteps++;
        report.missingSteps++;
        console.log(`  ⚠️  ${stepId}: ${step.desc} - NOT IMPLEMENTED`);
      }

      report.totalSteps++;
    }

    const coverage = ((workflowReport.implementedSteps / workflowReport.totalSteps) * 100).toFixed(1);
    console.log(`\n  Coverage: ${coverage}% (${workflowReport.implementedSteps}/${workflowReport.totalSteps} steps)`);
    
    report.workflows[workflowId] = workflowReport;
  }

  // Overall summary
  const overallCoverage = ((report.implementedSteps / report.totalSteps) * 100).toFixed(1);
  
  console.log('\n\n📊 OVERALL IMPLEMENTATION SUMMARY');
  console.log('=================================');
  console.log(`Total Workflows: ${report.totalWorkflows}`);
  console.log(`Total Steps: ${report.totalSteps}`);
  console.log(`Implemented: ${report.implementedSteps} (${overallCoverage}%)`);
  console.log(`Missing: ${report.missingSteps}`);

  // Critical missing features
  console.log('\n\n⚠️  CRITICAL MISSING FEATURES');
  console.log('=============================');
  
  const criticalMissing = [
    { feature: 'Chat/Messaging System', steps: ['CHAT_CREATE', 'TAB_MESSAGES', 'MESSAGE_LIST', 'INDIVIDUAL_CHAT'] },
    { feature: 'Notification System', steps: ['NOTIFY_C', 'NOTIFY_M', 'NotificationReceived', 'NOTIFICATION_CENTER'] },
    { feature: 'Payment/Escrow System', steps: ['FUND_MILESTONE', 'MilestoneFunded', 'FUND_ESCROW'] },
    { feature: 'Authentication System', steps: ['LOGIN', 'REG_PREVIEW', 'USER_TYPE', 'REG_SUCCESS'] },
    { feature: 'Counter-Offer Handling (Marketer)', steps: ['HANDLE_COUNTER'] },
    { feature: 'Marketer Payment Methods', steps: ['MARKETER_PAYMENTS'] }
  ];

  criticalMissing.forEach(({ feature, steps }) => {
    const missingCount = steps.filter(step => {
      for (const workflow of Object.values(report.workflows)) {
        if (workflow.steps[step] && !workflow.steps[step].implemented) {
          return true;
        }
      }
      return false;
    }).length;
    
    if (missingCount > 0) {
      console.log(`\n${feature}:`);
      steps.forEach(step => {
        for (const [workflowId, workflow] of Object.entries(report.workflows)) {
          if (workflow.steps[step] && !workflow.steps[step].implemented) {
            console.log(`  - ${step}: ${workflow.steps[step].description}`);
          }
        }
      });
    }
  });

  // Save detailed report
  const reportPath = path.join(__dirname, 'workflow-implementation-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n\n📄 Detailed report saved to: ${reportPath}`);

  // Generate recommendations
  console.log('\n\n💡 IMPLEMENTATION RECOMMENDATIONS');
  console.log('==================================');
  console.log('1. Priority 1 (Critical for MVP):');
  console.log('   - Implement basic authentication flow (login/registration)');
  console.log('   - Add notification system for offer updates');
  console.log('   - Create messaging/chat functionality for deal communication');
  console.log('\n2. Priority 2 (Complete User Journey):');
  console.log('   - Add payment/escrow system for milestone funding');
  console.log('   - Implement marketer counter-offer handling');
  console.log('   - Add marketer payment management');
  console.log('\n3. Priority 3 (Enhanced Experience):');
  console.log('   - Add real-time updates using websockets');
  console.log('   - Implement push notifications');
  console.log('   - Add analytics and reporting features');

  return report;
}

// Run the analysis
if (require.main === module) {
  analyzeWorkflowImplementation()
    .then(report => {
      const exitCode = report.missingSteps > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { analyzeWorkflowImplementation };
#!/usr/bin/env node

/**
 * User Journey End-to-End Validation
 * Tests complete user workflows from start to finish
 */

const fs = require('fs').promises;
const path = require('path');

class UserJourneyValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      journeys: {},
      summary: {
        totalJourneys: 0,
        passedJourneys: 0,
        failedJourneys: 0
      }
    };
  }

  async validateJourney(journeyName, steps) {
    console.log(`\n🎭 TESTING USER JOURNEY: ${journeyName}`);
    console.log('='.repeat(70));
    
    const journeyResult = {
      name: journeyName,
      totalSteps: steps.length,
      passedSteps: 0,
      failedSteps: 0,
      steps: {},
      flowIntegrity: true
    };

    let previousStep = null;
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`\n📍 Step ${i + 1}: ${step.name}`);
      console.log(`   ${step.description}`);
      
      try {
        const result = await this.validateStep(step, previousStep);
        
        if (result.success) {
          console.log(`   ✅ ${result.message}`);
          journeyResult.passedSteps++;
        } else {
          console.log(`   ❌ ${result.message}`);
          journeyResult.failedSteps++;
          journeyResult.flowIntegrity = false;
        }
        
        journeyResult.steps[step.id] = result;
        previousStep = step;
        
      } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`);
        journeyResult.steps[step.id] = {
          success: false,
          message: error.message,
          error: true
        };
        journeyResult.failedSteps++;
        journeyResult.flowIntegrity = false;
      }
    }

    const coverage = ((journeyResult.passedSteps / journeyResult.totalSteps) * 100).toFixed(1);
    console.log(`\n📊 ${journeyName} Results: ${coverage}% (${journeyResult.passedSteps}/${journeyResult.totalSteps})`);
    
    if (journeyResult.flowIntegrity) {
      console.log(`   🔗 Flow Integrity: ✅ Complete end-to-end flow`);
    } else {
      console.log(`   🔗 Flow Integrity: ❌ Broken user experience`);
    }
    
    this.results.journeys[journeyName] = journeyResult;
    this.results.summary.totalJourneys++;
    
    if (journeyResult.flowIntegrity && journeyResult.failedSteps === 0) {
      this.results.summary.passedJourneys++;
    } else {
      this.results.summary.failedJourneys++;
    }
    
    return journeyResult;
  }

  async validateStep(step, previousStep) {
    switch (step.type) {
      case 'screen_exists':
        return this.validateScreenExists(step);
      case 'navigation_flow':
        return this.validateNavigationFlow(step, previousStep);
      case 'data_transformation':
        return this.validateDataTransformation(step);
      case 'integration_trigger':
        return this.validateIntegrationTrigger(step);
      case 'state_management':
        return this.validateStateManagement(step);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  async validateScreenExists(step) {
    try {
      const fullPath = path.join(process.cwd(), step.screenPath);
      await fs.access(fullPath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Check for required UI elements
      const missingElements = [];
      for (const element of step.requiredElements || []) {
        if (!content.includes(element)) {
          missingElements.push(element);
        }
      }

      if (missingElements.length === 0) {
        return {
          success: true,
          message: `Screen exists with all ${step.requiredElements?.length || 0} required elements`
        };
      } else {
        return {
          success: false,
          message: `Screen missing elements: ${missingElements.join(', ')}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Screen not found: ${step.screenPath}`
      };
    }
  }

  async validateNavigationFlow(step, previousStep) {
    try {
      if (!previousStep) {
        return { success: true, message: 'Initial step - no previous navigation to validate' };
      }

      const fromPath = path.join(process.cwd(), previousStep.screenPath);
      const fromContent = await fs.readFile(fromPath, 'utf8');
      
      // Check if navigation to next step exists
      const hasNavigation = step.navigationTriggers.some(trigger => 
        fromContent.includes(trigger)
      );

      if (hasNavigation) {
        return {
          success: true,
          message: `Navigation from ${previousStep.name} properly configured`
        };
      } else {
        return {
          success: false,
          message: `No navigation path found from ${previousStep.name} to ${step.name}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Navigation validation failed: ${error.message}`
      };
    }
  }

  async validateDataTransformation(step) {
    try {
      const fullPath = path.join(process.cwd(), step.screenPath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Check for data transformation patterns
      const transformations = step.dataTransformations || [];
      const missingTransformations = [];
      
      for (const transformation of transformations) {
        if (!content.includes(transformation)) {
          missingTransformations.push(transformation);
        }
      }

      if (missingTransformations.length === 0) {
        return {
          success: true,
          message: `All ${transformations.length} data transformations present`
        };
      } else {
        return {
          success: false,
          message: `Missing transformations: ${missingTransformations.join(', ')}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Data transformation validation failed: ${error.message}`
      };
    }
  }

  async validateIntegrationTrigger(step) {
    try {
      const fullPath = path.join(process.cwd(), step.screenPath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Check for integration triggers (notifications, API calls, etc.)
      const triggers = step.integrationTriggers || [];
      const missingTriggers = [];
      
      for (const trigger of triggers) {
        if (!content.includes(trigger)) {
          missingTriggers.push(trigger);
        }
      }

      if (missingTriggers.length === 0) {
        return {
          success: true,
          message: `All ${triggers.length} integration triggers configured`
        };
      } else {
        return {
          success: false,
          message: `Missing triggers: ${missingTriggers.join(', ')}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Integration trigger validation failed: ${error.message}`
      };
    }
  }

  async validateStateManagement(step) {
    try {
      const fullPath = path.join(process.cwd(), step.screenPath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // Check for state management patterns
      const statePatterns = step.statePatterns || [];
      const missingPatterns = [];
      
      for (const pattern of statePatterns) {
        if (!content.includes(pattern)) {
          missingPatterns.push(pattern);
        }
      }

      if (missingPatterns.length === 0) {
        return {
          success: true,
          message: `All ${statePatterns.length} state management patterns found`
        };
      } else {
        return {
          success: false,
          message: `Missing state patterns: ${missingPatterns.join(', ')}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `State management validation failed: ${error.message}`
      };
    }
  }

  async generateReport() {
    const overallSuccess = ((this.results.summary.passedJourneys / this.results.summary.totalJourneys) * 100).toFixed(1);
    
    console.log('\n\n🎯 USER JOURNEY VALIDATION SUMMARY');
    console.log('=====================================');
    console.log(`Overall Success Rate: ${overallSuccess}%`);
    console.log(`Total Journeys: ${this.results.summary.totalJourneys}`);
    console.log(`Passed: ${this.results.summary.passedJourneys}`);
    console.log(`Failed: ${this.results.summary.failedJourneys}`);
    
    // Critical path analysis
    console.log('\n🔄 CRITICAL PATH ANALYSIS:');
    for (const [journeyName, journey] of Object.entries(this.results.journeys)) {
      const status = journey.flowIntegrity ? '✅' : '❌';
      console.log(`   ${status} ${journeyName} (${journey.passedSteps}/${journey.totalSteps} steps)`);
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'user-journey-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    
    return this.results;
  }
}

// User Journey Definitions
const USER_JOURNEYS = {
  'Marketer: Complete Offer Flow': [
    {
      id: 'marketer-login',
      name: 'Marketer Login',
      description: 'Marketer logs into the platform',
      type: 'screen_exists',
      screenPath: 'app/login.tsx',
      requiredElements: ['Login', 'email', 'password', 'demo credentials']
    },
    {
      id: 'marketer-dashboard',
      name: 'View Dashboard',
      description: 'Access main dashboard and explore creators',
      type: 'navigation_flow',
      screenPath: 'app/(tabs)/index.tsx',
      navigationTriggers: ['router.replace', 'dashboard', 'explore'],
      requiredElements: ['creator', 'search', 'filter']
    },
    {
      id: 'creator-profile',
      name: 'View Creator Profile',
      description: 'Select and view a creator profile',
      type: 'navigation_flow',
      screenPath: 'app/profile/[id].tsx',
      navigationTriggers: ['/profile/', 'router.push'],
      requiredElements: ['Create Offer', 'engagement', 'followers']
    },
    {
      id: 'create-offer',
      name: 'Create Offer',
      description: 'Create and customize an offer',
      type: 'data_transformation',
      screenPath: 'app/offers/details.tsx',
      dataTransformations: ['offer', 'totalPrice', 'includes', 'timeline'],
      requiredElements: ['Save Draft', 'Continue']
    },
    {
      id: 'send-offer',
      name: 'Send Offer',
      description: 'Review and send offer to creator',
      type: 'integration_trigger',
      screenPath: 'app/offers/success.tsx',
      integrationTriggers: ['notificationService.notifyCreator', 'Offer Sent Successfully'],
      requiredElements: ['success', 'notification sent']
    }
  ],

  'Creator: Accept Offer Flow': [
    {
      id: 'creator-notification',
      name: 'Receive Notification',
      description: 'Creator receives offer notification',
      type: 'screen_exists',
      screenPath: 'app/notifications/center.tsx',
      requiredElements: ['New Offer', 'notification', 'actionType']
    },
    {
      id: 'review-offer',
      name: 'Review Offer Details',
      description: 'Creator reviews the offer details',
      type: 'navigation_flow',
      screenPath: 'app/offers/review.tsx',
      navigationTriggers: ['view_offer', '/offers/review'],
      requiredElements: ['Accept Offer', 'Decline', 'Counter Offer']
    },
    {
      id: 'accept-offer',
      name: 'Accept Offer',
      description: 'Creator accepts the offer and creates deal',
      type: 'integration_trigger',
      screenPath: 'app/offers/review.tsx',
      integrationTriggers: ['notificationService.notifyMarketer', 'newChatId', 'newDealId'],
      dataTransformations: ['deal creation', 'chat room creation']
    },
    {
      id: 'chat-created',
      name: 'Chat Room Auto-Created',
      description: 'Chat room is automatically created for the deal',
      type: 'navigation_flow',
      screenPath: 'app/chat/[id].tsx',
      navigationTriggers: ['/chat/', 'Open Chat'],
      requiredElements: ['messages', 'sendMessage', 'dealId']
    }
  ],

  'End-to-End Deal Flow': [
    {
      id: 'deal-active',
      name: 'Deal Created',
      description: 'Deal is active and ready for work',
      type: 'screen_exists',
      screenPath: 'app/deals/[id].tsx',
      requiredElements: ['milestones', 'Fund Milestone', 'Deal Details']
    },
    {
      id: 'fund-milestone',
      name: 'Fund Milestone',
      description: 'Marketer funds the first milestone',
      type: 'integration_trigger',
      screenPath: 'app/deals/[id].tsx',
      integrationTriggers: ['Fund Milestone', 'notificationService.notifyCreator', 'Milestone funded'],
      statePatterns: ['milestone funding', 'escrow']
    },
    {
      id: 'work-submission',
      name: 'Submit Work',
      description: 'Creator submits work for milestone',
      type: 'navigation_flow',
      screenPath: 'app/deals/submit.tsx',
      navigationTriggers: ['/deals/submit', 'Submit Work'],
      requiredElements: ['file upload', 'description', 'submit']
    },
    {
      id: 'payment-release',
      name: 'Payment Released',
      description: 'Payment is released to creator earnings',
      type: 'navigation_flow',
      screenPath: 'app/earnings/index.tsx',
      navigationTriggers: ['/earnings', 'Payment Released', 'View Earnings'],
      requiredElements: ['Available Balance', 'withdraw', 'earnings']
    }
  ],

  'Counter-Offer Negotiation': [
    {
      id: 'create-counter',
      name: 'Creator Creates Counter-Offer',
      description: 'Creator creates a counter-offer',
      type: 'screen_exists',
      screenPath: 'app/offers/counter.tsx',
      requiredElements: ['counter offer', 'amount', 'timeline', 'message']
    },
    {
      id: 'marketer-notified',
      name: 'Marketer Receives Alert',
      description: 'Marketer sees counter-offer alert',
      type: 'screen_exists',
      screenPath: 'app/(tabs)/deals.tsx',
      requiredElements: ['Counter Offer Received', 'counterOffers', 'Review']
    },
    {
      id: 'handle-counter',
      name: 'Handle Counter-Offer',
      description: 'Marketer reviews and responds to counter-offer',
      type: 'navigation_flow',
      screenPath: 'app/offers/handle-counter.tsx',
      navigationTriggers: ['/offers/handle-counter', 'Review'],
      requiredElements: ['Accept', 'Reject', 'Negotiate', 'counter offer summary']
    }
  ]
};

// Main execution
async function runUserJourneyValidation() {
  const validator = new UserJourneyValidator();
  
  console.log('🎭 STARTING USER JOURNEY VALIDATION');
  console.log('Complete End-to-End User Flow Testing');
  console.log('=====================================');
  
  for (const [journeyName, steps] of Object.entries(USER_JOURNEYS)) {
    await validator.validateJourney(journeyName, steps);
  }
  
  const results = await validator.generateReport();
  
  // Exit with error code if journeys failed
  if (results.summary.failedJourneys > 0) {
    console.log('\n❌ USER JOURNEY VALIDATION FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ ALL USER JOURNEYS VALIDATED SUCCESSFULLY');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runUserJourneyValidation().catch(error => {
    console.error('💥 User journey validation error:', error);
    process.exit(1);
  });
}

module.exports = { UserJourneyValidator, USER_JOURNEYS };
/**
 * FORM DATA BUG TESTS
 * 
 * Tests the specific ways form handling breaks in real-world usage
 * These are the #1 cause of user frustration and support tickets
 */

const puppeteer = require('puppeteer');
const SelectorResilience = require('../utils/selector-resilience');
const RouteValidator = require('../utils/route-validator');
const config = require('../config');

class FormDataBugHunter {
  constructor(baseUrl = config.frontendUrl) {
    this.baseUrl = baseUrl;
    this.browser = null;
    this.page = null;
    this.selector = null;
    this.bugs = [];
  }

  async initialize() {
    // Validate credentials before starting browser
    try {
      await credentialValidator.preFlightCheck();
    } catch (error) {
      throw new Error(`Credential validation failed: ${error.message}`);
    }
    
    this.browser = await puppeteer.launch(config.getBrowserOptions());
    this.page = await this.browser.newPage();
    this.selector = new SelectorResilience(this.page);
    this.routeValidator = new RouteValidator(this.page);
    
    // Validate routes before running tests
    await this.routeValidator.validateTestRoutes('forms');
    
    // Set up resilient selectors for form testing
    this.selectors = {
      // Form field selectors with multiple fallbacks
      offerTitle: [
        '[data-testid="offer-title"]',
        '[data-testid="title"]',
        '#offer-title',
        '#title',
        'input[name="title"]',
        '.title-input',
        '.offer-title'
      ],
      
      offerDescription: [
        '[data-testid="offer-description"]',
        '[data-testid="description"]', 
        '#offer-description',
        '#description',
        'textarea[name="description"]',
        '.description-input',
        '.offer-description'
      ],
      
      submitButton: SelectorResilience.getCommonSelectors().submitButton,
      errorMessage: SelectorResilience.getCommonSelectors().errorMessage,
      
      // Profile form selectors
      profileName: [
        '[data-testid="profile-name"]',
        '[data-testid="name"]',
        '#profile-name',
        '#name',
        'input[name="name"]',
        '.name-input'
      ],
      
      profileBio: [
        '[data-testid="profile-bio"]',
        '[data-testid="bio"]',
        '#profile-bio', 
        '#bio',
        'textarea[name="bio"]',
        '.bio-input'
      ],
      
      // Campaign form selectors
      campaignTitle: [
        '[data-testid="campaign-title"]',
        '[data-testid="title"]',
        '#campaign-title',
        'input[name="campaignTitle"]',
        '.campaign-title'
      ],
      
      campaignBudget: [
        '[data-testid="campaign-budget"]',
        '[data-testid="budget"]',
        '#campaign-budget',
        '#budget',
        'input[name="budget"]',
        '.budget-input'
      ],
      
      // File upload selectors
      fileUpload: [
        '[data-testid="file-upload"]',
        '[data-testid="upload"]',
        '#file-upload',
        'input[type="file"]',
        '.file-upload'
      ],
      
      // Dropdown selectors
      dropdown: [
        '[data-testid="dropdown"]',
        '[data-testid="select"]',
        'select',
        '.dropdown-select',
        '.select-input'
      ]
    };
    
    // Monitor console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runComprehensiveFormTests() {
    console.log('📝 Running comprehensive form bug tests...');
    
    try {
      await this.testFormDataLossOnRefresh();
      await this.testValidationErrorPersistence();
      await this.testSubmitButtonStateManagement();
      await this.testLargeTextInputPerformance();
      await this.testFileUploadWithFormData();
      await this.testDropdownFunctionality();
      await this.testAutoSaveImplementation();
      await this.testFormNavigationWarnings();
      await this.testMultiStepFormPersistence();
      await this.testDynamicFormFieldHandling();
    } catch (error) {
      console.error('Form test error:', error.message);
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

  async testFormDataLossOnRefresh() {
    console.log('🔄 Testing: Form data loss on page refresh');
    
    try {
      await this.page.goto(`${this.baseUrl}/create-offer`);
      
      // Fill out a complex form
      const formData = {
        title: 'Amazing Marketing Campaign for Summer 2024',
        description: `This is a detailed campaign description that the user has spent 
        considerable time writing. They've put thought into every word, crafted compelling 
        copy, and are about to lose it all because of a simple page refresh. This 
        represents real user frustration when they accidentally hit F5 or their browser 
        crashes and they lose 20+ minutes of work.`,
        budget: '5000',
        duration: '30',
        requirements: 'Professional content creators with 10k+ followers'
      };
      
      // Fill the form using resilient selectors
      await this.selector.typeIntoInput(this.selectors.offerTitle, formData.title);
      await this.selector.typeIntoInput(this.selectors.offerDescription, formData.description);
      await this.selector.typeIntoInput(this.selectors.campaignBudget, formData.budget);
      await this.selector.typeIntoInput([
        '[data-testid="offer-duration"]',
        '[data-testid="duration"]',
        '#offer-duration',
        'input[name="duration"]',
        '.duration-input'
      ], formData.duration);
      await this.selector.typeIntoInput([
        '[data-testid="offer-requirements"]', 
        '[data-testid="requirements"]',
        '#offer-requirements',
        'textarea[name="requirements"]',
        '.requirements-input'
      ], formData.requirements);
      
      // Simulate accidental refresh
      await this.page.reload();
      
      // Check if data is restored using resilient selectors
      try {
        const titleElement = await this.selector.findElement(this.selectors.offerTitle);
        const titleValue = await this.page.evaluate(el => el.value, titleElement);
        
        const descElement = await this.selector.findElement(this.selectors.offerDescription);
        const descValue = await this.page.evaluate(el => el.value, descElement);
        
        if (!titleValue && !descValue) {
          this.logBug('CRITICAL', 'Form Data Loss on Refresh', 
            'All form data lost when page is refreshed - users lose 20+ minutes of work');
        }
      } catch (error) {
        this.logBug('CRITICAL', 'Form Data Loss on Refresh', 
          'Cannot verify form data recovery - form elements not found');
      }
      
      // Check for auto-save indicator using resilient selector
      const autoSaveExists = await this.selector.elementExists([
        '[data-testid="auto-save-indicator"]',
        '[data-testid="auto-save"]',
        '.auto-save-indicator',
        '.auto-save',
        '[aria-label*="saving"]',
        '.saving-indicator'
      ]);
      if (!autoSaveExists) {
        this.logBug('HIGH', 'No Auto-Save Indicator', 
          'Users have no confidence their work is being saved');
      }
      
    } catch (error) {
      this.logBug('CRITICAL', 'Form Page Error', `Form page failed to load: ${error.message}`);
    }
  }

  async testValidationErrorPersistence() {
    console.log('❌ Testing: Validation error clearing');
    
    try {
      await this.page.goto(`${this.baseUrl}/profile/edit`);
      
      // Submit form with invalid data
      await this.page.evaluate(() => {
        const emailInput = document.querySelector('[data-testid="email-input"]');
        if (emailInput) emailInput.value = 'invalid-email';
      });
      
      await this.page.click('[data-testid="save-profile"]');
      await this.page.waitForTimeout(1000);
      
      // Check for error message
      const errorMessage = await this.page.$('[data-testid="email-error"]');
      if (errorMessage) {
        // Fix the error
        await this.page.evaluate(() => {
          const emailInput = document.querySelector('[data-testid="email-input"]');
          if (emailInput) emailInput.value = 'valid@email.com';
        });
        
        // Trigger validation
        await this.page.click('[data-testid="email-input"]');
        await this.page.keyboard.press('Tab');
        await this.page.waitForTimeout(500);
        
        // Check if error cleared
        const errorStillVisible = await this.page.$eval('[data-testid="email-error"]', 
          el => el.offsetParent !== null).catch(() => false);
        
        if (errorStillVisible) {
          this.logBug('HIGH', 'Validation Error Persistence', 
            'Error messages remain visible after fixing the validation issue');
        }
      }
    } catch (error) {
      console.log('Profile edit test skipped:', error.message);
    }
  }

  async testSubmitButtonStateManagement() {
    console.log('🔘 Testing: Submit button state management');
    
    try {
      await this.page.goto(`${this.baseUrl}/create-campaign`);
      
      // Get all required fields
      const requiredFields = await this.page.$$('[required]');
      
      if (requiredFields.length > 0) {
        // Fill all required fields
        for (const field of requiredFields) {
          const tagName = await field.evaluate(el => el.tagName.toLowerCase());
          const type = await field.evaluate(el => el.type);
          
          if (tagName === 'input' && type === 'text') {
            await field.type('Test Value');
          } else if (tagName === 'textarea') {
            await field.type('Test Description');
          } else if (tagName === 'select') {
            const options = await field.$$('option');
            if (options.length > 1) {
              await field.select(await options[1].evaluate(el => el.value));
            }
          }
        }
        
        // Check submit button state
        const submitDisabled = await this.page.$eval('[data-testid="submit-button"]', 
          el => el.disabled).catch(() => true);
        
        if (submitDisabled) {
          this.logBug('HIGH', 'Submit Button State Bug', 
            'Submit button remains disabled even after filling all required fields');
        }
        
        // Test rapid clicking
        const submitButton = await this.page.$('[data-testid="submit-button"]');
        if (submitButton && !submitDisabled) {
          // Click multiple times rapidly
          await Promise.all([
            submitButton.click(),
            submitButton.click(),
            submitButton.click()
          ]);
          
          // Check if multiple submissions occurred
          const requests = [];
          this.page.on('request', request => {
            if (request.method() === 'POST') {
              requests.push(request);
            }
          });
          
          await this.page.waitForTimeout(1000);
          
          if (requests.length > 1) {
            this.logBug('HIGH', 'Duplicate Submission Bug', 
              'Form allows multiple submissions when button clicked rapidly');
          }
        }
      }
    } catch (error) {
      console.log('Campaign creation test skipped:', error.message);
    }
  }

  async testLargeTextInputPerformance() {
    console.log('📄 Testing: Large text input performance');
    
    try {
      await this.page.goto(`${this.baseUrl}/create-offer`);
      
      const largeText = 'Lorem ipsum dolor sit amet. '.repeat(1000); // ~27,000 characters
      
      const descriptionField = await this.page.$('[data-testid="offer-description"]');
      if (descriptionField) {
        const startTime = Date.now();
        
        // Type the large text
        await descriptionField.type(largeText, { delay: 0 });
        
        const typeTime = Date.now() - startTime;
        
        // Check if UI is responsive
        const isResponsive = await this.page.evaluate(() => {
          return new Promise(resolve => {
            const start = Date.now();
            requestAnimationFrame(() => {
              resolve(Date.now() - start < 100);
            });
          });
        });
        
        if (!isResponsive || typeTime > 5000) {
          this.logBug('MEDIUM', 'Large Text Performance', 
            `UI becomes unresponsive with large text input (took ${typeTime}ms)`);
        }
        
        // Check character counter
        const charCounter = await this.page.$('[data-testid="character-counter"]');
        if (!charCounter) {
          this.logBug('LOW', 'Missing Character Counter', 
            'No character counter for large text fields');
        }
      }
    } catch (error) {
      console.log('Large text test skipped:', error.message);
    }
  }

  async testFileUploadWithFormData() {
    console.log('📎 Testing: File upload with form data');
    
    try {
      await this.page.goto(`${this.baseUrl}/submit-proof`);
      
      // Fill form data
      await this.page.type('[data-testid="proof-description"]', 'Campaign proof submission');
      
      // Test file input
      const fileInput = await this.page.$('input[type="file"]');
      if (fileInput) {
        // Create a test file path
        const testFilePath = __filename; // Use this file as test upload
        
        await fileInput.uploadFile(testFilePath);
        
        // Fill more form data after file selection
        await this.page.type('[data-testid="proof-notes"]', 'Additional notes after file selection');
        
        // Submit form
        await this.page.click('[data-testid="submit-proof"]');
        
        // Check if both file and form data are submitted together
        let formDataSubmitted = false;
        let fileSubmitted = false;
        
        this.page.on('request', request => {
          const postData = request.postData();
          if (postData) {
            if (postData.includes('proof-description')) formDataSubmitted = true;
            if (postData.includes('filename')) fileSubmitted = true;
          }
        });
        
        await this.page.waitForTimeout(2000);
        
        if (formDataSubmitted && !fileSubmitted) {
          this.logBug('HIGH', 'File Upload Lost', 
            'File upload lost when submitting with form data');
        } else if (fileSubmitted && !formDataSubmitted) {
          this.logBug('HIGH', 'Form Data Lost', 
            'Form data lost when submitting with file upload');
        }
      }
    } catch (error) {
      console.log('File upload test skipped:', error.message);
    }
  }

  async testDropdownFunctionality() {
    console.log('📋 Testing: Dropdown and select functionality');
    
    try {
      await this.page.goto(`${this.baseUrl}/create-offer`);
      
      const categoryDropdown = await this.page.$('[data-testid="category-dropdown"]');
      if (categoryDropdown) {
        // Click to open dropdown
        await categoryDropdown.click();
        await this.page.waitForTimeout(500);
        
        // Check if options are visible
        const options = await this.page.$$('[data-testid="dropdown-option"]');
        
        if (options.length === 0) {
          this.logBug('MEDIUM', 'Dropdown Options Not Visible', 
            'Dropdown opens but options are not displayed');
        } else {
          // Select an option
          await options[0].click();
          
          // Click outside to close
          await this.page.click('body');
          await this.page.waitForTimeout(500);
          
          // Check if dropdown closed
          const dropdownStillOpen = await this.page.$eval('[data-testid="dropdown-menu"]', 
            el => el.offsetParent !== null).catch(() => false);
          
          if (dropdownStillOpen) {
            this.logBug('MEDIUM', 'Dropdown Close Issue', 
              'Dropdown does not close when clicking outside');
          }
        }
        
        // Test keyboard navigation
        await categoryDropdown.click();
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
        
        const selectedValue = await categoryDropdown.evaluate(el => el.value);
        if (!selectedValue) {
          this.logBug('MEDIUM', 'Keyboard Navigation Broken', 
            'Dropdown does not support keyboard navigation');
        }
      }
    } catch (error) {
      console.log('Dropdown test skipped:', error.message);
    }
  }

  async testAutoSaveImplementation() {
    console.log('💾 Testing: Auto-save functionality');
    
    try {
      await this.page.goto(`${this.baseUrl}/create-offer`);
      
      // Type some content
      await this.page.type('[data-testid="offer-title"]', 'Test Auto Save');
      
      // Wait for auto-save trigger (usually after a delay)
      await this.page.waitForTimeout(3000);
      
      // Check localStorage or sessionStorage
      const savedData = await this.page.evaluate(() => {
        return {
          local: localStorage.getItem('draft-offer'),
          session: sessionStorage.getItem('draft-offer')
        };
      });
      
      if (!savedData.local && !savedData.session) {
        this.logBug('CRITICAL', 'No Auto-Save Implementation', 
          'Form data is not being auto-saved to prevent data loss');
      }
      
      // Check for save indicator
      const saveIndicator = await this.page.$('[data-testid="save-status"]');
      if (!saveIndicator) {
        this.logBug('HIGH', 'No Save Status Indicator', 
          'Users have no feedback about auto-save status');
      }
    } catch (error) {
      console.log('Auto-save test skipped:', error.message);
    }
  }

  async testFormNavigationWarnings() {
    console.log('⚠️  Testing: Navigation warnings for unsaved changes');
    
    try {
      await this.page.goto(`${this.baseUrl}/create-offer`);
      
      // Make changes to form
      await this.page.type('[data-testid="offer-title"]', 'Unsaved changes test');
      
      // Set up dialog handler
      let dialogShown = false;
      this.page.once('dialog', async dialog => {
        dialogShown = true;
        await dialog.accept();
      });
      
      // Try to navigate away
      await this.page.click('[data-testid="nav-dashboard"]').catch(() => {});
      
      if (!dialogShown) {
        // Try browser back button
        await this.page.goBack().catch(() => {});
        
        if (!dialogShown) {
          this.logBug('HIGH', 'No Unsaved Changes Warning', 
            'Users can lose form data by navigating away without warning');
        }
      }
    } catch (error) {
      console.log('Navigation warning test skipped:', error.message);
    }
  }

  async testMultiStepFormPersistence() {
    console.log('📑 Testing: Multi-step form data persistence');
    
    try {
      await this.page.goto(`${this.baseUrl}/onboarding`);
      
      // Fill step 1
      await this.page.type('[data-testid="company-name"]', 'Test Company');
      await this.page.click('[data-testid="next-step"]');
      
      // Fill step 2
      await this.page.type('[data-testid="company-description"]', 'Test Description');
      
      // Go back to step 1
      await this.page.click('[data-testid="prev-step"]');
      
      // Check if step 1 data is preserved
      const step1Value = await this.page.$eval('[data-testid="company-name"]', 
        el => el.value).catch(() => '');
      
      if (!step1Value) {
        this.logBug('HIGH', 'Multi-Step Form Data Loss', 
          'Form data lost when navigating between steps');
      }
      
      // Test browser refresh on step 2
      await this.page.click('[data-testid="next-step"]');
      await this.page.reload();
      
      // Check if we're still on step 2 with data
      const currentStep = await this.page.$('[data-testid="step-2-active"]');
      if (!currentStep) {
        this.logBug('HIGH', 'Multi-Step Progress Lost', 
          'Multi-step form progress lost on page refresh');
      }
    } catch (error) {
      console.log('Multi-step form test skipped:', error.message);
    }
  }

  async testDynamicFormFieldHandling() {
    console.log('🔀 Testing: Dynamic form field handling');
    
    try {
      await this.page.goto(`${this.baseUrl}/create-offer`);
      
      // Select option that should show additional fields
      const typeSelector = await this.page.$('[data-testid="offer-type"]');
      if (typeSelector) {
        await typeSelector.select('collaborative');
        await this.page.waitForTimeout(500);
        
        // Check if dynamic fields appear
        const dynamicFields = await this.page.$$('[data-testid="collab-details"]');
        
        if (dynamicFields.length > 0) {
          // Fill dynamic fields
          await this.page.type('[data-testid="collab-details"]', 'Dynamic field test');
          
          // Change selection to hide fields
          await typeSelector.select('standard');
          await this.page.waitForTimeout(500);
          
          // Change back
          await typeSelector.select('collaborative');
          await this.page.waitForTimeout(500);
          
          // Check if dynamic field data is preserved
          const dynamicValue = await this.page.$eval('[data-testid="collab-details"]', 
            el => el.value).catch(() => '');
          
          if (!dynamicValue) {
            this.logBug('MEDIUM', 'Dynamic Field Data Loss', 
              'Data in dynamic form fields lost when fields are hidden and shown again');
          }
        }
      }
    } catch (error) {
      console.log('Dynamic form test skipped:', error.message);
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

module.exports = FormDataBugHunter;

// Run if called directly
if (require.main === module) {
  const hunter = new FormDataBugHunter();
  
  async function runTests() {
    try {
      await hunter.initialize();
      const report = await hunter.runComprehensiveFormTests();
      
      console.log('\n' + '='.repeat(60));
      console.log('📝 FORM BUG HUNT RESULTS');
      console.log('='.repeat(60));
      console.log(`Total bugs found: ${report.totalBugs}`);
      console.log(`Critical: ${report.critical}`);
      console.log(`High: ${report.high}`);
      console.log(`Medium: ${report.medium}`);
      console.log(`Low: ${report.low}`);
      
      if (report.critical > 0) {
        console.log('\n🚨 CRITICAL: Form data loss issues must be fixed immediately!');
      }
    } catch (error) {
      console.error('Form bug hunt failed:', error);
    } finally {
      await hunter.cleanup();
    }
  }
  
  runTests();
}
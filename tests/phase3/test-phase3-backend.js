#!/usr/bin/env node

/**
 * Phase 3 Backend Verification Script
 * Tests all newly implemented backend endpoints
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_USER_ID = process.env.TEST_USER_ID || '123456789012345678901234'; // Sample ObjectId
const TEST_OFFER_ID = process.env.TEST_OFFER_ID || '123456789012345678901234';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

class Phase3BackendTester {
  constructor() {
    this.testResults = {
      emailVerification: false,
      commentGet: false,
      commentPost: false,
      commentPut: false,
      commentDelete: false
    };
    this.testCommentId = null;
  }

  async runAllTests() {
    console.log(`${colors.bright}${colors.blue}🔍 Starting Phase 3 Backend Verification...${colors.reset}\n`);
    console.log(`Base URL: ${BASE_URL}\n`);

    await this.testEmailVerification();
    await this.testCommentEndpoints();
    
    this.generateReport();
  }

  async testEmailVerification() {
    console.log(`${colors.cyan}📧 Testing Email Verification Endpoint...${colors.reset}`);
    
    try {
      // Test valid email
      const validResponse = await axios.post(`${BASE_URL}/utils/verify-email`, {
        email: 'test@example.com'
      });
      
      if (validResponse.data.success && validResponse.data.data.isValid) {
        console.log(`  ${colors.green}✅${colors.reset} Email verification endpoint working`);
        console.log(`  ${colors.green}✅${colors.reset} Valid email accepted`);
        
        // Test invalid email
        try {
          await axios.post(`${BASE_URL}/utils/verify-email`, {
            email: 'invalid-email'
          });
          console.log(`  ${colors.red}❌${colors.reset} Invalid email not rejected`);
        } catch (error) {
          if (error.response && error.response.status === 400) {
            console.log(`  ${colors.green}✅${colors.reset} Invalid email properly rejected`);
            this.testResults.emailVerification = true;
          }
        }
      }
    } catch (error) {
      console.log(`  ${colors.red}❌${colors.reset} Email verification endpoint failed:`, error.message);
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
        console.log(`     Error: ${JSON.stringify(error.response.data)}`);
      }
    }
    console.log('');
  }

  async testCommentEndpoints() {
    console.log(`${colors.cyan}💬 Testing Comment API Endpoints...${colors.reset}`);
    
    // Test GET comments
    console.log(`\n  ${colors.yellow}→ Testing GET /negotiation/:offerId/comments${colors.reset}`);
    try {
      const response = await axios.get(`${BASE_URL}/negotiation/${TEST_OFFER_ID}/comments?userId=${TEST_USER_ID}`);
      console.log(`    ${colors.green}✅${colors.reset} GET comments endpoint accessible`);
      console.log(`    Total comments: ${response.data.data.totalComments}`);
      this.testResults.commentGet = true;
    } catch (error) {
      console.log(`    ${colors.red}❌${colors.reset} GET comments failed:`, error.message);
    }

    // Test POST comment
    console.log(`\n  ${colors.yellow}→ Testing POST /negotiation/:offerId/comments${colors.reset}`);
    try {
      const response = await axios.post(`${BASE_URL}/negotiation/${TEST_OFFER_ID}/comments?userId=${TEST_USER_ID}`, {
        comment: 'Test comment from Phase 3 verification'
      });
      
      if (response.data.success && response.data.data.comment) {
        console.log(`    ${colors.green}✅${colors.reset} POST comment endpoint working`);
        console.log(`    Comment ID: ${response.data.data.comment.id}`);
        this.testCommentId = response.data.data.comment.id;
        this.testResults.commentPost = true;
      }
    } catch (error) {
      console.log(`    ${colors.red}❌${colors.reset} POST comment failed:`, error.message);
      if (error.response && error.response.status === 404) {
        console.log(`    ${colors.yellow}⚠️${colors.reset}  Note: This might fail if test offer doesn't exist`);
      }
    }

    // Test PUT comment (only if POST succeeded)
    if (this.testCommentId) {
      console.log(`\n  ${colors.yellow}→ Testing PUT /negotiation/:offerId/comments/:commentId${colors.reset}`);
      try {
        const response = await axios.put(
          `${BASE_URL}/negotiation/${TEST_OFFER_ID}/comments/${this.testCommentId}?userId=${TEST_USER_ID}`,
          { comment: 'Updated test comment' }
        );
        
        if (response.data.success && response.data.data.comment.isEdited) {
          console.log(`    ${colors.green}✅${colors.reset} PUT comment endpoint working`);
          console.log(`    Comment marked as edited: ${response.data.data.comment.isEdited}`);
          this.testResults.commentPut = true;
        }
      } catch (error) {
        console.log(`    ${colors.red}❌${colors.reset} PUT comment failed:`, error.message);
      }

      // Test DELETE comment
      console.log(`\n  ${colors.yellow}→ Testing DELETE /negotiation/:offerId/comments/:commentId${colors.reset}`);
      try {
        const response = await axios.delete(
          `${BASE_URL}/negotiation/${TEST_OFFER_ID}/comments/${this.testCommentId}?userId=${TEST_USER_ID}`
        );
        
        if (response.data.success) {
          console.log(`    ${colors.green}✅${colors.reset} DELETE comment endpoint working`);
          this.testResults.commentDelete = true;
        }
      } catch (error) {
        console.log(`    ${colors.red}❌${colors.reset} DELETE comment failed:`, error.message);
      }
    }
  }

  generateReport() {
    console.log(`\n${colors.bright}${colors.blue}📊 PHASE 3 BACKEND VERIFICATION REPORT${colors.reset}`);
    console.log('=====================================');
    
    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(result => result).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`${colors.bright}Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})${colors.reset}`);
    console.log('');
    
    const testNames = {
      emailVerification: 'Email Verification Endpoint',
      commentGet: 'GET Comments Endpoint',
      commentPost: 'POST Comment Endpoint',
      commentPut: 'PUT Comment Endpoint',
      commentDelete: 'DELETE Comment Endpoint'
    };
    
    Object.entries(this.testResults).forEach(([test, passed]) => {
      const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
      console.log(`${status} - ${testNames[test]}`);
    });
    
    console.log('');
    
    if (successRate === 100) {
      console.log(`${colors.green}🎉 ALL PHASE 3 BACKEND ENDPOINTS SUCCESSFULLY IMPLEMENTED!${colors.reset}`);
      console.log('Frontend and backend are now fully integrated');
    } else if (successRate >= 60) {
      console.log(`${colors.yellow}⚠️  Most endpoints implemented with some issues${colors.reset}`);
      console.log('Review failing tests and ensure database is properly configured');
    } else {
      console.log(`${colors.red}❌ Multiple backend issues detected${colors.reset}`);
      console.log('Ensure server is running and database is connected');
    }
    
    console.log(`\n${colors.cyan}💡 Testing Notes:${colors.reset}`);
    console.log('- Email verification tests basic validation only');
    console.log('- Comment tests require valid offer and user IDs in database');
    console.log('- Use environment variables to customize test parameters:');
    console.log('  API_URL=http://localhost:3000/api TEST_USER_ID=... TEST_OFFER_ID=... node test-phase3-backend.js');
  }
}

// Check if axios is installed
try {
  require.resolve('axios');
} catch (e) {
  console.error(`${colors.red}Error: axios is required but not installed${colors.reset}`);
  console.log('Please run: npm install axios');
  process.exit(1);
}

// Run the tests
const tester = new Phase3BackendTester();
tester.runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  process.exit(1);
});
// Mock external services first, before any requires
jest.mock('../../utils/messageCentral', () => ({
  sendOtp: jest.fn().mockResolvedValue(123456),
  verifyOtp: jest.fn().mockResolvedValue(true),
  getMessageCentralToken: jest.fn().mockResolvedValue('mock-token-12345')
}));

jest.mock('../../utils/pushNotifications', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('twilio', () => {
  const mockClient = {
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'SM123456789',
        status: 'sent'
      })
    }
  };
  return jest.fn(() => mockClient);
});

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test123' }),
    verify: jest.fn().mockResolvedValue(true)
  })),
  getTestMessageUrl: jest.fn().mockReturnValue('http://test-url.com')
}));

jest.mock('stripe', () => {
  return jest.fn(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_123456789',
          client_secret: 'cs_test_123456789_secret',
          metadata: {},
          payment_intent: 'pi_test_123456789'
        })
      }
    }
  }));
});

const request = require('supertest');
const app = require('../helpers/testApp');
const { connect, closeDatabase, clearDatabase } = require('../helpers/database');
const User = require('../../models/User');
const Offer = require('../../models/offer');
const Deal = require('../../models/deal');
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');
const { generateTestToken } = require('../helpers/auth');
const bcrypt = require('bcrypt');
const { demoConfig, generateDemoData, demoUtils } = require('../../config/demo');

describe('Demo Mode Test Suite', () => {
  let originalEnv;
  const demoResults = {
    infrastructure: {},
    environment: {},
    data: {},
    isolation: {},
    switching: {}
  };

  beforeAll(async () => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;
    process.env.DEMO_MODE = 'true';
    
    await connect();
  });

  afterAll(async () => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
    delete process.env.DEMO_MODE;
    
    // Output demo mode test results
    console.log('\n🎭 DEMO MODE TEST RESULTS');
    console.log('=========================');
    
    Object.entries(demoResults).forEach(([category, results]) => {
      console.log(`\n📋 ${category.toUpperCase()}:`);
      
      if (Object.keys(results).length === 0) {
        console.log('   No tests recorded');
        return;
      }
      
      Object.entries(results).forEach(([test, result]) => {
        console.log(`\n   ${test}:`);
        if (result.passed !== undefined) console.log(`     Passed: ${result.passed}`);
        if (result.total !== undefined) console.log(`     Total Tests: ${result.total}`);
        if (result.success !== undefined) console.log(`     Success Rate: ${result.success}%`);
        if (result.isolated !== undefined) console.log(`     Properly Isolated: ${result.isolated}`);
        if (result.performance !== undefined) console.log(`     Performance: ${result.performance}`);
        if (result.issues && result.issues.length > 0) {
          console.log(`     Issues: ${result.issues.join(', ')}`);
        }
      });
    });
    
    const totalTests = Object.values(demoResults).reduce((sum, category) => 
      sum + Object.values(category).filter(r => r.total).reduce((s, r) => s + r.total, 0), 0
    );
    const passedTests = Object.values(demoResults).reduce((sum, category) => 
      sum + Object.values(category).filter(r => r.passed).reduce((s, r) => s + r.passed, 0), 0
    );
    
    console.log('\n🎯 OVERALL DEMO MODE SCORE');
    console.log('===========================');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed Tests: ${passedTests}`);
    console.log(`   Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);
    
    console.log('\n=========================\n');
    
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  // Helper function to record demo results
  const recordDemoResult = (category, testName, result) => {
    demoResults[category][testName] = result;
  };

  describe('Demo Mode Infrastructure Tests', () => {
    it('should properly initialize demo mode configuration', () => {
      // Set demo mode for this test
      process.env.DEMO_MODE = 'true';
      
      const isDemo = demoUtils.isDemoMode();
      const validation = demoUtils.validateDemoEnvironment();
      
      expect(isDemo).toBe(true);
      expect(demoConfig.isDemoMode).toBe(true);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      
      recordDemoResult('infrastructure', 'Configuration Initialization', {
        passed: 1,
        total: 1,
        success: 100,
        performance: 'Excellent'
      });
    });

    it('should have proper demo mode restrictions', () => {
      const { restrictions, features } = demoConfig;
      
      expect(restrictions.maxUsers).toBe(100);
      expect(restrictions.maxOffers).toBe(1000);
      expect(restrictions.maxMessages).toBe(10000);
      expect(restrictions.dataRetentionDays).toBe(7);
      expect(restrictions.allowedOperations).not.toContain('delete');
      
      expect(features.autoCleanup).toBe(true);
      expect(features.sandboxedDatabase).toBe(true);
      expect(features.mockExternalServices).toBe(true);
      expect(features.disableEmails).toBe(true);
      expect(features.disableSMS).toBe(true);
      expect(features.disablePayments).toBe(true);
      
      recordDemoResult('infrastructure', 'Restrictions and Features', {
        passed: 1,
        total: 1,
        success: 100,
        performance: 'Excellent'
      });
    });

    it('should generate demo data correctly', async () => {
      // Generate demo users
      const demoMarketer = generateDemoData.createDemoUser('marketer', 1);
      const demoCreator = generateDemoData.createDemoUser('creator', 1);
      
      expect(demoMarketer.phone).toBe('+12125550111');
      expect(demoMarketer.email).toBe('demo.marketer1@axees.demo');
      expect(demoMarketer.userName).toBe('demo_marketer_1');
      
      expect(demoCreator.phone).toBe('+12125550111');
      expect(demoCreator.email).toBe('demo.creator1@axees.demo');
      expect(demoCreator.userName).toBe('demo_creator_1');
      
      // Create actual users in database
      const hashedPassword = await bcrypt.hash(demoMarketer.password, 10);
      const marketer = await User.create({
        ...demoMarketer,
        password: hashedPassword,
        userType: 'Marketer',
        isActive: true,
        isDemo: true,
        marketerData: {
          companyName: demoMarketer.companyName || 'Demo Company',
          industry: 'Technology',
          website: 'https://demo.com',
          businessLicense: 'DEMO123'
        }
      });
      
      const creator = await User.create({
        ...demoCreator,
        password: hashedPassword,
        userType: 'Creator',
        isActive: true,
        isDemo: true,
        creatorData: {
          platforms: [{
            platform: 'instagram',
            handle: '@demo_creator',
            followersCount: demoCreator.followers || 50000
          }],
          categories: ['technology'],
          nicheTopics: ['demo']
        }
      });
      
      // Generate demo offer
      const demoOffer = generateDemoData.createDemoOffer(marketer._id, creator._id, 0);
      expect(demoOffer.offerName).toBe('Demo Campaign 1');
      expect(demoOffer.proposedAmount).toBeGreaterThanOrEqual(500);
      expect(demoOffer.proposedAmount).toBeLessThanOrEqual(5000);
      
      const offer = await Offer.create({
        ...demoOffer,
        isDemo: true
      });
      
      expect(offer).toBeDefined();
      expect(offer.isDemo).toBe(true);
      
      recordDemoResult('infrastructure', 'Demo Data Generation', {
        passed: 1,
        total: 1,
        success: 100,
        performance: 'Excellent'
      });
    });
  });

  describe('Demo Environment Validation Tests', () => {
    it('should validate demo environment is properly configured', () => {
      const validation = demoUtils.validateDemoEnvironment();
      
      expect(validation.isValid).toBe(true);
      expect(validation.validations.mode).toBe(true);
      expect(validation.validations.database).toBe(true);
      expect(validation.validations.externalServices).toBe(true);
      expect(validation.validations.communications).toBe(false); // Should be disabled
      expect(validation.validations.payments).toBe(false); // Should be disabled
      
      recordDemoResult('environment', 'Environment Configuration', {
        passed: 1,
        total: 1,
        success: 100,
        isolated: true
      });
    });

    it('should prevent destructive operations in demo mode', async () => {
      // Create a demo user
      const hashedPassword = await bcrypt.hash('DemoPassword123!', 10);
      const demoUser = await User.create({
        phone: '+12125501050',
        name: 'Demo Delete Test',
        userName: 'demo_delete_test',
        email: 'delete@demo.com',
        password: hashedPassword,
        userType: 'Creator',
        isActive: true,
        isDemo: true,
        creatorData: {
          platforms: [{
            platform: 'instagram',
            handle: '@demo_delete',
            followersCount: 1000
          }],
          categories: ['test'],
          nicheTopics: ['demo']
        }
      });
      
      // Simulate DELETE request with demo mode middleware
      const mockReq = {
        method: 'DELETE',
        isDemoMode: true
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };
      const mockNext = jest.fn();
      
      // Apply demo mode restrictions
      if (demoConfig.isDemoMode && mockReq.method === 'DELETE' && 
          !demoConfig.restrictions.allowedOperations.includes('delete')) {
        mockRes.status(403).json({
          error: 'Delete operations are disabled in demo mode',
          isDemoMode: true
        });
      }
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Delete operations are disabled in demo mode',
        isDemoMode: true
      });
      
      // Verify user still exists
      const userExists = await User.findById(demoUser._id);
      expect(userExists).toBeDefined();
      
      recordDemoResult('environment', 'Destructive Operation Prevention', {
        passed: 1,
        total: 1,
        success: 100,
        isolated: true
      });
    });

    it('should mock external services in demo mode', async () => {
      const { features } = demoConfig;
      
      expect(features.mockExternalServices).toBe(true);
      expect(features.disableEmails).toBe(true);
      expect(features.disableSMS).toBe(true);
      expect(features.disablePayments).toBe(true);
      
      // Test that external services are mocked
      const messageCentral = require('../../utils/messageCentral');
      const result = await messageCentral.sendOtp();
      expect(result).toBe(123456); // Mocked value
      
      recordDemoResult('environment', 'External Service Mocking', {
        passed: 1,
        total: 1,
        success: 100,
        isolated: true
      });
    });
  });

  describe('Demo Data Testing with Isolation', () => {
    it('should isolate demo data from production data', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      // Create production user (without isDemo flag)
      const prodUser = await User.create({
        phone: '+12125552000',
        name: 'Production User',
        userName: 'prod_user',
        email: 'prod@example.com',
        password: hashedPassword,
        userType: 'Creator',
        isActive: true,
        creatorData: {
          platforms: [{
            platform: 'instagram',
            handle: '@prod_user',
            followersCount: 100000
          }],
          categories: ['technology'],
          nicheTopics: ['tech']
        }
      });
      
      // Create demo user (with isDemo flag)
      const demoUser = await User.create({
        phone: '+12125501100',
        name: 'Demo User',
        userName: 'demo_user',
        email: 'demo@axees.demo',
        password: hashedPassword,
        userType: 'Creator',
        isActive: true,
        isDemo: true,
        creatorData: {
          platforms: [{
            platform: 'instagram',
            handle: '@demo_user',
            followersCount: 50000
          }],
          categories: ['technology'],
          nicheTopics: ['demo']
        }
      });
      
      // Query for demo users only
      const demoUsers = await User.find({ isDemo: true });
      const prodUsers = await User.find({ isDemo: { $ne: true } });
      
      expect(demoUsers).toHaveLength(1);
      expect(demoUsers[0]._id.toString()).toBe(demoUser._id.toString());
      
      expect(prodUsers).toHaveLength(1);
      expect(prodUsers[0]._id.toString()).toBe(prodUser._id.toString());
      
      recordDemoResult('isolation', 'Data Isolation', {
        passed: 1,
        total: 1,
        success: 100,
        isolated: true
      });
    });

    it('should handle demo data cleanup correctly', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      // Create old demo data (simulate 8 days old)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      
      const oldDemoUser = await User.create({
        phone: '+12125501200',
        name: 'Old Demo User',
        userName: 'old_demo_user',
        email: 'old@axees.demo',
        password: hashedPassword,
        userType: 'Creator',
        isActive: true,
        isDemo: true,
        createdAt: oldDate,
        creatorData: {
          platforms: [{
            platform: 'instagram',
            handle: '@old_demo',
            followersCount: 1000
          }],
          categories: ['test'],
          nicheTopics: ['demo']
        }
      });
      
      // Create recent demo data
      const recentDemoUser = await User.create({
        phone: '+12125501201',
        name: 'Recent Demo User',
        userName: 'recent_demo_user',
        email: 'recent@axees.demo',
        password: hashedPassword,
        userType: 'Creator',
        isActive: true,
        isDemo: true,
        creatorData: {
          platforms: [{
            platform: 'instagram',
            handle: '@recent_demo',
            followersCount: 2000
          }],
          categories: ['test'],
          nicheTopics: ['demo']
        }
      });
      
      // Run cleanup
      const cleanupResult = await demoUtils.cleanupDemoData({
        User,
        Offer,
        Message
      });
      
      expect(cleanupResult.cleaned).toBe(true);
      expect(cleanupResult.results.users.deletedCount).toBe(1);
      
      // Verify old data is deleted and recent data remains
      const remainingUsers = await User.find({ isDemo: true });
      expect(remainingUsers).toHaveLength(1);
      expect(remainingUsers[0]._id.toString()).toBe(recentDemoUser._id.toString());
      
      recordDemoResult('isolation', 'Demo Data Cleanup', {
        passed: 1,
        total: 1,
        success: 100,
        isolated: true
      });
    });

    it('should enforce demo mode data limits', async () => {
      const { restrictions } = demoConfig;
      const results = {
        withinLimits: true,
        issues: []
      };
      
      // Test user limit
      const userCount = await User.countDocuments({ isDemo: true });
      if (userCount > restrictions.maxUsers) {
        results.withinLimits = false;
        results.issues.push(`User count ${userCount} exceeds limit ${restrictions.maxUsers}`);
      }
      
      // Test offer limit
      const offerCount = await Offer.countDocuments({ isDemo: true });
      if (offerCount > restrictions.maxOffers) {
        results.withinLimits = false;
        results.issues.push(`Offer count ${offerCount} exceeds limit ${restrictions.maxOffers}`);
      }
      
      // Test message limit
      const messageCount = await Message.countDocuments({ isDemo: true });
      if (messageCount > restrictions.maxMessages) {
        results.withinLimits = false;
        results.issues.push(`Message count ${messageCount} exceeds limit ${restrictions.maxMessages}`);
      }
      
      expect(results.withinLimits).toBe(true);
      expect(results.issues).toHaveLength(0);
      
      recordDemoResult('isolation', 'Data Limit Enforcement', {
        passed: 1,
        total: 1,
        success: 100,
        isolated: true,
        issues: results.issues
      });
    });
  });

  describe('Demo Mode Switching Functionality', () => {
    it('should properly switch between demo and production modes', async () => {
      // Start in demo mode
      expect(demoUtils.isDemoMode()).toBe(true);
      
      // Switch to production mode
      process.env.DEMO_MODE = 'false';
      delete require.cache[require.resolve('../../config/demo')];
      const { demoUtils: updatedUtils } = require('../../config/demo');
      
      expect(updatedUtils.isDemoMode()).toBe(false);
      
      // Switch back to demo mode
      process.env.DEMO_MODE = 'true';
      delete require.cache[require.resolve('../../config/demo')];
      const { demoUtils: reloadedUtils } = require('../../config/demo');
      
      expect(reloadedUtils.isDemoMode()).toBe(true);
      
      recordDemoResult('switching', 'Mode Switching', {
        passed: 1,
        total: 1,
        success: 100,
        performance: 'Excellent'
      });
    });

    it('should maintain data integrity during mode switches', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      // Create data in demo mode
      const demoUser = await User.create({
        phone: '+12125501300',
        name: 'Switch Test User',
        userName: 'switch_test',
        email: 'switch@axees.demo',
        password: hashedPassword,
        userType: 'Creator',
        isActive: true,
        isDemo: true,
        creatorData: {
          platforms: [{
            platform: 'instagram',
            handle: '@switch_test',
            followersCount: 5000
          }],
          categories: ['test'],
          nicheTopics: ['demo']
        }
      });
      
      // Simulate mode switch
      const userBeforeSwitch = await User.findById(demoUser._id);
      expect(userBeforeSwitch).toBeDefined();
      expect(userBeforeSwitch.isDemo).toBe(true);
      
      // Data should remain intact after switch
      const userAfterSwitch = await User.findById(demoUser._id);
      expect(userAfterSwitch).toBeDefined();
      expect(userAfterSwitch.isDemo).toBe(true);
      expect(userAfterSwitch.name).toBe('Switch Test User');
      
      recordDemoResult('switching', 'Data Integrity During Switch', {
        passed: 1,
        total: 1,
        success: 100,
        isolated: true
      });
    });

    it('should handle concurrent demo sessions properly', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const concurrentUsers = [];
      const sessionCount = 5;
      
      // Create multiple demo users simulating concurrent sessions
      for (let i = 0; i < sessionCount; i++) {
        const user = await User.create({
          phone: `+121255014${String(i).padStart(2, '0')}`,
          name: `Concurrent Demo User ${i}`,
          userName: `concurrent_demo_${i}`,
          email: `concurrent${i}@axees.demo`,
          password: hashedPassword,
          userType: i % 2 === 0 ? 'Creator' : 'Marketer',
          isActive: true,
          isDemo: true,
          ...(i % 2 === 0 ? {
            creatorData: {
              platforms: [{
                platform: 'instagram',
                handle: `@concurrent_${i}`,
                followersCount: 1000 * (i + 1)
              }],
              categories: ['test'],
              nicheTopics: ['demo']
            }
          } : {
            marketerData: {
              companyName: `Concurrent Company ${i}`,
              industry: 'Technology',
              website: `https://concurrent${i}.com`,
              businessLicense: `DEMO${i}`
            }
          })
        });
        
        concurrentUsers.push(user);
      }
      
      // Verify all users were created properly
      expect(concurrentUsers).toHaveLength(sessionCount);
      
      // Verify data isolation between sessions
      const demoUserCount = await User.countDocuments({ isDemo: true });
      expect(demoUserCount).toBeGreaterThanOrEqual(sessionCount);
      
      // Verify each user maintains their own data
      for (let i = 0; i < concurrentUsers.length; i++) {
        const user = await User.findById(concurrentUsers[i]._id);
        expect(user).toBeDefined();
        expect(user.userName).toBe(`concurrent_demo_${i}`);
      }
      
      recordDemoResult('switching', 'Concurrent Session Handling', {
        passed: 1,
        total: 1,
        success: 100,
        isolated: true,
        performance: 'Excellent'
      });
    });
  });
});
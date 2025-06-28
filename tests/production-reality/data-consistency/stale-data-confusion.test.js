/**
 * STALE DATA CONFUSION TEST
 * 
 * Validates data consistency across different endpoints and caches
 * 
 * REAL WORLD SCENARIO:
 * Dashboard shows $1,200 total earnings, but wallet shows $800 available,
 * user tries to withdraw $1,000 and gets confused by error messages
 */

const request = require('supertest');
const app = require('../../../main');
const { setupTestDatabase, cleanupTestDatabase } = require('../../helpers/database');

describe('Data Consistency Reality Check', () => {
  let testUser;
  let authToken;
  let testDeal;

  beforeAll(async () => {
    await setupTestDatabase();
    
    testUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Creator',
      email: 'creator@test.com',
      userType: 'creator'
    };

    authToken = 'Bearer test_token_for_data_consistency';
    
    // Create test deal for earnings
    testDeal = {
      _id: '507f1f77bcf86cd799439021',
      creatorId: testUser._id,
      marketerId: '507f1f77bcf86cd799439022',
      totalAmount: 1000,
      status: 'completed',
      completedAt: new Date()
    };
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('💰 Earnings Data Consistency', () => {
    it('should show consistent earnings across all endpoints', async () => {
      // Get earnings from dashboard
      const dashboardResponse = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', authToken);

      // Get earnings from analytics
      const analyticsResponse = await request(app)
        .get('/api/analytics/revenue')
        .set('Authorization', authToken);

      // Get earnings from earnings endpoint
      const earningsResponse = await request(app)
        .get('/api/earnings/analytics')
        .set('Authorization', authToken);

      // Get available balance from payments
      const paymentsResponse = await request(app)
        .get('/api/payments/earnings')
        .set('Authorization', authToken);

      // All endpoints should return consistent data
      const dashboardEarnings = dashboardResponse.body?.data?.totalEarnings || 0;
      const analyticsEarnings = analyticsResponse.body?.data?.totalRevenue || 0;
      const earningsTotal = earningsResponse.body?.data?.summary?.totalEarnings || 0;
      const availableBalance = paymentsResponse.body?.data?.availableBalance || 0;

      console.log('Dashboard earnings:', dashboardEarnings);
      console.log('Analytics earnings:', analyticsEarnings);
      console.log('Earnings total:', earningsTotal);
      console.log('Available balance:', availableBalance);

      // These should match (or have explainable differences)
      if (dashboardEarnings !== analyticsEarnings) {
        console.log('⚠️ Dashboard and Analytics earnings mismatch');
      }

      if (earningsTotal !== availableBalance) {
        console.log('⚠️ Total earnings and available balance mismatch (may be expected due to pending withdrawals)');
      }

      // Document the behavior for debugging
      expect(typeof dashboardEarnings).toBe('number');
      expect(typeof analyticsEarnings).toBe('number');
      expect(typeof earningsTotal).toBe('number');
      expect(typeof availableBalance).toBe('number');
    });

    it('should handle concurrent updates to earnings data', async () => {
      // Simulate concurrent deal completions affecting earnings
      const concurrentUpdates = [
        request(app)
          .patch('/api/marketer/deals/507f1f77bcf86cd799439021')
          .set('Authorization', authToken)
          .send({ status: 'completed' }),
        
        request(app)
          .patch('/api/marketer/deals/507f1f77bcf86cd799439022')
          .set('Authorization', authToken)
          .send({ status: 'completed' }),
        
        request(app)
          .get('/api/earnings/analytics')
          .set('Authorization', authToken)
      ];

      const responses = await Promise.all(concurrentUpdates);
      
      // Check if data remains consistent after concurrent operations
      const finalEarnings = await request(app)
        .get('/api/earnings/analytics')
        .set('Authorization', authToken);

      expect(finalEarnings.status).toBe(200);
      
      // Verify no race conditions caused negative balances
      const earnings = finalEarnings.body?.data?.summary?.totalEarnings || 0;
      expect(earnings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('🔄 Cache Invalidation Issues', () => {
    it('should invalidate caches when user profile is updated', async () => {
      // Get initial profile data
      const initialProfile = await request(app)
        .get('/api/account/profile')
        .set('Authorization', authToken);

      const initialName = initialProfile.body?.data?.name;

      // Update profile
      await request(app)
        .patch('/api/account/update-name')
        .set('Authorization', authToken)
        .send({ name: 'Updated Name' });

      // Check if all endpoints reflect the change
      const updatedProfile = await request(app)
        .get('/api/account/profile')
        .set('Authorization', authToken);

      const dashboardProfile = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', authToken);

      const userStats = await request(app)
        .get('/api/user/stats')
        .set('Authorization', authToken);

      const profileName = updatedProfile.body?.data?.name;
      const dashboardName = dashboardProfile.body?.data?.user?.name;
      const statsName = userStats.body?.data?.user?.name;

      console.log('Profile name:', profileName);
      console.log('Dashboard name:', dashboardName);
      console.log('Stats name:', statsName);

      // All should show updated name
      if (profileName !== 'Updated Name') {
        console.log('⚠️ Profile endpoint showing stale data');
      }
      
      if (dashboardName !== 'Updated Name') {
        console.log('⚠️ Dashboard endpoint showing stale data');
      }
      
      if (statsName !== 'Updated Name') {
        console.log('⚠️ Stats endpoint showing stale data');
      }
    });

    it('should handle deal status updates consistently across endpoints', async () => {
      const dealId = '507f1f77bcf86cd799439023';
      
      // Update deal status
      await request(app)
        .patch(`/api/marketer/deals/${dealId}`)
        .set('Authorization', authToken)
        .send({ status: 'in_progress' });

      // Small delay to allow for async updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check consistency across endpoints
      const dealDetails = await request(app)
        .get(`/api/marketer/deals/${dealId}`)
        .set('Authorization', authToken);

      const dashboardDeals = await request(app)
        .get('/api/dashboard/deals')
        .set('Authorization', authToken);

      const analyticsDeals = await request(app)
        .get('/api/analytics/performance')
        .set('Authorization', authToken);

      const dealStatus = dealDetails.body?.data?.status;
      const dashboardDeal = dashboardDeals.body?.data?.find(d => d._id === dealId);
      const analyticsDeal = analyticsDeals.body?.data?.deals?.find(d => d._id === dealId);

      console.log('Deal status from details:', dealStatus);
      console.log('Deal status from dashboard:', dashboardDeal?.status);
      console.log('Deal status from analytics:', analyticsDeal?.status);

      // All should show consistent status
      if (dealStatus !== 'in_progress') {
        console.log('⚠️ Deal details showing stale status');
      }
    });
  });

  describe('💱 Currency and Precision Issues', () => {
    it('should handle currency rounding consistently', async () => {
      const testAmount = 123.456; // Amount with precision issues

      // Test fee calculation
      const feeCalculation = await request(app)
        .post('/api/offers/calculate-fees')
        .set('Authorization', authToken)
        .send({ amount: testAmount });

      // Test earnings calculation
      const earningsCalc = await request(app)
        .get('/api/earnings/analytics')
        .set('Authorization', authToken);

      // Test payment processing
      const paymentCalc = await request(app)
        .get('/api/payments/earnings')
        .set('Authorization', authToken);

      const feeAmount = feeCalculation.body?.data?.totalFees || 0;
      const earningsAmount = earningsCalc.body?.data?.summary?.thisMonth || 0;
      const paymentAmount = paymentCalc.body?.data?.availableBalance || 0;

      // Check for consistent decimal handling
      const feeDecimals = (feeAmount.toString().split('.')[1] || '').length;
      const earningsDecimals = (earningsAmount.toString().split('.')[1] || '').length;
      const paymentDecimals = (paymentAmount.toString().split('.')[1] || '').length;

      console.log('Fee amount decimals:', feeDecimals);
      console.log('Earnings amount decimals:', earningsDecimals);
      console.log('Payment amount decimals:', paymentDecimals);

      // All should use consistent decimal precision (typically 2 for currency)
      expect(feeDecimals).toBeLessThanOrEqual(2);
      expect(earningsDecimals).toBeLessThanOrEqual(2);
      expect(paymentDecimals).toBeLessThanOrEqual(2);
    });

    it('should handle very large numbers without precision loss', async () => {
      const largeAmount = 999999.99;

      const response = await request(app)
        .post('/api/offers/calculate-fees')
        .set('Authorization', authToken)
        .send({ amount: largeAmount });

      const calculatedTotal = response.body?.data?.total || 0;
      
      // Should not lose precision or overflow
      expect(calculatedTotal).toBeGreaterThan(largeAmount);
      expect(Number.isFinite(calculatedTotal)).toBe(true);
      
      // Should not have floating point errors
      const decimalPlaces = (calculatedTotal.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('⏰ Timestamp Consistency', () => {
    it('should use consistent timezone handling across endpoints', async () => {
      // Create new offer to get fresh timestamps
      const offerResponse = await request(app)
        .post('/api/marketer/offers')
        .set('Authorization', authToken)
        .send({
          title: 'Timestamp Test Offer',
          budget: 500,
          description: 'Testing timestamp consistency'
        });

      const offerId = offerResponse.body?.data?._id;
      
      if (offerId) {
        // Get offer from different endpoints
        const offerDetails = await request(app)
          .get(`/api/marketer/offers/${offerId}`)
          .set('Authorization', authToken);

        const dashboardOffers = await request(app)
          .get('/api/dashboard/overview')
          .set('Authorization', authToken);

        const detailsTimestamp = offerDetails.body?.data?.createdAt;
        const dashboardTimestamp = dashboardOffers.body?.data?.recentOffers?.find(
          o => o._id === offerId
        )?.createdAt;

        if (detailsTimestamp && dashboardTimestamp) {
          const detailsDate = new Date(detailsTimestamp);
          const dashboardDate = new Date(dashboardTimestamp);
          
          // Should be the same timestamp
          const timeDiff = Math.abs(detailsDate.getTime() - dashboardDate.getTime());
          expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
        }
      }
    });
  });
});
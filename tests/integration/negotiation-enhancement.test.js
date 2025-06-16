const request = require('supertest');
const { app } = require('../../helpers/testApp');
const User = require('../../models/User');
const Offer = require('../../models/offer');
const { createTestUsers, generateAuthHeader } = require('../helpers/authHelpers');

describe('Enhanced Negotiation System', () => {
  let marketer, creator, offer;
  let marketerAuth, creatorAuth;

  beforeEach(async () => {
    // Create test users
    const users = await createTestUsers();
    marketer = users.marketer;
    creator = users.creator;
    
    marketerAuth = generateAuthHeader(marketer._id);
    creatorAuth = generateAuthHeader(creator._id);

    // Create test offer
    offer = new Offer({
      marketerId: marketer._id,
      creatorId: creator._id,
      offerName: 'Test Enhanced Negotiation Offer',
      description: 'Test offer for enhanced negotiation features',
      proposedAmount: 1000,
      deliverables: ['3 Instagram posts', '2 stories'],
      desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: 'Pending'
    });
    await offer.save();
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Offer.deleteMany({});
  });

  describe('GET /api/negotiation/:offerId', () => {
    it('should return comprehensive negotiation table data', async () => {
      const response = await request(app)
        .get(`/api/negotiation/${offer._id}`)
        .query({ userId: marketer._id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('offer');
      expect(response.body.data).toHaveProperty('participants');
      expect(response.body.data).toHaveProperty('currentTerms');
      expect(response.body.data).toHaveProperty('negotiationHistory');
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('permissions');

      expect(response.body.data.participants.marketer.id).toBe(marketer._id.toString());
      expect(response.body.data.participants.creator.id).toBe(creator._id.toString());
      expect(response.body.data.currentTerms.amount).toBe(1000);
    });

    it('should deny access for unauthorized users', async () => {
      const unauthorizedUser = new User({
        name: 'Unauthorized User',
        email: 'unauthorized@test.com',
        userType: 'creator'
      });
      await unauthorizedUser.save();

      await request(app)
        .get(`/api/negotiation/${offer._id}`)
        .query({ userId: unauthorizedUser._id })
        .expect(403);
    });
  });

  describe('POST /api/negotiation/:offerId/counter', () => {
    it('should submit enhanced counter offer with analytics', async () => {
      const counterData = {
        userId: creator._id,
        counterAmount: 1200,
        notes: 'Increased amount due to additional deliverables',
        deliverables: ['3 Instagram posts', '2 stories', '1 reel'],
        priority: 'high',
        expiresIn: 3
      };

      const response = await request(app)
        .post(`/api/negotiation/${offer._id}/counter`)
        .send(counterData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.counter.counterAmount).toBe(1200);
      expect(response.body.data.counter.counterBy).toBe('Creator');
      expect(response.body.data.counter.priority).toBe('high');
      expect(response.body.data.counter.expiresAt).toBeDefined();
      expect(response.body.data.metrics).toBeDefined();

      // Verify offer was updated
      const updatedOffer = await Offer.findById(offer._id);
      expect(updatedOffer.status).toBe('Rejected-Countered');
      expect(updatedOffer.counters.length).toBe(1);
      expect(updatedOffer.negotiationMetrics.totalRounds).toBe(1);
    });

    it('should handle partial counter offers (only notes)', async () => {
      const counterData = {
        userId: marketer._id,
        notes: 'Can we discuss the timeline?'
      };

      const response = await request(app)
        .post(`/api/negotiation/${offer._id}/counter`)
        .send(counterData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.counter.notes).toBe('Can we discuss the timeline?');
      expect(response.body.data.counter.counterBy).toBe('Marketer');
    });
  });

  describe('POST /api/negotiation/:offerId/accept', () => {
    beforeEach(async () => {
      // Add a counter offer first
      offer.counters.push({
        counterBy: 'Creator',
        counterAmount: 1200,
        notes: 'Increased amount',
        counterDate: new Date()
      });
      await offer.save();
    });

    it('should accept negotiation terms', async () => {
      const response = await request(app)
        .post(`/api/negotiation/${offer._id}/accept`)
        .send({ userId: marketer._id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offer.status).toBe('Accepted');
      expect(response.body.data.acceptance.acceptedBy).toBe('Marketer');
      expect(response.body.data.acceptance.acceptedTerms.amount).toBe(1200);

      // Verify offer was updated
      const updatedOffer = await Offer.findById(offer._id);
      expect(updatedOffer.status).toBe('Accepted');
      expect(updatedOffer.counters[updatedOffer.counters.length - 1].isAcceptance).toBe(true);
    });
  });

  describe('POST /api/negotiation/:offerId/reject', () => {
    it('should reject negotiation with reason', async () => {
      const rejectionData = {
        userId: creator._id,
        reason: 'Terms not acceptable'
      };

      const response = await request(app)
        .post(`/api/negotiation/${offer._id}/reject`)
        .send(rejectionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.offer.status).toBe('Rejected');
      expect(response.body.data.rejection.rejectedBy).toBe('Creator');
      expect(response.body.data.rejection.reason).toBe('Terms not acceptable');

      // Verify offer was updated
      const updatedOffer = await Offer.findById(offer._id);
      expect(updatedOffer.status).toBe('Rejected');
      expect(updatedOffer.counters[updatedOffer.counters.length - 1].isRejection).toBe(true);
    });
  });

  describe('POST /api/negotiation/:offerId/message', () => {
    it('should add negotiation message', async () => {
      const messageData = {
        userId: marketer._id,
        message: 'Can we schedule a call to discuss this?'
      };

      const response = await request(app)
        .post(`/api/negotiation/${offer._id}/message`)
        .send(messageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.notes).toBe('Can we schedule a call to discuss this?');
      expect(response.body.data.message.isMessage).toBe(true);

      // Verify offer was updated
      const updatedOffer = await Offer.findById(offer._id);
      expect(updatedOffer.counters.length).toBe(1);
      expect(updatedOffer.counters[0].isMessage).toBe(true);
    });
  });

  describe('GET /api/negotiation/analytics/user', () => {
    beforeEach(async () => {
      // Create additional offers with negotiation history
      const offer2 = new Offer({
        marketerId: marketer._id,
        creatorId: creator._id,
        offerName: 'Test Offer 2',
        proposedAmount: 500,
        status: 'Accepted',
        counters: [
          {
            counterBy: 'Creator',
            counterAmount: 600,
            counterDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          },
          {
            counterBy: 'Marketer',
            counterDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            isAcceptance: true
          }
        ]
      });
      await offer2.save();

      const offer3 = new Offer({
        marketerId: marketer._id,
        creatorId: creator._id,
        offerName: 'Test Offer 3',
        proposedAmount: 800,
        status: 'Rejected',
        counters: [
          {
            counterBy: 'Creator',
            counterDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            isRejection: true
          }
        ]
      });
      await offer3.save();
    });

    it('should return comprehensive user negotiation analytics', async () => {
      const response = await request(app)
        .get('/api/negotiation/analytics/user')
        .query({ userId: marketer._id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalNegotiations');
      expect(response.body.data).toHaveProperty('acceptedNegotiations');
      expect(response.body.data).toHaveProperty('rejectedNegotiations');
      expect(response.body.data).toHaveProperty('averageRounds');
      expect(response.body.data).toHaveProperty('successRate');
      expect(response.body.data).toHaveProperty('byRole');

      expect(response.body.data.totalNegotiations).toBeGreaterThan(0);
      expect(response.body.data.byRole.asMarketer.total).toBeGreaterThan(0);
    });
  });

  describe('Negotiation Metrics Calculation', () => {
    it('should automatically calculate negotiation metrics', async () => {
      // Add multiple counters to test metrics calculation
      offer.counters.push(
        {
          counterBy: 'Creator',
          counterAmount: 1200,
          counterDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          counterBy: 'Marketer',
          counterAmount: 1100,
          counterDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          counterBy: 'Creator',
          counterAmount: 1150,
          counterDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
      );

      await offer.save();

      expect(offer.negotiationMetrics.totalRounds).toBe(3);
      expect(offer.negotiationMetrics.participantEngagement.marketerResponses).toBe(1);
      expect(offer.negotiationMetrics.participantEngagement.creatorResponses).toBe(2);
      expect(offer.negotiationMetrics.averageResponseTime).toBeGreaterThan(0);
    });
  });
});
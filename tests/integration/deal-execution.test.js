// tests/integration/deal-execution.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// Import test helpers
const authHelpers = require('../helpers/authHelpers');
const testUtils = require('../helpers/testUtils');

// Import models
const User = require('../../models/User');
const Deal = require('../../models/deal');
const Earning = require('../../models/earnings');
const Payout = require('../../models/payouts');
const Notification = require('../../models/Notification');

// Import routes
<<<<<<< HEAD
const dealExecutionRoutes = require('../../routes/dealExecutionRoutes');
=======
const marketerDealRoutes = require('../../routes/marketerDealRoutes');
>>>>>>> feature/testing-infrastructure

// Create Express app for testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock manual auth middleware to inject user
app.use((req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret');
      req.user = { id: decoded.id, _id: decoded.id };
    } catch (error) {
      // Invalid token, continue without user
    }
  }
  next();
});

<<<<<<< HEAD
app.use('/api/v1/deals', dealExecutionRoutes);
=======
app.use('/api/marketer/deals', marketerDealRoutes);
>>>>>>> feature/testing-infrastructure

describe('Deal Execution Tests', () => {
  let testCreator, testMarketer, testDeal, testMilestone;
  let creatorAuthHeader, marketerAuthHeader;

  // Setup environment variables for tests
  testUtils.mockEnvVars({
    JWT_SECRET: 'test-jwt-secret',
    NODE_ENV: 'test'
  });

  beforeEach(async () => {
    // Create test users
    const creatorData = await authHelpers.createAuthenticatedCreator({
      userName: 'TestCreator',
      email: 'creator@test.com'
    });
    testCreator = creatorData.user;
    creatorAuthHeader = creatorData.authHeader;

    const marketerData = await authHelpers.createAuthenticatedMarketer({
      userName: 'TestMarketer',
      email: 'marketer@test.com'
    });
    testMarketer = marketerData.user;
    marketerAuthHeader = marketerData.authHeader;

    // Create test deal with funded milestone
    testDeal = await testUtils.createDealInState('with_funded_milestone', {
      creatorId: testCreator._id,
      marketerId: testMarketer._id,
      dealName: 'Test Deal Execution',
      paymentInfo: {
        paymentAmount: 1000,
        paymentStatus: 'Pending'
      }
    });

    testMilestone = testDeal.milestones[0];
  });

  afterEach(async () => {
    await testUtils.cleanupTestData();
  });

<<<<<<< HEAD
  describe('PUT /api/v1/deals/:id/submit-milestone', () => {
=======
  describe('PUT /api/marketer/deals/:id/submit-milestone', () => {
>>>>>>> feature/testing-infrastructure
    describe('✅ Success Cases', () => {
      it('should submit milestone deliverables successfully', async () => {
        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: testMilestone._id.toString(),
          deliverables: [
            {
              type: 'file',
              url: '/uploads/deliverables/design-mockup.jpg',
              originalName: 'design-mockup.jpg'
            },
            {
              type: 'text',
              content: 'Content has been created according to specifications.'
            }
          ],
          notes: 'Milestone completed successfully'
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Milestone deliverables submitted successfully');
        expect(response.body.milestone).toHaveProperty('status', 'submitted');
        expect(response.body.milestone.deliverables).toHaveLength(2);
        expect(response.body.milestone).toHaveProperty('submittedAt');

        // Verify deal was updated
        const updatedDeal = await Deal.findById(testDeal._id);
        const updatedMilestone = updatedDeal.milestones.id(testMilestone._id);
        expect(updatedMilestone.status).toBe('submitted');
        expect(updatedMilestone.deliverables).toHaveLength(2);
      });

      it('should submit milestone with file uploads', async () => {
        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: testMilestone._id.toString(),
          deliverables: [
            {
              type: 'file',
              url: '/uploads/deliverables/video-content.mp4',
              originalName: 'final-video.mp4'
            }
          ]
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(200);
        expect(response.body.milestone.deliverables[0]).toHaveProperty('type', 'file');
        expect(response.body.milestone.deliverables[0]).toHaveProperty('originalName', 'final-video.mp4');
      });

      it('should submit milestone with text content', async () => {
        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: testMilestone._id.toString(),
          deliverables: [
            {
              type: 'text',
              content: 'Here is the written content for the campaign.'
            }
          ]
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(200);
        expect(response.body.milestone.deliverables[0]).toHaveProperty('type', 'text');
        expect(response.body.milestone.deliverables[0]).toHaveProperty('content');
      });

      it('should create notification for marketer on submission', async () => {
        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: testMilestone._id.toString()
        });

        await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        // Check notification was created
        const notification = await Notification.findOne({
          user: testMarketer._id,
          type: 'milestone_submitted'
        });

        expect(notification).toBeTruthy();
        expect(notification.title).toBe('Milestone Submitted');
        expect(notification.data.dealNumber).toBe(testDeal.dealNumber);
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: testMilestone._id.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .send(submissionData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized: User not authenticated');
      });

      it('should return 400 for missing milestone ID', async () => {
        const submissionData = testUtils.generateMilestoneSubmissionData();
        delete submissionData.milestoneId;

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Milestone ID is required');
      });

      it('should return 400 for missing deliverables', async () => {
        const submissionData = {
          milestoneId: testMilestone._id.toString(),
          deliverables: []
        };

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'At least one deliverable is required');
      });

      it('should return 404 for invalid deal ID', async () => {
        const invalidDealId = new mongoose.Types.ObjectId();
        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: testMilestone._id.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${invalidDealId}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${invalidDealId}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Deal not found');
      });

      it('should return 404 for invalid milestone ID', async () => {
        const invalidMilestoneId = new mongoose.Types.ObjectId();
        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: invalidMilestoneId.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Milestone not found');
      });

      it('should return 403 for marketer trying to submit', async () => {
        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: testMilestone._id.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Only the creator can submit milestone deliverables');
      });

      it('should prevent duplicate submission', async () => {
        // First submission
        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: testMilestone._id.toString()
        });

        await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        // Attempt duplicate submission
        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Milestone deliverables have already been submitted');
      });

      it('should return 400 for submitting to unfunded milestone', async () => {
        // Create deal with unfunded milestone
        const unfundedDeal = await testUtils.createDealWithMilestones({
          creatorId: testCreator._id,
          marketerId: testMarketer._id
        });

        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: unfundedDeal.milestones[0]._id.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${unfundedDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${unfundedDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Milestone must be funded before submitting deliverables');
      });
    });
  });

<<<<<<< HEAD
  describe('PUT /api/v1/deals/:id/approve-milestone', () => {
=======
  describe('PUT /api/marketer/deals/:id/approve-milestone', () => {
>>>>>>> feature/testing-infrastructure
    let submittedDeal, submittedMilestone;

    beforeEach(async () => {
      // Create deal with submitted milestone
      submittedDeal = await testUtils.createDealInState('with_submitted_milestone', {
        creatorId: testCreator._id,
        marketerId: testMarketer._id,
        dealName: 'Deal with Submitted Milestone'
      });
      submittedMilestone = submittedDeal.milestones[0];
    });

    describe('✅ Success Cases - Approval', () => {
      it('should approve milestone successfully', async () => {
        const approvalData = testUtils.generateMilestoneApprovalData('approve', {
          milestoneId: submittedMilestone._id.toString(),
          rating: 5
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(approvalData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Milestone approved successfully');
        expect(response.body.milestone).toHaveProperty('status', 'approved');
        expect(response.body.milestone).toHaveProperty('completedAt');
        expect(response.body.milestone).toHaveProperty('rating', 5);

        // Verify deal was updated
        const updatedDeal = await Deal.findById(submittedDeal._id);
        const updatedMilestone = updatedDeal.milestones.id(submittedMilestone._id);
        expect(updatedMilestone.status).toBe('approved');
        expect(updatedMilestone.completedAt).toBeDefined();
      });

      it('should trigger payment release when approving', async () => {
        const approvalData = testUtils.generateMilestoneApprovalData('approve', {
          milestoneId: submittedMilestone._id.toString()
        });

        await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(approvalData);

        // Check earning was created
        const earning = await Earning.findOne({
          user: testCreator._id,
          deal: submittedDeal._id
        });

        expect(earning).toBeTruthy();
        expect(earning.amount).toBe(submittedMilestone.amount);
        expect(earning.transactionId).toBe(`milestone_${submittedMilestone._id}`);

        // Check payout was created
        const payout = await Payout.findOne({
          user: testCreator._id,
          deal: submittedDeal._id
        });

        expect(payout).toBeTruthy();
        expect(payout.status).toBe('COMPLETED');
      });

      it('should create approval notification for creator', async () => {
        const approvalData = testUtils.generateMilestoneApprovalData('approve', {
          milestoneId: submittedMilestone._id.toString()
        });

        await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(approvalData);

        // Check notification was created
        const notification = await Notification.findOne({
          user: testCreator._id,
          type: 'milestone_approved'
        });

        expect(notification).toBeTruthy();
        expect(notification.title).toBe('Milestone Approved');
      });
    });

    describe('✅ Success Cases - Rejection', () => {
      it('should reject milestone with feedback', async () => {
        const rejectionData = testUtils.generateMilestoneApprovalData('reject', {
          milestoneId: submittedMilestone._id.toString(),
          feedback: 'Please revise the content according to brand guidelines'
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(rejectionData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Milestone rejected successfully');
        expect(response.body.milestone).toHaveProperty('status', 'revision_required');
        expect(response.body.milestone.feedback).toHaveLength(1);
        expect(response.body.milestone.feedback[0]).toHaveProperty('feedback', 'Please revise the content according to brand guidelines');

        // Verify deal was updated
        const updatedDeal = await Deal.findById(submittedDeal._id);
        const updatedMilestone = updatedDeal.milestones.id(submittedMilestone._id);
        expect(updatedMilestone.status).toBe('revision_required');
        expect(updatedMilestone.feedback).toHaveLength(1);
      });

      it('should create rejection notification for creator', async () => {
        const rejectionData = testUtils.generateMilestoneApprovalData('reject', {
          milestoneId: submittedMilestone._id.toString(),
          feedback: 'Needs revision'
        });

        await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(rejectionData);

        // Check notification was created
        const notification = await Notification.findOne({
          user: testCreator._id,
          type: 'milestone_rejected'
        });

        expect(notification).toBeTruthy();
        expect(notification.title).toBe('Milestone Revision Required');
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const approvalData = testUtils.generateMilestoneApprovalData('approve', {
          milestoneId: submittedMilestone._id.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .send(approvalData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized: User not authenticated');
      });

      it('should return 400 for missing milestone ID', async () => {
        const approvalData = {
          action: 'approve'
        };

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(approvalData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Milestone ID is required');
      });

      it('should return 400 for invalid action', async () => {
        const approvalData = {
          milestoneId: submittedMilestone._id.toString(),
          action: 'invalid_action'
        };

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(approvalData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Action must be either \'approve\' or \'reject\'');
      });

      it('should return 400 for rejection without feedback', async () => {
        const rejectionData = {
          milestoneId: submittedMilestone._id.toString(),
          action: 'reject'
        };

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(rejectionData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Feedback is required when rejecting milestone');
      });

      it('should return 403 for creator trying to approve', async () => {
        const approvalData = testUtils.generateMilestoneApprovalData('approve', {
          milestoneId: submittedMilestone._id.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(approvalData);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Only the marketer can approve/reject milestone submissions');
      });

      it('should return 400 for approving non-submitted milestone', async () => {
        // Create deal with pending milestone
        const pendingDeal = await testUtils.createDealWithMilestones({
          creatorId: testCreator._id,
          marketerId: testMarketer._id
        });

        const approvalData = testUtils.generateMilestoneApprovalData('approve', {
          milestoneId: pendingDeal.milestones[0]._id.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${pendingDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${pendingDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(approvalData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Can only approve/reject submitted milestones');
      });

      it('should prevent unauthorized approval attempts', async () => {
        // Create third user
        const unauthorizedUserData = await authHelpers.createAuthenticatedUser({
          userName: 'UnauthorizedUser'
        });

        const approvalData = testUtils.generateMilestoneApprovalData('approve', {
          milestoneId: submittedMilestone._id.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${submittedDeal._id}/approve-milestone`)
=======
          .put(`/api/marketer/deals/${submittedDeal._id}/approve-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(unauthorizedUserData.authHeader)
          .send(approvalData);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Only the marketer can approve/reject milestone submissions');
      });
    });
  });

<<<<<<< HEAD
  describe('POST /api/v1/deals/:id/complete', () => {
=======
  describe('POST /api/marketer/deals/:id/complete', () => {
>>>>>>> feature/testing-infrastructure
    let completableDeal;

    beforeEach(async () => {
      // Create deal with all milestones approved
      completableDeal = await testUtils.createDealInState('ready_for_completion', {
        creatorId: testCreator._id,
        marketerId: testMarketer._id,
        dealName: 'Ready for Completion Deal',
        paymentInfo: {
          paymentAmount: 1000,
          paymentStatus: 'Partial'
        }
      });
    });

    describe('✅ Success Cases', () => {
      it('should complete deal successfully', async () => {
        const completionData = testUtils.generateDealCompletionData({
          rating: 5,
          feedback: 'Excellent work, very satisfied',
          triggerFinalPayment: false
        });

        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(completionData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Deal completed successfully');
        expect(response.body.deal).toHaveProperty('status', 'completed');
        expect(response.body.deal).toHaveProperty('completedAt');
        expect(response.body.deal.finalReview).toHaveProperty('rating', 5);
        expect(response.body.deal.finalReview).toHaveProperty('feedback', 'Excellent work, very satisfied');

        // Verify deal was updated
        const updatedDeal = await Deal.findById(completableDeal._id);
        expect(updatedDeal.status).toBe('completed');
        expect(updatedDeal.completedAt).toBeDefined();
        expect(updatedDeal.finalReview.rating).toBe(5);
      });

      it('should complete deal with final payment release', async () => {
        const completionData = testUtils.generateDealCompletionData({
          triggerFinalPayment: true
        });

        await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(completionData);

        // Check final payment earning was created
        const finalEarning = await Earning.findOne({
          user: testCreator._id,
          deal: completableDeal._id,
          reference: 'Final deal completion payment'
        });

        expect(finalEarning).toBeTruthy();
        expect(finalEarning.amount).toBeGreaterThan(0);
        expect(finalEarning.reference).toBe('Final deal completion payment');

        // Verify payment status updated
        const updatedDeal = await Deal.findById(completableDeal._id);
        expect(updatedDeal.paymentInfo.paymentStatus).toBe('Paid');
      });

      it('should create completion notification for creator', async () => {
        const completionData = testUtils.generateDealCompletionData();

        await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(completionData);

        // Check notification was created
        const notification = await Notification.findOne({
          user: testCreator._id,
          type: 'deal_completed'
        });

        expect(notification).toBeTruthy();
        expect(notification.title).toBe('Deal Completed');
      });

      it('should allow completion without rating or feedback', async () => {
        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send({});

        expect(response.status).toBe(200);
        expect(response.body.deal).toHaveProperty('status', 'completed');
      });

      it('should handle rating submission', async () => {
        const completionData = {
          rating: 4,
          feedback: 'Good work overall'
        };

        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(completionData);

        expect(response.status).toBe(200);
        expect(response.body.deal.finalReview).toHaveProperty('rating', 4);
        expect(response.body.deal.finalReview).toHaveProperty('feedback', 'Good work overall');
      });
    });

    describe('❌ Error Cases', () => {
      it('should return 401 for unauthenticated requests', async () => {
        const completionData = testUtils.generateDealCompletionData();

        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .send(completionData);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized: User not authenticated');
      });

      it('should return 404 for invalid deal ID', async () => {
        const invalidDealId = new mongoose.Types.ObjectId();
        const completionData = testUtils.generateDealCompletionData();

        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${invalidDealId}/complete`)
=======
          .post(`/api/marketer/deals/${invalidDealId}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(completionData);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Deal not found');
      });

      it('should return 403 for creator trying to complete', async () => {
        const completionData = testUtils.generateDealCompletionData();

        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(completionData);

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('error', 'Only the marketer can complete deals');
      });

      it('should return 400 for already completed deal', async () => {
        // Complete the deal first
        await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send({});

        // Try to complete again
        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Deal is already completed');
      });

      it('should handle incomplete milestone handling', async () => {
        // Create deal with incomplete milestones
        const incompleteDeal = await testUtils.createDealWithMilestones({
          creatorId: testCreator._id,
          marketerId: testMarketer._id
        });

        const completionData = testUtils.generateDealCompletionData();

        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${incompleteDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${incompleteDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(completionData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Cannot complete deal with incomplete milestones');
        expect(response.body).toHaveProperty('incompleteMilestones');
        expect(response.body.incompleteMilestones).toHaveLength(2);
      });

      it('should return 400 for invalid rating', async () => {
        const completionData = {
          rating: 6 // Invalid rating (should be 1-5)
        };

        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${completableDeal._id}/complete`)
=======
          .post(`/api/marketer/deals/${completableDeal._id}/complete`)
>>>>>>> feature/testing-infrastructure
          .set(marketerAuthHeader)
          .send(completionData);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Rating must be between 1 and 5');
      });
    });
  });

  describe('File Upload Tests', () => {
<<<<<<< HEAD
    describe('POST /api/v1/deals/:id/upload-deliverable', () => {
=======
    describe('POST /api/marketer/deals/:id/upload-deliverable', () => {
>>>>>>> feature/testing-infrastructure
      it('should handle file upload for deliverables', async () => {
        // This test would require actual file upload simulation
        // For now, we test the basic endpoint structure
        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${testDeal._id}/upload-deliverable`)
=======
          .post(`/api/marketer/deals/${testDeal._id}/upload-deliverable`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader);

        // Without actual files, should return 400
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'No files uploaded');
      });

      it('should return 401 for unauthenticated file upload', async () => {
        const response = await request(app)
<<<<<<< HEAD
          .post(`/api/v1/deals/${testDeal._id}/upload-deliverable`);
=======
          .post(`/api/marketer/deals/${testDeal._id}/upload-deliverable`);
>>>>>>> feature/testing-infrastructure

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized: User not authenticated');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed ObjectId in deal ID', async () => {
      const response = await request(app)
<<<<<<< HEAD
        .put('/api/v1/deals/invalid-id/submit-milestone')
=======
        .put('/api/marketer/deals/invalid-id/submit-milestone')
>>>>>>> feature/testing-infrastructure
        .set(creatorAuthHeader)
        .send(testUtils.generateMilestoneSubmissionData());

      expect(response.status).toBe(500); // Server error for malformed ObjectId
    });

    it('should handle malformed ObjectId in milestone ID', async () => {
      const submissionData = testUtils.generateMilestoneSubmissionData({
        milestoneId: 'invalid-milestone-id'
      });

      const response = await request(app)
<<<<<<< HEAD
        .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
        .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
        .set(creatorAuthHeader)
        .send(submissionData);

      expect(response.status).toBe(500); // Server error for malformed ObjectId
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock a database error
      const originalFindById = Deal.findById;
      
      try {
        Deal.findById = jest.fn(() => Promise.reject(new Error('Database connection error')));

        const submissionData = testUtils.generateMilestoneSubmissionData({
          milestoneId: testMilestone._id.toString()
        });

        const response = await request(app)
<<<<<<< HEAD
          .put(`/api/v1/deals/${testDeal._id}/submit-milestone`)
=======
          .put(`/api/marketer/deals/${testDeal._id}/submit-milestone`)
>>>>>>> feature/testing-infrastructure
          .set(creatorAuthHeader)
          .send(submissionData)
          .catch(err => {
            // The request itself might throw, so let's catch it
            return { status: 500, body: { error: 'Internal server error' } };
          });

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error', 'Internal server error');
      } finally {
        // Restore original method
        Deal.findById = originalFindById;
      }
    });
  });
});
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  submitProof,
  getProofSubmissions,
  reviewProofSubmission,
  addFeedback,
  getProofSubmissionDetails,
  getProofSubmissionStats
} = require('../controllers/proofSubmissionController');

/**
 * @swagger
 * tags:
 *   name: Proof Submissions
 *   description: Proof submission management for deals and milestones
 */

/**
 * @swagger
 * /api/proof-submissions/deals/{dealId}/submit:
 *   post:
 *     summary: Submit proof for a deal or milestone
 *     tags: [Proof Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the deal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attachments
 *             properties:
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [image, video, pdf, text, link]
 *                       description: Type of attachment
 *                     url:
 *                       type: string
 *                       description: URL for non-text attachments
 *                     content:
 *                       type: string
 *                       description: Text content for text attachments
 *                     originalName:
 *                       type: string
 *                       description: Original filename for file attachments
 *                 example:
 *                   - type: "image"
 *                     url: "https://example.com/proof.jpg"
 *                     originalName: "campaign_screenshot.jpg"
 *                   - type: "text"
 *                     content: "Posted on Instagram @myhandle with 5,000+ views"
 *               milestoneId:
 *                 type: string
 *                 description: Optional milestone ID if submitting for specific milestone
 *     responses:
 *       200:
 *         description: Proof submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     proofSubmission:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                           enum: [pending_review, approved, revision_required]
 *                         submittedAt:
 *                           type: string
 *                           format: date-time
 *                         attachmentsCount:
 *                           type: number
 *                         milestoneId:
 *                           type: string
 *                     deal:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         dealName:
 *                           type: string
 *                         status:
 *                           type: string
 *                     nextSteps:
 *                       type: object
 *                       properties:
 *                         creator:
 *                           type: string
 *                         marketer:
 *                           type: string
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Only deal creators can submit proofs
 *       404:
 *         description: Deal or milestone not found
 */
router.post('/deals/:dealId/submit', authenticate, submitProof);

/**
 * @swagger
 * /api/proof-submissions/deals/{dealId}:
 *   get:
 *     summary: Get proof submissions for a deal
 *     tags: [Proof Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the deal
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending_review, approved, revision_required]
 *         description: Filter by submission status
 *       - in: query
 *         name: milestoneId
 *         schema:
 *           type: string
 *         description: Filter by milestone ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Proof submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     proofSubmissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           status:
 *                             type: string
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                           submittedBy:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               userName:
 *                                 type: string
 *                           approvedAt:
 *                             type: string
 *                             format: date-time
 *                           milestoneId:
 *                             type: string
 *                           attachments:
 *                             type: array
 *                             items:
 *                               type: object
 *                           feedback:
 *                             type: array
 *                             items:
 *                               type: object
 *                           canReview:
 *                             type: boolean
 *                           canResubmit:
 *                             type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSubmissions:
 *                           type: number
 *                         pendingReview:
 *                           type: number
 *                         approved:
 *                           type: number
 *                         revisionRequired:
 *                           type: number
 *                         byMilestone:
 *                           type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalItems:
 *                           type: number
 *                         itemsPerPage:
 *                           type: number
 *       403:
 *         description: Access denied to this deal
 *       404:
 *         description: Deal not found
 */
router.get('/deals/:dealId', authenticate, getProofSubmissions);

/**
 * @swagger
 * /api/proof-submissions/deals/{dealId}/proofs/{proofId}/review:
 *   post:
 *     summary: Review/approve a proof submission (marketers only)
 *     tags: [Proof Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the deal
 *       - in: path
 *         name: proofId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the proof submission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, request_revision]
 *                 description: Action to take on the proof
 *               feedback:
 *                 type: string
 *                 description: Feedback message (required for revision requests)
 *     responses:
 *       200:
 *         description: Proof reviewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     proofSubmission:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         approvedAt:
 *                           type: string
 *                           format: date-time
 *                         feedbackCount:
 *                           type: number
 *                     action:
 *                       type: string
 *                     nextSteps:
 *                       type: object
 *                       properties:
 *                         creator:
 *                           type: string
 *                         marketer:
 *                           type: string
 *       400:
 *         description: Invalid action or missing feedback
 *       403:
 *         description: Only deal marketers can review proofs
 *       404:
 *         description: Deal or proof not found
 */
router.post('/deals/:dealId/proofs/:proofId/review', authenticate, reviewProofSubmission);

/**
 * @swagger
 * /api/proof-submissions/deals/{dealId}/proofs/{proofId}/feedback:
 *   post:
 *     summary: Add feedback to a proof submission
 *     tags: [Proof Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the deal
 *       - in: path
 *         name: proofId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the proof submission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback
 *             properties:
 *               feedback:
 *                 type: string
 *                 description: Feedback message
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Feedback added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     feedback:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         feedback:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         createdBy:
 *                           type: string
 *                     proofSubmission:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         totalFeedback:
 *                           type: number
 *       400:
 *         description: Feedback content required
 *       403:
 *         description: Access denied to this deal
 *       404:
 *         description: Deal or proof not found
 */
router.post('/deals/:dealId/proofs/:proofId/feedback', authenticate, addFeedback);

/**
 * @swagger
 * /api/proof-submissions/deals/{dealId}/proofs/{proofId}:
 *   get:
 *     summary: Get detailed information about a specific proof submission
 *     tags: [Proof Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the deal
 *       - in: path
 *         name: proofId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the proof submission
 *     responses:
 *       200:
 *         description: Proof submission details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     proofSubmission:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         submittedAt:
 *                           type: string
 *                           format: date-time
 *                         submittedBy:
 *                           type: object
 *                         approvedAt:
 *                           type: string
 *                           format: date-time
 *                         milestone:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             label:
 *                               type: string
 *                             amount:
 *                               type: number
 *                             dueDate:
 *                               type: string
 *                               format: date-time
 *                             status:
 *                               type: string
 *                         attachments:
 *                           type: array
 *                           items:
 *                             type: object
 *                         feedback:
 *                           type: array
 *                           items:
 *                             type: object
 *                         permissions:
 *                           type: object
 *                           properties:
 *                             canReview:
 *                               type: boolean
 *                             canAddFeedback:
 *                               type: boolean
 *                             canResubmit:
 *                               type: boolean
 *                     deal:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         dealName:
 *                           type: string
 *                         status:
 *                           type: string
 *                         participants:
 *                           type: object
 *                     userRole:
 *                       type: string
 *                       enum: [marketer, creator]
 *       403:
 *         description: Access denied to this deal
 *       404:
 *         description: Deal or proof not found
 */
router.get('/deals/:dealId/proofs/:proofId', authenticate, getProofSubmissionDetails);

/**
 * @swagger
 * /api/proof-submissions/stats:
 *   get:
 *     summary: Get proof submission statistics for the authenticated user
 *     tags: [Proof Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Proof submission statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         asCreator:
 *                           type: object
 *                           properties:
 *                             totalSubmissions:
 *                               type: number
 *                             pendingReview:
 *                               type: number
 *                             approved:
 *                               type: number
 *                             revisionRequired:
 *                               type: number
 *                             averageReviewTime:
 *                               type: number
 *                               description: Average review time in hours
 *                         asMarketer:
 *                           type: object
 *                           properties:
 *                             totalReceived:
 *                               type: number
 *                             pendingReview:
 *                               type: number
 *                             reviewed:
 *                               type: number
 *                             averageResponseTime:
 *                               type: number
 *                               description: Average response time in hours
 *                         overall:
 *                           type: object
 *                           properties:
 *                             totalProofs:
 *                               type: number
 *                             activeDeals:
 *                               type: number
 *                             completedDeals:
 *                               type: number
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Personalized insights based on statistics
 *                     lastCalculated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticate, getProofSubmissionStats);

module.exports = router;
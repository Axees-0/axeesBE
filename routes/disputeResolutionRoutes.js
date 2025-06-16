const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  createDispute,
  addDisputeMessage,
  resolveDispute,
  getDisputeDetails,
  getUserDisputes
} = require('../controllers/disputeResolutionController');

/**
 * @swagger
 * tags:
 *   name: Dispute Resolution
 *   description: Comprehensive dispute resolution workflow for deals (Bug #21)
 */

/**
 * @swagger
 * /api/deals/{dealId}/disputes:
 *   post:
 *     summary: Create a new dispute for a deal
 *     tags: [Dispute Resolution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - title
 *               - description
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [quality_issue, deadline_missed, scope_disagreement, payment_issue, communication_breakdown, other]
 *                 description: Dispute category
 *               title:
 *                 type: string
 *                 maxLength: 100
 *                 description: Brief dispute title
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Detailed dispute description
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [file, link, text]
 *                     url:
 *                       type: string
 *                     content:
 *                       type: string
 *                     description:
 *                       type: string
 *                 description: Supporting evidence for the dispute
 *               milestoneId:
 *                 type: string
 *                 description: Specific milestone this dispute relates to (optional)
 *               requestedOutcome:
 *                 type: string
 *                 enum: [release_full_payment, release_partial_payment, refund_full_payment, refund_partial_payment, continue_work, cancel_deal]
 *                 description: Desired resolution outcome
 *               urgency:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Dispute urgency level
 *     responses:
 *       200:
 *         description: Dispute created successfully
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
 *                     dispute:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         disputeNumber:
 *                           type: string
 *                         category:
 *                           type: string
 *                         title:
 *                           type: string
 *                         status:
 *                           type: string
 *                         urgency:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         escalationDate:
 *                           type: string
 *                           format: date-time
 *                     deal:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         dealNumber:
 *                           type: string
 *                         status:
 *                           type: string
 *                     nextSteps:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Deal not found
 */
router.post('/:dealId/disputes', authenticate, createDispute);

/**
 * @swagger
 * /api/deals/{dealId}/disputes/{disputeId}/messages:
 *   post:
 *     summary: Add a message to an existing dispute
 *     tags: [Dispute Resolution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dispute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Message content
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [file, image, document]
 *                     url:
 *                       type: string
 *                     name:
 *                       type: string
 *                 description: Message attachments
 *               isAdminMessage:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is an admin/mediator message
 *     responses:
 *       200:
 *         description: Message added successfully
 *       400:
 *         description: Invalid message content
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Deal or dispute not found
 */
router.post('/:dealId/disputes/:disputeId/messages', authenticate, addDisputeMessage);

/**
 * @swagger
 * /api/deals/{dealId}/disputes/{disputeId}/resolve:
 *   post:
 *     summary: Resolve a dispute (admin/mediator only)
 *     tags: [Dispute Resolution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dispute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - outcome
 *               - resolutionSummary
 *             properties:
 *               outcome:
 *                 type: string
 *                 enum: [release_full_payment, release_partial_payment, refund_full_payment, refund_partial_payment, continue_work, cancel_deal]
 *                 description: Resolution outcome
 *               resolutionSummary:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Summary of the resolution decision
 *               paymentActions:
 *                 type: object
 *                 properties:
 *                   releasePayment:
 *                     type: boolean
 *                     description: Whether to release escrowed payments
 *                   processRefund:
 *                     type: boolean
 *                     description: Whether to process refunds
 *                   holdPayment:
 *                     type: boolean
 *                     description: Whether to continue holding payments
 *                   partialAmount:
 *                     type: number
 *                     description: Partial amount for partial releases/refunds
 *                 description: Payment actions to execute
 *               adminNotes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Internal admin notes about the resolution
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
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
 *                     dispute:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         disputeNumber:
 *                           type: string
 *                         status:
 *                           type: string
 *                         outcome:
 *                           type: string
 *                         resolvedAt:
 *                           type: string
 *                           format: date-time
 *                     resolution:
 *                       type: object
 *                       description: Resolution details
 *                     paymentResults:
 *                       type: object
 *                       properties:
 *                         paymentsReleased:
 *                           type: array
 *                         refundsProcessed:
 *                           type: array
 *                         paymentsHeld:
 *                           type: array
 *                         errors:
 *                           type: array
 *                     deal:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         unresolvedDisputes:
 *                           type: number
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Deal or dispute not found
 */
router.post('/:dealId/disputes/:disputeId/resolve', authenticate, resolveDispute);

/**
 * @swagger
 * /api/deals/{dealId}/disputes/{disputeId}:
 *   get:
 *     summary: Get detailed information about a specific dispute
 *     tags: [Dispute Resolution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dispute ID
 *     responses:
 *       200:
 *         description: Dispute details retrieved successfully
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
 *                     dispute:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         disputeNumber:
 *                           type: string
 *                         category:
 *                           type: string
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                         status:
 *                           type: string
 *                         urgency:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         daysOpen:
 *                           type: number
 *                         daysUntilEscalation:
 *                           type: number
 *                         timeline:
 *                           type: array
 *                           items:
 *                             type: object
 *                         messages:
 *                           type: array
 *                           items:
 *                             type: object
 *                         resolutionData:
 *                           type: object
 *                     deal:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         dealNumber:
 *                           type: string
 *                         dealName:
 *                           type: string
 *                         status:
 *                           type: string
 *                         totalAmount:
 *                           type: number
 *                     participants:
 *                       type: object
 *                       properties:
 *                         creator:
 *                           type: object
 *                         marketer:
 *                           type: object
 *                     milestone:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         status:
 *                           type: string
 *                         dueDate:
 *                           type: string
 *                           format: date-time
 *                     relatedPayments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canAddMessages:
 *                           type: boolean
 *                         canResolve:
 *                           type: boolean
 *                         canViewTimeline:
 *                           type: boolean
 *                         canAddEvidence:
 *                           type: boolean
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Deal or dispute not found
 */
router.get('/:dealId/disputes/:disputeId', authenticate, getDisputeDetails);

/**
 * @swagger
 * /api/disputes:
 *   get:
 *     summary: Get all disputes for the authenticated user
 *     tags: [Dispute Resolution]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, under_review, mediation, resolved, escalated, cancelled]
 *         description: Filter by dispute status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [quality_issue, deadline_missed, scope_disagreement, payment_issue, communication_breakdown, other]
 *         description: Filter by dispute category
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
 *         description: Number of disputes per page
 *     responses:
 *       200:
 *         description: User disputes retrieved successfully
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
 *                     disputes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           disputeId:
 *                             type: string
 *                           disputeNumber:
 *                             type: string
 *                           title:
 *                             type: string
 *                           category:
 *                             type: string
 *                           status:
 *                             type: string
 *                           urgency:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           lastActivity:
 *                             type: string
 *                             format: date-time
 *                           deal:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               dealNumber:
 *                                 type: string
 *                               dealName:
 *                                 type: string
 *                           otherParty:
 *                             type: string
 *                             description: Username of the other party
 *                           messagesCount:
 *                             type: number
 *                           isResolved:
 *                             type: boolean
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *       401:
 *         description: Authentication required
 */
router.get('/disputes', authenticate, getUserDisputes);

module.exports = router;
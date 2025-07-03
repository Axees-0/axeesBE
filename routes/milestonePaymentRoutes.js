const express = require('express');
const router = express.Router();
const milestonePaymentController = require('../controllers/milestonePaymentController');

/**
 * @swagger
 * tags:
 *   name: Milestone Payments
 *   description: Milestone-based payment management for deals
 */

/**
 * @swagger
 * /milestone-payments/create:
 *   post:
 *     summary: Create milestone payment structure for a deal
 *     tags: [Milestone Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealId
 *               - milestones
 *             properties:
 *               dealId:
 *                 type: string
 *                 description: ID of the deal
 *               milestones:
 *                 type: array
 *                 description: Array of milestone definitions
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - description
 *                     - percentage
 *                   properties:
 *                     title:
 *                       type: string
 *                       description: Milestone title
 *                       example: "Content Creation"
 *                     description:
 *                       type: string
 *                       description: Detailed description of the milestone
 *                       example: "Create and submit initial content draft"
 *                     percentage:
 *                       type: number
 *                       minimum: 1
 *                       maximum: 100
 *                       description: Percentage of total deal amount for this milestone
 *                       example: 50
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *                       description: Optional due date for the milestone
 *                     requirements:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of requirements for milestone completion
 *                       example: ["Submit content", "Get approval", "Make revisions"]
 *     responses:
 *       201:
 *         description: Milestone payment structure created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     dealId:
 *                       type: string
 *                     milestonePayments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MilestonePayment'
 *                     totalAmount:
 *                       type: number
 *                     paymentStructure:
 *                       type: string
 *                       enum: [milestone]
 *       400:
 *         description: Invalid milestone data or percentages don't total 100%
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to manage this deal
 *       404:
 *         description: Deal not found
 */
router.post('/create', milestonePaymentController.createMilestonePayments);

/**
 * @swagger
 * /milestone-payments/complete:
 *   post:
 *     summary: Complete a milestone and trigger payment
 *     tags: [Milestone Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealId
 *               - milestoneId
 *             properties:
 *               dealId:
 *                 type: string
 *                 description: ID of the deal
 *               milestoneId:
 *                 type: string
 *                 description: ID of the milestone to complete
 *               proofOfCompletion:
 *                 type: object
 *                 description: Evidence of milestone completion
 *                 properties:
 *                   files:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of file URLs as proof
 *                   links:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of relevant links
 *                   description:
 *                     type: string
 *                     description: Text description of completion
 *               notes:
 *                 type: string
 *                 description: Additional notes about the completion
 *     responses:
 *       200:
 *         description: Milestone completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     milestone:
 *                       $ref: '#/components/schemas/MilestonePayment'
 *                     paymentReleased:
 *                       type: boolean
 *                       description: Whether payment was automatically released
 *                     nextMilestone:
 *                       $ref: '#/components/schemas/MilestonePayment'
 *       400:
 *         description: Milestone already completed or previous milestones not completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only marketer can complete milestones
 *       404:
 *         description: Deal or milestone not found
 */
router.post('/complete', milestonePaymentController.completeMilestone);

/**
 * @swagger
 * /milestone-payments/approve:
 *   post:
 *     summary: Approve milestone payment (by creator)
 *     tags: [Milestone Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealId
 *               - milestoneId
 *             properties:
 *               dealId:
 *                 type: string
 *                 description: ID of the deal
 *               milestoneId:
 *                 type: string
 *                 description: ID of the milestone to approve payment for
 *     responses:
 *       200:
 *         description: Milestone payment approved and released successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     milestone:
 *                       $ref: '#/components/schemas/MilestonePayment'
 *                     payment:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         status:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Milestone payment not pending approval
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only creator can approve milestone payments
 *       404:
 *         description: Deal or milestone not found
 */
router.post('/approve', milestonePaymentController.approveMilestonePayment);

/**
 * @swagger
 * /milestone-payments/status/{dealId}:
 *   get:
 *     summary: Get milestone payment status for a deal
 *     tags: [Milestone Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the deal
 *     responses:
 *       200:
 *         description: Milestone status retrieved successfully
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
 *                     deal:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         status:
 *                           type: string
 *                         creator:
 *                           $ref: '#/components/schemas/User'
 *                         marketer:
 *                           $ref: '#/components/schemas/User'
 *                     milestones:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MilestonePayment'
 *                     progress:
 *                       type: object
 *                       properties:
 *                         completedMilestones:
 *                           type: number
 *                           description: Number of completed milestones
 *                         totalMilestones:
 *                           type: number
 *                           description: Total number of milestones
 *                         progressPercentage:
 *                           type: number
 *                           description: Overall completion percentage
 *                         totalReleased:
 *                           type: number
 *                           description: Total amount released to marketer
 *                         pendingRelease:
 *                           type: number
 *                           description: Amount pending approval for release
 *                     userRole:
 *                       type: string
 *                       enum: [creator, marketer]
 *                       description: Role of the authenticated user in this deal
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view this deal
 *       404:
 *         description: Deal not found
 */
router.get('/status/:dealId', milestonePaymentController.getMilestoneStatus);

/**
 * @swagger
 * components:
 *   schemas:
 *     MilestonePayment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the milestone
 *         title:
 *           type: string
 *           description: Milestone title
 *         description:
 *           type: string
 *           description: Detailed description
 *         percentage:
 *           type: number
 *           description: Percentage of total deal amount
 *         amount:
 *           type: number
 *           description: Calculated amount for this milestone
 *         order:
 *           type: number
 *           description: Order/sequence of the milestone
 *         status:
 *           type: string
 *           enum: [pending, completed]
 *           description: Completion status
 *         paymentStatus:
 *           type: string
 *           enum: [pending, pending_approval, released]
 *           description: Payment release status
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Optional due date
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: When milestone was completed
 *         paymentReleasedAt:
 *           type: string
 *           format: date-time
 *           description: When payment was released
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: List of completion requirements
 *         proofOfCompletion:
 *           type: object
 *           description: Evidence of completion
 *         completionNotes:
 *           type: string
 *           description: Notes added when completing
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When milestone was created
 */

module.exports = router;
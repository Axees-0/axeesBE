const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  createMilestoneStructure,
  fundMilestone,
  releaseMilestonePayment,
  getMilestonePaymentStatus,
  scheduleAutomaticRelease
} = require('../controllers/milestonePaymentController');

/**
 * @swagger
 * tags:
 *   name: Milestone Payments
 *   description: Advanced milestone-based payment management
 */

/**
 * @swagger
 * /api/milestone-payments/deals/{dealId}/structure:
 *   post:
 *     summary: Create milestone payment structure for a deal
 *     tags: [Milestone Payments]
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
 *             properties:
 *               template:
 *                 type: string
 *                 enum: [equal_split, front_loaded, back_loaded, custom]
 *                 default: equal_split
 *                 description: Milestone distribution template
 *               customPercentages:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Custom percentages for milestone amounts (required if template is custom)
 *               milestoneDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Milestone name
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *                       description: Milestone due date
 *                     deliverables:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of deliverables for this milestone
 *                     description:
 *                       type: string
 *                       description: Milestone description
 *                     bonus:
 *                       type: number
 *                       description: Additional bonus amount
 *                     color:
 *                       type: string
 *                       description: Visual color for milestone
 *               autoReleaseDays:
 *                 type: number
 *                 default: 7
 *                 description: Days after due date for automatic release
 *     responses:
 *       200:
 *         description: Milestone structure created successfully
 *       400:
 *         description: Invalid request or milestone structure
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Deal not found
 */
router.post('/deals/:dealId/structure', authenticate, createMilestoneStructure);

/**
 * @swagger
 * /api/milestone-payments/deals/{dealId}/milestones/{milestoneId}/fund:
 *   post:
 *     summary: Fund a specific milestone
 *     tags: [Milestone Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *               includeFee:
 *                 type: boolean
 *                 default: true
 *                 description: Include platform fee in payment
 *     responses:
 *       200:
 *         description: Milestone funded successfully
 *       400:
 *         description: Payment failed or milestone already funded
 *       403:
 *         description: Unauthorized - only marketer can fund
 *       404:
 *         description: Deal or milestone not found
 */
router.post('/deals/:dealId/milestones/:milestoneId/fund', authenticate, fundMilestone);

/**
 * @swagger
 * /api/milestone-payments/deals/{dealId}/milestones/{milestoneId}/release:
 *   post:
 *     summary: Release milestone payment to creator
 *     tags: [Milestone Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               releaseType:
 *                 type: string
 *                 enum: [manual, automatic]
 *                 default: manual
 *                 description: Type of release
 *               reason:
 *                 type: string
 *                 description: Reason for release
 *     responses:
 *       200:
 *         description: Milestone payment released successfully
 *       400:
 *         description: Milestone not ready for release
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Deal or milestone not found
 */
router.post('/deals/:dealId/milestones/:milestoneId/release', authenticate, releaseMilestonePayment);

/**
 * @swagger
 * /api/milestone-payments/deals/{dealId}/status:
 *   get:
 *     summary: Get comprehensive milestone payment status
 *     tags: [Milestone Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *     responses:
 *       200:
 *         description: Milestone payment status retrieved successfully
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
 *                         dealNumber:
 *                           type: string
 *                         dealName:
 *                           type: string
 *                         status:
 *                           type: string
 *                         template:
 *                           type: string
 *                     milestones:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           order:
 *                             type: number
 *                           amount:
 *                             type: number
 *                           percentage:
 *                             type: number
 *                           status:
 *                             type: string
 *                           dueDate:
 *                             type: string
 *                             format: date-time
 *                           canRelease:
 *                             type: boolean
 *                           isOverdue:
 *                             type: boolean
 *                           payment:
 *                             type: object
 *                           transaction:
 *                             type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalMilestones:
 *                           type: number
 *                         completedMilestones:
 *                           type: number
 *                         fundedMilestones:
 *                           type: number
 *                         totalAmount:
 *                           type: number
 *                         fundedAmount:
 *                           type: number
 *                         releasedAmount:
 *                           type: number
 *                         escrowedAmount:
 *                           type: number
 *                         completionPercentage:
 *                           type: number
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canFund:
 *                           type: boolean
 *                         canRelease:
 *                           type: boolean
 *                         canModify:
 *                           type: boolean
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Deal not found
 */
router.get('/deals/:dealId/status', authenticate, getMilestonePaymentStatus);

/**
 * @swagger
 * /api/milestone-payments/deals/{dealId}/milestones/{milestoneId}/schedule-release:
 *   post:
 *     summary: Schedule automatic release for a milestone
 *     tags: [Milestone Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - releaseDate
 *             properties:
 *               releaseDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time for automatic release
 *     responses:
 *       200:
 *         description: Automatic release scheduled successfully
 *       400:
 *         description: Invalid release date
 *       403:
 *         description: Unauthorized - only marketer can schedule
 *       404:
 *         description: Deal or milestone not found
 */
router.post('/deals/:dealId/milestones/:milestoneId/schedule-release', authenticate, scheduleAutomaticRelease);

module.exports = router;
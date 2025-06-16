const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  checkReleaseEligibility,
  triggerAutomaticRelease,
  scheduleAutomaticRelease,
  getAutomaticReleaseStatus
} = require('../controllers/automaticPaymentReleaseController');

/**
 * @swagger
 * tags:
 *   name: Automatic Payment Releases
 *   description: Comprehensive automatic payment release management
 */

/**
 * @swagger
 * /api/auto-releases/deals/{dealId}/eligibility:
 *   get:
 *     summary: Check if payments are eligible for automatic release
 *     tags: [Automatic Payment Releases]
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
 *         description: Release eligibility checked successfully
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
 *                         completedAt:
 *                           type: string
 *                           format: date-time
 *                     escrow:
 *                       type: object
 *                       properties:
 *                         totalEscrowed:
 *                           type: number
 *                         eligibleForRelease:
 *                           type: number
 *                         pendingRelease:
 *                           type: number
 *                         earningsCount:
 *                           type: number
 *                     rules:
 *                       type: object
 *                       properties:
 *                         gracePeriodDays:
 *                           type: number
 *                         maxEscrowDays:
 *                           type: number
 *                         requiresApproval:
 *                           type: boolean
 *                         dealType:
 *                           type: string
 *                     eligibilityDetails:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           earningId:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           escrowedAt:
 *                             type: string
 *                             format: date-time
 *                           daysSinceEscrowed:
 *                             type: number
 *                           isEligible:
 *                             type: boolean
 *                           releaseDate:
 *                             type: string
 *                             format: date-time
 *                           reason:
 *                             type: string
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canTriggerRelease:
 *                           type: boolean
 *                         canViewDetails:
 *                           type: boolean
 *                         canScheduleRelease:
 *                           type: boolean
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Deal not found
 */
router.get('/deals/:dealId/eligibility', authenticate, checkReleaseEligibility);

/**
 * @swagger
 * /api/auto-releases/deals/{dealId}/trigger:
 *   post:
 *     summary: Trigger automatic release for eligible payments
 *     tags: [Automatic Payment Releases]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               earningIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific earning IDs to release (optional - releases all eligible if empty)
 *               releaseType:
 *                 type: string
 *                 enum: [manual, automatic, scheduled]
 *                 default: manual
 *                 description: Type of release trigger
 *               reason:
 *                 type: string
 *                 description: Reason for triggering release
 *               forceRelease:
 *                 type: boolean
 *                 default: false
 *                 description: Force release even if not eligible (admin only)
 *     responses:
 *       200:
 *         description: Automatic payment release completed
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
 *                         status:
 *                           type: string
 *                     release:
 *                       type: object
 *                       properties:
 *                         totalReleased:
 *                           type: number
 *                         totalFailed:
 *                           type: number
 *                         releasedCount:
 *                           type: number
 *                         failedCount:
 *                           type: number
 *                         releaseType:
 *                           type: string
 *                     details:
 *                       type: object
 *                       properties:
 *                         releasedEarnings:
 *                           type: array
 *                           items:
 *                             type: object
 *                         failedReleases:
 *                           type: array
 *                           items:
 *                             type: object
 *                     remainingEscrow:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: number
 *                         amount:
 *                           type: number
 *       400:
 *         description: Invalid request or no eligible payments
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Deal or earnings not found
 */
router.post('/deals/:dealId/trigger', authenticate, triggerAutomaticRelease);

/**
 * @swagger
 * /api/auto-releases/deals/{dealId}/schedule:
 *   post:
 *     summary: Schedule future automatic release for payments
 *     tags: [Automatic Payment Releases]
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
 *               - releaseDate
 *             properties:
 *               releaseDate:
 *                 type: string
 *                 format: date-time
 *                 description: Date and time for automatic release
 *               earningIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific earning IDs to schedule (optional - schedules all if empty)
 *               reason:
 *                 type: string
 *                 description: Reason for scheduling release
 *               notifyParties:
 *                 type: boolean
 *                 default: true
 *                 description: Send notifications to deal participants
 *     responses:
 *       200:
 *         description: Automatic release scheduled successfully
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
 *                     scheduled:
 *                       type: object
 *                       properties:
 *                         releaseDate:
 *                           type: string
 *                           format: date-time
 *                         earningsCount:
 *                           type: number
 *                         totalAmount:
 *                           type: number
 *                         scheduledBy:
 *                           type: string
 *                     scheduledEarnings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           earningId:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           scheduledDate:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Invalid release date or no eligible earnings
 *       403:
 *         description: Unauthorized - only marketer can schedule
 *       404:
 *         description: Deal not found
 */
router.post('/deals/:dealId/schedule', authenticate, scheduleAutomaticRelease);

/**
 * @swagger
 * /api/auto-releases/deals/{dealId}/status:
 *   get:
 *     summary: Get comprehensive automatic release status for a deal
 *     tags: [Automatic Payment Releases]
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
 *         description: Automatic release status retrieved successfully
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
 *                         completedAt:
 *                           type: string
 *                           format: date-time
 *                     rules:
 *                       type: object
 *                       properties:
 *                         gracePeriodDays:
 *                           type: number
 *                         maxEscrowDays:
 *                           type: number
 *                         requiresApproval:
 *                           type: boolean
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEarnings:
 *                           type: number
 *                         totalAmount:
 *                           type: number
 *                         escrowedCount:
 *                           type: number
 *                         escrowedAmount:
 *                           type: number
 *                         releasedCount:
 *                           type: number
 *                         releasedAmount:
 *                           type: number
 *                         eligibleCount:
 *                           type: number
 *                         eligibleAmount:
 *                           type: number
 *                         scheduledCount:
 *                           type: number
 *                         scheduledAmount:
 *                           type: number
 *                     escrowStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           earningId:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           escrowedAt:
 *                             type: string
 *                             format: date-time
 *                           daysSinceEscrowed:
 *                             type: number
 *                           status:
 *                             type: string
 *                             enum: [pending, eligible, grace_period, scheduled, overdue]
 *                           nextReleaseDate:
 *                             type: string
 *                             format: date-time
 *                           milestoneId:
 *                             type: string
 *                           scheduledBy:
 *                             type: string
 *                           scheduleReason:
 *                             type: string
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canTriggerRelease:
 *                           type: boolean
 *                         canScheduleRelease:
 *                           type: boolean
 *                         canForceRelease:
 *                           type: boolean
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Deal not found
 */
router.get('/deals/:dealId/status', authenticate, getAutomaticReleaseStatus);

module.exports = router;
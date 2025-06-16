const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  sendOfferStatusNotification,
  sendBulkStatusNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationAnalytics
} = require('../controllers/offerStatusNotificationController');

/**
 * @swagger
 * tags:
 *   name: Offer Status Notifications
 *   description: Comprehensive notification system for offer and deal status updates
 */

/**
 * @swagger
 * /api/offer-notifications/send:
 *   post:
 *     summary: Send comprehensive offer status notification
 *     tags: [Offer Status Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - notificationType
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Recipient user ID
 *               notificationType:
 *                 type: string
 *                 enum: [OFFER_CREATED, OFFER_ACCEPTED, OFFER_REJECTED, OFFER_NEGOTIATION, DEAL_PAYMENT_REQUIRED, DEAL_IN_PROGRESS, MILESTONE_DUE, CONTENT_SUBMITTED, CONTENT_APPROVED, CONTENT_REVISION_REQUIRED, DEAL_COMPLETED, PAYMENT_RELEASED]
 *                 description: Type of notification to send
 *               dealId:
 *                 type: string
 *                 description: Associated deal ID
 *               offerId:
 *                 type: string
 *                 description: Associated offer ID
 *               data:
 *                 type: object
 *                 properties:
 *                   offerName:
 *                     type: string
 *                   dealName:
 *                     type: string
 *                   marketerName:
 *                     type: string
 *                   creatorName:
 *                     type: string
 *                   paymentAmount:
 *                     type: number
 *                   platforms:
 *                     type: array
 *                     items:
 *                       type: string
 *                   message:
 *                     type: string
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                 description: Additional data for notification content
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [push, email, in_app, sms]
 *                 default: [push, in_app]
 *                 description: Notification channels to use
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Notification priority level
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 description: Schedule notification for future delivery
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: User not found
 */
router.post('/send', authenticate, sendOfferStatusNotification);

/**
 * @swagger
 * /api/offer-notifications/bulk:
 *   post:
 *     summary: Send multiple notifications in bulk
 *     tags: [Offer Status Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notifications
 *             properties:
 *               notifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     notificationType:
 *                       type: string
 *                     data:
 *                       type: object
 *                     channels:
 *                       type: array
 *                       items:
 *                         type: string
 *                     priority:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk notifications processed
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
 *                     total:
 *                       type: number
 *                     successful:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/bulk', authenticate, sendBulkStatusNotifications);

/**
 * @swagger
 * /api/offer-notifications/preferences:
 *   get:
 *     summary: Get user notification preferences
 *     tags: [Offer Status Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
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
 *                     preferences:
 *                       type: object
 *                       properties:
 *                         push:
 *                           type: boolean
 *                         email:
 *                           type: boolean
 *                         in_app:
 *                           type: boolean
 *                         sms:
 *                           type: boolean
 *                         frequency:
 *                           type: string
 *                           enum: [immediate, hourly, daily, weekly]
 *                         quietHours:
 *                           type: object
 *                           properties:
 *                             enabled:
 *                               type: boolean
 *                             start:
 *                               type: string
 *                             end:
 *                               type: string
 *                             timezone:
 *                               type: string
 *                         categories:
 *                           type: object
 *                           properties:
 *                             offers:
 *                               type: boolean
 *                             payments:
 *                               type: boolean
 *                             milestones:
 *                               type: boolean
 *                             content:
 *                               type: boolean
 *                             reminders:
 *                               type: boolean
 *                     availableTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *                     channels:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: User not found
 */
router.get('/preferences', authenticate, getNotificationPreferences);

/**
 * @swagger
 * /api/offer-notifications/preferences:
 *   put:
 *     summary: Update user notification preferences
 *     tags: [Offer Status Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - preferences
 *             properties:
 *               preferences:
 *                 type: object
 *                 properties:
 *                   push:
 *                     type: boolean
 *                     description: Enable push notifications
 *                   email:
 *                     type: boolean
 *                     description: Enable email notifications
 *                   in_app:
 *                     type: boolean
 *                     description: Enable in-app notifications
 *                   sms:
 *                     type: boolean
 *                     description: Enable SMS notifications
 *                   frequency:
 *                     type: string
 *                     enum: [immediate, hourly, daily, weekly]
 *                     description: Notification frequency
 *                   quietHours:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       start:
 *                         type: string
 *                         description: Quiet hours start time (24h format)
 *                       end:
 *                         type: string
 *                         description: Quiet hours end time (24h format)
 *                       timezone:
 *                         type: string
 *                         description: User timezone
 *                   categories:
 *                     type: object
 *                     properties:
 *                       offers:
 *                         type: boolean
 *                         description: Offer-related notifications
 *                       payments:
 *                         type: boolean
 *                         description: Payment-related notifications
 *                       milestones:
 *                         type: boolean
 *                         description: Milestone-related notifications
 *                       content:
 *                         type: boolean
 *                         description: Content-related notifications
 *                       reminders:
 *                         type: boolean
 *                         description: Reminder notifications
 *     responses:
 *       200:
 *         description: Notification preferences updated successfully
 *       400:
 *         description: Invalid preferences data
 *       404:
 *         description: User not found
 */
router.put('/preferences', authenticate, updateNotificationPreferences);

/**
 * @swagger
 * /api/offer-notifications/analytics:
 *   get:
 *     summary: Get notification analytics and history
 *     tags: [Offer Status Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Analytics timeframe
 *     responses:
 *       200:
 *         description: Notification analytics retrieved successfully
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
 *                     timeframe:
 *                       type: string
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           description: Total notifications sent
 *                         unread:
 *                           type: number
 *                           description: Number of unread notifications
 *                         byType:
 *                           type: object
 *                           description: Breakdown by notification type
 *                         byPriority:
 *                           type: object
 *                           description: Breakdown by priority level
 *                         readRate:
 *                           type: string
 *                           description: Percentage of notifications read
 *                         averageResponseTime:
 *                           type: number
 *                           description: Average time to read notifications
 *                         channelPerformance:
 *                           type: object
 *                           description: Performance by channel type
 *                     recentNotifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Recent notifications
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           message:
 *                             type: string
 *                           action:
 *                             type: string
 *                       description: Personalized recommendations
 *       404:
 *         description: User not found
 */
router.get('/analytics', authenticate, getNotificationAnalytics);

module.exports = router;
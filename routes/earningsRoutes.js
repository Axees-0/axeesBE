const express = require('express');
const router = express.Router();
const earningsController = require('../controllers/earningsController');

/**
 * @swagger
 * tags:
 *   name: Earnings
 *   description: User earnings and withdrawal management
 */

/**
 * @swagger
 * /earnings/withdraw/limits:
 *   get:
 *     summary: Get user withdrawal limits and available balance
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal limits retrieved successfully
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
 *                     limits:
 *                       type: object
 *                       properties:
 *                         daily:
 *                           type: object
 *                           properties:
 *                             amount:
 *                               type: number
 *                             currency:
 *                               type: string
 *                         monthly:
 *                           type: object
 *                           properties:
 *                             amount:
 *                               type: number
 *                             currency:
 *                               type: string
 *                         minimum:
 *                           type: object
 *                           properties:
 *                             amount:
 *                               type: number
 *                             currency:
 *                               type: string
 *                         maximum:
 *                           type: object
 *                           properties:
 *                             amount:
 *                               type: number
 *                             currency:
 *                               type: string
 *                     remaining:
 *                       type: object
 *                       properties:
 *                         daily:
 *                           type: number
 *                         monthly:
 *                           type: number
 *                     availableBalance:
 *                       type: number
 *                     totalEarnings:
 *                       type: number
 *                     totalWithdrawn:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/withdraw/limits', earningsController.getWithdrawalLimits);

/**
 * @swagger
 * /earnings/analytics:
 *   get:
 *     summary: Get user earnings analytics and insights
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time period for analytics
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom start date (overrides period)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Custom end date (overrides period)
 *     responses:
 *       200:
 *         description: Earnings analytics retrieved successfully
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
 *                     period:
 *                       type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalEarnings:
 *                           type: number
 *                         totalDeals:
 *                           type: number
 *                         avgDealValue:
 *                           type: number
 *                     earningsOverTime:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           earnings:
 *                             type: number
 *                           deals:
 *                             type: number
 *                     earningsByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           earnings:
 *                             type: number
 *                           deals:
 *                             type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics', earningsController.getEarningsAnalytics);

/**
 * @swagger
 * /earnings/transactions:
 *   get:
 *     summary: Get detailed transaction history for user
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of transactions per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [earning, withdrawal]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, pending, failed, cancelled]
 *         description: Filter by transaction status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions until this date
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [earning, withdrawal]
 *                           amount:
 *                             type: number
 *                           status:
 *                             type: string
 *                           description:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions', earningsController.getTransactionHistory);

module.exports = router;
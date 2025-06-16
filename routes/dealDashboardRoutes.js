const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  getDealDashboard
} = require('../controllers/dealDashboardController');

/**
 * @swagger
 * tags:
 *   name: Deal Dashboard
 *   description: Deal projections, ARR calculations, and performance metrics
 */

/**
 * @swagger
 * /api/deal-dashboard:
 *   get:
 *     summary: Get comprehensive deal dashboard with ARR calculations (Bug #8)
 *     tags: [Deal Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [1m, 3m, 6m, 12m]
 *           default: 12m
 *         description: Time period for analysis
 *       - in: query
 *         name: includeProjections
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to include revenue projections
 *       - in: query
 *         name: userType
 *         schema:
 *           type: string
 *           enum: [marketer, creator]
 *         description: Override user type for admin users
 *     responses:
 *       200:
 *         description: Deal dashboard retrieved successfully
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         timeframe:
 *                           type: string
 *                         periodStart:
 *                           type: string
 *                           format: date-time
 *                         periodEnd:
 *                           type: string
 *                           format: date-time
 *                         userRole:
 *                           type: string
 *                           enum: [marketer, creator]
 *                         totalDeals:
 *                           type: number
 *                         totalOffers:
 *                           type: number
 *                     arr:
 *                       type: object
 *                       properties:
 *                         currentARR:
 *                           type: number
 *                           description: Current Annual Recurring Revenue
 *                         projectedARR:
 *                           type: number
 *                           description: Projected ARR based on current trends
 *                         monthlyRecurringRevenue:
 *                           type: number
 *                           description: Monthly Recurring Revenue (MRR)
 *                         totalContractValue:
 *                           type: number
 *                           description: Total contract value this year
 *                         recurringDealsCount:
 *                           type: number
 *                           description: Number of recurring deals
 *                         totalDealsCount:
 *                           type: number
 *                           description: Total deals this year
 *                         growthRate:
 *                           type: number
 *                           description: Year-over-year growth rate percentage
 *                         averageDealValue:
 *                           type: number
 *                           description: Average value per deal
 *                         breakdown:
 *                           type: object
 *                           properties:
 *                             quarterly:
 *                               type: number
 *                             semiAnnual:
 *                               type: number
 *                             oneTime:
 *                               type: number
 *                     dealMetrics:
 *                       type: object
 *                       properties:
 *                         totalDeals:
 *                           type: number
 *                         activeDeals:
 *                           type: number
 *                         completedDeals:
 *                           type: number
 *                         cancelledDeals:
 *                           type: number
 *                         conversionRate:
 *                           type: number
 *                           description: Offer to deal conversion rate
 *                         totalValue:
 *                           type: number
 *                         averageDealValue:
 *                           type: number
 *                         averageDealDuration:
 *                           type: number
 *                           description: Average deal duration in days
 *                         completionRate:
 *                           type: number
 *                           description: Percentage of deals completed successfully
 *                         payments:
 *                           type: object
 *                           properties:
 *                             totalEscrowed:
 *                               type: number
 *                             totalReleased:
 *                               type: number
 *                             pendingPayments:
 *                               type: number
 *                             releaseRate:
 *                               type: number
 *                     performanceMetrics:
 *                       type: object
 *                       properties:
 *                         thisMonth:
 *                           type: object
 *                           properties:
 *                             deals:
 *                               type: number
 *                             offers:
 *                               type: number
 *                             value:
 *                               type: number
 *                         lastMonth:
 *                           type: object
 *                           properties:
 *                             deals:
 *                               type: number
 *                             offers:
 *                               type: number
 *                             value:
 *                               type: number
 *                         growth:
 *                           type: object
 *                           properties:
 *                             deals:
 *                               type: number
 *                               description: Month-over-month deal growth percentage
 *                             offers:
 *                               type: number
 *                               description: Month-over-month offer growth percentage
 *                             value:
 *                               type: number
 *                               description: Month-over-month value growth percentage
 *                         trends:
 *                           type: object
 *                           properties:
 *                             improving:
 *                               type: boolean
 *                             declining:
 *                               type: boolean
 *                             mixed:
 *                               type: boolean
 *                     revenueProjections:
 *                       type: object
 *                       properties:
 *                         projections:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               month:
 *                                 type: string
 *                               projectedRevenue:
 *                                 type: number
 *                               confidence:
 *                                 type: number
 *                                 description: Confidence level (0-100)
 *                               basedOn:
 *                                 type: string
 *                         methodology:
 *                           type: string
 *                         totalProjected12Months:
 *                           type: number
 *                         averageMonthlyProjection:
 *                           type: number
 *                     monthlyBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           deals:
 *                             type: number
 *                           offers:
 *                             type: number
 *                           revenue:
 *                             type: number
 *                           completedDeals:
 *                             type: number
 *                           conversionRate:
 *                             type: number
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [positive, warning, alert]
 *                           category:
 *                             type: string
 *                           title:
 *                             type: string
 *                           message:
 *                             type: string
 *                           action:
 *                             type: string
 *                     recentActivity:
 *                       type: object
 *                       properties:
 *                         recentDeals:
 *                           type: array
 *                           items:
 *                             type: object
 *                         recentOffers:
 *                           type: array
 *                           items:
 *                             type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, getDealDashboard);

module.exports = router;
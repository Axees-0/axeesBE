const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  getDashboardOverview,
  getUserManagement,
  getDealManagement,
  getFinancialAnalytics,
  getSystemHealth,
  updateUserStatus,
  performDealIntervention,
  generateReport
} = require('../controllers/adminDashboardController');

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Comprehensive administrative dashboard for platform management
 */

/**
 * @swagger
 * /api/admin/dashboard/overview:
 *   get:
 *     summary: Get comprehensive admin dashboard overview
 *     tags: [Admin Dashboard]
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
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include detailed breakdowns
 *     responses:
 *       200:
 *         description: Admin dashboard overview retrieved successfully
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         timeframe:
 *                           type: string
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *                         platform_stats:
 *                           type: object
 *                           properties:
 *                             total_users:
 *                               type: number
 *                             total_deals:
 *                               type: number
 *                             total_offers:
 *                               type: number
 *                             active_users:
 *                               type: number
 *                             activity_rate:
 *                               type: string
 *                             growth_metrics:
 *                               type: object
 *                               properties:
 *                                 new_users:
 *                                   type: number
 *                                 new_deals:
 *                                   type: number
 *                                 new_offers:
 *                                   type: number
 *                         user_metrics:
 *                           type: object
 *                           properties:
 *                             by_role:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             top_creators:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             top_marketers:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             verification_rate:
 *                               type: string
 *                             engagement_metrics:
 *                               type: object
 *                         deal_metrics:
 *                           type: object
 *                           properties:
 *                             by_status:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             completion_metrics:
 *                               type: object
 *                             risk_assessment:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             recent_disputes:
 *                               type: array
 *                               items:
 *                                 type: object
 *                         financial_metrics:
 *                           type: object
 *                           properties:
 *                             earning_stats:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             monthly_revenue:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             escrow_balance:
 *                               type: object
 *                         system_health:
 *                           type: object
 *                           properties:
 *                             database:
 *                               type: object
 *                             performance:
 *                               type: object
 *                             notifications:
 *                               type: object
 *                             background_jobs:
 *                               type: object
 *                         recent_activity:
 *                           type: array
 *                           items:
 *                             type: object
 *                         alerts_and_issues:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                               severity:
 *                                 type: string
 *                                 enum: [low, medium, high, critical]
 *                               message:
 *                                 type: string
 *                               count:
 *                                 type: number
 *                               action_required:
 *                                 type: boolean
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canViewUsers:
 *                           type: boolean
 *                         canModifyUsers:
 *                           type: boolean
 *                         canViewDeals:
 *                           type: boolean
 *                         canInterveneDeal:
 *                           type: boolean
 *                         canViewFinancials:
 *                           type: boolean
 *                         canGenerateReports:
 *                           type: boolean
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       403:
 *         description: Access denied - admin privileges required
 */
router.get('/overview', authenticate, getDashboardOverview);

/**
 * @swagger
 * /api/admin/dashboard/users:
 *   get:
 *     summary: Get user management data with filtering and pagination
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 50
 *           maximum: 100
 *         description: Number of users per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [all, creator, marketer, admin]
 *           default: all
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, verified, unverified, suspended]
 *           default: all
 *         description: Filter by user status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, userName, email, lastActiveAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in userName and email
 *     responses:
 *       200:
 *         description: User management data retrieved successfully
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           role:
 *                             type: string
 *                           isVerified:
 *                             type: boolean
 *                           isSuspended:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           lastActiveAt:
 *                             type: string
 *                             format: date-time
 *                           socialMediaStats:
 *                             type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalCount:
 *                           type: number
 *                         hasNext:
 *                           type: boolean
 *                         hasPrev:
 *                           type: boolean
 *                     filters:
 *                       type: object
 *                       description: Applied filters
 *       403:
 *         description: Access denied - admin privileges required
 */
router.get('/users', authenticate, getUserManagement);

/**
 * @swagger
 * /api/admin/dashboard/deals:
 *   get:
 *     summary: Get deal management data with filtering and risk assessment
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 50
 *           maximum: 100
 *         description: Number of deals per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, active, completed, cancelled, disputed]
 *           default: all
 *         description: Filter by deal status
 *       - in: query
 *         name: risk_level
 *         schema:
 *           type: string
 *           enum: [all, low, medium, high]
 *           default: all
 *         description: Filter by risk level
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, paymentAmount]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in deal name and number
 *     responses:
 *       200:
 *         description: Deal management data retrieved successfully
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
 *                     deals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           dealName:
 *                             type: string
 *                           dealNumber:
 *                             type: string
 *                           status:
 *                             type: string
 *                           riskLevel:
 *                             type: string
 *                             enum: [low, medium, high]
 *                           creatorId:
 *                             type: object
 *                             properties:
 *                               userName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           marketerId:
 *                             type: object
 *                             properties:
 *                               userName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                           paymentInfo:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                     filters:
 *                       type: object
 *       403:
 *         description: Access denied - admin privileges required
 */
router.get('/deals', authenticate, getDealManagement);

/**
 * @swagger
 * /api/admin/dashboard/financials:
 *   get:
 *     summary: Get comprehensive financial analytics and reports
 *     tags: [Admin Dashboard]
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
 *       - in: query
 *         name: breakdown
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Data breakdown granularity
 *       - in: query
 *         name: includeProjections
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include revenue projections
 *     responses:
 *       200:
 *         description: Financial analytics retrieved successfully
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
 *                     breakdown:
 *                       type: string
 *                     revenue_analysis:
 *                       type: object
 *                       description: Revenue breakdown and trends
 *                     transaction_volume:
 *                       type: object
 *                       description: Transaction volume metrics
 *                     fee_breakdown:
 *                       type: object
 *                       description: Platform fee collection
 *                     payout_analysis:
 *                       type: object
 *                       description: Creator payout statistics
 *                     growth_metrics:
 *                       type: object
 *                       description: Financial growth indicators
 *                     projections:
 *                       type: object
 *                       description: Revenue projections (if requested)
 *       403:
 *         description: Access denied - admin privileges required
 */
router.get('/financials', authenticate, getFinancialAnalytics);

/**
 * @swagger
 * /api/admin/dashboard/system-health:
 *   get:
 *     summary: Get system health and performance metrics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include historical health data
 *       - in: query
 *         name: alertsOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only active alerts
 *     responses:
 *       200:
 *         description: System health metrics retrieved successfully
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
 *                     current_status:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             collections:
 *                               type: number
 *                             dataSize:
 *                               type: number
 *                             indexSize:
 *                               type: number
 *                         performance:
 *                           type: object
 *                           properties:
 *                             avg_response_time:
 *                               type: string
 *                             error_rate:
 *                               type: number
 *                             uptime:
 *                               type: number
 *                             memory_usage:
 *                               type: object
 *                         notifications:
 *                           type: object
 *                           properties:
 *                             pending:
 *                               type: number
 *                             failed:
 *                               type: number
 *                             delivery_rate:
 *                               type: string
 *                         background_jobs:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             last_run_times:
 *                               type: object
 *                             failure_count:
 *                               type: object
 *                     performance_indicators:
 *                       type: object
 *                       description: Key performance indicators
 *                     resource_utilization:
 *                       type: object
 *                       description: System resource usage
 *                     error_tracking:
 *                       type: object
 *                       description: Error logs and patterns
 *                     uptime_statistics:
 *                       type: object
 *                       description: System uptime metrics
 *                     historical_data:
 *                       type: object
 *                       description: Historical health data (if requested)
 *                     active_alerts:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Active system alerts (if alertsOnly=true)
 *       403:
 *         description: Access denied - admin privileges required
 */
router.get('/system-health', authenticate, getSystemHealth);

/**
 * @swagger
 * /api/admin/dashboard/users/{targetUserId}/action:
 *   post:
 *     summary: Perform admin action on a user (suspend, verify, etc.)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to perform action on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - reason
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [suspend, unsuspend, verify, unverify]
 *                 description: Action to perform on the user
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Reason for the action
 *               notifyUser:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify the user of the action
 *     responses:
 *       200:
 *         description: User action performed successfully
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
 *                     action:
 *                       type: string
 *                       description: Action that was performed
 *                     targetUser:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userName:
 *                           type: string
 *                         email:
 *                           type: string
 *                     changes:
 *                       type: object
 *                       description: Changes made to the user
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid action or missing required fields
 *       403:
 *         description: Access denied - admin privileges required
 *       404:
 *         description: User not found
 */
router.post('/users/:targetUserId/action', authenticate, updateUserStatus);

/**
 * @swagger
 * /api/admin/dashboard/deals/{dealId}/intervene:
 *   post:
 *     summary: Perform admin intervention on a deal (resolve dispute, cancel, etc.)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the deal to intervene in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - intervention_type
 *               - resolution
 *             properties:
 *               intervention_type:
 *                 type: string
 *                 enum: [resolve_dispute, cancel_deal, force_completion, extend_deadline]
 *                 description: Type of intervention to perform
 *               resolution:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Resolution details or extension days
 *               notifyParties:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify both parties of the intervention
 *     responses:
 *       200:
 *         description: Deal intervention completed successfully
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
 *                     dealId:
 *                       type: string
 *                     dealNumber:
 *                       type: string
 *                     intervention:
 *                       type: string
 *                       description: Type of intervention performed
 *                     resolution:
 *                       type: string
 *                       description: Resolution details
 *                     outcome:
 *                       type: object
 *                       description: Results of the intervention
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid intervention type or missing required fields
 *       403:
 *         description: Access denied - admin privileges required
 *       404:
 *         description: Deal not found
 */
router.post('/deals/:dealId/intervene', authenticate, performDealIntervention);

/**
 * @swagger
 * /api/admin/dashboard/reports/generate:
 *   post:
 *     summary: Generate comprehensive admin reports
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - report_type
 *             properties:
 *               report_type:
 *                 type: string
 *                 enum: [platform_overview, user_activity, financial_summary, deal_analysis, system_health]
 *                 description: Type of report to generate
 *               timeframe:
 *                 type: string
 *                 enum: [7d, 30d, 90d, 1y]
 *                 default: 30d
 *                 description: Report timeframe
 *               format:
 *                 type: string
 *                 enum: [json, pdf, csv, xlsx]
 *                 default: json
 *                 description: Report format
 *               include_details:
 *                 type: boolean
 *                 default: false
 *                 description: Include detailed breakdowns
 *               email_delivery:
 *                 type: boolean
 *                 default: false
 *                 description: Email the report to admin
 *     responses:
 *       200:
 *         description: Report generated successfully
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
 *                     report:
 *                       type: object
 *                       description: Generated report data
 *                     downloadUrl:
 *                       type: string
 *                       description: URL to download the report
 *                     format:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     emailDelivered:
 *                       type: boolean
 *       400:
 *         description: Invalid report type or parameters
 *       403:
 *         description: Access denied - admin privileges required
 */
router.post('/reports/generate', authenticate, generateReport);

module.exports = router;
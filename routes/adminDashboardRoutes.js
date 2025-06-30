const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Administrative dashboard and management tools
 */

/**
 * @swagger
 * /admin/dashboard/overview:
 *   get:
 *     summary: Get admin dashboard overview statistics
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
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
 *                         users:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                               description: Total number of users
 *                             newThisMonth:
 *                               type: number
 *                               description: New users this month
 *                             activeThisWeek:
 *                               type: number
 *                               description: Active users this week
 *                         deals:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                               description: Total number of deals
 *                             active:
 *                               type: number
 *                               description: Currently active deals
 *                             completed:
 *                               type: number
 *                               description: Completed deals
 *                             totalValue:
 *                               type: number
 *                               description: Total value of all deals
 *                             completionRate:
 *                               type: number
 *                               description: Deal completion rate percentage
 *                         payments:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                               description: Total number of payments
 *                             pending:
 *                               type: number
 *                               description: Pending payments
 *                             totalRevenue:
 *                               type: number
 *                               description: Total platform revenue
 *                     trends:
 *                       type: object
 *                       properties:
 *                         userGrowth:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: object
 *                                 properties:
 *                                   year:
 *                                     type: number
 *                                   month:
 *                                     type: number
 *                               count:
 *                                 type: number
 *                         dealStats:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: Deal status
 *                               count:
 *                                 type: number
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/overview', adminDashboardController.getDashboardOverview);

/**
 * @swagger
 * /admin/dashboard/users:
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
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, username, or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [all, creator, marketer]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, inactive, verified]
 *         description: Filter by user status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, lastActiveAt, name, email]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
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
 *                           name:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
 *                           accountType:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           phoneVerified:
 *                             type: boolean
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           lastActiveAt:
 *                             type: string
 *                             format: date-time
 *                           earnings:
 *                             type: object
 *                           stats:
 *                             type: object
 *                             properties:
 *                               deals:
 *                                 type: object
 *                                 properties:
 *                                   totalDeals:
 *                                     type: number
 *                                   activeDeals:
 *                                     type: number
 *                                   completedDeals:
 *                                     type: number
 *                               payments:
 *                                 type: object
 *                                 properties:
 *                                   totalPayments:
 *                                     type: number
 *                                   totalAmount:
 *                                     type: number
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     filters:
 *                       type: object
 *                       description: Applied filters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/users', adminDashboardController.getUserManagement);

/**
 * @swagger
 * /admin/dashboard/users/{targetUserId}/status:
 *   put:
 *     summary: Update user status (activate/deactivate)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Whether to activate or deactivate the user
 *               reason:
 *                 type: string
 *                 description: Reason for the status change
 *                 example: "Violation of terms of service"
 *     responses:
 *       200:
 *         description: User status updated successfully
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
 *                     userId:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required or cannot modify admin users
 *       404:
 *         description: User not found
 */
router.put('/users/:targetUserId/status', adminDashboardController.updateUserStatus);

/**
 * @swagger
 * /admin/dashboard/deals:
 *   get:
 *     summary: Get deal management data with filtering and pagination
 *     tags: [Admin Dashboard]
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
 *         description: Number of deals per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, active, completed, cancelled]
 *         description: Filter by deal status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by deal title or description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, amount, status]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
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
 *                         allOf:
 *                           - $ref: '#/components/schemas/Deal'
 *                           - type: object
 *                             properties:
 *                               creatorId:
 *                                 $ref: '#/components/schemas/User'
 *                               marketerId:
 *                                 $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     filters:
 *                       type: object
 *                       description: Applied filters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/deals', adminDashboardController.getDealManagement);

/**
 * @swagger
 * /admin/dashboard/analytics:
 *   get:
 *     summary: Get platform analytics and insights
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
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
 *                       description: Selected time period
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                       description: Start date of analytics period
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       description: End date of analytics period
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         revenue:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: Date (YYYY-MM-DD)
 *                               totalRevenue:
 *                                 type: number
 *                                 description: Total revenue for the date
 *                               transactionCount:
 *                                 type: number
 *                                 description: Number of transactions
 *                         users:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: object
 *                                 properties:
 *                                   date:
 *                                     type: string
 *                                   accountType:
 *                                     type: string
 *                               count:
 *                                 type: number
 *                         deals:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: object
 *                                 properties:
 *                                   date:
 *                                     type: string
 *                                   status:
 *                                     type: string
 *                               count:
 *                                 type: number
 *                               totalValue:
 *                                 type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/analytics', adminDashboardController.getAnalytics);

/**
 * @swagger
 * components:
 *   schemas:
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *         total:
 *           type: integer
 *           description: Total number of items
 *         pages:
 *           type: integer
 *           description: Total number of pages
 */

module.exports = router;
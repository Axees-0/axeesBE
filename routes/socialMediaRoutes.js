const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  getSocialMediaPlatforms,
  addOrUpdatePlatform,
  removePlatform,
  getPlatformAnalytics,
  bulkUpdatePlatforms
} = require('../controllers/socialMediaController');

/**
 * @swagger
 * tags:
 *   name: Social Media
 *   description: Social media platform management for users
 */

/**
 * @swagger
 * /api/social-media/platforms:
 *   get:
 *     summary: Get all social media platforms for the authenticated user
 *     tags: [Social Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Social media platforms retrieved successfully
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
 *                     platforms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           platform:
 *                             type: string
 *                             enum: [instagram, youtube, facebook, tiktok, twitter, x, twitch]
 *                           handle:
 *                             type: string
 *                             description: User's handle/username on the platform
 *                           followersCount:
 *                             type: number
 *                             description: Number of followers on this platform
 *                           percentage:
 *                             type: number
 *                             description: Percentage of total followers this platform represents
 *                           isVerified:
 *                             type: boolean
 *                             description: Whether the platform has valid data
 *                           lastUpdated:
 *                             type: string
 *                             format: date-time
 *                     totalFollowers:
 *                       type: number
 *                       description: Total followers across all platforms
 *                     connectedPlatforms:
 *                       type: number
 *                       description: Number of connected platforms
 *                     supportedPlatforms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           platform:
 *                             type: string
 *                           connected:
 *                             type: boolean
 *                           available:
 *                             type: boolean
 *                     userType:
 *                       type: string
 *                       enum: [Creator, Marketer]
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/platforms', authenticate, getSocialMediaPlatforms);

/**
 * @swagger
 * /api/social-media/platforms:
 *   post:
 *     summary: Add or update a social media platform
 *     tags: [Social Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - handle
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [instagram, youtube, facebook, tiktok, twitter, x, twitch]
 *                 description: Social media platform name
 *               handle:
 *                 type: string
 *                 description: User's handle/username on the platform
 *               followersCount:
 *                 type: integer
 *                 minimum: 0
 *                 description: Number of followers (optional, defaults to 0)
 *     responses:
 *       200:
 *         description: Platform added or updated successfully
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
 *                     platform:
 *                       type: object
 *                       properties:
 *                         platform:
 *                           type: string
 *                         handle:
 *                           type: string
 *                         followersCount:
 *                           type: number
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                     action:
 *                       type: string
 *                       enum: [added, updated]
 *                     totalPlatforms:
 *                       type: number
 *                     totalFollowers:
 *                       type: number
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/platforms', authenticate, addOrUpdatePlatform);

/**
 * @swagger
 * /api/social-media/platforms/{platform}:
 *   delete:
 *     summary: Remove a social media platform
 *     tags: [Social Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: platform
 *         required: true
 *         schema:
 *           type: string
 *           enum: [instagram, youtube, facebook, tiktok, twitter, x, twitch]
 *         description: Platform to remove
 *     responses:
 *       200:
 *         description: Platform removed successfully
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
 *                     removedPlatform:
 *                       type: object
 *                       properties:
 *                         platform:
 *                           type: string
 *                         handle:
 *                           type: string
 *                         followersCount:
 *                           type: number
 *                     remainingPlatforms:
 *                       type: number
 *                     totalFollowers:
 *                       type: number
 *       400:
 *         description: Platform parameter required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or platform not found
 */
router.delete('/platforms/:platform', authenticate, removePlatform);

/**
 * @swagger
 * /api/social-media/analytics:
 *   get:
 *     summary: Get platform analytics and insights
 *     tags: [Social Media]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform analytics retrieved successfully
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
 *                     analytics:
 *                       type: object
 *                       properties:
 *                         totalFollowers:
 *                           type: number
 *                         averageFollowers:
 *                           type: number
 *                         topPlatform:
 *                           type: object
 *                           properties:
 *                             platform:
 *                               type: string
 *                             handle:
 *                               type: string
 *                             followersCount:
 *                               type: number
 *                         platforms:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               platform:
 *                                 type: string
 *                               followersCount:
 *                                 type: number
 *                               percentage:
 *                                 type: number
 *                               handle:
 *                                 type: string
 *                         performance:
 *                           type: object
 *                           properties:
 *                             strong:
 *                               type: array
 *                               description: Platforms with 10k+ followers
 *                             moderate:
 *                               type: array
 *                               description: Platforms with 1k-10k followers
 *                             developing:
 *                               type: array
 *                               description: Platforms with <1k followers
 *                         recommendations:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Personalized recommendations for growth
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/analytics', authenticate, getPlatformAnalytics);

/**
 * @swagger
 * /api/social-media/platforms/bulk:
 *   put:
 *     summary: Bulk update multiple social media platforms
 *     tags: [Social Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platforms
 *             properties:
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - platform
 *                     - handle
 *                   properties:
 *                     platform:
 *                       type: string
 *                       enum: [instagram, youtube, facebook, tiktok, twitter, x, twitch]
 *                     handle:
 *                       type: string
 *                     followersCount:
 *                       type: integer
 *                       minimum: 0
 *                 example:
 *                   - platform: "instagram"
 *                     handle: "@myhandle"
 *                     followersCount: 5000
 *                   - platform: "youtube"
 *                     handle: "MyChannel"
 *                     followersCount: 1200
 *     responses:
 *       200:
 *         description: Platforms updated successfully
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
 *                     results:
 *                       type: object
 *                       properties:
 *                         updated:
 *                           type: array
 *                           items:
 *                             type: object
 *                           description: Platforms that were updated
 *                         added:
 *                           type: array
 *                           items:
 *                             type: object
 *                           description: Platforms that were newly added
 *                         errors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               index:
 *                                 type: number
 *                               error:
 *                                 type: string
 *                               platform:
 *                                 type: string
 *                           description: Validation errors encountered
 *                     totalPlatforms:
 *                       type: number
 *                     totalFollowers:
 *                       type: number
 *       400:
 *         description: Validation errors or invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/platforms/bulk', authenticate, bulkUpdatePlatforms);

module.exports = router;
const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');

/**
 * @swagger
 * tags:
 *   name: Utility
 *   description: Utility endpoints for sharing and legal content
 */

/**
 * @swagger
 * /share/generate-link:
 *   post:
 *     summary: Generate shareable link for profiles, deals, etc.
 *     tags: [Utility]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - resourceId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [profile, deal, offer, portfolio, creator, marketer]
 *                 description: Type of resource to share
 *               resourceId:
 *                 type: string
 *                 description: ID of the resource to share
 *               title:
 *                 type: string
 *                 description: Custom title for the share
 *               description:
 *                 type: string
 *                 description: Custom description for the share
 *     responses:
 *       201:
 *         description: Share link generated successfully
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
 *                     shareUrl:
 *                       type: string
 *                     shareToken:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     type:
 *                       type: string
 *                     resourceId:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     socialUrls:
 *                       type: object
 *                       properties:
 *                         twitter:
 *                           type: string
 *                         facebook:
 *                           type: string
 *                         linkedin:
 *                           type: string
 *                         whatsapp:
 *                           type: string
 *                         telegram:
 *                           type: string
 *                         copy:
 *                           type: string
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 */
router.post('/generate-link', utilityController.generateShareLink);

module.exports = router;
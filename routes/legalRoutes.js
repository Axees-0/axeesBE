const express = require('express');
const router = express.Router();
const utilityController = require('../controllers/utilityController');

/**
 * @swagger
 * tags:
 *   name: Legal
 *   description: Legal documents and compliance endpoints
 */

/**
 * @swagger
 * /legal/terms:
 *   get:
 *     summary: Get terms of service
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Terms of service retrieved successfully
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
 *                     version:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 *                       format: date
 *                     effectiveDate:
 *                       type: string
 *                       format: date
 *                     content:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                         sections:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                               content:
 *                                 type: string
 */
router.get('/terms', utilityController.getTermsOfService);

/**
 * @swagger
 * /legal/accept-terms:
 *   post:
 *     summary: Accept terms of service
 *     tags: [Legal]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *             properties:
 *               version:
 *                 type: string
 *                 description: Version of terms being accepted
 *               acceptedAt:
 *                 type: string
 *                 format: date-time
 *                 description: Timestamp of acceptance (optional, defaults to now)
 *     responses:
 *       200:
 *         description: Terms accepted successfully
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
 *                     termsAccepted:
 *                       type: object
 *                       properties:
 *                         version:
 *                           type: string
 *                         acceptedAt:
 *                           type: string
 *                           format: date-time
 *                         ip:
 *                           type: string
 *                         userAgent:
 *                           type: string
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/accept-terms', utilityController.acceptTerms);

module.exports = router;
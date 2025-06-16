const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  generateUserProfileQR,
  generateDealQR,
  scanQRCode,
  getQRCodeHistory,
  bulkGenerateDealQRs
} = require('../controllers/qrCodeController');

/**
 * @swagger
 * tags:
 *   name: QR Codes
 *   description: Dual-purpose QR code generation and scanning
 */

/**
 * @swagger
 * /api/qr/user/generate:
 *   post:
 *     summary: Generate QR code for user profile
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               purpose:
 *                 type: string
 *                 enum: [profile, connect, contact]
 *                 default: profile
 *                 description: Purpose of the QR code
 *               expiresIn:
 *                 type: number
 *                 default: 24
 *                 description: Expiration time in hours
 *     responses:
 *       200:
 *         description: QR code generated successfully
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
 *                     qrCode:
 *                       type: object
 *                       properties:
 *                         dataUrl:
 *                           type: string
 *                           description: Base64 encoded QR code image
 *                         buffer:
 *                           type: string
 *                           description: QR code buffer for download
 *                         purpose:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                         shareUrl:
 *                           type: string
 *       401:
 *         description: Unauthorized
 */
router.post('/user/generate', authenticate, generateUserProfileQR);

/**
 * @swagger
 * /api/qr/deal/{dealId}/generate:
 *   post:
 *     summary: Generate QR code for deal tracking
 *     tags: [QR Codes]
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
 *               includePayment:
 *                 type: boolean
 *                 default: false
 *                 description: Include payment information in QR code
 *               includeStatus:
 *                 type: boolean
 *                 default: true
 *                 description: Include deal status in QR code
 *     responses:
 *       200:
 *         description: Deal QR code generated successfully
 *       403:
 *         description: Unauthorized access to deal
 *       404:
 *         description: Deal not found
 */
router.post('/deal/:dealId/generate', authenticate, generateDealQR);

/**
 * @swagger
 * /api/qr/scan:
 *   post:
 *     summary: Scan and verify a QR code
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrData
 *               - token
 *             properties:
 *               qrData:
 *                 type: string
 *                 description: QR code data or URL
 *               token:
 *                 type: string
 *                 description: Security token from QR code
 *     responses:
 *       200:
 *         description: QR code verified successfully
 *       400:
 *         description: Invalid QR code data
 *       401:
 *         description: Invalid or expired QR code
 *       404:
 *         description: Resource not found
 */
router.post('/scan', authenticate, scanQRCode);

/**
 * @swagger
 * /api/qr/history:
 *   get:
 *     summary: Get QR code generation history
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code history retrieved successfully
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
 *                     profile:
 *                       type: object
 *                       properties:
 *                         lastGenerated:
 *                           type: string
 *                           format: date-time
 *                         purpose:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                         isExpired:
 *                           type: boolean
 *                     deals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           dealId:
 *                             type: string
 *                           dealNumber:
 *                             type: string
 *                           dealName:
 *                             type: string
 *                           generatedAt:
 *                             type: string
 *                             format: date-time
 */
router.get('/history', authenticate, getQRCodeHistory);

/**
 * @swagger
 * /api/qr/bulk/deals:
 *   post:
 *     summary: Generate QR codes for multiple deals
 *     tags: [QR Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealIds
 *             properties:
 *               dealIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of deal IDs
 *     responses:
 *       200:
 *         description: Bulk QR generation completed
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
 *                     successful:
 *                       type: number
 *                     failed:
 *                       type: number
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           dealId:
 *                             type: string
 *                           dealNumber:
 *                             type: string
 *                           qrCode:
 *                             type: string
 *                           trackingUrl:
 *                             type: string
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           dealId:
 *                             type: string
 *                           error:
 *                             type: string
 */
router.post('/bulk/deals', authenticate, bulkGenerateDealQRs);

module.exports = router;
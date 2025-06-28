/* ────────────────────────────────────────────────────────────────
   QR CODE ROUTES – Axees
   Mount path: /api/qr (see main.js)
   ───────────────────────────────────────────────────────────── */
const { Router } = require('express');
/** @type {import('express').Router} */
const router = Router();

const qrCodeController = require('../controllers/qrCodeController');

/* ───────── Swagger Tag ───────────────────────────────────────── */
/**
 * @swagger
 * tags:
 *   name: QRCode
 *   description: QR code generation and management
 */

/* ─── POST generate QR code ──────────────────────────────────────── */
/**
 * @swagger
 * /qr/generate:
 *   post:
 *     summary: Generate a QR code for various purposes
 *     tags: [QRCode]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [profile, offer, deal, event, campaign]
 *                 description: Type of QR code to generate
 *               targetId:
 *                 type: string
 *                 description: ID of the resource (user, offer, deal, etc.)
 *               customUrl:
 *                 type: string
 *                 description: Custom URL to encode (if not using targetId)
 *               options:
 *                 type: object
 *                 properties:
 *                   size:
 *                     type: number
 *                     default: 300
 *                     description: QR code size in pixels
 *                   logo:
 *                     type: boolean
 *                     default: false
 *                     description: Include Axees logo in center
 *                   color:
 *                     type: string
 *                     default: "#000000"
 *                     description: QR code color
 *                   backgroundColor:
 *                     type: string
 *                     default: "#FFFFFF"
 *                   format:
 *                     type: string
 *                     enum: [png, svg, base64]
 *                     default: base64
 *               metadata:
 *                 type: object
 *                 description: Additional tracking metadata
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCodeId:
 *                   type: string
 *                 qrCode:
 *                   type: string
 *                   description: QR code data (base64 or SVG)
 *                 shortUrl:
 *                   type: string
 *                   description: Short URL that the QR code points to
 *                 trackingUrl:
 *                   type: string
 *                   description: Full tracking URL with analytics
 *       400:
 *         description: Invalid request parameters
 */
router.post('/generate', qrCodeController.generateQRCode);

/* ─── GET QR code by ID ──────────────────────────────────────────── */
/**
 * @swagger
 * /qr/{qrCodeId}:
 *   get:
 *     summary: Get QR code details and regenerate if needed
 *     tags: [QRCode]
 *     parameters:
 *       - in: path
 *         name: qrCodeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: QR code details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCodeId:
 *                   type: string
 *                 type:
 *                   type: string
 *                 targetId:
 *                   type: string
 *                 shortUrl:
 *                   type: string
 *                 scanCount:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 lastScannedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: QR code not found
 */
router.get('/:qrCodeId', qrCodeController.getQRCode);

/* ─── POST track QR code scan ────────────────────────────────────── */
/**
 * @swagger
 * /qr/{qrCodeId}/scan:
 *   post:
 *     summary: Track QR code scan (called when QR is scanned)
 *     tags: [QRCode]
 *     parameters:
 *       - in: path
 *         name: qrCodeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userAgent:
 *                 type: string
 *               ipAddress:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               ghostAccountId:
 *                 type: string
 *                 description: Ghost account ID if user is not logged in
 *     responses:
 *       200:
 *         description: Scan tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redirectUrl:
 *                   type: string
 *                   description: URL to redirect the user to
 *                 ghostAccount:
 *                   type: object
 *                   description: Ghost account details if created
 *       404:
 *         description: QR code not found
 */
router.post('/:qrCodeId/scan', qrCodeController.trackScan);

/* ─── GET QR code analytics ──────────────────────────────────────── */
/**
 * @swagger
 * /qr/{qrCodeId}/analytics:
 *   get:
 *     summary: Get analytics for a specific QR code
 *     tags: [QRCode]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: qrCodeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: QR code analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalScans:
 *                   type: number
 *                 uniqueScans:
 *                   type: number
 *                 scansByDate:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       count:
 *                         type: number
 *                 scansByLocation:
 *                   type: array
 *                 scansByDevice:
 *                   type: object
 *                 conversions:
 *                   type: object
 *                   properties:
 *                     ghostToUser:
 *                       type: number
 *                     views:
 *                       type: number
 *                     actions:
 *                       type: number
 *       403:
 *         description: Unauthorized to view analytics
 *       404:
 *         description: QR code not found
 */
router.get('/:qrCodeId/analytics', qrCodeController.getAnalytics);

/* ─── GET user's QR codes ────────────────────────────────────────── */
/**
 * @swagger
 * /qr/my-codes:
 *   get:
 *     summary: Get all QR codes created by the authenticated user
 *     tags: [QRCode]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [profile, offer, deal, event, campaign]
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: List of user's QR codes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCodes:
 *                   type: array
 *                 totalCount:
 *                   type: number
 *                 page:
 *                   type: number
 *                 totalPages:
 *                   type: number
 */
router.get('/my-codes', qrCodeController.getUserQRCodes);

/* ─── DELETE QR code ─────────────────────────────────────────────── */
/**
 * @swagger
 * /qr/{qrCodeId}:
 *   delete:
 *     summary: Delete a QR code
 *     tags: [QRCode]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: qrCodeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: QR code deleted successfully
 *       403:
 *         description: Unauthorized to delete this QR code
 *       404:
 *         description: QR code not found
 */
router.delete('/:qrCodeId', qrCodeController.deleteQRCode);

module.exports = router;
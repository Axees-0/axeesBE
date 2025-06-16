const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  createGhostAccount,
  convertGhostAccount,
  getGhostAccountStatus,
  createOfferForGhost,
  checkGhostAccount
} = require('../controllers/ghostAccountController');

/**
 * @swagger
 * tags:
 *   name: Ghost Accounts
 *   description: Ghost account creation and management for QR code flows
 */

/**
 * @swagger
 * /api/ghost-accounts/create:
 *   post:
 *     summary: Create a ghost account from QR code scan
 *     tags: [Ghost Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrData
 *               - creatorInfo
 *             properties:
 *               qrData:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [ghost_account, direct_offer]
 *                   marketerId:
 *                     type: string
 *                   offerId:
 *                     type: string
 *                   qrCodeId:
 *                     type: string
 *               creatorInfo:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *     responses:
 *       200:
 *         description: Ghost account created successfully
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
 *                     ghostAccount:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         isGhost:
 *                           type: boolean
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                     token:
 *                       type: string
 *                       description: JWT token for ghost account access
 *                     temporaryCredentials:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                         password:
 *                           type: string
 *                     nextSteps:
 *                       type: object
 *                       properties:
 *                         immediate:
 *                           type: string
 *                         required:
 *                           type: string
 *                         conversion:
 *                           type: string
 *       400:
 *         description: Invalid QR code data
 */
router.post('/create', createGhostAccount);

/**
 * @swagger
 * /api/ghost-accounts/convert:
 *   post:
 *     summary: Convert ghost account to full account
 *     tags: [Ghost Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password for the account
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *               profileData:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   bio:
 *                     type: string
 *                   avatarUrl:
 *                     type: string
 *                   creatorData:
 *                     type: object
 *                     properties:
 *                       socialPlatforms:
 *                         type: array
 *                       categories:
 *                         type: array
 *     responses:
 *       200:
 *         description: Ghost account converted successfully
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         userName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                         profileCompletion:
 *                           type: number
 *                         isGhost:
 *                           type: boolean
 *                     token:
 *                       type: string
 *                       description: New JWT token for full account
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid data or expired ghost account
 *       404:
 *         description: Not a ghost account
 */
router.post('/convert', authenticate, convertGhostAccount);

/**
 * @swagger
 * /api/ghost-accounts/status:
 *   get:
 *     summary: Get ghost account status and conversion requirements
 *     tags: [Ghost Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ghost account status retrieved
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
 *                     isGhost:
 *                       type: boolean
 *                     ghostAccountData:
 *                       type: object
 *                       properties:
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *                         daysUntilExpiration:
 *                           type: number
 *                         createdVia:
 *                           type: string
 *                         hasExpired:
 *                           type: boolean
 *                     accountActivity:
 *                       type: object
 *                       properties:
 *                         totalOffers:
 *                           type: number
 *                         totalDeals:
 *                           type: number
 *                         profileCompletion:
 *                           type: number
 *                     conversionRequired:
 *                       type: object
 *                       properties:
 *                         steps:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               step:
 *                                 type: string
 *                               completed:
 *                                 type: boolean
 *                         benefits:
 *                           type: array
 *                           items:
 *                             type: string
 *       404:
 *         description: User not found
 */
router.get('/status', authenticate, getGhostAccountStatus);

/**
 * @swagger
 * /api/ghost-accounts/create-offer:
 *   post:
 *     summary: Create an offer for a ghost account
 *     tags: [Ghost Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ghostAccountId
 *               - offerData
 *             properties:
 *               ghostAccountId:
 *                 type: string
 *               marketerId:
 *                 type: string
 *               offerData:
 *                 type: object
 *                 properties:
 *                   campaignDetails:
 *                     type: object
 *                   paymentTerms:
 *                     type: object
 *                   deliverables:
 *                     type: array
 *     responses:
 *       200:
 *         description: Offer created for ghost account
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
 *                     offer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         status:
 *                           type: string
 *                         creatorId:
 *                           type: string
 *                         requiresConversion:
 *                           type: boolean
 *                     ghostAccountStatus:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         email:
 *                           type: string
 *                         needsConversion:
 *                           type: boolean
 *       404:
 *         description: Invalid ghost account
 */
router.post('/create-offer', authenticate, createOfferForGhost);

/**
 * @swagger
 * /api/ghost-accounts/check:
 *   get:
 *     summary: Check if email/phone is associated with a ghost account
 *     tags: [Ghost Accounts]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Email to check
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Phone number to check
 *     responses:
 *       200:
 *         description: Ghost account check completed
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
 *                     hasGhostAccount:
 *                       type: boolean
 *                     ghostAccountId:
 *                       type: string
 *                     needsConversion:
 *                       type: boolean
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                     hasOffers:
 *                       type: boolean
 *       400:
 *         description: Email or phone required
 */
router.get('/check', checkGhostAccount);

module.exports = router;
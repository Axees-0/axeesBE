const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  getAutoPopulatedPaymentData,
  autoPopulatePaymentForm,
  synchronizePaymentUpdates,
  getPaymentPreferences,
  updatePaymentPreferences,
  quickSetupPayment,
  getPaymentMethodAnalytics
} = require('../controllers/paymentAutoPopulationController');

/**
 * @swagger
 * tags:
 *   name: Payment Auto-Population
 *   description: Payment method auto-population and profile synchronization
 */

/**
 * @swagger
 * /api/payment-autopop/data:
 *   get:
 *     summary: Get auto-populated payment data for the authenticated user (Bug #4)
 *     tags: [Payment Auto-Population]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auto-populated payment data retrieved successfully
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
 *                     userId:
 *                       type: string
 *                     hasStripeCustomer:
 *                       type: boolean
 *                     hasStripeConnect:
 *                       type: boolean
 *                     savedMethods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [card, bank_account]
 *                           isDefault:
 *                             type: boolean
 *                           isPayoutCard:
 *                             type: boolean
 *                           addedAt:
 *                             type: string
 *                             format: date-time
 *                           lastUsed:
 *                             type: string
 *                             format: date-time
 *                           displayData:
 *                             type: object
 *                             properties:
 *                               last4:
 *                                 type: string
 *                               brand:
 *                                 type: string
 *                               expMonth:
 *                                 type: number
 *                               expYear:
 *                                 type: number
 *                               funding:
 *                                 type: string
 *                           autoFillData:
 *                             type: object
 *                             properties:
 *                               cardType:
 *                                 type: string
 *                               isExpired:
 *                                 type: boolean
 *                               needsUpdate:
 *                                 type: boolean
 *                               canAutoFill:
 *                                 type: boolean
 *                     defaultMethod:
 *                       type: object
 *                       description: Default payment method details
 *                     autoPopulateSettings:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         syncAcrossDevices:
 *                           type: boolean
 *                         rememberCardDetails:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/data', authenticate, getAutoPopulatedPaymentData);

/**
 * @swagger
 * /api/payment-autopop/form:
 *   get:
 *     summary: Auto-populate payment form for specific context
 *     tags: [Payment Auto-Population]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *           enum: [general, payout, subscription, deal_payment]
 *           default: general
 *         description: Payment form context
 *     responses:
 *       200:
 *         description: Payment form auto-populated successfully
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
 *                     hasAutoFillData:
 *                       type: boolean
 *                     paymentMethodId:
 *                       type: string
 *                       description: Selected payment method ID
 *                     formData:
 *                       type: object
 *                       properties:
 *                         cardType:
 *                           type: string
 *                         last4:
 *                           type: string
 *                         expMonth:
 *                           type: number
 *                         expYear:
 *                           type: number
 *                         displayName:
 *                           type: string
 *                         isDefault:
 *                           type: boolean
 *                         needsVerification:
 *                           type: boolean
 *                     alternatives:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           type:
 *                             type: string
 *                     autoPopulationInfo:
 *                       type: object
 *                       properties:
 *                         method:
 *                           type: string
 *                         confidence:
 *                           type: string
 *                           enum: [high, low]
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *                         context:
 *                           type: string
 *       400:
 *         description: Invalid context
 *       401:
 *         description: Unauthorized
 */
router.get('/form', authenticate, autoPopulatePaymentForm);

/**
 * @swagger
 * /api/payment-autopop/sync:
 *   post:
 *     summary: Synchronize payment method updates across user profile
 *     tags: [Payment Auto-Population]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [add, update, remove]
 *                 description: Action to perform
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID (required for all actions)
 *               type:
 *                 type: string
 *                 enum: [card, bank_account]
 *                 description: Payment method type (required for add action)
 *               setAsDefault:
 *                 type: boolean
 *                 description: Set as default payment method
 *               isPayoutCard:
 *                 type: boolean
 *                 description: Mark as payout card
 *     responses:
 *       200:
 *         description: Payment methods synchronized successfully
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
 *                     updated:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Updated payment methods
 *                     added:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Added payment methods
 *                     removed:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Removed payment methods
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Any errors encountered during sync
 *       400:
 *         description: Invalid action or missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/sync', authenticate, synchronizePaymentUpdates);

/**
 * @swagger
 * /api/payment-autopop/preferences:
 *   get:
 *     summary: Get payment preferences for auto-population
 *     tags: [Payment Auto-Population]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment preferences retrieved successfully
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
 *                     autoPopulate:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                         rememberCards:
 *                           type: boolean
 *                         syncAcrossDevices:
 *                           type: boolean
 *                     defaultBehavior:
 *                       type: object
 *                       properties:
 *                         setFirstAsDefault:
 *                           type: boolean
 *                         useLastUsedFirst:
 *                           type: boolean
 *                         preferPayoutCards:
 *                           type: boolean
 *                     security:
 *                       type: object
 *                       properties:
 *                         requireCVVAlways:
 *                           type: boolean
 *                         autoExpireCards:
 *                           type: boolean
 *                         biometricAuth:
 *                           type: boolean
 *                     notifications:
 *                       type: object
 *                       properties:
 *                         paymentAdded:
 *                           type: boolean
 *                         paymentExpiring:
 *                           type: boolean
 *                         unusualActivity:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/preferences', authenticate, getPaymentPreferences);

/**
 * @swagger
 * /api/payment-autopop/preferences:
 *   put:
 *     summary: Update payment preferences
 *     tags: [Payment Auto-Population]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               autoPopulate:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   rememberCards:
 *                     type: boolean
 *                   syncAcrossDevices:
 *                     type: boolean
 *               security:
 *                 type: object
 *                 properties:
 *                   requireCVVAlways:
 *                     type: boolean
 *                   autoExpireCards:
 *                     type: boolean
 *                   biometricAuth:
 *                     type: boolean
 *               notifications:
 *                 type: object
 *                 properties:
 *                   paymentAdded:
 *                     type: boolean
 *                   paymentExpiring:
 *                     type: boolean
 *                   unusualActivity:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Payment preferences updated successfully
 *       400:
 *         description: Invalid preferences data
 *       401:
 *         description: Unauthorized
 */
router.put('/preferences', authenticate, updatePaymentPreferences);

/**
 * @swagger
 * /api/payment-autopop/quick-setup:
 *   post:
 *     summary: Quick setup for new users - auto-detect and populate best payment method
 *     tags: [Payment Auto-Population]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stripePaymentMethodId
 *             properties:
 *               stripePaymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *               setAsDefault:
 *                 type: boolean
 *                 default: true
 *                 description: Set as default payment method
 *               context:
 *                 type: string
 *                 enum: [general, payout, subscription, deal_payment]
 *                 default: general
 *                 description: Context for auto-population
 *     responses:
 *       200:
 *         description: Payment method set up and auto-populated successfully
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
 *                     setupResult:
 *                       type: object
 *                       description: Results from payment method setup
 *                     autoPopulateData:
 *                       type: object
 *                       description: Auto-populated form data
 *                     isFirstPaymentMethod:
 *                       type: boolean
 *                       description: Whether this is the user's first payment method
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Setup recommendations for the user
 *       400:
 *         description: Missing required fields or setup failed
 *       401:
 *         description: Unauthorized
 */
router.post('/quick-setup', authenticate, quickSetupPayment);

/**
 * @swagger
 * /api/payment-autopop/analytics:
 *   get:
 *     summary: Get payment method usage analytics
 *     tags: [Payment Auto-Population]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           default: 30d
 *         description: Analytics timeframe
 *     responses:
 *       200:
 *         description: Payment method analytics retrieved successfully
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
 *                     totalMethods:
 *                       type: number
 *                     activeMethodsCount:
 *                       type: number
 *                     expiredMethodsCount:
 *                       type: number
 *                     methodDistribution:
 *                       type: object
 *                       properties:
 *                         cards:
 *                           type: number
 *                         bankAccounts:
 *                           type: number
 *                     brandDistribution:
 *                       type: object
 *                       description: Distribution by card brand
 *                     recentActivity:
 *                       type: object
 *                       properties:
 *                         methodsAddedThisMonth:
 *                           type: number
 *                         lastUsedMethod:
 *                           type: object
 *                         defaultMethodAge:
 *                           type: number
 *                           description: Age in days
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           priority:
 *                             type: string
 *                           title:
 *                             type: string
 *                           message:
 *                             type: string
 *                           action:
 *                             type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics', authenticate, getPaymentMethodAnalytics);

module.exports = router;
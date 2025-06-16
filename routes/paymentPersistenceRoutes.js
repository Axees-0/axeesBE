const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  addAndPersistPaymentMethod,
  getPersistedPaymentMethods,
  updatePaymentMethod,
  removePaymentMethod,
  verifyPaymentMethod,
  getPaymentMethodForCheckout,
  migratePaymentMethods
} = require('../controllers/paymentPersistenceController');

/**
 * @swagger
 * tags:
 *   name: Payment Persistence
 *   description: Secure payment method storage and management
 */

/**
 * @swagger
 * /api/payment-persistence/methods:
 *   post:
 *     summary: Add and persist a payment method
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethodId
 *             properties:
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *               type:
 *                 type: string
 *                 enum: [card, bank_account, debit_card]
 *                 default: card
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *               nickname:
 *                 type: string
 *                 description: User-friendly name for the payment method
 *               billingDetails:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: object
 *                   email:
 *                     type: string
 *                   name:
 *                     type: string
 *                   phone:
 *                     type: string
 *     responses:
 *       200:
 *         description: Payment method added successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/methods', authenticate, addAndPersistPaymentMethod);

/**
 * @swagger
 * /api/payment-persistence/methods:
 *   get:
 *     summary: Get all persisted payment methods for the user
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive payment methods
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/methods', authenticate, getPersistedPaymentMethods);

/**
 * @swagger
 * /api/payment-persistence/methods/{paymentMethodId}:
 *   put:
 *     summary: Update a payment method
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *       404:
 *         description: Payment method not found
 */
router.put('/methods/:paymentMethodId', authenticate, updatePaymentMethod);

/**
 * @swagger
 * /api/payment-persistence/methods/{paymentMethodId}:
 *   delete:
 *     summary: Remove a payment method
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: Force removal even if it's the only payment method
 *     responses:
 *       200:
 *         description: Payment method removed successfully
 *       400:
 *         description: Cannot remove the only payment method
 *       404:
 *         description: Payment method not found
 */
router.delete('/methods/:paymentMethodId', authenticate, removePaymentMethod);

/**
 * @swagger
 * /api/payment-persistence/methods/{paymentMethodId}/verify:
 *   post:
 *     summary: Verify a payment method is still valid
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method verification completed
 *       404:
 *         description: Payment method not found
 */
router.post('/methods/:paymentMethodId/verify', authenticate, verifyPaymentMethod);

/**
 * @swagger
 * /api/payment-persistence/checkout:
 *   get:
 *     summary: Get the best payment method for checkout
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: preferredMethodId
 *         schema:
 *           type: string
 *         description: Preferred payment method ID
 *     responses:
 *       200:
 *         description: Payment method ready for checkout
 *       404:
 *         description: No valid payment method found
 */
router.get('/checkout', authenticate, getPaymentMethodForCheckout);

/**
 * @swagger
 * /api/payment-persistence/migrate:
 *   post:
 *     summary: Migrate legacy payment methods to new format (Admin only)
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Migration completed successfully
 *       401:
 *         description: Unauthorized - Admin access required
 */
router.post('/migrate', authenticate, migratePaymentMethods);

module.exports = router;
const express = require('express');
const router = express.Router();
const paymentPersistenceController = require('../controllers/paymentPersistenceController');

/**
 * @swagger
 * tags:
 *   name: Payment Persistence
 *   description: Persistent payment method and intent management
 */

/**
 * @swagger
 * /payment-persistence/methods:
 *   post:
 *     summary: Save a new payment method for the user
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
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [card, bank, digital_wallet]
 *                 description: Type of payment method
 *               cardDetails:
 *                 type: object
 *                 description: Card details (required if type is 'card')
 *                 properties:
 *                   brand:
 *                     type: string
 *                     example: visa
 *                   last4:
 *                     type: string
 *                     example: "1234"
 *                   expiryMonth:
 *                     type: number
 *                     example: 12
 *                   expiryYear:
 *                     type: number
 *                     example: 2025
 *                   token:
 *                     type: string
 *                     description: Tokenized card data
 *               bankDetails:
 *                 type: object
 *                 description: Bank details (required if type is 'bank')
 *                 properties:
 *                   bankName:
 *                     type: string
 *                     example: "Chase Bank"
 *                   accountNumber:
 *                     type: string
 *                     description: Encrypted account number
 *                   routingNumber:
 *                     type: string
 *                     example: "021000021"
 *                   accountType:
 *                     type: string
 *                     enum: [checking, savings]
 *               digitalWallet:
 *                 type: object
 *                 description: Digital wallet details (required if type is 'digital_wallet')
 *                 properties:
 *                   provider:
 *                     type: string
 *                     enum: [paypal, apple_pay, google_pay]
 *                   email:
 *                     type: string
 *                     example: user@example.com
 *                   token:
 *                     type: string
 *                     description: Wallet authorization token
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to set as default payment method
 *               billingAddress:
 *                 type: object
 *                 description: Billing address information
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       201:
 *         description: Payment method saved successfully
 *       400:
 *         description: Invalid payment method data
 *       401:
 *         description: Unauthorized
 */
router.post('/methods', paymentPersistenceController.savePaymentMethod);

/**
 * @swagger
 * /payment-persistence/methods:
 *   get:
 *     summary: Get all saved payment methods for the user
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
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
 *                     paymentMethods:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                             enum: [card, bank, digital_wallet]
 *                           isDefault:
 *                             type: boolean
 *                           isActive:
 *                             type: boolean
 *                           maskedDetails:
 *                             type: object
 *                             description: Masked payment details for security
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: number
 *                     hasDefault:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/methods', paymentPersistenceController.getPaymentMethods);

/**
 * @swagger
 * /payment-persistence/methods/{paymentMethodId}:
 *   put:
 *     summary: Update a saved payment method
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment method to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isDefault:
 *                 type: boolean
 *                 description: Set as default payment method
 *               billingAddress:
 *                 type: object
 *                 description: Updated billing address
 *               nickname:
 *                 type: string
 *                 description: Friendly name for the payment method
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *       404:
 *         description: Payment method not found
 *       401:
 *         description: Unauthorized
 */
router.put('/methods/:paymentMethodId', paymentPersistenceController.updatePaymentMethod);

/**
 * @swagger
 * /payment-persistence/methods/{paymentMethodId}:
 *   delete:
 *     summary: Delete a saved payment method
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentMethodId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment method to delete
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
 *       404:
 *         description: Payment method not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/methods/:paymentMethodId', paymentPersistenceController.deletePaymentMethod);

/**
 * @swagger
 * /payment-persistence/intents:
 *   post:
 *     summary: Save a payment intent for later completion
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
 *               - amount
 *               - currency
 *               - purpose
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *                 example: 100.00
 *               currency:
 *                 type: string
 *                 description: Currency code
 *                 example: USD
 *               purpose:
 *                 type: string
 *                 description: Purpose of the payment
 *                 enum: [deal_payment, withdrawal, refund, bonus]
 *               metadata:
 *                 type: object
 *                 description: Additional payment metadata
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the intent expires (default 24 hours)
 *               paymentMethodId:
 *                 type: string
 *                 description: ID of the payment method to use
 *     responses:
 *       201:
 *         description: Payment intent saved successfully
 *       400:
 *         description: Invalid payment intent data
 *       401:
 *         description: Unauthorized
 */
router.post('/intents', paymentPersistenceController.savePaymentIntent);

/**
 * @swagger
 * /payment-persistence/intents:
 *   get:
 *     summary: Get saved payment intents for the user
 *     tags: [Payment Persistence]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled]
 *         description: Filter by intent status
 *       - in: query
 *         name: purpose
 *         schema:
 *           type: string
 *           enum: [deal_payment, withdrawal, refund, bonus]
 *         description: Filter by payment purpose
 *     responses:
 *       200:
 *         description: Payment intents retrieved successfully
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
 *                     paymentIntents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           purpose:
 *                             type: string
 *                           status:
 *                             type: string
 *                           paymentMethod:
 *                             type: object
 *                           metadata:
 *                             type: object
 *                           expiresAt:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/intents', paymentPersistenceController.getPaymentIntents);

module.exports = router;
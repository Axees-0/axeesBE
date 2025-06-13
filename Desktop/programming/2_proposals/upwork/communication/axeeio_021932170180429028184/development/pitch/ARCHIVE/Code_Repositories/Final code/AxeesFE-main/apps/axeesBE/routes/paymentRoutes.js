const express = require("express");
/** @type {import('express').Router} */
const router = express.Router();
const paymentController = require("../controllers/paymentController");




// Moved to after auth middleware


/**
 * @swagger
 * /payments/session-status:
 *   get:
 *     summary: Retrieve the status of a Stripe session.
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: session_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Stripe checkout session ID.
 *     responses:
 *       200:
 *         description: Session status retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionStatusResponse'
 *       400:
 *         description: Session ID is required.
 *       500:
 *         description: Internal server error.
 */
router.get("/session-status", paymentController.getSessionStatus);




const { manualAuth } = require("../controllers/authController");

// Public routes (no auth required)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

// Apply auth middleware to all subsequent routes
router.use(manualAuth);

// Protected routes (auth required)
router.post("/paymentmethod",paymentController.addPaymentMethod);

/**
 * @swagger
 * /payments/create-checkout-session:
 *   post:
 *     summary: Create a new Stripe checkout session.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutSessionRequest'
 *     responses:
 *       200:
 *         description: Checkout session created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutSessionResponse'
 *       500:
 *         description: Internal server error.
 */
router.post(
  "/create-checkout-session",
  paymentController.createCheckoutSession
);
// apply manualAuth to every route in this router

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment endpoints for handling Stripe sessions, payouts, refunds, and earnings.
 */
router.post("/withdraw", paymentController.withdrawMoney);

/**
 * @swagger
 * /payments/payouts/history:
 *   get:
 *     summary: Retrieve payout history for the authenticated user.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout history retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payout'
 *       500:
 *         description: Internal server error.
 */
router.get("/withdrawals/history", paymentController.getWithdrawalHistory);
router.get("/withdrawal/:withdrawalId", paymentController.withdrawal);

/**
 * @swagger
 * /payments/payouts:
 *   post:
 *     summary: Request a new payout.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayoutRequest'
 *     responses:
 *       201:
 *         description: Payout request created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payout'
 *       400:
 *         description: Invalid input.
 *       500:
 *         description: Internal server error.
 */
router.post("/payouts", paymentController.requestPayout);

/**
 * @swagger
 * /payments/earnings:
 *   get:
 *     summary: Retrieve earnings history for the authenticated user.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings history retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Earnings'
 *       500:
 *         description: Internal server error.
 */
router.get("/earnings", paymentController.getEarnings);

/**
 * @swagger
 * /payments/refund:
 *   post:
 *     summary: Process a refund for a given transaction.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefundRequest'
 *     responses:
 *       200:
 *         description: Refund processed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefundResponse'
 *       400:
 *         description: Invalid request.
 *       500:
 *         description: Internal server error.
 */
router.post("/refund", paymentController.createRefund);



/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Stripe webhook to process payment events.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe event payload.
 *     responses:
 *       200:
 *         description: Event processed successfully.
 *       400:
 *         description: Webhook error.
 */


/**
 * @swagger
 * /payments/cancel-offer/{payoutId}:
 *   post:
 *     summary: Cancel an offer and process a refund with a $1 fee deduction.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payoutId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the payout associated with the offer.
 *     responses:
 *       200:
 *         description: Offer cancelled and refund processed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Offer cancelled and refund processed."
 *                 refundAmount:
 *                   type: number
 *                   example: 9.90
 *                 refundDetails:
 *                   type: object
 *       400:
 *         description: Invalid request.
 *       500:
 *         description: Server error.
 */
// GET /api/payments/earnings/summary
// summary route (more specific)

router.get("/earnings/summary", paymentController.getEarningsSummary);
// individual earning route (parameterized)
router.get("/earnings/:earningId", paymentController.getEarningById);
router.get("/marketer",paymentController.getMarketerPayoutHistory)
router.post("/create-payment-intent", paymentController.createPaymentIntent);
router.post("/confirm-payment", paymentController.confirmPayment);


router.post("/cancel-offer/:payoutId", paymentController.cancelOfferAndProcessRefund);
router.get("/getPayoutById/:payoutId",paymentController.getPayoutById)

/**
 * @swagger
 * /withdraw:
 *   post:
 *     summary: Request a withdrawal
 *     description: This endpoint allows a logged-in user to request a withdrawal from their available balance.
 *     tags: [Withdrawals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: The amount to withdraw
 *                 example: 50
 *               paymentMethodId:
 *                 type: string
 *                 description: The ID of the payment method
 *                 example: "603dcd2eecf0c0d1c40d9f90"
 *     responses:
 *       201:
 *         description: Withdrawal request successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payout:
 *                   type: object
 *                   description: The payout details
 *                   example:
 *                     user: "603dcd2eecf0c0d1c40d9f90"
 *                     amount: 50
 *                     paymentMethod: "Bank Transfer"
 *                     status: "PENDING"
 *                 availableBalance:
 *                   type: number
 *                   description: The user's available balance after the withdrawal
 *                   example: 150
 *       400:
 *         description: Insufficient funds or missing parameters
 *       500:
 *         description: Internal server error
 */
router.post('/withdrawmoney',paymentController.withdrawMoney);

router.get  ("/paymentmethods",     paymentController.fetchPaymentMethods); // ⇦ NEW

module.exports = router;//
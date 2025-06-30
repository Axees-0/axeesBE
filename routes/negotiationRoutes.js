const express = require('express');
const router = express.Router();
const negotiationController = require('../controllers/negotiationController');

/**
 * @swagger
 * tags:
 *   name: Negotiation
 *   description: Deal negotiation and counter offer management
 */

/**
 * @swagger
 * /negotiation/counter-offer:
 *   post:
 *     summary: Create or send a counter offer
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealId
 *               - offerAmount
 *             properties:
 *               dealId:
 *                 type: string
 *                 description: ID of the deal to negotiate
 *               offerAmount:
 *                 type: number
 *                 description: Proposed amount for the counter offer
 *               terms:
 *                 type: object
 *                 description: Additional terms and conditions
 *               message:
 *                 type: string
 *                 description: Message explaining the counter offer
 *     responses:
 *       201:
 *         description: Counter offer created successfully
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
 *                     deal:
 *                       $ref: '#/components/schemas/Deal'
 *                     counterOffer:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to negotiate this deal
 *       404:
 *         description: Deal not found
 */
router.post('/counter-offer', negotiationController.createCounterOffer);

/**
 * @swagger
 * /negotiation/accept:
 *   post:
 *     summary: Accept a counter offer
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealId
 *               - counterOfferId
 *             properties:
 *               dealId:
 *                 type: string
 *                 description: ID of the deal
 *               counterOfferId:
 *                 type: string
 *                 description: ID of the counter offer to accept
 *     responses:
 *       200:
 *         description: Counter offer accepted successfully
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
 *                     deal:
 *                       $ref: '#/components/schemas/Deal'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to accept this offer
 *       404:
 *         description: Deal or counter offer not found
 */
router.post('/accept', negotiationController.acceptCounterOffer);

/**
 * @swagger
 * /negotiation/reject:
 *   post:
 *     summary: Reject a counter offer
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dealId
 *               - counterOfferId
 *             properties:
 *               dealId:
 *                 type: string
 *                 description: ID of the deal
 *               counterOfferId:
 *                 type: string
 *                 description: ID of the counter offer to reject
 *               reason:
 *                 type: string
 *                 description: Reason for rejecting the offer
 *     responses:
 *       200:
 *         description: Counter offer rejected successfully
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
 *                     deal:
 *                       $ref: '#/components/schemas/Deal'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to reject this offer
 *       404:
 *         description: Deal or counter offer not found
 */
router.post('/reject', negotiationController.rejectCounterOffer);

/**
 * @swagger
 * /negotiation/history/{dealId}:
 *   get:
 *     summary: Get negotiation history for a deal
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the deal
 *     responses:
 *       200:
 *         description: Negotiation history retrieved successfully
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
 *                     deal:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         status:
 *                           type: string
 *                         amount:
 *                           type: number
 *                         creator:
 *                           $ref: '#/components/schemas/User'
 *                         marketer:
 *                           $ref: '#/components/schemas/User'
 *                     negotiationHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           userId:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           terms:
 *                             type: object
 *                           message:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, accepted, rejected]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           user:
 *                             $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view this negotiation
 *       404:
 *         description: Deal not found
 */
router.get('/history/:dealId', negotiationController.getNegotiationHistory);

/**
 * @swagger
 * /negotiation/counter-offers/{counterOfferId}:
 *   get:
 *     summary: Get a specific counter offer by ID
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: counterOfferId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the counter offer
 *     responses:
 *       200:
 *         description: Counter offer retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view this counter offer
 *       404:
 *         description: Counter offer not found
 */
router.get('/counter-offers/:counterOfferId', negotiationController.getCounterOfferById);

/**
 * @swagger
 * /negotiation/counter-offers/{counterOfferId}/accept:
 *   post:
 *     summary: Accept a counter offer by ID
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: counterOfferId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the counter offer to accept
 *     responses:
 *       200:
 *         description: Counter offer accepted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to accept this offer
 *       404:
 *         description: Counter offer not found
 */
router.post('/counter-offers/:counterOfferId/accept', negotiationController.acceptCounterOfferById);

/**
 * @swagger
 * /negotiation/counter-offers/{counterOfferId}/reject:
 *   post:
 *     summary: Reject a counter offer by ID
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: counterOfferId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the counter offer to reject
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejecting the offer
 *     responses:
 *       200:
 *         description: Counter offer rejected successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to reject this offer
 *       404:
 *         description: Counter offer not found
 */
router.post('/counter-offers/:counterOfferId/reject', negotiationController.rejectCounterOfferById);

/**
 * @swagger
 * /negotiation/deals/{dealId}/latest-counter-offer:
 *   get:
 *     summary: Get latest counter offer for a deal
 *     tags: [Negotiation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the deal
 *     responses:
 *       200:
 *         description: Latest counter offer retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view this deal
 *       404:
 *         description: Deal or counter offer not found
 */
router.get('/deals/:dealId/latest-counter-offer', negotiationController.getLatestCounterOffer);

module.exports = router;
/* ────────────────────────────────────────────────────────────────
   GHOST ACCOUNT ROUTES – Axees
   Mount path: /api/ghost-accounts (see main.js)
   ───────────────────────────────────────────────────────────── */
const { Router } = require('express');
/** @type {import('express').Router} */
const router = Router();

const ghostAccountController = require('../controllers/ghostAccountController');
const { manualAuth } = require('../controllers/authController'); // JWT guard

/* ───────── Swagger Tag ───────────────────────────────────────── */
/**
 * @swagger
 * tags:
 *   name: GhostAccounts
 *   description: Ghost account management for temporary access
 */

/* ─── POST create ghost account ─────────────────────────────────── */
/**
 * @swagger
 * /ghost-accounts:
 *   post:
 *     summary: Create a ghost account
 *     tags: [GhostAccounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Optional email for ghost account
 *               name:
 *                 type: string
 *                 description: Optional display name
 *               source:
 *                 type: string
 *                 enum: [qr_code, direct_link, social_share]
 *                 description: How the ghost account was created
 *               metadata:
 *                 type: object
 *                 description: Additional metadata (campaign ID, referrer, etc.)
 *     responses:
 *       201:
 *         description: Ghost account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ghostId:
 *                   type: string
 *                 token:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request data
 */
router.post('/', ghostAccountController.createGhostAccount);

/* ─── GET ghost account details ──────────────────────────────────── */
/**
 * @swagger
 * /ghost-accounts/{ghostId}:
 *   get:
 *     summary: Get ghost account details
 *     tags: [GhostAccounts]
 *     parameters:
 *       - in: path
 *         name: ghostId
 *         required: true
 *         schema:
 *           type: string
 *         description: Ghost account ID
 *     responses:
 *       200:
 *         description: Ghost account details
 *       404:
 *         description: Ghost account not found
 */
router.get('/:ghostId', ghostAccountController.getGhostAccount);

/* ─── PUT convert ghost to real account ───────────────────────────── */
/**
 * @swagger
 * /ghost-accounts/{ghostId}/convert:
 *   put:
 *     summary: Convert ghost account to real account
 *     tags: [GhostAccounts]
 *     parameters:
 *       - in: path
 *         name: ghostId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [Creator, Marketer]
 *     responses:
 *       200:
 *         description: Account converted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid data or ghost account already converted
 *       404:
 *         description: Ghost account not found
 */
router.put('/:ghostId/convert', ghostAccountController.convertToRealAccount);

/* ─── DELETE ghost account ────────────────────────────────────────── */
/**
 * @swagger
 * /ghost-accounts/{ghostId}:
 *   delete:
 *     summary: Delete ghost account
 *     tags: [GhostAccounts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: ghostId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Ghost account deleted
 *       404:
 *         description: Ghost account not found
 */
router.delete('/:ghostId', manualAuth, ghostAccountController.deleteGhostAccount);

/* ─── GET analytics for ghost accounts ─────────────────────────────── */
/**
 * @swagger
 * /ghost-accounts/analytics:
 *   get:
 *     summary: Get ghost account analytics
 *     tags: [GhostAccounts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
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
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [qr_code, direct_link, social_share]
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCreated:
 *                   type: number
 *                 totalConverted:
 *                   type: number
 *                 conversionRate:
 *                   type: number
 *                 bySource:
 *                   type: object
 */
router.get('/analytics', manualAuth, ghostAccountController.getAnalytics);

module.exports = router;
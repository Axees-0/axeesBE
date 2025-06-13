/* ────────────────────────────────────────────────────────────────
   FIND ROUTES – AI search pipeline
   Mount path: /api/find
   ───────────────────────────────────────────────────────────── */
   const { Router } = require('express');
   /** @type {import('express').Router} */
   const router = Router();
   
   const findController = require('../controllers/findController');
   const { manualAuth } = require('../controllers/authController'); // admin for /refresh
   
   /* ───────── Swagger Tag ───────────────────────────────────────── */
    /**
     * @swagger
     * tags:
     *   name: Find
     *   description: AI-powered creator discovery
     */
   
   /* ─── GET /api/find  – main search ───────────────────────────── */
    /**
     * @swagger
     * /find:
     *   get:
     *     summary: Search creators (DB + OpenAI back-fill)
     *     tags: [Find]
     *     parameters:
     *       - in: query
     *         name: cursor
     *         schema: { type: string }
     *       - in: query
     *         name: tags
     *         schema: { type: string }
     *       - in: query
     *         name: limit
     *         schema: { type: integer, default: 12 }
     *     responses:
     *       200: { description: Items array + nextCursor }
     */
   router.get('/', findController.searchCreators);
   
   /* ─── POST /api/find/refresh  – force OpenAI pull ─────────────── */
    /**
     * @swagger
     * /find/refresh:
     *   post:
     *     summary: Manually refresh creators via OpenAI (admin only)
     *     tags: [Find]
     *     security: [{ bearerAuth: [] }]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               tags:
     *                 type: array
     *                 items: { type: string }
     *                 example: ["Drift Racing", "Autocross"]
     *               limit: { type: integer, default: 30 }
     *     responses:
     *       200: { description: Upserted creators count }
     */
   router.post('/refresh', manualAuth, findController.manualRefresh);
   
   module.exports = router;
   
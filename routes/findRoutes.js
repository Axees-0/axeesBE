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
     *         name: search
     *         schema: { type: string }
     *         description: General search term
     *       - in: query
     *         name: name
     *         schema: { type: string }
     *         description: Search by influencer name
     *       - in: query
     *         name: location
     *         schema: { type: string }
     *         description: Search by location/city
     *       - in: query
     *         name: city
     *         schema: { type: string }
     *         description: Search by city specifically
     *       - in: query
     *         name: tags
     *         schema: { type: string }
     *         description: Search by category/niche tags
     *       - in: query
     *         name: keywords
     *         schema: { type: string }
     *         description: Content keywords to search for
     *       - in: query
     *         name: hashtags
     *         schema: { type: string }
     *         description: Hashtags to search for (comma-separated)
     *       - in: query
     *         name: contentTypes
     *         schema: { type: string }
     *         description: Content types (reels, carousels, videos, stories, posts)
     *       - in: query
     *         name: platforms
     *         schema: { type: string }
     *         description: Social platforms (Instagram, TikTok, YouTube, Twitter)
     *       - in: query
     *         name: ageRange
     *         schema: { type: string }
     *         description: Target audience age range (18-24, 25-34, etc.)
     *       - in: query
     *         name: gender
     *         schema: { type: string }
     *         description: Target audience gender (Male, Female, Mixed)
     *       - in: query
     *         name: audienceLocation
     *         schema: { type: string }
     *         description: Primary audience location
     *       - in: query
     *         name: ethnicity
     *         schema: { type: string }
     *         description: Primary audience ethnicity
     *       - in: query
     *         name: followerMin
     *         schema: { type: integer }
     *         description: Minimum follower count
     *       - in: query
     *         name: followerMax
     *         schema: { type: integer }
     *         description: Maximum follower count
     *       - in: query
     *         name: influencerTier
     *         schema: { type: string }
     *         description: Influencer tier (nano, micro, mid-tier)
     *       - in: query
     *         name: engagementMin
     *         schema: { type: number }
     *         description: Minimum engagement rate
     *       - in: query
     *         name: engagementMax
     *         schema: { type: number }
     *         description: Maximum engagement rate
     *       - in: query
     *         name: authenticityMin
     *         schema: { type: integer }
     *         description: Minimum authenticity score (1-10)
     *       - in: query
     *         name: recentActivity
     *         schema: { type: boolean }
     *         description: Filter for recent activity (last 30 days)
     *       - in: query
     *         name: fraudDetection
     *         schema: { type: boolean }
     *         description: Enable fraud detection filtering
     *       - in: query
     *         name: suspiciousGrowth
     *         schema: { type: boolean }
     *         description: Exclude suspicious growth patterns (default false)
     *       - in: query
     *         name: competitorAnalysis
     *         schema: { type: boolean }
     *         description: Enable competitive insights analysis
     *       - in: query
     *         name: audienceOverlap
     *         schema: { type: boolean }
     *         description: Analyze audience overlap with competitors
     *       - in: query
     *         name: competitorIds
     *         schema: { type: string }
     *         description: Comma-separated competitor IDs for comparison
     *       - in: query
     *         name: ai
     *         schema: { type: string, enum: ['0', '1'] }
     *         description: Enable AI-powered search
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
   
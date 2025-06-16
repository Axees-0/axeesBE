const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  getDealAgreementSummary,
  getOfferAgreementSummary,
  generateAgreementDocument,
  getAgreementComparison,
  getKeyTermsHighlight
} = require('../controllers/agreementDisplayController');

/**
 * @swagger
 * tags:
 *   name: Agreement Display
 *   description: Concise agreement summaries and document generation for deals and offers
 */

/**
 * @swagger
 * /api/agreements/deals/{dealId}/summary:
 *   get:
 *     summary: Get concise agreement summary for a deal
 *     tags: [Agreement Display]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID to get agreement summary for
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [detailed, compact]
 *           default: detailed
 *         description: Format of the summary
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include agreement change history
 *     responses:
 *       200:
 *         description: Deal agreement summary retrieved successfully
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
 *                     agreement:
 *                       type: object
 *                       properties:
 *                         header:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                             dealNumber:
 *                               type: string
 *                             status:
 *                               type: string
 *                             statusColor:
 *                               type: string
 *                             createdDate:
 *                               type: string
 *                               format: date-time
 *                         parties:
 *                           type: object
 *                           properties:
 *                             creator:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                                 role:
 *                                   type: string
 *                                 followers:
 *                                   type: number
 *                             marketer:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 company:
 *                                   type: string
 *                                 role:
 *                                   type: string
 *                             userRole:
 *                               type: string
 *                               enum: [creator, marketer]
 *                         financials:
 *                           type: object
 *                           properties:
 *                             totalAmount:
 *                               type: number
 *                             currency:
 *                               type: string
 *                             paymentStructure:
 *                               type: string
 *                             paymentStatus:
 *                               type: string
 *                             milestones:
 *                               type: array
 *                               items:
 *                                 type: object
 *                         scope:
 *                           type: object
 *                           properties:
 *                             platforms:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             contentTypes:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             deliverables:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             timeline:
 *                               type: object
 *                         terms:
 *                           type: object
 *                           description: Key terms and conditions
 *                         legal:
 *                           type: object
 *                           description: Legal terms and policies
 *                         status_indicators:
 *                           type: object
 *                           properties:
 *                             overall_health:
 *                               type: number
 *                               description: Deal health score (0-100)
 *                             completion_percentage:
 *                               type: number
 *                               description: Project completion percentage
 *                             risk_factors:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             next_actions:
 *                               type: array
 *                               items:
 *                                 type: object
 *                     userRole:
 *                       type: string
 *                       enum: [creator, marketer]
 *                     permissions:
 *                       type: object
 *                       properties:
 *                         canView:
 *                           type: boolean
 *                         canDownload:
 *                           type: boolean
 *                         canShare:
 *                           type: boolean
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: number
 *       403:
 *         description: Access denied - user is not a participant in this deal
 *       404:
 *         description: Deal not found
 */
router.get('/deals/:dealId/summary', authenticate, getDealAgreementSummary);

/**
 * @swagger
 * /api/agreements/offers/{offerId}/summary:
 *   get:
 *     summary: Get concise agreement summary for an offer
 *     tags: [Agreement Display]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID to get agreement summary for
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [detailed, compact]
 *           default: detailed
 *         description: Format of the summary
 *       - in: query
 *         name: includeNegotiation
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include negotiation history
 *     responses:
 *       200:
 *         description: Offer agreement summary retrieved successfully
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
 *                     agreement:
 *                       type: object
 *                       properties:
 *                         header:
 *                           type: object
 *                           properties:
 *                             title:
 *                               type: string
 *                             offerNumber:
 *                               type: string
 *                             status:
 *                               type: string
 *                             expiryDate:
 *                               type: string
 *                               format: date-time
 *                             timeRemaining:
 *                               type: string
 *                         parties:
 *                           type: object
 *                           description: Creator and marketer information
 *                         proposed_terms:
 *                           type: object
 *                           properties:
 *                             compensation:
 *                               type: object
 *                               properties:
 *                                 amount:
 *                                   type: number
 *                                 currency:
 *                                   type: string
 *                                 type:
 *                                   type: string
 *                             scope:
 *                               type: object
 *                               properties:
 *                                 platforms:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                                 content_types:
 *                                   type: array
 *                                   items:
 *                                     type: string
 *                                 timeline:
 *                                   type: string
 *                             campaign_details:
 *                               type: object
 *                               description: Campaign-specific details
 *                         conditions:
 *                           type: object
 *                           description: Terms and conditions
 *                         decision_factors:
 *                           type: object
 *                           properties:
 *                             pros:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             considerations:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             alternatives:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             recommendation:
 *                               type: object
 *                               properties:
 *                                 action:
 *                                   type: string
 *                                   enum: [accept, negotiate, consider_carefully]
 *                                 confidence:
 *                                   type: string
 *                                   enum: [low, medium, high]
 *                                 reasoning:
 *                                   type: string
 *       403:
 *         description: Access denied
 *       404:
 *         description: Offer not found
 */
router.get('/offers/:offerId/summary', authenticate, getOfferAgreementSummary);

/**
 * @swagger
 * /api/agreements/generate-document:
 *   post:
 *     summary: Generate downloadable agreement document (PDF, Word, etc.)
 *     tags: [Agreement Display]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dealId:
 *                 type: string
 *                 description: Deal ID (required if offerId not provided)
 *               offerId:
 *                 type: string
 *                 description: Offer ID (required if dealId not provided)
 *               format:
 *                 type: string
 *                 enum: [pdf, docx, html]
 *                 default: pdf
 *                 description: Document format
 *               includeSignatures:
 *                 type: boolean
 *                 default: true
 *                 description: Include signature blocks
 *               templateType:
 *                 type: string
 *                 enum: [standard, detailed, simple]
 *                 default: standard
 *                 description: Document template style
 *     responses:
 *       200:
 *         description: Agreement document generated successfully
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
 *                     document:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                         type:
 *                           type: string
 *                         format:
 *                           type: string
 *                         downloadUrl:
 *                           type: string
 *                         previewUrl:
 *                           type: string
 *                         signatures:
 *                           type: object
 *                           properties:
 *                             creator:
 *                               type: object
 *                               properties:
 *                                 required:
 *                                   type: boolean
 *                                 status:
 *                                   type: string
 *                             marketer:
 *                               type: object
 *                               properties:
 *                                 required:
 *                                   type: boolean
 *                                 status:
 *                                   type: string
 *                     downloadUrl:
 *                       type: string
 *                       description: Direct download URL
 *                     format:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: Download link expiration
 *       400:
 *         description: Either dealId or offerId is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Deal or offer not found
 */
router.post('/generate-document', authenticate, generateAgreementDocument);

/**
 * @swagger
 * /api/agreements/comparison:
 *   get:
 *     summary: Compare different versions of an agreement
 *     tags: [Agreement Display]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dealId
 *         schema:
 *           type: string
 *         description: Deal ID (required if offerId not provided)
 *       - in: query
 *         name: offerId
 *         schema:
 *           type: string
 *         description: Offer ID (required if dealId not provided)
 *       - in: query
 *         name: fromVersion
 *         schema:
 *           type: number
 *           default: 1
 *         description: Starting version number for comparison
 *       - in: query
 *         name: toVersion
 *         schema:
 *           type: string
 *           default: current
 *         description: Ending version for comparison ('current' or version number)
 *     responses:
 *       200:
 *         description: Agreement comparison retrieved successfully
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
 *                     comparison:
 *                       type: object
 *                       properties:
 *                         summary:
 *                           type: object
 *                           properties:
 *                             changesCount:
 *                               type: number
 *                               description: Total number of changes
 *                             majorChanges:
 *                               type: number
 *                               description: Number of major changes
 *                             minorChanges:
 *                               type: number
 *                               description: Number of minor changes
 *                             lastChanged:
 *                               type: string
 *                               format: date-time
 *                         changes:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               field:
 *                                 type: string
 *                                 description: Field that was changed
 *                               type:
 *                                 type: string
 *                                 enum: [added, modified, removed]
 *                               from:
 *                                 type: string
 *                                 description: Previous value
 *                               to:
 *                                 type: string
 *                                 description: New value
 *                               impact:
 *                                 type: string
 *                                 enum: [minor, major, critical]
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                     fromVersion:
 *                       type: string
 *                     toVersion:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Either dealId or offerId is required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Deal or offer not found
 */
router.get('/comparison', authenticate, getAgreementComparison);

/**
 * @swagger
 * /api/agreements/deals/{dealId}/key-terms:
 *   get:
 *     summary: Get highlighted key terms for a deal
 *     tags: [Agreement Display]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID to highlight key terms for
 *       - in: query
 *         name: highlightType
 *         schema:
 *           type: string
 *           enum: [all, important, critical]
 *           default: important
 *         description: Level of terms to highlight
 *       - in: query
 *         name: userContext
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include user-specific impact information
 *     responses:
 *       200:
 *         description: Key terms highlighted successfully
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
 *                     keyTerms:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             enum: [financial, timeline, scope, legal, deadline]
 *                           term:
 *                             type: string
 *                             description: Name of the term
 *                           value:
 *                             type: string
 *                             description: Value or description of the term
 *                           importance:
 *                             type: string
 *                             enum: [low, medium, high, critical]
 *                           description:
 *                             type: string
 *                             description: Detailed explanation of the term
 *                           userImpact:
 *                             type: string
 *                             description: How this term impacts the user
 *                     highlightType:
 *                       type: string
 *                     userContext:
 *                       type: boolean
 *                     totalTerms:
 *                       type: number
 *                       description: Total number of highlighted terms
 *                     criticalTerms:
 *                       type: number
 *                       description: Number of critical terms
 *       403:
 *         description: Access denied
 *       404:
 *         description: Deal not found
 */
router.get('/deals/:dealId/key-terms', authenticate, getKeyTermsHighlight);

/**
 * @swagger
 * /api/agreements/offers/{offerId}/key-terms:
 *   get:
 *     summary: Get highlighted key terms for an offer
 *     tags: [Agreement Display]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID to highlight key terms for
 *       - in: query
 *         name: highlightType
 *         schema:
 *           type: string
 *           enum: [all, important, critical]
 *           default: important
 *         description: Level of terms to highlight
 *       - in: query
 *         name: userContext
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include user-specific impact information
 *     responses:
 *       200:
 *         description: Key terms highlighted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Offer not found
 */
router.get('/offers/:offerId/key-terms', authenticate, getKeyTermsHighlight);

module.exports = router;
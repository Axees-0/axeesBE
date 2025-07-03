const express = require('express');
const router = express.Router();
const profileCompletionController = require('../controllers/profileCompletionController');

/**
 * @swagger
 * tags:
 *   name: Profile Completion
 *   description: User profile completion tracking and management
 */

/**
 * @swagger
 * /profile-completion/status:
 *   get:
 *     summary: Get profile completion status for authenticated user
 *     tags: [Profile Completion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile completion status retrieved successfully
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
 *                     completionPercentage:
 *                       type: number
 *                       description: Overall completion percentage (0-100)
 *                     completionChecks:
 *                       type: object
 *                       description: Detailed completion status by section
 *                       properties:
 *                         basicInfo:
 *                           $ref: '#/components/schemas/CompletionSection'
 *                         profileDetails:
 *                           $ref: '#/components/schemas/CompletionSection'
 *                         socialLinks:
 *                           $ref: '#/components/schemas/CompletionSection'
 *                         accountSetup:
 *                           $ref: '#/components/schemas/CompletionSection'
 *                         paymentSetup:
 *                           $ref: '#/components/schemas/CompletionSection'
 *                     missingRequired:
 *                       type: number
 *                       description: Number of missing required fields
 *                     nextAction:
 *                       type: object
 *                       description: Recommended next action
 *                       properties:
 *                         type:
 *                           type: string
 *                           enum: [complete_required, complete_optional]
 *                         message:
 *                           type: string
 *                         field:
 *                           type: string
 *                         section:
 *                           type: string
 *                     isProfileComplete:
 *                       type: boolean
 *                       description: Whether profile is 100% complete
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/status', profileCompletionController.getCompletionStatus);

/**
 * @swagger
 * /profile-completion/update-field:
 *   post:
 *     summary: Update a specific profile field
 *     tags: [Profile Completion]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field
 *               - value
 *             properties:
 *               field:
 *                 type: string
 *                 description: Name of the field to update
 *                 example: bio
 *               value:
 *                 description: New value for the field
 *                 example: "I'm a content creator focused on lifestyle and fashion"
 *               section:
 *                 type: string
 *                 description: Section the field belongs to (for nested objects)
 *                 example: socialLinks
 *     responses:
 *       200:
 *         description: Profile field updated successfully
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
 *                     field:
 *                       type: string
 *                     value:
 *                       description: Updated value
 *                     user:
 *                       type: object
 *                       description: Updated user data
 *                     completion:
 *                       type: object
 *                       description: Updated completion status
 *       400:
 *         description: Invalid field or value
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/update-field', profileCompletionController.updateProfileField);

/**
 * @swagger
 * /profile-completion/tips:
 *   get:
 *     summary: Get profile completion tips and recommendations
 *     tags: [Profile Completion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile completion tips retrieved successfully
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
 *                     tips:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                             description: Category of the tip
 *                           tip:
 *                             type: string
 *                             description: Helpful tip text
 *                           completed:
 *                             type: boolean
 *                             description: Whether this tip is already completed
 *                           priority:
 *                             type: string
 *                             enum: [high, medium, low]
 *                             description: Priority level of the tip
 *                     completedCount:
 *                       type: number
 *                       description: Number of completed tips
 *                     totalCount:
 *                       type: number
 *                       description: Total number of tips
 *                     completionRate:
 *                       type: number
 *                       description: Completion rate percentage
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/tips', profileCompletionController.getCompletionTips);

/**
 * @swagger
 * /profile-completion/complete:
 *   post:
 *     summary: Mark profile setup as complete
 *     tags: [Profile Completion]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile setup marked as complete successfully
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         setupComplete:
 *                           type: boolean
 *                         setupCompletedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Cannot mark as complete - required fields missing
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
 *                     missingRequired:
 *                       type: number
 *                     nextAction:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/complete', profileCompletionController.markSetupComplete);

/**
 * @swagger
 * components:
 *   schemas:
 *     CompletionSection:
 *       type: object
 *       properties:
 *         completed:
 *           type: boolean
 *           description: Whether this section is completed
 *         required:
 *           type: boolean
 *           description: Whether this section is required
 *         weight:
 *           type: number
 *           description: Weight of this section in overall completion
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 description: Field name
 *               completed:
 *                 type: boolean
 *                 description: Whether this field is completed
 *               label:
 *                 type: string
 *                 description: Human-readable label for this field
 */

module.exports = router;
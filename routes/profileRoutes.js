const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  getProfileCompletion,
  updateProfile,
  getProfileChecklist,
  checkProfileRequirements
} = require('../controllers/profileController');

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Profile management and completion tracking
 */

/**
 * @swagger
 * /api/profile/completion:
 *   get:
 *     summary: Get profile completion status
 *     tags: [Profile]
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
 *                       description: Profile completion percentage (0-100)
 *                     requiredFields:
 *                       type: object
 *                       description: Required fields by category
 *                     missingFields:
 *                       type: object
 *                       properties:
 *                         basic:
 *                           type: array
 *                           items:
 *                             type: string
 *                         roleSpecific:
 *                           type: array
 *                           items:
 *                             type: string
 *                         verification:
 *                           type: array
 *                           items:
 *                             type: string
 *                         financial:
 *                           type: array
 *                           items:
 *                             type: string
 *                         preferences:
 *                           type: array
 *                           items:
 *                             type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           priority:
 *                             type: string
 *                             enum: [high, medium, low]
 *                           category:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           actions:
 *                             type: array
 *                             items:
 *                               type: object
 *                     isComplete:
 *                       type: boolean
 *                       description: Whether profile is 100% complete
 *                     canSendOffers:
 *                       type: boolean
 *                       description: Whether user can send offers (marketers need 80%+)
 *                     lastCalculated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/completion', authenticate, getProfileCompletion);

/**
 * @swagger
 * /api/profile/update:
 *   put:
 *     summary: Update user profile with completion tracking
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               creatorData:
 *                 type: object
 *                 properties:
 *                   socialPlatforms:
 *                     type: array
 *                   portfolio:
 *                     type: array
 *                   categories:
 *                     type: array
 *               marketerData:
 *                 type: object
 *                 properties:
 *                   companyName:
 *                     type: string
 *                   website:
 *                     type: string
 *                   industry:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         profileCompletion:
 *                           type: object
 *                           properties:
 *                             score:
 *                               type: number
 *                             previousScore:
 *                               type: number
 *                             improved:
 *                               type: boolean
 *                             isComplete:
 *                               type: boolean
 *                     message:
 *                       type: string
 *                       description: Congratulations message if profile is now complete
 *       400:
 *         description: Invalid update data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/update', authenticate, updateProfile);

/**
 * @swagger
 * /api/profile/checklist:
 *   get:
 *     summary: Get profile completion checklist
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile checklist retrieved successfully
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
 *                     checklist:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           weight:
 *                             type: number
 *                           items:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 label:
 *                                   type: string
 *                                 completed:
 *                                   type: boolean
 *                                 required:
 *                                   type: boolean
 *                     totalSteps:
 *                       type: number
 *                       description: Total number of checklist items
 *                     completedSteps:
 *                       type: number
 *                       description: Number of completed items
 *                     role:
 *                       type: string
 *                       enum: [creator, marketer]
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/checklist', authenticate, getProfileChecklist);

/**
 * @swagger
 * /api/profile/requirements:
 *   get:
 *     summary: Check if user meets profile requirements for specific actions
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [sendOffer, acceptOffer, createDeal, withdrawFunds]
 *         description: Action to check requirements for
 *     responses:
 *       200:
 *         description: Profile requirements checked successfully
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
 *                     action:
 *                       type: string
 *                       description: The action being checked
 *                     canPerformAction:
 *                       type: boolean
 *                       description: Whether user can perform the action
 *                     currentScore:
 *                       type: number
 *                       description: User's current profile completion score
 *                     requiredScore:
 *                       type: number
 *                       description: Minimum score required for the action
 *                     missingRequirements:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of missing required fields
 *                     message:
 *                       type: string
 *                       description: Descriptive message about the requirements
 *       400:
 *         description: Missing action parameter
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/requirements', authenticate, checkProfileRequirements);

module.exports = router;
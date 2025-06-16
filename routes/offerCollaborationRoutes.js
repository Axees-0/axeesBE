const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authenticate');
const {
  startEditingSession,
  updateEditingActivity,
  endEditingSession,
  getActiveCollaborators,
  checkConflicts,
  applyChanges,
  getCollaborationHistory,
  getCollaborationStatus,
  forceEndAllSessions
} = require('../controllers/offerCollaborationController');

/**
 * @swagger
 * tags:
 *   name: Offer Collaboration
 *   description: Real-time collaboration features for offer editing (Bug #3)
 */

/**
 * @swagger
 * /api/offers/{offerId}/collaboration/start:
 *   post:
 *     summary: Start editing session for real-time collaboration
 *     tags: [Offer Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID starting the editing session
 *               section:
 *                 type: string
 *                 enum: [general, basic_info, pricing, timeline, deliverables, platforms]
 *                 default: general
 *                 description: Section being edited
 *     responses:
 *       200:
 *         description: Editing session started successfully
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
 *                     session:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                         userName:
 *                           type: string
 *                         section:
 *                           type: string
 *                         startedAt:
 *                           type: string
 *                           format: date-time
 *                         sessionId:
 *                           type: string
 *                     collaborators:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           section:
 *                             type: string
 *                           lastActivity:
 *                             type: string
 *                             format: date-time
 *                     offerVersion:
 *                       type: number
 *                       description: Server offer version timestamp
 *                     pollInterval:
 *                       type: number
 *                       description: Recommended polling interval in milliseconds
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Access denied
 *       404:
 *         description: Offer not found
 */
router.post('/:offerId/collaboration/start', authenticate, startEditingSession);

/**
 * @swagger
 * /api/offers/{offerId}/collaboration/activity:
 *   put:
 *     summary: Update editing activity (heartbeat for active editing)
 *     tags: [Offer Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               section:
 *                 type: string
 *                 description: Current section being edited
 *               changes:
 *                 type: object
 *                 description: Pending changes (for conflict detection)
 *               activity:
 *                 type: string
 *                 enum: [typing, idle, reviewing]
 *                 description: Current activity type
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *       400:
 *         description: Invalid request
 */
router.put('/:offerId/collaboration/activity', authenticate, updateEditingActivity);

/**
 * @swagger
 * /api/offers/{offerId}/collaboration/end:
 *   post:
 *     summary: End editing session
 *     tags: [Offer Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID ending the session
 *     responses:
 *       200:
 *         description: Editing session ended successfully
 *       400:
 *         description: Invalid request
 */
router.post('/:offerId/collaboration/end', authenticate, endEditingSession);

/**
 * @swagger
 * /api/offers/{offerId}/collaboration/collaborators:
 *   get:
 *     summary: Get active collaborators (polling endpoint)
 *     tags: [Offer Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Active collaborators retrieved successfully
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
 *                     collaborators:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           userAvatar:
 *                             type: string
 *                           section:
 *                             type: string
 *                           lastActivity:
 *                             type: string
 *                             format: date-time
 *                           pendingChanges:
 *                             type: object
 *                     sectionActivity:
 *                       type: object
 *                       description: Section-level editing activity
 *                     offerVersion:
 *                       type: number
 *                       description: Current offer version
 *                     hasActiveCollaborators:
 *                       type: boolean
 *                     nextPoll:
 *                       type: number
 *                       description: Suggested next poll timestamp
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Access denied
 */
router.get('/:offerId/collaboration/collaborators', authenticate, getActiveCollaborators);

/**
 * @swagger
 * /api/offers/{offerId}/collaboration/conflicts:
 *   post:
 *     summary: Check for conflicts before saving changes
 *     tags: [Offer Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - clientVersion
 *               - sections
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               clientVersion:
 *                 type: number
 *                 description: Client offer version timestamp
 *               sections:
 *                 type: object
 *                 description: Changes by section
 *                 properties:
 *                   basic_info:
 *                     type: object
 *                   pricing:
 *                     type: object
 *                   timeline:
 *                     type: object
 *                   deliverables:
 *                     type: object
 *                   platforms:
 *                     type: object
 *     responses:
 *       200:
 *         description: Conflict check completed
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
 *                     hasConflicts:
 *                       type: boolean
 *                     conflicts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [version_conflict, section_conflict]
 *                           section:
 *                             type: string
 *                           message:
 *                             type: string
 *                           conflictedBy:
 *                             type: string
 *                     warnings:
 *                       type: array
 *                       items:
 *                         type: object
 *                     canProceed:
 *                       type: boolean
 *                     serverVersion:
 *                       type: number
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Invalid request
 */
router.post('/:offerId/collaboration/conflicts', authenticate, checkConflicts);

/**
 * @swagger
 * /api/offers/{offerId}/collaboration/apply:
 *   post:
 *     summary: Apply changes with conflict resolution
 *     tags: [Offer Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - changes
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               changes:
 *                 type: object
 *                 properties:
 *                   clientVersion:
 *                     type: number
 *                     description: Client version when changes were made
 *                   sections:
 *                     type: object
 *                     description: Changes organized by section
 *               resolutionStrategy:
 *                 type: string
 *                 enum: [merge, overwrite, cancel]
 *                 default: merge
 *                 description: How to handle conflicts
 *               forceOverride:
 *                 type: boolean
 *                 default: false
 *                 description: Force apply changes despite conflicts
 *     responses:
 *       200:
 *         description: Changes applied successfully
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
 *                     appliedChanges:
 *                       type: object
 *                       description: Changes that were successfully applied
 *                     newVersion:
 *                       type: number
 *                       description: New offer version after changes
 *                     conflictsResolved:
 *                       type: number
 *                     warningsHandled:
 *                       type: number
 *       409:
 *         description: Conflicts detected - resolution required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 conflicts:
 *                   type: array
 *                 requiresResolution:
 *                   type: boolean
 *                   example: true
 *                 resolutionOptions:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request
 */
router.post('/:offerId/collaboration/apply', authenticate, applyChanges);

/**
 * @swagger
 * /api/offers/{offerId}/collaboration/history:
 *   get:
 *     summary: Get collaboration history for an offer
 *     tags: [Offer Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of history items to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: Collaboration history retrieved successfully
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
 *                     history:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           user:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               avatar:
 *                                 type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           action:
 *                             type: string
 *                           section:
 *                             type: string
 *                           changes:
 *                             type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalItems:
 *                           type: integer
 *                         itemsPerPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Access denied
 */
router.get('/:offerId/collaboration/history', authenticate, getCollaborationHistory);

/**
 * @swagger
 * /api/offers/{offerId}/collaboration/status:
 *   get:
 *     summary: Get collaboration status for offer (quick status check)
 *     tags: [Offer Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Collaboration status retrieved successfully
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
 *                     isCollaborating:
 *                       type: boolean
 *                       description: Whether collaborative editing is active
 *                     totalCollaborators:
 *                       type: integer
 *                     currentUserActive:
 *                       type: boolean
 *                       description: Whether the requesting user has an active session
 *                     sectionsBeingEdited:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of sections currently being edited
 *                     lastActivity:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp of last collaborative activity
 *                     offerVersion:
 *                       type: number
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Access denied
 */
router.get('/:offerId/collaboration/status', authenticate, getCollaborationStatus);

/**
 * @swagger
 * /api/offers/{offerId}/collaboration/force-end:
 *   post:
 *     summary: Force end all editing sessions (admin/cleanup endpoint)
 *     tags: [Offer Collaboration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Offer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Admin user ID
 *               reason:
 *                 type: string
 *                 default: Manual cleanup
 *                 description: Reason for ending all sessions
 *     responses:
 *       200:
 *         description: All editing sessions ended successfully
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
 *                     endedSessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           sessionDuration:
 *                             type: number
 *                             description: Session duration in milliseconds
 *                     reason:
 *                       type: string
 *                     totalSessionsEnded:
 *                       type: integer
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Access denied
 */
router.post('/:offerId/collaboration/force-end', authenticate, forceEndAllSessions);

module.exports = router;
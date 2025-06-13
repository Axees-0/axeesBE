// routes/dealExecutionRoutes.js
const express = require("express");
const router = express.Router();
const dealExecutionController = require("../controllers/dealExecutionController");

/**
 * @swagger
 * components:
 *   schemas:
 *     MilestoneSubmission:
 *       type: object
 *       required:
 *         - milestoneId
 *         - deliverables
 *       properties:
 *         milestoneId:
 *           type: string
 *           description: ID of the milestone to submit
 *         deliverables:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [file, text, url]
 *               url:
 *                 type: string
 *               content:
 *                 type: string
 *               originalName:
 *                 type: string
 *         notes:
 *           type: string
 *           description: Optional notes for the submission
 *     
 *     MilestoneApproval:
 *       type: object
 *       required:
 *         - milestoneId
 *         - action
 *       properties:
 *         milestoneId:
 *           type: string
 *           description: ID of the milestone to approve/reject
 *         action:
 *           type: string
 *           enum: [approve, reject]
 *         feedback:
 *           type: string
 *           description: Required when rejecting
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Optional rating when approving
 *     
 *     DealCompletion:
 *       type: object
 *       properties:
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         feedback:
 *           type: string
 *         triggerFinalPayment:
 *           type: boolean
 *           default: false
 */

/**
 * @swagger
 * /api/v1/deals/{id}/submit-milestone:
 *   put:
 *     summary: Submit milestone deliverables
 *     description: Creator submits deliverables for a milestone
 *     tags: [Deal Execution]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MilestoneSubmission'
 *     responses:
 *       200:
 *         description: Milestone submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 milestone:
 *                   type: object
 *       400:
 *         description: Invalid request or duplicate submission
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only creator can submit milestones
 *       404:
 *         description: Deal or milestone not found
 */
router.put("/:id/submit-milestone", dealExecutionController.submitMilestone);

/**
 * @swagger
 * /api/v1/deals/{id}/approve-milestone:
 *   put:
 *     summary: Approve or reject milestone submission
 *     description: Marketer approves or rejects submitted milestone deliverables
 *     tags: [Deal Execution]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MilestoneApproval'
 *     responses:
 *       200:
 *         description: Milestone reviewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 milestone:
 *                   type: object
 *       400:
 *         description: Invalid request or milestone not in reviewable state
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only marketer can approve/reject milestones
 *       404:
 *         description: Deal or milestone not found
 */
router.put("/:id/approve-milestone", dealExecutionController.approveMilestone);

/**
 * @swagger
 * /api/v1/deals/{id}/complete:
 *   post:
 *     summary: Complete a deal
 *     description: Marketer completes a deal with optional rating and final payment
 *     tags: [Deal Execution]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DealCompletion'
 *     responses:
 *       200:
 *         description: Deal completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deal:
 *                   type: object
 *       400:
 *         description: Invalid request or incomplete milestones
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Only marketer can complete deals
 *       404:
 *         description: Deal not found
 */
router.post("/:id/complete", dealExecutionController.completeDeal);

/**
 * @swagger
 * /api/v1/deals/{id}/upload-deliverable:
 *   post:
 *     summary: Upload files for milestone deliverables
 *     description: Upload files that can be used as milestone deliverables
 *     tags: [Deal Execution]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Deal ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: No files uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/upload-deliverable", dealExecutionController.uploadDeliverable);

module.exports = router;
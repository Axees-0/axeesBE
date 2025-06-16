const express = require("express");
const router = express.Router();
const dealController = require("../controllers/marketerDealController");
<<<<<<< HEAD
=======
const dealExecutionController = require("../controllers/dealExecutionController");
>>>>>>> feature/testing-infrastructure

/**
 * @swagger
 * components:
 *   schemas:
 *     Milestone:
 *       type: object
 *       required:
 *         - name
 *         - amount
 *         - dueDate
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the milestone
 *         name:
 *           type: string
 *           description: Name of the milestone
 *         amount:
 *           type: number
 *           description: Amount to be paid for this milestone
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the milestone
 *         description:
 *           type: string
 *           description: Optional description of the milestone
 *         status:
 *           type: string
 *           enum: [pending, paid, in_review, completed, proposed]
 *           description: Current status of the milestone
 *         type:
 *           type: string
 *           enum: [marketer, creator]
 *           description: Who created the milestone
 *         deliverables:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               type:
 *                 type: string
 *               url:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               submittedAt:
 *                 type: string
 *                 format: date-time
 *               submittedBy:
 *                 type: string
 *         feedback:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               feedback:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               createdBy:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *         fundedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/deals/{dealId}/milestones:
 *   post:
 *     summary: Add or propose a new milestone
 *     description: Marketers can add milestones directly, Creators can propose milestones when no active milestone exists
 *     tags: [Milestones]
 *     parameters:
 *       - in: path
 *         name: dealId
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
 *               - name
 *               - amount
 *               - dueDate
 *               - userId
 *               - userType
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               description:
 *                 type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Milestone created or proposed successfully
 *       400:
 *         description: Cannot propose new milestone while another is active
 *       403:
 *         description: Not authorized to perform this action
 */
router.post("/:dealId/milestones", dealController.addMilestone);

/**
 * @swagger
 * /api/deals/{dealId}/milestones/{milestoneId}/submit:
 *   post:
 *     summary: Submit work for a milestone
 *     description: Allows creator to submit work for a funded milestone
 *     tags: [Milestones]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
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
 *               - deliverables
 *               - userId
 *               - userType
 *             properties:
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     url:
 *                       type: string
 *                     description:
 *                       type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work submitted successfully
 *       400:
 *         description: Can only submit work for paid milestones
 *       403:
 *         description: Only creator can submit work
 */
router.post(
  "/:dealId/milestones/:milestoneId/submit",
  dealController.submitMilestoneWork
);

/**
 * @swagger
 * /api/deals/{dealId}/milestones/{milestoneId}/review:
 *   post:
 *     summary: Review submitted milestone work
 *     description: Allows marketer to review work and either approve or request revisions
 *     tags: [Milestones]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
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
 *               - status
 *               - userId
 *               - userType
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, revision_required]
 *               feedback:
 *                 type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review submitted successfully
 *       400:
 *         description: Can only review submissions in review status
 *       403:
 *         description: Only marketer can review submissions
 */
router.post(
  "/:dealId/milestones/:milestoneId/review",
  dealController.reviewMilestoneSubmission
);

/**
 * @swagger
 * /api/deals/{dealId}/milestones/{milestoneId}/fund:
 *   post:
 *     summary: Fund a milestone
 *     description: Allows marketer to fund a pending milestone
 *     tags: [Milestones]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
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
 *               - transactionId
 *               - amount
 *               - userId
 *               - userType
 *             properties:
 *               transactionId:
 *                 type: string
 *               amount:
 *                 type: number
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Milestone funded successfully
 *       400:
 *         description: Can only fund pending milestones
 *       403:
 *         description: Only marketer can fund milestones
 */
router.post(
  "/:dealId/milestones/:milestoneId/fund",
  dealController.fundMilestone
);

/**
 * @swagger
 * /api/deals/{dealId}/milestones/{milestoneId}:
 *   get:
 *     summary: Get milestone details
 *     description: Get details of a specific milestone
 *     tags: [Milestones]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Milestone details retrieved successfully
 *       403:
 *         description: Not authorized to view this milestone
 *       404:
 *         description: Milestone not found
 */
router.get("/:dealId/milestones/:milestoneId", dealController.getMilestone);

/**
 * @swagger
 * /api/deals/{dealId}/milestones:
 *   get:
 *     summary: List all milestones
 *     description: Get all milestones for a deal
 *     tags: [Milestones]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userType
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of milestones retrieved successfully
 *       403:
 *         description: Not authorized to view these milestones
 *       404:
 *         description: Deal not found
 */
router.get("/:dealId/milestones", dealController.listMilestones);

/**
 * @swagger
 * /api/deals/{dealId}/milestones/{milestoneId}/resubmit:
 *   post:
 *     summary: Resubmit work for a milestone
 *     description: Allows creator to resubmit work when revision is required
 *     tags: [Milestones]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: milestoneId
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
 *               - userId
 *               - userType
 *             properties:
 *               description:
 *                 type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work resubmitted successfully
 *       400:
 *         description: Can only resubmit work when revision is required
 *       403:
 *         description: Only creator can resubmit work
 */
router.post(
  "/:dealId/milestones/:milestoneId/resubmit",
  dealController.resubmitMilestoneWork
);

/**
 * @swagger
 * /api/deals/{dealId}/offer-content:
 *   post:
 *     summary: Submit offer content
 *     description: Allows creator to submit content for the entire offer
 *     tags: [Offer Content]
 *     parameters:
 *       - in: path
 *         name: dealId
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
 *               - userId
 *               - userType
 *             properties:
 *               description:
 *                 type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer content submitted successfully
 *       403:
 *         description: Only creator can submit offer content
 *       404:
 *         description: Deal not found
 */
router.post("/:dealId/offer-content", dealController.submitOfferContent);

/**
 * @swagger
 * /api/deals/{dealId}/approve-offer-content:
 *   post:
 *     summary: Approve offer content
 *     description: Allows marketer to approve offer content and trigger payment
 *     tags: [Offer Content]
 *     parameters:
 *       - in: path
 *         name: dealId
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
 *               - userId
 *               - userType
 *             properties:
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Offer content approved and payment processed
 *       400:
 *         description: No offer content to approve
 *       403:
 *         description: Only marketer can approve offer content
 *       404:
 *         description: Deal not found
 */
router.post(
  "/:dealId/approve-offer-content",
  dealController.approveOfferContent
);

/**
 * @swagger
 * /api/deals/{dealId}/request-offer-content-revision:
 *   post:
 *     summary: Request offer content revision
 *     description: Allows marketer to request revisions on offer content
 *     tags: [Offer Content]
 *     parameters:
 *       - in: path
 *         name: dealId
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
 *               - feedback
 *               - userId
 *               - userType
 *             properties:
 *               feedback:
 *                 type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Revision requested successfully
 *       400:
 *         description: No offer content to revise
 *       403:
 *         description: Only marketer can request revisions
 *       404:
 *         description: Deal not found
 */
router.post(
  "/:dealId/request-offer-content-revision",
  dealController.requestOfferContentRevision
);

/**
 * @swagger
 * /api/deals/{dealId}/submit-proof:
 *   post:
 *     summary: Submit proof for a deal
 *     description: Allows creator to submit proof for a deal
 *     tags: [Proof]
 *     parameters:
 *       - in: path
 *         name: dealId
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
 *               - userId
 *               - userType
 *             properties:
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proof submitted successfully
 *       403:
 *         description: Only creator can submit proof
 *       404:
 *         description: Deal not found
 */
router.post("/:dealId/submit-proof", dealController.submitProof);

/**
 * @swagger
 * /api/deals/{dealId}/proofs/{proofId}/review:
 *   post:
 *     summary: Review submitted proof
 *     description: Allows marketer to review proof and either approve or request revisions
 *     tags: [Proof]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: proofId
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
 *               - status
 *               - userId
 *               - userType
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, revision_required]
 *               feedback:
 *                 type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proof reviewed successfully
 *       400:
 *         description: Can only review proofs in pending status
 *       403:
 *         description: Only marketer can review proofs
 */
router.post("/:dealId/proofs/:proofId/review", dealController.reviewProof);

/**
 * @swagger
 * /api/deals/{dealId}/proofs/{proofId}/resubmit:
 *   post:
 *     summary: Resubmit proof
 *     description: Allows creator to resubmit proof when revision is required
 *     tags: [Proof]
 *     parameters:
 *       - in: path
 *         name: dealId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: proofId
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
 *               - userId
 *               - userType
 *             properties:
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proof resubmitted successfully
 *       400:
 *         description: Can only resubmit proof when revision is required
 *       403:
 *         description: Only creator can resubmit proof
 */
router.post("/:dealId/proofs/:proofId/resubmit", dealController.resubmitProof);

// Deal routes
router.post("/create", dealController.createDeal);
router.get("/", dealController.getDeals);
router.get("/:dealId", dealController.getDealById);
router.patch("/:dealId", dealController.updateDeal);
router.post("/:dealId/payment", dealController.recordPayment);
router.post("/:dealId/cancel", dealController.cancelDeal);
router.post("/:dealId/archive", dealController.archiveDeal);

// Add this route for editing milestones
router.put("/:dealId/milestones/:milestoneId", dealController.editMilestone);

// Add this route for deleting milestones
router.delete(
  "/:dealId/milestones/:milestoneId",
  dealController.deleteMilestone
);

 //----------------------------------------------------------------------
 // 💸 Release the first 50 % escrow payment
 //
 //   ‣ Front-end is calling “…/release-first-half”, not “…/release-half”
 //   ‣ We keep the old path as a *temporary* alias to avoid breaking any
 //     callers that may already be hitting it.
 //   ‣ When you’re sure nobody else is using the short path, delete it.
 //----------------------------------------------------------------------
 
 // 1️⃣  NEW canonical route (matches FE)
 router.post(
   "/:dealId/release-first-half",
   dealController.releaseFirstHalfEscrow
 );
 
 // 2️⃣  Legacy alias ─ remove once FE is migrated everywhere
 router.post(
   "/:dealId/release-half",
  dealController.releaseFirstHalfEscrow
);

<<<<<<< HEAD
=======
// Deal Execution Routes (for test compatibility)
router.put("/:id/submit-milestone", dealExecutionController.submitMilestone);
router.put("/:id/approve-milestone", dealExecutionController.approveMilestone);
router.post("/:id/complete", dealExecutionController.completeDeal);
router.post("/:id/upload-deliverable", dealExecutionController.uploadDeliverable);

>>>>>>> feature/testing-infrastructure
module.exports = router;

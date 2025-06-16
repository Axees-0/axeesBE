// axeesBE/routes/marketerOfferRoutes.js

const { Router } = require("express");
/** @type {import('express').Router} */
const router = Router();
const marketerOfferCtrl = require("../controllers/marketerOfferController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create temp folder if it doesn't exist
    const tempDir = path.join(__dirname, "../uploads/offers/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || "";
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const uploadFiles = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Configure the multer middleware for different routes
const handleMultipartData = uploadFiles.array("attachments", 10); // Up to 10 files

/**
 * @swagger
 * tags:
 *   name: Marketer - Offers
 *   description: Marketer routes to manage Offers
 */

// ---------------------------------------------------------
// GET /marketer/payment-status
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/payment-status:
 *   get:
 *     summary: Get the payment status for the Marketer
 *     tags: [Marketer - Deals]
 *     responses:
 *       200:
 *         description: Payment status
 */
router.get("/payment-status", marketerOfferCtrl.getPaymentStatus);

// ---------------------------------------------------------
// CREATE OFFER - With file upload support
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers:
 *   post:
 *     summary: Create a new Offer (Draft by default or Sent if desired)
 *     tags: [Marketer - Offers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creatorId
 *               - offerName
 *             properties:
 *               marketerId:
 *                 type: string
 *               creatorId:
 *                 type: string
 *                 description: The ID of the Creator
 *               offerType:
 *                 type: string
 *                 enum: [standard, custom]
 *                 default: standard
 *               offerName:
 *                 type: string
 *               description:
 *                 type: string
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               desiredReviewDate:
 *                 type: string
 *                 format: date-time
 *               desiredPostDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 description: Draft or Sent
 *     responses:
 *       201:
 *         description: Offer created successfully
 *       500:
 *         description: Internal Server Error
 */
router.post("/", marketerOfferCtrl.createOffer);

// ---------------------------------------------------------
// GET OFFERS
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers:
 *   get:
 *     summary: Get all Offers for the Marketer or Creator (depending on role)
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [marketer, creator]
 *         description: Which role is requesting the offers
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: ID of the logged in user (if no JWT)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by Offer status (Draft, Sent, Offer Received, etc.)
 *     responses:
 *       200:
 *         description: A list of Offers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 offers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Offer'
 *                 newDrafts:
 *                   type: array
 *                   description: Drafts without an offerId
 *                 count:
 *                   type: number
 *               example:
 *                 offers: []
 *                 newDrafts: []
 *                 count: 0
 *       500:
 *         description: Internal Server Error
 */
router.get("/", marketerOfferCtrl.getOffers);

// ---------------------------------------------------------
// OFFER BY ID: GET, UPDATE, DELETE
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/{offerId}:
 *   get:
 *     summary: Get details of a single Offer
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *     responses:
 *       200:
 *         description: Offer details
 *       404:
 *         description: Offer not found
 *   put:
 *     summary: Update an existing Offer
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               offerName:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: string
 *               desiredReviewDate:
 *                 type: string
 *               desiredPostDate:
 *                 type: string
 *               notes:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [Draft, Sent, Counter, Accepted, Rejected, etc.]
 *     responses:
 *       200:
 *         description: Offer updated
 *       404:
 *         description: Offer not found
 *   delete:
 *     summary: Delete (or soft-delete) an Offer
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *     responses:
 *       200:
 *         description: Offer deleted
 *       404:
 *         description: Offer not found
 */
router.get("/:offerId", marketerOfferCtrl.getOfferById);
router.put("/:offerId", marketerOfferCtrl.updateOffer);
router.delete("/:offerId", marketerOfferCtrl.deleteOffer);

// ---------------------------------------------------------
// SEND OFFER
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/{offerId}/send:
 *   post:
 *     summary: Send the Offer (Draft -> Sent -> Offer Received)
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *     responses:
 *       200:
 *         description: Offer sent successfully
 *       404:
 *         description: Offer not found
 */
router.post("/:offerId/send", marketerOfferCtrl.sendOffer);

// ---------------------------------------------------------
// COUNTER OFFER
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/{offerId}/counter:
 *   post:
 *     summary: Propose a Counter-offer
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [counterAmount]
 *             properties:
 *               creatorId:
 *                 type: string
 *                 description: ID of the creator if they're the one countering
 *               counterAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Counter-offer posted (Rejected-Countered)
 *       404:
 *         description: Offer not found
 */
router.post(
  "/:offerId/counter",

  marketerOfferCtrl.counterOffer
);

// ---------------------------------------------------------
// ACCEPT OFFER
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/{offerId}/accept:
 *   post:
 *     summary: Accept the final Offer
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *     responses:
 *       200:
 *         description: Offer accepted and a new Deal created
 *       404:
 *         description: Offer not found
 */
router.post("/:offerId/accept", marketerOfferCtrl.acceptOffer);

// ---------------------------------------------------------
// REJECT OFFER
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/{offerId}/reject:
 *   post:
 *     summary: Reject the Offer
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               userId:
 *                 type: string
 *                 description: The user who is rejecting
 *     responses:
 *       200:
 *         description: Offer rejected
 *       404:
 *         description: Offer not found
 */
router.post("/:offerId/reject", marketerOfferCtrl.rejectOffer);

// ---------------------------------------------------------
// MARK OFFER IN REVIEW
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/{offerId}/in-review:
 *   post:
 *     summary: Mark an offer as in review
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *     responses:
 *       200:
 *         description: Offer marked as in review
 *       404:
 *         description: Offer not found
 */
router.post("/:offerId/in-review", marketerOfferCtrl.markOfferInReview);

// ---------------------------------------------------------
// CANCEL OFFER
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/{offerId}/cancel:
 *   post:
 *     summary: Cancel an Offer
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *     responses:
 *       200:
 *         description: Offer cancelled
 *       404:
 *         description: Offer not found
 */
router.post("/:offerId/cancel", marketerOfferCtrl.cancelOffer);

// ---------------------------------------------------------
// SAVE DRAFT (NEW ROUTE)
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/drafts:
 *   post:
 *     summary: Create a new Draft
 *     tags: [Marketer - Offers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               offerId:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: string
 *               offerType:
 *                 type: string
 *               offerName:
 *                 type: string
 *               counterAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               counterReviewDate:
 *                 type: string
 *               counterPostDate:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Draft saved successfully
 *       500:
 *         description: Internal Server Error
 */
router.post("/drafts", marketerOfferCtrl.saveDraft);

// ---------------------------------------------------------
// SAVE DRAFT (IF referencing an existing Offer ID)
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/{offerId}/draft:
 *   put:
 *     summary: Save/update a draft for an existing Offer
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the existing Offer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: string
 *               offerType:
 *                 type: string
 *               offerName:
 *                 type: string
 *               counterAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               counterReviewDate:
 *                 type: string
 *               counterPostDate:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Draft saved successfully
 *       404:
 *         description: Offer not found
 */
router.put("/:offerId/draft", marketerOfferCtrl.saveDraft);

// ---------------------------------------------------------
// GET DRAFT BY ID
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/drafts/{draftId}:
 *   get:
 *     summary: Get a draft by ID
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: draftId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Draft
 *     responses:
 *       200:
 *         description: Draft details
 *       404:
 *         description: Draft not found
 */
router.get("/drafts/:draftId", marketerOfferCtrl.getDraftById);
/**
 * @swagger
 * /marketer/offers/drafts/{draftId}:
 *   put:
 *     summary: Update an existing Draft
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: draftId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Draft
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: string
 *               offerType:
 *                 type: string
 *               offerName:
 *                 type: string
 *               counterAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *               counterReviewDate:
 *                 type: string
 *               counterPostDate:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Draft updated successfully
 *       404:
 *         description: Draft not found
 */
router.put(
  "/drafts/:draftId",

  marketerOfferCtrl.updateExistingDraft
);

// ---------------------------------------------------------
// MARK OFFER AS VIEWED
// ---------------------------------------------------------
/**
 * @swagger
 * /marketer/offers/{offerId}/viewed/{role}:
 *   post:
 *     summary: Mark an offer as viewed by creator or marketer
 *     tags: [Marketer - Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Offer
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [creator, marketer]
 *         description: The role of the viewer
 *     responses:
 *       200:
 *         description: Offer marked as viewed
 *       400:
 *         description: Invalid role
 *       404:
 *         description: Offer not found
 */
router.post("/:offerId/viewed/:role", marketerOfferCtrl.markOfferAsViewed);

module.exports = router;

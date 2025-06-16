// axeesBE/controllers/marketerDealController.js

const Deal = require("../models/deal");
const User = require("../models/User");
const Offer = require("../models/offer");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
// ──────────────────────────────────────────────────────────────────────────────
// mime.lookup() is used further below when attaching the logo to an email.
// We forgot to import the library, triggering:  “ReferenceError: mime is not defined”.
// ──────────────────────────────────────────────────────────────────────────────
const mime        = require("mime-types");
require("dotenv").config();
const nodemailer = require("nodemailer");
const {
  sendPushNotification: showNotifications,
} = require("../utils/pushNotifications");
const earnings = require("../models/earnings");
const payouts = require("../models/payouts");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/* ---------------- Gmail-safe, inline-styled template ---------------- */
const BUTTON_STYLE =
  "background:#430B92;color:#ffffff;text-decoration:none;" +
  "padding:12px 22px;border-radius:5px;font-weight:bold;font-size:14px;" +
  "display:inline-block;";

/** Gmail-safe table-based wrapper (same as marketerOfferController) */
const emailTemplate = (
  htmlBody,
  subject,
  ctaText = "View details",
  ctaLink = "#"
) => `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:30px 15px;">

      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="background:#ffffff;border-radius:8px;">

        <!-- logo -->
        <tr><td align="center" style="padding:25px 25px 0;">
          <img src="cid:axees-logo" width="120" alt="Axees"
               style="display:block;border:0;">
        </td></tr>

        <!-- body -->
        <tr><td style="padding:25px;color:#000;font-size:15px;line-height:1.6;">
          ${htmlBody}
        </td></tr>

        <!-- CTA -->
        <tr><td align="left" style="padding:0 25px 20px;">
          <a href="${ctaLink}" style="${BUTTON_STYLE}">${ctaText}</a>
        </td></tr>

        <!-- footer -->
        <tr><td align="center" style="padding:0 25px 30px;
             color:#888;font-size:12px;line-height:1.4;">
          Thank you,<br>Axees.io
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

// Create mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper functions for formatting
const formatCurrency = (amount, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount
  );

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Generate email content
const generateEmailContent = async (deal, action, recipient, role) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:8081";
  const dealUrl = `${baseUrl}/UOM09MarketerDealDetail?dealId=${deal._id}`;
  const formattedAmount = deal.paymentAmount
    ? formatCurrency(deal.paymentAmount)
    : "";

  let subject, content;
  switch (action) {
    case "deal_created":
      subject = role === "creator" ? "New Deal Created" : "Deal Created";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>${
          role === "creator"
            ? `A new deal "${deal.dealName}" was created with you.`
            : `You created a new deal: "${deal.dealName}".`
        }</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "deal_status_updated":
      subject = "Deal Status Updated";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>Deal "${deal.dealName}" status changed to "${deal.status}".</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "payment_recorded":
      subject = role === "creator" ? "Payment Update" : "Payment Recorded";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>${
          role === "creator"
            ? `A payment of ${formattedAmount} was recorded on deal "${deal.dealName}".`
            : `You recorded a payment of ${formattedAmount} for deal "${deal.dealName}".`
        }</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "deal_archived":
      subject = "Deal Archived";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>Deal "${deal.dealName}" has been archived.</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "new_milestone_created":
      subject = "New Milestone Created";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>A new milestone "${deal.milestoneName}" was created for deal "${deal.dealName}".</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "milestone_proposed":
      subject = "Milestone Proposed";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>Creator proposed a new milestone "${deal.milestoneName}" for deal "${deal.dealName}".</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "milestone_work_submitted":
      subject = "Milestone Work Submitted";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>Creator submitted work for milestone "${deal.milestoneName}" in deal "${deal.dealName}".</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "milestone_approved":
      subject = "Milestone Approved";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>Your milestone "${deal.milestoneName}" in deal "${deal.dealName}" was approved.</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "revision_requested":
      subject = "Revision Requested";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>Your milestone "${deal.milestoneName}" in deal "${deal.dealName}" needs revision.</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "content_posted":
      subject = "Content Posted";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>Creator has posted final content for deal "${deal.dealName}".</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "revised_work_submitted":
      subject = "Revised Work Submitted";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>Creator resubmitted milestone work for "${deal.milestoneName}" in deal "${deal.dealName}".</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "offer_content_submitted":
      subject = "Offer Content Submitted";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>Creator submitted offer content for deal "${deal.dealName}".</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
      break;

    case "50%_payment_released": {
      subject = "50% Payment Released";
      const body = `
        <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">${subject}</h2>
        <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
        <p style="margin:0 0 15px 0;">
          ${
            role === "creator"
              ? `The first half of the deal "<strong>${deal.dealName}</strong>" has been released to you.`
              : `The first half of the deal "<strong>${deal.dealName}</strong>" has been released to the creator.`
          }
        </p>`;
      content = emailTemplate(body, subject, "View Deal Details", dealUrl);
      break;
    }

    default:
      subject = "Deal Update";
      content = emailTemplate(
        `
        <h2>${subject}</h2>
        <p>Hello ${recipient.name},</p>
        <p>There has been an update to deal "${deal.dealName}".</p>
        <a class="button" href="${dealUrl}">View Deal Details</a>
      `,
        subject
      );
  }

  return { subject, content };
};

// Updated notifyUser function
async function notifyUser(userId, title, message, data = {}, targetUrl) {
  try {
    const user = await User.findById(userId).select(
      "+email +deviceToken +name"
    );
    if (!user) return;

    const notificationData = {
      user: userId,
      type: title.toLowerCase().replace(/\s+/g, "_"),
      title,
      subtitle: message,
      unread: true,
      data: {
        targetScreen: "UOM09MarketerDealDetail",
        dealId: data.dealId?.toString() || "",
        type: title.toLowerCase().replace(/\s+/g, "_"),
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ),
      },
    };

    // Save notification to DB
    await Notification.create(notificationData);

    // Send push notification
    if (user.deviceToken) {
      await showNotifications(
        user.deviceToken,
        title,
        message,
        Object.fromEntries(
          Object.entries(notificationData.data).map(([key, value]) => [
            key,
            String(value),
          ])
        )
      );
    }

    // Send email
    if (user.email) {
      const { subject, content } = await generateEmailContent(
        {
          dealName: data.dealName || "Deal",
          _id: data.dealId,
          status: data.newStatus || title,
          paymentAmount: data.paymentAmount,
          milestoneName: data.milestoneName,
        },
        title.toLowerCase().replace(/\s+/g, "_"),
        { name: user.name || "User", email: user.email },
        user.role || "user"
      );

      const mailOptions = {
    from: process.env.EMAIL_FROM || '"Axees Team" <no-reply@axees.com>',
    to:   user.email,
    subject,
    html: content,
    attachments: [
      {
        filename: "logo.png",
        path: path.join(__dirname, "../uploads/assets/icon.png"),
        cid: "axees-logo",
        contentType: mime.lookup("png") || "image/png",
      },
    ],
  };

      const info = await transporter.sendMail(mailOptions);
      console.log(
        "Notification email sent to",
        user.email,
        "MessageId:",
        info.messageId
      );
    }
  } catch (error) {
    console.error("notifyUser error:", error);
  }
}

// Multer config for milestone uploads
const uploadMilestone = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(__dirname, "../uploads/milestones/temp");
      fs.mkdirSync(tempDir, { recursive: true });
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Add this with other Multer configs
const uploadProof = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(__dirname, "../uploads/proofs/temp");
      fs.mkdirSync(tempDir, { recursive: true });
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Standard deal status constants
const DEAL_STATUSES = {
  ACCEPTED: "Accepted",
  IN_PROCESS: "In-Process",
  CANCELLATION: "Cancellation",
  CONTENT_FOR_APPROVAL: "Content for Approval Submitted",
  CONTENT_APPROVED: "Content Approved",
  FINAL_CONTENT_POSTED: "Final Content Posted",
  COMPLETION_PAYMENT: "Completion Payment Issued",
  OFFER_CONTENT_SUBMITTED: "Offer Content Submitted",
  OFFER_CONTENT_APPROVED: "Offer Content Approved",
};

/* ------------------------------------------------------------------
 * CREATE DEAL
 * ------------------------------------------------------------------ */
exports.createDeal = async (req, res) => {
  try {
    const role = req.body.role;
    const userId = req.body.userId;

    let marketerId = null;
    let creatorId = null;

    // Validate role
    if (!role) {
      return res.status(400).json({
        error: "No user role provided (e.g., 'marketer' or 'creator')",
      });
    }

    // Assign Marketer or Creator
    if (role.toLowerCase() === "marketer") {
      marketerId = userId;
      creatorId = req.body.creatorId;
    } else if (role.toLowerCase() === "creator") {
      creatorId = userId;
      marketerId = req.body.marketerId;
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Pull out fields from body
    const {
      dealName,
      platforms,
      deliverables,
      desiredReviewDate,
      desiredPostDate,
      paymentInfo,
      offerId,
    } = req.body;

    const currency = paymentInfo?.currency || "USD";

    // Determine amount
    let agreedAmount;
    if (offerId) {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }
      if (offer.counters?.length > 0) {
        agreedAmount = offer.counters[offer.counters.length - 1].counterAmount;
      } else {
        agreedAmount = offer.proposedAmount;
      }
    } else {
      agreedAmount = paymentInfo?.amount || 0;
    }

    // Generate unique dealNumber
    const latestDeal = await Deal.findOne().sort({ dealNumber: -1 });
    let dealNumber = "D-1001";
    if (latestDeal && latestDeal.dealNumber) {
      const lastNumber = parseInt(latestDeal.dealNumber.slice(2));
      dealNumber = `D-${lastNumber + 1}`;
    }

    const transactionNumber = req.body.transactionNumber || "";

    // Create new deal
    const newDeal = await Deal.create({
      marketerId,
      creatorId,
      dealName,
      offerId,
      dealNumber,
      transactionNumber,
      platforms: platforms || [],
      deliverables: deliverables || [],
      desiredReviewDate,
      desiredPostDate,
      paymentInfo: {
        amount: agreedAmount,
        currency,
        status: DEAL_STATUSES.ACCEPTED,
        transactions: [],
      },
      status: DEAL_STATUSES.ACCEPTED,
    });

    // Notify
    await notifyUser(
      marketerId,
      "Deal Created",
      `You created a new deal: ${dealName}`,
      { dealId: newDeal._id.toString(), dealName }
    );
    if (creatorId) {
      await notifyUser(
        creatorId,
        "New Deal Created",
        `A new deal '${dealName}' was created with you.`,
        { dealId: newDeal._id.toString(), dealName }
      );
    }

    return res.status(201).json({ message: "Deal created", deal: newDeal });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ------------------------------------------------------------------
 * GET DEALS
 * ------------------------------------------------------------------ */
exports.getDeals = async (req, res) => {
  console.log("getdeals");
  try {
    const { role, userId, status, sortBy = "createdAt" } = req.query;
    if (!role) {
      return res.status(400).json({ error: "No user role provided" });
    }

    const query = {};
    if (role.toLowerCase() === "marketer") {
      query.marketerId = userId;
    } else if (role.toLowerCase() === "creator") {
      query.creatorId = userId;
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (status) {
      query.status = status;
    }

    const deals = await Deal.find(query)
      .sort({ [sortBy]: -1 })
      .populate("creatorId", "name userName avatarUrl")
      .populate("marketerId", "name userName avatarUrl")
      .populate({
        path: "offerId",
        select:
          "proposedAmount deliverables description desiredReviewDate desiredPostDate notes counters status",
      })
      .lean();

    // If role=marketer => keep transactionId. If role=creator => remove it
    const results = deals.map((d) => {
      const transactions = d.paymentInfo.transactions.map((t) => {
        if (role.toLowerCase() === "marketer") {
          return t;
        }
        const { transactionId, ...rest } = t;
        return rest;
      });
      return {
        ...d,
        paymentInfo: {
          ...d.paymentInfo,
          transactions,
        },
      };
    });

    return res.json({ deals: results, count: results.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ------------------------------------------------------------------
 * GET DEAL BY ID
 * ------------------------------------------------------------------ */
exports.getDealById = async (req, res) => {
  console.log("getdealsbyId");

  try {
    const { role, userType } = req.query;
    const { dealId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(dealId)) {
      return res.status(400).json({ error: "Invalid deal ID format" });
    }
    
    const deal = await Deal.findById(dealId)
      .populate("creatorId", "name userName avatarUrl")
      .populate("marketerId", "name brandName userName avatarUrl")
      .populate("offerId")
      .lean();
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    const currentRole = role || userType;
    if (
      currentRole &&
      currentRole.toLowerCase() !== "marketer" &&
      deal.paymentInfo?.transactions
    ) {
      // Remove transactionId for non-marketer
      deal.paymentInfo.transactions = deal.paymentInfo.transactions.map((t) => {
        const { transactionId, ...rest } = t;
        return rest;
      });
    }

    res.json({ deal });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ------------------------------------------------------------------
 * UPDATE DEAL
 * ------------------------------------------------------------------ */
exports.updateDeal = async (req, res) => {
  try {
    const { dealId } = req.params;
    const updates = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // only certain fields
    const allowed = [
      "status",
      "notes",
      "attachments",
      "desiredReviewDate",
      "desiredPostDate",
      "paymentInfo",
      "transactionNumber",
    ];
    Object.keys(updates).forEach((k) => {
      if (!allowed.includes(k)) delete updates[k];
    });

    // if paymentInfo updated, set new amount
    if (updates.paymentInfo?.amount !== undefined) {
      updates.paymentInfo.amount = parseFloat(updates.paymentInfo.amount);
      updates.agreedAmount = updates.paymentInfo.amount;
    }

    const oldStatus = deal.status;
    const updatedDeal = await Deal.findByIdAndUpdate(dealId, updates, {
      new: true,
    })
      .populate("creatorId", "name userName avatarUrl")
      .populate("marketerId", "name brandName userName avatarUrl");

    res.json({ message: "Deal updated", deal: updatedDeal });

    // If status changed => notify
    if (updates.status && updates.status !== oldStatus) {
      await notifyUser(
        updatedDeal.marketerId,
        "Deal Status Updated",
        `Deal '${updatedDeal.dealName}' status changed from '${oldStatus}' to '${updates.status}'`,
        { dealId: updatedDeal._id.toString(), newStatus: updates.status }
      );
      await notifyUser(
        updatedDeal.creatorId,
        "Deal Status Updated",
        `Deal '${updatedDeal.dealName}' status changed from '${oldStatus}' to '${updates.status}'`,
        { dealId: updatedDeal._id.toString(), newStatus: updates.status }
      );
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ------------------------------------------------------------------
 * RECORD PAYMENT
 * ------------------------------------------------------------------ */
exports.recordPayment = async (req, res) => {
  console.log('in record payment')
  try {
    const { dealId } = req.params;
    const { paymentAmount, paymentMethod = "CreditCard", transactionId, milestoneId } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    // Add transaction
    const newTransaction = {
      paymentAmount: parseFloat(paymentAmount),
      paymentMethod,
      transactionId,
      status: "Completed",
      paidAt: new Date(),
      type: "escrow",
      ...(milestoneId && { milestoneId }),
    };

    deal.paymentInfo.transactions.push(newTransaction);

    // Update milestone status if this is a milestone payment:
    if (milestoneId) {
      const milestone = deal.milestones.find((m) => m.id.toString() === milestoneId);
      if (milestone) {
        // Always mark as paid on successful payment
        milestone.status = "paid";
        milestone.status   = "active"; // You can also choose "completed" based on your naming convention
        milestone.fundedAt = new Date();
      }
    }

    // Update payment status for the deal
    const totalPaid = deal.paymentInfo.transactions.reduce(
      (acc, t) => acc + (Number(t.paymentAmount) || 0),
      0
    );
    if (totalPaid >= deal.paymentInfo.amount) {
      deal.paymentInfo.paymentStatus = "Escrow Paid";
      deal.status = DEAL_STATUSES.IN_PROCESS;
    } else {
      deal.paymentInfo.paymentStatus = "Partial";
    }

    // Update paymentNeeded and requiredPayment flags
    deal.paymentInfo.paymentNeeded = false;
    deal.paymentInfo.requiredPayment = 0;

    await deal.save();

    // Notify users about the payment
    try {
      await notifyUser(
        deal.marketerId,
        "Payment Recorded",
        `You recorded a payment of ${paymentAmount} for deal '${deal.dealName}'`,
        { dealId: deal._id.toString(), paymentAmount }
      );
      if (deal.creatorId) {
        await notifyUser(
          deal.creatorId,
          "Payment Update",
          `A payment of ${paymentAmount} was recorded on deal '${deal.dealName}'`,
          { dealId: deal._id.toString(), paymentAmount }
        );
      }
    } catch (error) {
      console.error("Error notifying user:", error);
    }

    res.json({ message: "Payment recorded", deal });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


/* ------------------------------------------------------------------
 * CANCEL DEAL
 * ------------------------------------------------------------------ */
exports.cancelDeal = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { user, reason } = req.body;
    const role = user?.role?.toLowerCase();
    const userId = user?._id?.toString();

    // Validate role
    if (!role || !["marketer", "creator"].includes(role)) {
      return res.status(400).json({ error: "Invalid user role." });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    if (deal.status === "Cancelled") {
      return res.status(400).json({ error: "Deal is already cancelled" });
    }

    // Verify authorization
    const isMarketer =
      role === "marketer" && deal.marketerId.toString() === userId;
    const isCreator =
      role === "creator" && deal.creatorId.toString() === userId;
    if (!isMarketer && !isCreator) {
      return res
        .status(403)
        .json({ error: "Unauthorized to cancel this deal" });
    }

    // Fetch dates and current time
    const now = new Date();
    const acceptanceDate = deal.createdAt;
    const reviewDate = deal.desiredReviewDate;
    const postDate = deal.desiredPostDate;

    // Block post-date cancellations
    if (postDate && now >= postDate) {
      return res.status(400).json({
        error: "Post-date cancellations require refund tickets",
      });
    }

    // Calculate days since acceptance
    const daysSinceAcceptance = Math.floor(
      (now - acceptanceDate) / (1000 * 60 * 60 * 24)
    );

    // Handle Marketer Cancellation
    if (role === "marketer") {
      const paymentAmount = deal.paymentInfo?.paymentAmount || 0;
      const escrowDeposit = paymentAmount * 0.5;
      const initialTransaction = deal.paymentInfo.transactions[0];

      if (!initialTransaction?.transactionId) {
        return res.status(400).json({ error: "No escrow payment found" });
      }

      // Policy 1: >1 day after acceptance, before review date
      if (daysSinceAcceptance > 1 && reviewDate && now < reviewDate) {
        const processingFee = 25;
        const penaltyAmount = escrowDeposit * 0.5; // 50% of escrow (25% of total)
        const refundAmount = escrowDeposit - penaltyAmount - processingFee;

        // Process Stripe refund
        const refund = await stripe.refunds.create({
          charge: initialTransaction.transactionId,
          amount: Math.round(refundAmount * 100),
          metadata: { dealId, cancellationType: "policy1-marketer" },
        });

        // Update marketer balance
        const marketer = await User.findById(userId);
        marketer.balance += refundAmount;
        await marketer.save();

        // Update deal
        deal.status = "Cancelled";
        deal.cancellationDetails = {
          reason,
          refundAmount,
          penalty: penaltyAmount,
          processingFee,
          stripeRefundId: refund.id,
          cancelledBy: "marketer",
          cancelledAt: new Date(),
          policy: "Policy 1",
        };
        await deal.save();

        return res.json({
          message: `Marketer cancellation successful. Refunded $${refundAmount}`,
          deal,
        });
      }

      // Within 1 day - full refund
      if (daysSinceAcceptance <= 1) {
        const refund = await stripe.refunds.create({
          charge: initialTransaction.transactionId,
          amount: Math.round(escrowDeposit * 100),
        });

        const marketer = await User.findById(userId);
        marketer.balance += escrowDeposit;
        await marketer.save();

        deal.status = "Cancelled";
        deal.cancellationDetails = {
          reason,
          refundAmount: escrowDeposit,
          cancelledBy: "marketer",
          stripeRefundId: refund.id,
          cancelledAt: new Date(),
          policy: "Full Refund (Within 1 day)",
        };
        await deal.save();

        return res.json({ message: "Full escrow refund processed", deal });
      }

      // Policy 2: On/After Review Date (before post date)
      if (reviewDate && now >= reviewDate) {
        // Transfer full escrow to creator
        const creator = await User.findById(deal.creatorId);
        creator.balance += escrowDeposit;
        await creator.save();

        // Update deal
        deal.status = "Cancelled";
        deal.cancellationDetails = {
          reason,
          penalty: escrowDeposit,
          creatorPayout: escrowDeposit,
          cancelledBy: "marketer",
          cancelledAt: now,
          policy: "Policy 2 (Post-Review)",
        };
        await deal.save();

        return res.json({
          message: `Full escrow of $${escrowDeposit} transferred to creator`,
          deal,
        });
      }
    }

    // Handle Creator Cancellation
    if (role === "creator") {
      const paymentAmount = deal.paymentInfo?.paymentAmount || 0;
      const escrowDeposit = paymentAmount * 0.5;
      const initialTransaction = deal.paymentInfo.transactions[0];

      // Policy 1: >1 day after acceptance, before review date
      if (daysSinceAcceptance > 1 && reviewDate && now < reviewDate) {
        const processingFee = 25;
        const creatorCharge = 100;

        const creator = await User.findById(deal.creatorId);
        if (creator.balance < creatorCharge) {
          return res.status(400).json({
            error: "Insufficient balance. Minimum $100 required to cancel.",
          });
        }

        // Deduct charges
        creator.balance -= creatorCharge;
        await creator.save();

        // Update deal
        deal.status = "Cancelled";
        deal.cancellationDetails = {
          reason,
          creatorCharge,
          processingFee,
          netDeduction: creatorCharge - processingFee,
          cancelledBy: "creator",
          cancelledAt: now,
          policy: "Policy 1",
        };
        await deal.save();

        return res.json({
          message: `Creator cancellation processed. $${creatorCharge} charged ($25 processing fee)`,
          deal,
        });
      }

      // Policy 2: On/After Review Date, before post date
      if (reviewDate && now >= reviewDate && (!postDate || now < postDate)) {
        const creatorCharge = 300;

        const creator = await User.findById(deal.creatorId);
        if (creator.balance < creatorCharge) {
          return res.status(400).json({
            error: "Insufficient balance. Minimum $300 required to cancel.",
          });
        }

        // Deduct $300
        creator.balance -= creatorCharge;
        await creator.save();

        // Refund escrow to marketer
        if (!initialTransaction?.transactionId) {
          return res.status(400).json({ error: "No escrow payment found" });
        }

        const refund = await stripe.refunds.create({
          charge: initialTransaction.transactionId,
          amount: Math.round(escrowDeposit * 100),
        });

        const marketer = await User.findById(deal.marketerId);
        marketer.balance += escrowDeposit;
        await marketer.save();

        // Update deal
        deal.status = "Cancelled";
        deal.cancellationDetails = {
          reason,
          creatorCharge,
          marketerRefund: escrowDeposit,
          stripeRefundId: refund.id,
          cancelledBy: "creator",
          cancelledAt: now,
          policy: "Policy 2",
        };
        await deal.save();

        return res.json({
          message: `Creator cancellation processed. $${creatorCharge} charged. Marketer refunded $${escrowDeposit}.`,
          deal,
        });
      }
    }

    return res.status(400).json({ error: "Invalid cancellation timing" });
  } catch (error) {
    console.error("Cancellation error:", error);
    return res.status(500).json({
      error: error.message,
      stripeError: error.raw?.message,
    });
  }
};

/* ------------------------------------------------------------------
 * ARCHIVE DEAL
 * ------------------------------------------------------------------ */
exports.archiveDeal = async (req, res) => {
  try {
    const { dealId } = req.params;
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (deal.status !== DEAL_STATUSES.COMPLETION_PAYMENT) {
      return res
        .status(400)
        .json({ error: "Only completed deals can be archived" });
    }

    deal.status = DEAL_STATUSES.COMPLETION_PAYMENT;
    await deal.save();

    res.json({ message: "Deal archived", deal });

    await notifyUser(
      deal.marketerId,
      "Deal Archived",
      `Deal '${deal.dealName}' has been archived.`,
      { dealId: deal._id.toString() }
    );
    await notifyUser(
      deal.creatorId,
      "Deal Archived",
      `Deal '${deal.dealName}' has been archived.`,
      { dealId: deal._id.toString() }
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ------------------------------------------------------------------
 * ADD MILESTONE
 * ------------------------------------------------------------------ */
exports.addMilestone = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { name, amount, dueDate, description, bonus, userId, userType } =
      req.body;
// console.log("triggered")
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    const hasActive = deal.milestones?.some((m) =>
      ["pending", "paid", "in_review"].includes(m.status)
    );

    if (userType === "Marketer") {
      if (String(deal.marketerId) !== String(userId)) {
        return res
          .status(403)
          .json({ error: "Only the marketer can add milestones" });
      }
      if (!name || !amount || !dueDate) {
        return res
          .status(400)
          .json({ error: "Name, amount, and due date are required" });
      }

      const milestone = {
        id: new mongoose.Types.ObjectId(),
        name,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        bonus: parseFloat(bonus || 0),
        description,
        status: "pending",
        createdAt: new Date(),
        createdBy: userId,
        type: "marketer",
        deliverables: [],
        feedback: [],
      };
      if (!deal.milestones) deal.milestones = [];
      deal.milestones.push(milestone);
    } else if (userType === "Creator") {
      if (String(deal.creatorId) !== String(userId)) {
        return res
          .status(403)
          .json({ error: "Only the creator can propose milestones" });
      }

      if (hasActive) {
        return res.status(400).json({
          error: "Cannot propose a new milestone while another is active",
        });
      }
      const milestone = {
        id: new mongoose.Types.ObjectId(),
        name,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        bonus: parseFloat(bonus || 0),
        description,
        status: "proposed",
        createdAt: new Date(),
        createdBy: userId,
        type: "creator",
        deliverables: [],
        feedback: [],
      };
      if (!deal.milestones) deal.milestones = [];
      deal.milestones.push(milestone);
    }

    // Adjust total deal amount if needed
    const total = deal.milestones.reduce(
      (sum, m) => sum + (m.status !== "proposed" ? m.amount : 0),
      0
    );
    if (total > deal.paymentInfo.amount) {
      deal.paymentInfo.amount = total;
    }

    await deal.save();


    res.status(201).json({ message: "Milestone added", deal });

    // Notify
    if (userType === "Marketer") {
      await notifyUser(
        deal.creatorId,
        "New Milestone Created",
        `A new milestone ('${name}') was created for deal '${deal.dealName}'.`,
        { dealId: deal._id.toString(), milestoneName: name }
      );
    } else {
      await notifyUser(
        deal.marketerId,
        "Milestone Proposed",
        `Creator proposed a new milestone ('${name}') for deal '${deal.dealName}'.`,
        { dealId: deal._id.toString(), milestoneName: name }
      );
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ------------------------------------------------------------------
 * EDIT MILESTONE (Marketer Only)
 * PUT /api/marketer/deals/:dealId/milestones/:milestoneId
 * ------------------------------------------------------------------ */
exports.editMilestone = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { name, amount, dueDate, description, bonus, userId, userType } =
      req.body;

    // Must be Marketer
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }
    if (String(deal.marketerId) !== String(userId) || userType !== "Marketer") {
      return res
        .status(403)
        .json({ error: "Only the marketer can edit milestones" });
    }

    // Find milestone
    const milestone = deal.milestones.find(
      (m) => String(m.id) === String(milestoneId)
    );
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    // Update fields
    if (name !== undefined) milestone.name = name;
    if (amount !== undefined) milestone.amount = parseFloat(amount);
    if (dueDate !== undefined) milestone.dueDate = new Date(dueDate);
    if (description !== undefined) milestone.description = description;
    if (bonus !== undefined) milestone.bonus = parseFloat(bonus);
    // Recompute total if needed
    const total = deal.milestones.reduce(
      (sum, m) => sum + (m.status !== "proposed" ? m.amount : 0),
      0
    );
    if (total > deal.paymentInfo.amount) {
      deal.paymentInfo.amount = total;
    }

    await deal.save();

   
    res.json({ message: "Milestone updated", deal, milestone });
  } catch (error) {
    console.error("Error editing milestone:", error);
    return res.status(500).json({ error: error.message });
  }
};

/* ------------------------------------------------------------------
 * DELETE MILESTONE (Marketer Only)
 * DELETE /api/marketer/deals/:dealId/milestones/:milestoneId
 * ------------------------------------------------------------------ */
exports.deleteMilestone = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { userId, userType } = req.body; // or from query/body

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (String(deal.marketerId) !== String(userId) || userType !== "Marketer") {
      return res
        .status(403)
        .json({ error: "Only the marketer can delete milestones" });
    }

    const index = deal.milestones.findIndex(
      (m) => String(m.id) === String(milestoneId)
    );
    if (index === -1) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    const milestone = deal.milestones[index];

    // If milestone is in certain statuses, you might disallow deletion
    if (["paid", "in_review", "completed"].includes(milestone.status)) {
      return res.status(400).json({
        error: "Cannot delete a milestone that has progress or payments",
      });
    }

    // Remove it from the array
    deal.milestones.splice(index, 1);

    // Update total
    const total = deal.milestones.reduce(
      (sum, m) => sum + (m.status !== "proposed" ? m.amount : 0),
      0
    );
    deal.paymentInfo.amount = total;

    await deal.save();
    res.json({ message: "Milestone deleted", deal });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * SUBMIT MILESTONE WORK
 */
exports.submitMilestoneWork = (req, res) => {
  uploadMilestone.array("files")(req, res, async (err) => {
    try {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({
          error: `File upload failed: ${err.message}`,
        });
      }

      const { dealId, milestoneId } = req.params;
      const { userId, userType } = req.body;

      const deal = await Deal.findById(dealId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }

      const milestone = deal.milestones.find(
        (m) => m.id.toString() === milestoneId
      );
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      if (
        userType !== "Creator" ||
        deal.creatorId.toString() !== userId.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Only the creator can submit work" });
      }

      // Parse incoming deliverables; fall back to an empty object if not provided
      const deliverablesData = req.body.deliverables
        ? JSON.parse(req.body.deliverables)
        : {};
      const description = deliverablesData.description;

      if (!description?.trim() && (!req.files || req.files.length === 0)) {
        return res.status(400).json({
          error: "Must provide either description or files",
        });
      }

      // Process text deliverables
      const textDeliverables = description
        ? [
            {
              type: "text",
              content: description,
              submittedAt: new Date(),
            },
          ]
        : [];

      const fileAttachments = [];
      if (req.files && req.files.length > 0) {
        const finalDir = path.join(
          __dirname,
          "../uploads/milestones",
          dealId,
          milestoneId
        );
        await fs.promises.mkdir(finalDir, { recursive: true });

        for (const file of req.files) {
          const newPath = path.join(finalDir, file.filename);
          await fs.promises.rename(file.path, newPath);

          fileAttachments.push({
            type: "file",
            url: `/uploads/milestones/${dealId}/${milestoneId}/${file.filename}`,
            originalName: file.originalname,
            submittedAt: new Date(),
          });
        }
      }

      const allDeliverables = [...textDeliverables, ...fileAttachments];

      const submission = {
        id: new mongoose.Types.ObjectId(),
        deliverables: allDeliverables,
        submittedAt: new Date(),
        submittedBy: userId,
        status: "pending_review",
      };

      milestone.status = "in_review";
      milestone.deliverables.push(submission);
      deal.status = DEAL_STATUSES.CONTENT_FOR_APPROVAL;

      await deal.save();

      res.json({
        message: "Work submitted for approval",
        milestone,
        deal,
      });

      // Notify marketer that milestone work has been submitted
      await notifyUser(
        deal.marketerId,
        "Milestone Work Submitted",
        `Creator submitted work for milestone '${milestone.name}' in deal '${deal.dealName}'.`,
        { dealId: deal._id.toString(), milestoneName: milestone.name }
      );
    } catch (error) {
      console.error("Error submitting milestone work:", error);
      return res.status(500).json({ error: error.message });
    }
  });
};

/**
 * REVIEW MILESTONE SUBMISSION
 * Allows marketer to approve or request revision
 */
exports.reviewMilestoneSubmission = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { status, feedback, userId, userType } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    const milestone = deal.milestones.find(
      (m) => m.id.toString() === milestoneId
    );
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    if (
      userType !== "Marketer" ||
      deal.marketerId.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Only the marketer can review submissions" });
    }

    if (milestone.status !== "in_review") {
      return res
        .status(400)
        .json({ error: "Can only review submissions in 'in_review' status" });
    }

    if (!milestone.feedback) {
      milestone.feedback = [];
    }
    milestone.feedback.push({
      id: new mongoose.Types.ObjectId(),
      feedback,
      createdAt: new Date(),
      createdBy: userId,
    });

    if (status === "approved") {
      milestone.status = "approved";
      milestone.approvedAt = new Date();
      
      // Set automatic release date if enabled
      if (deal.paymentInfo?.automaticRelease?.enabled) {
        const releaseDays = deal.paymentInfo.automaticRelease.defaultDays || 7;
        milestone.autoReleaseDate = new Date(Date.now() + (releaseDays * 24 * 60 * 60 * 1000));
        console.log(`📅 Set auto-release date for milestone "${milestone.name}" to ${milestone.autoReleaseDate}`);
      }
      
      // Update deal status
      const allMilestonesApproved = deal.milestones.every(m => 
        m.id.toString() === milestone.id.toString() ? true : ['approved', 'completed'].includes(m.status)
      );
      
      if (allMilestonesApproved) {
        deal.status = DEAL_STATUSES.CONTENT_APPROVED;
      } else {
        deal.status = DEAL_STATUSES.IN_PROCESS;
      }
      
      // Don't release payment immediately - wait for automatic release or manual trigger
      // Payment will be released according to the automatic release schedule

    } else {
      milestone.status = "revision_required";
      deal.status = DEAL_STATUSES.IN_PROCESS;
    }

    await deal.save();

    res.json({
      message:
        status === "approved"
          ? "Milestone completed and payment released"
          : "Revision requested",
      milestone,
      deal,
    });

    if (status === "approved") {
      const releaseMessage = milestone.autoReleaseDate ? 
        `Your milestone '${milestone.name}' in deal '${deal.dealName}' was approved. Payment will be released on ${new Date(milestone.autoReleaseDate).toLocaleDateString()}.` :
        `Your milestone '${milestone.name}' in deal '${deal.dealName}' was approved.`;
      
      await notifyUser(
        deal.creatorId,
        "Milestone Approved",
        releaseMessage,
        { 
          dealId: deal._id.toString(), 
          milestoneName: milestone.name,
          autoReleaseDate: milestone.autoReleaseDate 
        }
      );
    } else {
      await notifyUser(
        deal.creatorId,
        "Revision Requested",
        `Your milestone '${milestone.name}' in deal '${deal.dealName}' needs revision. See feedback.`,
        { dealId: deal._id.toString(), milestoneName: milestone.name }
      );
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Helper function to release milestone payment
async function releaseMilestonePayment(deal, milestone) {
  deal.paymentInfo.transactions.push({
    amount: milestone.amount,
    transactionId: `rel_${milestone.id}`,
    status: "completed",
    type: "release",
    paidAt: new Date(),
    milestoneId: milestone.id,
    recipientId: deal.creatorId,
  });

  // Update milestone status to active after funding
  milestone.status = "active";
  milestone.fundedAt = new Date();

  const allActive = deal.milestones.some((m) =>
    ["active", "in_review"].includes(m.status)
  );
  if (allActive) {
    deal.status = DEAL_STATUSES.IN_PROCESS;
  }
}

/**
 * GET MILESTONE
 */
exports.getMilestone = async (req, res) => {
  console.log("getMilestone");

  try {
    const { dealId, milestoneId } = req.params;
    const { userId } = req.query;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (
      deal.marketerId.toString() !== userId.toString() &&
      deal.creatorId.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this milestone" });
    }

    const milestone = deal.milestones.find(
      (m) => m.id.toString() === milestoneId
    );
    if (!milestone) {
      return res.status(404).json({ error: "Milestone not found" });
    }

    return res.json({ milestone });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * LIST MILESTONES
 */
exports.listMilestones = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { userId } = req.query;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (
      deal.marketerId.toString() !== userId.toString() &&
      deal.creatorId.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view these milestones" });
    }

    return res.json({
      milestones: deal.milestones || [],
      totalCount: deal.milestones?.length || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * FUND MILESTONE
 */
exports.fundMilestone = async (req, res) => {
  try {
    const { dealId, milestoneId } = req.params;
    const { userId, userType } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    // Authorization check
    if (userType !== "Marketer" || String(deal.marketerId) !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const milestone = deal.milestones.find(
      (m) => m.id.toString() === milestoneId
    );
    if (!milestone)
      return res.status(404).json({ error: "Milestone not found" });

    // Calculate amounts
    const platformFee = 9;
    const totalAmount = milestone.amount + platformFee + milestone.bonus;

    // Use the helper function
    const paymentController = require("./paymentController");
    const sessionData = await paymentController.createCheckoutSessionHelper({
      amount: totalAmount,
      metadata: {
        type: "milestoneFunding",
        dealId: dealId,
        milestoneId: milestoneId,
        escrowAmount: milestone.amount,
        bonusAmount: milestone.bonus,
        feeAmount: platformFee,
      },
    });
    

    // Single response
    return res.json({
      sessionId: sessionData.sessionId,
      clientSecret: sessionData.clientSecret,
    });
  } catch (error) {
    console.error("Error funding milestone:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * MARK CONTENT POSTED
 */
exports.markContentPosted = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { userId, userType } = req.body;

    if (!dealId || !userId || !userType) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (!deal.creatorId) {
      return res.status(400).json({ error: "Deal has no creator associated" });
    }

    if (
      userType !== "Creator" ||
      deal.creatorId.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Only the creator can mark content as posted" });
    }

    if (deal.status === "approved" || deal.status === DEAL_STATUSES.CONTENT_APPROVED) {
      totalEarnings = projectPrice;
    }
    

    deal.status = DEAL_STATUSES.FINAL_CONTENT_POSTED;
    deal.contentPostedAt = new Date();
    await deal.save();

    res.json({
      message: "Content marked as posted",
      deal,
    });

    // Notify marketer that final content is posted
    await notifyUser(
      deal.marketerId,
      "Content Posted",
      `Creator has posted the final content for deal '${deal.dealName}'.`,
      { dealId: deal._id.toString() }
    );
  } catch (error) {
    console.error("Error marking content as posted:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * RESUBMIT MILESTONE WORK
 */
exports.resubmitMilestoneWork = (req, res) => {
  uploadMilestone.array("files")(req, res, async (err) => {
    try {
      const { dealId, milestoneId } = req.params;
      const { description, userId, userType } = req.body;

      const deal = await Deal.findById(dealId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }

      const milestone = deal.milestones.find(
        (m) => m.id.toString() === milestoneId
      );
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      if (
        userType !== "Creator" ||
        deal.creatorId.toString() !== userId.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Only the creator can resubmit work" });
      }

      if (milestone.status !== "revision_required") {
        return res
          .status(400)
          .json({ error: "Can only resubmit work when revision is required" });
      }

      // Process text deliverables
      const textDeliverables = description
        ? [
            {
              type: "text",
              content: description,
              submittedAt: new Date(),
            },
          ]
        : [];

      const fileAttachments = [];
      if (req.files && req.files.length > 0) {
        const finalDir = path.join(
          __dirname,
          "../uploads/milestones",
          dealId,
          milestoneId
        );
        await fs.promises.mkdir(finalDir, { recursive: true });

        for (const file of req.files) {
          const newPath = path.join(finalDir, file.filename);
          await fs.promises.rename(file.path, newPath);

          fileAttachments.push({
            type: "file",
            url: `/uploads/milestones/${dealId}/${milestoneId}/${file.filename}`,
            originalName: file.originalname,
            submittedAt: new Date(),
          });
        }
      }

      const allDeliverables = [...textDeliverables, ...fileAttachments];

      const submission = {
        id: new mongoose.Types.ObjectId(),
        deliverables: allDeliverables,
        submittedAt: new Date(),
        submittedBy: userId,
        status: "pending_review",
      };

      milestone.status = "in_review";
      milestone.deliverables.push(submission);
      deal.status = DEAL_STATUSES.CONTENT_FOR_APPROVAL;

      await deal.save();

      res.json({
        message: "Work resubmitted for approval",
        milestone,
        deal,
      });

      // Notify marketer that revised work has been submitted
      await notifyUser(
        deal.marketerId,
        "Revised Work Submitted",
        `Creator resubmitted milestone work for '${milestone.name}' in deal '${deal.dealName}'.`,
        { dealId: deal._id.toString(), milestoneName: milestone.name }
      );
    } catch (error) {
      console.error("Error resubmitting milestone work:", error);
      return res.status(500).json({ error: error.message });
    }
  });
};

/**
 * SUBMIT OFFER CONTENT
 */
exports.submitOfferContent = (req, res) => {
  uploadMilestone.array("files")(req, res, async (err) => {
    try {
      const { dealId } = req.params;
      const { userId, userType } = req.body;
      const deliverablesData = JSON.parse(req.body.deliverables);
      const description = deliverablesData.description;

      const deal = await Deal.findById(dealId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }

      if (
        userType !== "Creator" ||
        deal.creatorId.toString() !== userId.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Only the creator can submit offer content" });
      }

      if (!description?.trim() && (!req.files || req.files.length === 0)) {
        return res.status(400).json({
          error: "Must provide either description or files",
        });
      }

      const textDeliverables = description
        ? [
            {
              type: "text",
              content: description,
              submittedAt: new Date(),
            },
          ]
        : [];

      const fileAttachments = [];
      if (req.files && req.files.length > 0) {
        const finalDir = path.join(
          __dirname,
          "../uploads/offer-content",
          dealId
        );

        await fs.promises.mkdir(finalDir, { recursive: true });

        for (const file of req.files) {
          const newPath = path.join(finalDir, file.filename);
          await fs.promises.rename(file.path, newPath);

          fileAttachments.push({
            type: "file",
            url: `/uploads/offer-content/${dealId}/${file.filename}`,
            originalName: file.originalname,
            submittedAt: new Date(),
          });
        }
      }

      deal.offerContent = {
        deliverables: [...textDeliverables, ...fileAttachments],
        submittedAt: new Date(),
        submittedBy: userId,
        status: "pending_review",
      };

      deal.status = DEAL_STATUSES.OFFER_CONTENT_SUBMITTED;
      await deal.save();

      res.json({
        message: "Offer content submitted successfully",
        deal,
      });

      // Notify marketer that the content was submitted
      await notifyUser(
        deal.marketerId,
        "Offer Content Submitted",
        `Creator submitted offer content for deal '${deal.dealName}'.`,
        { dealId: deal._id.toString() }
      );
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
};

/**
 * APPROVE OFFER CONTENT
 */
exports.approveOfferContent = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { userId, userType } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    // Authorization check
    if (userType !== "Marketer" || String(deal.marketerId) !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Calculate remaining payment
    const totalPaid = deal.paymentInfo.transactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const remainder = deal.paymentInfo.amount - totalPaid;

    if (remainder > 0) {
      // Create Stripe session for remaining balance
      const paymentController = require("./paymentController");
      const sessionRes = await paymentController.createCheckoutSession(
        {
          body: {
            amount: remainder,
            metadata: {
              type: "finalPayment",
              dealId: dealId,
              contentApproval: "true",
            },
          },
        },
        res
      );

      return res.json({
        sessionId: sessionRes.sessionId,
        clientSecret: sessionRes.clientSecret,
      });
    } else {
      // If no payment needed, just update status
      deal.status = DEAL_STATUSES.COMPLETION_PAYMENT;
      await deal.save();
      return res.json({ message: "Content approved with full payment" });
    }
  } catch (error) {
    console.error("Error approving content:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * REQUEST OFFER CONTENT REVISION
 */
exports.requestOfferContentRevision = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { feedback, userId, userType } = req.body;

    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    if (
      userType !== "Marketer" ||
      deal.marketerId.toString() !== userId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Only the marketer can request revisions" });
    }

    if (!deal.offerContent || deal.offerContent.status !== "pending_review") {
      return res.status(400).json({ error: "No offer content to revise" });
    }

    if (!deal.offerContent.feedback) {
      deal.offerContent.feedback = [];
    }

    deal.offerContent.feedback.push({
      id: new mongoose.Types.ObjectId(),
      feedback,
      createdAt: new Date(),
      createdBy: userId,
    });

    deal.offerContent.status = "revision_required";
    deal.status = DEAL_STATUSES.IN_PROCESS;
    await deal.save();

    res.json({
      message: "Revision requested for offer content",
      deal,
    });

    // Notify creator that revision is requested
    await notifyUser(
      deal.creatorId,
      "Revision Requested",
      `Marketer requested revision for your offer content in deal '${deal.dealName}'.`,
      { dealId: deal._id.toString() }
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/**
 * REVIEW PROOF
 */
exports.reviewProof = async (req, res) => {
  try {
    const { dealId, proofId } = req.params;
    const { status, feedback, userId, userType } = req.body;

    // Find the deal
    const deal = await Deal.findById(dealId);
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    // Only allow marketer to review proofs
    if (userType !== "Marketer" || String(deal.marketerId) !== userId) {
      return res.status(403).json({ error: "Only the marketer can review proofs" });
    }

    // Locate the proof submission for review
    const proofSubmission = deal.proofSubmissions.find(
      (p) => p.id.toString() === proofId
    );
    if (!proofSubmission) {
      return res.status(404).json({ error: "Proof submission not found" });
    }

    if (proofSubmission.status !== "pending_review") {
      return res.status(400).json({
        error: "Can only review proofs in pending_review status",
      });
    }

    // Initialize feedback array if not set and add provided feedback
    if (!proofSubmission.feedback) {
      proofSubmission.feedback = [];
    }
    if (feedback) {
      proofSubmission.feedback.push({
        id: new mongoose.Types.ObjectId(),
        feedback,
        createdAt: new Date(),
        createdBy: userId,
      });
    }

    // Update the proof submission status and update the overall deal status
    proofSubmission.status = status;
    if (status === "approved") {
      proofSubmission.approvedAt = new Date();
      // Set the overall deal status to Content Approved when proof is approved
      deal.status = DEAL_STATUSES.CONTENT_APPROVED;
    } else {
      // For revisions, you might set it back to In-Process (or another appropriate status)
      deal.status = DEAL_STATUSES.IN_PROCESS;
    }

    await deal.save();

    res.json({
      message:
        status === "approved"
          ? "Proof approved; deal is now marked as Content Approved."
          : "Revision requested for proof.",
      proofSubmission,
      deal,
    });

    // Notify the creator about the outcome of the proof review
    await notifyUser(
      deal.creatorId,
      status === "approved" ? "Proof Approved" : "Revision Requested",
      `Your proof for deal '${deal.dealName}' was ${
        status === "approved" ? "approved" : "sent back for revision"
      }.`,
      { dealId: deal._id.toString(), proofId }
    );
  } catch (error) {
    console.error("Error reviewing proof:", error);
    return res.status(500).json({ error: error.message });
  }
};


/**
 * SUBMIT PROOF
 */
exports.submitProof = (req, res) => {
  uploadProof.array("files")(req, res, async (err) => {
    try {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({
          error: `File upload failed: ${err.message}`,
        });
      }

      const { dealId } = req.params;
      const { userId, userType } = req.body;
      const deliverablesData = JSON.parse(req.body.deliverables);

      const deal = await Deal.findById(dealId);
      if (!deal) return res.status(404).json({ error: "Deal not found" });

      if (userType !== "Creator" || String(deal.creatorId) !== userId) {
        return res
          .status(403)
          .json({ error: "Only the creator can submit proof" });
      }

      // Process text deliverables
      const textDeliverables = deliverablesData.description?.trim()
        ? [
            {
              type: "text",
              content: deliverablesData.description.trim(),
              submittedAt: new Date(),
            },
          ]
        : [];

      const fileAttachments = [];
      if (req.files && req.files.length > 0) {
        const finalDir = path.join(__dirname, "../uploads/proofs", dealId);
        await fs.promises.mkdir(finalDir, { recursive: true });

        for (const file of req.files) {
          const newPath = path.join(finalDir, file.filename);
          await fs.promises.rename(file.path, newPath);

          fileAttachments.push({
            type: "file",
            url: `/uploads/proofs/${dealId}/${file.filename}`,
            originalName: file.originalname,
            submittedAt: new Date(),
          });
        }
      }

      
      // ────────────────────────────────  VALIDATION  ────────────────────────────────
      //   •  Proof *must* include at least one real file.  
      //   •  This prevents empty‑file proofs that were previously slipping through.
      if (fileAttachments.length === 0) {
        // Remove any temp uploads that Multer might have stored before early‑exit.
        if (req.files?.length) {
          req.files.forEach((f) => fs.unlink(f.path, () => {}));
        }
        return res.status(400).json({
          error: "Proof submissions must include at least one attachment file.",
        });
      }

      const allDeliverables = [...textDeliverables, ...fileAttachments];

      const proofSubmission = {
        id: new mongoose.Types.ObjectId(),
        attachments: allDeliverables,
        submittedAt: new Date(),
        submittedBy: userId,
        status: "pending_review",
      };

      if (!deal.proofSubmissions) {
        deal.proofSubmissions = [];
      }
      deal.proofSubmissions.push(proofSubmission);
      deal.status = DEAL_STATUSES.CONTENT_FOR_APPROVAL;

      await deal.save();

      res.json({
        message: "Proof submitted successfully",
        proofSubmission,
        deal,
      });

      await notifyUser(
        deal.marketerId,
        "Proof Submitted",
        `Creator submitted proof for deal '${deal.dealName}'.`,
        { dealId: deal._id.toString() }
      );

      await notifyUser(
        deal.creatorId,
        "Proof Submitted",
        `You've successfully submitted proof for deal '${deal.dealName}'.`,
        { dealId: deal._id.toString() }
      );
    } catch (error) {
      console.error("Error submitting proof:", error);
      return res.status(500).json({ error: error.message });
    }
  });
};

/**
 * RESUBMIT PROOF
 */
exports.resubmitProof = (req, res) => {
  uploadProof.array("files")(req, res, async (err) => {
    try {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({
          error: `File upload failed: ${err.message}`,
        });
      }

      const { dealId, proofId } = req.params;
      const { userId, userType } = req.body;
      const deliverablesData = JSON.parse(req.body.deliverables);

      const deal = await Deal.findById(dealId);
      if (!deal) return res.status(404).json({ error: "Deal not found" });

      if (userType !== "Creator" || String(deal.creatorId) !== userId) {
        return res
          .status(403)
          .json({ error: "Only the creator can resubmit proof" });
      }

      const proofSubmission = deal.proofSubmissions.find(
        (p) => p.id.toString() === proofId
      );
      if (!proofSubmission) {
        return res.status(404).json({ error: "Proof submission not found" });
      }

      if (proofSubmission.status !== "revision_required") {
        return res.status(400).json({
          error: "Can only resubmit proof when revision is required",
        });
      }

      // Process text deliverables
      const textDeliverables = deliverablesData.description
        ? [
            {
              type: "text",
              content: deliverablesData.description,
              submittedAt: new Date(),
            },
          ]
        : [];

      const fileAttachments = [];
      if (req.files && req.files.length > 0) {
        const finalDir = path.join(
          __dirname,
          "../uploads/proofs",
          dealId,
          proofId
        );
        await fs.promises.mkdir(finalDir, { recursive: true });

        for (const file of req.files) {
          const newPath = path.join(finalDir, file.filename);
          await fs.promises.rename(file.path, newPath);

          fileAttachments.push({
            type: "file",
            url: `/uploads/proofs/${dealId}/${proofId}/${file.filename}`,
            originalName: file.originalname,
            submittedAt: new Date(),
          });
        }
      }

      const allDeliverables = [...textDeliverables, ...fileAttachments];

      proofSubmission.attachments = allDeliverables;
      proofSubmission.status = "pending_review";
      proofSubmission.resubmittedAt = new Date();
      deal.status = DEAL_STATUSES.CONTENT_FOR_APPROVAL;

      await deal.save();

      res.json({
        message: "Proof resubmitted successfully",
        proofSubmission,
        deal,
      });

      await notifyUser(
        deal.marketerId,
        "Proof Resubmitted",
        `Creator resubmitted proof for deal '${deal.dealName}'.`,
        { dealId: deal._id.toString(), proofId }
      );
    } catch (error) {
      console.error("Error resubmitting proof:", error);
      return res.status(500).json({ error: error.message });
    }
  });
};

/**
 * SUBMIT CONTENT
 */
exports.submitContent = (req, res) => {
  uploadMilestone.array("files")(req, res, async (err) => {
    try {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({
          error: `File upload failed: ${err.message}`,
        });
      }

      const { dealId, milestoneId } = req.params;
      const { userId, userType } = req.body;
      const deliverablesData = JSON.parse(req.body.deliverables);

      const deal = await Deal.findById(dealId);
      if (!deal) return res.status(404).json({ error: "Deal not found" });

      const milestone = deal.milestones.find(
        (m) => m.id.toString() === milestoneId
      );
      if (!milestone) {
        return res.status(404).json({ error: "Milestone not found" });
      }

      if (userType !== "Creator" || String(deal.creatorId) !== userId) {
        return res
          .status(403)
          .json({ error: "Only the creator can submit content" });
      }

      // Process text deliverables
      const textDeliverables = deliverablesData.description
        ? [
            {
              type: "text",
              content: deliverablesData.description,
              submittedAt: new Date(),
            },
          ]
        : [];

      const fileAttachments = [];
      if (req.files && req.files.length > 0) {
        const finalDir = path.join(
          __dirname,
          "../uploads/content",
          dealId,
          milestoneId
        );
        await fs.promises.mkdir(finalDir, { recursive: true });

        for (const file of req.files) {
          const newPath = path.join(finalDir, file.filename);
          await fs.promises.rename(file.path, newPath);

          fileAttachments.push({
            type: "file",
            url: `/uploads/content/${dealId}/${milestoneId}/${file.filename}`,
            originalName: file.originalname,
            submittedAt: new Date(),
          });
        }
      }

      const allDeliverables = [...textDeliverables, ...fileAttachments];

      const contentSubmission = {
        id: new mongoose.Types.ObjectId(),
        deliverables: allDeliverables,
        submittedAt: new Date(),
        submittedBy: userId,
        status: "pending_review",
      };

      if (!deal.contentSubmissions) {
        deal.contentSubmissions = [];
      }
      deal.contentSubmissions.push(contentSubmission);
      milestone.status = "in_review";
      deal.status = DEAL_STATUSES.CONTENT_FOR_APPROVAL;

      await deal.save();

      res.json({
        message: "Content submitted successfully",
        contentSubmission,
        deal,
      });

      await notifyUser(
        deal.marketerId,
        "Content Submitted",
        `Creator submitted content for milestone in deal '${deal.dealName}'.`,
        { dealId: deal._id.toString(), milestoneName: milestone.name }
      );
    } catch (error) {
      console.error("Error submitting content:", error);
      return res.status(500).json({ error: error.message });
    }
  });
};

/**
 * RELEASE FIRST HALF ESCROW
 */
/**
 * RELEASE FIRST HALF ESCROW
 */
exports.releaseFirstHalfEscrow = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { userId, userType } = req.body;

    // 1) Find the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    console.log("deal", dealId, String(deal.marketerId), String(userId));

    // 2) Verify Marketer
    if (userType !== "Marketer" || String(deal.marketerId) !== String(userId)) {
      return res
        .status(403)
        .json({ error: "Only the marketer can release escrow" });
    }

    // 3) Check if deal status is valid for release
    if (
      ![
        DEAL_STATUSES.ACCEPTED,
        DEAL_STATUSES.CONTENT_FOR_APPROVAL,
      ].includes(deal.status)
    ) {
      return res.status(400).json({
        error:
          "Escrow can be released only while the deal is in 'Accepted' or 'Content for Approval Submitted' status.",
      });
    }

    // 3b) Prevent double‑release
    const alreadyReleased = deal.paymentInfo.transactions.some(
      (t) => t.type === "release_half"
    );
    if (alreadyReleased) {
      return res.status(400).json({
        error: "The first 50 % escrow has already been released.",
      });
    }

    // 4) Calculate half of the total deal price (assuming total is stored in paymentInfo.paymentAmount)
    const half = deal.paymentInfo?.paymentAmount * 0.5;
    if (!half || half <= 0) {
      return res
        .status(400)
        .json({ error: "No valid escrow amount to release" });
    }

    // 5) Check if the first escrow was actually paid
    //    For example, your code might store that in the first transaction
    const escrowPaid = deal.paymentInfo.paymentAmount >= half;
    if (!escrowPaid) {
      return res.status(400).json({
        error: "The 50% escrow has not been funded yet, cannot release it",
      });
    }

    // 6) Create a new transaction indicating the release
    //    In many apps, the actual transfer to the Creator's balance happens off-platform.
    //    Here we just record it so your system knows 50% was released.
    deal.paymentInfo.transactions.push({
      paymentAmount: half,
      paymentMethod: "escrow",
      transactionId: deal.paymentInfo.transactions[0].transactionId,
      status: "Completed",
      paidAt: new Date(),
      type: "release_half",
    });

    // 7) Update deal status to "In-Process" (or whatever suits your workflow)
    deal.status = DEAL_STATUSES.IN_PROCESS;
    await deal.save();

    // ➕ Create Earning entry for the Creator
    await earnings.create({
      user: deal.creatorId,
      deal: deal._id,
      amount: half,
      paymentMethod: "escrow",
      transactionId: deal.paymentInfo.transactions[0].transactionId,
      reference: "First 50% escrow release",
    });

    // ➕ Create Payout entry for the Marketer
    await payouts.create({
      user: deal.marketerId,
      amount: half,
      paymentMethod: "escrow",
      stripeTransactionId: deal.paymentInfo.transactions[0].transactionId,
      deal: deal._id,
      status: "ESCROW", // Escrow to reflect it's a holding state
    });


    // 8) Notify the Creator
    await notifyUser(
      deal.creatorId,
      "50% Payment Released",
      `The first half of the deal '${deal.dealName}' has been released to you.`,
      { dealId: deal._id.toString() }
    );

    await notifyUser(
      deal.marketerId,
      "50% Payment Released",
      `The first half of the deal '${deal.dealName}' has been released to the creator.`,
      { dealId: deal._id.toString() }
    );

    return res.json({
      message: "Successfully released the first 50% escrow",
      deal,
    });
  } catch (error) {
    console.error("Error releasing first half escrow:", error);
    return res.status(500).json({ error: error.message });
  }
};

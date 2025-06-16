const fs = require("fs");
const path = require("path");
const multer = require("multer");
const nodemailer = require("nodemailer");
const BUTTON_STYLE =
  "background:#430B92;color:#ffffff;text-decoration:none;padding:12px 22px;" +
  "border-radius:5px;font-weight:bold;font-size:14px;display:inline-block;";
const mongoose = require("mongoose");
const mime = require("mime-types");
const { successResponse, errorResponse, handleServerError } = require("../utils/responseHelper");

// Models
const Offer = require("../models/offer");
const Deal = require("../models/deal");
const Draft = require("../models/draft");
const User = require("../models/User");
const Notification = require("../models/Notification");
// Import your push notification utility
const {
  sendPushNotification: showNotifications,
  sendPushNotification,
} = require("../utils/pushNotifications");
const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");

// Create a transporter using SMTP credentials from your .env file
const transporter = nodemailer.createTransport({
  host   : process.env.EMAIL_HOST,
  port   : Number(process.env.EMAIL_PORT) || 465,
  secure : true,                      // gmail app-pwd → always SSL
  auth   : {
    user : process.env.EMAIL_USER,
    pass : process.env.EMAIL_PASS,    // 16-char app-password
  },
  tls: {                              // allow gmail’s cert chain
    rejectUnauthorized: false,
  },
});

// one-time sanity check – prints a clear message on start-up
transporter.verify().then(() =>
  console.log("📧  Mail transporter OK")
).catch(e =>
  console.error("📧  Mail transporter FAILED:", e.message)
);

// Helper function to format currency
const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Helper function to format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Gmail-safe template:
 *  • no <style> blocks / classes
 *  • everything inline
 *  • one big 600-px table
 */
const emailTemplate = (htmlBody, subject, ctaText = "View details", ctaLink = "#") => `
<!DOCTYPE html>
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

        <!---- logo ---->
        <tr><td align="center" style="padding:25px 25px 0;">
          <img src="cid:axees-logo" width="120" alt="Axees"
               style="display:block;border:0;">
        </td></tr>

        <!---- body ---->
        <tr><td style="padding:25px;color:#000;font-size:15px;line-height:1.6;">
          ${htmlBody}
        </td></tr>

        

        <!---- footer ---->
        <tr><td align="center" style="padding:0 25px 30px;
             color:#888;font-size:12px;line-height:1.4;">
          Thank you,<br>Axees.io 
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

// Define standardized offer statuses to ensure consistency
const OFFER_STATUSES = {
  ACCEPTED: "Accepted",
  REJECTED_COUNTERED: "Rejected-Countered",
  REJECTED: "Rejected",
  OFFER_IN_REVIEW: "Offer in Review",
  DRAFT: "Draft",
  SENT: "Sent",
  VIEWED_BY_CREATOR: "Viewed by Creator",
  DELETED: "Deleted",
  OFFER_RECEIVED: "Offer Received",
  CANCELLED: "Cancelled",
};

// Helper function to generate email content
const generateEmailContent = async (offer, action, recipient, role) => {
  const formattedAmount = formatCurrency(offer.proposedAmount, offer.currency);
  const formattedDate = formatDate(offer.desiredPostDate);

  // Retrieve the counter offer (if exists)
  const counterOffer =
    offer?.counters?.length > 0
      ? offer.counters[offer.counters.length - 1]
      : null;
  const counterOfferAmount = counterOffer
    ? formatCurrency(counterOffer.counterAmount, counterOffer.currency)
    : formattedAmount;
  const counterOfferDate = counterOffer
    ? formatDate(counterOffer.counterPostDate)
    : formattedDate;

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:8081";
  let offerUrl = "";

  // Determine URLs based on role
  if (role === "creator") {
    if (action === "new_offer") {
      offerUrl = `${baseUrl}/UOM10CreatorOfferDetails?offerId=${offer._id}&marketerId=${offer.marketerId._id}&role=Creator`;
    } else if (action === "counter_offer") {
      offerUrl = `${baseUrl}/UOM05MarketerOfferCounter?offerId=${offer._id}&marketerId=${offer.marketerId._id}&role=Creator`;
    } else if (action === "offer_accepted") {
      // Get the deal ID from the offer's associated deal
      const deal = await Deal.findOne({ offerId: offer._id });
      offerUrl = `${baseUrl}/UOM09MarketerDealDetail?dealId=${
        deal?._id || offer._id
      }`;
    } else if (action === "offer_rejected") {
      offerUrl = `${baseUrl}/UOM10CreatorOfferDetails/${offer._id}`;
    } else if (action === "offer_deleted") {
      offerUrl = `${baseUrl}/UOM10CreatorOfferDetails/${offer._id}`;
    } else if (action === "offer_cancelled") {
      offerUrl = `${baseUrl}/UOM10CreatorOfferDetails/${offer._id}`;
    } else if (action === "offer_in_review") {
      offerUrl = `${baseUrl}/UOM10CreatorOfferDetails/${offer._id}`;
    }
  } else if (role === "marketer") {
    if (action === "new_offer") {
      offerUrl = `${baseUrl}/UOM10CreatorOfferDetails?offerId=${offer._id}&creatorId=${offer.creatorId._id}&role=Marketer`;
    } else if (action === "counter_offer") {
      offerUrl = `${baseUrl}/UOM05MarketerOfferCounter?offerId=${offer._id}&creatorId=${offer.creatorId._id}&role=Marketer`;
    } else if (action === "offer_accepted") {
      // Get the deal ID from the offer's associated deal
      const deal = await Deal.findOne({ offerId: offer._id });
      offerUrl = `${baseUrl}/UOM09MarketerDealDetail?dealId=${
        deal?._id || offer._id
      }`;
    } else if (action === "offer_rejected") {
      offerUrl = `${baseUrl}/UOM07MarketerOfferHistoryList`;
    } else if (action === "offer_deleted") {
      offerUrl = `${baseUrl}/UOM07MarketerOfferHistoryList`;
    } else if (action === "offer_cancelled") {
      offerUrl = `${baseUrl}/UOM07MarketerOfferHistoryList`;
    } else if (action === "offer_in_review") {
      offerUrl = `${baseUrl}/UOM05MarketerOfferCounter?offerId=${offer._id}`;
    }
  }

  // Get both names
  const getName = async (user, defaultName) => {
    if (user && typeof user === "object" && user.name) {
      return user.name;
    }

    if (user && String(user) && !user.name) {
      const userData = await User.findById(user);
      return userData.name;
    }

    return defaultName;
  };

  const creatorName = await getName(offer.creatorId, "Creator");
  const marketerName = await getName(offer.marketerId, "Marketer");

  let subject, content;

  // Generate content based on role and action
  switch (action) {
    case "new_offer":
      subject = role === "creator" ? "New Offer Received" : "Offer Sent";
      content = emailTemplate(
        `
        <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">${subject}</h2>
        <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
        <p style="margin:0 0 15px 0;">${
          role === "creator"
            ? `You've received a new ${offer.offerType} offer from ${marketerName}`
            : `You've sent a new ${offer.offerType} offer to ${creatorName}`
        }</p>
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Offer Name:</strong> ${offer.offerName}</p>
          <p><strong>Type:</strong> ${
            offer.offerType === "custom" ? "Custom Offer" : "Standard Offer"
          }</p>
          <p><strong>Amount:</strong> ${formattedAmount}</p>
          <p><strong>Desired Post Date:</strong> ${formattedDate}</p>
        </div>
        <a href="${offerUrl}" style="${BUTTON_STYLE}">View ${
          offer.offerType === "custom" ? "Custom" : "Standard"
        } Offer</a>
      `,
        subject
      );
      break;

    case "counter_offer": {
      // Retrieve the last counter offer and determine the initiator
      const lastCounter =
        offer.counters && offer.counters.length > 0
          ? offer.counters[offer.counters.length - 1]
          : null;
      const initiator = lastCounter ? lastCounter.counterBy : null;
      // Determine subject based on who initiated the counter offer
      if (initiator === "Creator") {
        subject =
          role === "creator" ? "Counter Offer Sent" : "Counter Offer Received";
      } else if (initiator === "Marketer") {
        subject =
          role === "marketer" ? "Counter Offer Sent" : "Counter Offer Received";
      } else {
        // Fallback if no counter info is available
        subject =
          role === "creator" ? "Counter Offer Received" : "Counter Offer Sent";
      }

      content = emailTemplate(
        `
          <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">${subject}</h2>
          <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
          <p style="margin:0 0 15px 0;">${
            // Message varies depending on who initiated the counter
            initiator === "Creator"
              ? role === "creator"
                ? `You have sent a counter offer to ${marketerName} for "${offer.offerName}"`
                : `You have received a counter offer from ${creatorName} for "${offer.offerName}"`
              : initiator === "Marketer"
              ? role === "marketer"
                ? `You have sent a counter offer to ${creatorName} for "${offer.offerName}"`
                : `You have received a counter offer from ${marketerName} for "${offer.offerName}"`
              : role === "creator"
              ? `You have received a counter offer from ${marketerName} for "${offer.offerName}"`
              : `You have sent a counter offer to ${creatorName} for "${offer.offerName}"`
          }</p>
          <div style="text-align: left; margin: 20px 0;">
            <p><strong>Counter Offer Amount:</strong> ${counterOfferAmount}</p>
            <p><strong>Counter Offer Date:</strong> ${counterOfferDate}</p>
            <p><strong>Desired Post Date:</strong> ${formattedDate}</p>
          </div>
          <a href="${offerUrl}" style="${BUTTON_STYLE}">Review Counter Offer</a>
        `,
        subject
      );
      break;
    }

    case "offer_accepted": {
      subject = "Offer Accepted";

      content = emailTemplate(
        `
        <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">Offer Accepted!</h2>
        <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
        <p style="margin:0 0 15px 0;">${
          role === "creator"
            ? `You have accepted the offer "${offer.offerName}" from ${marketerName}`
            : `${creatorName} has accepted your offer "${offer.offerName}"`
        }</p>
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Final Amount:</strong> ${counterOfferAmount}</p>
          <p><strong>Post Date:</strong> ${counterOfferDate}</p>
        </div>
        <a href="${offerUrl}" style="${BUTTON_STYLE}">View Deal Details</a>
      `,
        subject
      );
      break;
    }

    case "offer_rejected":
      subject = "Offer Rejected";
      const baseUrlReject = process.env.FRONTEND_URL || "http://localhost:8081";
      offerUrl =
        role === "creator"
          ? `${baseUrlReject}/UOM10CreatorOfferDetails?offerId=${offer._id}&marketerId=${offer.marketerId._id}&role=Creator`
          : `${baseUrlReject}/UOM07MarketerOfferHistoryList`;
      content = emailTemplate(
        `
        <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">Offer Rejected</h2>
        <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
        <p style="margin:0 0 15px 0;">${
          role === "creator"
            ? `Your offer "${offer.offerName}" to ${marketerName} has been rejected.`
            : `Your offer "${offer.offerName}" from ${creatorName} has been rejected.`
        }</p>
        <a href="${offerUrl}" style="${BUTTON_STYLE}">View Offer Details</a>
      `,
        subject
      );
      break;

    case "offer_cancelled":
      subject = "Offer Cancelled";
      const baseUrlCancel = process.env.FRONTEND_URL || "http://localhost:8081";
      offerUrl =
        role === "creator"
          ? `${baseUrlCancel}/UOM10CreatorOfferDetails?offerId=${offer._id}&marketerId=${offer.marketerId._id}&role=Creator`
          : `${baseUrlCancel}/UOM07MarketerOfferHistoryList`;
      content = emailTemplate(
        `
        <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">Offer Cancelled</h2>
        <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
        <p style="margin:0 0 15px 0;">${
          role === "creator"
            ? `The offer "${offer.offerName}" from ${marketerName} has been cancelled.`
            : `The offer "${offer.offerName}" to ${creatorName} has been cancelled.`
        }</p>
        <a href="${offerUrl}" style="${BUTTON_STYLE}">View Offer Details</a>
      `,
        subject
      );
      break;

    case "offer_in_review":
      subject = "Offer In Review";
      const baseUrlReview = process.env.FRONTEND_URL || "http://localhost:8081";
      offerUrl = `${baseUrlReview}/UOM10CreatorOfferDetails?offerId=${
        offer._id
      }&${role === "creator" ? "marketerId" : "creatorId"}=${
        role === "creator" ? offer.marketerId._id : offer.creatorId._id
      }&role=${role}`;
      content = emailTemplate(
        `
        <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">Offer In Review</h2>
        <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
        <p style="margin:0 0 15px 0;">${
          role === "creator"
            ? `Your offer "${offer.offerName}" to ${marketerName} is now being reviewed.`
            : `Your offer "${offer.offerName}" from ${creatorName} is now being reviewed.`
        }</p>
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Amount:</strong> ${formattedAmount}</p>
          <p><strong>Post Date:</strong> ${formattedDate}</p>
        </div>
        <a href="${offerUrl}" style="${BUTTON_STYLE}">View Offer Details</a>
      `,
        subject
      );
      break;

    case "offer_deleted":
      subject = "Offer Deleted";
      const baseUrlDelete = process.env.FRONTEND_URL || "http://localhost:8081";
      offerUrl =
        role === "creator"
          ? `${baseUrlDelete}/UOM07MarketerOfferHistoryList`
          : `${baseUrlDelete}/UOM07MarketerOfferHistoryList`;
      content = emailTemplate(
        `
        <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">Offer Deleted</h2>
        <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
        <p style="margin:0 0 15px 0;">${
          role === "creator"
            ? `The offer "${offer.offerName}" from ${marketerName} has been deleted.`
            : `The offer "${offer.offerName}" to ${creatorName} has been deleted.`
        }</p>
      `,
        subject
      );
      break;
    default:
      subject = "Offer Update";
      const baseUrlDefault =
        process.env.FRONTEND_URL || "http://localhost:8081";
      offerUrl = `${baseUrlDefault}/UOM10CreatorOfferDetails?offerId=${offer._id}`;
      content = emailTemplate(
        `
        <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">Offer Update</h2>
        <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
        <p style="margin:0 0 15px 0;">There has been an update to offer "${offer.offerName}".</p>
        <a href="${offerUrl}" style="${BUTTON_STYLE}">View Offer Details</a>
      `,
        subject
      );
  }

  return { subject, content };
};

// Helper to send notifications based on offer status
const sendOfferNotification = async (offer, action) => {
  try {
    // Get both creator and marketer with email and deviceToken
    const creator = await User.findById(offer.creatorId).select(
      "+email +deviceToken +name"
    );
    const marketer = await User.findById(offer.marketerId).select(
      "+email +deviceToken +name"
    );

    if (!creator || !marketer) {
      console.error("Creator or marketer not found");
      return;
    }

    const creatorName = creator.name || "Creator";
    const marketerName = marketer.name || "Marketer";

    // Generate notification data
    const formattedAmount = formatCurrency(
      offer.proposedAmount,
      offer.currency
    );
    const formattedDate = formatDate(offer.desiredPostDate);

    // Create separate notification data for both parties
    const notifications = [
      {
        user: creator,
        role: "creator",
        name: creatorName,
        otherName: marketerName,
      },
      {
        user: marketer,
        role: "marketer",
        name: marketerName,
        otherName: creatorName,
      },
    ];

    // Process notifications for both parties
    for (const notification of notifications) {
      let title, body, targetScreen;

      // Generate content based on role and action
      switch (action) {
        case "new_offer":
          title =
            notification.role === "creator"
              ? `📨 New ${
                  offer.offerType === "custom" ? "Custom" : "Standard"
                } Offer`
              : `📤 ${
                  offer.offerType === "custom" ? "Custom" : "Standard"
                } Offer Sent`;
          body =
            notification.role === "creator"
              ? `${marketerName}: ${offer.offerName} (${formattedAmount})`
              : `To ${creatorName}: ${offer.offerName} (${formattedAmount})`;
          targetScreen = "UOM10CreatorOfferDetails";
          break;

        case "counter_offer": {
          // Retrieve the last counter offer and its initiator
          const lastCounter =
            offer.counters && offer.counters.length > 0
              ? offer.counters[offer.counters.length - 1]
              : null;
          const initiator = lastCounter ? lastCounter.counterBy : null;
          // Set title based on the initiator and the recipient's role
          if (initiator === "Creator") {
            title =
              notification.role === "creator"
                ? "🔄 Counter Offer Sent"
                : "🔄 Counter Offer Received";
          } else if (initiator === "Marketer") {
            title =
              notification.role === "marketer"
                ? "🔄 Counter Offer Sent"
                : "🔄 Counter Offer Received";
          } else {
            title =
              notification.role === "marketer"
                ? "🔄 Counter Offer Received"
                : "🔄 Counter Offer Sent";
          }
          const counterOfferAmount = lastCounter
            ? formatCurrency(lastCounter.counterAmount, offer.currency)
            : null;
          body = `For ${
            offer.offerType === "custom" ? "Custom" : "Standard"
          } Offer: ${offer.offerName}`;
          if (counterOfferAmount) {
            body += ` (${counterOfferAmount})`;
          }
          targetScreen = "UOM05MarketerOfferCounter";
          break;
        }

        case "offer_accepted": {
          title = "✅ Offer Accepted";
          // Retrieve the last counter offer and its initiator
          const lastCounter =
            offer.counters && offer.counters.length > 0
              ? offer.counters[offer.counters.length - 1]
              : null;

          const counterOfferAmount = lastCounter
            ? formatCurrency(lastCounter.counterAmount, offer.currency)
            : formattedAmount;

          body = `${
            offer.offerType === "custom" ? "Custom" : "Standard"
          } Offer: ${offer.offerName}\nAmount: ${counterOfferAmount}`;
          targetScreen = "UOM09MarketerDealDetail";
          break;
        }

        case "offer_rejected":
          title = "❌ Offer Rejected";
          body = `Offer ${offer.offerName} was rejected`;
          targetScreen =
            notification.role === "creator"
              ? "UOM10CreatorOfferDetails"
              : "UOM07MarketerOfferHistoryList";
          break;

        case "offer_cancelled":
          title = "🚫 Offer Cancelled";
          body = `Offer ${offer.offerName} was cancelled`;
          targetScreen =
            notification.role === "creator"
              ? "UOM10CreatorOfferDetails"
              : "UOM07MarketerOfferHistoryList";
          break;

        case "offer_in_review":
          title = "🔍 Offer In Review";
          body = `Review pending for ${offer.offerName}`;
          targetScreen = "UOM10CreatorOfferDetails";
          break;

        case "offer_deleted":
          title = "🗑️ Offer Deleted";
          body = `Offer ${offer.offerName} was removed`;
          targetScreen =
            notification.role === "creator"
              ? "UOM10CreatorOfferDetails"
              : "UOM07MarketerOfferHistoryList";
          break;

        default:
          title = "📢 Offer Update";
          body = `Status update for ${offer.offerName}`;
          targetScreen = "UOM10CreatorOfferDetails";
      }

      // Create and send notification for this user
      const notificationData = {
        user: notification.user._id,
        type: action,
        title,
        subtitle: body,
        unread: true,
        data: {
          targetScreen: targetScreen.toString(),
          offerId: offer._id.toString(),
          type: action.toString(),
          amount: formattedAmount.toString(),
          postDate: formattedDate.toString(),
          offerName: offer.offerName.toString(),
          ...(action === "counter_offer" && {
            role: notification.role.toString(),
          }),
        },
      };

      // Save notification
      await Notification.create(notificationData);

      // Send push notifications if device tokens exist
      if (notification.user.deviceToken) {
        try {
          await showNotifications(
            notification.user.deviceToken,
            title, body, {
          targetScreen: targetScreen.toString(),
          offerId: offer._id.toString(),
          type: action.toString(),
          amount: formattedAmount.toString(),
          postDate: formattedDate.toString(),
          offerName: offer.offerName.toString(),
          ...(action === "counter_offer" && {
            role: notification.role.toString(),
          }),
        });
        } catch (pushErr) {
          // Firebase ‘registration-token-not-registered’ → silent drop
          if (pushErr?.errorInfo?.code !==
              "messaging/registration-token-not-registered") {
            console.warn("🔔 Push error:", pushErr.message);
          }
        }
      } else {
        console.log(`${notification.role} device token not found`);
      }

      // Send email notifications with role
      const { subject: emailSubject, content: emailContent } =
        await generateEmailContent(
          offer,
          action,
          {
            name: notification.name,
            email: notification.user.email,
          },
          notification.role
        );

      if (notification.user.email) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"Offer System" <noreply@example.com>',
          to:   notification.user.email,
          subject: emailSubject,
          html: emailContent,
          attachments: [
            {
              filename: "logo.png",
              path: path.join(__dirname, "../uploads/assets/icon.png"),
              cid: "axees-logo"
            }
          ]
        });
      } else {
        console.log(`${notification.role} email not found`);
      }
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

/**
 * Possible statuses:
 *  - "Draft"
 *  - "Sent"
 *  - "Offer Received"
 *  - "Viewed by Creator"
 *  - "Viewed by Marketer"
 *  - "Offer in Review"
 *  - "Rejected-Countered"
 *  - "Rejected"
 *  - "Accepted"
 *  - "Cancelled"
 *  - "Deleted"
 *  - [any others you define...]
 */

// -------------------------- MULTER SETUP --------------------------

// Towards the top of the file, make sure you have proper Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, "../uploads/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([{ name: "attachments", maxCount: 10 }]); // Allow 0-10 files

// -------------------------------------------------------------------
// 1) CREATE OFFER
// -------------------------------------------------------------------
exports.createOffer = (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error("Multer error:", err);
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            error: `File upload error: ${err.message}`,
            code: err.code,
          });
        }
        return res.status(400).json({
          error: err.message,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
      }

      // Parse deliverables if it's a string
      let deliverables = req.body.deliverables;
      if (typeof deliverables === "string") {
        try {
          deliverables = JSON.parse(deliverables);
        } catch {
          deliverables = deliverables.split(",").map((item) => item.trim());
        }
      }
      if (!Array.isArray(deliverables)) {
        deliverables = [];
      }

      // 1) Generate new Offer ID
      const offerId = new mongoose.Types.ObjectId();

      // 2) Create the Offer document with the basic fields
      const newOffer = new Offer({
        _id: offerId,
        marketerId: req.body.marketerId,
        creatorId: req.body.creatorId,
        offerType: req.body.offerType || "custom",
        offerName: req.body.offerName,
        description: req.body.description,
        deliverables,
<<<<<<< HEAD
        proposedAmount: req.body.amount,
=======
        proposedAmount: req.body.proposedAmount || req.body.amount,
>>>>>>> feature/testing-infrastructure
        currency: req.body.currency || "USD",
        desiredReviewDate: req.body.desiredReviewDate,
        desiredPostDate: req.body.desiredPostDate,
        status: req.body.status || "Sent",
        notes: req.body.notes,
        attachments: [],
      });

      // 3) Create final folder for the new offer
      const finalFolder = path.join(
        __dirname,
        "../uploads/offers",
        offerId.toString()
      );
      fs.mkdirSync(finalFolder, { recursive: true });

      // 4) Collect all attachments
      let allAttachments = [];

      // Handle Existing Attachments from a Draft
      let existingAttachments = req.body.existingAttachments || [];
      if (!Array.isArray(existingAttachments)) {
        existingAttachments = [existingAttachments];
      }

      for (const fileUrl of existingAttachments) {
        try {
          const matches = fileUrl.match(/\/uploads\/drafts\/([^/]+)\/(.+)/);
          if (!matches || matches.length < 3) continue;

          const draftId = matches[1];
          const fileName = matches[2];

          const oldPath = path.join(
            __dirname,
            "../uploads/drafts",
            draftId,
            fileName
          );
          const newPath = path.join(finalFolder, fileName);

          if (!fs.existsSync(oldPath)) continue;

          fs.copyFileSync(oldPath, newPath);
          fs.unlinkSync(oldPath);

          allAttachments.push({
            fileUrl: `/uploads/offers/${offerId.toString()}/${fileName}`,
            fileName,
            fileType: mime.lookup(newPath) || "application/octet-stream",
          });
        } catch (moveError) {
          console.error("Error moving existing draft file:", moveError);
          continue;
        }
      }

      // Handle Newly Uploaded Files from Multer
      const newFiles = req.files?.attachments || [];
      for (const file of newFiles) {
        const oldPath = file.path;
        const newPath = path.join(finalFolder, file.filename);

        fs.copyFileSync(oldPath, newPath);
        fs.unlinkSync(oldPath);

        allAttachments.push({
          fileUrl: `/uploads/offers/${offerId.toString()}/${file.filename}`,
          fileName: file.originalname || file.filename,
          fileType: file.mimetype,
        });
      }

      // Assign attachments to the Offer
      newOffer.attachments = allAttachments;

      // Save the offer
      await newOffer.save();

      // Create chat room when offer is created
      const participants = [newOffer.marketerId, newOffer.creatorId].sort();
      const chatRoom = await ChatRoom.create({
        participants,
        createdFromOffer: newOffer._id,
        unreadCount: new Map(),
      });

      // Add initial message about offer creation
      await Message.create({
        chatId: chatRoom._id,
        senderId: newOffer.marketerId,
        text: `New offer created: ${newOffer.offerName}\n\nProposed amount: ${newOffer.proposedAmount} ${newOffer.currency}\nDeliverables: ${newOffer.deliverables.join(', ')}`,
      });

      // Update room with last message
      await ChatRoom.findByIdAndUpdate(chatRoom._id, {
        $set: { 
          lastMessage: { 
            text: `New offer: ${newOffer.offerName}`,
            sender: newOffer.marketerId,
            createdAt: new Date() 
          } 
        },
        $inc: { 
          [`unreadCount.${newOffer.creatorId}`]: 1 
        },
      });

      // If draftId was supplied, remove that Draft + folder
      if (req.body.draftId) {
        const draftId = req.body.draftId;
        await Draft.findByIdAndDelete(draftId);

        const draftFolder = path.join(__dirname, "../uploads/drafts", draftId);
        if (fs.existsSync(draftFolder)) {
          fs.rmSync(draftFolder, { recursive: true });
        }
      }

      // Get the creator's userName
      const creatorUserName = await User.findById(newOffer.creatorId).select(
        "userName"
      );

      // Send push notification
      await sendOfferNotification(newOffer, "new_offer");

      return res.status(201).json({
        message: "Offer created successfully",
        offer: { ...newOffer.toObject(), creatorUserName: creatorUserName?.userName },
        chatRoomId: chatRoom._id, // Return chat room ID to client
      });
    } catch (error) {
      console.error("Error in createOffer:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });
};

// -------------------------------------------------------------------
// 2) GET OFFERS (Marketer or Creator perspective)
// -------------------------------------------------------------------
exports.getOffers = async (req, res) => {
  try {
    const user = req.user; // if using JWT
    const role = user?.role || req.query.role; // e.g. 'marketer', 'creator'
    const userId = user?._id || req.query.userId;
    const { status } = req.query;

    if (!role) {
      return res.status(400).json({ error: "No user role provided" });
    }

    // Build query based on role
    let query = {};
    if (role.toLowerCase() === "marketer") {
      query.marketerId = userId;
    } else if (role.toLowerCase() === "creator") {
      query.creatorId = userId;
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    // If a status param is provided, filter by that status
    if (status) {
      query.status = status;
    }

    // Always exclude "Deleted"
    query.status = { $ne: "Deleted" };

    // Exclude offers that became deals
    const dealsWithOfferIds = await Deal.find(
      { offerId: { $exists: true } },
      { offerId: 1 }
    ).lean();
    const offerIdsInDeals = dealsWithOfferIds.map((d) => String(d.offerId));
    query._id = { $nin: offerIdsInDeals };

    // Fetch offers with populated fields
    const offers = await Offer.find(query)
      .populate("creatorId", "name userName avatarUrl deviceToken")
      .populate("marketerId", "name userName avatarUrl deviceToken")
      .sort({ createdAt: -1 })
      .lean();

    // Get draft IDs for offers
    const draftIds = offers.filter((o) => o.draftId).map((o) => o.draftId);

    // 2. Find drafts and create a map
    const draftsMap = new Map(
      (await Draft.find({ _id: { $in: draftIds } }).lean()).map((d) => [
        d._id.toString(),
        d,
      ])
    );

    // Fetch user's drafts (if using separate Draft model)
    const drafts = await Draft.find({ userId })
      .populate("userId", "name userName avatarUrl")
      .lean();

    // --------------------------------------------------
    // 3) Return the offers + drafts
    return res.json({
      offers,
      newDrafts: drafts,
      count: offers.length + drafts.length,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------------
// 3) GET OFFER BY ID
// -------------------------------------------------------------------
exports.getOfferById = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await Offer.findById(offerId)
      .populate("creatorId", "name userName avatarUrl deviceToken")
      .populate("marketerId", "name userName avatarUrl deviceToken")
      .lean();

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Build the final attachments array with file names and URLs.
    const dirPath = path.join(__dirname, "../uploads/offers", offerId);
    let offerAttachments = [];
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      // Ensure your static files are served from /uploads
      const baseUrl =
        process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000";
      offerAttachments = files.map((file) => ({
        fileName: file,
        fileUrl: `${baseUrl}/uploads/offers/${offerId}/${file}`,
      }));
    }
    offer.attachments = offerAttachments;

    // 4) Get draft
    const draft = await Draft.findOne({ offerId: offerId });

    return res.json({ offer: { ...offer, draftId: draft?._id } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET Draft by ID
exports.getDraftById = async (req, res) => {
  try {
    const { draftId } = req.params;

    const draft = await Draft.findById(draftId)
      .populate("userId", "name userName avatarUrl")
      .lean();
    if (!draft) {
      return res.status(404).json({ error: "Draft not found" });
    }

    // Build the final attachments array for the draft
    const dirPath = path.join(__dirname, "../uploads/drafts", draftId);
    let draftAttachments = [];
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      const baseUrl =
        process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000";
      draftAttachments = files.map((file) => ({
        fileName: file,
        fileUrl: `${baseUrl}/uploads/drafts/${draftId}/${file}`,
      }));
    }
    draft.attachments = draftAttachments;

    return res.json({ draft });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------------
// 5) SAVE DRAFT
// -------------------------------------------------------------------
exports.saveDraft = (req, res) => {
  upload(req, res, async (err) => {
    try {
      // A) Handle Multer errors
      if (err) {
        console.error("Multer error in saveDraft:", err);
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            error: `File upload error: ${err.message}`,
            code: err.code,
          });
        }
        return res.status(400).json({
          error: err.message,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
      }

<<<<<<< HEAD
      // B) Log for debugging
      console.log("Request body (draft):", req.body);
      console.log("Request files:", req.files);
=======
>>>>>>> feature/testing-infrastructure

      // C) Ensure "files" array shape
      if (!req.files) {
        req.files = [];
      }

      // D) Validate required fields
      if (!req.body.userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      // E) Extract fields from req.body
      const {
        userId,
        offerId,
        offerType,
        offerName,
        amount,
<<<<<<< HEAD
=======
        proposedAmount,
>>>>>>> feature/testing-infrastructure
        notes,
        reviewDate,
        postDate,
        draftType,
        description,
        creatorId,
      } = req.body;
<<<<<<< HEAD
=======
      
      const finalAmount = proposedAmount || amount;
>>>>>>> feature/testing-infrastructure

      // If offerId is blank => treat as null
      let offerIdValid =
        offerId && typeof offerId === "string" && offerId.trim() !== ""
          ? offerId
          : null;

      // Parse deliverables if it's a string
      let { deliverables } = req.body;
      if (typeof deliverables === "string") {
        try {
          deliverables = JSON.parse(deliverables);
        } catch {
          deliverables = deliverables.split(",");
        }
      }
      if (!Array.isArray(deliverables)) {
        deliverables = [];
      }

      // F) Build the draft object
      const draftData = {
        userId,
        offerId: offerIdValid, // can be used for linking a draft to an existing offer
<<<<<<< HEAD
        amount,
=======
        amount: finalAmount,
>>>>>>> feature/testing-infrastructure
        notes,
        reviewDate: reviewDate ? new Date(reviewDate) : null, // Ensure Date object
        postDate: postDate ? new Date(postDate) : null, // Ensure Date object
        lastUpdated: new Date(),
        status: "Draft", // always "Draft" when saving
        attachments: [],
        deliverables,
        description,
        offerType,
        draftType,
        // if `offerType !== "custom"`, fallback to the type as name
        offerName:
          offerType?.toLowerCase() === "custom"
            ? offerName || "Custom Offer"
            : offerType,
        creatorId,
      };

      // G) Create new Draft in DB
      const newDraft = new Draft(draftData);
      await newDraft.save();

      // 2) Final draft folder
      const finalFolder = path.join(
        __dirname,
        "../uploads/drafts",
        newDraft._id.toString()
      );
      fs.mkdirSync(finalFolder, { recursive: true });

      // 3) Move files from temp => final
      const attachments = [];
      const files = req.files?.attachments || [];
      for (const file of files) {
        const oldPath = file.path; // => something in /uploads/temp/...
        const newPath = path.join(finalFolder, file.filename);

        // Use copy + unlink or rename
        fs.renameSync(oldPath, newPath);

        attachments.push({
          fileUrl: `/uploads/drafts/${newDraft._id}/${file.filename}`,
          fileName: file.originalname || file.filename,
          fileType: file.mimetype,
        });
      }

      // 4) Store the file info on the Draft
      newDraft.attachments = attachments;
      await newDraft.save();

      return res.json({ message: "Draft saved", draft: newDraft });
    } catch (error) {
      console.error("Error saving draft:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
};

// -------------------------------------------------------------------
// Update an EXISTING Draft (with file uploads)
// -------------------------------------------------------------------
exports.updateExistingDraft = (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error("Multer error in updateExistingDraft:", err);
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            error: `File upload error: ${err.message}`,
            code: err.code,
          });
        }
        return res.status(400).json({
          error: err.message,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
      }

      const { draftId } = req.params;
<<<<<<< HEAD
      console.log("Updating draft ID:", draftId);
=======
>>>>>>> feature/testing-infrastructure

      const draft = await Draft.findById(draftId);
      if (!draft) {
        return res.status(404).json({ error: "Draft not found" });
      }

      // // 1. Clear previous attachments
      // const draftFolder = path.join(__dirname, "../uploads/drafts", draftId);
      // if (fs.existsSync(draftFolder)) {
      //   // Remove all existing files
      //   fs.readdirSync(draftFolder).forEach((file) => {
      //     fs.unlinkSync(path.join(draftFolder, file));
      //   });
      // }

      // 2. Reset attachments array
      // draft.attachments = [];

      // 3. Process new files
      if (req.files?.attachments?.length > 0) {
        const finalFolder = path.join(__dirname, "../uploads/drafts", draftId);
        fs.mkdirSync(finalFolder, { recursive: true });

        const newAttachments = draft.attachments || [];
        for (const file of req.files.attachments) {
          const oldPath = file.path;
          const newPath = path.join(finalFolder, file.filename);

          try {
            fs.copyFileSync(oldPath, newPath);
            fs.unlinkSync(oldPath);

            newAttachments.push({
              fileUrl: `/uploads/drafts/${draftId}/${file.filename}`,
              fileName: file.originalname || file.filename,
              fileType: file.mimetype,
            });
          } catch (error) {
            console.error("Error moving file:", error);
            // If there's an error, clean up the copied file
            if (fs.existsSync(newPath)) {
              fs.unlinkSync(newPath);
            }
            continue;
          }
        }
        draft.attachments = newAttachments;
      }

      // 4. Update other fields
      draft.userId = req.body.userId || draft.userId;
      draft.creatorId = req.body.creatorId || draft.creatorId;
      draft.offerType = req.body.offerType || "custom";
<<<<<<< HEAD
      draft.amount = req.body.amount || 0;
=======
      draft.amount = req.body.proposedAmount || req.body.amount || 0;
>>>>>>> feature/testing-infrastructure
      draft.notes = req.body.notes || "";
      draft.description = req.body.description || "";
      draft.reviewDate = req.body.reviewDate
        ? new Date(req.body.reviewDate)
        : null;
      draft.postDate = req.body.postDate ? new Date(req.body.postDate) : null;
      draft.offerName =
        req.body.offerType?.toLowerCase() === "custom"
          ? req.body.offerName || "Custom Offer"
          : req.body.offerType;
      draft.lastUpdated = new Date();
      draft.draftType = req.body.draftType || "regular";
      if (req.body.deliverables) {
        try {
          draft.deliverables = JSON.parse(req.body.deliverables);
        } catch {
          draft.deliverables = req.body.deliverables.split(",");
        }
      }

      await draft.save();
      return res.json({
        message: "Draft updated successfully",
        draft,
      });
    } catch (error) {
      console.error("Error in updateExistingDraft:", error);
      return res.status(500).json({
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  });
};

// -------------------------------------------------------------------
// 6) UPDATE OFFER
// -------------------------------------------------------------------
exports.updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const updates = req.body;

    const offer = await Offer.findById(offerId).populate([
      { path: "creatorId", select: "deviceToken" },
      { path: "marketerId", select: "deviceToken" },
    ]);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Only allow updates if in specific statuses
    if (
      ![
        OFFER_STATUSES.DRAFT,
        "Counter",
        OFFER_STATUSES.SENT,
        OFFER_STATUSES.REJECTED_COUNTERED,
      ].includes(offer.status)
    ) {
      return res.status(400).json({
        error: "Cannot update offer in current status",
      });
    }

    // Process attachments (ensure we're handling multiple files)
    let attachments = [];
    if (req.files && req.files.attachments) {
      // Handle both single file and array of files
      const files = Array.isArray(req.files.attachments)
        ? req.files.attachments
        : [req.files.attachments];

      // Add attachments to update data
      updates.attachments = attachments;
    }

    Object.assign(offer, updates);
    const updated = await offer.save();

    // Optionally notify the other user that an update occurred
    // ...

    return res.json({
      message: "Offer updated successfully",
      offer: updated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------------
// 7) DELETE OFFER
// -------------------------------------------------------------------
exports.deleteOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // // Hard delete:
    // await offer.deleteOne();

    // Or if you want to "soft delete":
    offer.status = OFFER_STATUSES.DELETED;
    await offer.save();

    await sendOfferNotification(offer, "offer_deleted");

    return res.json({ message: "Offer deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------------
// 8) SEND OFFER
// -------------------------------------------------------------------
exports.sendOffer = (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        console.error("Multer error in sendOffer:", err);
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            error: `File upload error: ${err.message}`,
            code: err.code,
          });
        }
        return res.status(400).json({
          error: err.message,
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        });
      }

<<<<<<< HEAD
      console.log("Files received in sendOffer:", req.files);
=======
>>>>>>> feature/testing-infrastructure

      const { offerId } = req.params;
      const offer = await Offer.findById(offerId)
        .populate("creatorId", "name email deviceToken")
        .populate("marketerId", "name email deviceToken");

      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Extract fields from req.body
      const {
        description,
        notes,
        amount,
<<<<<<< HEAD
=======
        proposedAmount,
>>>>>>> feature/testing-infrastructure
        reviewDate,
        postDate,
        draftId,
        userId,
        marketerId,
        creatorId,
        deliverables,
      } = req.body;

      // Update offer fields
      if (description) offer.description = description;
      if (notes) offer.notes = notes;
<<<<<<< HEAD
      if (amount) offer.proposedAmount = Number(amount);
=======
      if (proposedAmount || amount) offer.proposedAmount = Number(proposedAmount || amount);
>>>>>>> feature/testing-infrastructure

      // Parse dates correctly - match field names from frontend
      if (reviewDate) offer.desiredReviewDate = new Date(reviewDate);
      if (postDate) offer.desiredPostDate = new Date(postDate);

      // Parse deliverables if it's a string
      if (deliverables) {
        let parsedDeliverables;
        if (typeof deliverables === "string") {
          try {
            parsedDeliverables = JSON.parse(deliverables);
          } catch {
            parsedDeliverables = deliverables.split(",");
          }
        } else {
          parsedDeliverables = deliverables;
        }

        if (Array.isArray(parsedDeliverables)) {
          offer.deliverables = parsedDeliverables;
        }
      }

      // Process attachments
      if (
        req.files &&
        req.files.attachments &&
        req.files.attachments.length > 0
      ) {
        // Create the final directory if it doesn't exist
        const finalFolder = path.join(
          __dirname,
          "../uploads/offers",
          offer._id.toString()
        );
        if (!fs.existsSync(finalFolder)) {
          fs.mkdirSync(finalFolder, { recursive: true });
        }

        const finalAttachments = [];
        for (const file of req.files.attachments) {
          const tempPath = file.path;
          const finalPath = path.join(finalFolder, file.filename);

          // Copy file from temp to final location
          fs.copyFileSync(tempPath, finalPath);
          // Remove temp file after successful copy
          fs.unlinkSync(tempPath);

          finalAttachments.push({
            fileUrl: `/uploads/offers/${offer._id.toString()}/${file.filename}`,
            fileName: file.originalname,
            fileType: file.mimetype,
          });
        }

        // Update offer with new attachments
        offer.attachments = finalAttachments;
      }

      // Mark as "Sent" from marketer's perspective
      offer.status = "Sent";
      offer.sentAt = new Date();
      await offer.save();

      // If draft exists, delete it since it's now sent
      if (draftId) {
        await Draft.findByIdAndDelete(draftId);
      }

      // Send notification
      await sendOfferNotification(offer, "new_offer");

      return res.json({
        message: "Offer sent successfully",
        offer,
      });
    } catch (error) {
      console.error("Error sending offer:", error);
      return res.status(500).json({ error: error.message });
    }
  });
};

// -------------------------------------------------------------------
// 9) COUNTER OFFER
// -------------------------------------------------------------------
exports.counterOffer = async (req, res) => {
  try {
    const { offerId } = req.params;

    const {
      counterBy,
      counterAmount,
      notes,
      counterReviewDate,
      counterPostDate,
      offerName,
      description,
      attachments,
      deliverables,
    } = req.body;

    const offer = await Offer.findById(offerId).populate([
      { path: "creatorId", select: "deviceToken name email" },
      { path: "marketerId", select: "deviceToken name email" },
    ]);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }
    // Reset viewed status for both parties
    offer.viewedByCreator = false;
    offer.viewedByMarketer = false;

    offer.counters.push({
      counterBy,
      counterAmount,
      notes,
      counterDate: new Date(),
      counterReviewDate,
      counterPostDate,
      offerName,
      description,
      deliverables,
      attachments,
    });

    // Mark as "Rejected-Countered" (or "Counter" if you prefer simpler naming)
    offer.status = "Rejected-Countered";
    await offer.save();

    await sendOfferNotification(offer, "counter_offer");

    return res.json({
      message: "Counter offer sent (Rejected-Countered)",
      offer,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------------
// 10) ACCEPT OFFER
// -------------------------------------------------------------------
exports.acceptOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const offer = await Offer.findById(offerId)
      .populate("marketerId", "name email deviceToken")
      .populate("creatorId", "name email deviceToken");

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // 1) Default to original offer amounts
    let finalAmount = offer.proposedAmount;
    let finalReviewDate = offer.desiredReviewDate;
    let finalPostDate = offer.desiredPostDate;

    // 2) Determine the caller's role
    let callerRole = "";
    if (String(offer.creatorId._id) === String(userId)) {
      callerRole = "Creator";
    } else if (String(offer.marketerId._id) === String(userId)) {
      callerRole = "Marketer";
    }

    // 3) Apply counters if they exist
    if (offer.counters && offer.counters.length > 0) {
      const lastCounter = offer.counters[offer.counters.length - 1];
      if (lastCounter.counterBy !== callerRole) {
        finalAmount = lastCounter.counterAmount || finalAmount;
        finalReviewDate = lastCounter.counterReviewDate || finalReviewDate;
        finalPostDate = lastCounter.counterPostDate || finalPostDate;
      }
    }

    // 4) Mark Offer as Accepted
    offer.status = "Accepted";
    await offer.save();

    // 5) Generate deal number
    const marketerName = offer.marketerId?.name || "Marketer";
    const creatorName = offer.creatorId?.name || "Creator";
    const letterM = marketerName[0]?.toUpperCase() || "M";
    const letterC = creatorName[0]?.toUpperCase() || "C";
    const random4 = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getDate()).slice(-2);

    const dealNumber = letterM + letterC + random4 + dd + mm + yy;
    const requiredPayment = finalAmount * 0.5;

    // 6) Create the Deal
    const deal = await Deal.create({
      offerId: offer._id,
      marketerId: offer.marketerId,
      creatorId: offer.creatorId,
      dealName: offer.offerName,
      deliverables: offer.deliverables,
      paymentInfo: {
        paymentAmount: finalAmount,
        currency: offer.currency,
        paymentNeeded: true,
        requiredPayment: requiredPayment,
      },
      desiredReviewDate: finalReviewDate,
      desiredPostDate: finalPostDate,
      status: "Accepted",
      dealNumber,
    });

    // Find existing chat room (created when offer was made)
    const chatRoom = await ChatRoom.findOne({ createdFromOffer: offer._id });
    
    if (chatRoom) {
      // Add acceptance message to existing chat room
      const messageText = `Deal #${dealNumber} Accepted!\n\n` +
        `Offer: ${offer.offerName}\n` +
        `Amount: ${finalAmount} ${offer.currency}\n` +
        `Deliverables: ${offer.deliverables.join(', ')}\n` +
        `Review Date: ${finalReviewDate.toDateString()}\n` +
        `Post Date: ${finalPostDate.toDateString()}`;

      await Message.create({
        chatId: chatRoom._id,
        senderId: userId,
        text: messageText,
      });

      // Update room with last message
      await ChatRoom.findByIdAndUpdate(chatRoom._id, {
        $set: { 
          lastMessage: { 
            text: messageText, 
            sender: userId, 
            createdAt: new Date() 
          } 
        },
        $inc: { 
          [`unreadCount.${userId === String(offer.marketerId._id) ? offer.creatorId._id : offer.marketerId._id}`]: 1 
        },
      });
    }

    // 7) Send notifications
    const notificationPromises = [];
    
    if (offer.marketerId.deviceToken) {
      notificationPromises.push(
        sendPushNotification({
          token: offer.marketerId.deviceToken,
          title: "Offer Accepted",
          body: `${creatorName} accepted your offer for ${offer.offerName}`,
          data: {
            type: "offer_accepted",
            offerId: offer._id.toString(),
            dealId: deal._id.toString(),
            chatId: chatRoom?._id.toString()
          }
        })
      );
    }

    if (offer.creatorId.deviceToken) {
      notificationPromises.push(
        sendPushNotification({
          token: offer.creatorId.deviceToken,
          title: "Offer Accepted",
          body: `You accepted ${marketerName}'s offer for ${offer.offerName}`,
          data: {
            type: "offer_accepted",
            offerId: offer._id.toString(),
            dealId: deal._id.toString(),
            chatId: chatRoom?._id.toString()
          }
        })
      );
    }

    await Promise.all(notificationPromises);

    res.json({
      success: true,
      deal,
      chatRoomId: chatRoom?._id,
      message: "Offer accepted successfully"
    });

  } catch (error) {
    console.error("Detailed error accepting offer:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
};

// -------------------------------------------------------------------
// 11) REJECT OFFER
// -------------------------------------------------------------------
exports.rejectOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { reason, userId } = req.body;

    const offer = await Offer.findById(offerId).populate([
      { path: "creatorId", select: "deviceToken" },
      { path: "marketerId", select: "deviceToken" },
    ]);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    offer.status = "Rejected";
    offer.rejectionReason = reason;
    await offer.save();

    const recipientId =
      String(userId) === String(offer.creatorId._id)
        ? offer.marketerId._id
        : offer.creatorId._id;

    await sendOfferNotification(offer, "offer_rejected");

    return res.json({
      message: "Offer rejected",
      offer,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------------
// 12) CANCEL OFFER
// -------------------------------------------------------------------
exports.cancelOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findById(offerId).populate([
      { path: "creatorId", select: "deviceToken" },
      { path: "marketerId", select: "deviceToken" },
    ]);

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    offer.status = "Cancelled";
    await offer.save();
    // Send notification to both parties
    await sendOfferNotification(offer, "offer_cancelled");
    return res.json({
      message: "Offer cancelled",
      offer,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------------
// MARK OFFER AS IN REVIEW
// -------------------------------------------------------------------
exports.markOfferInReview = async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await Offer.findById(offerId).populate([
      { path: "creatorId", select: "deviceToken" },
      { path: "marketerId", select: "deviceToken" },
    ]);

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Update status to "Offer in Review"
    offer.status = "Offer in Review";
    await offer.save();

    await sendOfferNotification(offer, "offer_in_review");

    return res.json({
      message: "Offer marked as in review",
      offer,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// -------------------------------------------------------------------
// MARK OFFER AS VIEWED
// -------------------------------------------------------------------
exports.markOfferAsViewed = async (req, res) => {
  try {
    const { offerId, role } = req.params;
    if (!["creator", "marketer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    const currentTime = new Date(); // Get current time

    if (role === "creator") {
      offer.viewedByCreator = true;
      offer.viewedByCreatorAt = currentTime;
    } else if (role === "marketer") {
      offer.viewedByMarketer = true;
      offer.viewedByMarketerAt = currentTime;
    }

    await offer.save();
    return res.json({
      message: "Offer marked as viewed",
      offer: {
        viewedByCreator: offer.viewedByCreator,
        viewedByCreatorAt: offer.viewedByCreatorAt,
        viewedByMarketer: offer.viewedByMarketer,
        viewedByMarketerAt: offer.viewedByMarketerAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET /marketer/payment-status
exports.getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user?._id || req.query.userId; // from JWT or query
    if (!userId) {
      return res.status(400).json({ error: "No user id" });
    }

    // Find active deals for the Marketer with payment needed
    const deal = await Deal.findOne({
      marketerId: userId,
      "paymentInfo.paymentNeeded": true,
      status: "Accepted",
    }).lean();

    if (!deal) {
      return res.json({
        paymentNeeded: false,
      });
    }

    // Return the required payment from the deal
    return res.json({
      paymentNeeded: true,
      requiredAmount: deal.paymentInfo.requiredPayment,
      dealId: deal._id,
      offerId: deal.offerId,
      creatorId: deal.creatorId,
      marketerId: deal.marketerId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { dealId } = req.params;
    const { amount, paymentMethod, transactionId } = req.body;

    // Ensure amount is a valid number
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount)) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    // Find the deal
    const deal = await Deal.findById(dealId);
    if (!deal) {
      return res.status(404).json({ error: "Deal not found" });
    }

    // Update the payment info
    deal.paymentInfo = {
      paymentAmount: paymentAmount,
      paymentMethod: paymentMethod,
      transactionId: transactionId,
      paymentNeeded: false, // Mark payment as completed
      requiredPayment: 0, // Reset required payment to 0
    };

    // Save the updated deal
    await deal.save();

    return res.json({
      message: "Payment processed successfully",
      deal,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return res.status(500).json({ error: error.message });
  }
};

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

// Simple backup email template for critical failures
const generateBackupEmail = (offer, action, recipientName) => {
  const subject = `Offer ${action.replace('_', ' ')} - ${offer.offerName}`;
  const content = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Offer ${action.replace('_', ' ')}</h2>
      <p>Hello ${recipientName},</p>
      <p>There has been an update to your offer "${offer.offerName}".</p>
      <p>Please visit the Axees platform to view the details.</p>
      <p>Thank you,<br>The Axees Team</p>
    </div>
  `;
  return { subject, content };
};

// Helper function to generate email content
const generateEmailContent = async (offer, action, recipient, role) => {
  try {
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

    case "offer_updated":
      subject = "Offer Updated";
      const baseUrlUpdate = process.env.FRONTEND_URL || "http://localhost:8081";
      offerUrl = `${baseUrlUpdate}/UOM10CreatorOfferDetails?offerId=${offer._id}&${role === "creator" ? "marketerId" : "creatorId"}=${role === "creator" ? offer.marketerId._id : offer.creatorId._id}&role=${role}`;
      content = emailTemplate(
        `
        <h2 style="margin:0 0 20px 0;font-size:22px;color:#430B92;">Offer Updated</h2>
        <p style="margin:0 0 15px 0;">Hello ${recipient.name},</p>
        <p style="margin:0 0 15px 0;">${
          role === "creator"
            ? `${marketerName} has made changes to the offer "${offer.offerName}"`
            : `${creatorName} has made changes to the offer "${offer.offerName}"`
        }</p>
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Offer:</strong> ${offer.offerName}</p>
          <p><strong>Amount:</strong> ${formattedAmount}</p>
          <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <a href="${offerUrl}" style="${BUTTON_STYLE}">Review Changes</a>
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
  } catch (error) {
    console.error('Error generating email content, using backup template:', error.message);
    return generateBackupEmail(offer, action, recipient.name || 'User');
  }
};

// Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && emailRegex.test(email.trim());
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
      console.error("Creator or marketer not found for offer:", offer._id);
      return { success: false, error: "Users not found" };
    }

    // Validate email addresses
    if (creator.email && !isValidEmail(creator.email)) {
      console.warn("Invalid creator email format:", creator.email);
      creator.email = null; // Don't send to invalid email
    }
    if (marketer.email && !isValidEmail(marketer.email)) {
      console.warn("Invalid marketer email format:", marketer.email);
      marketer.email = null; // Don't send to invalid email
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

      if (notification.user.email && isValidEmail(notification.user.email)) {
        try {
          // Check if logo file exists before including it
          const logoPath = path.join(__dirname, "../uploads/assets/icon.png");
          const attachments = [];
          
          if (fs.existsSync(logoPath)) {
            attachments.push({
              filename: "logo.png",
              path: logoPath,
              cid: "axees-logo"
            });
          } else {
            console.warn("Logo file not found, sending email without logo attachment");
          }

          await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Axees Offer System" <noreply@axees.io>',
            to: notification.user.email.trim(),
            subject: emailSubject,
            html: emailContent,
            attachments
          });
          
          console.log(`✅ Email sent successfully to ${notification.role}: ${notification.user.email}`);
        } catch (emailError) {
          console.error(`❌ Failed to send email to ${notification.role}:`, {
            email: notification.user.email,
            error: emailError.message,
            offerId: offer._id,
            action
          });
          
          // Log email failure for potential retry mechanism
          // Could implement email queue/retry logic here
        }
      } else {
        console.log(`⚠️  ${notification.role} email not found or invalid:`, notification.user.email);
      }
    }
    
    return { success: true, message: "Notifications sent successfully" };
  } catch (error) {
    console.error("❌ Critical error in sendOfferNotification:", {
      error: error.message,
      stack: error.stack,
      offerId: offer?._id,
      action
    });
    return { success: false, error: error.message };
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
      const offerData = {
        _id: offerId,
        marketerId: req.body.marketerId,
        creatorId: req.body.creatorId,
        offerType: req.body.offerType || "standard",
        offerName: req.body.offerName,
        description: req.body.description,
        deliverables,
        proposedAmount: req.body.amount,
        currency: req.body.currency || "USD",
        desiredReviewDate: req.body.desiredReviewDate,
        desiredPostDate: req.body.desiredPostDate,
        status: req.body.status || "Sent",
        notes: req.body.notes,
        attachments: [],
      };

      // Handle trial offer setup
      if (req.body.offerType === 'trial' || req.body.isTrialOffer) {
        const trialDuration = req.body.trialDuration || 7;
        const trialStartDate = new Date();
        const trialEndDate = new Date(trialStartDate.getTime() + trialDuration * 24 * 60 * 60 * 1000);
        const autoConvertDate = new Date(trialEndDate.getTime() + 24 * 60 * 60 * 1000);

        offerData.offerType = 'trial';
        offerData.trialDetails = {
          isTrialOffer: true,
          trialAmount: req.body.trialAmount || 1,
          trialDuration: trialDuration,
          fullAmount: req.body.amount,
          autoConvertDate: autoConvertDate,
          trialStatus: 'pending',
          remindersSent: []
        };

        // For trial offers, the proposed amount should be the full amount
        offerData.proposedAmount = req.body.amount;
      }

      const newOffer = new Offer(offerData);

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
      const notificationResult = await sendOfferNotification(newOffer, "new_offer");
      if (!notificationResult.success) {
        console.warn('⚠️ Notification sending failed for new offer:', notificationResult.error);
        // Offer creation still succeeds even if notification fails
      }

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

      // B) Log for debugging
      console.log("Request body (draft):", req.body);
      console.log("Request files:", req.files);

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
        notes,
        reviewDate,
        postDate,
        draftType,
        description,
        creatorId,
      } = req.body;

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
        amount,
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
      console.log("Updating draft ID:", draftId);

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
      draft.amount = req.body.amount || 0;
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
// 6) UPDATE OFFER WITH REAL-TIME COLLABORATION
// -------------------------------------------------------------------

// Track active editors for real-time collaboration
const activeEditors = new Map(); // offerId -> Set of userId

// Track offer edit sessions with timestamps
const editSessions = new Map(); // offerId -> { userId, lastActivity, fields }

// Helper to validate field-level permissions
const validateFieldPermissions = (offer, userId, fieldName, userRole) => {
  const restrictedFields = {
    marketer: ['viewedByCreator', 'viewedByCreatorAt', 'creatorDraft'],
    creator: ['viewedByMarketer', 'viewedByMarketerAt', 'marketerDraft']
  };
  
  const isMarketer = String(offer.marketerId) === String(userId);
  const isCreator = String(offer.creatorId) === String(userId);
  
  if (!isMarketer && !isCreator) {
    return { allowed: false, reason: 'User not authorized for this offer' };
  }
  
  const role = isMarketer ? 'marketer' : 'creator';
  const restricted = restrictedFields[role] || [];
  
  if (restricted.includes(fieldName)) {
    return { allowed: false, reason: `${role} cannot edit ${fieldName}` };
  }
  
  return { allowed: true };
};

// Helper to create change history entry
const createChangeHistory = (offer, userId, changes, userRole) => {
  const changeEntry = {
    timestamp: new Date(),
    userId: userId,
    userRole: userRole,
    changes: changes,
    version: (offer.editHistory?.length || 0) + 1
  };
  
  if (!offer.editHistory) {
    offer.editHistory = [];
  }
  
  offer.editHistory.push(changeEntry);
  
  // Keep only last 50 changes to prevent document bloat
  if (offer.editHistory.length > 50) {
    offer.editHistory = offer.editHistory.slice(-50);
  }
  
  return changeEntry;
};

// Enhanced update offer with real-time collaboration
exports.updateOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { updates, sessionId, expectedVersion } = req.body;
    const userId = req.user?._id || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const offer = await Offer.findById(offerId).populate([
      { path: "creatorId", select: "deviceToken name email" },
      { path: "marketerId", select: "deviceToken name email" },
    ]);
    
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Check if offer is in editable status
    const editableStatuses = [
      OFFER_STATUSES.DRAFT,
      "Counter",
      OFFER_STATUSES.SENT,
      OFFER_STATUSES.REJECTED_COUNTERED,
    ];
    
    if (!editableStatuses.includes(offer.status)) {
      return res.status(400).json({
        error: "Cannot update offer in current status",
        currentStatus: offer.status
      });
    }

    // Determine user role
    const isMarketer = String(offer.marketerId._id) === String(userId);
    const isCreator = String(offer.creatorId._id) === String(userId);
    const userRole = isMarketer ? 'marketer' : isCreator ? 'creator' : 'unknown';
    
    if (userRole === 'unknown') {
      return res.status(403).json({ error: "Not authorized to edit this offer" });
    }

    // Version conflict detection
    const currentVersion = offer.editHistory?.length || 0;
    if (expectedVersion && expectedVersion !== currentVersion) {
      return res.status(409).json({
        error: "Version conflict detected",
        expectedVersion,
        currentVersion,
        message: "Someone else has modified this offer. Please refresh and try again."
      });
    }

    // Track active editing session
    const sessionKey = offerId;
    if (!activeEditors.has(sessionKey)) {
      activeEditors.set(sessionKey, new Set());
    }
    activeEditors.get(sessionKey).add(userId);
    
    // Update edit session timestamp
    editSessions.set(`${sessionKey}:${userId}`, {
      userId,
      lastActivity: new Date(),
      fields: Object.keys(updates || {}),
      sessionId
    });

    // Validate field permissions and track changes
    const validatedUpdates = {};
    const changes = [];
    const rejectedFields = [];
    
    for (const [fieldName, newValue] of Object.entries(updates || {})) {
      const permission = validateFieldPermissions(offer, userId, fieldName, userRole);
      
      if (!permission.allowed) {
        rejectedFields.push({ field: fieldName, reason: permission.reason });
        continue;
      }
      
      const oldValue = offer[fieldName];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        validatedUpdates[fieldName] = newValue;
        changes.push({
          field: fieldName,
          oldValue: oldValue,
          newValue: newValue
        });
      }
    }

    // Process attachments if present
    if (req.files && req.files.attachments) {
      const files = Array.isArray(req.files.attachments)
        ? req.files.attachments
        : [req.files.attachments];
      
      // Handle file attachments (this would need multer middleware)
      validatedUpdates.attachments = offer.attachments || [];
      changes.push({
        field: 'attachments',
        oldValue: offer.attachments?.length || 0,
        newValue: (offer.attachments?.length || 0) + files.length
      });
    }

    // Apply validated updates
    if (Object.keys(validatedUpdates).length > 0) {
      Object.assign(offer, validatedUpdates);
      offer.updatedAt = new Date();
      
      // Create change history entry
      const changeEntry = createChangeHistory(offer, userId, changes, userRole);
      
      // Save the updated offer
      const updated = await offer.save();
      
      // Notify other active editors about the changes
      const otherEditors = Array.from(activeEditors.get(sessionKey) || []).filter(id => id !== userId);
      
      if (otherEditors.length > 0) {
        // In a real implementation, this would use WebSockets or SSE
        console.log(`📝 Notifying ${otherEditors.length} other editors about changes to offer ${offerId}`);
        
        // Send notification to other party if they're not currently editing
        const otherPartyId = isMarketer ? offer.creatorId._id : offer.marketerId._id;
        if (!activeEditors.get(sessionKey)?.has(String(otherPartyId))) {
          const notificationResult = await sendOfferNotification(updated, "offer_updated");
          if (!notificationResult.success) {
            console.warn('⚠️ Failed to notify other party about offer update:', notificationResult.error);
          }
        }
      }
      
      return res.json({
        success: true,
        message: "Offer updated successfully",
        offer: updated,
        changeEntry,
        version: currentVersion + 1,
        rejectedFields: rejectedFields.length > 0 ? rejectedFields : undefined,
        activeEditors: otherEditors.length,
        editHistory: updated.editHistory?.slice(-5) // Return last 5 changes
      });
    } else {
      return res.json({
        success: false,
        message: "No valid changes to apply",
        rejectedFields,
        version: currentVersion
      });
    }
    
  } catch (error) {
    console.error('Error updating offer:', error);
    return res.status(500).json({ 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -------------------------------------------------------------------
// 6B) GET OFFER EDIT HISTORY
// -------------------------------------------------------------------
exports.getOfferEditHistory = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user?._id || req.query.userId;
    
    const offer = await Offer.findById(offerId).populate([
      { path: "creatorId", select: "name email" },
      { path: "marketerId", select: "name email" },
    ]);
    
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }
    
    // Check user permissions
    const isMarketer = String(offer.marketerId._id) === String(userId);
    const isCreator = String(offer.creatorId._id) === String(userId);
    
    if (!isMarketer && !isCreator) {
      return res.status(403).json({ error: "Not authorized to view edit history" });
    }
    
    const editHistory = offer.editHistory || [];
    const total = editHistory.length;
    const paginatedHistory = editHistory
      .reverse()
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map(entry => ({
        ...entry,
        userName: entry.userId === String(offer.marketerId._id) ? offer.marketerId.name : offer.creatorId.name,
        userRole: entry.userRole
      }));
    
    return res.json({
      editHistory: paginatedHistory,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      },
      currentVersion: total
    });
  } catch (error) {
    console.error('Error fetching edit history:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// -------------------------------------------------------------------
// 6C) GET ACTIVE EDITORS
// -------------------------------------------------------------------
exports.getActiveEditors = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user?._id || req.query.userId;
    
    const offer = await Offer.findById(offerId).populate([
      { path: "creatorId", select: "name" },
      { path: "marketerId", select: "name" },
    ]);
    
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }
    
    // Check user permissions
    const isMarketer = String(offer.marketerId._id) === String(userId);
    const isCreator = String(offer.creatorId._id) === String(userId);
    
    if (!isMarketer && !isCreator) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    const sessionKey = offerId;
    const activeUserIds = Array.from(activeEditors.get(sessionKey) || []);
    
    // Clean up stale sessions (inactive for more than 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeSessions = [];
    
    for (const editorId of activeUserIds) {
      const session = editSessions.get(`${sessionKey}:${editorId}`);
      if (session && session.lastActivity > fiveMinutesAgo) {
        const user = editorId === String(offer.marketerId._id) ? offer.marketerId : offer.creatorId;
        activeSessions.push({
          userId: editorId,
          name: user.name,
          role: editorId === String(offer.marketerId._id) ? 'marketer' : 'creator',
          lastActivity: session.lastActivity,
          editingFields: session.fields
        });
      } else {
        // Remove stale session
        activeEditors.get(sessionKey)?.delete(editorId);
        editSessions.delete(`${sessionKey}:${editorId}`);
      }
    }
    
    return res.json({
      activeEditors: activeSessions.filter(session => session.userId !== userId),
      isCurrentlyEditing: activeSessions.some(session => session.userId === userId)
    });
  } catch (error) {
    console.error('Error fetching active editors:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// -------------------------------------------------------------------
// 6D) END EDITING SESSION
// -------------------------------------------------------------------
exports.endEditingSession = async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user?._id || req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }
    
    const sessionKey = offerId;
    activeEditors.get(sessionKey)?.delete(userId);
    editSessions.delete(`${sessionKey}:${userId}`);
    
    // Clean up empty editor sets
    if (activeEditors.get(sessionKey)?.size === 0) {
      activeEditors.delete(sessionKey);
    }
    
    return res.json({ message: "Editing session ended" });
  } catch (error) {
    console.error('Error ending editing session:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// -------------------------------------------------------------------
// 6E) OFFER NEGOTIATION COMPARISON & VISUAL DIFF
// -------------------------------------------------------------------

// Helper to calculate difference between two values
const calculateDifference = (oldVal, newVal, fieldType = 'text') => {
  if (oldVal === newVal) {
    return { type: 'unchanged', oldVal, newVal, difference: null };
  }
  
  switch (fieldType) {
    case 'amount':
      const diff = newVal - oldVal;
      const percentChange = oldVal !== 0 ? ((diff / oldVal) * 100).toFixed(1) : 'N/A';
      return {
        type: diff > 0 ? 'increase' : 'decrease',
        oldVal,
        newVal,
        difference: diff,
        percentChange: `${diff > 0 ? '+' : ''}${percentChange}%`,
        formatted: {
          old: formatCurrency(oldVal),
          new: formatCurrency(newVal),
          diff: `${diff > 0 ? '+' : ''}${formatCurrency(Math.abs(diff))}`
        }
      };
      
    case 'date':
      const oldDate = new Date(oldVal);
      const newDate = new Date(newVal);
      const daysDiff = Math.ceil((newDate - oldDate) / (1000 * 60 * 60 * 24));
      return {
        type: daysDiff > 0 ? 'later' : daysDiff < 0 ? 'earlier' : 'unchanged',
        oldVal: formatDate(oldVal),
        newVal: formatDate(newVal),
        difference: `${daysDiff > 0 ? '+' : ''}${daysDiff} days`,
        daysDiff
      };
      
    case 'array':
      const oldArray = Array.isArray(oldVal) ? oldVal : [];
      const newArray = Array.isArray(newVal) ? newVal : [];
      const added = newArray.filter(item => !oldArray.includes(item));
      const removed = oldArray.filter(item => !newArray.includes(item));
      return {
        type: added.length > 0 || removed.length > 0 ? 'modified' : 'unchanged',
        oldVal: oldArray,
        newVal: newArray,
        added,
        removed,
        summary: `${added.length} added, ${removed.length} removed`
      };
      
    default:
      return {
        type: 'modified',
        oldVal,
        newVal,
        difference: 'Content changed'
      };
  }
};

// Generate comprehensive negotiation comparison
exports.getOfferNegotiationComparison = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { compareWith = 'latest' } = req.query; // 'latest', 'original', or specific counter index
    const userId = req.user?._id || req.query.userId;
    
    const offer = await Offer.findById(offerId).populate([
      { path: "creatorId", select: "name email" },
      { path: "marketerId", select: "name email" },
    ]);
    
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }
    
    // Check user permissions
    const isMarketer = String(offer.marketerId._id) === String(userId);
    const isCreator = String(offer.creatorId._id) === String(userId);
    
    if (!isMarketer && !isCreator) {
      return res.status(403).json({ error: "Not authorized to view offer comparison" });
    }
    
    // Get original offer terms
    const originalOffer = {
      amount: offer.proposedAmount,
      currency: offer.currency,
      reviewDate: offer.desiredReviewDate,
      postDate: offer.desiredPostDate,
      deliverables: offer.deliverables || [],
      description: offer.description || '',
      notes: offer.notes || ''
    };
    
    let comparisonTarget;
    let comparisonLabel;
    
    if (!offer.counters || offer.counters.length === 0) {
      return res.json({
        hasCounters: false,
        message: "No counter offers to compare",
        originalOffer
      });
    }
    
    // Determine what to compare with
    if (compareWith === 'latest') {
      comparisonTarget = offer.counters[offer.counters.length - 1];
      comparisonLabel = `Latest Counter Offer (${comparisonTarget.counterBy})`;
    } else if (compareWith === 'original') {
      comparisonTarget = originalOffer;
      comparisonLabel = "Original Offer";
    } else {
      const counterIndex = parseInt(compareWith);
      if (counterIndex >= 0 && counterIndex < offer.counters.length) {
        comparisonTarget = offer.counters[counterIndex];
        comparisonLabel = `Counter Offer #${counterIndex + 1} (${comparisonTarget.counterBy})`;
      } else {
        return res.status(400).json({ error: "Invalid counter offer index" });
      }
    }
    
    // Build comparison object
    const currentTerms = compareWith === 'original' ? 
      (offer.counters[offer.counters.length - 1] || originalOffer) : originalOffer;
    
    const comparison = {
      amount: calculateDifference(
        compareWith === 'original' ? originalOffer.amount : comparisonTarget.counterAmount || comparisonTarget.amount,
        compareWith === 'original' ? comparisonTarget.counterAmount || comparisonTarget.amount : currentTerms.counterAmount || currentTerms.amount,
        'amount'
      ),
      reviewDate: calculateDifference(
        compareWith === 'original' ? originalOffer.reviewDate : comparisonTarget.counterReviewDate || comparisonTarget.reviewDate,
        compareWith === 'original' ? comparisonTarget.counterReviewDate || comparisonTarget.reviewDate : currentTerms.counterReviewDate || currentTerms.reviewDate,
        'date'
      ),
      postDate: calculateDifference(
        compareWith === 'original' ? originalOffer.postDate : comparisonTarget.counterPostDate || comparisonTarget.postDate,
        compareWith === 'original' ? comparisonTarget.counterPostDate || comparisonTarget.postDate : currentTerms.counterPostDate || currentTerms.postDate,
        'date'
      ),
      deliverables: calculateDifference(
        compareWith === 'original' ? originalOffer.deliverables : comparisonTarget.deliverables || originalOffer.deliverables,
        compareWith === 'original' ? comparisonTarget.deliverables || originalOffer.deliverables : currentTerms.deliverables || originalOffer.deliverables,
        'array'
      ),
      notes: calculateDifference(
        compareWith === 'original' ? originalOffer.notes : comparisonTarget.notes || '',
        compareWith === 'original' ? comparisonTarget.notes || '' : currentTerms.notes || '',
        'text'
      )
    };
    
    // Calculate negotiation insights
    const insights = {
      totalCounters: offer.counters.length,
      lastCounterBy: offer.counters[offer.counters.length - 1]?.counterBy,
      amountTrend: offer.counters.map(c => c.counterAmount).slice(-3), // Last 3 amounts
      negotiationDuration: offer.counters.length > 0 ? 
        Math.ceil((new Date(offer.counters[offer.counters.length - 1].counterDate) - new Date(offer.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
      convergenceAnalysis: analyzeNegotiationConvergence(offer),
      recommendedAction: generateNegotiationRecommendation(offer, isMarketer ? 'marketer' : 'creator')
    };
    
    // Build negotiation timeline
    const timeline = [
      {
        type: 'original',
        timestamp: offer.createdAt,
        actor: 'marketer',
        actorName: offer.marketerId.name,
        terms: originalOffer,
        label: 'Original Offer'
      },
      ...offer.counters.map((counter, index) => ({
        type: 'counter',
        timestamp: counter.counterDate,
        actor: counter.counterBy.toLowerCase(),
        actorName: counter.counterBy === 'Marketer' ? offer.marketerId.name : offer.creatorId.name,
        terms: {
          amount: counter.counterAmount,
          reviewDate: counter.counterReviewDate,
          postDate: counter.counterPostDate,
          deliverables: counter.deliverables,
          notes: counter.notes
        },
        label: `Counter Offer #${index + 1}`,
        index
      }))
    ];
    
    return res.json({
      hasCounters: true,
      comparison,
      comparisonLabel,
      timeline,
      insights,
      originalOffer,
      latestTerms: currentTerms,
      metadata: {
        offerId: offer._id,
        offerName: offer.offerName,
        status: offer.status,
        currency: offer.currency,
        lastUpdated: offer.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error generating negotiation comparison:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Analyze negotiation convergence patterns
const analyzeNegotiationConvergence = (offer) => {
  if (!offer.counters || offer.counters.length < 2) {
    return { pattern: 'insufficient_data', confidence: 0 };
  }
  
  const amounts = [offer.proposedAmount, ...offer.counters.map(c => c.counterAmount)];
  const differences = [];
  
  for (let i = 1; i < amounts.length; i++) {
    differences.push(Math.abs(amounts[i] - amounts[i-1]));
  }
  
  // Check if differences are decreasing (converging)
  const isConverging = differences.length >= 2 && 
    differences[differences.length - 1] < differences[differences.length - 2];
  
  const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  const latestDifference = differences[differences.length - 1];
  
  let pattern, confidence;
  
  if (isConverging && latestDifference < avgDifference * 0.5) {
    pattern = 'converging_fast';
    confidence = 0.8;
  } else if (isConverging) {
    pattern = 'converging_slow';
    confidence = 0.6;
  } else if (latestDifference > avgDifference * 1.5) {
    pattern = 'diverging';
    confidence = 0.7;
  } else {
    pattern = 'stable';
    confidence = 0.5;
  }
  
  return {
    pattern,
    confidence,
    avgDifference: Math.round(avgDifference),
    latestDifference: Math.round(latestDifference),
    recommendation: getConvergenceRecommendation(pattern)
  };
};

// Generate negotiation recommendation based on pattern
const getConvergenceRecommendation = (pattern) => {
  switch (pattern) {
    case 'converging_fast':
      return 'Negotiation is progressing well. Consider accepting or making a final offer.';
    case 'converging_slow':
      return 'Progress is being made. Continue with smaller incremental changes.';
    case 'diverging':
      return 'Terms are moving apart. Consider a different negotiation approach.';
    case 'stable':
      return 'Negotiation has reached a stable point. Consider alternative terms or incentives.';
    default:
      return 'More data needed to analyze negotiation pattern.';
  }
};

// Generate role-specific negotiation recommendation
const generateNegotiationRecommendation = (offer, userRole) => {
  if (!offer.counters || offer.counters.length === 0) {
    return userRole === 'marketer' ? 
      'Wait for creator response to your offer.' :
      'Review the offer terms and respond with acceptance or counter offer.';
  }
  
  const lastCounter = offer.counters[offer.counters.length - 1];
  const lastCounterBy = lastCounter.counterBy.toLowerCase();
  
  if (lastCounterBy === userRole) {
    return 'Waiting for response to your counter offer.';
  } else {
    const convergence = analyzeNegotiationConvergence(offer);
    
    if (convergence.pattern === 'converging_fast') {
      return 'Terms are converging quickly. Consider accepting or making a final counter.';
    } else if (convergence.pattern === 'diverging') {
      return 'Consider compromising on different terms or adding value to break the deadlock.';
    } else {
      return 'Review the latest counter offer and respond with your terms.';
    }
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

    const notificationResult = await sendOfferNotification(offer, "offer_deleted");
    if (!notificationResult.success) {
      console.warn('⚠️ Notification sending failed for deleted offer:', notificationResult.error);
    }

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

      console.log("Files received in sendOffer:", req.files);

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
      if (amount) offer.proposedAmount = Number(amount);

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
      const notificationResult = await sendOfferNotification(offer, "new_offer");
      if (!notificationResult.success) {
        console.warn('⚠️ Notification sending failed for sent offer:', notificationResult.error);
      }

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

    // Enhanced counter offer data
    const counterData = {
      counterBy,
      counterDate: new Date(),
      priority: req.body.priority || "medium"
    };

    // Only add fields that were provided
    if (counterAmount) counterData.counterAmount = counterAmount;
    if (notes) counterData.notes = notes;
    if (counterReviewDate) counterData.counterReviewDate = counterReviewDate;
    if (counterPostDate) counterData.counterPostDate = counterPostDate;
    if (deliverables) counterData.deliverables = deliverables;
    if (attachments) counterData.attachments = attachments;
    
    // Add expiration if specified
    if (req.body.expiresIn) {
      counterData.expiresAt = new Date(Date.now() + req.body.expiresIn * 24 * 60 * 60 * 1000);
    }

    offer.counters.push(counterData);

    // Mark as "Rejected-Countered" (or "Counter" if you prefer simpler naming)
    offer.status = "Rejected-Countered";
    await offer.save();

    const notificationResult = await sendOfferNotification(offer, "counter_offer");
    if (!notificationResult.success) {
      console.warn('⚠️ Notification sending failed for counter offer:', notificationResult.error);
    }

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

    const notificationResult = await sendOfferNotification(offer, "offer_rejected");
    if (!notificationResult.success) {
      console.warn('⚠️ Notification sending failed for rejected offer:', notificationResult.error);
    }

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
    const notificationResult = await sendOfferNotification(offer, "offer_cancelled");
    if (!notificationResult.success) {
      console.warn('⚠️ Notification sending failed for cancelled offer:', notificationResult.error);
    }
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

    const notificationResult = await sendOfferNotification(offer, "offer_in_review");
    if (!notificationResult.success) {
      console.warn('⚠️ Notification sending failed for offer in review:', notificationResult.error);
    }

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

// services/notificationService.js
const { sendPushNotification } = require('../utils/pushNotifications');
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

async function sendUnreadMessageNotification(user, message, chatDetails) {
  // Push Notification
  if (user.deviceToken) {
    await sendPushNotification(
      user.deviceToken,
      'Unread Message',
      `You have an unread message from ${message?.senderId?.name} \n ${message?.text}`,
      { chatId: message.chatId.toString(), type: 'unread_message' }
    );
  }


  // Email Notification
  const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>You have an unread message</title>
    <style>
      /* Reset styles for consistency */
      body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        background-color: #f5f6fa;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        padding: 20px 30px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
      }
      .logo {
        display: block;
        margin: 0 auto 20px auto;
        max-width: 120px;
        height: auto;
      }
      h2 {
        color: #2c3e50;
        margin-bottom: 10px;
        text-align: center;
      }
      p {
        font-size: 16px;
        line-height: 1.5;
        margin-bottom: 15px;
      }
      .message-text {
        font-style: italic;
        background-color: #f0f0f0;
        padding: 15px;
        border-radius: 3px;
        border-left: 4px solid #3498db;
      }
      .button {
        display: block;
        width: 200px;
        margin: 20px auto;
        padding: 12px 0;
        background-color: #3498db;
        color: #ffffff;
        text-align: center;
        text-decoration: none;
        border-radius: 3px;
        font-size: 16px;
      }
      .footer {
        margin-top: 30px;
        text-align: center;
        font-size: 14px;
        color: #999;
        border-top: 1px solid #eaeaea;
        padding-top: 15px;
      }
      /* Responsive for mobile devices */
      @media only screen and (max-width: 600px) {
        .container {
          width: 95%;
          padding: 15px 20px;
        }
        .button {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <img class="logo" src="${process.env.BACKEND_URL}/uploads/assets/icon.png" alt="Logo" />
      <h2>Unread Message</h2>
      <p>Hello ${user.name || "User"},</p>
      <p>You have an unread message from ${message.senderId.name}:</p>
      <p class="message-text">"${message.text}"</p>
      <a class="button" href="${process.env.FRONTEND_URL}/messages/">View Message</a>
      <div class="footer">
        <p>Thank you,<br/>The Axees Team</p>
      </div>
    </div>
  </body>
  </html>
  `;
  

  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@axees.com",
    to: user.email,
    subject: `Unread message from ${message.senderId.name}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendUnreadMessageNotification };
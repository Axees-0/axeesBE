const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const path = require('path');
const fs = require('fs');

/**
 * Email Helper Utility
 * Comprehensive email validation and notification system (Bug #2)
 * Provides enhanced email validation, template management, and notification sending
 */

// Email templates configuration
const EMAIL_TEMPLATES = {
  OFFER_SENT: {
    subject: 'New Offer from {{marketerName}} - {{offerName}}',
    template: 'offer-sent'
  },
  OFFER_ACCEPTED: {
    subject: 'Offer Accepted - {{offerName}}',
    template: 'offer-accepted'
  },
  OFFER_REJECTED: {
    subject: 'Offer Status Update - {{offerName}}',
    template: 'offer-rejected'
  },
  COUNTER_OFFER: {
    subject: 'Counter Offer Received - {{offerName}}',
    template: 'counter-offer'
  },
  DEAL_CREATED: {
    subject: 'Deal Created - {{dealName}}',
    template: 'deal-created'
  },
  MILESTONE_PAYMENT: {
    subject: 'Milestone Payment Released - {{dealName}}',
    template: 'milestone-payment'
  },
  PROOF_SUBMITTED: {
    subject: 'Proof Submitted - {{dealName}}',
    template: 'proof-submitted'
  },
  PROFILE_COMPLETION: {
    subject: 'Complete Your Profile to Send Offers',
    template: 'profile-completion'
  }
};

// Create email transporter with enhanced configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5
  });
};

// Enhanced email validation
const validateEmail = async (email) => {
  const validation = {
    isValid: false,
    errors: [],
    suggestions: [],
    score: 0
  };

  // Basic format validation
  if (!email || typeof email !== 'string') {
    validation.errors.push('Email is required');
    return validation;
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Format validation using built-in regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(trimmedEmail)) {
    validation.errors.push('Invalid email format');
    return validation;
  }

  // Length validation
  if (trimmedEmail.length > 254) {
    validation.errors.push('Email too long (max 254 characters)');
    return validation;
  }

  // Domain extraction
  const [localPart, domain] = trimmedEmail.split('@');
  
  // Local part validation
  if (localPart.length > 64) {
    validation.errors.push('Local part too long (max 64 characters)');
  }

  // Common typo detection and suggestions
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'aol.com', 'live.com', 'msn.com'
  ];
  
  const suggestions = getEmailSuggestions(domain, commonDomains);
  if (suggestions.length > 0) {
    validation.suggestions = suggestions.map(suggestion => 
      `${localPart}@${suggestion}`
    );
  }

  // DNS validation (optional, can be slow)
  try {
    await dns.resolveMx(domain);
    validation.score += 30; // Domain has MX record
  } catch (error) {
    validation.errors.push('Domain does not accept email');
    validation.score -= 20;
  }

  // Disposable email detection
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'temp-mail.org', 'throwaway.email'
  ];
  
  if (disposableDomains.includes(domain)) {
    validation.errors.push('Disposable email addresses are not allowed');
    validation.score -= 30;
  }

  // Role-based email detection
  const roleBasedPrefixes = [
    'admin', 'administrator', 'postmaster', 'webmaster', 
    'info', 'contact', 'support', 'sales', 'marketing'
  ];
  
  if (roleBasedPrefixes.includes(localPart)) {
    validation.errors.push('Role-based email addresses are not recommended');
    validation.score -= 10;
  }

  // Calculate final score and validity
  validation.score += 50; // Base score for valid format
  if (validation.errors.length === 0) {
    validation.score += 20; // Bonus for no errors
  }
  
  validation.isValid = validation.errors.length === 0;
  validation.score = Math.max(0, Math.min(100, validation.score));

  return validation;
};

// Email suggestion algorithm using Levenshtein distance
const getEmailSuggestions = (domain, commonDomains) => {
  const suggestions = [];
  const threshold = 2; // Maximum edit distance for suggestions

  for (const commonDomain of commonDomains) {
    const distance = levenshteinDistance(domain, commonDomain);
    if (distance <= threshold && distance > 0) {
      suggestions.push(commonDomain);
    }
  }

  return suggestions.slice(0, 3); // Return top 3 suggestions
};

// Levenshtein distance calculation
const levenshteinDistance = (str1, str2) => {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

// Get email template
const getEmailTemplate = (templateType, data = {}) => {
  const template = EMAIL_TEMPLATES[templateType];
  if (!template) {
    throw new Error(`Email template '${templateType}' not found`);
  }

  // Replace template variables
  let subject = template.subject;
  let htmlContent = getTemplateContent(template.template, data);

  // Replace variables in subject
  Object.keys(data).forEach(key => {
    subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
  });

  return {
    subject,
    html: htmlContent,
    text: htmlToText(htmlContent)
  };
};

// Get template content (placeholder - would load from files in production)
const getTemplateContent = (templateName, data) => {
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{subject}}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #430B92; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #430B92; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Axees</h1>
        </div>
        <div class="content">
          {{content}}
        </div>
        <div class="footer">
          <p>This email was sent by Axees. If you have any questions, please contact our support team.</p>
          <p>&copy; 2024 Axees. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Template-specific content
  const templateContent = {
    'offer-sent': `
      <h2>You have a new offer!</h2>
      <p>Hi {{recipientName}},</p>
      <p><strong>{{marketerName}}</strong> has sent you an offer for <strong>{{offerName}}</strong>.</p>
      <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Offer Details:</h3>
        <p><strong>Amount:</strong> ${{amount}}</p>
        <p><strong>Campaign:</strong> {{offerName}}</p>
        <p><strong>Platforms:</strong> {{platforms}}</p>
        <p><strong>Deadline:</strong> {{deadline}}</p>
      </div>
      <a href="{{viewOfferUrl}}" class="button">View Offer</a>
      <p>You can review, accept, or negotiate this offer in your dashboard.</p>
    `,
    'offer-accepted': `
      <h2>Congratulations! Your offer was accepted</h2>
      <p>Hi {{marketerName}},</p>
      <p><strong>{{creatorName}}</strong> has accepted your offer for <strong>{{offerName}}</strong>.</p>
      <p>A deal has been automatically created and payment has been escrowed.</p>
      <a href="{{viewDealUrl}}" class="button">View Deal</a>
    `,
    'counter-offer': `
      <h2>Counter offer received</h2>
      <p>Hi {{recipientName}},</p>
      <p><strong>{{senderName}}</strong> has submitted a counter offer for <strong>{{offerName}}</strong>.</p>
      <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Counter Offer Details:</h3>
        <p><strong>Proposed Amount:</strong> ${{counterAmount}}</p>
        <p><strong>Notes:</strong> {{notes}}</p>
      </div>
      <a href="{{viewOfferUrl}}" class="button">Review Counter Offer</a>
    `,
    'profile-completion': `
      <h2>Complete your profile to start sending offers</h2>
      <p>Hi {{userName}},</p>
      <p>Your profile is {{completionPercentage}}% complete. To send offers on Axees, you need to complete your profile.</p>
      <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Missing Information:</h3>
        <ul>{{missingFields}}</ul>
      </div>
      <a href="{{profileUrl}}" class="button">Complete Profile</a>
    `
  };

  let content = templateContent[templateName] || '<p>{{message}}</p>';
  
  // Replace variables in content
  Object.keys(data).forEach(key => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
  });

  return baseTemplate.replace('{{content}}', content);
};

// Convert HTML to plain text
const htmlToText = (html) => {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

// Send email with enhanced error handling and validation
const sendEmail = async (options) => {
  const result = {
    success: false,
    messageId: null,
    errors: [],
    validationResults: {}
  };

  try {
    // Validate recipient email
    if (options.to) {
      const validation = await validateEmail(options.to);
      result.validationResults.to = validation;
      
      if (!validation.isValid) {
        result.errors.push(`Invalid recipient email: ${validation.errors.join(', ')}`);
        return result;
      }
    } else {
      result.errors.push('Recipient email is required');
      return result;
    }

    // Validate sender email if provided
    if (options.from) {
      const validation = await validateEmail(options.from);
      result.validationResults.from = validation;
      
      if (!validation.isValid) {
        result.errors.push(`Invalid sender email: ${validation.errors.join(', ')}`);
      }
    }

    // Create transporter
    const transporter = createTransporter();

    // Verify SMTP connection
    await transporter.verify();

    // Prepare email options
    const mailOptions = {
      from: options.from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments || []
    };

    // Add CC and BCC if provided
    if (options.cc) mailOptions.cc = options.cc;
    if (options.bcc) mailOptions.bcc = options.bcc;

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    result.success = true;
    result.messageId = info.messageId;
    
    // Log successful email send
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });

  } catch (error) {
    result.errors.push(error.message);
    console.error('Email send error:', error);
  }

  return result;
};

// Send templated email
const sendTemplatedEmail = async (templateType, recipientEmail, data = {}) => {
  try {
    // Get template content
    const template = getEmailTemplate(templateType, data);
    
    // Send email
    const result = await sendEmail({
      to: recipientEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });

    return result;
  } catch (error) {
    return {
      success: false,
      errors: [error.message],
      validationResults: {}
    };
  }
};

// Batch email sending with rate limiting
const sendBatchEmails = async (emails, options = {}) => {
  const results = [];
  const batchSize = options.batchSize || 10;
  const delay = options.delay || 1000; // 1 second delay between batches

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    const batchPromises = batch.map(email => sendEmail(email));
    const batchResults = await Promise.allSettled(batchPromises);
    
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' ? result.value : { success: false, errors: [result.reason.message] }
    ));

    // Add delay between batches to respect rate limits
    if (i + batchSize < emails.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
};

module.exports = {
  validateEmail,
  sendEmail,
  sendTemplatedEmail,
  sendBatchEmails,
  getEmailTemplate,
  EMAIL_TEMPLATES
};
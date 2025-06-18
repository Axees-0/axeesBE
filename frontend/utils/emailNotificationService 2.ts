import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api/account';

// Enhanced email validation with more comprehensive checks
export const validateEmailFormat = (email: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!email || email.trim() === '') {
    errors.push('Email address is required');
    return { isValid: false, errors };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Check for spaces
  if (email.includes(' ')) {
    errors.push('Email cannot contain spaces');
  }

  // Check for @ symbol
  if (!email.includes('@')) {
    errors.push('Email must contain @ symbol');
  }

  // Check for domain
  const atIndex = email.lastIndexOf('@');
  const dotIndex = email.lastIndexOf('.');
  
  if (atIndex > 0 && dotIndex > atIndex + 1) {
    // Valid structure
    const domain = email.substring(atIndex + 1);
    const localPart = email.substring(0, atIndex);
    
    // Check local part
    if (localPart.length === 0) {
      errors.push('Email must have a username before @');
    } else if (localPart.length > 64) {
      errors.push('Email username is too long (max 64 characters)');
    }
    
    // Check domain part
    const domainParts = domain.split('.');
    if (domainParts.some(part => part.length === 0)) {
      errors.push('Invalid domain format');
    }
    
    // Check TLD
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      errors.push('Invalid top-level domain');
    }
  } else {
    errors.push('Email must have a valid domain (e.g., example.com)');
  }

  // Advanced pattern check
  const advancedEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!advancedEmailRegex.test(trimmedEmail)) {
    if (errors.length === 0) {
      errors.push('Invalid email format');
    }
  }

  // Check for common typos
  const commonTypos = [
    { pattern: /@gmial\./, suggestion: 'Did you mean @gmail.com?' },
    { pattern: /@yahooo\./, suggestion: 'Did you mean @yahoo.com?' },
    { pattern: /@hotmial\./, suggestion: 'Did you mean @hotmail.com?' },
    { pattern: /@outlok\./, suggestion: 'Did you mean @outlook.com?' },
  ];

  commonTypos.forEach(({ pattern, suggestion }) => {
    if (pattern.test(trimmedEmail)) {
      errors.push(suggestion);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Verify email exists in the system
export const verifyRecipientEmail = async (userId: string, userType: 'Creator' | 'Marketer'): Promise<{
  hasEmail: boolean;
  email?: string;
  isVerified?: boolean;
  notificationEnabled?: boolean;
}> => {
  try {
    const response = await axios.get(`${API_URL}/profile/${userId}`);
    const userData = response.data?.user;
    
    if (!userData) {
      return { hasEmail: false };
    }

    const email = userData.email;
    const notificationSettings = userData.settings?.notifications;
    
    return {
      hasEmail: !!email && validateEmailFormat(email).isValid,
      email: email,
      isVerified: userData.emailVerified || false,
      notificationEnabled: notificationSettings?.email !== false // Default to true if not set
    };
  } catch (error) {
    console.error('Error verifying recipient email:', error);
    return { hasEmail: false };
  }
};

// Pre-flight check for offer submission
export const preflightEmailCheck = async (
  creatorId: string,
  marketerId: string
): Promise<{
  canSend: boolean;
  issues: string[];
  recipientDetails: {
    creator: { hasEmail: boolean; email?: string; notificationEnabled?: boolean };
    marketer: { hasEmail: boolean; email?: string; notificationEnabled?: boolean };
  };
}> => {
  const issues: string[] = [];
  
  try {
    // Check both creator and marketer emails
    const [creatorCheck, marketerCheck] = await Promise.all([
      verifyRecipientEmail(creatorId, 'Creator'),
      verifyRecipientEmail(marketerId, 'Marketer')
    ]);

    // Validate creator email
    if (!creatorCheck.hasEmail) {
      issues.push('Creator does not have a valid email address on file');
    } else if (!creatorCheck.notificationEnabled) {
      issues.push('Creator has disabled email notifications');
    }

    // Validate marketer email
    if (!marketerCheck.hasEmail) {
      issues.push('Your account does not have a valid email address');
    } else if (!marketerCheck.notificationEnabled) {
      issues.push('You have disabled email notifications in your settings');
    }

    return {
      canSend: issues.length === 0,
      issues,
      recipientDetails: {
        creator: creatorCheck,
        marketer: marketerCheck
      }
    };
  } catch (error) {
    console.error('Preflight email check failed:', error);
    issues.push('Unable to verify email settings. Please try again.');
    
    return {
      canSend: false,
      issues,
      recipientDetails: {
        creator: { hasEmail: false },
        marketer: { hasEmail: false }
      }
    };
  }
};

// Format email notification data for backend
export const formatOfferNotificationData = (
  offer: any,
  recipientDetails: any
): {
  notificationData: {
    creatorEmail?: string;
    marketerEmail?: string;
    emailValidated: boolean;
    notificationPreferences: {
      creator: boolean;
      marketer: boolean;
    };
  };
} => {
  return {
    notificationData: {
      creatorEmail: recipientDetails.creator.email,
      marketerEmail: recipientDetails.marketer.email,
      emailValidated: true,
      notificationPreferences: {
        creator: recipientDetails.creator.notificationEnabled || false,
        marketer: recipientDetails.marketer.notificationEnabled || false
      }
    }
  };
};
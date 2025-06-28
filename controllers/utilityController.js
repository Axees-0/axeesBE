const crypto = require('crypto');

/**
 * Generate shareable link for profiles, deals, etc.
 * @route POST /api/share/generate-link
 */
exports.generateShareLink = async (req, res) => {
  try {
    const { type, resourceId, title, description } = req.body;
    const userId = req.user._id || req.user.id;

    if (!type || !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Type and resourceId are required'
      });
    }

    // Validate share type
    const validTypes = ['profile', 'deal', 'offer', 'portfolio', 'creator', 'marketer'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Generate unique share token
    const shareToken = crypto.randomBytes(16).toString('hex');
    
    // Create base URL (would be configured in environment)
    const baseUrl = process.env.FRONTEND_URL || 'https://axees.com';
    
    let shareUrl, shareTitle, shareDescription;

    // Generate URL and metadata based on type
    switch (type) {
      case 'profile':
        shareUrl = `${baseUrl}/profile/${resourceId}?share=${shareToken}`;
        shareTitle = title || 'Check out this profile on Axees';
        shareDescription = description || 'Discover amazing creators and marketers on Axees';
        break;
        
      case 'portfolio':
        shareUrl = `${baseUrl}/portfolio/${resourceId}?share=${shareToken}`;
        shareTitle = title || 'Check out this portfolio on Axees';
        shareDescription = description || 'View completed collaborations and projects';
        break;
        
      case 'deal':
        shareUrl = `${baseUrl}/deal/${resourceId}?share=${shareToken}`;
        shareTitle = title || 'Collaboration on Axees';
        shareDescription = description || 'See this amazing collaboration between creators and marketers';
        break;
        
      case 'offer':
        shareUrl = `${baseUrl}/offer/${resourceId}?share=${shareToken}`;
        shareTitle = title || 'New opportunity on Axees';
        shareDescription = description || 'Exciting collaboration opportunity for creators';
        break;
        
      case 'creator':
        shareUrl = `${baseUrl}/creator/${resourceId}?share=${shareToken}`;
        shareTitle = title || 'Featured Creator on Axees';
        shareDescription = description || 'Connect with this talented creator';
        break;
        
      case 'marketer':
        shareUrl = `${baseUrl}/marketer/${resourceId}?share=${shareToken}`;
        shareTitle = title || 'Brand Partner on Axees';
        shareDescription = description || 'Explore collaboration opportunities with this brand';
        break;
        
      default:
        shareUrl = `${baseUrl}/${type}/${resourceId}?share=${shareToken}`;
        shareTitle = title || 'Check this out on Axees';
        shareDescription = description || 'Discover amazing content on Axees';
    }

    // Track share creation (could be stored in database for analytics)
    const shareData = {
      shareToken,
      type,
      resourceId,
      sharedBy: userId,
      shareUrl,
      title: shareTitle,
      description: shareDescription,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
      clickCount: 0,
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      }
    };

    // Generate social media share URLs
    const socialShareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
      copy: shareUrl
    };

    res.status(201).json({
      success: true,
      message: 'Share link generated successfully',
      data: {
        shareUrl,
        shareToken,
        title: shareTitle,
        description: shareDescription,
        type,
        resourceId,
        expiresAt: shareData.expiresAt,
        socialUrls: socialShareUrls,
        qrCode: `${baseUrl}/api/share/qr/${shareToken}` // QR code endpoint (could be implemented)
      }
    });

  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate share link',
      error: error.message
    });
  }
};

/**
 * Get terms of service
 * @route GET /api/legal/terms
 */
exports.getTermsOfService = async (req, res) => {
  try {
    // In a real app, this would be stored in database or CMS
    const terms = {
      version: '1.0',
      lastUpdated: '2024-01-01',
      effectiveDate: '2024-01-01',
      content: {
        title: 'Terms of Service',
        sections: [
          {
            title: '1. Acceptance of Terms',
            content: 'By accessing and using Axees, you accept and agree to be bound by the terms and provision of this agreement.'
          },
          {
            title: '2. User Accounts',
            content: 'Users must provide accurate information when creating accounts. You are responsible for maintaining the confidentiality of your account credentials.'
          },
          {
            title: '3. Platform Usage',
            content: 'Axees is a platform connecting creators and marketers for collaboration opportunities. Users must comply with all applicable laws and regulations.'
          },
          {
            title: '4. Content Guidelines',
            content: 'All content shared on the platform must be original, appropriate, and comply with our community guidelines. Prohibited content includes but is not limited to illegal, harmful, or offensive material.'
          },
          {
            title: '5. Payment Terms',
            content: 'All financial transactions are processed securely. Platform fees apply to completed deals as outlined in our fee structure.'
          },
          {
            title: '6. Intellectual Property',
            content: 'Users retain ownership of their original content. By using Axees, you grant us a license to display your content on the platform.'
          },
          {
            title: '7. Privacy Policy',
            content: 'Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.'
          },
          {
            title: '8. Limitation of Liability',
            content: 'Axees is not liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.'
          },
          {
            title: '9. Termination',
            content: 'We reserve the right to terminate or suspend accounts that violate these terms or for any other reason at our discretion.'
          },
          {
            title: '10. Changes to Terms',
            content: 'We may update these terms from time to time. Continued use of the platform constitutes acceptance of any changes.'
          }
        ]
      }
    };

    res.status(200).json({
      success: true,
      data: terms
    });

  } catch (error) {
    console.error('Get terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms of service',
      error: error.message
    });
  }
};

/**
 * Accept terms of service
 * @route POST /api/legal/accept-terms
 */
exports.acceptTerms = async (req, res) => {
  try {
    const { version, acceptedAt } = req.body;
    const userId = req.user._id || req.user.id;

    if (!version) {
      return res.status(400).json({
        success: false,
        message: 'Terms version is required'
      });
    }

    const User = require('../models/User');
    
    // Update user record with terms acceptance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize settings if not exists
    if (!user.settings) {
      user.settings = {};
    }

    // Record terms acceptance
    user.settings.termsAccepted = {
      version,
      acceptedAt: acceptedAt ? new Date(acceptedAt) : new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    user.markModified('settings');
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Terms of service accepted successfully',
      data: {
        userId,
        termsAccepted: user.settings.termsAccepted
      }
    });

  } catch (error) {
    console.error('Accept terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept terms',
      error: error.message
    });
  }
};

/**
 * Generate shareable link
 * POST /api/share/generate-link
 */
const generateShareLink = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, resourceId, title, description } = req.body;

    // Validate required fields
    if (!type || !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Type and resourceId are required'
      });
    }

    // Generate share token
    const shareToken = require('crypto').randomBytes(32).toString('hex');
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/share/${shareToken}`;

    // Create share data
    const shareData = {
      shareUrl,
      shareToken,
      title: title || `Shared ${type}`,
      description: description || `Check out this ${type}`,
      type,
      resourceId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      socialUrls: {
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title || `Check out this ${type}`)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title || `Check out this ${type}`} ${shareUrl}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title || `Check out this ${type}`)}`,
        copy: shareUrl
      }
    };

    res.status(201).json({
      success: true,
      message: 'Share link generated successfully',
      data: shareData
    });

  } catch (error) {
    console.error('Generate share link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate share link',
      error: error.message
    });
  }
};

/**
 * Get terms of service
 * GET /api/legal/terms
 */
const getTermsOfService = async (req, res) => {
  try {
    const terms = {
      version: '1.0',
      lastUpdated: '2024-01-01',
      effectiveDate: '2024-01-01',
      content: {
        title: 'Terms of Service',
        sections: [
          {
            title: 'Acceptance of Terms',
            content: 'By using this service, you agree to these terms.'
          },
          {
            title: 'User Responsibilities',
            content: 'Users must follow all applicable laws and regulations.'
          }
        ]
      }
    };

    res.status(200).json({
      success: true,
      data: terms
    });

  } catch (error) {
    console.error('Get terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms of service',
      error: error.message
    });
  }
};

/**
 * Accept terms of service
 * POST /api/legal/accept-terms
 */
const acceptTerms = async (req, res) => {
  try {
    const userId = req.user._id;
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        message: 'Terms version is required'
      });
    }

    // Mock acceptance - in real implementation, save to database
    const acceptance = {
      userId,
      termsAccepted: {
        version,
        acceptedAt: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    };

    res.status(200).json({
      success: true,
      message: 'Terms accepted successfully',
      data: acceptance
    });

  } catch (error) {
    console.error('Accept terms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept terms',
      error: error.message
    });
  }
};

module.exports = {
  generateShareLink,
  getTermsOfService,
  acceptTerms
};
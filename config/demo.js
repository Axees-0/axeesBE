// Demo Mode Configuration
const demoConfig = {
  // Demo mode environment settings
  isDemoMode: process.env.DEMO_MODE === 'true' || process.env.NODE_ENV === 'demo',
  
  // Demo data configuration
  demoData: {
    users: {
      marketer: {
        phone: '+12125550100',
        email: 'demo.marketer@axees.demo',
        password: 'DemoPassword123!',
        name: 'Demo Marketer',
        userName: 'demo_marketer',
        companyName: 'Demo Marketing Co'
      },
      creator: {
        phone: '+12125550101',
        email: 'demo.creator@axees.demo',
        password: 'DemoPassword123!',
        name: 'Demo Creator',
        userName: 'demo_creator',
        platforms: ['Instagram', 'TikTok'],
        followers: 50000
      }
    },
    offers: {
      sampleCount: 5,
      amountRange: { min: 500, max: 5000 },
      platforms: ['Instagram', 'TikTok', 'YouTube'],
      deliverables: ['Post', 'Story', 'Reel', 'Video']
    },
    messages: {
      sampleCount: 20,
      templates: [
        'Hi! I\'m interested in your offer.',
        'Can we discuss the campaign details?',
        'I\'ve reviewed the requirements.',
        'When would you like to start?',
        'Great! Let\'s move forward.'
      ]
    }
  },
  
  // Demo mode restrictions
  restrictions: {
    maxUsers: 100,
    maxOffers: 1000,
    maxMessages: 10000,
    dataRetentionDays: 7,
    allowedOperations: [
      'read',
      'create',
      'update'
      // 'delete' is excluded for demo mode
    ]
  },
  
  // Demo mode features
  features: {
    autoCleanup: true,
    sandboxedDatabase: true,
    mockExternalServices: true,
    disableEmails: true,
    disableSMS: true,
    disablePayments: true,
    showDemoNotice: true
  }
};

// Demo mode middleware
const demoModeMiddleware = (req, res, next) => {
  if (demoConfig.isDemoMode) {
    req.isDemoMode = true;
    res.setHeader('X-Demo-Mode', 'true');
    
    // Prevent destructive operations in demo mode
    if (req.method === 'DELETE' && !demoConfig.restrictions.allowedOperations.includes('delete')) {
      return res.status(403).json({
        error: 'Delete operations are disabled in demo mode',
        isDemoMode: true
      });
    }
  }
  next();
};

// Demo data generator
const generateDemoData = {
  createDemoUser: (type = 'creator', index = 0) => {
    const baseData = demoConfig.demoData.users[type];
    return {
      ...baseData,
      phone: `+12125550${String(index).padStart(3, '1')}`,
      email: `demo.${type}${index}@axees.demo`,
      userName: `demo_${type}_${index}`,
      name: `Demo ${type.charAt(0).toUpperCase() + type.slice(1)} ${index}`
    };
  },
  
  createDemoOffer: (marketerId, creatorId, index = 0) => {
    const { amountRange, platforms, deliverables } = demoConfig.demoData.offers;
    const amount = Math.floor(Math.random() * (amountRange.max - amountRange.min) + amountRange.min);
    
    return {
      marketerId,
      creatorId,
      offerName: `Demo Campaign ${index + 1}`,
      proposedAmount: amount,
      currency: 'USD',
      platforms: [platforms[index % platforms.length]],
      deliverables: [deliverables[index % deliverables.length]],
      desiredReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      desiredPostDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      description: `This is a demo offer ${index + 1} for testing purposes`,
      status: ['Sent', 'InReview', 'Accepted'][index % 3]
    };
  },
  
  createDemoMessage: (senderId, receiverId, chatId, index = 0) => {
    const templates = demoConfig.demoData.messages.templates;
    return {
      chatId,
      senderId,
      receiverId,
      text: templates[index % templates.length],
      status: 'sent',
      isDemo: true
    };
  }
};

// Demo mode utilities
const demoUtils = {
  isDemoMode: () => demoConfig.isDemoMode,
  
  cleanupDemoData: async (models) => {
    if (!demoConfig.isDemoMode || !demoConfig.features.autoCleanup) {
      return { cleaned: false, reason: 'Not in demo mode or auto-cleanup disabled' };
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - demoConfig.restrictions.dataRetentionDays);
    
    const results = {};
    
    // Clean up old demo data
    if (models.User) {
      results.users = await models.User.deleteMany({
        isDemo: true,
        createdAt: { $lt: cutoffDate }
      });
    }
    
    if (models.Offer) {
      results.offers = await models.Offer.deleteMany({
        isDemo: true,
        createdAt: { $lt: cutoffDate }
      });
    }
    
    if (models.Message) {
      results.messages = await models.Message.deleteMany({
        isDemo: true,
        createdAt: { $lt: cutoffDate }
      });
    }
    
    return { cleaned: true, results, cutoffDate };
  },
  
  validateDemoEnvironment: () => {
    const validations = {
      mode: demoConfig.isDemoMode,
      database: demoConfig.features.sandboxedDatabase,
      externalServices: demoConfig.features.mockExternalServices,
      communications: !demoConfig.features.disableEmails && !demoConfig.features.disableSMS,
      payments: !demoConfig.features.disablePayments
    };
    
    const isValid = validations.mode && 
                   validations.database && 
                   validations.externalServices && 
                   !validations.communications && 
                   !validations.payments;
    
    return {
      isValid,
      validations,
      errors: Object.entries(validations)
        .filter(([key, value]) => {
          if (key === 'mode' || key === 'database' || key === 'externalServices') return !value;
          if (key === 'communications' || key === 'payments') return value;
          return false;
        })
        .map(([key]) => `${key} validation failed`)
    };
  }
};

module.exports = {
  demoConfig,
  demoModeMiddleware,
  generateDemoData,
  demoUtils
};
/**
 * Demo Data - Perfect data for investor presentations
 * All numbers carefully chosen to be impressive but believable
 */

export const DemoData = {
  // Marketer Profile
  marketerProfile: {
    _id: 'demo-marketer-001',
    fullName: 'Sarah Martinez',
    email: 'sarah@techstyle.com',
    company: 'TechStyle Brand',
    balance: 45600,
    totalSpent: 127500,
    activeDeals: 12,
    completedDeals: 47,
    avgDealValue: 2710,
    successRate: 89,
    joinedDate: new Date('2023-01-15'),
    verified: true,
    tier: 'Premium',
  },

  // Creator Profile
  creatorProfile: {
    _id: 'demo-creator-001',
    fullName: 'Alex Chen',
    username: '@alexcreates',
    email: 'alex@creator.com',
    totalEarnings: 45600,
    pendingEarnings: 3200,
    completedDeals: 47,
    activeDeals: 3,
    avgDealValue: 970,
    rating: 4.9,
    responseTime: '2 hours',
    platforms: [
      { platform: 'instagram', followers: 125000, engagement: 8.7 },
      { platform: 'tiktok', followers: 89000, engagement: 12.3 },
      { platform: 'youtube', followers: 45000, engagement: 6.2 },
    ],
  },

  // Offers for Demo
  offers: [
    {
      _id: 'offer-001',
      offerName: 'Summer Collection Launch 2024',
      description: 'Showcase our vibrant summer collection with authentic lifestyle content. Looking for creators who embody confidence and style.',
      proposedAmount: 5000,
      desiredReviewDate: new Date('2024-07-10'),
      desiredPostDate: new Date('2024-07-15'),
      deliverables: ['instagram', 'tiktok'],
      status: 'Active',
      applicants: 23,
      views: 156,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      tags: ['Fashion', 'Lifestyle', 'Summer'],
      requirements: [
        '50K+ followers on Instagram',
        'High engagement rate (>5%)',
        'Fashion/lifestyle content focus',
        'Professional photography skills',
      ],
    },
    {
      _id: 'offer-002',
      offerName: 'Tech Product Review Campaign',
      description: 'Create in-depth reviews for our latest smart home devices. Perfect for tech enthusiasts who love exploring innovation.',
      proposedAmount: 3500,
      desiredReviewDate: new Date('2024-07-20'),
      desiredPostDate: new Date('2024-07-25'),
      deliverables: ['youtube', 'instagram'],
      status: 'Active',
      applicants: 18,
      views: 127,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      tags: ['Technology', 'Reviews', 'Smart Home'],
      requirements: [
        '25K+ YouTube subscribers',
        'Tech content expertise',
        'Video production quality',
        'Detailed review skills',
      ],
    },
    {
      _id: 'offer-003',
      offerName: 'Wellness Journey Partnership',
      description: 'Join our 30-day wellness challenge and document your journey with our fitness products and nutrition plans.',
      proposedAmount: 4200,
      desiredReviewDate: new Date('2024-08-01'),
      desiredPostDate: new Date('2024-08-05'),
      deliverables: ['instagram', 'tiktok', 'youtube'],
      status: 'Active',
      applicants: 31,
      views: 203,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      tags: ['Fitness', 'Wellness', 'Health'],
      requirements: [
        '40K+ combined followers',
        'Health & fitness focus',
        '30-day commitment',
        'Authentic storytelling',
      ],
    },
  ],

  // High-Quality Creator Profiles
  creators: [
    {
      _id: 'creator-002',
      fullName: 'Emma Thompson',
      username: '@emmastyle',
      avatar: '👩‍🦰',
      bio: 'Fashion & Lifestyle Creator | Sustainable Fashion Advocate',
      location: 'Los Angeles, CA',
      rating: 4.9,
      completedDeals: 34,
      responseTime: '1 hour',
      platforms: [
        { platform: 'instagram', handle: '@emmastyle', followers: 156000, engagement: 8.9, verified: true },
        { platform: 'tiktok', handle: '@emmastyle', followers: 98000, engagement: 11.2 },
      ],
      categories: ['Fashion', 'Lifestyle', 'Sustainability'],
      portfolioHighlights: ['Vogue Feature', 'NYFW 2023', 'EcoStyle Award'],
    },
    {
      _id: 'creator-003',
      fullName: 'Marcus Johnson',
      username: '@techmarc',
      avatar: '👨‍💻',
      bio: 'Tech Reviewer | Smart Home Enthusiast | Future Tech Explorer',
      location: 'San Francisco, CA',
      rating: 4.8,
      completedDeals: 28,
      responseTime: '3 hours',
      platforms: [
        { platform: 'youtube', handle: '@TechMarcReviews', followers: 234000, engagement: 7.2, verified: true },
        { platform: 'twitter', handle: '@techmarc', followers: 45000, engagement: 5.8 },
      ],
      categories: ['Technology', 'Reviews', 'Tutorials'],
      portfolioHighlights: ['CES Speaker 2023', 'Top Tech Influencer', '1M+ Monthly Views'],
    },
    {
      _id: 'creator-004',
      fullName: 'Sofia Rodriguez',
      username: '@sofiafit',
      avatar: '🏃‍♀️',
      bio: 'Certified Personal Trainer | Nutrition Coach | Wellness Advocate',
      location: 'Miami, FL',
      rating: 5.0,
      completedDeals: 41,
      responseTime: '30 minutes',
      platforms: [
        { platform: 'instagram', handle: '@sofiafit', followers: 189000, engagement: 9.8, verified: true },
        { platform: 'youtube', handle: '@SofiaFitness', followers: 78000, engagement: 8.1 },
      ],
      categories: ['Fitness', 'Health', 'Nutrition'],
      portfolioHighlights: ['Nike Partnership', 'Fitness App Launch', 'TEDx Speaker'],
    },
  ],

  // Analytics Data
  analytics: {
    overview: {
      totalRevenue: 485600,
      monthlyGrowth: 23.5,
      activeUsers: 3420,
      completedDeals: 892,
    },
    recentActivity: [
      { type: 'deal_completed', amount: 3500, time: '2 hours ago', creator: 'Emma Thompson' },
      { type: 'payment_sent', amount: 2800, time: '5 hours ago', creator: 'Marcus Johnson' },
      { type: 'offer_accepted', amount: 4200, time: '1 day ago', creator: 'Sofia Rodriguez' },
      { type: 'milestone_completed', amount: 1500, time: '2 days ago', creator: 'Alex Chen' },
    ],
    performanceMetrics: {
      avgDealCompletion: 8.5, // days
      creatorSatisfaction: 4.8,
      brandRetention: 92,
      platformGrowth: 156, // percentage YoY
    },
  },

  // Demo Notifications
  notifications: [
    {
      id: 'notif-001',
      type: 'application',
      message: 'Emma Thompson applied to your Summer Collection offer',
      time: '2 minutes ago',
      unread: true,
    },
    {
      id: 'notif-002',
      type: 'milestone',
      message: 'Marcus Johnson completed the product review',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: 'notif-003',
      type: 'payment',
      message: 'Payment of $3,500 processed successfully',
      time: '3 hours ago',
      unread: false,
    },
  ],

  // Success Messages
  successMessages: {
    offerCreated: 'Offer published! 23 creators viewing now',
    applicationAccepted: 'Great choice! Emma Thompson is perfect for this campaign',
    paymentProcessed: 'Payment successful! Campaign is now live',
    dealCompleted: 'Congratulations! Another successful collaboration',
  },
};
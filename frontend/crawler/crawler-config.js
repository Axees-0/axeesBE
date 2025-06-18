/**
 * Crawler Configuration - Defines all pages and their expected interactions
 */

module.exports = {
  baseUrl: 'http://localhost:8081',
  
  // Wait times for different scenarios
  timing: {
    pageLoad: 8000,      // Wait for React hydration (increased for heavy pages)
    navigation: 3000,    // Wait after navigation (increased for complex pages)
    interaction: 1000,   // Wait after click/press
    apiCall: 3000        // Wait for demo data to load
  },
  
  // Pages to crawl and their expected behaviors
  pages: [
    {
      name: 'Explore',
      path: '/',
      expectedContent: [
        'Explore Creators & Influencers',
        'Emma Thompson',
        'Marcus Johnson', 
        'Sofia Rodriguez'
      ],
      interactions: [
        {
          type: 'click',
          selector: '[role="tablist"] > div:nth-child(2)',
          description: 'Click Deals tab',
          expectedResult: 'Navigation to deals page'
        },
      ]
    },
    {
      name: 'Deals', 
      path: '/deals',
      expectedContent: [
        'Deals & Analytics',
        'Summer Collection Launch 2024',
        'TechStyle Brand',
        'Analytics'
      ],
      interactions: [
        {
          type: 'click',
          selector: '[role="tablist"] > div:nth-child(3)',
          description: 'Navigate to Messages',
          expectedResult: 'Messages page loads'
        }
      ]
    },
    {
      name: 'Messages',
      path: '/messages', 
      expectedContent: [
        'Messages',
        'TechStyle Brand',
        'Emma Thompson',
        'summer collection'
      ],
      interactions: [
        {
          type: 'click',
          selector: '[role="tablist"] > div:nth-child(4)',
          description: 'Navigate to Notifications',
          expectedResult: 'Notifications page loads'
        }
      ]
    },
    {
      name: 'Notifications',
      path: '/notifications',
      expectedContent: [
        'Notifications',
        'Emma Thompson applied',
        'Marcus Johnson completed'
      ],
      interactions: [
        {
          type: 'click', 
          selector: '[role="tablist"] > div:nth-child(5)',
          description: 'Navigate to Profile',
          expectedResult: 'Profile page loads'
        }
      ]
    },
    {
      name: 'Profile',
      path: '/profile',
      expectedContent: [
        'Profile',
        'Sarah Martinez',
        '45,600',
        '89%'
      ],
      interactions: [
        {
          type: 'click',
          selector: '[role="tablist"] > div:nth-child(1)',
          description: 'Navigate back to Explore',
          expectedResult: 'Explore page loads'
        }
      ]
    }
  ],
  
  // Global validation rules
  validation: {
    // These should NEVER appear 
    forbiddenContent: [
      'Please standby while our system finds Influencers',
      'Error',
      'undefined',
      'null',
      '404',
      'Network Error'
    ],
    
    // Performance requirements
    performance: {
      maxLoadTime: 5000,    // 5 seconds max
      maxInteractionTime: 2000  // 2 seconds max response
    },
    
    // Required DOM elements
    requiredElements: [
      '#root',                    // React root
      '[role="tablist"]',        // Tab navigation
      '[role="tab"]'             // Individual tabs
    ]
  }
};
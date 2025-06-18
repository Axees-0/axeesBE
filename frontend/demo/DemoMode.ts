/**
 * Demo Mode Configuration
 * Controls all demo-specific behavior for investor presentations
 */

export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

export const DemoConfig = {
  // Authentication
  autoLogin: true,
  autoLoginAs: process.env.EXPO_PUBLIC_AUTO_LOGIN_USER || 'marketer',
  skipAuthChecks: true,
  
  // UI Behavior
  skipFileUploads: true,
  instantPayments: true,
  perfectData: true,
  noErrors: true,
  fastTransitions: true,
  
  // Timing - Optimized for 30-60 second demo flows
  mockDelay: 500, // 0.5 seconds for "loading" states
  uploadDelay: 800, // 0.8 seconds for fake uploads
  paymentDelay: 600, // 0.6 seconds for payment "processing"
  transitionDelay: 200, // 0.2 seconds for UI transitions
  chartDelay: 400, // 0.4 seconds for chart animations
  
  // Data Settings
  defaultMarketerBalance: 45600,
  defaultCreatorEarnings: 12450,
  successRate: 89,
  engagementRate: 8.7,
  followerCount: 156000,
  
  // Feature Flags
  showRealData: false,
  enableAnalytics: false,
  allowErrorStates: false,
  requirePayment: false,
  requireFileUpload: false,
};

// Demo-only console logging (helps during presentations)
export const demoLog = (...args: any[]) => {
  if (DEMO_MODE && process.env.NODE_ENV === 'development') {
    console.log('🎬 [DEMO]', ...args);
  }
};

// Helper to bypass any async operation in demo mode
export const demoBypass = async <T>(
  realOperation: () => Promise<T>,
  demoResponse: T,
  delay: number = DemoConfig.mockDelay
): Promise<T> => {
  if (!DEMO_MODE) {
    return realOperation();
  }
  
  demoLog('Bypassing operation with demo response');
  
  // Add artificial delay to make it feel real
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return demoResponse;
};

// Demo user profiles
export const DemoUsers = {
  marketer: {
    _id: 'demo-marketer-001',
    email: 'sarah@techstyle.com',
    fullName: 'Sarah Martinez',
    userType: 'Marketer',
    company: 'TechStyle Brand',
    verified: true,
  },
  creator: {
    _id: 'demo-creator-001',
    email: 'alex@creator.com',
    fullName: 'Alex Chen',
    userType: 'Creator',
    username: '@alexcreates',
    verified: true,
  },
};
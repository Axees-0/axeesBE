/**
 * Demo API - Fake API responses for investor demo
 * Always returns success with perfect data
 */

import { DemoData } from './DemoData';
import { DemoConfig, demoLog } from './DemoMode';

// Simulate network delay
const delay = (ms: number = DemoConfig.mockDelay) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const DemoAPI = {
  // Authentication
  auth: {
    async login(email: string, password: string) {
      demoLog('Demo login:', email);
      await delay(1000);
      
      return {
        success: true,
        user: DemoData.marketerProfile,
        token: 'demo-token-12345',
      };
    },

    async getCurrentUser() {
      await delay(500);
      return {
        success: true,
        user: DemoData.marketerProfile,
      };
    },

    async logout() {
      await delay(500);
      return { success: true };
    },
  },

  // Marketer APIs
  marketer: {
    async getOffers() {
      await delay(800);
      return {
        success: true,
        offers: DemoData.offers,
        total: DemoData.offers.length,
      };
    },

    async createOffer(offerData: any) {
      demoLog('Creating offer:', offerData);
      await delay(1500);
      
      // Add the new offer to the list
      const newOffer = {
        _id: `offer-${Date.now()}`,
        ...offerData,
        status: 'Active',
        applicants: 0,
        views: 0,
        createdAt: new Date(),
      };
      
      return {
        success: true,
        offer: newOffer,
        message: DemoData.successMessages.offerCreated,
      };
    },

    async getOfferDetails(offerId: string) {
      await delay(600);
      const offer = DemoData.offers.find(o => o._id === offerId) || DemoData.offers[0];
      
      return {
        success: true,
        offer: {
          ...offer,
          applicants: DemoData.creators.slice(0, 3), // Show first 3 creators as applicants
        },
      };
    },

    async acceptApplication(offerId: string, creatorId: string) {
      demoLog('Accepting application:', { offerId, creatorId });
      await delay(1200);
      
      return {
        success: true,
        message: DemoData.successMessages.applicationAccepted,
        deal: {
          _id: `deal-${Date.now()}`,
          offerId,
          creatorId,
          status: 'Active',
          startDate: new Date(),
        },
      };
    },

    async processPayment(amount: number) {
      demoLog('Processing payment:', amount);
      await delay(DemoConfig.paymentDelay);
      
      return {
        success: true,
        message: DemoData.successMessages.paymentProcessed,
        transactionId: `txn-${Date.now()}`,
        amount,
      };
    },
  },

  // Creator APIs  
  creator: {
    async getDeals() {
      await delay(800);
      return {
        success: true,
        deals: DemoData.offers.map(offer => ({
          ...offer,
          brandName: 'TechStyle Brand',
          brandVerified: true,
        })),
      };
    },

    async applyToDeal(dealId: string) {
      demoLog('Applying to deal:', dealId);
      await delay(1000);
      
      return {
        success: true,
        message: 'Application submitted successfully!',
        application: {
          _id: `app-${Date.now()}`,
          dealId,
          status: 'Pending',
          appliedAt: new Date(),
        },
      };
    },

    async getEarnings() {
      await delay(600);
      return {
        success: true,
        totalEarnings: DemoData.creatorProfile.totalEarnings,
        pendingEarnings: DemoData.creatorProfile.pendingEarnings,
        completedDeals: DemoData.creatorProfile.completedDeals,
      };
    },
  },

  // Analytics APIs
  analytics: {
    async getOverview() {
      await delay(700);
      return {
        success: true,
        data: DemoData.analytics.overview,
      };
    },

    async getRecentActivity() {
      await delay(500);
      return {
        success: true,
        activities: DemoData.analytics.recentActivity,
      };
    },

    async getPerformanceMetrics() {
      await delay(600);
      return {
        success: true,
        metrics: DemoData.analytics.performanceMetrics,
      };
    },

    async getGrowthChart() {
      await delay(800);
      // Generate fake growth data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const data = months.map((month, index) => ({
        month,
        revenue: 35000 + (index * 8500) + Math.random() * 5000,
        deals: 120 + (index * 25) + Math.floor(Math.random() * 10),
      }));
      
      return {
        success: true,
        chart: data,
      };
    },
  },

  // File Upload (fake)
  upload: {
    async uploadFile(file: any, onProgress?: (progress: number) => void) {
      demoLog('Fake uploading file:', file.name);
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        await delay(400);
        if (onProgress) {
          onProgress(i);
        }
      }
      
      return {
        success: true,
        fileUrl: `https://demo.axees.com/files/${Date.now()}-${file.name}`,
        fileName: file.name,
      };
    },
  },

  // Notifications
  notifications: {
    async getNotifications() {
      await delay(500);
      return {
        success: true,
        notifications: DemoData.notifications,
        unreadCount: DemoData.notifications.filter(n => n.unread).length,
      };
    },

    async markAsRead(notificationId: string) {
      await delay(300);
      return { success: true };
    },
  },

  // Search
  search: {
    async searchCreators(query: string) {
      demoLog('Searching creators:', query);
      await delay(800);
      
      // Return filtered creators based on query
      const results = query 
        ? DemoData.creators.filter(c => 
            c.fullName.toLowerCase().includes(query.toLowerCase()) ||
            c.username.toLowerCase().includes(query.toLowerCase())
          )
        : DemoData.creators;
      
      return {
        success: true,
        creators: results,
        total: results.length,
      };
    },
  },
};

// Export a function to replace real API calls
export const getDemoAPI = (apiPath: string) => {
  const parts = apiPath.split('.');
  let api: any = DemoAPI;
  
  for (const part of parts) {
    api = api[part];
    if (!api) {
      demoLog(`Warning: Demo API not found for ${apiPath}`);
      return async () => ({ success: true, data: {} });
    }
  }
  
  return api;
};
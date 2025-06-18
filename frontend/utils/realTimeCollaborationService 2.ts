import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api/marketer/offers';

export interface EditingSession {
  userId: string;
  name: string;
  role: 'marketer' | 'creator';
  lastActivity: string;
  editingFields: string[];
}

export interface EditHistoryEntry {
  timestamp: string;
  userId: string;
  userRole: 'marketer' | 'creator';
  userName: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  version: number;
}

export interface OfferUpdateData {
  updates: Record<string, any>;
  sessionId?: string;
  expectedVersion?: number;
}

export interface CollaborationState {
  activeEditors: EditingSession[];
  isCurrentlyEditing: boolean;
  editHistory: EditHistoryEntry[];
  currentVersion: number;
  hasConflict: boolean;
}

// Real-time collaboration service
export class OfferCollaborationService {
  private offerId: string;
  private userId: string;
  private sessionId: string;
  private pollInterval: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(offerId: string, userId: string) {
    this.offerId = offerId;
    this.userId = userId;
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${this.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start editing session
  async startEditingSession(): Promise<void> {
    try {
      // Mark user as actively editing
      await this.updateOffer({
        updates: {},
        sessionId: this.sessionId
      });

      // Start polling for other editors
      this.startPolling();
    } catch (error) {
      console.error('Failed to start editing session:', error);
      throw error;
    }
  }

  // End editing session
  async endEditingSession(): Promise<void> {
    try {
      await axios.post(`${API_URL}/${this.offerId}/end-editing-session`, {
        userId: this.userId
      });

      this.stopPolling();
    } catch (error) {
      console.error('Failed to end editing session:', error);
    }
  }

  // Update offer with collaboration data
  async updateOffer(data: OfferUpdateData): Promise<{
    success: boolean;
    offer?: any;
    version?: number;
    rejectedFields?: Array<{ field: string; reason: string }>;
    hasConflict?: boolean;
  }> {
    try {
      const response = await axios.put(`${API_URL}/${this.offerId}`, {
        ...data,
        userId: this.userId
      });

      return {
        success: true,
        offer: response.data.offer,
        version: response.data.version,
        rejectedFields: response.data.rejectedFields,
        hasConflict: false
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Version conflict
        return {
          success: false,
          hasConflict: true,
          version: error.response.data.currentVersion
        };
      }
      throw error;
    }
  }

  // Get active editors
  async getActiveEditors(): Promise<EditingSession[]> {
    try {
      const response = await axios.get(`${API_URL}/${this.offerId}/active-editors`, {
        params: { userId: this.userId }
      });

      return response.data.activeEditors;
    } catch (error) {
      console.error('Failed to get active editors:', error);
      return [];
    }
  }

  // Get edit history
  async getEditHistory(limit = 20, offset = 0): Promise<{
    editHistory: EditHistoryEntry[];
    currentVersion: number;
    hasMore: boolean;
  }> {
    try {
      const response = await axios.get(`${API_URL}/${this.offerId}/edit-history`, {
        params: { userId: this.userId, limit, offset }
      });

      return {
        editHistory: response.data.editHistory,
        currentVersion: response.data.currentVersion,
        hasMore: response.data.pagination.hasMore
      };
    } catch (error) {
      console.error('Failed to get edit history:', error);
      return {
        editHistory: [],
        currentVersion: 0,
        hasMore: false
      };
    }
  }

  // Start polling for real-time updates
  private startPolling(): void {
    if (this.isPolling) return;

    this.isPolling = true;
    this.pollInterval = setInterval(async () => {
      try {
        // This would normally use WebSockets, but we'll use polling for now
        await this.getActiveEditors();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  // Stop polling
  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
  }

  // Cleanup when component unmounts
  cleanup(): void {
    this.endEditingSession();
    this.stopPolling();
  }
}

// React hook for offer collaboration
export const useOfferCollaboration = (offerId: string, userId: string) => {
  const [collaborationState, setCollaborationState] = useState<CollaborationState>({
    activeEditors: [],
    isCurrentlyEditing: false,
    editHistory: [],
    currentVersion: 0,
    hasConflict: false
  });

  const serviceRef = useRef<OfferCollaborationService | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize service
  useEffect(() => {
    if (!offerId || !userId) return;

    serviceRef.current = new OfferCollaborationService(offerId, userId);
    
    const startSession = async () => {
      setIsLoading(true);
      try {
        await serviceRef.current?.startEditingSession();
        await loadCollaborationData();
      } catch (error) {
        console.error('Failed to start collaboration session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    startSession();

    // Cleanup on unmount
    return () => {
      serviceRef.current?.cleanup();
    };
  }, [offerId, userId]);

  // Load collaboration data
  const loadCollaborationData = async () => {
    if (!serviceRef.current) return;

    try {
      const [editorsData, historyData] = await Promise.all([
        serviceRef.current.getActiveEditors(),
        serviceRef.current.getEditHistory(10, 0)
      ]);

      setCollaborationState(prev => ({
        ...prev,
        activeEditors: editorsData,
        editHistory: historyData.editHistory,
        currentVersion: historyData.currentVersion,
        isCurrentlyEditing: editorsData.some(editor => editor.userId === userId)
      }));
    } catch (error) {
      console.error('Failed to load collaboration data:', error);
    }
  };

  // Update offer with optimistic updates
  const updateOffer = async (updates: Record<string, any>): Promise<{
    success: boolean;
    hasConflict?: boolean;
  }> => {
    if (!serviceRef.current) return { success: false };

    try {
      const result = await serviceRef.current.updateOffer({
        updates,
        expectedVersion: collaborationState.currentVersion
      });

      if (result.hasConflict) {
        setCollaborationState(prev => ({
          ...prev,
          hasConflict: true
        }));
        
        // Reload data to get latest version
        await loadCollaborationData();
        
        return { success: false, hasConflict: true };
      }

      if (result.success) {
        setCollaborationState(prev => ({
          ...prev,
          currentVersion: result.version || prev.currentVersion,
          hasConflict: false
        }));

        // Refresh collaboration data
        await loadCollaborationData();
      }

      return { success: result.success };
    } catch (error) {
      console.error('Failed to update offer:', error);
      return { success: false };
    }
  };

  // Refresh collaboration data
  const refreshCollaboration = async () => {
    await loadCollaborationData();
  };

  // Resolve conflict by accepting latest version
  const resolveConflict = async () => {
    setCollaborationState(prev => ({
      ...prev,
      hasConflict: false
    }));
    await loadCollaborationData();
  };

  return {
    collaborationState,
    updateOffer,
    refreshCollaboration,
    resolveConflict,
    isLoading
  };
};
import React from 'react';
import axios from 'axios';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { DocumentFile, DocumentSubmissionService } from './documentSubmissionService';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export interface ProofMetadata {
  title?: string;
  description?: string;
  contentType: 'post_content' | 'story_content' | 'reel_content' | 'video_content' | 'campaign_material' | 'other';
  platform?: string;
  scheduledDate?: Date;
  tags?: string[];
  mentions?: string[];
  hashtags?: string[];
  location?: string;
  targetAudience?: string;
  campaignGoals?: string[];
  socialMediaLinks?: Array<{
    platform: string;
    url: string;
    status: 'draft' | 'scheduled' | 'published';
  }>;
}

export interface ProofTemplate {
  id: string;
  name: string;
  description: string;
  contentType: string;
  requiredFields: string[];
  recommendedSpecs: {
    imageFormats?: string[];
    videoFormats?: string[];
    maxFileSize?: number;
    dimensions?: Array<{
      width: number;
      height: number;
      label: string;
    }>;
    duration?: {
      min: number;
      max: number;
    };
  };
}

export interface ProofSubmission {
  id: string;
  dealId: string;
  milestoneId?: string;
  userId: string;
  files: DocumentFile[];
  metadata: ProofMetadata;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';
  submittedAt?: Date;
  reviewedAt?: Date;
  feedback?: string;
  revisionCount: number;
  template?: ProofTemplate;
}

export interface ProofReview {
  id: string;
  proofId: string;
  reviewerId: string;
  rating: number; // 1-5 stars
  feedback: string;
  approvalStatus: 'approved' | 'rejected' | 'revision_requested';
  reviewedAt: Date;
  suggestedChanges?: Array<{
    field: string;
    suggestion: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface ProofAnalytics {
  totalSubmissions: number;
  approvalRate: number;
  averageReviewTime: number; // in hours
  revisionRate: number;
  topIssues: Array<{
    issue: string;
    frequency: number;
  }>;
  performanceByContentType: Array<{
    contentType: string;
    approvalRate: number;
    averageRating: number;
  }>;
}

// Enhanced Proof Submission Service
export class ProofSubmissionService {
  private static instance: ProofSubmissionService;
  private documentService: DocumentSubmissionService;
  private templates: ProofTemplate[] = [];
  private cachedSubmissions: ProofSubmission[] = [];

  static getInstance(): ProofSubmissionService {
    if (!ProofSubmissionService.instance) {
      ProofSubmissionService.instance = new ProofSubmissionService();
    }
    return ProofSubmissionService.instance;
  }

  constructor() {
    this.documentService = DocumentSubmissionService.getInstance();
    this.loadTemplates();
  }

  // Load proof templates
  private async loadTemplates(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('proofTemplates');
      if (cached) {
        this.templates = JSON.parse(cached);
      } else {
        // Default templates
        this.templates = this.getDefaultTemplates();
        await AsyncStorage.setItem('proofTemplates', JSON.stringify(this.templates));
      }
    } catch (error) {
      console.error('Failed to load proof templates:', error);
      this.templates = this.getDefaultTemplates();
    }
  }

  // Get default proof templates
  private getDefaultTemplates(): ProofTemplate[] {
    return [
      {
        id: 'instagram_post',
        name: 'Instagram Post',
        description: 'Standard Instagram feed post with image or carousel',
        contentType: 'post_content',
        requiredFields: ['title', 'description', 'hashtags'],
        recommendedSpecs: {
          imageFormats: ['image/jpeg', 'image/png'],
          maxFileSize: 30 * 1024 * 1024, // 30MB
          dimensions: [
            { width: 1080, height: 1080, label: 'Square (1:1)' },
            { width: 1080, height: 1350, label: 'Portrait (4:5)' },
            { width: 1080, height: 566, label: 'Landscape (1.91:1)' }
          ]
        }
      },
      {
        id: 'instagram_story',
        name: 'Instagram Story',
        description: 'Instagram story content (24-hour)',
        contentType: 'story_content',
        requiredFields: ['description'],
        recommendedSpecs: {
          imageFormats: ['image/jpeg', 'image/png'],
          videoFormats: ['video/mp4', 'video/quicktime'],
          maxFileSize: 30 * 1024 * 1024,
          dimensions: [
            { width: 1080, height: 1920, label: 'Story (9:16)' }
          ],
          duration: { min: 1, max: 15 }
        }
      },
      {
        id: 'instagram_reel',
        name: 'Instagram Reel',
        description: 'Instagram Reel vertical video content',
        contentType: 'reel_content',
        requiredFields: ['title', 'description', 'hashtags'],
        recommendedSpecs: {
          videoFormats: ['video/mp4'],
          maxFileSize: 100 * 1024 * 1024, // 100MB
          dimensions: [
            { width: 1080, height: 1920, label: 'Reel (9:16)' }
          ],
          duration: { min: 15, max: 90 }
        }
      },
      {
        id: 'youtube_video',
        name: 'YouTube Video',
        description: 'YouTube video content with thumbnail',
        contentType: 'video_content',
        requiredFields: ['title', 'description', 'tags'],
        recommendedSpecs: {
          videoFormats: ['video/mp4', 'video/webm'],
          imageFormats: ['image/jpeg', 'image/png'], // For thumbnails
          maxFileSize: 500 * 1024 * 1024, // 500MB
          dimensions: [
            { width: 1920, height: 1080, label: 'HD (16:9)' },
            { width: 1280, height: 720, label: 'SD (16:9)' }
          ]
        }
      },
      {
        id: 'tiktok_video',
        name: 'TikTok Video',
        description: 'TikTok short-form video content',
        contentType: 'video_content',
        requiredFields: ['description', 'hashtags'],
        recommendedSpecs: {
          videoFormats: ['video/mp4'],
          maxFileSize: 150 * 1024 * 1024, // 150MB
          dimensions: [
            { width: 1080, height: 1920, label: 'TikTok (9:16)' }
          ],
          duration: { min: 15, max: 180 }
        }
      },
      {
        id: 'generic_campaign',
        name: 'Campaign Material',
        description: 'General campaign materials and assets',
        contentType: 'campaign_material',
        requiredFields: ['title', 'description'],
        recommendedSpecs: {
          imageFormats: ['image/jpeg', 'image/png', 'image/gif'],
          videoFormats: ['video/mp4', 'video/quicktime'],
          maxFileSize: 200 * 1024 * 1024 // 200MB
        }
      }
    ];
  }

  // Get available templates
  getTemplates(): ProofTemplate[] {
    return this.templates;
  }

  // Get template by ID
  getTemplate(templateId: string): ProofTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  }

  // Create new proof submission
  async createProofSubmission(
    dealId: string,
    userId: string,
    files: DocumentFile[],
    metadata: ProofMetadata,
    milestoneId?: string,
    templateId?: string
  ): Promise<{ success: boolean; proofId?: string; error?: string }> {
    try {
      const template = templateId ? this.getTemplate(templateId) : null;
      
      // Validate required fields if template is specified
      if (template) {
        const validation = this.validateProofSubmission(metadata, template);
        if (!validation.isValid) {
          return { success: false, error: validation.errors.join(', ') };
        }
      }

      const proofSubmission: ProofSubmission = {
        id: `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dealId,
        milestoneId,
        userId,
        files,
        metadata,
        status: 'draft',
        revisionCount: 0,
        template
      };

      // Save to cache
      this.cachedSubmissions.push(proofSubmission);
      await this.cacheSubmissions();

      return { success: true, proofId: proofSubmission.id };
    } catch (error) {
      console.error('Failed to create proof submission:', error);
      return { success: false, error: 'Failed to create proof submission' };
    }
  }

  // Submit proof for review
  async submitProofForReview(
    proofId: string,
    finalMetadata?: Partial<ProofMetadata>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const proof = this.cachedSubmissions.find(p => p.id === proofId);
      if (!proof) {
        return { success: false, error: 'Proof submission not found' };
      }

      // Update metadata if provided
      if (finalMetadata) {
        proof.metadata = { ...proof.metadata, ...finalMetadata };
      }

      // Validate files
      if (proof.files.length === 0) {
        return { success: false, error: 'No files attached to proof' };
      }

      // Upload files using document service
      const uploadEndpoint = `${API_URL}/marketer/deals/${proof.dealId}/submit-proof`;
      const additionalData = {
        userId: proof.userId,
        userType: 'Creator', // Assuming creators submit proofs
        proofMetadata: JSON.stringify(proof.metadata),
        milestoneId: proof.milestoneId,
        proofId: proof.id
      };

      const uploadResult = await this.documentService.uploadDocuments(
        proof.files,
        uploadEndpoint,
        additionalData
      );

      if (uploadResult.success) {
        // Update proof status
        proof.status = 'submitted';
        proof.submittedAt = new Date();
        await this.cacheSubmissions();

        Toast.show({
          type: 'success',
          text1: 'Proof Submitted',
          text2: 'Your proof has been submitted for review',
          visibilityTime: 3000
        });

        return { success: true };
      } else {
        return { success: false, error: uploadResult.error || 'Upload failed' };
      }
    } catch (error) {
      console.error('Failed to submit proof:', error);
      return { success: false, error: 'Failed to submit proof' };
    }
  }

  // Validate proof submission against template requirements
  private validateProofSubmission(
    metadata: ProofMetadata,
    template: ProofTemplate
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    template.requiredFields.forEach(field => {
      if (!metadata[field as keyof ProofMetadata] || 
          (Array.isArray(metadata[field as keyof ProofMetadata]) && 
           (metadata[field as keyof ProofMetadata] as any[]).length === 0)) {
        errors.push(`${field} is required for ${template.name}`);
      }
    });

    // Additional validations can be added here
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get proof submission by ID
  async getProofSubmission(proofId: string): Promise<ProofSubmission | null> {
    // Try cache first
    let proof = this.cachedSubmissions.find(p => p.id === proofId);
    
    if (!proof) {
      // Try to fetch from backend
      try {
        const response = await axios.get(`${API_URL}/proofs/${proofId}`);
        proof = response.data.proof;
        
        if (proof) {
          this.cachedSubmissions.push(proof);
          await this.cacheSubmissions();
        }
      } catch (error) {
        console.error('Failed to fetch proof submission:', error);
      }
    }
    
    return proof || null;
  }

  // Get all proof submissions for a deal
  async getProofSubmissionsForDeal(dealId: string): Promise<ProofSubmission[]> {
    try {
      const response = await axios.get(`${API_URL}/deals/${dealId}/proofs`);
      const proofs = response.data.proofs || [];
      
      // Update cache
      proofs.forEach((proof: ProofSubmission) => {
        const existingIndex = this.cachedSubmissions.findIndex(p => p.id === proof.id);
        if (existingIndex >= 0) {
          this.cachedSubmissions[existingIndex] = proof;
        } else {
          this.cachedSubmissions.push(proof);
        }
      });
      
      await this.cacheSubmissions();
      return proofs;
    } catch (error) {
      console.error('Failed to fetch proof submissions:', error);
      // Return cached proofs for the deal
      return this.cachedSubmissions.filter(p => p.dealId === dealId);
    }
  }

  // Update proof submission
  async updateProofSubmission(
    proofId: string,
    updates: Partial<ProofSubmission>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const proofIndex = this.cachedSubmissions.findIndex(p => p.id === proofId);
      if (proofIndex === -1) {
        return { success: false, error: 'Proof submission not found' };
      }

      this.cachedSubmissions[proofIndex] = {
        ...this.cachedSubmissions[proofIndex],
        ...updates
      };

      await this.cacheSubmissions();
      return { success: true };
    } catch (error) {
      console.error('Failed to update proof submission:', error);
      return { success: false, error: 'Failed to update proof submission' };
    }
  }

  // Delete proof submission
  async deleteProofSubmission(proofId: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.cachedSubmissions = this.cachedSubmissions.filter(p => p.id !== proofId);
      await this.cacheSubmissions();
      return { success: true };
    } catch (error) {
      console.error('Failed to delete proof submission:', error);
      return { success: false, error: 'Failed to delete proof submission' };
    }
  }

  // Get proof analytics
  async getProofAnalytics(dealId?: string): Promise<ProofAnalytics> {
    const submissions = dealId 
      ? this.cachedSubmissions.filter(p => p.dealId === dealId)
      : this.cachedSubmissions;

    const totalSubmissions = submissions.length;
    const approvedSubmissions = submissions.filter(p => p.status === 'approved').length;
    const approvalRate = totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0;

    // Calculate average review time
    const reviewedSubmissions = submissions.filter(p => p.reviewedAt && p.submittedAt);
    const averageReviewTime = reviewedSubmissions.length > 0
      ? reviewedSubmissions.reduce((sum, p) => {
          const reviewTime = (p.reviewedAt!.getTime() - p.submittedAt!.getTime()) / (1000 * 60 * 60); // hours
          return sum + reviewTime;
        }, 0) / reviewedSubmissions.length
      : 0;

    // Calculate revision rate
    const submissionsWithRevisions = submissions.filter(p => p.revisionCount > 0).length;
    const revisionRate = totalSubmissions > 0 ? (submissionsWithRevisions / totalSubmissions) * 100 : 0;

    return {
      totalSubmissions,
      approvalRate,
      averageReviewTime,
      revisionRate,
      topIssues: [], // Would be populated from actual feedback data
      performanceByContentType: [] // Would be calculated from actual data
    };
  }

  // Cache submissions to local storage
  private async cacheSubmissions(): Promise<void> {
    try {
      await AsyncStorage.setItem('proofSubmissions', JSON.stringify(this.cachedSubmissions));
    } catch (error) {
      console.error('Failed to cache proof submissions:', error);
    }
  }

  // Load cached submissions
  private async loadCachedSubmissions(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('proofSubmissions');
      if (cached) {
        this.cachedSubmissions = JSON.parse(cached);
      }
    } catch (error) {
      console.error('Failed to load cached proof submissions:', error);
    }
  }

  // Initialize service
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadTemplates(),
      this.loadCachedSubmissions()
    ]);
  }
}

// React hook for proof submission
export const useProofSubmission = (dealId?: string) => {
  const [proofs, setProofs] = React.useState<ProofSubmission[]>([]);
  const [templates, setTemplates] = React.useState<ProofTemplate[]>([]);
  const [analytics, setAnalytics] = React.useState<ProofAnalytics | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const service = ProofSubmissionService.getInstance();

  // Initialize service and load data
  React.useEffect(() => {
    const initializeService = async () => {
      setIsLoading(true);
      try {
        await service.initialize();
        setTemplates(service.getTemplates());
        
        if (dealId) {
          const dealProofs = await service.getProofSubmissionsForDeal(dealId);
          setProofs(dealProofs);
        }
        
        const analyticsData = await service.getProofAnalytics(dealId);
        setAnalytics(analyticsData);
      } catch (err: any) {
        setError(err.message || 'Failed to initialize proof submission service');
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, [dealId]);

  const createProof = React.useCallback(async (
    userId: string,
    files: DocumentFile[],
    metadata: ProofMetadata,
    milestoneId?: string,
    templateId?: string
  ) => {
    if (!dealId) {
      throw new Error('Deal ID is required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await service.createProofSubmission(
        dealId,
        userId,
        files,
        metadata,
        milestoneId,
        templateId
      );

      if (result.success) {
        // Refresh proofs list
        const updatedProofs = await service.getProofSubmissionsForDeal(dealId);
        setProofs(updatedProofs);
        return result;
      } else {
        throw new Error(result.error || 'Failed to create proof');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create proof';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [dealId, service]);

  const submitProof = React.useCallback(async (
    proofId: string,
    finalMetadata?: Partial<ProofMetadata>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await service.submitProofForReview(proofId, finalMetadata);
      
      if (result.success && dealId) {
        // Refresh proofs list
        const updatedProofs = await service.getProofSubmissionsForDeal(dealId);
        setProofs(updatedProofs);
        return result;
      } else {
        throw new Error(result.error || 'Failed to submit proof');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit proof';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [dealId, service]);

  const updateProof = React.useCallback(async (
    proofId: string,
    updates: Partial<ProofSubmission>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await service.updateProofSubmission(proofId, updates);
      
      if (result.success && dealId) {
        // Refresh proofs list
        const updatedProofs = await service.getProofSubmissionsForDeal(dealId);
        setProofs(updatedProofs);
        return result;
      } else {
        throw new Error(result.error || 'Failed to update proof');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update proof';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [dealId, service]);

  const deleteProof = React.useCallback(async (proofId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await service.deleteProofSubmission(proofId);
      
      if (result.success) {
        setProofs(prev => prev.filter(p => p.id !== proofId));
        return result;
      } else {
        throw new Error(result.error || 'Failed to delete proof');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete proof';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    proofs,
    templates,
    analytics,
    isLoading,
    error,
    createProof,
    submitProof,
    updateProof,
    deleteProof,
    service
  };
};
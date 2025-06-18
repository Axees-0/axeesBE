import { useState } from 'react';

export interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uri: string;
  uploadedAt: Date;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
}

export interface DocumentSubmissionResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export function useDocumentSubmission() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const submitDocument = async (file: File | any): Promise<DocumentSubmissionResult> => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Placeholder implementation
      const newDoc: DocumentFile = {
        id: Date.now().toString(),
        name: file.name || 'document',
        size: file.size || 0,
        type: file.type || 'application/pdf',
        uri: file.uri || URL.createObjectURL(file),
        uploadedAt: new Date(),
        status: 'uploaded',
      };

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload delay
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setDocuments(prev => [...prev, newDoc]);
      
      return {
        success: true,
        documentId: newDoc.id,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload document',
      };
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const updateDocumentStatus = (documentId: string, status: DocumentFile['status']) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === documentId ? { ...doc, status } : doc
      )
    );
  };

  return {
    documents,
    isUploading,
    uploadProgress,
    submitDocument,
    deleteDocument,
    updateDocumentStatus,
  };
}
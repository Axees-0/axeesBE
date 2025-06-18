import { useState, useCallback } from 'react';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export function useUploadProgress() {
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startUpload = useCallback(() => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
  }, []);

  const updateProgress = useCallback((loaded: number, total: number) => {
    const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
    setProgress({ loaded, total, percentage });
  }, []);

  const completeUpload = useCallback(() => {
    setIsUploading(false);
    setProgress({ loaded: 100, total: 100, percentage: 100 });
  }, []);

  const failUpload = useCallback((errorMessage: string) => {
    setIsUploading(false);
    setError(errorMessage);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
  }, []);

  const resetUpload = useCallback(() => {
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    progress,
    isUploading,
    error,
    startUpload,
    updateProgress,
    completeUpload,
    failUpload,
    resetUpload,
  };
}
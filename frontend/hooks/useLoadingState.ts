import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

export const useLoadingState = (initialMessage: string = 'Loading...') => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    loadingMessage: initialMessage,
    error: null,
  });

  const startLoading = useCallback((message?: string) => {
    setState({
      isLoading: true,
      loadingMessage: message || initialMessage,
      error: null,
    });
  }, [initialMessage]);

  const stopLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState({
      isLoading: false,
      loadingMessage: '',
      error,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  // Wrapper for async operations with loading state
  const withLoading = useCallback(async <T,>(
    asyncOperation: () => Promise<T>,
    loadingMessage?: string
  ): Promise<T | null> => {
    try {
      startLoading(loadingMessage);
      const result = await asyncOperation();
      stopLoading();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      return null;
    }
  }, [startLoading, stopLoading, setError]);

  return {
    ...state,
    startLoading,
    stopLoading,
    setError,
    clearError,
    withLoading,
  };
};

// Demo-specific loading simulator for smooth transitions
export const useDemoLoading = (minDelay: number = 300, maxDelay: number = 800) => {
  const loadingState = useLoadingState();

  const simulateLoading = useCallback(async (
    message?: string,
    customDelay?: number
  ) => {
    const delay = customDelay || Math.random() * (maxDelay - minDelay) + minDelay;
    
    loadingState.startLoading(message);
    await new Promise(resolve => setTimeout(resolve, delay));
    loadingState.stopLoading();
  }, [loadingState, minDelay, maxDelay]);

  return {
    ...loadingState,
    simulateLoading,
  };
};
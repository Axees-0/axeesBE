import Toast from "react-native-toast-message";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface NetworkError extends Error {
  isNetworkError: boolean;
  status?: number;
}

export class ApiClient {
  private static baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  private static isBackendAvailable: boolean | null = null;
  private static lastBackendCheck = 0;
  private static readonly BACKEND_CHECK_INTERVAL = 30000; // 30 seconds

  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    showErrors = true
  ): Promise<T | null> {
    try {
      // Check backend availability before making request
      const isAvailable = await this.checkBackendAvailability();
      if (!isAvailable && showErrors) {
        handleBackendError(
          { message: 'ERR_CONNECTION_REFUSED' }, 
          `Loading ${endpoint.split('/').pop() || 'data'}`
        );
        return null;
      }

      const url = `${this.baseUrl}${endpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const apiError = await this.handleApiError(response);
        if (showErrors) {
          handleBackendError(apiError, `Loading ${endpoint.split('/').pop() || 'data'}`);
        }
        throw apiError;
      }

      // Mark backend as available if request succeeds
      this.isBackendAvailable = true;
      this.lastBackendCheck = Date.now();

      return await response.json();
    } catch (error) {
      const networkError = this.handleNetworkError(error);
      
      // Mark backend as unavailable on connection errors
      if (networkError.message?.includes('connection') || 
          networkError.message?.includes('fetch') ||
          networkError.message?.includes('refused')) {
        this.isBackendAvailable = false;
        this.lastBackendCheck = Date.now();
      }

      if (showErrors) {
        handleBackendError(networkError, `Loading ${endpoint.split('/').pop() || 'data'}`);
      }
      
      return null;
    }
  }

  private static async checkBackendAvailability(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent
    if (this.isBackendAvailable !== null && 
        (now - this.lastBackendCheck) < this.BACKEND_CHECK_INTERVAL) {
      return this.isBackendAvailable;
    }

    // Perform actual connectivity check
    this.isBackendAvailable = await checkBackendConnection();
    this.lastBackendCheck = now;
    
    return this.isBackendAvailable;
  }

  static getConnectionStatus(): boolean | null {
    return this.isBackendAvailable;
  }

  static resetConnectionStatus(): void {
    this.isBackendAvailable = null;
    this.lastBackendCheck = 0;
  }

  private static async handleApiError(response: Response): Promise<ApiError> {
    const errorData = await response.json().catch(() => ({}));
    return {
      message: errorData.message || `Request failed with status ${response.status}`,
      status: response.status,
      code: errorData.code || "API_ERROR",
    };
  }

  private static handleNetworkError(error: any): NetworkError {
    if (error.name === 'AbortError') {
      const timeoutError = new Error("Request timed out") as NetworkError;
      timeoutError.isNetworkError = true;
      return timeoutError;
    }
    
    if (error.message?.includes("Network request failed") || 
        error.message?.includes("ERR_CONNECTION_REFUSED") ||
        error.message?.includes("Failed to fetch") ||
        !navigator.onLine) {
      const networkError = new Error("Network connection failed") as NetworkError;
      networkError.isNetworkError = true;
      return networkError;
    }
    return error;
  }
}

export const showErrorToast = (error: any, fallbackMessage = "Something went wrong") => {
  let errorMessage = fallbackMessage;
  
  if (error?.message) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  Toast.show({
    type: "error",
    text1: "Error",
    text2: errorMessage,
    position: "top",
    visibilityTime: 4000,
    autoHide: true,
  });
};

export const handleAsyncError = async <T>(
  asyncFunction: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await asyncFunction();
  } catch (error) {
    console.error("Async operation failed:", error);
    if (errorMessage) {
      showErrorToast(error, errorMessage);
    }
    return null;
  }
};

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  errorMessage?: string
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          console.error("Function failed:", error);
          if (errorMessage) {
            showErrorToast(error, errorMessage);
          }
          throw error;
        });
      }
      return result;
    } catch (error) {
      console.error("Function failed:", error);
      if (errorMessage) {
        showErrorToast(error, errorMessage);
      }
      throw error;
    }
  }) as T;
};

export const validateNetworkConnection = () => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    showErrorToast("No internet connection. Please check your network.");
    return false;
  }
  return true;
};

export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Backend connection check failed:', error);
    return false;
  }
};

export const handleBackendError = (error: any, operation: string = 'operation') => {
  if (error.message?.includes('ERR_CONNECTION_REFUSED') || 
      error.message?.includes('Network request failed') ||
      error.message?.includes('Failed to fetch')) {
    
    showErrorToast(
      `Unable to connect to server. Please check your connection or try again later.`,
      `${operation} failed`
    );
    return 'CONNECTION_ERROR';
  }
  
  if (error.status >= 500) {
    showErrorToast(
      `Server is temporarily unavailable. Please try again in a few minutes.`,
      `${operation} failed`
    );
    return 'SERVER_ERROR';
  }
  
  showErrorToast(error, `${operation} failed`);
  return 'UNKNOWN_ERROR';
};

export const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
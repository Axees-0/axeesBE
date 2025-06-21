import { useEffect } from 'react';
import { Platform } from 'react-native';

interface ConsoleError {
  message: string;
  stack?: string;
  timestamp: Date;
  url?: string;
  line?: number;
  column?: number;
}

export const useConsoleErrorHandler = () => {
  useEffect(() => {
    if (Platform.OS !== 'web' || !__DEV__) return;

    const errors: ConsoleError[] = [];
    
    // Override console.error to capture errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);
      
      // Capture error details
      const errorMessage = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      const error: ConsoleError = {
        message: errorMessage,
        timestamp: new Date(),
      };

      // Try to extract stack trace
      const errorObj = args.find(arg => arg instanceof Error);
      if (errorObj) {
        error.stack = errorObj.stack;
      }

      errors.push(error);
      
      // Log specific patterns that need fixing
      if (errorMessage.includes('isWeb is not defined')) {
        console.warn('⚠️ Found "isWeb is not defined" error - check Platform.OS usage');
      }
      
      if (errorMessage.includes('Warning: Failed prop type')) {
        console.warn('⚠️ Found prop type warning - check component prop types');
      }
      
      if (errorMessage.includes('Warning: Each child in a list')) {
        console.warn('⚠️ Found missing key warning - add key prop to list items');
      }
      
      if (errorMessage.includes('Warning: Can\'t perform a React state update')) {
        console.warn('⚠️ Found unmounted component warning - check cleanup in useEffect');
      }
    };

    // Handle global errors on web
    const handleGlobalError = (event: ErrorEvent) => {
      const error: ConsoleError = {
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date(),
        url: event.filename,
        line: event.lineno,
        column: event.colno,
      };
      
      errors.push(error);
      console.error('🚨 Global error caught:', error);
    };

    window.addEventListener('error', handleGlobalError);

    // Log error summary on cleanup
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', handleGlobalError);
      
      if (errors.length > 0 && __DEV__) {
        console.group('📊 Console Error Summary');
        console.log(`Total errors captured: ${errors.length}`);
        
        // Group errors by type
        const errorTypes = errors.reduce((acc, error) => {
          const key = error.message.split(':')[0] || 'Unknown';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.table(errorTypes);
        console.groupEnd();
      }
    };
  }, []);
};
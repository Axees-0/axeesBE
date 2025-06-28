import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * Custom hook to trap focus within a modal or container
 * Only works on web platform
 * 
 * @param isVisible - Whether the modal/container is visible
 * @param returnFocusTo - Optional element to return focus to when modal closes
 * @returns ref to attach to the container element
 */
export const useFocusTrap = (isVisible: boolean, returnFocusTo?: HTMLElement | null) => {
  const containerRef = useRef<any>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web' || !isVisible) return;

    // Store the currently focused element
    previouslyFocusedElement.current = returnFocusTo || (document.activeElement as HTMLElement);

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      const focusableSelectors = [
        'a[href]:not([disabled])',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"]):not([disabled])',
        '[contenteditable="true"]:not([disabled])'
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    };

    // Focus the first focusable element
    const focusFirstElement = () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        setTimeout(() => {
          focusableElements[0].focus();
        }, 50); // Small delay to ensure modal is fully rendered
      }
    };

    // Handle tab key navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // If shift+tab on first element, focus last element
      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // If tab on last element, focus first element
      else if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Focus first element when modal opens
    focusFirstElement();

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Return focus to previously focused element when modal closes
      if (previouslyFocusedElement.current && document.body.contains(previouslyFocusedElement.current)) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isVisible, returnFocusTo]);

  return containerRef;
};

/**
 * Hook to manage focus trap with additional ARIA attributes
 * Includes role="dialog", aria-modal, and aria-labelledby support
 */
export const useAccessibleFocusTrap = (
  isVisible: boolean,
  modalTitle?: string,
  modalDescription?: string,
  returnFocusTo?: HTMLElement | null
) => {
  const focusTrapRef = useFocusTrap(isVisible, returnFocusTo);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isVisible || !focusTrapRef.current) return;

    const container = focusTrapRef.current;

    // Set ARIA attributes
    container.setAttribute('role', 'dialog');
    container.setAttribute('aria-modal', 'true');
    
    if (modalTitle) {
      container.setAttribute('aria-label', modalTitle);
    }
    
    if (modalDescription) {
      container.setAttribute('aria-describedby', `${container.id}-description`);
    }

    // Hide other content from screen readers
    const appRoot = document.getElementById('root') || document.body.firstElementChild;
    if (appRoot) {
      appRoot.setAttribute('aria-hidden', 'true');
    }

    return () => {
      // Restore ARIA visibility
      if (appRoot) {
        appRoot.removeAttribute('aria-hidden');
      }
    };
  }, [isVisible, modalTitle, modalDescription]);

  return focusTrapRef;
};
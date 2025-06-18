/**
 * Demo Polish Utilities
 * Enhanced animations, transitions, and feedback for investor demo
 */

import { Platform } from 'react-native';

export class DemoPolish {
  /**
   * Enhanced success animation for form submissions
   */
  static showSuccessAnimation(elementId?: string) {
    if (Platform.OS === 'web' && elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        // Add success pulse animation
        element.style.animation = 'successPulse 0.6s ease-out';
        
        // Remove animation after completion
        setTimeout(() => {
          if (element.style) {
            element.style.animation = '';
          }
        }, 600);
      }
    }
  }

  /**
   * Button press feedback with enhanced visual response
   */
  static enhanceButtonPress(callback: () => void, elementId?: string) {
    return () => {
      // Add press animation if web
      if (Platform.OS === 'web' && elementId) {
        const element = document.getElementById(elementId);
        if (element) {
          element.style.transform = 'scale(0.98)';
          element.style.transition = 'transform 0.1s ease-out';
          
          setTimeout(() => {
            if (element.style) {
              element.style.transform = 'scale(1)';
            }
          }, 100);
        }
      }
      
      // Execute callback with slight delay for visual feedback
      setTimeout(callback, 150);
    };
  }

  /**
   * Progressive loading with smooth transitions
   */
  static createProgressiveLoader(steps: string[], onComplete?: () => void) {
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 300); // 300ms per step for smooth progression
    
    return interval;
  }

  /**
   * Smooth form field focus transitions
   */
  static enhanceFieldFocus(elementId: string) {
    if (Platform.OS === 'web') {
      const element = document.getElementById(elementId);
      if (element) {
        element.style.transition = 'border-color 0.2s ease-out, box-shadow 0.2s ease-out';
        element.style.borderColor = '#430B92';
        element.style.boxShadow = '0 0 0 3px rgba(67, 11, 146, 0.1)';
      }
    }
  }

  /**
   * Remove field focus styling
   */
  static removeFieldFocus(elementId: string) {
    if (Platform.OS === 'web') {
      const element = document.getElementById(elementId);
      if (element) {
        element.style.borderColor = '#E2D0FB';
        element.style.boxShadow = 'none';
      }
    }
  }

  /**
   * Enhanced toast animations for demo
   */
  static showEnhancedToast(
    type: 'success' | 'info' | 'warning' | 'error',
    title: string,
    message: string,
    duration: number = 3000
  ) {
    // This would integrate with your existing Toast system
    // but with enhanced animations and styling for demo
    const toastConfig = {
      success: {
        icon: '🎉',
        backgroundColor: '#22C55E',
        borderColor: '#16A34A',
      },
      info: {
        icon: 'ℹ️',
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
      },
      warning: {
        icon: '⚠️',
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
      },
      error: {
        icon: '❌',
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
      },
    };

    const config = toastConfig[type];
    
    return {
      type: 'customNotification',
      text1: `${config.icon} ${title}`,
      text2: message,
      position: 'top' as const,
      visibilityTime: duration,
      topOffset: 50,
      props: {
        style: {
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.borderColor,
          borderLeftWidth: 4,
        },
      },
    };
  }

  /**
   * Smooth page transitions for demo flows
   */
  static enhancePageTransition(fromPage: string, toPage: string) {
    if (Platform.OS === 'web') {
      // Add smooth transition effect
      document.body.style.opacity = '0.95';
      document.body.style.transition = 'opacity 0.2s ease-out';
      
      setTimeout(() => {
        document.body.style.opacity = '1';
      }, 200);
    }
  }

  /**
   * Loading state with progress indication
   */
  static createLoadingState(label: string, estimatedDuration?: number) {
    const states = [
      `${label}...`,
      `${label}... ⚡`,
      `${label}... ✨`,
      `${label}... 🚀`,
    ];
    
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % states.length;
    }, 400);
    
    // Auto-clear after estimated duration
    if (estimatedDuration) {
      setTimeout(() => {
        clearInterval(interval);
      }, estimatedDuration);
    }
    
    return {
      getCurrentState: () => states[currentIndex],
      clear: () => clearInterval(interval),
    };
  }

  /**
   * Add hover effects for interactive elements
   */
  static addHoverEffects(elementId: string, hoverStyles: any) {
    if (Platform.OS === 'web') {
      const element = document.getElementById(elementId);
      if (element) {
        const originalStyles = { ...element.style };
        
        element.addEventListener('mouseenter', () => {
          Object.assign(element.style, hoverStyles);
          element.style.transition = 'all 0.2s ease-out';
        });
        
        element.addEventListener('mouseleave', () => {
          Object.assign(element.style, originalStyles);
        });
      }
    }
  }

  /**
   * Confetti effect for major successes
   */
  static showConfetti() {
    if (Platform.OS === 'web') {
      // Simple confetti simulation
      const colors = ['#430B92', '#8B5CF6', '#A855F7', '#C084FC', '#DDD6FE'];
      
      for (let i = 0; i < 50; i++) {
        setTimeout(() => {
          const confetti = document.createElement('div');
          confetti.style.position = 'fixed';
          confetti.style.width = '8px';
          confetti.style.height = '8px';
          confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          confetti.style.left = Math.random() * window.innerWidth + 'px';
          confetti.style.top = '-10px';
          confetti.style.pointerEvents = 'none';
          confetti.style.borderRadius = '50%';
          confetti.style.zIndex = '9999';
          confetti.style.animation = 'confettiFall 3s linear forwards';
          
          document.body.appendChild(confetti);
          
          setTimeout(() => {
            if (document.body.contains(confetti)) {
              document.body.removeChild(confetti);
            }
          }, 3000);
        }, i * 50);
      }
    }
  }

  /**
   * Enhanced ripple effect for button presses
   */
  static createRippleEffect(x: number, y: number, elementId: string) {
    if (Platform.OS === 'web') {
      const element = document.getElementById(elementId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        ripple.style.pointerEvents = 'none';
        ripple.style.left = (x - rect.left) + 'px';
        ripple.style.top = (y - rect.top) + 'px';
        ripple.style.width = '0px';
        ripple.style.height = '0px';
        ripple.style.animation = 'rippleExpand 0.6s ease-out forwards';
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
          if (element.contains(ripple)) {
            element.removeChild(ripple);
          }
        }, 600);
      }
    }
  }

  /**
   * Smooth scroll to element with highlight
   */
  static scrollToAndHighlight(elementId: string) {
    if (Platform.OS === 'web') {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Add highlight effect
        setTimeout(() => {
          const originalBackground = element.style.backgroundColor;
          element.style.backgroundColor = 'rgba(67, 11, 146, 0.1)';
          element.style.transition = 'background-color 0.3s ease-out';
          
          setTimeout(() => {
            element.style.backgroundColor = originalBackground;
          }, 1000);
        }, 500);
      }
    }
  }
}

// CSS animations for web (would be injected into document head)
export const demoPolishStyles = `
  @keyframes successPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
    100% { transform: scale(1); }
  }

  @keyframes confettiFall {
    0% { 
      transform: translateY(-10px) rotate(0deg);
      opacity: 1;
    }
    100% { 
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes rippleExpand {
    0% {
      width: 0px;
      height: 0px;
      opacity: 1;
    }
    100% {
      width: 100px;
      height: 100px;
      margin: -50px;
      opacity: 0;
    }
  }

  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }

  .demo-loading-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }

  .demo-button-hover:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(67, 11, 146, 0.15);
    transition: all 0.2s ease-out;
  }

  .demo-field-focus {
    border-color: #430B92 !important;
    box-shadow: 0 0 0 3px rgba(67, 11, 146, 0.1) !important;
    transition: all 0.2s ease-out;
  }
`;

// Initialize polish styles on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = demoPolishStyles;
  document.head.appendChild(styleSheet);
}
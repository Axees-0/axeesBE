/**
 * Global Loading Indicator
 * Shows loading state when API requests are in progress
 */

class LoadingIndicator {
  constructor() {
    this.loadingCount = 0;
    this.element = null;
    this.init();
  }

  init() {
    // Create loading indicator element
    this.createLoadingElement();
    
    // Listen for loading state changes
    window.addEventListener('axees-loading-change', (event) => {
      this.handleLoadingChange(event.detail);
    });
  }

  createLoadingElement() {
    // Create container
    const container = document.createElement('div');
    container.id = 'global-loading-indicator';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: transparent;
      z-index: 9999;
      transition: opacity 0.3s ease;
      opacity: 0;
      pointer-events: none;
    `;

    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #6366f1 0%, #ec4899 100%);
      width: 30%;
      animation: loading-progress 1.5s ease-in-out infinite;
      transform-origin: left center;
    `;

    container.appendChild(progressBar);
    document.body.appendChild(container);
    this.element = container;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes loading-progress {
        0% {
          transform: translateX(-100%) scaleX(1);
        }
        50% {
          transform: translateX(50%) scaleX(1.5);
        }
        100% {
          transform: translateX(400%) scaleX(1);
        }
      }
      
      .loading-spinner {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        z-index: 9998;
      }
      
      .loading-spinner::after {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border: 3px solid #f3f4f6;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .loading-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
        z-index: 9997;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      
      .loading-backdrop.active {
        opacity: 1;
        pointer-events: all;
      }
    `;
    document.head.appendChild(style);
  }

  handleLoadingChange(detail) {
    const { isLoading, totalLoading, endpoint } = detail;
    
    this.loadingCount = totalLoading;
    
    if (this.loadingCount > 0) {
      this.show();
    } else {
      this.hide();
    }
    
  }

  show() {
    if (this.element) {
      this.element.style.opacity = '1';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.opacity = '0';
    }
  }

  /**
   * Show full-page loading spinner for critical operations
   */
  showFullPageLoader(message = 'Loading...') {
    // Remove existing backdrop if any
    this.hideFullPageLoader();
    
    const backdrop = document.createElement('div');
    backdrop.className = 'loading-backdrop';
    backdrop.id = 'full-page-loader';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      position: fixed;
      top: calc(50% + 30px);
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 14px;
      z-index: 9998;
    `;
    messageEl.textContent = message;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(spinner);
    document.body.appendChild(messageEl);
    
    // Trigger animation
    requestAnimationFrame(() => {
      backdrop.classList.add('active');
    });
  }

  /**
   * Hide full-page loading spinner
   */
  hideFullPageLoader() {
    const backdrop = document.getElementById('full-page-loader');
    const spinner = document.querySelector('.loading-spinner');
    const message = spinner?.nextElementSibling;
    
    if (backdrop) {
      backdrop.classList.remove('active');
      setTimeout(() => {
        backdrop.remove();
        spinner?.remove();
        message?.remove();
      }, 300);
    }
  }
}

// Initialize loading indicator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.loadingIndicator = new LoadingIndicator();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingIndicator;
}
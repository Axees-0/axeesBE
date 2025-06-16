/**
 * PaymentModal Component
 * Handles Stripe Elements integration for credit card management
 * Connects to /api/payment-persistence endpoints for secure payment processing
 */

class PaymentModal {
  constructor() {
    this.stripe = null;
    this.elements = null;
    this.cardElement = null;
    this.isOpen = false;
    this.paymentMethodId = null;
    this.onSuccess = null;
    this.onError = null;
    
    this.initializeStripe();
  }

  async initializeStripe() {
    try {
      // Load Stripe.js if not already loaded
      if (!window.Stripe) {
        await this.loadStripeJS();
      }
      
      // Initialize Stripe with publishable key
      this.stripe = window.Stripe(this.getStripePublishableKey());
      this.elements = this.stripe.elements({
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0570de',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            spacingUnit: '2px',
            borderRadius: '4px'
          }
        }
      });
      
      this.createCardElement();
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
    }
  }

  async loadStripeJS() {
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  getStripePublishableKey() {
    // Get from environment or backend configuration
    return window.STRIPE_PUBLISHABLE_KEY || 'pk_live_51234567890abcdef';
  }

  createCardElement() {
    if (!this.elements) return;

    this.cardElement = this.elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#9e2146',
        },
      },
      hidePostalCode: false
    });
  }

  createModalHTML() {
    return `
      <div class="payment-modal-overlay" id="paymentModalOverlay">
        <div class="payment-modal">
          <div class="payment-modal-header">
            <h3>Add Payment Method</h3>
            <button class="payment-modal-close" onclick="window.paymentModal.close()">
              <span>&times;</span>
            </button>
          </div>
          
          <div class="payment-modal-content">
            <form id="paymentForm" class="payment-form">
              <div class="form-section">
                <label class="form-label">Card Information</label>
                <div id="card-element" class="stripe-element">
                  <!-- Stripe Elements will create form elements here -->
                </div>
                <div id="card-errors" class="error-message" role="alert"></div>
              </div>

              <div class="form-section">
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="savePaymentMethod" checked>
                    <span class="checkmark"></span>
                    Save payment method for future use
                  </label>
                </div>
              </div>

              <div class="form-section">
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" id="setAsDefault">
                    <span class="checkmark"></span>
                    Set as default payment method
                  </label>
                </div>
              </div>

              <div class="payment-modal-actions">
                <button type="button" class="btn btn-secondary" onclick="window.paymentModal.close()">
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" id="submitPayment">
                  <span class="loading-spinner" style="display: none;"></span>
                  Add Payment Method
                </button>
              </div>
            </form>
          </div>

          <div class="payment-security-info">
            <div class="security-badges">
              <span class="security-badge">🔒 SSL Encrypted</span>
              <span class="security-badge">🛡️ PCI Compliant</span>
              <span class="security-badge">⚡ Powered by Stripe</span>
            </div>
            <p class="security-text">
              Your payment information is encrypted and securely processed. 
              We never store your card details on our servers.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  open(options = {}) {
    if (this.isOpen) return;

    this.onSuccess = options.onSuccess || null;
    this.onError = options.onError || null;

    // Create modal HTML
    const modalHTML = this.createModalHTML();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mount Stripe card element
    this.mountCardElement();
    
    // Add event listeners
    this.attachEventListeners();
    
    // Show modal
    document.body.classList.add('modal-open');
    this.isOpen = true;

    // Focus on card element after a short delay
    setTimeout(() => {
      if (this.cardElement) {
        this.cardElement.focus();
      }
    }, 100);
  }

  close() {
    if (!this.isOpen) return;

    const modal = document.getElementById('paymentModalOverlay');
    if (modal) {
      modal.remove();
    }
    
    document.body.classList.remove('modal-open');
    this.isOpen = false;
    this.paymentMethodId = null;
  }

  mountCardElement() {
    if (!this.cardElement) return;

    const cardElementContainer = document.getElementById('card-element');
    if (cardElementContainer) {
      this.cardElement.mount('#card-element');
    }
  }

  attachEventListeners() {
    // Card element event listeners
    if (this.cardElement) {
      this.cardElement.on('change', (event) => {
        this.handleCardChange(event);
      });
    }

    // Form submission
    const form = document.getElementById('paymentForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Close modal on overlay click
    const overlay = document.getElementById('paymentModalOverlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  handleCardChange(event) {
    const errorElement = document.getElementById('card-errors');
    if (event.error) {
      errorElement.textContent = event.error.message;
      errorElement.style.display = 'block';
    } else {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    if (!this.stripe || !this.cardElement) {
      this.showError('Payment system not initialized');
      return;
    }

    const submitButton = document.getElementById('submitPayment');
    const spinner = submitButton.querySelector('.loading-spinner');
    
    // Show loading state
    submitButton.disabled = true;
    spinner.style.display = 'inline-block';
    submitButton.textContent = 'Processing...';

    try {
      // Create payment method with Stripe
      const result = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
        billing_details: {
          name: this.getCurrentUserName(),
        },
      });

      if (result.error) {
        this.showError(result.error.message);
        return;
      }

      // Save payment method to backend
      await this.savePaymentMethod(result.paymentMethod);

    } catch (error) {
      console.error('Payment submission error:', error);
      this.showError('Failed to add payment method. Please try again.');
    } finally {
      // Reset loading state
      submitButton.disabled = false;
      spinner.style.display = 'none';
      submitButton.textContent = 'Add Payment Method';
    }
  }

  async savePaymentMethod(paymentMethod) {
    try {
      const saveMethod = document.getElementById('savePaymentMethod').checked;
      const setAsDefault = document.getElementById('setAsDefault').checked;

      const response = await window.axeesAPI.request('/payment-persistence/methods', {
        method: 'POST',
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          save: saveMethod,
          setAsDefault: setAsDefault
        })
      });

      if (response.success) {
        this.paymentMethodId = paymentMethod.id;
        this.showSuccess('Payment method added successfully!');
        
        if (this.onSuccess) {
          this.onSuccess({
            paymentMethodId: paymentMethod.id,
            paymentMethod: paymentMethod
          });
        }

        setTimeout(() => this.close(), 1500);
      } else {
        throw new Error(response.message || 'Failed to save payment method');
      }
    } catch (error) {
      console.error('Save payment method error:', error);
      this.showError(error.message || 'Failed to save payment method');
    }
  }

  getCurrentUserName() {
    // Get current user name from auth context or API
    const user = window.authContext?.user;
    return user?.name || 'Axees User';
  }

  showError(message) {
    const errorElement = document.getElementById('card-errors');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }

    if (this.onError) {
      this.onError(message);
    }
  }

  showSuccess(message) {
    const errorElement = document.getElementById('card-errors');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      errorElement.style.color = '#28a745';
    }
  }

  // 3D Secure authentication flow
  async confirm3DSecure(clientSecret) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const result = await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: this.cardElement,
        billing_details: {
          name: this.getCurrentUserName(),
        },
      }
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.paymentIntent;
  }

  // Load saved payment methods
  async loadSavedPaymentMethods() {
    try {
      const response = await window.axeesAPI.request('/payment-persistence/methods');
      return response.success ? response.data.paymentMethods : [];
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      return [];
    }
  }

  // Update default payment method
  async setDefaultPaymentMethod(paymentMethodId) {
    try {
      const response = await window.axeesAPI.request(`/payment-persistence/methods/${paymentMethodId}`, {
        method: 'PUT',
        body: JSON.stringify({ setAsDefault: true })
      });
      
      return response.success;
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      return false;
    }
  }

  // Delete payment method
  async deletePaymentMethod(paymentMethodId) {
    try {
      const response = await window.axeesAPI.request(`/payment-persistence/methods/${paymentMethodId}`, {
        method: 'DELETE'
      });
      
      return response.success;
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      return false;
    }
  }
}

// Global payment modal instance
window.paymentModal = new PaymentModal();

// CSS Styles for PaymentModal
const paymentModalStyles = `
<style>
.payment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.payment-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.payment-modal-header {
  padding: 24px 24px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e9ecef;
  margin-bottom: 24px;
}

.payment-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #212529;
}

.payment-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.payment-modal-close:hover {
  background: #f8f9fa;
  color: #495057;
}

.payment-modal-content {
  padding: 0 24px;
}

.payment-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 4px;
}

.stripe-element {
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.stripe-element:focus-within {
  border-color: #0570de;
  box-shadow: 0 0 0 3px rgba(5, 112, 222, 0.1);
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
}

.checkmark {
  position: relative;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  display: none;
  margin-top: 4px;
}

.payment-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid #e9ecef;
  margin: 24px -24px 0;
}

.payment-security-info {
  background: #f8f9fa;
  padding: 16px 24px 24px;
  border-top: 1px solid #e9ecef;
  margin: 0 -24px -24px;
}

.security-badges {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.security-badge {
  font-size: 12px;
  color: #495057;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.security-text {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
  line-height: 1.4;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

body.modal-open {
  overflow: hidden;
}

@media (max-width: 576px) {
  .payment-modal {
    margin: 16px;
    max-height: calc(100vh - 32px);
  }
  
  .payment-modal-actions {
    flex-direction: column;
  }
  
  .security-badges {
    justify-content: center;
  }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', paymentModalStyles);
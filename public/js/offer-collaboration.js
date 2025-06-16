/**
 * Real-time Collaboration System for Offer Editing
 * Provides live collaboration features with conflict detection and resolution
 */

class OfferCollaborationManager {
  constructor() {
    this.activeOffer = null;
    this.currentSection = null;
    this.activeEditors = [];
    this.collaborationSession = null;
    this.pollingInterval = null;
    this.lastKnownVersion = null;
    this.isEditingActive = false;
    this.conflictDetectionEnabled = true;
    this.pollInterval = 5000; // 5 seconds
    
    this.initialize();
  }

  initialize() {
    if (!window.authContext || !window.authContext.isAuthenticated) {
      return;
    }

    this.setupEventListeners();
    this.createCollaborationUI();
  }

  /**
   * Setup event listeners for collaboration events
   */
  setupEventListeners() {
    // Listen for form field changes to start collaboration
    document.addEventListener('input', (e) => {
      if (this.isOfferFormField(e.target)) {
        this.handleFieldEdit(e.target);
      }
    });

    // Listen for window focus/blur to manage collaboration sessions
    window.addEventListener('focus', () => {
      if (this.collaborationSession) {
        this.refreshCollaborationSession();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.endCollaboration();
    });

    // Listen for offer modal opening
    document.addEventListener('click', (e) => {
      if (e.target.closest('.deal-card')) {
        const offerId = e.target.closest('.deal-card').dataset.offerId;
        if (offerId) {
          this.monitorOfferEditing(offerId);
        }
      }
    });
  }

  /**
   * Check if an input field belongs to offer forms
   */
  isOfferFormField(element) {
    return element.closest('.offer-form-modal, .negotiation-modal, .counter-modal');
  }

  /**
   * Handle field editing start
   */
  async handleFieldEdit(field) {
    const formModal = field.closest('.offer-form-modal, .negotiation-modal');
    if (!formModal) return;

    const offerId = this.getOfferIdFromModal(formModal);
    const section = this.getSectionFromField(field);

    if (offerId && section) {
      await this.startEditingSession(offerId, section);
    }
  }

  /**
   * Start monitoring offer for collaborative editing
   */
  async monitorOfferEditing(offerId) {
    if (this.activeOffer === offerId) return;

    this.activeOffer = offerId;
    await this.startCollaborationPolling();
  }

  /**
   * Start editing session for specific offer section
   */
  async startEditingSession(offerId, section) {
    try {
      if (this.collaborationSession?.offerId === offerId && 
          this.collaborationSession?.section === section) {
        return; // Already in this session
      }

      // End previous session if exists
      if (this.collaborationSession) {
        await this.endCollaboration();
      }

      const response = await window.axeesAPI.startCollaboration(offerId, section);
      
      if (response.success) {
        this.collaborationSession = {
          offerId,
          section,
          sessionId: response.sessionId,
          startTime: new Date()
        };

        this.isEditingActive = true;
        this.startCollaborationPolling();
        this.showCollaborationIndicator(section);
      }

    } catch (error) {
      console.error('Failed to start editing session:', error);
    }
  }

  /**
   * End current collaboration session
   */
  async endCollaboration() {
    if (!this.collaborationSession) return;

    try {
      await window.axeesAPI.endCollaboration(this.collaborationSession.offerId);
      
      this.collaborationSession = null;
      this.isEditingActive = false;
      this.hideCollaborationIndicator();
      this.stopCollaborationPolling();

    } catch (error) {
      console.error('Failed to end collaboration session:', error);
    }
  }

  /**
   * Start polling for collaboration updates
   */
  startCollaborationPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      await this.pollCollaborationUpdates();
    }, this.pollInterval);

    // Initial poll
    this.pollCollaborationUpdates();
  }

  /**
   * Stop collaboration polling
   */
  stopCollaborationPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Poll for collaboration updates
   */
  async pollCollaborationUpdates() {
    if (!this.activeOffer) return;

    try {
      const [collaboratorsResponse, versionResponse] = await Promise.all([
        window.axeesAPI.getActiveCollaborators(this.activeOffer),
        window.axeesAPI.getOfferHistory(this.activeOffer)
      ]);

      if (collaboratorsResponse.success) {
        this.updateActiveEditors(collaboratorsResponse.collaborators);
      }

      if (versionResponse.success) {
        this.checkForVersionChanges(versionResponse.history);
      }

    } catch (error) {
      console.error('Collaboration polling failed:', error);
    }
  }

  /**
   * Update active editors display
   */
  updateActiveEditors(collaborators) {
    const previousEditors = this.activeEditors.map(e => e.userId);
    this.activeEditors = collaborators || [];

    // Check for new editors
    const newEditors = this.activeEditors.filter(editor => 
      !previousEditors.includes(editor.userId) && 
      editor.userId !== window.authContext?.user?.id
    );

    // Show notifications for new editors
    newEditors.forEach(editor => {
      this.showEditorJoinedNotification(editor);
    });

    this.updateCollaboratorIndicators();
  }

  /**
   * Check for version changes and conflicts
   */
  checkForVersionChanges(history) {
    if (!history || history.length === 0) return;

    const latestVersion = history[0];
    
    if (this.lastKnownVersion && 
        latestVersion.version > this.lastKnownVersion.version) {
      
      // New changes detected
      if (this.isEditingActive && this.conflictDetectionEnabled) {
        this.handlePotentialConflict(latestVersion);
      } else {
        this.showVersionUpdateNotification(latestVersion);
      }
    }

    this.lastKnownVersion = latestVersion;
  }

  /**
   * Handle potential editing conflicts
   */
  handlePotentialConflict(newVersion) {
    const conflictedFields = this.detectFieldConflicts(newVersion);
    
    if (conflictedFields.length > 0) {
      this.showConflictResolutionModal(newVersion, conflictedFields);
    }
  }

  /**
   * Detect which fields have conflicts
   */
  detectFieldConflicts(newVersion) {
    if (!this.collaborationSession) return [];

    const conflicts = [];
    const currentFormData = this.getCurrentFormData();

    newVersion.changes.forEach(change => {
      const currentValue = currentFormData[change.field];
      
      if (currentValue !== undefined && 
          currentValue !== change.oldValue && 
          currentValue !== change.newValue) {
        conflicts.push({
          field: change.field,
          yourValue: currentValue,
          theirValue: change.newValue,
          editor: newVersion.userRole
        });
      }
    });

    return conflicts;
  }

  /**
   * Show conflict resolution modal
   */
  showConflictResolutionModal(newVersion, conflicts) {
    const modal = document.createElement('div');
    modal.className = 'conflict-resolution-modal';
    modal.innerHTML = `
      <div class="conflict-modal-backdrop"></div>
      <div class="conflict-modal-container">
        <div class="conflict-modal-header">
          <h3>🔄 Editing Conflict Detected</h3>
          <p>Another user has made changes while you were editing. Please resolve the conflicts below.</p>
        </div>
        
        <div class="conflict-modal-body">
          ${conflicts.map(conflict => this.createConflictResolver(conflict)).join('')}
        </div>
        
        <div class="conflict-modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.conflict-resolution-modal').remove()">
            Cancel
          </button>
          <button class="btn btn-primary" onclick="offerCollaborationManager.resolveConflicts()">
            Apply Resolution
          </button>
        </div>
      </div>
    `;

    this.addConflictModalStyles();
    document.body.appendChild(modal);
  }

  /**
   * Create conflict resolver for a field
   */
  createConflictResolver(conflict) {
    return `
      <div class="conflict-item" data-field="${conflict.field}">
        <div class="conflict-field-name">${this.formatFieldName(conflict.field)}</div>
        
        <div class="conflict-options">
          <div class="conflict-option">
            <input type="radio" name="conflict-${conflict.field}" value="yours" id="yours-${conflict.field}" checked>
            <label for="yours-${conflict.field}">
              <strong>Keep your changes</strong>
              <div class="conflict-value">${conflict.yourValue}</div>
            </label>
          </div>
          
          <div class="conflict-option">
            <input type="radio" name="conflict-${conflict.field}" value="theirs" id="theirs-${conflict.field}">
            <label for="theirs-${conflict.field}">
              <strong>Accept ${conflict.editor}'s changes</strong>
              <div class="conflict-value">${conflict.theirValue}</div>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Resolve conflicts based on user selection
   */
  resolveConflicts() {
    const modal = document.querySelector('.conflict-resolution-modal');
    const conflictItems = modal.querySelectorAll('.conflict-item');
    const resolutions = {};

    conflictItems.forEach(item => {
      const field = item.dataset.field;
      const selectedOption = item.querySelector('input[type="radio"]:checked');
      
      if (selectedOption) {
        resolutions[field] = selectedOption.value;
      }
    });

    this.applyConflictResolutions(resolutions);
    modal.remove();
  }

  /**
   * Apply conflict resolutions to form
   */
  applyConflictResolutions(resolutions) {
    Object.entries(resolutions).forEach(([field, choice]) => {
      if (choice === 'theirs') {
        this.updateFieldFromServer(field);
      }
      // If choice is 'yours', keep current value (no action needed)
    });

    this.showSuccess('Conflicts resolved successfully');
  }

  /**
   * Create collaboration UI elements
   */
  createCollaborationUI() {
    if (document.getElementById('collaboration-indicators')) return;

    const collaborationUI = document.createElement('div');
    collaborationUI.id = 'collaboration-indicators';
    collaborationUI.innerHTML = `
      <div class="collaboration-panel" id="collaborationPanel" style="display: none;">
        <div class="collaboration-header">
          <span class="collaboration-title">👥 Active Collaborators</span>
          <button class="collaboration-close" onclick="offerCollaborationManager.hideCollaborationPanel()">×</button>
        </div>
        <div class="collaboration-content" id="collaborationContent">
          <!-- Collaborators will be populated here -->
        </div>
      </div>
      
      <div class="collaboration-status" id="collaborationStatus" style="display: none;">
        <div class="status-indicator"></div>
        <span class="status-text">Editing...</span>
      </div>
    `;

    document.body.appendChild(collaborationUI);
    this.addCollaborationStyles();
  }

  /**
   * Show collaboration indicator
   */
  showCollaborationIndicator(section) {
    const statusElement = document.getElementById('collaborationStatus');
    if (statusElement) {
      statusElement.style.display = 'flex';
      statusElement.querySelector('.status-text').textContent = `Editing ${section}...`;
    }
  }

  /**
   * Hide collaboration indicator
   */
  hideCollaborationIndicator() {
    const statusElement = document.getElementById('collaborationStatus');
    if (statusElement) {
      statusElement.style.display = 'none';
    }
  }

  /**
   * Update collaborator indicators
   */
  updateCollaboratorIndicators() {
    const panel = document.getElementById('collaborationPanel');
    const content = document.getElementById('collaborationContent');
    
    if (!panel || !content) return;

    if (this.activeEditors.length === 0) {
      panel.style.display = 'none';
      return;
    }

    const otherEditors = this.activeEditors.filter(editor => 
      editor.userId !== window.authContext?.user?.id
    );

    if (otherEditors.length === 0) {
      panel.style.display = 'none';
      return;
    }

    content.innerHTML = otherEditors.map(editor => `
      <div class="collaborator-item">
        <div class="collaborator-avatar">${(editor.userName || 'U').charAt(0).toUpperCase()}</div>
        <div class="collaborator-info">
          <div class="collaborator-name">${editor.userName || 'Unknown User'}</div>
          <div class="collaborator-activity">Editing ${editor.section || 'offer'}</div>
        </div>
        <div class="collaborator-status active"></div>
      </div>
    `).join('');

    panel.style.display = 'block';
  }

  /**
   * Show editor joined notification
   */
  showEditorJoinedNotification(editor) {
    const notification = document.createElement('div');
    notification.className = 'collaboration-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">👋</span>
        <span class="notification-text">${editor.userName || 'A user'} joined the editing session</span>
      </div>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: slideInFromRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  /**
   * Show version update notification
   */
  showVersionUpdateNotification(version) {
    const notification = document.createElement('div');
    notification.className = 'version-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">📝</span>
        <span class="notification-text">Offer updated by ${version.userRole}</span>
        <button class="btn btn-sm btn-secondary" onclick="window.location.reload()">Refresh</button>
      </div>
    `;

    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--info);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 6000);
  }

  /**
   * Utility methods
   */
  getOfferIdFromModal(modal) {
    // Try to get offer ID from various sources
    const negotiationModal = modal.closest('.negotiation-modal');
    if (negotiationModal && window.offerNegotiationManager?.currentOffer?._id) {
      return window.offerNegotiationManager.currentOffer._id;
    }

    const offerForm = modal.closest('.offer-form-modal');
    if (offerForm && window.offerCreationManager?.draftId) {
      return window.offerCreationManager.draftId;
    }

    return null;
  }

  getSectionFromField(field) {
    const fieldName = field.name || field.id;
    
    if (['offerName', 'description', 'creatorEmail'].includes(fieldName)) {
      return 'basic_info';
    }
    
    if (fieldName.includes('platform') || fieldName.includes('deliverable')) {
      return 'platforms_deliverables';
    }
    
    if (['startDate', 'endDate', 'desiredReviewDate', 'desiredPostDate', 'priority', 'notes'].includes(fieldName)) {
      return 'terms_timeline';
    }
    
    return 'general';
  }

  getCurrentFormData() {
    // Get current form data from active forms
    const formData = {};
    
    const inputs = document.querySelectorAll('.offer-form-modal input, .offer-form-modal select, .offer-form-modal textarea, .negotiation-modal input, .negotiation-modal select, .negotiation-modal textarea');
    
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        formData[input.name || input.id] = input.checked;
      } else {
        formData[input.name || input.id] = input.value;
      }
    });
    
    return formData;
  }

  updateFieldFromServer(fieldName) {
    // This would need to fetch the latest value from server and update the field
    // For now, just refresh the page
    window.location.reload();
  }

  formatFieldName(fieldName) {
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  refreshCollaborationSession() {
    if (this.collaborationSession) {
      this.pollCollaborationUpdates();
    }
  }

  hideCollaborationPanel() {
    const panel = document.getElementById('collaborationPanel');
    if (panel) {
      panel.style.display = 'none';
    }
  }

  showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 10001;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * Add collaboration styles
   */
  addCollaborationStyles() {
    if (document.getElementById('collaboration-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'collaboration-styles';
    styles.textContent = `
      .collaboration-panel {
        position: fixed;
        top: 100px;
        right: 20px;
        width: 300px;
        background: white;
        border: 1px solid var(--gray-200);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 1000;
      }
      
      .collaboration-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--gray-200);
        background: var(--gray-50);
        border-radius: 12px 12px 0 0;
      }
      
      .collaboration-title {
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .collaboration-close {
        background: none;
        border: none;
        font-size: 20px;
        color: var(--text-secondary);
        cursor: pointer;
      }
      
      .collaboration-content {
        padding: 16px 20px;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .collaborator-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--gray-100);
      }
      
      .collaborator-item:last-child {
        border-bottom: none;
      }
      
      .collaborator-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
      }
      
      .collaborator-info {
        flex: 1;
      }
      
      .collaborator-name {
        font-weight: 500;
        color: var(--text-primary);
        font-size: 14px;
      }
      
      .collaborator-activity {
        color: var(--text-secondary);
        font-size: 12px;
      }
      
      .collaborator-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--success);
      }
      
      .collaboration-status {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 12px 20px;
        border-radius: 24px;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
      }
      
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: white;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes slideInFromRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Add conflict modal styles
   */
  addConflictModalStyles() {
    if (document.getElementById('conflict-modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'conflict-modal-styles';
    styles.textContent = `
      .conflict-resolution-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      
      .conflict-modal-container {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .conflict-modal-header {
        padding: 24px;
        border-bottom: 1px solid var(--gray-200);
      }
      
      .conflict-modal-header h3 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }
      
      .conflict-modal-header p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
      }
      
      .conflict-modal-body {
        padding: 24px;
      }
      
      .conflict-item {
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 1px solid var(--gray-100);
      }
      
      .conflict-item:last-child {
        margin-bottom: 0;
        border-bottom: none;
      }
      
      .conflict-field-name {
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 12px;
      }
      
      .conflict-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .conflict-option {
        border: 1px solid var(--gray-200);
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .conflict-option:hover {
        border-color: var(--primary-color);
        background: rgba(99, 102, 241, 0.05);
      }
      
      .conflict-option label {
        cursor: pointer;
        width: 100%;
        display: block;
      }
      
      .conflict-value {
        background: var(--gray-50);
        padding: 8px 12px;
        border-radius: 4px;
        margin-top: 8px;
        font-family: monospace;
        font-size: 13px;
        color: var(--text-secondary);
      }
      
      .conflict-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        padding: 20px 24px;
        border-top: 1px solid var(--gray-200);
      }
    `;

    document.head.appendChild(styles);
  }

  /**
   * Cleanup
   */
  destroy() {
    this.stopCollaborationPolling();
    this.endCollaboration();
  }
}

// Initialize the collaboration manager
window.offerCollaborationManager = new OfferCollaborationManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.offerCollaborationManager) {
    window.offerCollaborationManager.destroy();
  }
});
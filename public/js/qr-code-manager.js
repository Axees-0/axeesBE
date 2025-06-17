/**
 * QR Code Manager
 * Handles QR code generation, scanning, and management for Phase 8 implementation
 */

class QRCodeManager {
    constructor() {
        this.apiBase = '/api/qr';
        this.currentQRData = null;
        this.scannerActive = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadQRHistory();
    }

    setupEventListeners() {
        // Generate QR Code buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-qr-action="generate-profile"]')) {
                this.showProfileQRModal();
            } else if (e.target.matches('[data-qr-action="generate-deal"]')) {
                const dealId = e.target.dataset.dealId;
                if (dealId) this.showDealQRModal(dealId);
            } else if (e.target.matches('[data-qr-action="scan"]')) {
                this.showScanModal();
            } else if (e.target.matches('[data-qr-action="download"]')) {
                this.downloadQRCode();
            } else if (e.target.matches('[data-qr-action="share"]')) {
                this.shareQRCode();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#profile-qr-form')) {
                e.preventDefault();
                this.generateProfileQR(new FormData(e.target));
            } else if (e.target.matches('#deal-qr-form')) {
                e.preventDefault();
                this.generateDealQR(new FormData(e.target));
            }
        });
    }

    /**
     * Show Profile QR Generation Modal
     */
    showProfileQRModal() {
        const modal = this.createModal('profile-qr-modal', 'Generate Profile QR Code', `
            <form id="profile-qr-form" class="qr-form">
                <div class="form-group">
                    <label for="qr-purpose">Purpose:</label>
                    <select id="qr-purpose" name="purpose" required>
                        <option value="profile">Profile View</option>
                        <option value="connect">Connection Request</option>
                        <option value="contact">Contact Information</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="qr-expires">Expires In (hours):</label>
                    <select id="qr-expires" name="expiresIn">
                        <option value="24">24 Hours</option>
                        <option value="72">3 Days</option>
                        <option value="168">1 Week</option>
                        <option value="720">30 Days</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Generate QR Code</button>
                </div>
            </form>
            
            <div id="qr-result" class="qr-result" style="display: none;">
                <div class="qr-display">
                    <img id="qr-image" src="" alt="QR Code">
                    <div class="qr-actions">
                        <button type="button" class="btn btn-secondary" data-qr-action="download">Download</button>
                        <button type="button" class="btn btn-secondary" data-qr-action="share">Share</button>
                        <button type="button" class="btn btn-primary" onclick="navigator.clipboard.writeText(this.dataset.url)">Copy Link</button>
                    </div>
                </div>
                <div class="qr-details">
                    <p><strong>Purpose:</strong> <span id="qr-purpose-display"></span></p>
                    <p><strong>Expires:</strong> <span id="qr-expires-display"></span></p>
                    <p><strong>Share URL:</strong> <input type="text" id="qr-share-url" readonly></p>
                </div>
            </div>
        `);
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Show Deal QR Generation Modal
     */
    showDealQRModal(dealId) {
        const modal = this.createModal('deal-qr-modal', 'Generate Deal QR Code', `
            <form id="deal-qr-form" class="qr-form">
                <input type="hidden" name="dealId" value="${dealId}">
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="includePayment" value="true">
                        Include Payment Information
                    </label>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="includeStatus" value="true" checked>
                        Include Deal Status
                    </label>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Generate QR Code</button>
                </div>
            </form>
            
            <div id="deal-qr-result" class="qr-result" style="display: none;">
                <div class="qr-display">
                    <img id="deal-qr-image" src="" alt="Deal QR Code">
                    <div class="qr-actions">
                        <button type="button" class="btn btn-secondary" data-qr-action="download">Download</button>
                        <button type="button" class="btn btn-secondary" data-qr-action="share">Share</button>
                        <button type="button" class="btn btn-primary" onclick="navigator.clipboard.writeText(this.dataset.url)">Copy Link</button>
                    </div>
                </div>
                <div class="qr-details">
                    <p><strong>Deal:</strong> <span id="deal-name-display"></span></p>
                    <p><strong>Tracking URL:</strong> <input type="text" id="deal-tracking-url" readonly></p>
                </div>
            </div>
        `);
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Show QR Code Scanner Modal
     */
    showScanModal() {
        const modal = this.createModal('qr-scan-modal', 'Scan QR Code', `
            <div class="qr-scanner">
                <div class="scanner-options">
                    <button type="button" class="btn btn-primary" onclick="qrCodeManager.startCameraScanner()">Use Camera</button>
                    <button type="button" class="btn btn-secondary" onclick="qrCodeManager.showManualInput()">Enter Manually</button>
                </div>
                
                <div id="camera-scanner" style="display: none;">
                    <div id="qr-video-container">
                        <video id="qr-video" autoplay></video>
                        <div class="scanner-overlay">
                            <div class="scanner-frame"></div>
                        </div>
                    </div>
                    <div class="scanner-controls">
                        <button type="button" class="btn btn-secondary" onclick="qrCodeManager.stopScanner()">Stop Scanner</button>
                    </div>
                </div>
                
                <div id="manual-input" style="display: none;">
                    <div class="form-group">
                        <label for="manual-qr-data">QR Code Data or URL:</label>
                        <textarea id="manual-qr-data" placeholder="Paste QR code data or URL here..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="manual-qr-token">Security Token (if available):</label>
                        <input type="text" id="manual-qr-token" placeholder="Enter security token...">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-primary" onclick="qrCodeManager.processManualInput()">Scan</button>
                    </div>
                </div>
                
                <div id="scan-result" class="scan-result" style="display: none;">
                    <!-- Scan results will be displayed here -->
                </div>
            </div>
        `);
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Generate Profile QR Code
     */
    async generateProfileQR(formData) {
        try {
            this.showLoading('Generating QR code...');
            
            const response = await apiManager.makeRequest('/api/qr/user/generate', {
                method: 'POST',
                body: JSON.stringify({
                    purpose: formData.get('purpose'),
                    expiresIn: parseInt(formData.get('expiresIn'))
                })
            });

            if (response.success) {
                this.displayQRResult(response.data.qrCode, 'profile');
            } else {
                throw new Error(response.message || 'Failed to generate QR code');
            }
        } catch (error) {
            console.error('Error generating profile QR:', error);
            this.showError('Failed to generate QR code: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Generate Deal QR Code
     */
    async generateDealQR(formData) {
        try {
            this.showLoading('Generating deal QR code...');
            
            const dealId = formData.get('dealId');
            const response = await apiManager.makeRequest(`/api/qr/deal/${dealId}/generate`, {
                method: 'POST',
                body: JSON.stringify({
                    includePayment: formData.get('includePayment') === 'true',
                    includeStatus: formData.get('includeStatus') === 'true'
                })
            });

            if (response.success) {
                this.displayQRResult(response.data.qrCode, 'deal', response.data.deal);
            } else {
                throw new Error(response.message || 'Failed to generate deal QR code');
            }
        } catch (error) {
            console.error('Error generating deal QR:', error);
            this.showError('Failed to generate deal QR code: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Display QR Code Result
     */
    displayQRResult(qrData, type, additionalData = null) {
        const resultDiv = document.getElementById(type === 'deal' ? 'deal-qr-result' : 'qr-result');
        const formDiv = document.getElementById(type === 'deal' ? 'deal-qr-form' : 'profile-qr-form');
        
        // Hide form and show result
        formDiv.style.display = 'none';
        resultDiv.style.display = 'block';
        
        // Set QR code image
        const imgElement = document.getElementById(type === 'deal' ? 'deal-qr-image' : 'qr-image');
        imgElement.src = qrData.apiUrl || qrData.dataUrl;
        
        // Store QR data for download/share
        this.currentQRData = qrData;
        
        // Update details
        if (type === 'profile') {
            document.getElementById('qr-purpose-display').textContent = qrData.purpose;
            document.getElementById('qr-expires-display').textContent = new Date(qrData.expiresAt).toLocaleString();
            document.getElementById('qr-share-url').value = qrData.shareUrl;
        } else if (type === 'deal') {
            document.getElementById('deal-name-display').textContent = additionalData?.dealName || 'Unknown Deal';
            document.getElementById('deal-tracking-url').value = qrData.trackingUrl;
        }
        
        // Set download/share URLs on buttons
        const downloadBtn = resultDiv.querySelector('[data-qr-action="download"]');
        const shareBtn = resultDiv.querySelector('[data-qr-action="share"]');
        const copyBtn = resultDiv.querySelector('.btn-primary');
        
        if (downloadBtn) downloadBtn.dataset.url = qrData.apiUrl || qrData.dataUrl;
        if (shareBtn) shareBtn.dataset.url = qrData.shareUrl || qrData.trackingUrl;
        if (copyBtn) copyBtn.dataset.url = qrData.shareUrl || qrData.trackingUrl;
    }

    /**
     * Start camera-based QR scanner
     */
    async startCameraScanner() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            const video = document.getElementById('qr-video');
            video.srcObject = stream;
            
            document.getElementById('camera-scanner').style.display = 'block';
            document.querySelector('.scanner-options').style.display = 'none';
            
            this.scannerActive = true;
            this.startQRDetection(video);
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('Could not access camera. Please use manual input instead.');
            this.showManualInput();
        }
    }

    /**
     * Start QR code detection from video stream
     */
    startQRDetection(video) {
        if (!this.scannerActive) return;
        
        // Simple QR detection - in production, use a QR code library like jsQR
        // For now, we'll simulate detection and provide manual input
        setTimeout(() => {
            if (this.scannerActive) {
                this.startQRDetection(video);
            }
        }, 100);
    }

    /**
     * Stop QR scanner
     */
    stopScanner() {
        this.scannerActive = false;
        const video = document.getElementById('qr-video');
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        
        document.getElementById('camera-scanner').style.display = 'none';
        document.querySelector('.scanner-options').style.display = 'block';
    }

    /**
     * Show manual QR input
     */
    showManualInput() {
        document.querySelector('.scanner-options').style.display = 'none';
        document.getElementById('manual-input').style.display = 'block';
    }

    /**
     * Process manual QR input
     */
    async processManualInput() {
        const qrData = document.getElementById('manual-qr-data').value.trim();
        const token = document.getElementById('manual-qr-token').value.trim();
        
        if (!qrData) {
            this.showError('Please enter QR code data or URL');
            return;
        }
        
        await this.scanQRCode(qrData, token);
    }

    /**
     * Scan QR Code
     */
    async scanQRCode(qrData, token) {
        try {
            this.showLoading('Scanning QR code...');
            
            const response = await apiManager.makeRequest('/api/qr/scan', {
                method: 'POST',
                body: JSON.stringify({ qrData, token })
            });

            if (response.success) {
                this.displayScanResult(response.data);
            } else {
                throw new Error(response.message || 'QR code scan failed');
            }
        } catch (error) {
            console.error('Error scanning QR code:', error);
            this.showError('Failed to scan QR code: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Display QR scan result
     */
    displayScanResult(data) {
        const resultDiv = document.getElementById('scan-result');
        
        let content = '';
        
        if (data.type === 'user_profile') {
            content = `
                <div class="scan-user-result">
                    <h3>User Profile</h3>
                    <div class="user-info">
                        <img src="${data.user.profilePicture || '/img/default-avatar.png'}" alt="Profile" class="user-avatar">
                        <div class="user-details">
                            <h4>${data.user.userName}</h4>
                            <p class="user-type">${data.user.userType}</p>
                            <p class="user-bio">${data.user.bio || ''}</p>
                        </div>
                    </div>
                    ${data.user.canConnect ? `
                        <div class="scan-actions">
                            <button class="btn btn-primary" onclick="window.location.href='${data.actions.viewProfile}'">View Profile</button>
                            <button class="btn btn-secondary" onclick="qrCodeManager.initiateConnection('${data.user.id}')">Connect</button>
                        </div>
                    ` : '<p class="info">This is your own profile.</p>'}
                </div>
            `;
        } else if (data.type === 'deal_tracking') {
            content = `
                <div class="scan-deal-result">
                    <h3>Deal Tracking</h3>
                    <div class="deal-info">
                        <h4>${data.deal.dealName}</h4>
                        <p><strong>Deal #:</strong> ${data.deal.dealNumber}</p>
                        <p><strong>Status:</strong> <span class="deal-status status-${data.deal.status}">${data.deal.status}</span></p>
                        <p><strong>Creator:</strong> ${data.deal.creator.userName}</p>
                        <p><strong>Marketer:</strong> ${data.deal.marketer.userName}</p>
                        
                        ${data.deal.payment ? `
                            <div class="deal-payment">
                                <h5>Payment Information</h5>
                                <p><strong>Amount:</strong> $${data.deal.payment.amount}</p>
                                <p><strong>Status:</strong> ${data.deal.payment.status}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${data.actions ? `
                        <div class="scan-actions">
                            <button class="btn btn-primary" onclick="window.location.href='${data.actions.viewDetails}'">View Details</button>
                            ${data.actions.viewPayment ? `<button class="btn btn-secondary" onclick="window.location.href='${data.actions.viewPayment}'">View Payment</button>` : ''}
                        </div>
                    ` : `
                        <p class="info">${data.message || 'Limited access to this deal.'}</p>
                    `}
                </div>
            `;
        }
        
        resultDiv.innerHTML = content;
        resultDiv.style.display = 'block';
        
        // Hide other sections
        document.getElementById('camera-scanner').style.display = 'none';
        document.getElementById('manual-input').style.display = 'none';
        document.querySelector('.scanner-options').style.display = 'none';
    }

    /**
     * Initiate connection from QR scan
     */
    async initiateConnection(userId) {
        try {
            const response = await apiManager.makeRequest(`/api/users/connect/${userId}`, {
                method: 'POST'
            });
            
            if (response.success) {
                this.showSuccess('Connection request sent successfully!');
                setTimeout(() => {
                    document.querySelector('.modal').remove();
                }, 2000);
            } else {
                throw new Error(response.message || 'Failed to send connection request');
            }
        } catch (error) {
            console.error('Error sending connection request:', error);
            this.showError('Failed to send connection request: ' + error.message);
        }
    }

    /**
     * Download QR Code
     */
    downloadQRCode() {
        if (!this.currentQRData) {
            this.showError('No QR code to download');
            return;
        }
        
        const link = document.createElement('a');
        link.href = this.currentQRData.apiUrl || this.currentQRData.dataUrl;
        link.download = `axees-qr-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Share QR Code
     */
    async shareQRCode() {
        if (!this.currentQRData) {
            this.showError('No QR code to share');
            return;
        }
        
        const shareData = {
            title: 'Axees QR Code',
            text: 'Scan this QR code to connect with me on Axees',
            url: this.currentQRData.shareUrl || this.currentQRData.trackingUrl
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Share cancelled or failed:', error);
            }
        } else {
            // Fallback to clipboard
            await navigator.clipboard.writeText(shareData.url);
            this.showSuccess('QR code URL copied to clipboard!');
        }
    }

    /**
     * Load QR Code History
     */
    async loadQRHistory() {
        try {
            const response = await apiManager.makeRequest('/api/qr/history');
            if (response.success) {
                this.displayQRHistory(response.data);
            }
        } catch (error) {
            console.error('Error loading QR history:', error);
        }
    }

    /**
     * Display QR History
     */
    displayQRHistory(history) {
        const historyContainer = document.getElementById('qr-history');
        if (!historyContainer) return;
        
        let content = '<h3>QR Code History</h3>';
        
        if (history.profile) {
            content += `
                <div class="qr-history-section">
                    <h4>Profile QR Code</h4>
                    <p><strong>Purpose:</strong> ${history.profile.purpose}</p>
                    <p><strong>Generated:</strong> ${new Date(history.profile.lastGenerated).toLocaleString()}</p>
                    <p><strong>Status:</strong> ${history.profile.isExpired ? 'Expired' : 'Active'}</p>
                </div>
            `;
        }
        
        if (history.deals && history.deals.length > 0) {
            content += '<div class="qr-history-section"><h4>Deal QR Codes</h4>';
            history.deals.forEach(deal => {
                content += `
                    <div class="qr-history-item">
                        <p><strong>${deal.dealName}</strong> (#${deal.dealNumber})</p>
                        <p>Generated: ${new Date(deal.generatedAt).toLocaleString()}</p>
                    </div>
                `;
            });
            content += '</div>';
        }
        
        historyContainer.innerHTML = content;
    }

    /**
     * Create Modal
     */
    createModal(id, title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal qr-modal';
        modal.id = id;
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }

    /**
     * Utility methods
     */
    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.textContent = message;
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    showError(message) {
        console.error(message);
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            alert('Success: ' + message);
        }
    }
}

// Initialize QR Code Manager
window.qrCodeManager = new QRCodeManager();

// CSS Styles
const qrStyles = `
<style>
.qr-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.qr-modal .modal-content {
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.qr-modal .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
    border-bottom: 1px solid var(--gray-200);
    padding-bottom: var(--space-3);
}

.qr-modal .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--text-secondary);
}

.qr-form .form-group {
    margin-bottom: var(--space-4);
}

.qr-form label {
    display: block;
    font-weight: var(--font-medium);
    margin-bottom: var(--space-1);
    color: var(--text-primary);
}

.qr-form input, .qr-form select, .qr-form textarea {
    width: 100%;
    padding: var(--space-2);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
}

.qr-form .form-actions {
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
    margin-top: var(--space-6);
}

.qr-result {
    text-align: center;
}

.qr-display {
    margin-bottom: var(--space-4);
}

.qr-display img {
    max-width: 300px;
    width: 100%;
    height: auto;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-md);
}

.qr-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
    margin-top: var(--space-3);
}

.qr-details {
    text-align: left;
    background: var(--gray-50);
    padding: var(--space-4);
    border-radius: var(--radius-md);
}

.qr-details input {
    width: 100%;
    padding: var(--space-1);
    font-size: var(--text-sm);
    border: 1px solid var(--gray-300);
    border-radius: var(--radius-md);
}

.qr-scanner {
    text-align: center;
}

.scanner-options {
    display: flex;
    gap: var(--space-3);
    justify-content: center;
    margin-bottom: var(--space-4);
}

#qr-video-container {
    position: relative;
    display: inline-block;
    margin-bottom: var(--space-3);
}

#qr-video {
    max-width: 100%;
    max-height: 300px;
    border-radius: var(--radius-md);
}

.scanner-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
}

.scanner-frame {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    border: 2px solid var(--primary-color);
    border-radius: var(--radius-md);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.3);
}

.scan-result {
    text-align: left;
    background: var(--gray-50);
    padding: var(--space-4);
    border-radius: var(--radius-md);
}

.scan-user-result, .scan-deal-result {
    margin-bottom: var(--space-3);
}

.user-info {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
}

.user-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
}

.user-details h4 {
    margin: 0 0 var(--space-1) 0;
    color: var(--text-primary);
}

.user-type {
    color: var(--primary-color);
    font-weight: var(--font-medium);
    margin: 0 0 var(--space-1) 0;
}

.deal-status {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-md);
    font-weight: var(--font-medium);
    font-size: var(--text-sm);
}

.status-active {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.status-pending {
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning);
}

.status-completed {
    background: rgba(99, 102, 241, 0.1);
    color: var(--primary-color);
}

.scan-actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
}

.qr-history-section {
    margin-bottom: var(--space-6);
    padding: var(--space-4);
    background: var(--bg-card);
    border-radius: var(--radius-md);
    border: 1px solid var(--gray-200);
}

.qr-history-item {
    padding: var(--space-2);
    border-bottom: 1px solid var(--gray-100);
}

.qr-history-item:last-child {
    border-bottom: none;
}

@media (max-width: 768px) {
    .qr-modal .modal-content {
        width: 95%;
        padding: var(--space-4);
    }
    
    .qr-form .form-actions {
        flex-direction: column;
    }
    
    .qr-actions {
        flex-direction: column;
    }
    
    .scanner-options {
        flex-direction: column;
    }
    
    .scan-actions {
        flex-direction: column;
    }
    
    .user-info {
        flex-direction: column;
        text-align: center;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', qrStyles);

/**
 * QR Code Bulk Generation Extension
 * Provides bulk QR code generation for multiple deals
 */
class QRBulkGenerator {
    constructor(qrManager) {
        this.qrManager = qrManager;
        this.selectedDeals = new Set();
        this.generationProgress = 0;
        this.totalDeals = 0;
        this.init();
    }

    init() {
        // Add bulk generation button to deal management pages
        this.addBulkGenerationUI();
    }

    /**
     * Add bulk generation UI to deal management pages
     */
    addBulkGenerationUI() {
        // Add to dashboard QR tools if it exists
        const qrToolsGrid = document.querySelector('.qr-tools-grid');
        if (qrToolsGrid) {
            const bulkButton = document.createElement('button');
            bulkButton.className = 'qr-tool-btn';
            bulkButton.innerHTML = `
                <div class="qr-tool-icon">📋</div>
                <div class="qr-tool-text">
                    <h4>Bulk Generate</h4>
                    <p>Multiple deal QRs</p>
                </div>
            `;
            bulkButton.onclick = () => this.showBulkGenerationModal();
            qrToolsGrid.appendChild(bulkButton);
        }

        // Add bulk generation button to deal management page
        const dealManagementHeader = document.querySelector('.page-header');
        if (dealManagementHeader && window.location.pathname.includes('deal-management')) {
            const buttonContainer = dealManagementHeader.querySelector('div[style*="display: flex"]');
            if (buttonContainer) {
                const bulkButton = document.createElement('button');
                bulkButton.className = 'btn btn-secondary';
                bulkButton.innerHTML = '📱 Bulk QR Generation';
                bulkButton.onclick = () => this.showBulkGenerationModal();
                buttonContainer.insertBefore(bulkButton, buttonContainer.firstChild);
            }
        }
    }

    /**
     * Show bulk generation modal
     */
    async showBulkGenerationModal() {
        try {
            // Load user's deals
            const deals = await this.loadUserDeals();
            
            if (!deals || deals.length === 0) {
                this.qrManager.showError('No deals found for QR generation');
                return;
            }

            const modal = document.createElement('div');
            modal.className = 'qr-modal modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h2>Bulk QR Code Generation</h2>
                        <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="bulk-generation-intro">
                            <p style="margin-bottom: var(--space-4); color: var(--text-secondary);">
                                Generate QR codes for multiple deals at once. Select the deals you want to create QR codes for.
                            </p>
                            
                            <div class="bulk-actions" style="display: flex; gap: var(--space-3); margin-bottom: var(--space-6);">
                                <button class="btn btn-secondary" onclick="qrBulkGenerator.selectAllDeals(true)">
                                    ✅ Select All
                                </button>
                                <button class="btn btn-secondary" onclick="qrBulkGenerator.selectAllDeals(false)">
                                    ❌ Deselect All
                                </button>
                                <div style="margin-left: auto;">
                                    <span style="color: var(--text-secondary);">
                                        <span id="selected-count">0</span> of ${deals.length} deals selected
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="deals-selection" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--gray-200); border-radius: var(--radius-md);">
                            ${deals.map(deal => this.createDealSelectionCard(deal)).join('')}
                        </div>

                        <div class="generation-progress" id="generation-progress" style="display: none; margin-top: var(--space-6);">
                            <h4>Generating QR Codes...</h4>
                            <div class="progress-bar" style="background: var(--gray-200); height: 8px; border-radius: 4px; overflow: hidden;">
                                <div class="progress-fill" id="progress-fill" style="background: var(--primary-color); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                            </div>
                            <p id="progress-text" style="margin-top: var(--space-2); color: var(--text-secondary);">Preparing...</p>
                        </div>

                        <div class="generation-results" id="generation-results" style="display: none; margin-top: var(--space-6);">
                            <!-- Results will be displayed here -->
                        </div>
                    </div>
                    
                    <div class="modal-footer" style="display: flex; gap: var(--space-3); justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="generate-bulk-btn" onclick="qrBulkGenerator.startBulkGeneration()" disabled>
                            📱 Generate QR Codes
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.setupDealSelection();

        } catch (error) {
            console.error('Error showing bulk generation modal:', error);
            this.qrManager.showError('Failed to load deals for bulk generation');
        }
    }

    /**
     * Create deal selection card
     */
    createDealSelectionCard(deal) {
        const statusClass = deal.status ? `status-${deal.status}` : 'status-pending';
        const amount = deal.paymentInfo?.paymentAmount || deal.proposedAmount || 0;
        
        return `
            <div class="deal-selection-item" style="display: flex; align-items: center; padding: var(--space-3); border-bottom: 1px solid var(--gray-100);">
                <input type="checkbox" id="deal-${deal._id}" value="${deal._id}" class="deal-checkbox" style="margin-right: var(--space-3);">
                <div class="deal-selection-info" style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h4 style="margin: 0 0 var(--space-1) 0; font-size: var(--text-base);">
                                ${deal.dealName || deal.title || 'Untitled Deal'}
                            </h4>
                            <p style="margin: 0; font-size: var(--text-sm); color: var(--text-secondary);">
                                Deal #${deal.dealNumber || deal._id.slice(-6)}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: var(--font-semibold); color: var(--success);">
                                $${amount.toLocaleString()}
                            </div>
                            <span class="deal-status ${statusClass}" style="font-size: var(--text-sm);">
                                ${deal.status || 'pending'}
                            </span>
                        </div>
                    </div>
                    <div style="margin-top: var(--space-2); font-size: var(--text-sm); color: var(--text-muted);">
                        Created: ${new Date(deal.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup deal selection handlers
     */
    setupDealSelection() {
        const checkboxes = document.querySelectorAll('.deal-checkbox');
        const generateBtn = document.getElementById('generate-bulk-btn');
        const selectedCount = document.getElementById('selected-count');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelectedDeals();
            });
        });
    }

    /**
     * Update selected deals count and button state
     */
    updateSelectedDeals() {
        const checkboxes = document.querySelectorAll('.deal-checkbox:checked');
        const generateBtn = document.getElementById('generate-bulk-btn');
        const selectedCount = document.getElementById('selected-count');

        this.selectedDeals.clear();
        checkboxes.forEach(cb => this.selectedDeals.add(cb.value));

        selectedCount.textContent = this.selectedDeals.size;
        generateBtn.disabled = this.selectedDeals.size === 0;
    }

    /**
     * Select/deselect all deals
     */
    selectAllDeals(select) {
        const checkboxes = document.querySelectorAll('.deal-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = select;
        });
        this.updateSelectedDeals();
    }

    /**
     * Start bulk generation process
     */
    async startBulkGeneration() {
        if (this.selectedDeals.size === 0) return;

        const progressSection = document.getElementById('generation-progress');
        const resultsSection = document.getElementById('generation-results');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const generateBtn = document.getElementById('generate-bulk-btn');

        // Show progress section
        progressSection.style.display = 'block';
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';

        this.totalDeals = this.selectedDeals.size;
        this.generationProgress = 0;
        const results = [];

        try {
            for (const dealId of this.selectedDeals) {
                progressText.textContent = `Generating QR code ${this.generationProgress + 1} of ${this.totalDeals}...`;
                
                try {
                    const qrData = await this.qrManager.generateQRCode('deal', dealId);
                    results.push({
                        dealId,
                        success: true,
                        qrData
                    });
                } catch (error) {
                    console.error(`Failed to generate QR for deal ${dealId}:`, error);
                    results.push({
                        dealId,
                        success: false,
                        error: error.message
                    });
                }

                this.generationProgress++;
                const progressPercent = (this.generationProgress / this.totalDeals) * 100;
                progressFill.style.width = `${progressPercent}%`;

                // Small delay to prevent overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Show results
            this.displayBulkResults(results);
            progressText.textContent = 'Generation complete!';
            
        } catch (error) {
            console.error('Bulk generation error:', error);
            progressText.textContent = 'Generation failed!';
            this.qrManager.showError('Bulk generation failed: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = '📱 Generate QR Codes';
        }
    }

    /**
     * Display bulk generation results
     */
    displayBulkResults(results) {
        const resultsSection = document.getElementById('generation-results');
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        resultsSection.innerHTML = `
            <h4>Generation Results</h4>
            <div style="display: flex; gap: var(--space-4); margin-bottom: var(--space-4);">
                <div style="color: var(--success);">✅ ${successCount} successful</div>
                <div style="color: var(--error);">❌ ${failureCount} failed</div>
            </div>

            ${successCount > 0 ? `
                <div style="margin-bottom: var(--space-4);">
                    <button class="btn btn-primary" onclick="qrBulkGenerator.downloadAllQRs([${results.filter(r => r.success).map(r => `'${r.qrData.id}'`).join(',')}])">
                        📥 Download All QR Codes
                    </button>
                </div>
            ` : ''}

            <div class="results-list" style="max-height: 300px; overflow-y: auto;">
                ${results.map(result => `
                    <div class="result-item" style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2); border-bottom: 1px solid var(--gray-100);">
                        <span>Deal ${result.dealId.slice(-6)}</span>
                        <span>${result.success ? 
                            '<span style="color: var(--success);">✅ Success</span>' : 
                            `<span style="color: var(--error);">❌ ${result.error}</span>`
                        }</span>
                    </div>
                `).join('')}
            </div>
        `;

        resultsSection.style.display = 'block';
    }

    /**
     * Download all generated QR codes
     */
    async downloadAllQRs(qrIds) {
        try {
            // Create a zip file with all QR codes
            this.qrManager.showSuccess('Preparing download of all QR codes...');
            
            // In a real implementation, this would call an API endpoint
            // that creates a zip file with all the QR codes
            alert('QR code download feature would:\n\n📦 Package all QR codes into a ZIP file\n📥 Include metadata for each QR code\n🏷️ Name files with deal numbers\n💾 Start automatic download');
            
        } catch (error) {
            console.error('Error downloading QR codes:', error);
            this.qrManager.showError('Failed to download QR codes');
        }
    }

    /**
     * Load user's deals for selection
     */
    async loadUserDeals() {
        try {
            // Try to get deals from the deal manager if available
            if (window.dealManager && window.dealManager.deals) {
                return window.dealManager.deals;
            }

            // Otherwise try to fetch from API
            const response = await apiManager.makeRequest('/api/deals');
            if (response.success) {
                return response.deals || [];
            }

            // Fallback to mock data
            return this.getMockDeals();
            
        } catch (error) {
            console.error('Error loading deals:', error);
            return this.getMockDeals();
        }
    }

    /**
     * Get mock deals for demo
     */
    getMockDeals() {
        return [
            {
                _id: 'deal1',
                dealName: 'Summer Fashion Campaign',
                dealNumber: 'DL001',
                status: 'active',
                paymentInfo: { paymentAmount: 2500 },
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            {
                _id: 'deal2',
                dealName: 'Tech Product Review',
                dealNumber: 'DL002',
                status: 'pending',
                paymentInfo: { paymentAmount: 1800 },
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            },
            {
                _id: 'deal3',
                dealName: 'Lifestyle Brand Partnership',
                dealNumber: 'DL003',
                status: 'completed',
                paymentInfo: { paymentAmount: 3200 },
                createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
            }
        ];
    }
}

// Initialize QR bulk generator when QR manager is ready
window.addEventListener('load', () => {
    if (window.qrCodeManager) {
        window.qrBulkGenerator = new QRBulkGenerator(window.qrCodeManager);
    }
});
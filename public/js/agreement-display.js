/**
 * Agreement Display Manager
 * Handles AI-powered agreement summaries with critical term highlighting for Phase 8
 */

class AgreementDisplayManager {
    constructor() {
        this.apiBase = '/api/agreements';
        this.currentAgreement = null;
        this.expandedSections = new Set();
        this.highlightedTerms = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.injectStyles();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-agreement-action="view-deal"]')) {
                const dealId = e.target.dataset.dealId;
                if (dealId) this.showDealAgreement(dealId);
            } else if (e.target.matches('[data-agreement-action="view-offer"]')) {
                const offerId = e.target.dataset.offerId;
                if (offerId) this.showOfferAgreement(offerId);
            } else if (e.target.matches('[data-agreement-action="accept"]')) {
                this.handleAcceptance();
            } else if (e.target.matches('[data-agreement-action="download"]')) {
                this.downloadAgreement();
            } else if (e.target.matches('[data-agreement-action="compare"]')) {
                this.showComparisonModal();
            } else if (e.target.matches('.agreement-section-toggle')) {
                this.toggleSection(e.target.dataset.section);
            } else if (e.target.matches('.critical-term-highlight')) {
                this.showTermDetails(e.target.dataset.termId);
            }
        });
    }

    /**
     * Show Deal Agreement Summary
     */
    async showDealAgreement(dealId, format = 'detailed') {
        try {
            this.showLoading('Loading agreement summary...');
            
            const response = await apiManager.makeRequest(`${this.apiBase}/deals/${dealId}/summary?format=${format}&includeHistory=true`);
            
            if (response.success) {
                this.currentAgreement = {
                    type: 'deal',
                    id: dealId,
                    data: response.data
                };
                
                await this.loadKeyTerms(dealId, null);
                this.displayAgreement();
            } else {
                throw new Error(response.message || 'Failed to load agreement');
            }
        } catch (error) {
            console.error('Error loading deal agreement:', error);
            this.showError('Failed to load agreement: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Show Offer Agreement Summary
     */
    async showOfferAgreement(offerId, format = 'detailed') {
        try {
            this.showLoading('Loading offer summary...');
            
            const response = await apiManager.makeRequest(`${this.apiBase}/offers/${offerId}/summary?format=${format}&includeNegotiation=true`);
            
            if (response.success) {
                this.currentAgreement = {
                    type: 'offer',
                    id: offerId,
                    data: response.data
                };
                
                await this.loadKeyTerms(null, offerId);
                this.displayAgreement();
            } else {
                throw new Error(response.message || 'Failed to load offer');
            }
        } catch (error) {
            console.error('Error loading offer agreement:', error);
            this.showError('Failed to load offer: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Load Key Terms and Highlights
     */
    async loadKeyTerms(dealId, offerId) {
        try {
            const endpoint = dealId ? 
                `${this.apiBase}/deals/${dealId}/key-terms` : 
                `${this.apiBase}/offers/${offerId}/key-terms`;
            
            const response = await apiManager.makeRequest(`${endpoint}?highlightType=important&userContext=true`);
            
            if (response.success) {
                this.highlightedTerms = response.data.keyTerms;
            }
        } catch (error) {
            console.error('Error loading key terms:', error);
        }
    }

    /**
     * Display Agreement Summary
     */
    displayAgreement() {
        const agreement = this.currentAgreement.data.agreement;
        const userRole = this.currentAgreement.data.userRole;
        
        const modalContent = this.createAgreementModal(agreement, userRole);
        document.body.appendChild(modalContent);
        modalContent.style.display = 'flex';
    }

    /**
     * Create Agreement Modal
     */
    createAgreementModal(agreement, userRole) {
        const modal = document.createElement('div');
        modal.className = 'modal agreement-modal';
        modal.innerHTML = `
            <div class="modal-content agreement-content">
                <div class="modal-header agreement-header">
                    <div class="agreement-title-section">
                        <h2>${agreement.header.title}</h2>
                        <div class="agreement-meta">
                            <span class="agreement-status status-${agreement.header.status}" style="background-color: ${agreement.header.statusColor}">
                                ${agreement.header.status.toUpperCase()}
                            </span>
                            <span class="agreement-number">#${agreement.header.dealNumber || agreement.header.offerNumber}</span>
                            <span class="agreement-date">${new Date(agreement.header.createdDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="agreement-actions">
                        <button type="button" class="btn btn-secondary" data-agreement-action="download">
                            📥 Download
                        </button>
                        <button type="button" class="btn btn-secondary" data-agreement-action="compare">
                            📊 Compare
                        </button>
                        <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">
                            &times;
                        </button>
                    </div>
                </div>
                
                <div class="modal-body agreement-body">
                    ${this.createAgreementSummary(agreement, userRole)}
                </div>
                
                <div class="modal-footer agreement-footer">
                    ${this.createAgreementFooter(agreement, userRole)}
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
     * Create Agreement Summary Content
     */
    createAgreementSummary(agreement, userRole) {
        return `
            <!-- Quick Overview Cards -->
            <div class="agreement-overview">
                <div class="overview-cards">
                    <div class="overview-card financial">
                        <div class="card-icon">💰</div>
                        <div class="card-content">
                            <h4>Total Value</h4>
                            <div class="amount">${agreement.financials ? '$' + agreement.financials.totalAmount.toLocaleString() : '$' + agreement.proposed_terms.compensation.amount.toLocaleString()}</div>
                            <div class="payment-type">${agreement.financials?.paymentStructure || agreement.proposed_terms?.compensation.type}</div>
                        </div>
                    </div>
                    
                    <div class="overview-card timeline">
                        <div class="card-icon">⏱️</div>
                        <div class="card-content">
                            <h4>Timeline</h4>
                            <div class="duration">${this.formatDuration(agreement)}</div>
                            <div class="dates">${this.formatDates(agreement)}</div>
                        </div>
                    </div>
                    
                    <div class="overview-card deliverables">
                        <div class="card-icon">📦</div>
                        <div class="card-content">
                            <h4>Deliverables</h4>
                            <div class="count">${this.getDeliverableCount(agreement)} items</div>
                            <div class="types">${this.getContentTypes(agreement)}</div>
                        </div>
                    </div>
                    
                    <div class="overview-card health">
                        <div class="card-icon">📊</div>
                        <div class="card-content">
                            <h4>Status</h4>
                            <div class="health-score">${this.getHealthScore(agreement)}</div>
                            <div class="completion">${this.getCompletion(agreement)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Parties Section -->
            <div class="agreement-section" data-section="parties">
                <div class="section-header">
                    <h3>👥 Parties</h3>
                    <button class="agreement-section-toggle" data-section="parties">
                        <span class="toggle-icon">▼</span>
                    </button>
                </div>
                <div class="section-content">
                    <div class="parties-grid">
                        <div class="party-card creator ${userRole === 'creator' ? 'current-user' : ''}">
                            <img src="${agreement.parties.creator.profileImage || '/img/default-avatar.png'}" alt="Creator" class="party-avatar">
                            <div class="party-info">
                                <h4>${agreement.parties.creator.name}</h4>
                                <p class="party-role">${agreement.parties.creator.role}</p>
                                <p class="party-stats">${agreement.parties.creator.followers?.toLocaleString() || 0} followers</p>
                            </div>
                        </div>
                        
                        <div class="party-connector">⇄</div>
                        
                        <div class="party-card marketer ${userRole === 'marketer' ? 'current-user' : ''}">
                            <img src="${agreement.parties.marketer.profileImage || '/img/default-avatar.png'}" alt="Marketer" class="party-avatar">
                            <div class="party-info">
                                <h4>${agreement.parties.marketer.name}</h4>
                                <p class="party-role">${agreement.parties.marketer.role}</p>
                                <p class="party-company">${agreement.parties.marketer.company || ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Financial Terms Section -->
            <div class="agreement-section" data-section="financial">
                <div class="section-header">
                    <h3>💰 Financial Terms</h3>
                    <button class="agreement-section-toggle" data-section="financial">
                        <span class="toggle-icon">▼</span>
                    </button>
                </div>
                <div class="section-content">
                    ${this.createFinancialSection(agreement)}
                </div>
            </div>

            <!-- Scope & Deliverables Section -->
            <div class="agreement-section" data-section="scope">
                <div class="section-header">
                    <h3>📦 Scope & Deliverables</h3>
                    <button class="agreement-section-toggle" data-section="scope">
                        <span class="toggle-icon">▼</span>
                    </button>
                </div>
                <div class="section-content">
                    ${this.createScopeSection(agreement)}
                </div>
            </div>

            <!-- Key Terms Section -->
            <div class="agreement-section" data-section="terms">
                <div class="section-header">
                    <h3>📋 Key Terms</h3>
                    <button class="agreement-section-toggle" data-section="terms">
                        <span class="toggle-icon">▼</span>
                    </button>
                </div>
                <div class="section-content">
                    ${this.createKeyTermsSection(agreement)}
                </div>
            </div>

            <!-- Critical Terms Highlights -->
            ${this.createCriticalTermsSection()}
        `;
    }

    /**
     * Create Financial Section
     */
    createFinancialSection(agreement) {
        const financial = agreement.financials || agreement.proposed_terms?.compensation;
        if (!financial) return '<p>No financial information available.</p>';

        let content = `
            <div class="financial-summary">
                <div class="financial-breakdown">
                    <div class="breakdown-item">
                        <span class="label">Total Amount:</span>
                        <span class="value">$${financial.totalAmount || financial.amount}</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="label">Payment Structure:</span>
                        <span class="value">${financial.paymentStructure || financial.type}</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="label">Currency:</span>
                        <span class="value">${financial.currency}</span>
                    </div>
                </div>
        `;

        if (financial.milestones && financial.milestones.length > 0) {
            content += `
                <div class="milestones-section">
                    <h4>Payment Milestones</h4>
                    <div class="milestones-list">
            `;
            
            financial.milestones.forEach((milestone, index) => {
                content += `
                    <div class="milestone-item">
                        <div class="milestone-number">${index + 1}</div>
                        <div class="milestone-content">
                            <h5>${milestone.name}</h5>
                            <p class="milestone-amount">$${milestone.amount || milestone.paymentAmount}</p>
                            <p class="milestone-date">Due: ${new Date(milestone.dueDate).toLocaleDateString()}</p>
                            <div class="milestone-status status-${milestone.status}">${milestone.status}</div>
                        </div>
                    </div>
                `;
            });
            
            content += '</div></div>';
        }

        content += `
                <div class="financial-protection">
                    <div class="protection-item">
                        <span class="protection-icon">🛡️</span>
                        <span class="protection-text">Escrow Protection Enabled</span>
                    </div>
                    <div class="protection-item">
                        <span class="protection-icon">🔄</span>
                        <span class="protection-text">${financial.refundPolicy || 'Standard refund policy'}</span>
                    </div>
                </div>
            </div>
        `;

        return content;
    }

    /**
     * Create Scope Section
     */
    createScopeSection(agreement) {
        const scope = agreement.scope || agreement.proposed_terms?.scope;
        if (!scope) return '<p>No scope information available.</p>';

        let content = `
            <div class="scope-overview">
                <div class="scope-stats">
                    <div class="scope-stat">
                        <span class="stat-number">${scope.platforms?.length || 0}</span>
                        <span class="stat-label">Platforms</span>
                    </div>
                    <div class="scope-stat">
                        <span class="stat-number">${scope.content_count || scope.contentTypes?.length || 0}</span>
                        <span class="stat-label">Content Items</span>
                    </div>
                    <div class="scope-stat">
                        <span class="stat-number">${scope.deliverables?.length || 0}</span>
                        <span class="stat-label">Deliverables</span>
                    </div>
                </div>
        `;

        if (scope.platforms && scope.platforms.length > 0) {
            content += `
                <div class="platforms-section">
                    <h4>Platforms</h4>
                    <div class="platforms-list">
                        ${scope.platforms.map(platform => `
                            <span class="platform-tag">${platform}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (scope.deliverables && scope.deliverables.length > 0) {
            content += `
                <div class="deliverables-section">
                    <h4>Deliverables</h4>
                    <div class="deliverables-list">
            `;
            
            scope.deliverables.forEach((deliverable, index) => {
                content += `
                    <div class="deliverable-item">
                        <div class="deliverable-header">
                            <h5>${deliverable.type}</h5>
                            <span class="deliverable-quantity">×${deliverable.quantity || 1}</span>
                        </div>
                        <p class="deliverable-description">${deliverable.description}</p>
                        ${deliverable.dueDate ? `<p class="deliverable-date">Due: ${new Date(deliverable.dueDate).toLocaleDateString()}</p>` : ''}
                    </div>
                `;
            });
            
            content += '</div></div>';
        }

        content += '</div>';
        return content;
    }

    /**
     * Create Key Terms Section
     */
    createKeyTermsSection(agreement) {
        const terms = agreement.terms;
        if (!terms) return '<p>No terms information available.</p>';

        return `
            <div class="key-terms">
                <div class="terms-grid">
                    <div class="term-item">
                        <h4>Usage Rights</h4>
                        <p>${terms.usage_rights}</p>
                    </div>
                    <div class="term-item">
                        <h4>Approval Process</h4>
                        <p>${terms.approval_process}</p>
                    </div>
                    <div class="term-item">
                        <h4>Revision Policy</h4>
                        <p>${terms.revision_policy}</p>
                    </div>
                    <div class="term-item">
                        <h4>Cancellation Policy</h4>
                        <p>${terms.cancellation_policy}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create Critical Terms Section
     */
    createCriticalTermsSection() {
        if (!this.highlightedTerms || this.highlightedTerms.length === 0) {
            return '';
        }

        const criticalTerms = this.highlightedTerms.filter(term => term.priority === 'critical');
        
        if (criticalTerms.length === 0) {
            return '';
        }

        return `
            <div class="agreement-section critical-terms-section" data-section="critical">
                <div class="section-header">
                    <h3>⚠️ Critical Terms Requiring Attention</h3>
                    <button class="agreement-section-toggle" data-section="critical">
                        <span class="toggle-icon">▼</span>
                    </button>
                </div>
                <div class="section-content">
                    <div class="critical-terms-list">
                        ${criticalTerms.map(term => `
                            <div class="critical-term-item" data-term-id="${term.id}">
                                <div class="term-priority priority-${term.priority}">
                                    ${term.priority === 'critical' ? '🔴' : '🟡'}
                                </div>
                                <div class="term-content">
                                    <h4>${term.title}</h4>
                                    <p>${term.description}</p>
                                    <div class="term-implications">
                                        <strong>Implications:</strong> ${term.implications}
                                    </div>
                                </div>
                                <button class="critical-term-highlight" data-term-id="${term.id}">
                                    View Details
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create Agreement Footer
     */
    createAgreementFooter(agreement, userRole) {
        const isOffer = this.currentAgreement.type === 'offer';
        const status = agreement.header.status;
        
        let footerContent = `
            <div class="agreement-info">
                <p><strong>Last Updated:</strong> ${new Date(agreement.header.lastModified || agreement.header.createdDate).toLocaleString()}</p>
                <p><strong>Your Role:</strong> ${userRole === 'creator' ? 'Content Creator' : 'Brand/Marketer'}</p>
            </div>
        `;

        if (isOffer && status === 'sent' && userRole === 'creator') {
            footerContent += `
                <div class="agreement-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Review Later
                    </button>
                    <button class="btn btn-warning" onclick="alert('Negotiation feature coming soon!')">
                        Negotiate Terms
                    </button>
                    <button class="btn btn-primary" data-agreement-action="accept">
                        Accept Offer
                    </button>
                </div>
            `;
        } else if (status === 'active' || status === 'in_progress') {
            footerContent += `
                <div class="agreement-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                    <button class="btn btn-primary" onclick="alert('Deal management features coming soon!')">
                        Manage ${isOffer ? 'Offer' : 'Deal'}
                    </button>
                </div>
            `;
        } else {
            footerContent += `
                <div class="agreement-actions">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                </div>
            `;
        }

        return footerContent;
    }

    /**
     * Toggle Section Expansion
     */
    toggleSection(sectionName) {
        const section = document.querySelector(`[data-section="${sectionName}"]`);
        if (!section) return;

        const content = section.querySelector('.section-content');
        const toggle = section.querySelector('.toggle-icon');
        
        if (this.expandedSections.has(sectionName)) {
            content.style.display = 'none';
            toggle.textContent = '▶';
            this.expandedSections.delete(sectionName);
        } else {
            content.style.display = 'block';
            toggle.textContent = '▼';
            this.expandedSections.add(sectionName);
        }
    }

    /**
     * Show Term Details
     */
    showTermDetails(termId) {
        const term = this.highlightedTerms.find(t => t.id === termId);
        if (!term) return;

        const modal = document.createElement('div');
        modal.className = 'modal term-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${term.title}</h3>
                    <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="term-priority priority-${term.priority}">
                        Priority: ${term.priority.toUpperCase()}
                    </div>
                    <div class="term-description">
                        <h4>Description</h4>
                        <p>${term.description}</p>
                    </div>
                    <div class="term-implications">
                        <h4>Implications</h4>
                        <p>${term.implications}</p>
                    </div>
                    ${term.recommendations ? `
                        <div class="term-recommendations">
                            <h4>Recommendations</h4>
                            <ul>
                                ${term.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                        Understood
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'flex';

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * Handle Agreement Acceptance
     */
    async handleAcceptance() {
        if (!this.currentAgreement || this.currentAgreement.type !== 'offer') {
            this.showError('Can only accept offers');
            return;
        }

        const confirmed = confirm('Are you sure you want to accept this offer? This action cannot be undone.');
        if (!confirmed) return;

        try {
            this.showLoading('Accepting offer...');
            
            // This would call the offer acceptance endpoint
            const response = await apiManager.makeRequest(`/api/offers/${this.currentAgreement.id}/accept`, {
                method: 'POST'
            });

            if (response.success) {
                this.showSuccess('Offer accepted successfully!');
                setTimeout(() => {
                    document.querySelector('.agreement-modal').remove();
                    window.location.reload(); // Refresh to show updated status
                }, 2000);
            } else {
                throw new Error(response.message || 'Failed to accept offer');
            }
        } catch (error) {
            console.error('Error accepting offer:', error);
            this.showError('Failed to accept offer: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Download Agreement
     */
    async downloadAgreement() {
        if (!this.currentAgreement) return;

        try {
            this.showLoading('Generating document...');
            
            const requestBody = {
                format: 'pdf',
                includeSignatures: true,
                templateType: 'standard'
            };

            if (this.currentAgreement.type === 'deal') {
                requestBody.dealId = this.currentAgreement.id;
            } else {
                requestBody.offerId = this.currentAgreement.id;
            }

            const response = await apiManager.makeRequest(`${this.apiBase}/generate`, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            if (response.success && response.data.downloadUrl) {
                // Create a download link
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.download = `axees-agreement-${this.currentAgreement.id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                this.showSuccess('Agreement downloaded successfully!');
            } else {
                throw new Error(response.message || 'Failed to generate document');
            }
        } catch (error) {
            console.error('Error downloading agreement:', error);
            this.showError('Failed to download agreement: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Show Comparison Modal
     */
    showComparisonModal() {
        alert('Agreement comparison feature coming soon! This will allow you to compare different versions of the agreement.');
    }

    /**
     * Utility Methods
     */
    formatDuration(agreement) {
        const timeline = agreement.scope?.timeline || agreement.proposed_terms?.timeline;
        if (typeof timeline === 'string') return timeline;
        
        if (timeline?.startDate && timeline?.endDate) {
            const start = new Date(timeline.startDate);
            const end = new Date(timeline.endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            return `${days} days`;
        }
        
        return 'TBD';
    }

    formatDates(agreement) {
        const timeline = agreement.scope?.timeline || agreement.proposed_terms?.timeline;
        if (typeof timeline === 'string') return timeline;
        
        if (timeline?.startDate) {
            const start = new Date(timeline.startDate).toLocaleDateString();
            const end = timeline.endDate ? new Date(timeline.endDate).toLocaleDateString() : 'TBD';
            return `${start} - ${end}`;
        }
        
        return 'TBD';
    }

    getDeliverableCount(agreement) {
        const deliverables = agreement.scope?.deliverables || agreement.proposed_terms?.scope?.content_count;
        if (typeof deliverables === 'number') return deliverables;
        return deliverables?.length || 0;
    }

    getContentTypes(agreement) {
        const types = agreement.scope?.contentTypes || agreement.proposed_terms?.scope?.content_types;
        if (Array.isArray(types)) {
            return types.slice(0, 2).join(', ') + (types.length > 2 ? '...' : '');
        }
        return 'Various';
    }

    getHealthScore(agreement) {
        if (agreement.status_indicators?.overall_health) {
            return agreement.status_indicators.overall_health;
        }
        return 'Good';
    }

    getCompletion(agreement) {
        if (agreement.status_indicators?.completion_percentage !== undefined) {
            return `${agreement.status_indicators.completion_percentage}%`;
        }
        return 'N/A';
    }

    /**
     * Inject Styles
     */
    injectStyles() {
        const styles = `
            <style>
            .agreement-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                justify-content: center;
                align-items: flex-start;
                z-index: 1000;
                overflow-y: auto;
                padding: var(--space-4);
            }

            .agreement-content {
                background: var(--bg-card);
                border-radius: var(--radius-xl);
                max-width: 1000px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                margin: var(--space-4) 0;
            }

            .agreement-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding: var(--space-6);
                border-bottom: 1px solid var(--gray-200);
                background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
                color: white;
                border-radius: var(--radius-xl) var(--radius-xl) 0 0;
            }

            .agreement-title-section h2 {
                margin: 0 0 var(--space-2) 0;
                color: white;
                font-size: var(--text-2xl);
            }

            .agreement-meta {
                display: flex;
                gap: var(--space-3);
                flex-wrap: wrap;
            }

            .agreement-status {
                padding: var(--space-1) var(--space-2);
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
                font-weight: var(--font-semibold);
                color: white;
            }

            .agreement-number, .agreement-date {
                color: rgba(255, 255, 255, 0.9);
                font-size: var(--text-sm);
            }

            .agreement-actions {
                display: flex;
                gap: var(--space-2);
            }

            .agreement-body {
                padding: var(--space-6);
            }

            .agreement-overview {
                margin-bottom: var(--space-8);
            }

            .overview-cards {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: var(--space-4);
                margin-bottom: var(--space-6);
            }

            .overview-card {
                background: var(--gray-50);
                border: 1px solid var(--gray-200);
                border-radius: var(--radius-lg);
                padding: var(--space-4);
                display: flex;
                align-items: center;
                gap: var(--space-3);
                transition: all 0.2s ease;
            }

            .overview-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }

            .overview-card.financial {
                border-left: 4px solid var(--success);
            }

            .overview-card.timeline {
                border-left: 4px solid var(--info);
            }

            .overview-card.deliverables {
                border-left: 4px solid var(--warning);
            }

            .overview-card.health {
                border-left: 4px solid var(--primary-color);
            }

            .card-icon {
                font-size: var(--text-2xl);
                flex-shrink: 0;
            }

            .card-content h4 {
                margin: 0 0 var(--space-1) 0;
                font-size: var(--text-sm);
                font-weight: var(--font-semibold);
                color: var(--text-secondary);
            }

            .amount, .duration, .count, .health-score {
                font-size: var(--text-lg);
                font-weight: var(--font-bold);
                color: var(--text-primary);
                margin-bottom: var(--space-1);
            }

            .payment-type, .dates, .types, .completion {
                font-size: var(--text-sm);
                color: var(--text-muted);
            }

            .agreement-section {
                margin-bottom: var(--space-6);
                border: 1px solid var(--gray-200);
                border-radius: var(--radius-lg);
                overflow: hidden;
            }

            .section-header {
                background: var(--gray-50);
                padding: var(--space-4);
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: pointer;
            }

            .section-header h3 {
                margin: 0;
                font-size: var(--text-lg);
                font-weight: var(--font-semibold);
                color: var(--text-primary);
            }

            .agreement-section-toggle {
                background: none;
                border: none;
                cursor: pointer;
                padding: var(--space-1);
                color: var(--text-secondary);
                transition: transform 0.2s ease;
            }

            .section-content {
                padding: var(--space-4);
                display: block;
            }

            .parties-grid {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: var(--space-4);
                align-items: center;
            }

            .party-card {
                display: flex;
                align-items: center;
                gap: var(--space-3);
                padding: var(--space-4);
                background: var(--bg-card);
                border: 1px solid var(--gray-200);
                border-radius: var(--radius-lg);
                transition: all 0.2s ease;
            }

            .party-card.current-user {
                border-color: var(--primary-color);
                background: rgba(99, 102, 241, 0.05);
            }

            .party-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                object-fit: cover;
            }

            .party-info h4 {
                margin: 0 0 var(--space-1) 0;
                font-size: var(--text-base);
                font-weight: var(--font-semibold);
            }

            .party-role, .party-stats, .party-company {
                margin: 0;
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            .party-connector {
                font-size: var(--text-2xl);
                color: var(--text-muted);
                text-align: center;
            }

            .financial-summary {
                background: var(--gray-50);
                border-radius: var(--radius-md);
                padding: var(--space-4);
            }

            .financial-breakdown {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: var(--space-4);
                margin-bottom: var(--space-4);
            }

            .breakdown-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-2);
                background: white;
                border-radius: var(--radius-md);
            }

            .breakdown-item .label {
                font-weight: var(--font-medium);
                color: var(--text-secondary);
            }

            .breakdown-item .value {
                font-weight: var(--font-semibold);
                color: var(--text-primary);
            }

            .milestones-section {
                margin-top: var(--space-4);
            }

            .milestones-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-3);
            }

            .milestone-item {
                display: flex;
                align-items: center;
                gap: var(--space-3);
                padding: var(--space-3);
                background: white;
                border-radius: var(--radius-md);
                border: 1px solid var(--gray-200);
            }

            .milestone-number {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: var(--primary-color);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: var(--font-semibold);
                flex-shrink: 0;
            }

            .milestone-content {
                flex: 1;
            }

            .milestone-content h5 {
                margin: 0 0 var(--space-1) 0;
                font-size: var(--text-base);
                font-weight: var(--font-semibold);
            }

            .milestone-amount {
                margin: 0;
                font-weight: var(--font-semibold);
                color: var(--success);
            }

            .milestone-date {
                margin: 0;
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            .milestone-status {
                padding: var(--space-1) var(--space-2);
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
            }

            .milestone-status.status-completed {
                background: rgba(16, 185, 129, 0.1);
                color: var(--success);
            }

            .milestone-status.status-pending {
                background: rgba(245, 158, 11, 0.1);
                color: var(--warning);
            }

            .financial-protection {
                display: flex;
                gap: var(--space-4);
                margin-top: var(--space-4);
            }

            .protection-item {
                display: flex;
                align-items: center;
                gap: var(--space-2);
                padding: var(--space-2);
                background: white;
                border-radius: var(--radius-md);
                flex: 1;
            }

            .protection-icon {
                font-size: var(--text-lg);
            }

            .scope-overview {
                background: var(--gray-50);
                border-radius: var(--radius-md);
                padding: var(--space-4);
            }

            .scope-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--space-4);
                margin-bottom: var(--space-4);
            }

            .scope-stat {
                text-align: center;
                padding: var(--space-3);
                background: white;
                border-radius: var(--radius-md);
            }

            .stat-number {
                display: block;
                font-size: var(--text-2xl);
                font-weight: var(--font-bold);
                color: var(--primary-color);
            }

            .stat-label {
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            .platforms-section, .deliverables-section {
                margin-top: var(--space-4);
            }

            .platforms-list {
                display: flex;
                flex-wrap: wrap;
                gap: var(--space-2);
                margin-top: var(--space-2);
            }

            .platform-tag {
                padding: var(--space-1) var(--space-2);
                background: var(--primary-color);
                color: white;
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
            }

            .deliverables-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-3);
                margin-top: var(--space-2);
            }

            .deliverable-item {
                padding: var(--space-3);
                background: white;
                border: 1px solid var(--gray-200);
                border-radius: var(--radius-md);
            }

            .deliverable-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--space-2);
            }

            .deliverable-header h5 {
                margin: 0;
                font-size: var(--text-base);
                font-weight: var(--font-semibold);
            }

            .deliverable-quantity {
                background: var(--gray-100);
                padding: var(--space-1) var(--space-2);
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
                font-weight: var(--font-medium);
            }

            .deliverable-description, .deliverable-date {
                margin: var(--space-1) 0;
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            .key-terms {
                background: var(--gray-50);
                border-radius: var(--radius-md);
                padding: var(--space-4);
            }

            .terms-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: var(--space-4);
            }

            .term-item {
                padding: var(--space-3);
                background: white;
                border-radius: var(--radius-md);
                border: 1px solid var(--gray-200);
            }

            .term-item h4 {
                margin: 0 0 var(--space-2) 0;
                font-size: var(--text-base);
                font-weight: var(--font-semibold);
                color: var(--text-primary);
            }

            .term-item p {
                margin: 0;
                font-size: var(--text-sm);
                color: var(--text-secondary);
                line-height: 1.5;
            }

            .critical-terms-section {
                border-color: var(--error);
                background: rgba(239, 68, 68, 0.05);
            }

            .critical-terms-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-4);
            }

            .critical-term-item {
                display: flex;
                align-items: flex-start;
                gap: var(--space-3);
                padding: var(--space-4);
                background: white;
                border: 1px solid var(--error);
                border-radius: var(--radius-md);
            }

            .term-priority {
                font-size: var(--text-lg);
                flex-shrink: 0;
            }

            .term-content {
                flex: 1;
            }

            .term-content h4 {
                margin: 0 0 var(--space-2) 0;
                font-size: var(--text-base);
                font-weight: var(--font-semibold);
                color: var(--error);
            }

            .term-content p {
                margin: 0 0 var(--space-2) 0;
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            .term-implications {
                font-size: var(--text-sm);
                color: var(--text-primary);
            }

            .critical-term-highlight {
                background: var(--error);
                color: white;
                border: none;
                padding: var(--space-2) var(--space-3);
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .critical-term-highlight:hover {
                background: var(--primary-dark);
            }

            .agreement-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--space-6);
                border-top: 1px solid var(--gray-200);
                background: var(--gray-50);
            }

            .agreement-info {
                color: var(--text-secondary);
                font-size: var(--text-sm);
            }

            .agreement-info p {
                margin: 0 0 var(--space-1) 0;
            }

            .agreement-actions {
                display: flex;
                gap: var(--space-3);
            }

            .term-details-modal .modal-content {
                max-width: 600px;
            }

            .term-priority.priority-critical {
                color: var(--error);
                font-weight: var(--font-bold);
            }

            .term-priority.priority-important {
                color: var(--warning);
                font-weight: var(--font-bold);
            }

            .term-recommendations ul {
                margin: 0;
                padding-left: var(--space-4);
            }

            .term-recommendations li {
                margin-bottom: var(--space-1);
            }

            @media (max-width: 768px) {
                .agreement-modal {
                    padding: var(--space-2);
                }
                
                .agreement-content {
                    max-height: 95vh;
                }
                
                .agreement-header {
                    flex-direction: column;
                    gap: var(--space-3);
                    align-items: flex-start;
                }
                
                .agreement-actions {
                    align-self: stretch;
                }
                
                .overview-cards {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .parties-grid {
                    grid-template-columns: 1fr;
                    gap: var(--space-2);
                }
                
                .party-connector {
                    display: none;
                }
                
                .financial-breakdown {
                    grid-template-columns: 1fr;
                }
                
                .scope-stats {
                    grid-template-columns: repeat(3, 1fr);
                }
                
                .terms-grid {
                    grid-template-columns: 1fr;
                }
                
                .agreement-footer {
                    flex-direction: column;
                    gap: var(--space-3);
                    align-items: stretch;
                }
                
                .critical-term-item {
                    flex-direction: column;
                    align-items: stretch;
                }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
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

// Initialize Agreement Display Manager
window.agreementDisplayManager = new AgreementDisplayManager();

// Auto-initialize sections as expanded
document.addEventListener('DOMContentLoaded', () => {
    if (window.agreementDisplayManager) {
        // Default expanded sections
        window.agreementDisplayManager.expandedSections.add('parties');
        window.agreementDisplayManager.expandedSections.add('financial');
        window.agreementDisplayManager.expandedSections.add('scope');
    }
});

/**
 * Agreement Version Comparison Extension
 * Provides side-by-side comparison of agreement versions
 */
class AgreementVersionComparison {
    constructor(agreementManager) {
        this.agreementManager = agreementManager;
        this.versions = [];
        this.currentVersions = { left: null, right: null };
        this.highlightChanges = true;
        this.init();
    }

    init() {
        this.injectComparisonStyles();
    }

    /**
     * Show version comparison modal
     */
    async showVersionComparison(agreementId, agreementType = 'deal') {
        try {
            // Load version history
            const versions = await this.loadVersionHistory(agreementId, agreementType);
            
            if (!versions || versions.length < 2) {
                this.agreementManager.showError('Not enough versions available for comparison');
                return;
            }

            this.versions = versions;
            this.showComparisonModal();

        } catch (error) {
            console.error('Error loading version history:', error);
            this.agreementManager.showError('Failed to load version history');
        }
    }

    /**
     * Load version history from API
     */
    async loadVersionHistory(agreementId, agreementType) {
        try {
            const endpoint = agreementType === 'deal' ? 
                `/api/agreements/deal/${agreementId}/versions` : 
                `/api/agreements/offer/${agreementId}/versions`;
                
            const response = await apiManager.makeRequest(endpoint);
            
            if (response.success) {
                return response.versions || [];
            }

            // Fallback to mock data for demo
            return this.getMockVersions(agreementId);
            
        } catch (error) {
            console.error('Error fetching versions:', error);
            return this.getMockVersions(agreementId);
        }
    }

    /**
     * Get mock versions for demo
     */
    getMockVersions(agreementId) {
        const baseDate = new Date();
        return [
            {
                id: 'v3',
                version: '3.0',
                date: new Date(baseDate.getTime() - 0 * 24 * 60 * 60 * 1000),
                author: 'Jordan Davis',
                changes: ['Updated payment schedule', 'Added performance bonuses', 'Clarified deliverable deadlines'],
                summary: {
                    financial: {
                        totalAmount: 15000,
                        paymentSchedule: '40% upfront, 30% milestone, 30% completion',
                        bonuses: '$2,000 performance bonus available'
                    },
                    scope: {
                        deliverables: 8,
                        duration: '3 months',
                        milestones: 4
                    },
                    terms: {
                        revision: 'Unlimited revisions within scope',
                        ownership: 'Full rights transfer upon payment',
                        exclusivity: '90 days category exclusivity'
                    }
                },
                criticalChanges: ['Payment schedule modified', 'Performance bonus added']
            },
            {
                id: 'v2',
                version: '2.0',
                date: new Date(baseDate.getTime() - 7 * 24 * 60 * 60 * 1000),
                author: 'Alex Chen',
                changes: ['Modified deliverable scope', 'Extended timeline', 'Updated usage rights'],
                summary: {
                    financial: {
                        totalAmount: 12000,
                        paymentSchedule: '50% upfront, 50% completion',
                        bonuses: 'None'
                    },
                    scope: {
                        deliverables: 6,
                        duration: '2.5 months',
                        milestones: 3
                    },
                    terms: {
                        revision: '3 rounds of revisions',
                        ownership: 'Licensed usage for 2 years',
                        exclusivity: '60 days category exclusivity'
                    }
                },
                criticalChanges: ['Timeline extended by 2 weeks']
            },
            {
                id: 'v1',
                version: '1.0',
                date: new Date(baseDate.getTime() - 14 * 24 * 60 * 60 * 1000),
                author: 'System',
                changes: ['Initial version'],
                summary: {
                    financial: {
                        totalAmount: 10000,
                        paymentSchedule: '50% upfront, 50% completion',
                        bonuses: 'None'
                    },
                    scope: {
                        deliverables: 5,
                        duration: '2 months',
                        milestones: 2
                    },
                    terms: {
                        revision: '2 rounds of revisions',
                        ownership: 'Licensed usage for 1 year',
                        exclusivity: '30 days category exclusivity'
                    }
                },
                criticalChanges: []
            }
        ];
    }

    /**
     * Show comparison modal
     */
    showComparisonModal() {
        const modal = document.createElement('div');
        modal.className = 'version-comparison-modal modal-overlay';
        modal.innerHTML = `
            <div class="modal-content comparison-content" style="max-width: 1200px; width: 95%; max-height: 90vh;">
                <div class="modal-header">
                    <h2>Agreement Version Comparison</h2>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="comparison-controls">
                    <div class="version-selectors">
                        <div class="version-selector">
                            <label>Compare Version:</label>
                            <select id="version-left" onchange="agreementVersionComparison.updateComparison('left')">
                                ${this.versions.map((v, i) => `
                                    <option value="${v.id}" ${i === 1 ? 'selected' : ''}>
                                        Version ${v.version} - ${new Date(v.date).toLocaleDateString()}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="version-arrow">➡️</div>
                        <div class="version-selector">
                            <label>With Version:</label>
                            <select id="version-right" onchange="agreementVersionComparison.updateComparison('right')">
                                ${this.versions.map((v, i) => `
                                    <option value="${v.id}" ${i === 0 ? 'selected' : ''}>
                                        Version ${v.version} - ${new Date(v.date).toLocaleDateString()}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="comparison-options">
                        <label class="toggle-option">
                            <input type="checkbox" id="highlight-changes" checked onchange="agreementVersionComparison.toggleHighlight()">
                            <span>Highlight Changes</span>
                        </label>
                        <button class="btn btn-secondary" onclick="agreementVersionComparison.swapVersions()">
                            🔄 Swap Versions
                        </button>
                    </div>
                </div>
                
                <div class="comparison-body">
                    <div id="comparison-content">
                        <!-- Comparison content will be loaded here -->
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="agreementVersionComparison.exportComparison()">
                        📥 Export Comparison
                    </button>
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Initialize comparison
        this.updateComparison();
    }

    /**
     * Update comparison display
     */
    updateComparison(changedSide = null) {
        const leftSelect = document.getElementById('version-left');
        const rightSelect = document.getElementById('version-right');
        
        if (!leftSelect || !rightSelect) return;

        const leftVersion = this.versions.find(v => v.id === leftSelect.value);
        const rightVersion = this.versions.find(v => v.id === rightSelect.value);

        if (!leftVersion || !rightVersion) return;

        this.currentVersions = { left: leftVersion, right: rightVersion };
        
        const comparisonContent = document.getElementById('comparison-content');
        comparisonContent.innerHTML = this.generateComparisonHTML(leftVersion, rightVersion);
    }

    /**
     * Generate comparison HTML
     */
    generateComparisonHTML(leftVersion, rightVersion) {
        const changes = this.detectChanges(leftVersion, rightVersion);
        
        return `
            <div class="comparison-header-info">
                <div class="version-info-card">
                    <h4>Version ${leftVersion.version}</h4>
                    <p>Date: ${new Date(leftVersion.date).toLocaleDateString()}</p>
                    <p>Author: ${leftVersion.author}</p>
                    ${leftVersion.changes.length > 0 ? `
                        <div class="version-changes">
                            <strong>Changes:</strong>
                            <ul>
                                ${leftVersion.changes.map(change => `<li>${change}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                
                <div class="comparison-indicator">
                    <div class="change-summary">
                        <h4>Changes Detected</h4>
                        <div class="change-stats">
                            <span class="change-added">➕ ${changes.added} added</span>
                            <span class="change-modified">📝 ${changes.modified} modified</span>
                            <span class="change-removed">➖ ${changes.removed} removed</span>
                        </div>
                    </div>
                </div>
                
                <div class="version-info-card">
                    <h4>Version ${rightVersion.version}</h4>
                    <p>Date: ${new Date(rightVersion.date).toLocaleDateString()}</p>
                    <p>Author: ${rightVersion.author}</p>
                    ${rightVersion.changes.length > 0 ? `
                        <div class="version-changes">
                            <strong>Changes:</strong>
                            <ul>
                                ${rightVersion.changes.map(change => `<li>${change}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="comparison-sections">
                <!-- Financial Terms Comparison -->
                <div class="comparison-section">
                    <h3>Financial Terms</h3>
                    <div class="comparison-grid">
                        <div class="comparison-column">
                            <div class="term-item ${this.getChangeClass('financial.totalAmount', leftVersion, rightVersion)}">
                                <strong>Total Amount:</strong> $${leftVersion.summary.financial.totalAmount.toLocaleString()}
                            </div>
                            <div class="term-item ${this.getChangeClass('financial.paymentSchedule', leftVersion, rightVersion)}">
                                <strong>Payment Schedule:</strong> ${leftVersion.summary.financial.paymentSchedule}
                            </div>
                            <div class="term-item ${this.getChangeClass('financial.bonuses', leftVersion, rightVersion)}">
                                <strong>Bonuses:</strong> ${leftVersion.summary.financial.bonuses}
                            </div>
                        </div>
                        <div class="comparison-divider"></div>
                        <div class="comparison-column">
                            <div class="term-item ${this.getChangeClass('financial.totalAmount', leftVersion, rightVersion)}">
                                <strong>Total Amount:</strong> $${rightVersion.summary.financial.totalAmount.toLocaleString()}
                            </div>
                            <div class="term-item ${this.getChangeClass('financial.paymentSchedule', leftVersion, rightVersion)}">
                                <strong>Payment Schedule:</strong> ${rightVersion.summary.financial.paymentSchedule}
                            </div>
                            <div class="term-item ${this.getChangeClass('financial.bonuses', leftVersion, rightVersion)}">
                                <strong>Bonuses:</strong> ${rightVersion.summary.financial.bonuses}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Scope Comparison -->
                <div class="comparison-section">
                    <h3>Project Scope</h3>
                    <div class="comparison-grid">
                        <div class="comparison-column">
                            <div class="term-item ${this.getChangeClass('scope.deliverables', leftVersion, rightVersion)}">
                                <strong>Deliverables:</strong> ${leftVersion.summary.scope.deliverables} items
                            </div>
                            <div class="term-item ${this.getChangeClass('scope.duration', leftVersion, rightVersion)}">
                                <strong>Duration:</strong> ${leftVersion.summary.scope.duration}
                            </div>
                            <div class="term-item ${this.getChangeClass('scope.milestones', leftVersion, rightVersion)}">
                                <strong>Milestones:</strong> ${leftVersion.summary.scope.milestones}
                            </div>
                        </div>
                        <div class="comparison-divider"></div>
                        <div class="comparison-column">
                            <div class="term-item ${this.getChangeClass('scope.deliverables', leftVersion, rightVersion)}">
                                <strong>Deliverables:</strong> ${rightVersion.summary.scope.deliverables} items
                            </div>
                            <div class="term-item ${this.getChangeClass('scope.duration', leftVersion, rightVersion)}">
                                <strong>Duration:</strong> ${rightVersion.summary.scope.duration}
                            </div>
                            <div class="term-item ${this.getChangeClass('scope.milestones', leftVersion, rightVersion)}">
                                <strong>Milestones:</strong> ${rightVersion.summary.scope.milestones}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Terms & Conditions Comparison -->
                <div class="comparison-section">
                    <h3>Terms & Conditions</h3>
                    <div class="comparison-grid">
                        <div class="comparison-column">
                            <div class="term-item ${this.getChangeClass('terms.revision', leftVersion, rightVersion)}">
                                <strong>Revisions:</strong> ${leftVersion.summary.terms.revision}
                            </div>
                            <div class="term-item ${this.getChangeClass('terms.ownership', leftVersion, rightVersion)}">
                                <strong>Ownership:</strong> ${leftVersion.summary.terms.ownership}
                            </div>
                            <div class="term-item ${this.getChangeClass('terms.exclusivity', leftVersion, rightVersion)}">
                                <strong>Exclusivity:</strong> ${leftVersion.summary.terms.exclusivity}
                            </div>
                        </div>
                        <div class="comparison-divider"></div>
                        <div class="comparison-column">
                            <div class="term-item ${this.getChangeClass('terms.revision', leftVersion, rightVersion)}">
                                <strong>Revisions:</strong> ${rightVersion.summary.terms.revision}
                            </div>
                            <div class="term-item ${this.getChangeClass('terms.ownership', leftVersion, rightVersion)}">
                                <strong>Ownership:</strong> ${rightVersion.summary.terms.ownership}
                            </div>
                            <div class="term-item ${this.getChangeClass('terms.exclusivity', leftVersion, rightVersion)}">
                                <strong>Exclusivity:</strong> ${rightVersion.summary.terms.exclusivity}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Critical Changes -->
                ${(leftVersion.criticalChanges.length > 0 || rightVersion.criticalChanges.length > 0) ? `
                    <div class="comparison-section critical-changes">
                        <h3>⚠️ Critical Changes</h3>
                        <div class="comparison-grid">
                            <div class="comparison-column">
                                ${leftVersion.criticalChanges.length > 0 ? `
                                    <ul class="critical-list">
                                        ${leftVersion.criticalChanges.map(change => `<li>${change}</li>`).join('')}
                                    </ul>
                                ` : '<p class="no-changes">No critical changes</p>'}
                            </div>
                            <div class="comparison-divider"></div>
                            <div class="comparison-column">
                                ${rightVersion.criticalChanges.length > 0 ? `
                                    <ul class="critical-list">
                                        ${rightVersion.criticalChanges.map(change => `<li>${change}</li>`).join('')}
                                    </ul>
                                ` : '<p class="no-changes">No critical changes</p>'}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Detect changes between versions
     */
    detectChanges(leftVersion, rightVersion) {
        let added = 0, modified = 0, removed = 0;

        // Compare financial terms
        if (leftVersion.summary.financial.totalAmount !== rightVersion.summary.financial.totalAmount) modified++;
        if (leftVersion.summary.financial.paymentSchedule !== rightVersion.summary.financial.paymentSchedule) modified++;
        if (leftVersion.summary.financial.bonuses !== rightVersion.summary.financial.bonuses) {
            if (leftVersion.summary.financial.bonuses === 'None' && rightVersion.summary.financial.bonuses !== 'None') added++;
            else if (leftVersion.summary.financial.bonuses !== 'None' && rightVersion.summary.financial.bonuses === 'None') removed++;
            else modified++;
        }

        // Compare scope
        if (leftVersion.summary.scope.deliverables !== rightVersion.summary.scope.deliverables) modified++;
        if (leftVersion.summary.scope.duration !== rightVersion.summary.scope.duration) modified++;
        if (leftVersion.summary.scope.milestones !== rightVersion.summary.scope.milestones) modified++;

        // Compare terms
        if (leftVersion.summary.terms.revision !== rightVersion.summary.terms.revision) modified++;
        if (leftVersion.summary.terms.ownership !== rightVersion.summary.terms.ownership) modified++;
        if (leftVersion.summary.terms.exclusivity !== rightVersion.summary.terms.exclusivity) modified++;

        return { added, modified, removed };
    }

    /**
     * Get change class for highlighting
     */
    getChangeClass(path, leftVersion, rightVersion) {
        if (!this.highlightChanges) return '';

        const leftValue = this.getNestedValue(leftVersion.summary, path);
        const rightValue = this.getNestedValue(rightVersion.summary, path);

        if (leftValue !== rightValue) {
            return 'changed-item';
        }
        return '';
    }

    /**
     * Get nested value from object
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Toggle highlight changes
     */
    toggleHighlight() {
        const checkbox = document.getElementById('highlight-changes');
        this.highlightChanges = checkbox.checked;
        this.updateComparison();
    }

    /**
     * Swap versions
     */
    swapVersions() {
        const leftSelect = document.getElementById('version-left');
        const rightSelect = document.getElementById('version-right');
        
        const temp = leftSelect.value;
        leftSelect.value = rightSelect.value;
        rightSelect.value = temp;
        
        this.updateComparison();
    }

    /**
     * Export comparison
     */
    exportComparison() {
        const { left, right } = this.currentVersions;
        
        alert(`Agreement Comparison Export would include:

📄 Side-by-side PDF document
📊 Change log spreadsheet
📝 Executive summary of changes
🔍 Detailed line-by-line comparison

Comparing:
• Version ${left.version} (${new Date(left.date).toLocaleDateString()})
• Version ${right.version} (${new Date(right.date).toLocaleDateString()})`);
    }

    /**
     * Inject comparison styles
     */
    injectComparisonStyles() {
        const styles = `
            <style id="agreement-comparison-styles">
            .version-comparison-modal .modal-content {
                display: flex;
                flex-direction: column;
                height: 90vh;
            }

            .comparison-content {
                padding: 0;
            }

            .comparison-controls {
                padding: var(--space-4);
                background: var(--gray-50);
                border-bottom: 1px solid var(--gray-200);
            }

            .version-selectors {
                display: flex;
                align-items: center;
                gap: var(--space-4);
                margin-bottom: var(--space-4);
            }

            .version-selector {
                flex: 1;
            }

            .version-selector label {
                display: block;
                margin-bottom: var(--space-1);
                font-weight: var(--font-medium);
                color: var(--text-secondary);
            }

            .version-selector select {
                width: 100%;
                padding: var(--space-2);
                border: 1px solid var(--gray-300);
                border-radius: var(--radius-md);
                font-size: var(--text-base);
            }

            .version-arrow {
                font-size: var(--text-xl);
                color: var(--primary-color);
                padding-top: 20px;
            }

            .comparison-options {
                display: flex;
                align-items: center;
                gap: var(--space-4);
            }

            .toggle-option {
                display: flex;
                align-items: center;
                gap: var(--space-2);
                cursor: pointer;
            }

            .comparison-body {
                flex: 1;
                overflow-y: auto;
                padding: var(--space-6);
            }

            .comparison-header-info {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: var(--space-4);
                margin-bottom: var(--space-6);
            }

            .version-info-card {
                background: var(--gray-50);
                padding: var(--space-4);
                border-radius: var(--radius-lg);
                border: 1px solid var(--gray-200);
            }

            .version-info-card h4 {
                margin: 0 0 var(--space-2) 0;
                color: var(--primary-color);
            }

            .version-info-card p {
                margin: 0 0 var(--space-1) 0;
                font-size: var(--text-sm);
                color: var(--text-secondary);
            }

            .version-changes {
                margin-top: var(--space-3);
                font-size: var(--text-sm);
            }

            .version-changes ul {
                margin: var(--space-1) 0 0 var(--space-4);
                padding: 0;
            }

            .comparison-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .change-summary {
                text-align: center;
            }

            .change-summary h4 {
                margin: 0 0 var(--space-2) 0;
                color: var(--text-primary);
            }

            .change-stats {
                display: flex;
                gap: var(--space-3);
                font-size: var(--text-sm);
            }

            .change-added {
                color: var(--success);
            }

            .change-modified {
                color: var(--warning);
            }

            .change-removed {
                color: var(--error);
            }

            .comparison-section {
                margin-bottom: var(--space-6);
            }

            .comparison-section h3 {
                margin: 0 0 var(--space-4) 0;
                color: var(--text-primary);
                border-bottom: 2px solid var(--gray-200);
                padding-bottom: var(--space-2);
            }

            .comparison-grid {
                display: grid;
                grid-template-columns: 1fr 1px 1fr;
                gap: var(--space-4);
                align-items: start;
            }

            .comparison-column {
                padding: var(--space-2);
            }

            .comparison-divider {
                background: var(--gray-200);
                height: 100%;
                min-height: 100px;
            }

            .term-item {
                padding: var(--space-2);
                margin-bottom: var(--space-2);
                border-radius: var(--radius-md);
                font-size: var(--text-sm);
            }

            .term-item strong {
                display: block;
                margin-bottom: var(--space-1);
                color: var(--text-secondary);
            }

            .changed-item {
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
            }

            .critical-changes {
                background: rgba(239, 68, 68, 0.05);
                padding: var(--space-4);
                border-radius: var(--radius-lg);
                border: 1px solid rgba(239, 68, 68, 0.2);
            }

            .critical-list {
                margin: 0;
                padding-left: var(--space-4);
                color: var(--error);
            }

            .no-changes {
                color: var(--text-muted);
                font-style: italic;
                text-align: center;
            }

            @media (max-width: 768px) {
                .version-selectors {
                    flex-direction: column;
                }

                .version-arrow {
                    transform: rotate(90deg);
                    padding: 0;
                }

                .comparison-header-info {
                    grid-template-columns: 1fr;
                    gap: var(--space-3);
                }

                .comparison-grid {
                    grid-template-columns: 1fr;
                    gap: var(--space-3);
                }

                .comparison-divider {
                    display: none;
                }

                .comparison-column + .comparison-column {
                    border-top: 2px solid var(--gray-200);
                    padding-top: var(--space-4);
                }
            }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize version comparison when agreement manager is ready
window.addEventListener('load', () => {
    if (window.agreementDisplayManager) {
        window.agreementVersionComparison = new AgreementVersionComparison(window.agreementDisplayManager);
        
        // Add version comparison button to agreement displays
        const addComparisonButtons = () => {
            const agreementActions = document.querySelectorAll('.agreement-actions');
            agreementActions.forEach(actions => {
                if (!actions.querySelector('.btn-compare-versions')) {
                    const compareBtn = document.createElement('button');
                    compareBtn.className = 'btn btn-secondary btn-compare-versions';
                    compareBtn.innerHTML = '📊 Compare Versions';
                    compareBtn.onclick = () => {
                        const agreementId = window.agreementDisplayManager.currentAgreement?.id;
                        const agreementType = window.agreementDisplayManager.currentAgreement?.type || 'deal';
                        if (agreementId) {
                            window.agreementVersionComparison.showVersionComparison(agreementId, agreementType);
                        }
                    };
                    actions.insertBefore(compareBtn, actions.firstChild);
                }
            });
        };

        // Add buttons when agreements are displayed
        const observer = new MutationObserver(addComparisonButtons);
        observer.observe(document.body, { childList: true, subtree: true });
    }
});
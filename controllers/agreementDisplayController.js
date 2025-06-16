const Deal = require('../models/deal');
const Offer = require('../models/offer');
const User = require('../models/User');
const { successResponse, errorResponse, handleServerError } = require('../utils/responseHelper');

/**
 * Agreement Display Controller
 * Provides concise, clear agreement summaries for deals and offers
 * with visual indicators, key terms highlighting, and easy-to-understand formatting
 */

// Get concise agreement summary for a deal
exports.getDealAgreementSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealId } = req.params;
    const { format = 'detailed', includeHistory = false } = req.query;

    const deal = await Deal.findById(dealId)
      .populate('creatorId', 'userName email profileImage socialMediaStats')
      .populate('marketerId', 'userName email profileImage companyName');

    if (!deal) {
      return errorResponse(res, "Deal not found", 404);
    }

    // Verify user access
    if (deal.creatorId._id.toString() !== userId && deal.marketerId._id.toString() !== userId) {
      return errorResponse(res, "Access denied - you are not a participant in this deal", 403);
    }

    const userRole = deal.creatorId._id.toString() === userId ? 'creator' : 'marketer';
    const agreement = await buildDealAgreementSummary(deal, userRole, format, includeHistory);

    return successResponse(res, "Deal agreement summary retrieved successfully", {
      agreement,
      userRole,
      permissions: getUserAgreementPermissions(deal, userId),
      lastUpdated: deal.updatedAt,
      version: deal.version || 1
    });

  } catch (error) {
    console.error("Error getting deal agreement summary:", error);
    return handleServerError(res, error);
  }
};

// Get concise agreement summary for an offer
exports.getOfferAgreementSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { offerId } = req.params;
    const { format = 'detailed', includeNegotiation = false } = req.query;

    const offer = await Offer.findById(offerId)
      .populate('creatorId', 'userName email profileImage socialMediaStats')
      .populate('marketerId', 'userName email profileImage companyName');

    if (!offer) {
      return errorResponse(res, "Offer not found", 404);
    }

    // Verify user access
    if (offer.creatorId._id.toString() !== userId && offer.marketerId._id.toString() !== userId) {
      return errorResponse(res, "Access denied - you are not a participant in this offer", 403);
    }

    const userRole = offer.creatorId._id.toString() === userId ? 'creator' : 'marketer';
    const agreement = await buildOfferAgreementSummary(offer, userRole, format, includeNegotiation);

    return successResponse(res, "Offer agreement summary retrieved successfully", {
      agreement,
      userRole,
      permissions: getUserAgreementPermissions(offer, userId),
      lastUpdated: offer.updatedAt,
      version: offer.version || 1
    });

  } catch (error) {
    console.error("Error getting offer agreement summary:", error);
    return handleServerError(res, error);
  }
};

// Generate agreement document (PDF-ready format)
exports.generateAgreementDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealId, offerId } = req.body;
    const { format = 'pdf', includeSignatures = true, templateType = 'standard' } = req.body;

    if (!dealId && !offerId) {
      return errorResponse(res, "Either dealId or offerId is required", 400);
    }

    let document;
    if (dealId) {
      const deal = await Deal.findById(dealId)
        .populate('creatorId marketerId');
      
      if (!deal) {
        return errorResponse(res, "Deal not found", 404);
      }

      // Verify user access
      if (deal.creatorId._id.toString() !== userId && deal.marketerId._id.toString() !== userId) {
        return errorResponse(res, "Access denied", 403);
      }

      document = await generateDealDocument(deal, format, templateType, includeSignatures);
    }

    if (offerId) {
      const offer = await Offer.findById(offerId)
        .populate('creatorId marketerId');
      
      if (!offer) {
        return errorResponse(res, "Offer not found", 404);
      }

      // Verify user access
      if (offer.creatorId._id.toString() !== userId && offer.marketerId._id.toString() !== userId) {
        return errorResponse(res, "Access denied", 403);
      }

      document = await generateOfferDocument(offer, format, templateType, includeSignatures);
    }

    return successResponse(res, "Agreement document generated successfully", {
      document,
      downloadUrl: document.downloadUrl,
      format,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

  } catch (error) {
    console.error("Error generating agreement document:", error);
    return handleServerError(res, error);
  }
};

// Get agreement comparison between versions
exports.getAgreementComparison = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealId, offerId, fromVersion = 1, toVersion = 'current' } = req.query;

    if (!dealId && !offerId) {
      return errorResponse(res, "Either dealId or offerId is required", 400);
    }

    let comparison;
    if (dealId) {
      const deal = await Deal.findById(dealId);
      if (!deal) {
        return errorResponse(res, "Deal not found", 404);
      }

      // Verify user access
      if (deal.creatorId.toString() !== userId && deal.marketerId.toString() !== userId) {
        return errorResponse(res, "Access denied", 403);
      }

      comparison = await generateDealComparison(deal, fromVersion, toVersion);
    }

    if (offerId) {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        return errorResponse(res, "Offer not found", 404);
      }

      // Verify user access
      if (offer.creatorId.toString() !== userId && offer.marketerId.toString() !== userId) {
        return errorResponse(res, "Access denied", 403);
      }

      comparison = await generateOfferComparison(offer, fromVersion, toVersion);
    }

    return successResponse(res, "Agreement comparison retrieved successfully", {
      comparison,
      fromVersion,
      toVersion,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error getting agreement comparison:", error);
    return handleServerError(res, error);
  }
};

// Get key terms and highlights
exports.getKeyTermsHighlight = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dealId, offerId } = req.params;
    const { highlightType = 'important', userContext = true } = req.query;

    if (!dealId && !offerId) {
      return errorResponse(res, "Either dealId or offerId is required", 400);
    }

    let keyTerms;
    if (dealId) {
      const deal = await Deal.findById(dealId);
      if (!deal) {
        return errorResponse(res, "Deal not found", 404);
      }

      // Verify user access
      if (deal.creatorId.toString() !== userId && deal.marketerId.toString() !== userId) {
        return errorResponse(res, "Access denied", 403);
      }

      const userRole = deal.creatorId.toString() === userId ? 'creator' : 'marketer';
      keyTerms = await extractDealKeyTerms(deal, userRole, highlightType, userContext);
    }

    if (offerId) {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        return errorResponse(res, "Offer not found", 404);
      }

      // Verify user access
      if (offer.creatorId.toString() !== userId && offer.marketerId.toString() !== userId) {
        return errorResponse(res, "Access denied", 403);
      }

      const userRole = offer.creatorId.toString() === userId ? 'creator' : 'marketer';
      keyTerms = await extractOfferKeyTerms(offer, userRole, highlightType, userContext);
    }

    return successResponse(res, "Key terms highlighted successfully", {
      keyTerms,
      highlightType,
      userContext,
      totalTerms: keyTerms.length,
      criticalTerms: keyTerms.filter(term => term.priority === 'critical').length
    });

  } catch (error) {
    console.error("Error highlighting key terms:", error);
    return handleServerError(res, error);
  }
};

// Helper functions
const buildDealAgreementSummary = async (deal, userRole, format, includeHistory) => {
  const summary = {
    header: {
      title: deal.dealName || `Collaboration Agreement`,
      dealNumber: deal.dealNumber,
      status: deal.status,
      statusColor: getStatusColor(deal.status),
      createdDate: deal.createdAt,
      lastModified: deal.updatedAt
    },
    parties: {
      creator: {
        name: deal.creatorId.userName,
        email: deal.creatorId.email,
        profileImage: deal.creatorId.profileImage,
        role: 'Content Creator',
        followers: deal.creatorId.socialMediaStats?.totalFollowers || 0,
        platforms: deal.creatorId.socialMediaStats?.platforms || []
      },
      marketer: {
        name: deal.marketerId.userName,
        email: deal.marketerId.email,
        profileImage: deal.marketerId.profileImage,
        company: deal.marketerId.companyName,
        role: 'Brand/Marketer'
      },
      userRole: userRole
    },
    financials: {
      totalAmount: deal.paymentInfo?.paymentAmount || 0,
      currency: deal.paymentInfo?.currency || 'USD',
      paymentStructure: deal.paymentInfo?.paymentType || 'one-time',
      paymentStatus: deal.paymentInfo?.status || 'pending',
      milestones: deal.milestones?.map(m => ({
        name: m.name,
        amount: m.paymentAmount,
        dueDate: m.dueDate,
        status: m.status,
        description: m.description
      })) || [],
      escrowProtection: true,
      refundPolicy: deal.refundPolicy || 'Standard 7-day policy'
    },
    scope: {
      platforms: deal.socialMediaDetails?.platforms || [],
      contentTypes: deal.deliverables?.map(d => d.type) || [],
      deliverables: deal.deliverables?.map(d => ({
        type: d.type,
        description: d.description,
        quantity: d.quantity || 1,
        dueDate: d.dueDate,
        specifications: d.specifications || {}
      })) || [],
      timeline: {
        startDate: deal.startDate,
        endDate: deal.endDate,
        duration: calculateDuration(deal.startDate, deal.endDate),
        keyMilestones: deal.milestones?.filter(m => m.isKey).map(m => ({
          name: m.name,
          date: m.dueDate,
          description: m.description
        })) || []
      }
    },
    terms: {
      usage_rights: deal.usageRights || 'Standard usage rights as per platform guidelines',
      content_guidelines: deal.contentGuidelines || [],
      brand_requirements: deal.brandRequirements || [],
      approval_process: deal.approvalProcess || 'Creator submits → Marketer reviews → Approval/Revision',
      revision_policy: deal.revisionPolicy || 'Up to 2 rounds of revisions included',
      cancellation_policy: deal.cancellationPolicy || 'Either party may cancel with 48-hour notice'
    },
    legal: {
      jurisdiction: deal.jurisdiction || 'Platform Terms of Service',
      dispute_resolution: deal.disputeResolution || 'Platform mediation process',
      intellectual_property: deal.intellectualProperty || 'Creator retains content rights',
      confidentiality: deal.confidentiality || 'Standard confidentiality applies',
      liability: deal.liability || 'Limited to collaboration amount'
    },
    status_indicators: {
      overall_health: calculateDealHealth(deal),
      completion_percentage: calculateCompletionPercentage(deal),
      risk_factors: identifyRiskFactors(deal),
      next_actions: getNextActions(deal, userRole)
    }
  };

  if (format === 'compact') {
    return compactifyAgreement(summary);
  }

  if (includeHistory && deal.history) {
    summary.history = deal.history.map(entry => ({
      action: entry.action,
      timestamp: entry.timestamp,
      actor: entry.actor,
      changes: entry.changes,
      impact: entry.impact
    }));
  }

  return summary;
};

const buildOfferAgreementSummary = async (offer, userRole, format, includeNegotiation) => {
  const summary = {
    header: {
      title: offer.campaignDetails?.campaignName || 'Collaboration Offer',
      offerNumber: generateOfferNumber(offer._id),
      status: offer.status,
      statusColor: getStatusColor(offer.status),
      createdDate: offer.createdAt,
      expiryDate: offer.responseDeadline,
      timeRemaining: calculateTimeRemaining(offer.responseDeadline)
    },
    parties: {
      creator: {
        name: offer.creatorId.userName,
        email: offer.creatorId.email,
        profileImage: offer.creatorId.profileImage,
        role: 'Content Creator',
        followers: offer.creatorId.socialMediaStats?.totalFollowers || 0,
        platforms: offer.creatorId.socialMediaStats?.platforms || []
      },
      marketer: {
        name: offer.marketerId.userName,
        email: offer.marketerId.email,
        profileImage: offer.marketerId.profileImage,
        company: offer.marketerId.companyName,
        role: 'Brand/Marketer'
      },
      userRole: userRole
    },
    proposed_terms: {
      compensation: {
        amount: offer.paymentTerms?.amount || 0,
        currency: offer.paymentTerms?.currency || 'USD',
        type: offer.paymentTerms?.type || 'fixed',
        milestones: offer.paymentTerms?.milestones || [],
        bonus_potential: offer.paymentTerms?.bonusPotential || 0
      },
      scope: {
        platforms: offer.socialMediaDetails?.platforms || [],
        content_types: offer.deliverables?.map(d => d.type) || [],
        content_count: offer.deliverables?.reduce((sum, d) => sum + (d.quantity || 1), 0) || 1,
        timeline: offer.timeline || 'To be determined',
        special_requirements: offer.specialRequirements || []
      },
      campaign_details: {
        campaign_name: offer.campaignDetails?.campaignName,
        campaign_type: offer.campaignDetails?.campaignType,
        target_audience: offer.campaignDetails?.targetAudience,
        campaign_goals: offer.campaignDetails?.goals || [],
        brand_guidelines: offer.campaignDetails?.brandGuidelines || [],
        hashtags: offer.campaignDetails?.hashtags || [],
        mentions: offer.campaignDetails?.mentions || []
      }
    },
    conditions: {
      performance_metrics: offer.performanceMetrics || [],
      content_guidelines: offer.contentGuidelines || [],
      posting_schedule: offer.postingSchedule || {},
      approval_requirements: offer.approvalRequirements || 'Standard approval process',
      usage_rights: offer.usageRights || 'Platform standard rights',
      exclusivity: offer.exclusivity || 'Non-exclusive'
    },
    decision_factors: {
      pros: generateOfferPros(offer, userRole),
      considerations: generateOfferConsiderations(offer, userRole),
      alternatives: generateOfferAlternatives(offer, userRole),
      recommendation: generateOfferRecommendation(offer, userRole)
    }
  };

  if (format === 'compact') {
    return compactifyAgreement(summary);
  }

  if (includeNegotiation && offer.negotiationHistory) {
    summary.negotiation_history = offer.negotiationHistory.map(entry => ({
      round: entry.round,
      party: entry.party,
      changes: entry.changes,
      timestamp: entry.timestamp,
      status: entry.status,
      impact_score: entry.impactScore
    }));
  }

  return summary;
};

const getStatusColor = (status) => {
  const colorMap = {
    'pending': '#FFA500',    // Orange
    'accepted': '#4CAF50',   // Green
    'rejected': '#F44336',   // Red
    'active': '#2196F3',     // Blue
    'completed': '#4CAF50',  // Green
    'cancelled': '#9E9E9E',  // Gray
    'disputed': '#FF5722',   // Deep Orange
    'expired': '#795548'     // Brown
  };
  
  return colorMap[status] || '#9E9E9E';
};

const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 'TBD';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 7) {
    return `${diffDays} days`;
  } else if (diffDays < 30) {
    return `${Math.ceil(diffDays / 7)} weeks`;
  } else {
    return `${Math.ceil(diffDays / 30)} months`;
  }
};

const calculateDealHealth = (deal) => {
  let score = 100;
  
  // Deduct points for issues
  if (deal.status === 'disputed') score -= 30;
  if (deal.status === 'cancelled') score -= 50;
  
  // Check for overdue milestones
  const overdueMilestones = deal.milestones?.filter(m => 
    new Date(m.dueDate) < new Date() && m.status !== 'completed'
  ).length || 0;
  score -= overdueMilestones * 10;
  
  // Check payment status
  if (!deal.paymentInfo?.isPaid && deal.status === 'active') score -= 15;
  
  // Communication health
  if (!deal.lastMessageAt || 
      (new Date() - new Date(deal.lastMessageAt)) > (7 * 24 * 60 * 60 * 1000)) {
    score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
};

const calculateCompletionPercentage = (deal) => {
  if (!deal.milestones || deal.milestones.length === 0) {
    return deal.status === 'completed' ? 100 : 0;
  }
  
  const completedMilestones = deal.milestones.filter(m => m.status === 'completed').length;
  return Math.round((completedMilestones / deal.milestones.length) * 100);
};

const identifyRiskFactors = (deal) => {
  const risks = [];
  
  // Timeline risks
  const overdueMilestones = deal.milestones?.filter(m => 
    new Date(m.dueDate) < new Date() && m.status !== 'completed'
  ) || [];
  
  if (overdueMilestones.length > 0) {
    risks.push({
      type: 'timeline',
      level: 'high',
      description: `${overdueMilestones.length} milestone(s) overdue`,
      impact: 'Potential project delays'
    });
  }
  
  // Payment risks
  if (!deal.paymentInfo?.isPaid && deal.status === 'active') {
    risks.push({
      type: 'payment',
      level: 'medium',
      description: 'Payment not yet processed',
      impact: 'May affect creator motivation'
    });
  }
  
  // Communication risks
  if (!deal.lastMessageAt || 
      (new Date() - new Date(deal.lastMessageAt)) > (7 * 24 * 60 * 60 * 1000)) {
    risks.push({
      type: 'communication',
      level: 'medium',
      description: 'Limited recent communication',
      impact: 'Potential misunderstandings'
    });
  }
  
  return risks;
};

const getNextActions = (deal, userRole) => {
  const actions = [];
  
  if (userRole === 'creator') {
    // Creator actions
    const pendingDeliverables = deal.deliverables?.filter(d => 
      d.status === 'pending' || d.status === 'in_progress'
    ) || [];
    
    if (pendingDeliverables.length > 0) {
      actions.push({
        action: 'submit_content',
        priority: 'high',
        description: `Submit ${pendingDeliverables.length} pending deliverable(s)`,
        deadline: pendingDeliverables[0]?.dueDate
      });
    }
    
    const approvedContent = deal.deliverables?.filter(d => 
      d.status === 'approved' && !d.publishedAt
    ) || [];
    
    if (approvedContent.length > 0) {
      actions.push({
        action: 'publish_content',
        priority: 'medium',
        description: 'Publish approved content',
        deadline: null
      });
    }
  } else {
    // Marketer actions
    if (!deal.paymentInfo?.isPaid && deal.status === 'accepted') {
      actions.push({
        action: 'process_payment',
        priority: 'critical',
        description: 'Complete payment to start collaboration',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }
    
    const submittedContent = deal.deliverables?.filter(d => 
      d.status === 'submitted'
    ) || [];
    
    if (submittedContent.length > 0) {
      actions.push({
        action: 'review_content',
        priority: 'high',
        description: `Review ${submittedContent.length} submitted deliverable(s)`,
        deadline: null
      });
    }
  }
  
  return actions;
};

const compactifyAgreement = (summary) => {
  return {
    header: summary.header,
    key_info: {
      parties: `${summary.parties.creator.name} ↔ ${summary.parties.marketer.name}`,
      amount: `${summary.financials?.totalAmount || summary.proposed_terms?.compensation?.amount || 0} ${summary.financials?.currency || summary.proposed_terms?.compensation?.currency || 'USD'}`,
      timeline: summary.scope?.timeline?.duration || summary.proposed_terms?.scope?.timeline,
      status: summary.header.status
    },
    critical_terms: extractCriticalTerms(summary),
    next_steps: summary.status_indicators?.next_actions || summary.decision_factors?.recommendation
  };
};

const extractCriticalTerms = (summary) => {
  const terms = [];
  
  // Payment terms
  if (summary.financials?.totalAmount || summary.proposed_terms?.compensation?.amount) {
    terms.push({
      category: 'payment',
      term: 'Total Compensation',
      value: `${summary.financials?.totalAmount || summary.proposed_terms?.compensation?.amount} ${summary.financials?.currency || summary.proposed_terms?.compensation?.currency}`,
      importance: 'critical'
    });
  }
  
  // Deliverables
  if (summary.scope?.deliverables || summary.proposed_terms?.scope?.content_types) {
    const deliverables = summary.scope?.deliverables?.map(d => d.type).join(', ') || 
                        summary.proposed_terms?.scope?.content_types?.join(', ');
    terms.push({
      category: 'scope',
      term: 'Deliverables',
      value: deliverables,
      importance: 'high'
    });
  }
  
  // Timeline
  if (summary.scope?.timeline || summary.proposed_terms?.scope?.timeline) {
    terms.push({
      category: 'timeline',
      term: 'Project Duration',
      value: summary.scope?.timeline?.duration || summary.proposed_terms?.scope?.timeline,
      importance: 'high'
    });
  }
  
  // Usage rights
  if (summary.terms?.usage_rights || summary.conditions?.usage_rights) {
    terms.push({
      category: 'legal',
      term: 'Usage Rights',
      value: summary.terms?.usage_rights || summary.conditions?.usage_rights,
      importance: 'medium'
    });
  }
  
  return terms;
};

const generateOfferNumber = (offerId) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const shortId = offerId.toString().slice(-6).toUpperCase();
  return `OFF-${year}${month}-${shortId}`;
};

const calculateTimeRemaining = (deadline) => {
  if (!deadline) return null;
  
  const now = new Date();
  const end = new Date(deadline);
  const diffTime = end - now;
  
  if (diffTime <= 0) return 'Expired';
  
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  
  if (diffDays > 1) {
    return `${diffDays} days remaining`;
  } else if (diffHours > 1) {
    return `${diffHours} hours remaining`;
  } else {
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    return `${diffMinutes} minutes remaining`;
  }
};

const generateOfferPros = (offer, userRole) => {
  const pros = [];
  
  if (offer.paymentTerms?.amount > 0) {
    pros.push(`Compensation: ${offer.paymentTerms.amount} ${offer.paymentTerms.currency || 'USD'}`);
  }
  
  if (offer.socialMediaDetails?.platforms?.length > 0) {
    pros.push(`Multi-platform exposure: ${offer.socialMediaDetails.platforms.join(', ')}`);
  }
  
  if (offer.campaignDetails?.brandGuidelines?.length > 0) {
    pros.push('Clear brand guidelines provided');
  }
  
  if (offer.timeline && !offer.timeline.includes('urgent')) {
    pros.push('Reasonable timeline for deliverables');
  }
  
  return pros;
};

const generateOfferConsiderations = (offer, userRole) => {
  const considerations = [];
  
  if (offer.exclusivity === 'exclusive') {
    considerations.push('Exclusive partnership may limit other opportunities');
  }
  
  if (offer.performanceMetrics?.length > 0) {
    considerations.push('Performance metrics requirements included');
  }
  
  if (!offer.usageRights || offer.usageRights.includes('unlimited')) {
    considerations.push('Review usage rights carefully');
  }
  
  if (offer.deliverables?.some(d => d.revisions > 2)) {
    considerations.push('Multiple revision rounds may be required');
  }
  
  return considerations;
};

const generateOfferAlternatives = (offer, userRole) => {
  const alternatives = [];
  
  alternatives.push('Negotiate higher compensation');
  alternatives.push('Request shorter timeline or fewer deliverables');
  alternatives.push('Propose alternative content formats');
  alternatives.push('Suggest performance-based bonus structure');
  
  return alternatives;
};

const generateOfferRecommendation = (offer, userRole) => {
  // Simple recommendation logic based on offer characteristics
  const score = calculateOfferScore(offer);
  
  if (score >= 80) {
    return {
      action: 'accept',
      confidence: 'high',
      reasoning: 'Strong offer with fair compensation and clear terms'
    };
  } else if (score >= 60) {
    return {
      action: 'negotiate',
      confidence: 'medium',
      reasoning: 'Good foundation but room for improvement in terms'
    };
  } else {
    return {
      action: 'consider_carefully',
      confidence: 'low',
      reasoning: 'Offer may need significant improvements before acceptance'
    };
  }
};

const calculateOfferScore = (offer) => {
  let score = 50; // Base score
  
  // Payment score
  if (offer.paymentTerms?.amount > 0) score += 20;
  if (offer.paymentTerms?.type === 'milestone') score += 10;
  
  // Scope clarity
  if (offer.deliverables?.length > 0) score += 15;
  if (offer.campaignDetails?.campaignName) score += 5;
  
  // Timeline reasonableness
  if (offer.timeline && !offer.timeline.includes('urgent')) score += 10;
  
  return Math.min(100, score);
};

const getUserAgreementPermissions = (doc, userId) => {
  const isParticipant = doc.creatorId._id?.toString() === userId || doc.marketerId._id?.toString() === userId;
  
  return {
    canView: isParticipant,
    canDownload: isParticipant,
    canShare: isParticipant,
    canComment: isParticipant,
    canRequestChanges: isParticipant && (doc.status === 'pending' || doc.status === 'negotiating')
  };
};

const generateDealDocument = async (deal, format, templateType, includeSignatures) => {
  // This would integrate with a document generation service
  const document = {
    title: `${deal.dealName} - Agreement`,
    type: 'deal_agreement',
    format: format,
    template: templateType,
    content: await buildDealAgreementSummary(deal, 'neutral', 'detailed', true),
    downloadUrl: `/api/agreements/download/${deal._id}?format=${format}`,
    previewUrl: `/api/agreements/preview/${deal._id}`,
    signatures: includeSignatures ? {
      creator: { required: true, status: 'pending' },
      marketer: { required: true, status: 'pending' }
    } : null
  };
  
  return document;
};

const generateOfferDocument = async (offer, format, templateType, includeSignatures) => {
  // This would integrate with a document generation service
  const document = {
    title: `${offer.campaignDetails?.campaignName || 'Collaboration'} - Offer`,
    type: 'offer_proposal',
    format: format,
    template: templateType,
    content: await buildOfferAgreementSummary(offer, 'neutral', 'detailed', true),
    downloadUrl: `/api/agreements/download-offer/${offer._id}?format=${format}`,
    previewUrl: `/api/agreements/preview-offer/${offer._id}`,
    signatures: includeSignatures ? {
      creator: { required: true, status: 'pending' },
      marketer: { required: true, status: 'signed' }
    } : null
  };
  
  return document;
};

const generateDealComparison = async (deal, fromVersion, toVersion) => {
  // This would compare different versions of the deal
  // For now, return a placeholder structure
  return {
    summary: {
      changesCount: 5,
      majorChanges: 2,
      minorChanges: 3,
      lastChanged: deal.updatedAt
    },
    changes: [
      {
        field: 'paymentAmount',
        type: 'modified',
        from: '$800',
        to: '$1000',
        impact: 'major',
        timestamp: deal.updatedAt
      }
    ]
  };
};

const generateOfferComparison = async (offer, fromVersion, toVersion) => {
  // This would compare different versions of the offer
  // For now, return a placeholder structure
  return {
    summary: {
      changesCount: 3,
      majorChanges: 1,
      minorChanges: 2,
      lastChanged: offer.updatedAt
    },
    changes: [
      {
        field: 'paymentAmount',
        type: 'modified',
        from: '$500',
        to: '$750',
        impact: 'major',
        timestamp: offer.updatedAt
      }
    ]
  };
};

const extractDealKeyTerms = async (deal, userRole, highlightType, userContext) => {
  const keyTerms = [];
  
  // Payment terms
  keyTerms.push({
    category: 'financial',
    term: 'Total Compensation',
    value: `$${deal.paymentInfo?.paymentAmount || 0}`,
    importance: 'critical',
    description: 'Total amount to be paid for the collaboration',
    userImpact: userRole === 'creator' ? 'earnings' : 'cost'
  });
  
  // Timeline terms
  if (deal.startDate && deal.endDate) {
    keyTerms.push({
      category: 'timeline',
      term: 'Project Duration',
      value: calculateDuration(deal.startDate, deal.endDate),
      importance: 'high',
      description: 'Total time allocated for project completion',
      userImpact: 'commitment'
    });
  }
  
  // Deliverables
  if (deal.deliverables?.length > 0) {
    keyTerms.push({
      category: 'scope',
      term: 'Deliverables',
      value: `${deal.deliverables.length} items`,
      importance: 'high',
      description: deal.deliverables.map(d => d.type).join(', '),
      userImpact: userRole === 'creator' ? 'workload' : 'value'
    });
  }
  
  // Usage rights
  keyTerms.push({
    category: 'legal',
    term: 'Usage Rights',
    value: deal.usageRights || 'Standard',
    importance: 'medium',
    description: 'How the content can be used after creation',
    userImpact: 'rights'
  });
  
  return keyTerms.filter(term => {
    if (highlightType === 'critical') return term.importance === 'critical';
    if (highlightType === 'important') return ['critical', 'high'].includes(term.importance);
    return true;
  });
};

const extractOfferKeyTerms = async (offer, userRole, highlightType, userContext) => {
  const keyTerms = [];
  
  // Payment terms
  keyTerms.push({
    category: 'financial',
    term: 'Proposed Compensation',
    value: `$${offer.paymentTerms?.amount || 0}`,
    importance: 'critical',
    description: 'Compensation offered for the collaboration',
    userImpact: userRole === 'creator' ? 'potential_earnings' : 'budget'
  });
  
  // Scope
  if (offer.deliverables?.length > 0) {
    keyTerms.push({
      category: 'scope',
      term: 'Content Requirements',
      value: offer.deliverables.map(d => d.type).join(', '),
      importance: 'high',
      description: 'Types and quantity of content required',
      userImpact: userRole === 'creator' ? 'workload' : 'deliverables'
    });
  }
  
  // Timeline
  if (offer.timeline) {
    keyTerms.push({
      category: 'timeline',
      term: 'Timeline',
      value: offer.timeline,
      importance: 'high',
      description: 'Expected timeline for deliverables',
      userImpact: 'schedule'
    });
  }
  
  // Response deadline
  if (offer.responseDeadline) {
    keyTerms.push({
      category: 'deadline',
      term: 'Response Deadline',
      value: calculateTimeRemaining(offer.responseDeadline),
      importance: 'critical',
      description: 'Time remaining to respond to this offer',
      userImpact: 'urgency'
    });
  }
  
  return keyTerms.filter(term => {
    if (highlightType === 'critical') return term.importance === 'critical';
    if (highlightType === 'important') return ['critical', 'high'].includes(term.importance);
    return true;
  });
};

module.exports = exports;
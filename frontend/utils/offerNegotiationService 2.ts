import { useState, useEffect } from 'react';

export interface Offer {
  id: string;
  creatorId: string;
  marketerId: string;
  campaignId?: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  description: string;
  deliverables: string[];
  timeline: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  counterOffer?: CounterOffer;
}

export interface CounterOffer {
  id: string;
  originalOfferId: string;
  amount: number;
  description: string;
  deliverables: string[];
  timeline: string;
  createdBy: 'creator' | 'marketer';
  createdAt: Date;
}

export interface NegotiationHistory {
  id: string;
  offerId: string;
  action: 'created' | 'countered' | 'accepted' | 'rejected';
  actor: 'creator' | 'marketer';
  amount?: number;
  message?: string;
  timestamp: Date;
}

export function useOfferNegotiation(offerId?: string) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [history, setHistory] = useState<NegotiationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOffer = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder implementation
      // In real app, this would fetch from API
      const mockOffer: Offer = {
        id,
        creatorId: 'creator-1',
        marketerId: 'marketer-1',
        amount: 1000,
        status: 'pending',
        description: 'Sample offer',
        deliverables: ['Deliverable 1', 'Deliverable 2'],
        timeline: '2 weeks',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setOffer(mockOffer);
    } catch (err) {
      setError('Failed to load offer');
    } finally {
      setIsLoading(false);
    }
  };

  const createCounterOffer = async (
    amount: number,
    description: string,
    deliverables: string[],
    timeline: string
  ) => {
    if (!offer) return;
    
    const counter: CounterOffer = {
      id: Date.now().toString(),
      originalOfferId: offer.id,
      amount,
      description,
      deliverables,
      timeline,
      createdBy: 'creator', // This would be determined by current user
      createdAt: new Date(),
    };

    setOffer({
      ...offer,
      status: 'countered',
      counterOffer: counter,
      updatedAt: new Date(),
    });

    addToHistory('countered', 'creator', amount, description);
  };

  const acceptOffer = async () => {
    if (!offer) return;
    
    setOffer({
      ...offer,
      status: 'accepted',
      updatedAt: new Date(),
    });

    addToHistory('accepted', 'creator');
  };

  const rejectOffer = async (reason?: string) => {
    if (!offer) return;
    
    setOffer({
      ...offer,
      status: 'rejected',
      updatedAt: new Date(),
    });

    addToHistory('rejected', 'creator', undefined, reason);
  };

  const addToHistory = (
    action: NegotiationHistory['action'],
    actor: NegotiationHistory['actor'],
    amount?: number,
    message?: string
  ) => {
    const entry: NegotiationHistory = {
      id: Date.now().toString(),
      offerId: offer?.id || '',
      action,
      actor,
      amount,
      message,
      timestamp: new Date(),
    };
    
    setHistory(prev => [...prev, entry]);
  };

  useEffect(() => {
    if (offerId) {
      loadOffer(offerId);
    }
  }, [offerId]);

  return {
    offer,
    history,
    isLoading,
    error,
    createCounterOffer,
    acceptOffer,
    rejectOffer,
    loadOffer,
  };
}
import { useState, useEffect } from 'react';

export interface Deal {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  creatorId: string;
  marketerId: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  dealId: string;
  title: string;
  description: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  dueDate?: Date;
  completedAt?: Date;
}

export interface DealStats {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  totalRevenue: number;
  pendingPayments: number;
}

export function useDealDashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats>({
    totalDeals: 0,
    activeDeals: 0,
    completedDeals: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDeals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Placeholder implementation
      // In real app, this would fetch from API
      setDeals([]);
      calculateStats([]);
    } catch (err) {
      setError('Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (dealsList: Deal[]) => {
    const stats: DealStats = {
      totalDeals: dealsList.length,
      activeDeals: dealsList.filter(d => d.status === 'active').length,
      completedDeals: dealsList.filter(d => d.status === 'completed').length,
      totalRevenue: dealsList.reduce((sum, d) => sum + (d.amount || 0), 0),
      pendingPayments: dealsList.filter(d => d.status === 'active').reduce((sum, d) => sum + (d.amount || 0), 0),
    };
    setStats(stats);
  };

  const updateDealStatus = async (dealId: string, status: Deal['status']) => {
    setDeals(prev => 
      prev.map(deal => 
        deal.id === dealId ? { ...deal, status, updatedAt: new Date() } : deal
      )
    );
  };

  const addDeal = (deal: Deal) => {
    setDeals(prev => [...prev, deal]);
  };

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    calculateStats(deals);
  }, [deals]);

  return {
    deals,
    stats,
    isLoading,
    error,
    loadDeals,
    updateDealStatus,
    addDeal,
  };
}
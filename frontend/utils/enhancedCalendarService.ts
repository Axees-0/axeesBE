import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CalendarEvent, CalendarView } from '@/components/EnhancedCalendar';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

export interface EnhancedCalendarConfig {
  userId: string;
  userType: 'creator' | 'marketer' | 'admin';
  view: CalendarView;
}

export class EnhancedCalendarService {
  private static instance: EnhancedCalendarService;
  private cachedEvents: Map<string, CalendarEvent[]> = new Map();
  private subscribers: Map<string, Set<(events: CalendarEvent[]) => void>> = new Map();

  static getInstance(): EnhancedCalendarService {
    if (!EnhancedCalendarService.instance) {
      EnhancedCalendarService.instance = new EnhancedCalendarService();
    }
    return EnhancedCalendarService.instance;
  }

  // Generate cache key
  private getCacheKey(config: EnhancedCalendarConfig): string {
    const { userId, userType, view } = config;
    const dateKey = view.date.toISOString().split('T')[0];
    const filtersKey = JSON.stringify(view.filters);
    return `calendar_${userId}_${userType}_${view.type}_${dateKey}_${Buffer.from(filtersKey).toString('base64')}`;
  }

  // Subscribe to event updates
  subscribe(userId: string, callback: (events: CalendarEvent[]) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(callback);

    return () => {
      this.subscribers.get(userId)?.delete(callback);
    };
  }

  // Notify subscribers
  private notifySubscribers(userId: string, events: CalendarEvent[]) {
    this.subscribers.get(userId)?.forEach(callback => callback(events));
  }

  // Load events from cache
  async loadEventsFromCache(config: EnhancedCalendarConfig): Promise<CalendarEvent[]> {
    try {
      const cacheKey = this.getCacheKey(config);
      
      // Check memory cache first
      if (this.cachedEvents.has(cacheKey)) {
        return this.cachedEvents.get(cacheKey) || [];
      }

      // Check AsyncStorage cache
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const events = JSON.parse(cached, this.dateReviver);
        this.cachedEvents.set(cacheKey, events);
        return events;
      }

      return [];
    } catch (error) {
      console.error('Failed to load events from cache:', error);
      return [];
    }
  }

  // Save events to cache
  async saveEventsToCache(config: EnhancedCalendarConfig, events: CalendarEvent[]): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(config);
      
      // Update memory cache
      this.cachedEvents.set(cacheKey, events);
      
      // Update AsyncStorage cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save events to cache:', error);
    }
  }

  // Date reviver for JSON.parse
  private dateReviver(key: string, value: any): any {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  }

  // Fetch events from backend
  async fetchEventsFromBackend(config: EnhancedCalendarConfig): Promise<CalendarEvent[]> {
    try {
      const { userId, userType, view } = config;
      
      // Calculate date range based on view
      const startDate = this.getViewStartDate(view);
      const endDate = this.getViewEndDate(view);
      
      const response = await axios.get(`${API_URL}/calendar/events`, {
        params: {
          userId,
          userType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          filters: JSON.stringify(view.filters)
        }
      });

      const backendEvents = response.data.events || [];
      
      // Transform backend data to our format
      const events: CalendarEvent[] = backendEvents.map((item: any) => ({
        id: item.id || `event_${Date.now()}_${Math.random()}`,
        title: item.title || 'Untitled Event',
        description: item.description || '',
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        type: item.type || 'meeting',
        status: item.status || 'upcoming',
        dealId: item.dealId,
        milestoneId: item.milestoneId,
        priority: item.priority || 'medium',
        participants: item.participants || [],
        metadata: item.metadata || {},
        color: item.color,
        isAllDay: item.isAllDay || false,
        recurring: item.recurring
      }));
      
      // Update cache
      await this.saveEventsToCache(config, events);
      
      return events;
    } catch (error) {
      console.error('Failed to fetch events from backend:', error);
      
      // Try to return cached data as fallback
      const cachedEvents = await this.loadEventsFromCache(config);
      if (cachedEvents.length > 0) {
        return cachedEvents;
      }
      
      // Return mock events if no cache and backend fails
      return this.generateMockEvents(config);
    }
  }

  // Get start date for view
  private getViewStartDate(view: CalendarView): Date {
    const date = new Date(view.date);
    
    switch (view.type) {
      case 'month':
        date.setDate(1);
        date.setDate(date.getDate() - date.getDay()); // Start from Sunday
        break;
      case 'week':
        date.setDate(date.getDate() - date.getDay()); // Start from Sunday
        break;
      case 'day':
        // Keep the same date
        break;
      case 'agenda':
        // Start from today
        break;
    }
    
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // Get end date for view
  private getViewEndDate(view: CalendarView): Date {
    const startDate = this.getViewStartDate(view);
    const endDate = new Date(startDate);
    
    switch (view.type) {
      case 'month':
        endDate.setDate(endDate.getDate() + 42); // 6 weeks
        break;
      case 'week':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'day':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'agenda':
        endDate.setDate(endDate.getDate() + 30); // Next 30 days
        break;
    }
    
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }

  // Create new event
  async createEvent(
    config: EnhancedCalendarConfig,
    event: Partial<CalendarEvent>
  ): Promise<{ success: boolean; event?: CalendarEvent; error?: string }> {
    try {
      const { userId } = config;
      
      const payload = {
        ...event,
        userId,
        startDate: event.startDate?.toISOString(),
        endDate: event.endDate?.toISOString()
      };

      const response = await axios.post(`${API_URL}/calendar/events`, payload);
      
      const newEvent: CalendarEvent = {
        ...response.data.event,
        startDate: new Date(response.data.event.startDate),
        endDate: new Date(response.data.event.endDate)
      };
      
      // Update cache by refetching events
      await this.fetchEventsFromBackend(config);
      
      // Notify subscribers
      this.notifySubscribers(userId, await this.loadEventsFromCache(config));
      
      return { success: true, event: newEvent };
    } catch (error: any) {
      console.error('Failed to create event:', error);
      return { success: false, error: error.message || 'Failed to create event' };
    }
  }

  // Update event
  async updateEvent(
    config: EnhancedCalendarConfig,
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { userId } = config;
      
      const payload = {
        ...updates,
        startDate: updates.startDate?.toISOString(),
        endDate: updates.endDate?.toISOString()
      };

      await axios.put(`${API_URL}/calendar/events/${eventId}`, payload);
      
      // Update cache by refetching events
      await this.fetchEventsFromBackend(config);
      
      // Notify subscribers
      this.notifySubscribers(userId, await this.loadEventsFromCache(config));
      
      return { success: true };
    } catch (error: any) {
      console.error('Failed to update event:', error);
      return { success: false, error: error.message || 'Failed to update event' };
    }
  }

  // Delete event
  async deleteEvent(
    config: EnhancedCalendarConfig,
    eventId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { userId } = config;
      
      await axios.delete(`${API_URL}/calendar/events/${eventId}`);
      
      // Update cache by refetching events
      await this.fetchEventsFromBackend(config);
      
      // Notify subscribers
      this.notifySubscribers(userId, await this.loadEventsFromCache(config));
      
      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      return { success: false, error: error.message || 'Failed to delete event' };
    }
  }

  // Generate mock events for demo/fallback
  private generateMockEvents(config: EnhancedCalendarConfig): CalendarEvent[] {
    const { userId, userType } = config;
    const events: CalendarEvent[] = [];
    const now = new Date();
    
    // Generate events for the next 30 days
    for (let i = 0; i < 30; i++) {
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + i);
      
      // Add 1-3 random events per day
      const numEvents = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numEvents; j++) {
        const startDate = new Date(eventDate);
        startDate.setHours(9 + j * 4, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 1);
        
        const eventTypes = ['deal', 'milestone', 'deadline', 'meeting', 'content', 'payment', 'review'];
        const statuses = ['upcoming', 'in_progress', 'completed', 'overdue'];
        const priorities = ['low', 'medium', 'high', 'urgent'];
        
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)] as CalendarEvent['type'];
        const status = statuses[Math.floor(Math.random() * statuses.length)] as CalendarEvent['status'];
        const priority = priorities[Math.floor(Math.random() * priorities.length)] as CalendarEvent['priority'];
        
        events.push({
          id: `mock_event_${i}_${j}`,
          title: this.generateEventTitle(type),
          description: this.generateEventDescription(type),
          startDate,
          endDate,
          type,
          status,
          priority,
          dealId: type === 'deal' ? `deal_${Math.random().toString(36).substr(2, 9)}` : undefined,
          milestoneId: type === 'milestone' ? `milestone_${Math.random().toString(36).substr(2, 9)}` : undefined,
          participants: [
            {
              userId: userId,
              name: userType === 'creator' ? 'John Creator' : 'Jane Marketer',
              userType: userType
            }
          ],
          metadata: {
            amount: type === 'payment' ? Math.floor(Math.random() * 5000) + 500 : undefined,
            location: type === 'meeting' ? (Math.random() > 0.5 ? 'Conference Room A' : 'Virtual') : undefined,
            isVirtual: type === 'meeting' ? Math.random() > 0.5 : undefined
          },
          isAllDay: Math.random() > 0.8
        });
      }
    }
    
    return events;
  }

  // Generate event titles based on type
  private generateEventTitle(type: CalendarEvent['type']): string {
    const titles = {
      deal: ['New Partnership Deal', 'Brand Collaboration', 'Sponsorship Agreement', 'Content Partnership'],
      milestone: ['Content Delivery', 'First Draft Review', 'Final Approval', 'Campaign Launch'],
      deadline: ['Submission Deadline', 'Review Deadline', 'Payment Due', 'Contract Signing'],
      meeting: ['Strategy Meeting', 'Kickoff Call', 'Progress Review', 'Planning Session'],
      content: ['Content Creation', 'Photo Shoot', 'Video Recording', 'Content Review'],
      payment: ['Payment Release', 'Invoice Due', 'Milestone Payment', 'Final Payment'],
      review: ['Content Review', 'Performance Review', 'Campaign Analysis', 'Feedback Session']
    };
    
    const typeOptions = titles[type] || ['Generic Event'];
    return typeOptions[Math.floor(Math.random() * typeOptions.length)];
  }

  // Generate event descriptions based on type
  private generateEventDescription(type: CalendarEvent['type']): string {
    const descriptions = {
      deal: 'Finalize partnership terms and sign collaboration agreement',
      milestone: 'Complete deliverable and submit for review',
      deadline: 'Important deadline that must be met',
      meeting: 'Team meeting to discuss project progress',
      content: 'Create content according to brand guidelines',
      payment: 'Process payment for completed work',
      review: 'Review and provide feedback on deliverables'
    };
    
    return descriptions[type] || 'Scheduled event';
  }

  // Get events for specific date range
  async getEventsInRange(
    config: EnhancedCalendarConfig,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const events = await this.fetchEventsFromBackend(config);
    
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      return (eventStart >= startDate && eventStart <= endDate) ||
             (eventEnd >= startDate && eventEnd <= endDate) ||
             (eventStart <= startDate && eventEnd >= endDate);
    });
  }

  // Get calendar statistics
  async getCalendarStats(config: EnhancedCalendarConfig): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    overdueEvents: number;
    completedEvents: number;
    eventsByType: { [key: string]: number };
    eventsByPriority: { [key: string]: number };
  }> {
    try {
      const events = await this.fetchEventsFromBackend(config);
      
      const totalEvents = events.length;
      const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
      const overdueEvents = events.filter(e => e.status === 'overdue').length;
      const completedEvents = events.filter(e => e.status === 'completed').length;
      
      const eventsByType: { [key: string]: number } = {};
      const eventsByPriority: { [key: string]: number } = {};
      
      events.forEach(event => {
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
        eventsByPriority[event.priority] = (eventsByPriority[event.priority] || 0) + 1;
      });
      
      return {
        totalEvents,
        upcomingEvents,
        overdueEvents,
        completedEvents,
        eventsByType,
        eventsByPriority
      };
    } catch (error) {
      console.error('Failed to get calendar stats:', error);
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        overdueEvents: 0,
        completedEvents: 0,
        eventsByType: {},
        eventsByPriority: {}
      };
    }
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatEventDuration(event: CalendarEvent): string {
    if (event.isAllDay) {
      return 'All day';
    }
    
    const duration = event.endDate.getTime() - event.startDate.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }

  // Clear cache
  async clearCache(): Promise<void> {
    try {
      this.cachedEvents.clear();
      
      const allKeys = await AsyncStorage.getAllKeys();
      const calendarKeys = allKeys.filter(key => key.startsWith('calendar_'));
      
      if (calendarKeys.length > 0) {
        await AsyncStorage.multiRemove(calendarKeys);
      }
    } catch (error) {
      console.error('Failed to clear calendar cache:', error);
    }
  }
}

// React hook for enhanced calendar
export const useEnhancedCalendar = (config: EnhancedCalendarConfig) => {
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const service = EnhancedCalendarService.getInstance();

  // Load events on mount and when config changes
  React.useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const fetchedEvents = await service.fetchEventsFromBackend(config);
        setEvents(fetchedEvents);
      } catch (err: any) {
        setError(err.message || 'Failed to load calendar events');
      } finally {
        setIsLoading(false);
      }
    };

    if (config.userId) {
      loadEvents();
    }
  }, [config.userId, config.userType, JSON.stringify(config.view)]);

  // Subscribe to event updates
  React.useEffect(() => {
    if (config.userId) {
      const unsubscribe = service.subscribe(config.userId, (updatedEvents) => {
        setEvents(updatedEvents);
      });

      return unsubscribe;
    }
  }, [config.userId]);

  const refreshEvents = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await service.clearCache();
      const fetchedEvents = await service.fetchEventsFromBackend(config);
      setEvents(fetchedEvents);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh calendar events');
    } finally {
      setIsLoading(false);
    }
  }, [config, service]);

  const createEvent = React.useCallback(async (event: Partial<CalendarEvent>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await service.createEvent(config, event);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to create event');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create event';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [config, service]);

  const updateEvent = React.useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await service.updateEvent(config, eventId, updates);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to update event');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to update event';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [config, service]);

  const deleteEvent = React.useCallback(async (eventId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await service.deleteEvent(config, eventId);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to delete event');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to delete event';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [config, service]);

  return {
    events,
    isLoading,
    error,
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    service
  };
};
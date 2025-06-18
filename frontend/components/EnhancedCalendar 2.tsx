import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Grid,
  List,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  User,
  Building,
  DollarSign,
  Eye,
  EyeOff,
  RefreshCw,
  MapPin,
  Video,
  FileText
} from 'lucide-react-native';
import { useEnhancedCalendar } from '@/utils/enhancedCalendarService';

const { width } = Dimensions.get('window');

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'deal' | 'milestone' | 'deadline' | 'meeting' | 'content' | 'payment' | 'review';
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  dealId?: string;
  milestoneId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  participants?: Array<{
    userId: string;
    name: string;
    userType: 'creator' | 'marketer' | 'admin';
    avatar?: string;
  }>;
  metadata?: {
    amount?: number;
    location?: string;
    isVirtual?: boolean;
    attachments?: string[];
    tags?: string[];
  };
  color?: string;
  isAllDay?: boolean;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  date: Date;
  filters: {
    eventTypes: string[];
    dealIds?: string[];
    userIds?: string[];
    priorities?: string[];
    statuses?: string[];
  };
}

interface EnhancedCalendarProps {
  userId?: string;
  userType?: 'creator' | 'marketer' | 'admin';
  initialView?: CalendarView['type'];
  initialDate?: Date;
  events?: CalendarEvent[];
  onEventSelect?: (event: CalendarEvent) => void;
  onDateSelect?: (date: Date) => void;
  onEventCreate?: (event: Partial<CalendarEvent>) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  compact?: boolean;
  readonly?: boolean;
  showFilters?: boolean;
  showCreateButton?: boolean;
}

export default function EnhancedCalendar({
  userId,
  userType = 'creator',
  initialView = 'month',
  initialDate = new Date(),
  events: propEvents = [],
  onEventSelect,
  onDateSelect,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  compact = false,
  readonly = false,
  showFilters = true,
  showCreateButton = true
}: EnhancedCalendarProps) {
  const [currentView, setCurrentView] = useState<CalendarView>({
    type: initialView,
    date: initialDate,
    filters: {
      eventTypes: ['deal', 'milestone', 'deadline', 'meeting'],
      priorities: ['high', 'urgent', 'medium'],
      statuses: ['upcoming', 'in_progress']
    }
  });

  const [showFilters, setShowFiltersModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    events,
    isLoading,
    error,
    refreshEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    service
  } = useEnhancedCalendar({
    userId: userId || '',
    userType,
    view: currentView
  });

  // Combine prop events with service events
  const allEvents = [...(propEvents || []), ...events];

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'deal': return '#10B981';
      case 'milestone': return '#3B82F6';
      case 'deadline': return '#EF4444';
      case 'meeting': return '#8B5CF6';
      case 'content': return '#F59E0B';
      case 'payment': return '#10B981';
      case 'review': return '#6B7280';
      default: return '#430B92';
    }
  };

  const getEventTypeIcon = (type: string) => {
    const iconProps = { width: 16, height: 16, color: getEventTypeColor(type) };
    
    switch (type) {
      case 'deal':
        return <Building {...iconProps} />;
      case 'milestone':
        return <Target {...iconProps} />;
      case 'deadline':
        return <AlertCircle {...iconProps} />;
      case 'meeting':
        return <Video {...iconProps} />;
      case 'content':
        return <FileText {...iconProps} />;
      case 'payment':
        return <DollarSign {...iconProps} />;
      case 'review':
        return <Eye {...iconProps} />;
      default:
        return <CalendarIcon {...iconProps} />;
    }
  };

  const getStatusIcon = (status: string) => {
    const iconProps = { width: 14, height: 14 };
    
    switch (status) {
      case 'completed':
        return <CheckCircle {...iconProps} color="#10B981" />;
      case 'overdue':
        return <AlertCircle {...iconProps} color="#EF4444" />;
      case 'in_progress':
        return <Clock {...iconProps} color="#F59E0B" />;
      default:
        return <Clock {...iconProps} color="#6B7280" />;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentView.date);
    
    switch (currentView.type) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentView(prev => ({ ...prev, date: newDate }));
  };

  const goToToday = () => {
    setCurrentView(prev => ({ ...prev, date: new Date() }));
  };

  const handleEventPress = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
    onEventSelect?.(event);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
    
    if (!readonly && showCreateButton) {
      Alert.alert(
        'Create Event',
        `Create a new event for ${date.toLocaleDateString()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create', onPress: () => handleCreateEvent(date) }
        ]
      );
    }
  };

  const handleCreateEvent = (date?: Date) => {
    const eventDate = date || selectedDate || new Date();
    
    const newEvent: Partial<CalendarEvent> = {
      title: 'New Event',
      startDate: eventDate,
      endDate: new Date(eventDate.getTime() + 60 * 60 * 1000), // 1 hour later
      type: 'meeting',
      status: 'upcoming',
      priority: 'medium',
      isAllDay: false
    };
    
    onEventCreate?.(newEvent);
  };

  const filterEvents = (events: CalendarEvent[]): CalendarEvent[] => {
    return events.filter(event => {
      const { eventTypes, priorities, statuses, dealIds, userIds } = currentView.filters;
      
      // Filter by event type
      if (eventTypes.length > 0 && !eventTypes.includes(event.type)) {
        return false;
      }
      
      // Filter by priority
      if (priorities && priorities.length > 0 && !priorities.includes(event.priority)) {
        return false;
      }
      
      // Filter by status
      if (statuses && statuses.length > 0 && !statuses.includes(event.status)) {
        return false;
      }
      
      // Filter by deal ID
      if (dealIds && dealIds.length > 0 && event.dealId && !dealIds.includes(event.dealId)) {
        return false;
      }
      
      // Filter by user ID
      if (userIds && userIds.length > 0) {
        const hasUser = event.participants?.some(p => userIds.includes(p.userId));
        if (!hasUser) return false;
      }
      
      return true;
    });
  };

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const filteredEvents = filterEvents(allEvents);
    
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForRange = (startDate: Date, endDate: Date): CalendarEvent[] => {
    const filteredEvents = filterEvents(allEvents);
    
    return filteredEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      return (eventStart >= startDate && eventStart <= endDate) ||
             (eventEnd >= startDate && eventEnd <= endDate) ||
             (eventStart <= startDate && eventEnd >= endDate);
    });
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <View style={styles.headerNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('prev')}>
          <ChevronLeft width={20} height={20} color="#430B92" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dateTitle} onPress={goToToday}>
          <Text style={styles.dateTitleText}>
            {currentView.type === 'month' 
              ? currentView.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              : currentView.type === 'week'
              ? `Week of ${currentView.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : currentView.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
            }
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate('next')}>
          <ChevronRight width={20} height={20} color="#430B92" />
        </TouchableOpacity>
      </View>

      <View style={styles.headerActions}>
        <View style={styles.viewSelector}>
          {(['month', 'week', 'day', 'agenda'] as const).map((viewType) => (
            <TouchableOpacity
              key={viewType}
              style={[
                styles.viewButton,
                currentView.type === viewType && styles.viewButtonActive
              ]}
              onPress={() => setCurrentView(prev => ({ ...prev, type: viewType }))}
            >
              <Text style={[
                styles.viewButtonText,
                currentView.type === viewType && styles.viewButtonTextActive
              ]}>
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showFilters && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <Filter width={16} height={16} color="#430B92" />
          </TouchableOpacity>
        )}

        {showCreateButton && !readonly && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => handleCreateEvent()}
          >
            <Plus width={16} height={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderMonthView = () => {
    const today = new Date();
    const firstDay = new Date(currentView.date.getFullYear(), currentView.date.getMonth(), 1);
    const lastDay = new Date(currentView.date.getFullYear(), currentView.date.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generate 6 weeks (42 days)
    for (let i = 0; i < 42; i++) {
      const dayEvents = getEventsForDate(currentDate);
      const isToday = currentDate.toDateString() === today.toDateString();
      const isCurrentMonth = currentDate.getMonth() === currentView.date.getMonth();
      
      days.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
            !isCurrentMonth && styles.otherMonthCell
          ]}
          onPress={() => handleDatePress(new Date(currentDate))}
        >
          <Text style={[
            styles.dayNumber,
            isToday && styles.todayNumber,
            !isCurrentMonth && styles.otherMonthNumber
          ]}>
            {currentDate.getDate()}
          </Text>
          
          {dayEvents.length > 0 && (
            <View style={styles.eventIndicators}>
              {dayEvents.slice(0, 3).map((event, index) => (
                <View
                  key={event.id}
                  style={[
                    styles.eventDot,
                    { backgroundColor: getEventTypeColor(event.type) }
                  ]}
                />
              ))}
              {dayEvents.length > 3 && (
                <Text style={styles.moreEvents}>+{dayEvents.length - 3}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      );
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return (
      <View style={styles.monthView}>
        <View style={styles.weekdaysHeader}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {days}
        </View>
      </View>
    );
  };

  const renderAgendaView = () => {
    const startDate = new Date(currentView.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // Next 30 days
    
    const rangeEvents = getEventsForRange(startDate, endDate);
    const groupedEvents: { [key: string]: CalendarEvent[] } = {};
    
    rangeEvents.forEach(event => {
      const dateKey = event.startDate.toDateString();
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    return (
      <ScrollView style={styles.agendaView} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
          <View key={dateKey} style={styles.agendaDay}>
            <Text style={styles.agendaDate}>
              {new Date(dateKey).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            
            {dayEvents.map(event => (
              <TouchableOpacity
                key={event.id}
                style={styles.agendaEvent}
                onPress={() => handleEventPress(event)}
              >
                <View style={styles.agendaEventContent}>
                  <View style={styles.agendaEventHeader}>
                    {getEventTypeIcon(event.type)}
                    <Text style={styles.agendaEventTitle}>{event.title}</Text>
                    {getStatusIcon(event.status)}
                  </View>
                  
                  <Text style={styles.agendaEventTime}>
                    {event.isAllDay 
                      ? 'All day'
                      : `${event.startDate.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })} - ${event.endDate.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}`
                    }
                  </Text>
                  
                  {event.description && (
                    <Text style={styles.agendaEventDescription} numberOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                  
                  {event.metadata?.amount && (
                    <Text style={styles.agendaEventAmount}>
                      ${service.formatCurrency(event.metadata.amount)}
                    </Text>
                  )}
                </View>
                
                <View style={[
                  styles.eventTypeBar,
                  { backgroundColor: getEventTypeColor(event.type) }
                ]} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
        
        {Object.keys(groupedEvents).length === 0 && (
          <View style={styles.emptyState}>
            <CalendarIcon width={48} height={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Events Found</Text>
            <Text style={styles.emptyText}>
              No events match your current filters
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderEventDetailsModal = () => (
    <Modal
      visible={showEventDetails}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowEventDetails(false)}
    >
      {selectedEvent && (
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEventDetails(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Event Details</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.eventDetailCard}>
              <View style={styles.eventDetailHeader}>
                {getEventTypeIcon(selectedEvent.type)}
                <Text style={styles.eventDetailTitle}>{selectedEvent.title}</Text>
                {getStatusIcon(selectedEvent.status)}
              </View>

              <View style={styles.eventDetailMeta}>
                <Text style={styles.eventDetailType}>
                  {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                </Text>
                <Text style={styles.eventDetailPriority}>
                  {selectedEvent.priority.toUpperCase()} Priority
                </Text>
              </View>

              {selectedEvent.description && (
                <View style={styles.eventDetailSection}>
                  <Text style={styles.eventDetailLabel}>Description</Text>
                  <Text style={styles.eventDetailText}>{selectedEvent.description}</Text>
                </View>
              )}

              <View style={styles.eventDetailSection}>
                <Text style={styles.eventDetailLabel}>Date & Time</Text>
                <Text style={styles.eventDetailText}>
                  {selectedEvent.startDate.toLocaleDateString()} {!selectedEvent.isAllDay && 
                    `${selectedEvent.startDate.toLocaleTimeString()} - ${selectedEvent.endDate.toLocaleTimeString()}`
                  }
                  {selectedEvent.isAllDay && ' (All day)'}
                </Text>
              </View>

              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <View style={styles.eventDetailSection}>
                  <Text style={styles.eventDetailLabel}>Participants</Text>
                  {selectedEvent.participants.map(participant => (
                    <Text key={participant.userId} style={styles.eventDetailText}>
                      {participant.name} ({participant.userType})
                    </Text>
                  ))}
                </View>
              )}

              {selectedEvent.metadata && (
                <View style={styles.eventDetailSection}>
                  {selectedEvent.metadata.amount && (
                    <>
                      <Text style={styles.eventDetailLabel}>Amount</Text>
                      <Text style={styles.eventDetailText}>
                        ${service.formatCurrency(selectedEvent.metadata.amount)}
                      </Text>
                    </>
                  )}
                  
                  {selectedEvent.metadata.location && (
                    <>
                      <Text style={styles.eventDetailLabel}>Location</Text>
                      <Text style={styles.eventDetailText}>
                        {selectedEvent.metadata.location}
                        {selectedEvent.metadata.isVirtual && ' (Virtual)'}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      )}
    </Modal>
  );

  if (isLoading && allEvents.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#430B92" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle width={16} height={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshEvents}>
            <RefreshCw width={14} height={14} color="#430B92" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderCalendarHeader()}
      
      {currentView.type === 'month' && renderMonthView()}
      {currentView.type === 'agenda' && renderAgendaView()}
      
      {/* TODO: Add week and day views */}
      {(currentView.type === 'week' || currentView.type === 'day') && (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>
            {currentView.type.charAt(0).toUpperCase() + currentView.type.slice(1)} view coming soon
          </Text>
        </View>
      )}

      {renderEventDetailsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  containerCompact: {
    maxHeight: 400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryText: {
    fontSize: 12,
    color: '#430B92',
    fontWeight: '500',
  },
  calendarHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  dateTitle: {
    flex: 1,
    alignItems: 'center',
  },
  dateTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonActive: {
    backgroundColor: '#430B92',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewButtonTextActive: {
    color: '#FFFFFF',
  },
  filterButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  createButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#430B92',
  },
  monthView: {
    flex: 1,
  },
  weekdaysHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: width / 7,
    height: 60,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    padding: 4,
    alignItems: 'center',
  },
  todayCell: {
    backgroundColor: '#F0E7FD',
  },
  otherMonthCell: {
    backgroundColor: '#FAFAFA',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  todayNumber: {
    color: '#430B92',
    fontWeight: '700',
  },
  otherMonthNumber: {
    color: '#D1D5DB',
  },
  eventIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    alignItems: 'center',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreEvents: {
    fontSize: 8,
    color: '#6B7280',
    fontWeight: '500',
  },
  agendaView: {
    flex: 1,
    padding: 16,
  },
  agendaDay: {
    marginBottom: 24,
  },
  agendaDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  agendaEvent: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  agendaEventContent: {
    flex: 1,
    padding: 12,
  },
  agendaEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  agendaEventTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  agendaEventTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  agendaEventDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 4,
  },
  agendaEventAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  eventTypeBar: {
    width: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#430B92',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  eventDetailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  eventDetailTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  eventDetailMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  eventDetailType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#430B92',
    backgroundColor: '#F0E7FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventDetailPriority: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventDetailSection: {
    marginBottom: 16,
  },
  eventDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
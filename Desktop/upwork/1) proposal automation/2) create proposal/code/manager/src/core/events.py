"""
Event system for Claude Task Manager.
"""
from enum import Enum, auto
from typing import Dict, Any, List, Callable, Optional
import threading
import time
import uuid


class EventType(str, Enum):
    """Types of events that can be published."""
    INSTANCE_CREATED = "instance_created"
    INSTANCE_STARTED = "instance_started"
    INSTANCE_STOPPED = "instance_stopped"
    INSTANCE_DELETED = "instance_deleted"
    INSTANCE_UPDATED = "instance_updated"
    PROMPT_SENT = "prompt_sent"
    PROMPT_DETECTED = "prompt_detected"
    CONTENT_UPDATED = "content_updated"
    GENERATION_STARTED = "generation_started"
    GENERATION_STOPPED = "generation_stopped"
    ERROR_OCCURRED = "error_occurred"


class Event:
    """Represents an event in the system."""
    
    def __init__(self, event_type: EventType, data: Dict[str, Any], sender: Optional[str] = None):
        self.id = str(uuid.uuid4())
        self.type = event_type
        self.data = data
        self.sender = sender
        self.timestamp = time.time()


class EventBus:
    """Simple event bus implementation for publishing and subscribing to events."""
    
    def __init__(self):
        self._subscribers: Dict[EventType, List[Callable[[Event], None]]] = {}
        self._lock = threading.RLock()
        
    def subscribe(self, event_type: EventType, callback: Callable[[Event], None]) -> None:
        """Subscribe to an event type."""
        with self._lock:
            if event_type not in self._subscribers:
                self._subscribers[event_type] = []
            self._subscribers[event_type].append(callback)
            
    def unsubscribe(self, event_type: EventType, callback: Callable[[Event], None]) -> bool:
        """Unsubscribe from an event type."""
        with self._lock:
            if event_type in self._subscribers and callback in self._subscribers[event_type]:
                self._subscribers[event_type].remove(callback)
                return True
            return False
            
    def publish(self, event: Event) -> None:
        """Publish an event to all subscribers."""
        with self._lock:
            if event.type in self._subscribers:
                # Make a copy to avoid modification during iteration
                subscribers = self._subscribers[event.type].copy()
                
        # Call subscribers outside the lock to avoid deadlocks
        for callback in subscribers:
            try:
                callback(event)
            except Exception as e:
                # Log error but don't break the event chain
                print(f"Error in event subscriber: {e}")


# Global event bus instance
event_bus = EventBus()


def subscribe(event_type: EventType, callback: Callable[[Event], None]) -> None:
    """Subscribe to events of the given type."""
    event_bus.subscribe(event_type, callback)
    
    
def unsubscribe(event_type: EventType, callback: Callable[[Event], None]) -> bool:
    """Unsubscribe from events of the given type."""
    return event_bus.unsubscribe(event_type, callback)
    
    
def publish(event_type: EventType, data: Dict[str, Any], sender: Optional[str] = None) -> None:
    """Publish an event of the given type."""
    event = Event(event_type, data, sender)
    event_bus.publish(event)

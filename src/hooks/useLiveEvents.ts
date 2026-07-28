import { useEffect, useRef, useCallback, useState } from 'react';

interface SSEEvent {
  event: string;
  data: any;
}

type EventHandler = (data: any) => void;

/**
 * Custom hook for Server-Sent Events (SSE) live connection
 * Connects to the backend SSE stream and dispatches events to handlers
 */
export function useLiveEvents() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<Map<string, EventHandler[]>>(new Map());
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource('/api/live-events');
    eventSourceRef.current = es;

    es.addEventListener('connected', (e: MessageEvent) => {
      console.log('📡 SSE Connected:', JSON.parse(e.data));
      setConnected(true);
    });

    es.addEventListener('heartbeat', () => {
      // Keep-alive, no action needed
    });

    // Listen for all custom events
    const eventTypes = [
      'lead_created',
      'lead_updated',
      'lead_deleted',
      'new_message',
      'missed_call',
      'ai_toggled',
    ];

    eventTypes.forEach((eventType) => {
      es.addEventListener(eventType, (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setLastEvent({ event: eventType, data });

        // Call all registered handlers for this event type
        const handlers = handlersRef.current.get(eventType);
        if (handlers) {
          handlers.forEach((handler) => handler(data));
        }
      });
    });

    es.onerror = () => {
      console.warn('📡 SSE connection error, reconnecting...');
      setConnected(false);
      es.close();

      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, 3000);
    };
  }, []);

  // Register an event handler
  const on = useCallback((event: string, handler: EventHandler) => {
    const existing = handlersRef.current.get(event) || [];
    handlersRef.current.set(event, [...existing, handler]);

    // Return cleanup function
    return () => {
      const handlers = handlersRef.current.get(event) || [];
      handlersRef.current.set(
        event,
        handlers.filter((h) => h !== handler)
      );
    };
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { connected, lastEvent, on };
}

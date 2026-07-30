import { useEffect, useRef, useCallback, useState } from 'react';
import { getValidAccessToken } from '../services/session';

interface SSEEvent {
  event: string;
  data: any;
}

type EventHandler = (data: any) => void;

/**
 * Custom hook for Server-Sent Events (SSE) live connection
 * Connects to the backend SSE stream and dispatches events to handlers
 */
export function useLiveEvents(enabled: boolean = true) {
  const abortRef = useRef<AbortController | null>(null);
  const handlersRef = useRef<Map<string, EventHandler[]>>(new Map());
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(async () => {
    if (!enabled) {
      setConnected(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = await getValidAccessToken();
      if (!token || controller.signal.aborted) return;
      const response = await fetch('/api/live-events', {
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`Live stream returned ${response.status}`);

      setConnected(true);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'message';

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          let dataText = '';
          currentEvent = 'message';
          for (const line of block.split('\n')) {
            if (line.startsWith('event:')) currentEvent = line.slice(6).trim();
            if (line.startsWith('data:')) dataText += line.slice(5).trim();
          }
          if (!dataText || currentEvent === 'heartbeat') continue;
          try {
            const data = JSON.parse(dataText);
            if (currentEvent === 'connected') {
              setConnected(true);
              continue;
            }
            setLastEvent({ event: currentEvent, data });
            handlersRef.current.get(currentEvent)?.forEach((handler) => handler(data));
          } catch {
            // Ignore malformed keep-alive payloads without dropping the stream.
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) console.warn('Live sync disconnected', error);
    } finally {
      if (!controller.signal.aborted) {
        setConnected(false);
        reconnectTimeoutRef.current = window.setTimeout(() => { void connect(); }, 3000);
      }
    }
  }, [enabled]);

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
    if (!enabled) return;
    void connect();

    return () => {
      abortRef.current?.abort();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, enabled]);

  return { connected, lastEvent, on };
}

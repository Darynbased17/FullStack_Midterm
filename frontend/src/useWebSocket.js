import { useEffect, useRef } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || 'guest';

    function connect() {
      // Pass JWT via Sec-WebSocket-Protocol header (only way browsers allow)
      const ws = new WebSocket(WS_URL, token);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WS connected');
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (e) {
          console.error('WS parse error', e);
        }
      };

      ws.onclose = () => {
        console.log('WS disconnected, reconnecting in 3s...');
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WS error', err);
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
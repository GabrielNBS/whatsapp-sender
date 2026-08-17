'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus } from '@/lib/MetricsService';
import { requestJson } from '@/services/http/client';

interface UseConnectionStatusOptions {
  pollingInterval?: number;
}

export function useConnectionStatus({ pollingInterval = 5000 }: UseConnectionStatusOptions = {}) {
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setConnection(await requestJson<ConnectionStatus>('/api/connection/status', { cache: 'no-store' }));
    } catch (error) {
      console.error('Failed to fetch connection status', error);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, pollingInterval);
    return () => window.clearInterval(intervalId);
  }, [pollingInterval, refresh]);

  return { status: connection?.status ?? 'disconnected', connection, refresh };
}

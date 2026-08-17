/**
 * Hook: useRealtimeMetrics
 * 
 * PRINCÍPIO: Dependency Inversion (DIP)
 * - Componentes dependem desta abstração, não da implementação fetch
 * 
 * Polling configurável para métricas em tempo real
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { RealtimeMetrics } from "@/lib/MetricsService";
import { metricsApi } from '@/services/metrics/metricsApi';

interface UseRealtimeMetricsOptions {
  /** Intervalo de polling em ms (default: 3000) */
  pollingInterval?: number;
  /** Se deve iniciar o polling automaticamente */
  autoStart?: boolean;
}

interface UseRealtimeMetricsReturn {
  metrics: RealtimeMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const DEFAULT_POLLING_INTERVAL = 3000;

export function useRealtimeMetrics(
  options: UseRealtimeMetricsOptions = {}
): UseRealtimeMetricsReturn {
  const { 
    pollingInterval = DEFAULT_POLLING_INTERVAL, 
    autoStart = true 
  } = options;

  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const inFlightRef = useRef(false);

  const fetchMetrics = useCallback(async (signal?: AbortSignal) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setMetrics(await metricsApi.getRealtime(signal));
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
      }
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    
    // Fetch inicial
    const controller = new AbortController();
    void fetchMetrics(controller.signal);
    
    // Polling
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') void fetchMetrics();
    }, pollingInterval);
    
    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, [fetchMetrics, pollingInterval, autoStart]);

  return {
    metrics,
    isLoading,
    error,
    refresh: fetchMetrics,
  };
}

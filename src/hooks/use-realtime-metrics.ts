/**
 * Hook: useRealtimeMetrics
 * 
 * PRINCÍPIO: Dependency Inversion (DIP)
 * - Componentes dependem desta abstração, não da implementação fetch
 * 
 * Polling configurável para métricas em tempo real
 */

import { useState, useEffect, useCallback } from "react";
import type { RealtimeMetrics } from "@/lib/MetricsService";

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

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch("/api/metrics/realtime");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    
    // Fetch inicial
    fetchMetrics();
    
    // Polling
    const intervalId = setInterval(fetchMetrics, pollingInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchMetrics, pollingInterval, autoStart]);

  return {
    metrics,
    isLoading,
    error,
    refresh: fetchMetrics,
  };
}

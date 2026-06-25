import { useState, useEffect, useRef } from 'react';
import { ANALYTICS_REFETCH_INTERVAL } from '@/constants/contacts';

export interface AnalyticsRecord {
  sentCount: number;
  readCount: number;
  lastSentAt?: string | null;
  lastReadAt?: string | null;
}

export function useContactAnalytics() {
  const [analytics, setAnalytics] = useState<Record<string, AnalyticsRecord>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usamos ref para manter o estado atualizado no visibility handler sem re-registrar timers
  const isTabActive = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabActive.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout;

    const fetchAnalytics = async (controller?: AbortController) => {
      if (!isTabActive.current) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/analytics', {
          cache: 'no-store',
          signal: controller?.signal,
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (active && Array.isArray(data)) {
          const map: Record<string, AnalyticsRecord> = {};
          data.forEach((item: { phone: string; sentCount: number; readCount: number; lastSentAt?: string | null; lastReadAt?: string | null }) => {
            map[item.phone] = {
              sentCount: item.sentCount,
              readCount: item.readCount,
              lastSentAt: item.lastSentAt,
              lastReadAt: item.lastReadAt,
            };
          });
          setAnalytics(map);
          setError(null);
        }
      } catch (err: unknown) {
        if (active && err instanceof Error && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const runPoll = () => {
      const controller = new AbortController();
      fetchAnalytics(controller);

      timerId = setTimeout(runPoll, ANALYTICS_REFETCH_INTERVAL);

      return () => {
        controller.abort();
      };
    };

    const cleanPoll = runPoll();

    return () => {
      active = false;
      clearTimeout(timerId);
      cleanPoll();
    };
  }, []);

  return { analytics, isLoading, error };
}

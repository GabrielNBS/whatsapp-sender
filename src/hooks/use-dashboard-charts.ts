import { useState, useEffect } from 'react';

export interface ChartData {
  funnel: Array<{ name: string; value: number }>;
  trends: Array<{ date: string; sent: number; read: number; responses: number }>;
}

export function useDashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metrics/charts')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch chart data:', err);
        setIsLoading(false);
      });
  }, []);

  return { data, isLoading };
}

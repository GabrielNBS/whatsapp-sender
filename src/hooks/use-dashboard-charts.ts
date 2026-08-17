import { useState, useEffect } from 'react';
import { metricsApi, type DashboardChartData } from '@/services/metrics/metricsApi';

export type ChartData = DashboardChartData;

export function useDashboardCharts() {
  const [data, setData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    metricsApi.getCharts()
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

import { useMemo } from 'react';
import { 
  EngagementService, 
  EngagementStatus, 
  EngagementStats, 
  BadgeConfig 
} from '@/lib/EngagementService';

/**
 * Hook return type
 */
interface UseEngagementStatusReturn {
  status: EngagementStatus;
  config: BadgeConfig;
  formattedDates: {
    lastSent: string;
    lastRead: string;
  };
  engagementRate: number;
  isNew: boolean;
  isEngaged: boolean;
  isActive: boolean;
}

/**
 * useEngagementStatus - Custom hook for engagement status calculation
 * 
 * Encapsulates all engagement logic, memoizing expensive calculations
 * and providing a clean API for UI components.
 */
export function useEngagementStatus(stats?: EngagementStats): UseEngagementStatusReturn {
  // Memoize status calculation
  const status = useMemo(() => {
    return EngagementService.getEngagementStatus(stats);
  }, [stats]);

  // Memoize config lookup
  const config = useMemo(() => {
    return EngagementService.getBadgeConfig(status);
  }, [status]);

  // Memoize date formatting
  const formattedDates = useMemo(() => {
    return EngagementService.getFormattedDates(stats);
  }, [stats]);

  // Memoize engagement rate
  const engagementRate = useMemo(() => {
    if (!stats) return 0;
    return EngagementService.calculateEngagementRate(stats);
  }, [stats]);

  // Derived helper flags
  const isNew = status === EngagementStatus.NEW;
  const isEngaged = status === EngagementStatus.ENGAGED;
  const isActive = status === EngagementStatus.READ_TODAY || status === EngagementStatus.READ_RECENT;

  return {
    status,
    config,
    formattedDates,
    engagementRate,
    isNew,
    isEngaged,
    isActive,
  };
}

export default useEngagementStatus;

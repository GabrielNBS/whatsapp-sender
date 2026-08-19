import { isToday, differenceInDays, isValid } from "date-fns";
import { logger } from "./logger";

/**
 * Engagement statistics interface
 */
export interface EngagementStats {
  sentCount: number;
  readCount: number;
  lastSentAt?: Date | string | null;
  lastReadAt?: Date | string | null;
}

/**
 * Tipos de status de engajamento
 */
export enum EngagementStatus {
  NEW = "new",              // Nunca contatado
  SENT = "sent",            // Enviado, aguardando leitura
  READ_TODAY = "read_today",  // Leu hoje
  READ_RECENT = "read_recent", // Leu nos últimos 7 dias  
  READ_OLD = "read_old",      // Leu há mais de 7 dias
  ENGAGED = "engaged"       // Múltiplas leituras (engajado)
}

/**
 * Constants for engagement calculations
 */
export const ENGAGEMENT_CONSTANTS = {
  ENGAGEMENT_THRESHOLD: 0.6,
  MIN_INTERACTIONS: 3,
  DAYS_RECENT: 7,
  DAYS_MONTH: 30,
} as const;

/**
 * EngagementService - Centralized engagement calculation logic
 */
export const EngagementService = {
  /**
   * Parse date safely, returning null for invalid dates
   */
  parseDate(date: Date | string | null | undefined): Date | null {
    if (!date) return null;
    const parsed = date instanceof Date ? date : new Date(date);
    return isValid(parsed) ? parsed : null;
  },

  /**
   * Calculate engagement rate (read/sent ratio)
   */
  calculateEngagementRate(stats: EngagementStats): number {
    if (stats.sentCount === 0) return 0;
    return stats.readCount / stats.sentCount;
  },

  /**
   * Determine engagement status based on statistics
   * Priority: recency > engagement rate > quantity
   */
  getEngagementStatus(stats: EngagementStats | undefined): EngagementStatus {
    // No data or never contacted
    if (!stats || stats.sentCount === 0) {
      return EngagementStatus.NEW;
    }
    
    // Sent but never read
    if (stats.readCount === 0) {
      return EngagementStatus.SENT;
    }
    
    // Evaluate recency first (most important)
    const lastRead = this.parseDate(stats.lastReadAt);
    
    if (lastRead) {
      const now = new Date();
      
      // Validate date is not in the future
      if (lastRead > now) {
        logger.warn({ lastRead }, "[Engagement] Data de leitura futura detectada");
        return EngagementStatus.SENT;
      }
      
      if (isToday(lastRead)) {
        return EngagementStatus.READ_TODAY;
      }
      
      const daysSinceRead = differenceInDays(now, lastRead);
      
      if (daysSinceRead < ENGAGEMENT_CONSTANTS.DAYS_RECENT) {
        return EngagementStatus.READ_RECENT;
      }
      
      if (daysSinceRead > ENGAGEMENT_CONSTANTS.DAYS_MONTH) {
        return EngagementStatus.READ_OLD;
      }
    }
    
    // Evaluate engagement rate (requires minimum volume)
    const engagementRate = this.calculateEngagementRate(stats);
    
    if (
      stats.sentCount >= ENGAGEMENT_CONSTANTS.MIN_INTERACTIONS && 
      engagementRate >= ENGAGEMENT_CONSTANTS.ENGAGEMENT_THRESHOLD
    ) {
      return EngagementStatus.ENGAGED;
    }
    
    // Default: recent read but not highly engaged
    return EngagementStatus.READ_RECENT;
  },

};

export default EngagementService;

import { 
  formatDistanceToNow, 
  isToday, 
  isYesterday, 
  format,
  differenceInDays,
  isValid
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCheck, Clock, Mail, MailOpen, User } from "lucide-react";

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
 * Badge configuration for each status
 */
export interface BadgeConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  icon: typeof Mail;
  ariaLabel: string;
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
 * Status configuration mapping
 */
export const STATUS_CONFIG: Record<EngagementStatus, BadgeConfig> = {
  [EngagementStatus.NEW]: {
    label: "Novo",
    variant: "outline",
    className: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
    icon: User,
    ariaLabel: "Contato novo, nunca contatado",
  },
  [EngagementStatus.SENT]: {
    label: "Aguardando",
    variant: "secondary",
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    icon: Clock,
    ariaLabel: "Mensagem enviada, aguardando leitura",
  },
  [EngagementStatus.READ_TODAY]: {
    label: "Leu hoje",
    variant: "default",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    icon: CheckCheck,
    ariaLabel: "Contato leu mensagem hoje",
  },
  [EngagementStatus.READ_RECENT]: {
    label: "Leu recente",
    variant: "secondary",
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    icon: MailOpen,
    ariaLabel: "Contato leu mensagem nos últimos 7 dias",
  },
  [EngagementStatus.READ_OLD]: {
    label: "Inativo",
    variant: "outline",
    className: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-700",
    icon: Mail,
    ariaLabel: "Contato inativo, última leitura há mais de 30 dias",
  },
  [EngagementStatus.ENGAGED]: {
    label: "Engajado",
    variant: "default",
    className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800",
    icon: CheckCheck,
    ariaLabel: "Contato altamente engajado, lê regularmente",
  },
};

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
        console.warn("Future read date detected", lastRead);
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

  /**
   * Get badge configuration for a status
   */
  getBadgeConfig(status: EngagementStatus): BadgeConfig {
    return STATUS_CONFIG[status];
  },

  /**
   * Format date as relative string (e.g., "Hoje às 14:30", "Ontem", "Há 3 dias")
   */
  formatRelativeDate(date: Date | string | null | undefined): string {
    const parsed = this.parseDate(date);
    
    if (!parsed) return "—";
    
    if (isToday(parsed)) {
      return `Hoje às ${format(parsed, "HH:mm")}`;
    }
    
    if (isYesterday(parsed)) {
      return `Ontem às ${format(parsed, "HH:mm")}`;
    }
    
    const daysDiff = differenceInDays(new Date(), parsed);
    
    if (daysDiff < 7) {
      return formatDistanceToNow(parsed, { 
        addSuffix: true, 
        locale: ptBR 
      });
    }
    
    return format(parsed, "dd MMM", { locale: ptBR });
  },

  /**
   * Get formatted dates for display
   */
  getFormattedDates(stats: EngagementStats | undefined): {
    lastSent: string;
    lastRead: string;
  } {
    return {
      lastSent: this.formatRelativeDate(stats?.lastSentAt),
      lastRead: this.formatRelativeDate(stats?.lastReadAt),
    };
  },
};

export default EngagementService;

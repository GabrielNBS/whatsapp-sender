import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCheck, Clock, Mail, MailOpen, User } from 'lucide-react';
import {
  EngagementService,
  EngagementStatus,
  type EngagementStats,
} from '@/lib/EngagementService';

export interface EngagementBadgeConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  icon: typeof Mail;
  ariaLabel: string;
}

export const ENGAGEMENT_BADGE_CONFIG: Record<EngagementStatus, EngagementBadgeConfig> = {
  [EngagementStatus.NEW]: {
    label: 'Novo',
    variant: 'outline',
    className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700',
    icon: User,
    ariaLabel: 'Contato novo, nunca contatado',
  },
  [EngagementStatus.SENT]: {
    label: 'Aguardando',
    variant: 'secondary',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    icon: Clock,
    ariaLabel: 'Mensagem enviada, aguardando leitura',
  },
  [EngagementStatus.READ_TODAY]: {
    label: 'Leu hoje',
    variant: 'default',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
    icon: CheckCheck,
    ariaLabel: 'Contato leu mensagem hoje',
  },
  [EngagementStatus.READ_RECENT]: {
    label: 'Leu recente',
    variant: 'secondary',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    icon: MailOpen,
    ariaLabel: 'Contato leu mensagem nos últimos 7 dias',
  },
  [EngagementStatus.READ_OLD]: {
    label: 'Inativo',
    variant: 'outline',
    className: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-500 dark:border-slate-700',
    icon: Mail,
    ariaLabel: 'Contato inativo, última leitura há mais de 30 dias',
  },
  [EngagementStatus.ENGAGED]: {
    label: 'Engajado',
    variant: 'default',
    className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-400 dark:border-violet-800',
    icon: CheckCheck,
    ariaLabel: 'Contato altamente engajado, lê regularmente',
  },
};

function formatRelativeDate(value: Date | string | null | undefined): string {
  const parsed = EngagementService.parseDate(value);
  if (!parsed) return '—';
  if (isToday(parsed)) return `Hoje às ${format(parsed, 'HH:mm')}`;
  if (isYesterday(parsed)) return `Ontem às ${format(parsed, 'HH:mm')}`;
  const daysDiff = Math.floor((Date.now() - parsed.getTime()) / 86_400_000);
  if (daysDiff < 7) return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR });
  return format(parsed, 'dd MMM', { locale: ptBR });
}

export function formatEngagementDates(stats?: EngagementStats) {
  return {
    lastSent: formatRelativeDate(stats?.lastSentAt),
    lastRead: formatRelativeDate(stats?.lastReadAt),
  };
}

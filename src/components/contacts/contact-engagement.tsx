"use client";

import { 
  formatDistanceToNow, 
  isToday, 
  isYesterday, 
  format,
  differenceInDays,
  isValid
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCheck, Clock, Mail, MailOpen, User } from "lucide-react";

interface ContactEngagementProps {
  stats?: {
    sentCount: number;
    readCount: number;
    lastSentAt?: Date | string | null;
    lastReadAt?: Date | string | null;
  };
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

const CONSTANTS = {
  ENGAGEMENT_THRESHOLD: 0.6,
  MIN_INTERACTIONS: 3,  // Mínimo de interações para considerar "engajado"
  DAYS_RECENT: 7,
  DAYS_MONTH: 30,
} as const;

/**
 * Converte Date | string | null em Date válido ou null
 * Protege contra datas inválidas
 */
function parseDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  
  const parsed = date instanceof Date ? date : new Date(date);
  
  return isValid(parsed) ? parsed : null;
}

/**
 * Determina o status de engajamento baseado nas estatísticas
 * Prioriza: recenticidade > engajamento > quantidade
 */
function getEngagementStatus(stats: ContactEngagementProps["stats"]): EngagementStatus {
  // Sem dados ou nunca contatado
  if (!stats || stats.sentCount === 0) {
    return EngagementStatus.NEW;
  }
  
  // Enviado mas nunca lido
  if (stats.readCount === 0) {
    return EngagementStatus.SENT;
  }
  
  // Avaliar recenticidade primeiro (mais importante)
  const lastRead = parseDate(stats.lastReadAt);
  
  if (lastRead) {
    const now = new Date();
    
    // Validar que a data não está no futuro
    if (lastRead > now) {
      console.warn("Data de leitura no futuro detectada", lastRead);
      return EngagementStatus.SENT;
    }
    
    // Leu hoje
    if (isToday(lastRead)) {
      return EngagementStatus.READ_TODAY;
    }
    
    const daysSinceRead = differenceInDays(now, lastRead);
    
    // Leu recentemente (últimos 7 dias)
    if (daysSinceRead < CONSTANTS.DAYS_RECENT) {
      return EngagementStatus.READ_RECENT;
    }
    
    // Não lê há mais de 30 dias = inativo
    if (daysSinceRead > CONSTANTS.DAYS_MONTH) {
      return EngagementStatus.READ_OLD;
    }
  }
  
  // Avaliar taxa de engajamento (requer volume mínimo)
  const engagementRate = stats.readCount / stats.sentCount;
  
  if (
    stats.sentCount >= CONSTANTS.MIN_INTERACTIONS && 
    engagementRate >= CONSTANTS.ENGAGEMENT_THRESHOLD
  ) {
    return EngagementStatus.ENGAGED;
  }
  
  // Default: leitura recente mas sem engajamento alto
  return EngagementStatus.READ_RECENT;
}

/**
 * Configuração visual e semântica de cada status
 * Usando apenas classes padrão do Tailwind e shadcn/ui
 */
const STATUS_CONFIG: Record<EngagementStatus, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  icon: typeof Mail;
  ariaLabel: string;
}> = {
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
 * Formata data de forma relativa e contextual
 */
function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  
  const parsed = parseDate(date);
  if (!parsed) return "—";
  
  const now = new Date();
  
  if (parsed > now) {
    return "Data inválida";
  }
  
  if (isToday(parsed)) {
    return `Hoje às ${format(parsed, "HH:mm")}`;
  }
  
  if (isYesterday(parsed)) {
    return "Ontem";
  }
  
  const diffDays = differenceInDays(now, parsed);
  
  if (diffDays < 7) {
    return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR });
  }
  if (diffDays < 365) {
    return format(parsed, "dd MMM", { locale: ptBR });
  }
  
  return format(parsed, "dd MMM yyyy", { locale: ptBR });
}

export function ContactEngagement({ stats }: ContactEngagementProps) {
  const status = useMemo(() => getEngagementStatus(stats), [stats]);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  const { sentCount = 0, readCount = 0, lastSentAt, lastReadAt } = stats || {};
  
  // Calcular taxa de engajamento
  const engagementRate = sentCount > 0 
    ? Math.round((readCount / sentCount) * 100) 
    : 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant}
            className={`cursor-help gap-1.5 font-medium transition-all hover:opacity-80 ${config.className}`}
            aria-label={config.ariaLabel}
            role="status"
          >
            <Icon className="w-3 h-3" aria-hidden="true" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="p-0 overflow-hidden"
          aria-live="polite"
        >
          <div className="min-w-[200px]">
            {/* Header */}
            <div className="px-3 py-2 bg-muted border-b">
              <p className="font-semibold text-xs text-foreground">
                Histórico de Engajamento
              </p>
            </div>
            
            {/* Stats */}
            <div className="p-3 space-y-2 text-xs">
              {sentCount > 0 ? (
                <>
                  {/* Enviadas */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="w-3 h-3" aria-hidden="true" />
                      Enviadas
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {sentCount}
                    </span>
                  </div>
                  
                  {/* Lidas */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCheck className="w-3 h-3" aria-hidden="true" />
                      Lidas
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {readCount}
                    </span>
                  </div>
                  
                  {/* Taxa de abertura */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      Taxa de abertura
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {engagementRate}%
                    </span>
                  </div>
                  
                  {/* Separador */}
                  <div className="border-t border-dashed my-2" />
                  
                  {/* Último envio */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Último envio</span>
                    <span className="text-muted-foreground text-[11px] tabular-nums">
                      {formatRelativeDate(lastSentAt)}
                    </span>
                  </div>
                  
                  {/* Última leitura */}
                  {readCount > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Última leitura</span>
                      <span className="text-muted-foreground text-[11px] tabular-nums">
                        {formatRelativeDate(lastReadAt)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                /* Mensagem para novo contato */
                <div className="flex flex-col items-center justify-center py-2 text-center">
                  <User className="w-8 h-8 text-muted-foreground/40 mb-2" aria-hidden="true" />
                  <p className="text-muted-foreground text-xs">
                    Nenhuma mensagem enviada
                  </p>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
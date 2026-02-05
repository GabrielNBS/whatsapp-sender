"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCheck, Clock, Mail, MailOpen, User } from "lucide-react";

/**
 * Props do componente de engajamento
 * 
 * REFATORAÇÃO:
 * - Adicionado lastSentAt e lastReadAt para mostrar datas
 * - Mantido compatibilidade com formato anterior
 */
interface ContactEngagementProps {
  stats?: {
    sentCount: number;
    readCount: number;
    lastSentAt?: Date | string | null;
    lastReadAt?: Date | string | null;
  };
}

/**
 * Tipos de status de engajamento (mais claro que percentual)
 */
type EngagementStatus = 
  | "new"          // Nunca contatado
  | "sent"         // Enviado, aguardando leitura
  | "read_today"   // Leu hoje
  | "read_recent"  // Leu nos últimos 7 dias  
  | "read_old"     // Leu há mais de 7 dias
  | "engaged";     // Múltiplas leituras (engajado)

/**
 * Calcula o status de engajamento baseado nos dados
 */
function getEngagementStatus(stats: ContactEngagementProps["stats"]): EngagementStatus {
  if (!stats || stats.sentCount === 0) {
    return "new";
  }
  
  if (stats.readCount === 0) {
    return "sent";
  }
  
  // Se tem muitas leituras, está engajado
  if (stats.readCount >= 3) {
    return "engaged";
  }
  
  // Verificar quando foi a última leitura
  if (stats.lastReadAt) {
    const lastRead = new Date(stats.lastReadAt);
    const now = new Date();
    const diffMs = now.getTime() - lastRead.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffDays < 1) {
      return "read_today";
    }
    if (diffDays < 7) {
      return "read_recent";
    }
    return "read_old";
  }
  
  // Fallback se não tiver data mas tiver readCount
  return "read_recent";
}

/**
 * Configuração visual para cada status
 */
const STATUS_CONFIG: Record<EngagementStatus, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  icon: typeof Mail;
}> = {
  new: {
    label: "Novo",
    variant: "outline",
    className: "bg-slate-50 text-slate-500 border-slate-200",
    icon: User,
  },
  sent: {
    label: "Aguardando",
    variant: "secondary",
    className: "bg-amber-50 text-amber-600 border-amber-200",
    icon: Clock,
  },
  read_today: {
    label: "Leu hoje",
    variant: "default",
    className: "bg-green-50 text-green-600 border-green-200",
    icon: CheckCheck,
  },
  read_recent: {
    label: "Leu recente",
    variant: "secondary",
    className: "bg-blue-50 text-blue-600 border-blue-200",
    icon: MailOpen,
  },
  read_old: {
    label: "Inativo",
    variant: "outline",
    className: "bg-slate-50 text-slate-400 border-slate-200",
    icon: Mail,
  },
  engaged: {
    label: "Engajado",
    variant: "default",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
    icon: CheckCheck,
  },
};

/**
 * Formata data relativa (há X dias, hoje, ontem)
 */
function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Hoje - mostrar hora
    return `Hoje às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return "Ontem";
  }
  if (diffDays < 7) {
    return `Há ${diffDays} dias`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Há ${weeks} semana${weeks > 1 ? "s" : ""}`;
  }
  // Mais de 30 dias - mostrar data
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/**
 * Componente ContactEngagement - Refatorado
 * 
 * MUDANÇAS:
 * 1. Removida barra de progresso confusa (sent/read ratio não faz sentido)
 * 2. Badge de status claro com ícone
 * 3. Tooltip com detalhes incluindo datas
 * 4. Visual mais limpo e informativo
 */
export function ContactEngagement({ stats }: ContactEngagementProps) {
  const status = getEngagementStatus(stats);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  const { sentCount = 0, readCount = 0, lastSentAt, lastReadAt } = stats || {};

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Badge 
            variant={config.variant}
            className={`cursor-help gap-1.5 font-medium transition-all hover:opacity-80 ${config.className}`}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-0 overflow-hidden">
          <div className="min-w-[180px]">
            {/* Header */}
            <div className="px-3 py-2 bg-slate-50 border-b">
              <p className="font-semibold text-xs text-slate-700">
                Histórico de Engajamento
              </p>
            </div>
            
            {/* Stats */}
            <div className="p-3 space-y-2 text-xs">
              {/* Enviadas */}
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="w-3 h-3" />
                  Enviadas
                </span>
                <span className="font-mono font-medium">{sentCount}</span>
              </div>
              
              {/* Lidas */}
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCheck className="w-3 h-3" />
                  Lidas
                </span>
                <span className="font-mono font-medium">{readCount}</span>
              </div>
              
              {/* Separador */}
              <div className="border-t border-dashed my-2" />
              
              {/* Último envio */}
              {sentCount > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Último envio</span>
                  <span className="text-slate-600 text-[11px]">
                    {formatRelativeDate(lastSentAt)}
                  </span>
                </div>
              )}
              
              {/* Última leitura */}
              {readCount > 0 && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Última leitura</span>
                  <span className="text-slate-600 text-[11px]">
                    {formatRelativeDate(lastReadAt)}
                  </span>
                </div>
              )}
              
              {/* Mensagem para novo contato */}
              {sentCount === 0 && (
                <p className="text-muted-foreground text-center py-1">
                  Nenhuma mensagem enviada
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

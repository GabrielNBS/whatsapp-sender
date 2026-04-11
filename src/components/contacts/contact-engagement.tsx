"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCheck, Mail, User } from "lucide-react";
import { 
  EngagementService, 
  EngagementStats,
  STATUS_CONFIG 
} from "@/lib/EngagementService";

interface ContactEngagementProps {
  stats?: EngagementStats;
}

export function ContactEngagement({ stats }: ContactEngagementProps) {
  // Use service for status calculation
  const status = useMemo(() => EngagementService.getEngagementStatus(stats), [stats]);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  // Use service for date formatting
  const formattedDates = useMemo(() => {
    return EngagementService.getFormattedDates(stats);
  }, [stats]);
  
  const { sentCount = 0, readCount = 0 } = stats || {};
  
  // Calculate engagement rate using service
  const engagementRate = useMemo(() => {
    if (!stats) return 0;
    return Math.round(EngagementService.calculateEngagementRate(stats) * 100);
  }, [stats]);

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
                      {formattedDates.lastSent}
                    </span>
                  </div>
                  
                  {/* Última leitura */}
                  {readCount > 0 && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Última leitura</span>
                      <span className="text-muted-foreground text-[11px] tabular-nums">
                        {formattedDates.lastRead}
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
import { Send, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionPanelProps {
  recipientCount: number;
  estimatedTime: number;
  recipientType: "group" | "contact";
  isSending: boolean;
  isScheduleMode: boolean;
  onAction: () => void;
  onStop: () => void;
}

export function ActionPanel({
  recipientCount,
  estimatedTime,
  recipientType,
  isSending,
  isScheduleMode,
  onAction,
  onStop,
}: ActionPanelProps) {
  return (
    <div className="bg-primary text-primary-foreground rounded-xl shadow-lg p-5 shrink-0 flex flex-col gap-4">
      <div>
        <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wider mb-1">
          Resumo Total
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{recipientCount}</span>
          <span className="text-sm text-primary-foreground/70">destinatários</span>
        </div>
        {/* Current Selection Badges */}
        <div className="mt-2 text-xs">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium border",
              recipientType === "group"
                ? "bg-secondary text-secondary-foreground border-secondary-foreground/20"
                : "bg-success/20 text-success border-success/30"
            )}
          >
            {recipientType === "group" ? "GRUPO" : "CONTATO"}
          </span>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-primary-foreground/10">
        <div className="flex justify-between text-xs text-primary-foreground/80">
          <span>Tempo estimado:</span>
          <span>~{estimatedTime} min</span>
        </div>
        <div className="flex justify-between text-xs text-primary-foreground/80">
          <span>Atraso seguro:</span>
          <span className="text-success">Ativo</span>
        </div>
      </div>

      <Button
        onClick={isSending ? onStop : onAction}
        className={cn(
          "w-full h-11 text-sm font-semibold shadow transition-all mt-1",
          isSending
            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-in fade-in"
            : isScheduleMode
            ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            : "bg-success hover:bg-success/90 text-success-foreground"
        )}
      >
        {isSending ? (
          <>
            <X className="w-4 h-4 mr-2" />
            Parar Envio
          </>
        ) : (
          <>
            {isScheduleMode ? (
              <Calendar className="w-4 h-4 mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isScheduleMode ? "Agendar Disparo" : "Iniciar Disparo"}
          </>
        )}
      </Button>
    </div>
  );
}

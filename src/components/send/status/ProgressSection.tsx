import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProgressSectionProps {
  isSending: boolean;
  showCompletion: boolean;
  progress: number;
  currentContactIndex: number;
  totalRecipients: number;
  statusMessage: string | null;
}

/**
 * ProgressSection - Barra de progresso e status de conclusão
 */
export function ProgressSection({
  isSending,
  showCompletion,
  progress,
  currentContactIndex,
  totalRecipients,
  statusMessage,
}: ProgressSectionProps) {
  if (!isSending && !showCompletion) return null;

  return (
    <div className="space-y-2 bg-card p-4 rounded-lg border shadow-sm relative overflow-hidden">
      {showCompletion && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 0.1 }}
          className="absolute inset-0 bg-success pointer-events-none"
        />
      )}
      
      <div className="flex justify-between items-end text-sm font-medium text-muted-foreground mb-2">
        <span className="flex items-center gap-2 leading-none">
          {showCompletion ? 'Concluído com Sucesso!' : 'Progresso Total'}
          {showCompletion && <PartyPopper className="w-4 h-4 text-success animate-bounce" />}
        </span>
        <span className="leading-none">
          {showCompletion ? totalRecipients : currentContactIndex} / {totalRecipients}
        </span>
      </div>
      
      <Progress 
        value={showCompletion ? 100 : progress} 
        className={`h-2 transition-all ${showCompletion ? '[&>div]:bg-success' : ''}`} 
      />

      {statusMessage && !showCompletion && (
        <div className="flex items-center gap-2 text-xs text-info bg-info/10 p-2 rounded animate-in fade-in transition-all">
          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
          <span className="font-medium truncate">{statusMessage}</span>
        </div>
      )}

      {showCompletion && (
        <div className="flex items-center gap-2 text-xs text-success bg-success/10 p-2 rounded animate-in fade-in transition-all">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span className="font-medium truncate">Envio finalizado. Esta mensagem sumirá em 5 min.</span>
        </div>
      )}
    </div>
  );
}

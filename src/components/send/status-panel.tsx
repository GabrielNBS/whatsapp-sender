import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Hourglass, Loader2, Info, CheckCircle2, XCircle, Trash2, PartyPopper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleItem } from '@/components/schedule-item';
import { ScheduledBatch, LogEntry } from '@/lib/types';

interface StatusPanelProps {
  activeSchedules: ScheduledBatch[];
  isSending: boolean;
  isScheduleMode: boolean;
  estimatedTime: number;
  progress: number;
  currentContactIndex: number;
  totalRecipients: number;
  statusMessage: string | null;
  logs: LogEntry[];
  onCancelSchedule: (batchId: string) => void;
  onClearLogs: () => void;
}

export function StatusPanel({
  activeSchedules,
  isSending,
  isScheduleMode,
  estimatedTime,
  progress,
  currentContactIndex,
  totalRecipients,
  statusMessage,
  logs,
  onCancelSchedule,
  onClearLogs
}: StatusPanelProps) {
  
  const [showCompletion, setShowCompletion] = useState(false);

  // Manage completion state
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isSending) {
        setShowCompletion(false);
    } else if (!isSending && progress === 100 && totalRecipients > 0) {
        // Just finished
        setShowCompletion(true);
        timer = setTimeout(() => {
            setShowCompletion(false);
        }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
        if (timer) clearTimeout(timer);
    };
  }, [isSending, progress, totalRecipients]);

  return (
    <Card className="flex flex-col h-full border-border bg-muted/30 shadow-inner">
      <CardHeader className="bg-card border-b flex flex-row items-center justify-between space-y-0 py-3">
        <div className="flex items-center gap-2">
            <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Status e Agendamentos
            </CardTitle>
        </div>
        
        <div className="flex items-center gap-2">
             {isSending && !isScheduleMode && (
                <Badge variant="outline" className="text-[10px] font-normal flex gap-1 items-center bg-muted/30">
                    <Hourglass className="w-3 h-3 text-muted-foreground" />
                    ~{estimatedTime} min restantes
                </Badge>
             )}
             {logs.length > 0 && (
                 <button 
                    onClick={onClearLogs}
                    className="text-[10px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 px-2 py-1 rounded bg-muted/30 hover:bg-destructive/10"
                    title="Limpar logs"
                 >
                    <Trash2 className="w-3 h-3" />
                    Limpar
                 </button>
             )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6 flex-1 flex flex-col min-h-0">

        {/* Active Schedules Section */}
        {activeSchedules.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Agendamentos Ativos
              <Badge variant="secondary" className="text-[10px]">{activeSchedules.length}</Badge>
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {activeSchedules.map(batch => (
                <ScheduleItem key={batch.id} batch={batch} onCancel={onCancelSchedule} />
              ))}
            </div>
          </div>
        )}

        {!isScheduleMode && (isSending || showCompletion) && (
          <div className="space-y-2 bg-card p-4 rounded-lg border shadow-sm relative overflow-hidden">
            {showCompletion && (
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 0.1 }}
                    className="absolute inset-0 bg-success pointer-events-none"
                 />
            )}
            
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2">
                  {showCompletion ? 'Concluído com Sucesso!' : 'Progresso Total'}
                  {showCompletion && <PartyPopper className="w-4 h-4 text-success animate-bounce" />}
              </span>
              <span>{showCompletion ? totalRecipients : currentContactIndex} / {totalRecipients}</span>
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
        )}

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 relative max-h-[400px]">
          <AnimatePresence mode="popLayout">
            {logs.length === 0 && !statusMessage && activeSchedules.length === 0 && !showCompletion && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-muted-foreground italic text-center py-10 text-sm"
              >
                Nenhum envio em andamento ou agendado.
              </motion.div>
            )}
            {logs.map((log: LogEntry) => (
              <motion.div
                key={log.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-start gap-3 p-3 rounded-lg border text-sm shadow-sm ${log.type === 'success' ? 'bg-success/10 border-success/20 text-success' :
                  log.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                    'bg-card border-border text-muted-foreground'
                  }`}
              >
                <div className="mt-0.5 shrink-0">
                  {log.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                  {log.type === 'error' && <XCircle className="w-4 h-4" />}
                  {log.type === 'info' && <Info className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{log.message}</p>
                  <p className="text-[10px] opacity-70 mt-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

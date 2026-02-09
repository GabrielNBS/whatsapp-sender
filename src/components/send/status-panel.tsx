import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Hourglass, Trash2 } from 'lucide-react';
import { ScheduledBatch, LogEntry } from '@/lib/types';
import { SchedulesSection, ProgressSection, LogsSection } from './status';

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
  const prevIsSending = useRef(isSending);
  const completionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (prevIsSending.current && !isSending && progress === 100 && totalRecipients > 0) {
      setTimeout(() => {
        setShowCompletion(true);
        if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
        completionTimerRef.current = setTimeout(() => {
          setShowCompletion(false);
        }, 5 * 60 * 1000);
      }, 0);
    }
    prevIsSending.current = isSending;
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
  }, [isSending, progress, totalRecipients]);

  const isEmpty = logs.length === 0 && !statusMessage && activeSchedules.length === 0 && !showCompletion;

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
        <SchedulesSection 
          schedules={activeSchedules} 
          onCancel={onCancelSchedule} 
        />

        {!isScheduleMode && (
          <ProgressSection
            isSending={isSending}
            showCompletion={showCompletion}
            progress={progress}
            currentContactIndex={currentContactIndex}
            totalRecipients={totalRecipients}
            statusMessage={statusMessage}
          />
        )}

        <LogsSection 
          logs={logs} 
          isEmpty={isEmpty} 
        />
      </CardContent>
    </Card>
  );
}

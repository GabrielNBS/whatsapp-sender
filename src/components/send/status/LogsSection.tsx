import { LogEntry } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

interface LogsSectionProps {
  logs: LogEntry[];
  isEmpty: boolean;
}

/**
 * LogsSection - Lista animada de logs
 */
export function LogsSection({ logs, isEmpty }: LogsSectionProps) {
  return (
    <div className="flex-1 overflow-y-auto pr-2 space-y-2 relative max-h-[400px]">
      <AnimatePresence mode="popLayout">
        {isEmpty && (
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
            className={`flex items-start gap-3 p-3 rounded-lg border text-sm shadow-sm ${
              log.type === 'success' ? 'bg-success/10 border-success/20 text-success' :
              log.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
              'bg-card border-border text-muted-foreground'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {log.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {log.type === 'error' && <XCircle className="w-4 h-4" />}
              {log.type === 'info' && <Info className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-4">
                <p className="font-medium text-sm leading-snug">{log.message}</p>
                <span className="text-[10px] opacity-70 shrink-0 whitespace-nowrap pt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useAppStore } from '@/lib/store';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowRight, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function SendProgressTooltip() {
  const pathname = usePathname();
  const router = useRouter();
  const sendingStatus = useAppStore((s) => s.sendingStatus);
  const setSendingStatus = useAppStore((s) => s.setSendingStatus);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const isOnSendPage = pathname === '/dashboard/send';
  const shouldShow = sendingStatus.isSending && !isOnSendPage;

  const total = sendingStatus.totalContacts;
  const processed = sendingStatus.sentCount + sendingStatus.failedCount;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await fetch('/api/campaigns/stop', { method: 'POST' });
      setSendingStatus({
        isSending: false,
        statusMessage: null,
        stoppedByUser: true,
      });
    } catch {
      // ignore
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="send-progress-tooltip"
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="fixed bottom-6 right-6 z-100"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <div
            className={cn(
              "bg-card border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
              isExpanded ? "w-72" : "w-56"
            )}
          >
            {/* Header - always visible */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}
                >
                  <Send className="w-4 h-4 text-white" />
                </div>
                {/* Pulsing ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-400"
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground truncate">
                    Enviando...
                  </p>
                  <span className="text-xs font-bold tabular-nums" style={{ 
                    background: 'linear-gradient(135deg, #16a34a, #4ade80)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent' 
                  }}>
                    {percentage}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {processed} / {total} contatos
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-2">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Expanded actions */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 flex gap-2">
                    <button
                      onClick={() => router.push('/dashboard/send')}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium 
                        bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      Ver Painel
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleStop}
                      disabled={isStopping}
                      className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium 
                        bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    >
                      {isStopping ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Square className="w-3 h-3" />
                      )}
                      Parar
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Paused indicator */}
            {sendingStatus.isPaused && (
              <div className="px-4 pb-2">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Pausado (WhatsApp desconectado)
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

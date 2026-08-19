'use client';

import { motion } from 'framer-motion';
import { Bell, Plus } from 'lucide-react';
import GradientText from '@/components/ui/gradient-text';
import type { SendingStatus } from '@/lib/types';

export interface ErrorOverlayProps {
  sendingStatus: SendingStatus;
  handleNewTransmission: () => void;
}

export function ErrorOverlay({
  sendingStatus,
  handleNewTransmission,
}: ErrorOverlayProps) {
  const successRate = Math.round(
    (sendingStatus.sentCount / (sendingStatus.sentCount + sendingStatus.failedCount || 1)) * 100
  );

  return (
    <motion.div
      key="error-ui"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center gap-3 lg:gap-3 2xl:gap-6 w-full max-w-md text-center py-4 lg:py-4 2xl:py-6 h-full justify-center"
    >
      {/* Alert Illustration */}
      <div className="relative mb-2 lg:mb-2 2xl:mb-4 flex-1 flex items-center justify-center min-h-0 max-h-[25vh]">
        <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-48 2xl:h-40">
          <rect x="60" y="20" width="80" height="120" rx="12" fill="currentColor" className="text-amber-100 dark:text-amber-900/30" />
          <rect x="70" y="35" width="60" height="85" rx="4" fill="currentColor" className="text-amber-50 dark:text-amber-950/40" />
          <motion.g animate={{ rotate: [0, -3, 3, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 2 }}>
            <path d="M100 55 L100 85" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
            <circle cx="100" cy="100" r="4" fill="#f59e0b" />
          </motion.g>
          <motion.circle
            cx="160" cy="120" r="5" fill="#ef4444" opacity="0.5"
            animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <circle cx="45" cy="60" r="3" fill="#f59e0b" opacity="0.4" />
        </svg>
      </div>

      {/* Title + status */}
      <div className="space-y-2 lg:space-y-2 2xl:space-y-4 mb-4 lg:mb-4 2xl:mb-8">
        <h3 className="text-[1.75rem] lg:text-[1.75rem] 2xl:text-[2.5rem] font-light tracking-tighter leading-[1.1]">
          Campanha finalizada. <GradientText className="font-black" colors={['#f59e0b', '#fbbf24', '#d97706']}>Atenção!</GradientText>
        </h3>
        <div className="flex justify-center">
          <p className="rounded-lg border border-warning/20 bg-warning/5 px-4 py-2 text-xs font-semibold text-warning">
            Todas as mensagens foram processadas.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="w-full grid grid-cols-2 gap-3 lg:gap-3 2xl:gap-4 mb-4 lg:mb-4 2xl:mb-8">
        <div className="bg-card/40 backdrop-blur-md border border-border/40 p-4 lg:p-4 2xl:p-6 rounded-2xl text-left shadow-xs transition-all hover:bg-card/60 group">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Taxa de sucesso</p>
          <div className="flex items-baseline gap-1">
            <GradientText
              className="text-2xl lg:text-2xl 2xl:text-4xl font-bold tracking-tighter leading-none"
              colors={['#f59e0b', '#fbbf24', '#d97706']}
            >
              {successRate}%
            </GradientText>
          </div>
        </div>
        <div className="bg-card/40 backdrop-blur-md border border-border/40 p-4 lg:p-4 2xl:p-6 rounded-2xl text-left shadow-xs transition-all hover:bg-card/60 group">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Total alcançado</p>
          <p className="text-2xl lg:text-2xl 2xl:text-4xl font-bold text-foreground tracking-tighter leading-none">
            {sendingStatus.totalContacts}
          </p>
        </div>
      </div>

      {sendingStatus.failedContacts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="w-full text-left bg-destructive/[0.02] border border-destructive/10 rounded-3xl p-4 lg:p-3 2xl:p-6 mb-4 lg:mb-4 2xl:mb-10 shrink min-h-0"
        >
          <div className="flex items-center gap-2 mb-2 lg:mb-2 2xl:mb-4 text-destructive/80">
            <Bell className="w-3.5 h-3.5 lg:w-3.5 lg:h-3.5 2xl:w-4 2xl:h-4" />
            <span className="text-xs font-semibold">Relatório de erros ({sendingStatus.failedContacts.length})</span>
          </div>
          <div className="max-h-24 lg:max-h-20 2xl:max-h-40 overflow-y-auto space-y-2 lg:space-y-1.5 2xl:space-y-3 pr-2 no-scrollbar">
            {sendingStatus.failedContacts.map((c, i) => (
              <div key={i} className="flex justify-between items-center bg-background/40 p-3 rounded-2xl border border-border/30">
                <span className="text-xs font-semibold text-foreground">{c.name}</span>
                <span className="rounded-lg bg-muted/50 px-2.5 py-1 font-mono text-xs text-muted-foreground">{c.number}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.button
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
        onClick={handleNewTransmission}
        className="flex h-12 items-center justify-center gap-3 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm"
      >
        <span>NOVA TRANSMISSÃO</span>
        <motion.div
          variants={{ hover: { rotate: 90, scale: 1.2 } }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Plus className="w-4 h-4" />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}

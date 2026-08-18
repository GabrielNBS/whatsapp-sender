'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import GradientText from '@/components/ui/gradient-text';
import type { SendingStatus } from '@/lib/store';

export interface PausedOverlayProps {
  sendingStatus: SendingStatus;
  handleNewTransmission: () => void;
}

export function PausedOverlay({
  sendingStatus,
  handleNewTransmission,
}: PausedOverlayProps) {
  const successRate = Math.round(
    (sendingStatus.sentCount / (sendingStatus.sentCount + sendingStatus.failedCount || 1)) * 100
  );

  return (
    <motion.div
      key="paused-ui"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center gap-3 lg:gap-3 2xl:gap-6 w-full max-w-md text-center py-4 lg:py-4 2xl:py-6 h-full justify-center"
    >
      {/* Interrupted Illustration */}
      <div className="relative mb-2 lg:mb-2 2xl:mb-4 flex-1 flex items-center justify-center min-h-0 max-h-[25vh]">
        <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-48 2xl:h-40 transition-all">
          <rect x="60" y="20" width="80" height="120" rx="12" fill="currentColor" className="text-slate-200 dark:text-slate-800" />
          <rect x="70" y="35" width="60" height="85" rx="4" fill="currentColor" className="text-slate-100 dark:text-slate-900" />
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            <rect x="85" y="60" width="8" height="30" rx="4" fill="#64748b" />
            <rect x="107" y="60" width="8" height="30" rx="4" fill="#64748b" />
          </motion.g>
          <circle cx="100" cy="130" r="4" fill="#64748b" opacity="0.3" />
          <motion.circle
            cx="40" cy="80" r="6" fill="#64748b" opacity="0.2"
            animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
          <motion.circle
            cx="160" cy="110" r="4" fill="#64748b" opacity="0.15"
            animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
          />
        </svg>
      </div>

      {/* Title + status */}
      <div className="space-y-2 lg:space-y-2 2xl:space-y-4 mb-4 lg:mb-4 2xl:mb-8">
        <h3 className="text-[1.75rem] lg:text-[1.75rem] 2xl:text-[2.5rem] font-light tracking-tighter leading-[1.1]">
          Envio <GradientText className="font-black" colors={['#64748b', '#94a3b8', '#475569']}>interrompido</GradientText>
        </h3>
        <div className="flex justify-center">
          <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 2xl:px-5 2xl:py-2 rounded-full border backdrop-blur-md text-muted-foreground/60 bg-muted/20 border-border/40">
            A campanha foi pausada manualmente.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="w-full grid grid-cols-2 gap-3 lg:gap-3 2xl:gap-4 mb-4 lg:mb-4 2xl:mb-8">
        <div className="bg-card/40 backdrop-blur-md border border-border/40 p-4 lg:p-4 2xl:p-6 rounded-2xl text-left shadow-xs transition-all hover:bg-card/60 group">
          <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 lg:mb-2 2xl:mb-3 opacity-50 group-hover:opacity-100 transition-opacity">Taxa de Sucesso</p>
          <div className="flex items-baseline gap-1">
            <GradientText
              className="text-2xl lg:text-2xl 2xl:text-4xl font-bold tracking-tighter leading-none"
              colors={['#64748b', '#94a3b8', '#475569']}
            >
              {successRate}%
            </GradientText>
          </div>
        </div>
        <div className="bg-card/40 backdrop-blur-md border border-border/40 p-4 lg:p-4 2xl:p-6 rounded-2xl text-left shadow-xs transition-all hover:bg-card/60 group">
          <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 lg:mb-2 2xl:mb-3 opacity-50 group-hover:opacity-100 transition-opacity">Total Alcançado</p>
          <p className="text-2xl lg:text-2xl 2xl:text-4xl font-bold text-foreground tracking-tighter leading-none">
            {sendingStatus.totalContacts}
          </p>
        </div>
      </div>

      <motion.button
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
        onClick={handleNewTransmission}
        className="p-6 h-12 lg:h-12 2xl:h-14 rounded-2xl font-black text-[10px] lg:text-[10px] 2xl:text-xs bg-primary text-primary-foreground shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group tracking-[0.2em] uppercase"
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

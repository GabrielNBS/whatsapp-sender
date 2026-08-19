'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import GradientText from '@/components/ui/gradient-text';
import type { SendingStatus } from '@/lib/types';

export interface SuccessOverlayProps {
  sendingStatus: SendingStatus;
  handleNewTransmission: () => void;
}

export function SuccessOverlay({
  sendingStatus,
  handleNewTransmission,
}: SuccessOverlayProps) {
  const successRate = Math.round(
    (sendingStatus.sentCount / (sendingStatus.sentCount + sendingStatus.failedCount || 1)) * 100
  );

  return (
    <motion.div
      key="success-ui"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center gap-3 lg:gap-3 2xl:gap-6 w-full max-w-md text-center py-4 lg:py-4 2xl:py-6 h-full justify-center"
    >
      {/* Success Illustration */}
      <div className="relative mb-2 lg:mb-2 2xl:mb-4 flex-1 flex items-center justify-center min-h-0 max-h-[25vh]">
        <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-48 2xl:h-40">
          <rect x="60" y="20" width="80" height="120" rx="12" fill="currentColor" className="text-emerald-100 dark:text-emerald-900/30" />
          <rect x="70" y="35" width="60" height="85" rx="4" fill="currentColor" className="text-emerald-50 dark:text-emerald-950/40" />
          <motion.path
            d="M85 80 L97 92 L120 68"
            stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
          <motion.g animate={{ y: [0, -5, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <circle cx="160" cy="50" r="5" fill="#10b981" />
            <circle cx="40" cy="100" r="4" fill="#10b981" />
          </motion.g>
          <motion.path
            d="M150 100 L170 80"
            stroke="#10b981"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="opacity-30"
            animate={{ strokeDashoffset: [0, -8] }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        </svg>
      </div>

      {/* Title + status */}
      <div className="space-y-2 lg:space-y-2 2xl:space-y-4 mb-4 lg:mb-4 2xl:mb-8">
        <h3 className="text-[1.75rem] lg:text-[1.75rem] 2xl:text-[2.5rem] font-light tracking-tighter leading-[1.1]">
          Transmissão <GradientText className="font-black" colors={['#10b981', '#34d399', '#059669']}>concluída!</GradientText>
        </h3>
        <div className="flex justify-center">
          <p className="rounded-lg border border-success/20 bg-success/5 px-4 py-2 text-xs font-semibold text-success">
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
              colors={['#10b981', '#34d399', '#059669']}
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

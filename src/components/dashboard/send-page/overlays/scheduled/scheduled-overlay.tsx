'use client';

import { motion } from 'framer-motion';
import { Calendar, Plus, Users } from 'lucide-react';
import GradientText from '@/components/ui/gradient-text';
import type { ScheduledCampaignOverlay } from '@/hooks/use-dashboard-campaign';
import { formatScheduleDateTime } from '@/lib/date-formatters';

export interface ScheduledOverlayProps {
  scheduledOverlay: ScheduledCampaignOverlay | null;
  handleNewTransmission: () => void;
}

export function ScheduledOverlay({
  scheduledOverlay,
  handleNewTransmission,
}: ScheduledOverlayProps) {
  return (
    <motion.div
      key="scheduled-ui"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center w-full max-w-md text-center py-4 lg:py-4 2xl:py-6 h-full justify-center"
    >
      {/* Scheduled SVG Illustration */}
      <div className="relative mb-4 lg:mb-4 2xl:mb-8 flex-1 flex items-center justify-center min-h-0 max-h-[25vh]">
        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
        <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-48 2xl:h-40 relative z-10 transition-all">
          <rect x="60" y="20" width="80" height="120" rx="20" fill="currentColor" className="text-blue-100 dark:text-blue-900/20" />
          <rect x="72" y="38" width="56" height="84" rx="8" fill="currentColor" className="text-white dark:text-blue-950/40" />
          <motion.g
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            style={{ originX: '100px', originY: '77px' }}
          >
            <circle cx="100" cy="77" r="32" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 6" className="opacity-30" />
            <circle cx="100" cy="45" r="3" fill="#3b82f6" />
          </motion.g>
          <motion.path
            d="M100 62 L100 77 L112 77"
            stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
            style={{ originX: '100px', originY: '77px' }}
          />
          <circle cx="100" cy="77" r="2" fill="#3b82f6" />
        </svg>
      </div>

      <div className="space-y-2 lg:space-y-2 2xl:space-y-4 mb-4 lg:mb-4 2xl:mb-8">
        <h3 className="text-[1.75rem] lg:text-[1.75rem] 2xl:text-[2.5rem] font-light tracking-tighter leading-[1.1]">
          Campanha <GradientText className="font-black" colors={['#3b82f6', '#60a5fa', '#2563eb']}>agendada!</GradientText>
        </h3>
        <div className="flex justify-center">
          <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 bg-blue-500/5 border border-blue-500/10 px-4 py-1.5 2xl:px-5 2xl:py-2 rounded-full">
            Tudo pronto para o disparo automático.
          </p>
        </div>
      </div>

      <div className="w-full bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-4 lg:p-4 2xl:p-6 text-left space-y-4 lg:space-y-4 2xl:space-y-6 shadow-xs mb-6 lg:mb-6 2xl:mb-10">
        <div className="flex items-center justify-between">
          <span className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">{scheduledOverlay?.batchName}</span>
          <div className="h-[2px] w-12 bg-blue-500/30 rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:gap-4 2xl:gap-8">
          <div className="space-y-1.5 lg:space-y-1.5 2xl:space-y-2">
            <div className="flex items-center gap-2 text-blue-500/80">
              <Calendar className="w-3 h-3 lg:w-3 lg:h-3 2xl:w-3.5 2xl:h-3.5" />
              <span className="text-[8px] lg:text-[8px] 2xl:text-[9px] uppercase font-black tracking-widest">DATA E HORA</span>
            </div>
            <p className="text-xs lg:text-xs 2xl:text-sm font-black text-foreground tracking-tight">
              {scheduledOverlay?.scheduledFor ? formatScheduleDateTime(scheduledOverlay.scheduledFor) : ''}
            </p>
          </div>
          <div className="space-y-1.5 lg:space-y-1.5 2xl:space-y-2">
            <div className="flex items-center gap-2 text-blue-500/80">
              <Users className="w-3 h-3 lg:w-3 lg:h-3 2xl:w-3.5 2xl:h-3.5" />
              <span className="text-[8px] lg:text-[8px] 2xl:text-[9px] uppercase font-black tracking-widest">PÚBLICO</span>
            </div>
            <p className="text-xs lg:text-xs 2xl:text-sm font-black text-foreground tracking-tight">{scheduledOverlay?.contactCount || 0} contatos</p>
          </div>
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

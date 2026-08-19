'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Calendar, ChevronRight } from 'lucide-react';
import GradientText from '@/components/ui/gradient-text';
import { AnimatedMessage } from '@/components/illustrations/animated-message';
import type { DashboardCampaignController } from '@/hooks/use-dashboard-campaign';
import { useRotatingIndex } from '@/hooks/use-rotating-index';
import { formatScheduleTime } from '@/lib/date-formatters';

const ROTATING_WORDS = ['Engajamento', 'Negócio', 'Posicionamento', 'Alcance'];

type CampaignIntroStepProps = Pick<
  DashboardCampaignController,
  'activeSchedules' | 'campaignProgress' | 'openMonitoring' | 'sendingStatus'
> & {
  onStart: () => void;
};

export function CampaignIntroStep({
  activeSchedules,
  campaignProgress,
  onStart,
  openMonitoring,
  sendingStatus,
}: CampaignIntroStepProps) {
  const currentWordIndex = useRotatingIndex(ROTATING_WORDS.length, 10_000);
  const currentWord = ROTATING_WORDS[currentWordIndex];

  return (
    <div className="premium-scrollbar mx-auto flex min-h-0 max-w-2xl flex-1 flex-col items-center justify-center space-y-5 overflow-y-auto px-4 py-6 text-center">
      <div className="relative mb-4 flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
        {Array.from({ length: 2 }, (_, index) => (
          <motion.div
            key={index}
            className="absolute inset-0 rounded-full border border-primary/20 bg-primary/5"
            animate={{ scale: [1, 2.2], opacity: [0, 0.3, 0] }}
            transition={{ duration: 5, repeat: Infinity, delay: index, ease: 'linear' }}
          />
        ))}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />

        <AnimatedMessage className="relative z-10 h-64 w-64 rounded-full" />
      </div>

      <div className="space-y-4 lg:space-y-6">
        <h1 className="flex flex-col items-center text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          <GradientText
            colors={['var(--primary)', '#7c3aed', 'var(--primary)', '#a855f7', 'var(--primary)']}
            animationSpeed={4}
            className="mb-1 text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Escale seu
          </GradientText>
          <span className="relative flex h-[1.1em] w-full justify-center sm:h-[1.3em]">
            <AnimatePresence mode="wait">
              <motion.span key={currentWordIndex} className="absolute flex items-center justify-center whitespace-nowrap">
                {currentWord.split('').map((char, index) => (
                  <motion.span
                    key={`${currentWordIndex}-${index}`}
                    initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
                    transition={{ duration: 0.4, delay: index * 0.02, ease: [0.4, 0, 0.2, 1] }}
                    className="inline-block px-px py-1 font-bold text-accent-foreground"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>
        <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground">
          Campanhas <span className="font-bold text-foreground">personalizadas</span> e disparos{' '}
          <span className="font-bold text-foreground">precisos</span> e <span className="font-bold text-foreground">programados</span>.
          Alcance seu público de forma profissional.
        </p>
      </div>

      <motion.button
        onClick={onStart}
        aria-label="Iniciar campanha"
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
        className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:px-10"
      >
        Iniciar Campanha
        <motion.span variants={{ hover: { x: 5 } }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
          <ChevronRight className="h-5 w-5" />
        </motion.span>
      </motion.button>

      {sendingStatus.isSending || activeSchedules.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-4 flex w-full max-w-3xl flex-col items-center justify-center gap-3 text-left sm:flex-row"
        >
          {sendingStatus.isSending ? (
            <button onClick={() => openMonitoring()} className="group flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3 transition-all hover:bg-primary/10 sm:max-w-75">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="overflow-hidden leading-tight">
                  <p className="truncate text-xs font-semibold text-success">Ao vivo</p>
                  <p className="truncate text-xs font-bold text-foreground">{sendingStatus.statusMessage || 'Enviando...'}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                      <motion.div className="h-full bg-primary" animate={{ width: `${campaignProgress.percent}%` }} />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">{campaignProgress.percent}%</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="ml-1 h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
          ) : null}

          {activeSchedules.length > 0 ? (
            <button onClick={() => openMonitoring(activeSchedules[0].batchId)} className="group flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 shadow-xs transition-all hover:bg-muted/50 sm:max-w-75">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="overflow-hidden leading-tight">
                  <p className="truncate text-xs font-semibold text-muted-foreground">Agendamentos</p>
                  <p className="text-xs font-bold text-foreground">{activeSchedules.length} {activeSchedules.length === 1 ? 'pendente' : 'pendentes'}</p>
                  <p className="mt-0.5 whitespace-nowrap text-xs text-muted-foreground">Próximo: {formatScheduleTime(activeSchedules[0].scheduledFor)}</p>
                </div>
              </div>
              <ChevronRight className="ml-1 h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </button>
          ) : null}
        </motion.div>
      ) : null}
    </div>
  );
}

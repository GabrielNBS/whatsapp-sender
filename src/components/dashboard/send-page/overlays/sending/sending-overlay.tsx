'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Square } from 'lucide-react';
import { RecipientProgress } from '@/components/send/recipient-progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import GradientText from '@/components/ui/gradient-text';
import type { RecipientMode } from '@/hooks/use-dashboard-campaign';
import type { RecipientBatch } from '@/hooks/use-send-form';
import { estimateCampaignDurationMinutes, type CampaignProgress } from '@/lib/campaign-progress';
import type { SendingStatus } from '@/lib/store';
import { cn } from '@/lib/utils';

export interface SendingOverlayProps {
  campaignProgress: CampaignProgress;
  recipientBatches: RecipientBatch[];
  recipientMode: RecipientMode;
  recipients: Array<unknown>;
  sendingStatus: SendingStatus;
  handleStop: () => void;
}

export function SendingOverlay({
  campaignProgress,
  recipientBatches,
  recipientMode,
  recipients,
  sendingStatus,
  handleStop,
}: SendingOverlayProps) {
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);

  return (
    <motion.div
      key="sending-ui"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex flex-col items-center gap-3 lg:gap-3 2xl:gap-6 w-full max-w-lg text-center py-4 lg:py-4 2xl:py-10 h-full lg:h-full 2xl:h-full justify-center"
    >
      {/* Animated SVG illustration */}
      <div className="relative mb-2 lg:mb-2 2xl:mb-8 flex-1 flex items-center justify-center min-h-0 max-h-[30vh]">
        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
        <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-56 2xl:h-40 relative z-10 transition-all">
          <rect x="20" y="20" width="80" height="140" rx="20" fill="currentColor" className="text-primary/10" stroke="currentColor" strokeWidth="2.5" />
          <rect x="30" y="38" width="60" height="104" rx="8" fill="currentColor" className="text-primary/5" />
          <circle cx="60" cy="152" r="6" fill="currentColor" className="text-primary/20" />

          <motion.g animate={{ x: [0, 8, 0], opacity: [1, 0.7, 1] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}>
            <rect x="110" y="55" width="70" height="28" rx="14" fill="var(--primary)" />
            <path d="M110 72 L102 80 L118 72" fill="var(--primary)" />
            <rect x="118" y="63" width="54" height="6" rx="3" fill="white" opacity="0.8" />
            <rect x="118" y="73" width="36" height="4" rx="2" fill="white" opacity="0.5" />
          </motion.g>

          <motion.g animate={{ x: [0, 10, 0], opacity: [0.8, 0.5, 0.8] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.3 }}>
            <rect x="115" y="100" width="58" height="24" rx="12" fill="var(--primary)" className="opacity-70" />
            <path d="M115 116 L107 123 L122 116" fill="var(--primary)" className="opacity-70" />
            <rect x="122" y="107" width="44" height="5" rx="2.5" fill="white" opacity="0.7" />
            <rect x="122" y="115" width="28" height="3.5" rx="1.75" fill="white" opacity="0.45" />
          </motion.g>

          <motion.g animate={{ x: [0, 6, 0], opacity: [0.6, 0.3, 0.6] }} transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut", delay: 0.7 }}>
            <rect x="120" y="136" width="46" height="20" rx="10" fill="var(--primary)" className="opacity-40" />
            <path d="M120 150 L113 156 L127 150" fill="var(--primary)" className="opacity-40" />
            <rect x="127" y="142" width="32" height="4" rx="2" fill="white" opacity="0.6" />
            <rect x="127" y="149" width="20" height="3" rx="1.5" fill="white" opacity="0.4" />
          </motion.g>

          <motion.circle cx="195" cy="48" r="4" fill="#fbbf24" animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.circle cx="205" cy="90" r="2.5" fill="var(--primary)" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
          <motion.circle cx="198" cy="128" r="3" fill="#fbbf24" animate={{ opacity: [0.1, 0.6, 0.1] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} />
        </svg>
      </div>

      {/* Title + status */}
      <div className="space-y-2 lg:space-y-2 2xl:space-y-4 mb-4 lg:mb-4 2xl:mb-8">
        <h3 className="text-[1.75rem] lg:text-[1.75rem] 2xl:text-[2.5rem] font-light tracking-tighter leading-[1.1]">
          Enviando <GradientText className="font-black">mensagens...</GradientText>
        </h3>
        <div className="flex justify-center">
          <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 bg-muted/20 border border-border/40 px-4 py-1.5 2xl:px-5 2xl:py-2 rounded-full backdrop-blur-md">
            {sendingStatus.statusMessage || 'Transmissão em andamento. Não feche esta janela.'}
          </p>
        </div>
      </div>

      <RecipientProgress
        batches={recipientBatches}
        completedRecipients={campaignProgress.processed}
      />

      {/* Big progress counter */}
      {sendingStatus.totalContacts > 0 && (
        <div className="w-full space-y-2 lg:space-y-2 2xl:space-y-4">
          <div className="flex items-baseline justify-center gap-2">
            <GradientText className="text-4xl lg:text-4xl 2xl:text-6xl font-black">
              {campaignProgress.processed}
            </GradientText>
            <span className="text-xl lg:text-xl 2xl:text-2xl text-muted-foreground font-medium">/ {sendingStatus.totalContacts}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner border border-border/50">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-primary to-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${campaignProgress.percent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            {campaignProgress.remaining} mensagens restantes
          </p>
        </div>
      )}

      {/* Info grid */}
      <div className="w-full grid grid-cols-3 gap-3 lg:gap-3 2xl:gap-4 pt-4 lg:pt-4 2xl:pt-6 border-t border-border">
        <div className="text-center">
          <p className="text-[8px] lg:text-[8px] 2xl:text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Estimativa</p>
          <p className="text-xs lg:text-xs 2xl:text-sm font-bold">~{estimateCampaignDurationMinutes(recipients.length)} min</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] lg:text-[8px] 2xl:text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Atraso</p>
          <p className="text-xs lg:text-xs 2xl:text-sm font-bold text-success">Ativo ✓</p>
        </div>
        <div className="text-center">
          <p className="text-[8px] lg:text-[8px] 2xl:text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Modo</p>
          <span className={cn(
            "inline-block px-2 py-0.5 rounded-full text-[9px] lg:text-[9px] 2xl:text-[10px] font-bold",
            recipientMode === 'GRUPOS'
              ? "bg-info/10 text-info"
              : recipientMode === 'CONTATOS'
                ? "bg-success/10 text-success"
                : "bg-primary/10 text-primary"
          )}>
            {recipientMode}
          </span>
        </div>
      </div>

      <motion.button
        whileHover="hover"
        whileTap={{ scale: 0.98 }}
        className="mt-6 lg:mt-6 2xl:mt-10 w-full h-12 lg:h-12 2xl:h-14 rounded-2xl font-black text-[10px] lg:text-[10px] 2xl:text-xs bg-destructive text-destructive-foreground shadow-xl shadow-destructive/20 flex items-center justify-center gap-3 group transition-all tracking-[0.2em] uppercase"
        onClick={() => setShowStopConfirmation(true)}
      >
        <motion.div
          variants={{ hover: { rotate: 180, scale: 1.2 } }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Square className="w-4 h-4 fill-current" />
        </motion.div>
        Interromper Agora
      </motion.button>

      {/* Stop Confirmation Dialog */}
      <AlertDialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black tracking-tight">Interromper Envio?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja parar o processo agora?
              Alguns contatos da sua lista podem não receber a mensagem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl font-semibold border-border/50">Continuar Enviando</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleStop();
                setShowStopConfirmation(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold"
            >
              Sim, Parar Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

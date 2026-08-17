'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Calendar, Plus, Square, Users } from 'lucide-react';
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
import type { DashboardCampaignController } from '@/hooks/use-dashboard-campaign';
import { estimateCampaignDurationMinutes } from '@/lib/campaign-progress';
import { formatScheduleDateTime } from '@/lib/date-formatters';
import { cn } from '@/lib/utils';

type CampaignStatusStepProps = Pick<
  DashboardCampaignController,
  | 'campaignProgress'
  | 'debugForceScreen'
  | 'handleNewTransmission'
  | 'handleStop'
  | 'isSending'
  | 'recipientBatches'
  | 'recipientMode'
  | 'recipients'
  | 'scheduledOverlay'
  | 'scheduledStatusComplete'
  | 'sendingStatus'
>;

export function CampaignStatusStep({
  campaignProgress,
  debugForceScreen,
  handleNewTransmission,
  handleStop,
  isSending,
  recipientBatches,
  recipientMode,
  recipients,
  scheduledOverlay,
  scheduledStatusComplete,
  sendingStatus,
}: CampaignStatusStepProps) {
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);

  return (
                                    <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full space-y-6 h-full relative">
                                        <AnimatePresence mode="wait">
                                            {(debugForceScreen === 'sending' || (isSending && !debugForceScreen)) ? (
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
                                                </motion.div>
                                            ) : (debugForceScreen === 'scheduled' || (scheduledOverlay && !scheduledStatusComplete && !debugForceScreen)) ? (
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
                                                        className="w-full h-12 lg:h-12 2xl:h-14 rounded-2xl font-black text-[10px] lg:text-[10px] 2xl:text-xs bg-primary text-primary-foreground shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group tracking-[0.2em] uppercase"
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
                                            ) : (
                                                // COMPLETED STATE (INLINE)
                                                <motion.div
                                                    key="completed-ui"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 1.05 }}
                                                    className="flex flex-col items-center gap-3 lg:gap-3 2xl:gap-6 w-full max-w-md text-center py-4 lg:py-4 2xl:py-6 h-full justify-center"
                                                >
                                                    {/* Status Illustration: Animated SVG based on final state */}
                                                    <div className="relative mb-2 lg:mb-2 2xl:mb-4 flex-1 flex items-center justify-center min-h-0 max-h-[25vh]">
                                                        {sendingStatus.stoppedByUser ? (
                                                            /* Interrupted Illustration */
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
                                                        ) : sendingStatus.failedContacts.length === 0 ? (
                                                            /* Success Illustration */
                                                            <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-48 2xl:h-40">
                                                                <rect x="60" y="20" width="80" height="120" rx="12" fill="currentColor" className="text-emerald-100 dark:text-emerald-900/30" />
                                                                <rect x="70" y="35" width="60" height="85" rx="4" fill="currentColor" className="text-emerald-50 dark:text-emerald-950/40" />
                                                                <motion.path
                                                                    d="M85 80 L97 92 L120 68"
                                                                    stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                                                                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
                                                                />
                                                                <motion.g animate={{ y: [0, -5, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                                                                    <circle cx="160" cy="50" r="5" fill="#10b981" />
                                                                    <circle cx="40" cy="100" r="4" fill="#10b981" />
                                                                </motion.g>
                                                                <motion.path
                                                                    d="M150 100 L170 80" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" className="opacity-30"
                                                                    animate={{ strokeDashoffset: [0, -8] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                                />
                                                            </svg>
                                                        ) : (
                                                            /* Alert Illustration */
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
                                                        )}
                                                    </div>

                                                    {/* Title + status */}
                                                    <div className="space-y-2 lg:space-y-2 2xl:space-y-4 mb-4 lg:mb-4 2xl:mb-8">
                                                        <h3 className="text-[1.75rem] lg:text-[1.75rem] 2xl:text-[2.5rem] font-light tracking-tighter leading-[1.1]">
                                                            {sendingStatus.stoppedByUser ? (
                                                                <>Envio <GradientText className="font-black" colors={['#64748b', '#94a3b8', '#475569']}>interrompido</GradientText></>
                                                            ) : sendingStatus.failedContacts.length > 0 ? (
                                                                <>Campanha finalizada. <GradientText className="font-black" colors={['#f59e0b', '#fbbf24', '#d97706']}>Atenção!</GradientText></>
                                                            ) : (
                                                                <>Transmissão <GradientText className="font-black" colors={['#10b981', '#34d399', '#059669']}>concluída!</GradientText></>
                                                            )}
                                                        </h3>
                                                        <div className="flex justify-center">
                                                            <p className={cn(
                                                                "text-[9px] lg:text-[9px] 2xl:text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 2xl:px-5 2xl:py-2 rounded-full border backdrop-blur-md",
                                                                sendingStatus.stoppedByUser
                                                                    ? "text-muted-foreground/60 bg-muted/20 border-border/40"
                                                                    : sendingStatus.failedContacts.length > 0
                                                                        ? "text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/10"
                                                                        : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
                                                            )}>
                                                                {sendingStatus.stoppedByUser ? 'A campanha foi pausada manualmente.' : 'Todas as mensagens foram processadas.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Metrics Cards */}
                                                    <div className="w-full grid grid-cols-2 gap-3 lg:gap-3 2xl:gap-4 mb-4 lg:mb-4 2xl:mb-8">
                                                        <div className="bg-card/40 backdrop-blur-md border border-border/40 p-4 lg:p-4 2xl:p-6 rounded-2xl text-left shadow-xs transition-all hover:bg-card/60 group">
                                                            <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 lg:mb-2 2xl:mb-3 opacity-50 group-hover:opacity-100 transition-opacity">Taxa de Sucesso</p>
                                                            <div className="flex items-baseline gap-1">
                                                                <GradientText
                                                                    className={cn(
                                                                        "text-2xl lg:text-2xl 2xl:text-4xl font-bold tracking-tighter leading-none"
                                                                    )}
                                                                    colors={sendingStatus.failedContacts.length === 0 ? ['#10b981', '#34d399', '#059669'] : ['#f59e0b', '#fbbf24', '#d97706']}
                                                                >
                                                                    {Math.round((sendingStatus.sentCount / (sendingStatus.sentCount + sendingStatus.failedCount || 1)) * 100)}%
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

                                                    {sendingStatus.failedContacts.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                            className="w-full text-left bg-destructive/[0.02] border border-destructive/10 rounded-3xl p-4 lg:p-3 2xl:p-6 mb-4 lg:mb-4 2xl:mb-10 shrink min-h-0"
                                                        >
                                                            <div className="flex items-center gap-2 mb-2 lg:mb-2 2xl:mb-4 text-destructive/80">
                                                                <Bell className="w-3.5 h-3.5 lg:w-3.5 lg:h-3.5 2xl:w-4 2xl:h-4" />
                                                                <span className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-bold uppercase tracking-[0.2em]">Relatório de Erros ({sendingStatus.failedContacts.length})</span>
                                                            </div>
                                                            <div className="max-h-24 lg:max-h-20 2xl:max-h-40 overflow-y-auto space-y-2 lg:space-y-1.5 2xl:space-y-3 pr-2 no-scrollbar">
                                                                {sendingStatus.failedContacts.map((c, i) => (
                                                                    <div key={i} className="flex justify-between items-center bg-background/40 p-3 rounded-2xl border border-border/30">
                                                                        <span className="font-bold text-[11px] text-foreground/80 tracking-tight">{c.name}</span>
                                                                        <span className="font-mono text-[9px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">{c.number}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    <motion.button
                                                        whileHover="hover"
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleNewTransmission}
                                                        className="w-full h-12 lg:h-12 2xl:h-14 rounded-2xl font-black text-[10px] lg:text-[10px] 2xl:text-xs bg-primary text-primary-foreground shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group tracking-[0.2em] uppercase"
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
                                            )}
                                        </AnimatePresence>

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
                                    </div>
  );
}

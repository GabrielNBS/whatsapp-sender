"use client";

import { useContactStore, selectContactsByGroup } from '@/stores/contact-store';
import { useTransmissionStore } from '@/stores/transmission-store';
import { useScheduler } from "@/hooks/use-scheduler";
import { useGlobalSheet } from "./global-sheet-provider";
import { Button } from "@/components/ui/button";
import { 
    Bell, 
    AlertTriangle, 
    Users, 
    Activity, 
    ChevronRight, 
    CheckCircle2,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRouter } from "next/navigation";
import { getCampaignProgress } from '@/lib/campaign-progress';
import { sonnerFeedback } from '@/presentation/feedback';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationBell() {
    const { isSending, totalContacts, sentCount, failedCount } = useTransmissionStore((s) => s.sendingStatus);
    const groups = useContactStore((s) => s.groups);
    const contacts = useContactStore((s) => s.contacts);
    const { activeSchedules } = useScheduler(sonnerFeedback);
    const { openSheet } = useGlobalSheet();
    const isHydrated = useHydrated();
    const router = useRouter();

    if (!isHydrated) return null;

    const emptyGroups = groups.filter(g => selectContactsByGroup(contacts, g.id).length === 0);
    const emptyGroupsCount = emptyGroups.length;
    
    const isActive = isSending && totalContacts > 0;
    const campaignProgress = getCampaignProgress({ totalContacts, sentCount, failedCount });
    const pendingCount = activeSchedules.length;
    const hasAlerts = emptyGroupsCount > 0;
    
    const totalNotifications = (isActive ? 1 : 0) + (hasAlerts ? 1 : 0) + (pendingCount > 0 ? 1 : 0);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Abrir notificações${totalNotifications > 0 ? ` (${totalNotifications})` : ''}`}
                    title="Notificações"
                    className="group relative size-10 overflow-visible rounded-lg border border-transparent bg-transparent shadow-none hover:border-border hover:bg-accent"
                >
                    <Bell className={cn(
                        "size-5 transition-colors",
                        isActive ? "text-success" : hasAlerts ? "text-warning" : "text-muted-foreground group-hover:text-foreground"
                    )} />

                    {/* Badges System */}
                    <AnimatePresence>
                        {isActive ? (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -right-1 -top-1 flex min-h-5 min-w-6 items-center justify-center rounded-full bg-success px-1.5 text-xs font-semibold text-success-foreground"
                            >
                                LIVE
                            </motion.span>
                        ) : hasAlerts ? (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-warning text-xs font-semibold text-warning-foreground"
                            >
                                !
                            </motion.span>
                        ) : pendingCount > 0 ? (
                            <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-primary text-xs font-semibold text-primary-foreground"
                            >
                                {pendingCount}
                            </motion.span>
                        ) : null}
                    </AnimatePresence>

                    {/* Pulse Animations */}
                    {isActive && (
                        <motion.span
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border border-primary/40 pointer-events-none"
                        />
                    )}
                    {hasAlerts && !isActive && (
                        <motion.span
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border border-amber-500/30 pointer-events-none"
                        />
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent 
                align="end" 
                sideOffset={12} 
                className="w-80 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg"
            >
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <Bell className="w-4 h-4 text-primary" />
                            Central de Alertas
                        </h3>
                        {totalNotifications > 0 && (
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                                {totalNotifications} {totalNotifications === 1 ? 'notificação' : 'notificações'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                    {totalNotifications === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center gap-2">
                            <div className="bg-muted p-3 rounded-full">
                                <CheckCircle2 className="w-6 h-6 text-muted-foreground/40" />
                            </div>
                            <p className="text-xs font-medium text-muted-foreground italic">Tudo limpo por aqui!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {/* LIVE SESSIONS */}
                            {isActive && (
                                <button 
                                    onClick={() => router.push('/dashboard?step=3')}
                                    className="p-4 hover:bg-muted/50 transition-colors text-left group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary/20 p-2 rounded-xl shrink-0">
                                            <Activity className="w-4 h-4 text-primary animate-pulse" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-primary">Transmissão ativa</p>
                                                <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                            <p className="text-xs font-bold text-foreground">Disparando Mensagens...</p>
                                            <div className="w-full bg-muted rounded-full h-1 mt-2">
                                                <motion.div 
                                                    className="bg-primary h-full rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${campaignProgress.percent}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{campaignProgress.processed} de {totalContacts} enviados</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {isActive && (hasAlerts || pendingCount > 0) && <div className="h-px bg-border/50" />}

                            {/* EMPTY GROUPS ALERT */}
                            {hasAlerts && (
                                <div className="p-4 bg-amber-50/10 dark:bg-amber-500/5">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-amber-100 dark:bg-amber-950/40 p-2 rounded-xl shrink-0">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div>
                                                <p className="text-xs font-semibold text-warning">Atenção</p>
                                                <p className="text-xs font-bold text-foreground mt-0.5">
                                                    {emptyGroupsCount} {emptyGroupsCount === 1 ? 'grupo está vazio' : 'grupos estão vazios'}
                                                </p>
                                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                    Grupos sem contatos não aparecem na lista de seleção do wizard.
                                                </p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                onClick={() => openSheet('contacts')}
                                                className="h-10 w-full gap-2 rounded-lg border-warning/30 text-xs font-semibold text-warning hover:bg-warning/10"
                                            >
                                                <Users className="w-3 h-3" />
                                                Ajustar Grupos
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(hasAlerts && pendingCount > 0) && <div className="h-px bg-border/50" />}

                            {/* SCHEDULED MESSAGES */}
                            {pendingCount > 0 && (
                                <button 
                                    onClick={() => openSheet('monitoring')}
                                    className="p-4 hover:bg-muted/50 transition-colors text-left group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-xl shrink-0">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-semibold text-muted-foreground">Agendamentos</p>
                                                <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                            <p className="text-xs font-bold text-foreground">
                                                {pendingCount} {pendingCount === 1 ? 'campanha pendente' : 'campanhas pendentes'}
                                            </p>
                                            <p className="text-xs italic text-muted-foreground">Clique para monitorar horários.</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}


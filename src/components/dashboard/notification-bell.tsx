"use client";

import { useAppStore } from "@/lib/store";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationBell() {
    const { isSending, totalContacts, sentCount, failedCount } = useAppStore((s) => s.sendingStatus);
    const groups = useAppStore((s) => s.groups);
    const getContactsByGroup = useAppStore((s) => s.getContactsByGroup);
    const { activeSchedules } = useScheduler();
    const { openSheet } = useGlobalSheet();
    const isHydrated = useHydrated();

    if (!isHydrated) return null;

    const emptyGroups = groups.filter(g => getContactsByGroup(g.id).length === 0);
    const emptyGroupsCount = emptyGroups.length;
    
    const isActive = isSending && totalContacts > 0;
    const pendingCount = activeSchedules.length;
    const hasAlerts = emptyGroupsCount > 0;
    
    const totalNotifications = (isActive ? 1 : 0) + (hasAlerts ? 1 : 0) + (pendingCount > 0 ? 1 : 0);

    return (
        <div className="fixed top-6 right-22 z-40">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-12 w-12 rounded-full bg-card/80 backdrop-blur-md border border-border shadow-xl hover:shadow-primary/20 hover:bg-card transition-all group relative overflow-visible"
                    >
                        <Bell className={cn(
                            "w-6 h-6 transition-colors",
                            isActive ? "text-primary" : hasAlerts ? "text-amber-500" : "text-muted-foreground group-hover:text-primary"
                        )} />

                        {/* Badges System */}
                        <AnimatePresence>
                            {isActive ? (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute -top-1 -right-1 flex h-4 min-w-[24px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-white shadow-lg shadow-primary/30"
                                >
                                    LIVE
                                </motion.span>
                            ) : hasAlerts ? (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 border-2 border-card text-[10px] font-bold text-white shadow-lg"
                                >
                                    !
                                </motion.span>
                            ) : pendingCount > 0 ? (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 border border-border text-[10px] font-bold text-white shadow-lg"
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
                    className="w-80 p-0 overflow-hidden bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-2xl"
                >
                    <div className="p-4 border-b border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                <Bell className="w-4 h-4 text-primary" />
                                Central de Alertas
                            </h3>
                            {totalNotifications > 0 && (
                                <span className="text-[10px] bg-primary/10 text-primary font-black px-1.5 py-0.5 rounded-full uppercase">
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
                                        onClick={() => openSheet('monitoring')}
                                        className="p-4 hover:bg-muted/50 transition-colors text-left group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="bg-primary/20 p-2 rounded-xl shrink-0">
                                                <Activity className="w-4 h-4 text-primary animate-pulse" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-black uppercase tracking-wider text-primary">Transmissão Ativa</p>
                                                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                                <p className="text-xs font-bold text-foreground">Disparando Mensagens...</p>
                                                <div className="w-full bg-muted rounded-full h-1 mt-2">
                                                    <motion.div 
                                                        className="bg-primary h-full rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${((sentCount + failedCount) / totalContacts) * 100}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground">{(sentCount + failedCount)} de {totalContacts} enviados</p>
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
                                                    <p className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-500">Atenção</p>
                                                    <p className="text-xs font-bold text-foreground mt-0.5">
                                                        {emptyGroupsCount} {emptyGroupsCount === 1 ? 'grupo está vazio' : 'grupos estão vazios'}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground leading-relaxed mt-1">
                                                        Grupos sem contatos não aparecem na lista de seleção do wizard.
                                                    </p>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => openSheet('contacts')}
                                                    className="w-full h-8 text-[10px] font-bold border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-900 dark:text-amber-400 gap-2 rounded-lg"
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
                                                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Agendamentos</p>
                                                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                                <p className="text-xs font-bold text-foreground">
                                                    {pendingCount} {pendingCount === 1 ? 'campanha pendente' : 'campanhas pendentes'}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground italic">Clique para monitorar horários.</p>
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}


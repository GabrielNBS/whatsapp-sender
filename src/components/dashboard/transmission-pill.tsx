"use client";

import { useAppStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronUp, ChevronDown, X, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

export function TransmissionPill() {
    const { isSending, sentCount, failedCount, totalContacts, statusMessage } =
        useAppStore((s) => s.sendingStatus);
    const [expanded, setExpanded] = useState(false);
    // Track which campaign was dismissed by its totalContacts; resets for new campaigns
    const [dismissedKey, setDismissedKey] = useState<number | null>(null);

    const isActive = isSending && totalContacts > 0;
    const processed = sentCount + failedCount;
    const percent = totalContacts > 0 ? Math.round((processed / totalContacts) * 100) : 0;
    const isDismissed = dismissedKey === totalContacts;

    const handleDismiss = useCallback(() => {
        setDismissedKey(totalContacts);
    }, [totalContacts]);

    if (!isActive || isDismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 60, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <div className={cn(
                    "bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300",
                    expanded ? "w-80" : "w-auto"
                )}>
                    {/* Compact Pill */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-3 px-4 py-3 w-full hover:bg-muted/50 transition-colors"
                    >
                        {/* Animated send icon */}
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: [0, -15, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                            >
                                <Send className="w-4 h-4 text-primary" />
                            </motion.div>
                            {/* Pulse ring */}
                            <motion.div
                                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-full border-2 border-primary/30"
                            />
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-2 text-sm font-bold">
                            <span className="text-primary tabular-nums">{processed}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground tabular-nums">{totalContacts}</span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary rounded-full"
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        <span className="text-xs font-bold text-primary tabular-nums">{percent}%</span>

                        {expanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        )}
                    </button>

                    {/* Expanded Detail Panel */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                                    {/* Full progress bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progresso</p>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {totalContacts - processed} restantes
                                            </p>
                                        </div>
                                        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full bg-linear-to-r from-primary to-primary/60"
                                                animate={{ width: `${percent}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>

                                    {/* Metrics grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                                            <Users className="w-3.5 h-3.5 mx-auto text-muted-foreground mb-1" />
                                            <p className="text-lg font-black tabular-nums">{totalContacts}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Total</p>
                                        </div>
                                        <div className="bg-success/5 rounded-xl p-2.5 text-center">
                                            <CheckCircle className="w-3.5 h-3.5 mx-auto text-success mb-1" />
                                            <p className="text-lg font-black tabular-nums text-success">{sentCount}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Enviados</p>
                                        </div>
                                        <div className="bg-destructive/5 rounded-xl p-2.5 text-center">
                                            <AlertTriangle className="w-3.5 h-3.5 mx-auto text-destructive mb-1" />
                                            <p className="text-lg font-black tabular-nums text-destructive">{failedCount}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Falhas</p>
                                        </div>
                                    </div>

                                    {/* Status message */}
                                    {statusMessage && (
                                        <p className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg text-center font-medium">
                                            {statusMessage}
                                        </p>
                                    )}

                                    {/* Dismiss */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
                                        className="w-full text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest py-1 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <X className="w-3 h-3" />
                                        Minimizar
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

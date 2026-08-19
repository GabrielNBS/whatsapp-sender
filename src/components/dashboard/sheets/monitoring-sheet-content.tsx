"use client";

import { useState, useEffect, useRef } from "react";
import { useTransmissionStore } from '@/stores/transmission-store';
import { useScheduler } from "@/hooks/use-scheduler";
import { useSender } from "@/hooks/use-sender";
import { useGlobalSheet } from "../global-sheet-provider";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Activity, 
    Calendar, 
    Clock, 
    Bell,
    Trash2,
    AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplitText } from "@/components/ui/split-text";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScheduleBatchSummary } from "@/lib/types";
import { getCampaignProgress } from '@/lib/campaign-progress';
import { formatScheduleDateTime } from '@/lib/date-formatters';
import { browserConfirmation, sonnerFeedback } from '@/presentation/feedback';

export function MonitoringSheetContent() {
    const sendingStatus = useTransmissionStore((state) => state.sendingStatus);
    const { activeSchedules, handleCancelSchedule } = useScheduler(sonnerFeedback);
    const { handleStop } = useSender(sonnerFeedback, browserConfirmation);
    const { sheetData } = useGlobalSheet();
    const [scheduleToDelete, setScheduleToDelete] = useState<ScheduleBatchSummary | null>(null);
    const [showStopConfirmation, setShowStopConfirmation] = useState(false);
    const batchElements = useRef(new Map<string, HTMLDivElement>());

    const focusedBatchId = sheetData?.focusedBatchId as string | undefined;

    useEffect(() => {
        if (focusedBatchId && activeSchedules.length > 0) {
            const timer = setTimeout(() => {
                const element = batchElements.current.get(focusedBatchId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [focusedBatchId, activeSchedules]);

    const isActive = sendingStatus.isSending && sendingStatus.totalContacts > 0;
    const { processed, percent } = getCampaignProgress(sendingStatus);

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="pb-6 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <SplitText 
                            text="Central de monitoramento"
                            as="h2" 
                            className="text-xl font-bold tracking-tight"
                        />
                        <p className="text-xs text-muted-foreground font-medium">
                            Acompanhe transmissões em tempo real e agendamentos
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-thin scrollbar-thumb-border">
                {/* 1. Ative Campaign Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Activity className="h-4 w-4 text-primary" />
                            Transmissão ativa
                        </h3>
                        {isActive && (
                            <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                                <span className="w-1 h-1 rounded-full bg-primary" />
                                Ao vivo
                            </span>
                        )}
                    </div>

                    {isActive ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 rounded-xl border border-primary/20 bg-card p-5 shadow-sm"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-base line-clamp-1">{sendingStatus.statusMessage || "Processando fila..."}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Iniciada agora mesmo
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold tracking-tight text-primary tabular-nums">{percent}%</p>
                                    <p className="text-xs font-medium text-muted-foreground">Concluído</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5">
                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
                                    <motion.div 
                                        className="h-full rounded-full bg-linear-to-r from-primary to-primary/60 shadow-[0_0_10px_rgba(37,211,102,0.3)]"
                                        animate={{ width: `${percent}%` }}
                                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                    />
                                </div>
                                <div className="flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
                                    <span className="tabular-nums">{processed} enviados</span>
                                    <span className="tabular-nums">{sendingStatus.totalContacts} total</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="bg-success/5 border border-success/10 rounded-xl p-3 flex items-center gap-3">
                                    <div className="w-2 h-8 rounded-full bg-success/20" />
                                    <div>
                                        <p className="text-lg font-bold tracking-tight text-success tabular-nums">{sendingStatus.sentCount}</p>
                                        <p className="text-xs font-medium text-success">Sucesso</p>
                                    </div>
                                </div>
                                <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-3 flex items-center gap-3">
                                    <div className="w-2 h-8 rounded-full bg-destructive/20" />
                                    <div>
                                        <p className="text-lg font-bold tracking-tight text-destructive tabular-nums">{sendingStatus.failedCount}</p>
                                        <p className="text-xs font-medium text-destructive">Falhas</p>
                                    </div>
                                </div>
                            </div>
                            
                            <Button 
                                variant="destructive" 
                                className="mt-2 h-10 w-full rounded-lg text-sm font-semibold"
                                onClick={() => setShowStopConfirmation(true)}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Interromper envio
                            </Button>
                        </motion.div>
                    ) : (
                        <div className="bg-muted/30 border border-dashed border-border rounded-2xl py-10 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground/50">
                                <Activity className="w-6 h-6 outline-hidden" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">Nenhuma transmissão ativa</p>
                            <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
                                Quando você iniciar um envio, o progresso aparecerá aqui em tempo real.
                            </p>
                        </div>
                    )}
                </section>

                {/* 2. Upcoming Schedules Section */}
                <section className="space-y-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        Próximos agendamentos ({activeSchedules.length})
                    </h3>

                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {activeSchedules.length > 0 ? (
                                activeSchedules.map((schedule, idx) => (
                                    <motion.div 
                                        key={schedule.batchId}
                                        ref={(element) => {
                                            if (element) batchElements.current.set(schedule.batchId, element);
                                            else batchElements.current.delete(schedule.batchId);
                                        }}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ 
                                            opacity: 1, 
                                            x: 0,
                                            scale: focusedBatchId === schedule.batchId ? [1, 1.02, 1] : 1,
                                        }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ 
                                            delay: idx * 0.05,
                                            scale: { duration: 0.5, ease: "easeOut" }
                                        }}
                                        className={`group relative overflow-hidden transition-all duration-500 border rounded-2xl p-4 flex items-center justify-between ${
                                            focusedBatchId === schedule.batchId 
                                                ? 'border-primary/40 bg-primary/3 shadow-lg shadow-primary/5' 
                                                : 'border-border bg-card/40 hover:bg-card/60'
                                        }`}
                                    >
                                        {/* Focused Accent Line */}
                                        {focusedBatchId === schedule.batchId && (
                                            <motion.div 
                                                layoutId="active-indicator"
                                                className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: '100%' }}
                                                transition={{ duration: 0.4 }}
                                            />
                                        )}

                                        <div className="flex items-center justify-between w-full gap-4">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                                                    focusedBatchId === schedule.batchId 
                                                        ? 'bg-primary/10 text-primary' 
                                                        : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary'
                                                }`}>
                                                    <Clock className="w-6 h-6" />
                                                </div>
                                                <div className="overflow-hidden space-y-0.5">
                                                    <p className={`font-bold text-sm truncate transition-colors ${
                                                        focusedBatchId === schedule.batchId ? 'text-primary' : 'text-foreground'
                                                    }`}>
                                                        {schedule.batchName || "Campanha Sem Nome"}
                                                    </p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                                                            focusedBatchId === schedule.batchId 
                                                                ? 'bg-primary/10 text-primary' 
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {schedule.count + (schedule.paused || 0)} leads
                                                        </span>
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            {formatScheduleDateTime(schedule.scheduledFor)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => setScheduleToDelete(schedule)}
                                                className="h-10 w-10 shrink-0 rounded-lg text-destructive hover:bg-destructive/10"
                                                aria-label={`Cancelar ${schedule.batchName || 'campanha agendada'}`}
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="bg-muted/20 border border-border rounded-2xl py-8 flex flex-col items-center justify-center text-center px-4">
                                    <p className="text-xs font-medium text-muted-foreground/60 italic">Nenhum agendamento pendente</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>
            </div>

            {/* Confirmation Modal */}
            <AlertDialog open={!!scheduleToDelete} onOpenChange={(open) => !open && setScheduleToDelete(null)}>
                <AlertDialogContent className="max-w-[400px] rounded-xl border-border bg-card shadow-lg">
                    <div className="flex flex-col items-center text-center pt-4">
                        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-7 h-7 text-destructive" />
                        </div>
                        <AlertDialogHeader className="space-y-3">
                            <AlertDialogTitle className="text-xl font-bold tracking-tight text-center">Cancelar agendamento?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed px-2">
                                Esta ação não pode ser desfeita. A campanha <br/>
                                <strong className="text-foreground font-bold text-base">&quot;{scheduleToDelete?.batchName}&quot;</strong> <br/>
                                com <strong className="text-primary font-bold">{scheduleToDelete?.count} contatos</strong> será permanentemente removida da fila.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-center! sm:justify-center! w-full px-2">
                        <AlertDialogCancel className="w-full sm:w-auto min-w-[120px] rounded-xl font-bold border-border hover:bg-muted transition-all">
                            Voltar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                if (scheduleToDelete) {
                                    handleCancelSchedule(scheduleToDelete.batchId);
                                    setScheduleToDelete(null);
                                }
                            }}
                            className="bg-destructive text-secondary hover:bg-destructive/90 w-full sm:w-auto min-w-[160px] rounded-xl font-bold shadow-lg shadow-destructive/20 transition-all"
                        >
                            Confirmar exclusão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Stop Active Campaign Confirmation */}
            <AlertDialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
                <AlertDialogContent className="max-w-[400px] rounded-xl border-border bg-card shadow-lg">
                    <div className="flex flex-col items-center text-center pt-4">
                        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-7 h-7 text-destructive" />
                        </div>
                        <AlertDialogHeader className="space-y-3">
                            <AlertDialogTitle className="text-center text-xl font-bold tracking-tight">Interromper envio?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed px-2">
                                Tem certeza que deseja parar o processo agora?
                                Alguns contatos da sua lista podem não receber a mensagem. O progresso ficará pausado.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-center! sm:justify-center! w-full px-2">
                        <AlertDialogCancel className="w-full sm:w-auto min-w-[120px] rounded-xl font-semibold border-border/50">
                            Continuar enviando
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                handleStop();
                                setShowStopConfirmation(false);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto min-w-[160px] rounded-xl font-bold"
                        >
                            Sim, parar agora
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Footer / Quick Actions */}
            <div className="p-4 border-t border-border bg-card/30">
                <p className="text-center text-xs text-muted-foreground">
                    O sistema processa agendamentos a cada 60 segundos
                </p>
            </div>
        </div>
    );
}

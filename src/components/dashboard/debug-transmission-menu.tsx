"use client";

import { useTransmissionStore } from '@/stores/transmission-store';
import { Button } from "@/components/ui/button";
import { 
    Activity, 
    CheckCircle2, 
    AlertTriangle, 
    Pause, 
    RefreshCcw, 
    LayoutDashboard,
    Clock
} from "lucide-react";
import { useState } from "react";
import { useDebugSimulationStore } from '@/stores/debug-simulation-store';

type SendingStatusPatch = Partial<ReturnType<typeof useTransmissionStore.getState>["sendingStatus"]>;

export function DebugTransmissionMenu() {
    const { setSendingStatus } = useTransmissionStore();
    const applySimulation = useDebugSimulationStore((state) => state.apply);
    const [isVisible, setIsVisible] = useState(true);

    const goToStep = (step: number) => {
        applySimulation({ step });
    };

    const setStatus = (status: SendingStatusPatch, step: number = 3, forceScreen: string | null = null) => {
        setSendingStatus(status);
        applySimulation({ step, forceScreen, scheduledOverlay: null });
    };

    if (!isVisible) {
        return (
            <Button 
                onClick={() => setIsVisible(true)}
                className="fixed bottom-6 left-6 z-[60] rounded-full w-10 h-10 p-0 shadow-2xl opacity-50 hover:opacity-100 bg-card/80 backdrop-blur-md border-border/50"
                variant="outline"
            >
                <Activity className="w-4 h-4" />
            </Button>
        );
    }

    return (
        <div className="fixed bottom-6 left-6 z-[60] bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 w-64 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Debug UI States
                </h3>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsVisible(false)}>
                    <RefreshCcw className="w-3 h-3" />
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start text-[10px] font-bold uppercase tracking-wider gap-2 h-9"
                    onClick={() => {
                        setStatus({ isSending: false, failedContacts: [] }, 0);
                    }}
                >
                    <LayoutDashboard className="w-3 h-3" />
                    Reset Flow (Step 0)
                </Button>

                <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((s) => (
                        <Button 
                            key={s}
                            variant="ghost" 
                            size="sm" 
                            className="text-[9px] font-bold uppercase border border-border/30 h-7"
                            onClick={() => goToStep(s)}
                        >
                            Step {s}
                        </Button>
                    ))}
                </div>

                <div className="h-px bg-border/50 my-1" />

                <div className="space-y-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-[10px] font-bold uppercase tracking-wider gap-2 bg-primary/5 border-primary/20 text-primary h-9"
                        onClick={() => {
                            setStatus({
                                isSending: true,
                                progress: 45,
                                totalContacts: 100,
                                sentCount: 45,
                                failedCount: 0,
                                statusMessage: "Enviando mensagens...",
                                isPaused: false
                            }, 3, 'sending');
                        }}
                    >
                        <Activity className="w-3 h-3" />
                        Sending UI [LOCK]
                    </Button>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-[10px] font-bold uppercase tracking-wider gap-2 bg-blue-500/5 border-blue-500/20 text-blue-600 h-9"
                        onClick={() => {
                            applySimulation({
                                step: 3,
                                forceScreen: 'scheduled',
                                scheduledOverlay: {
                                    batchId: 'debug-scheduled',
                                    batchName: "Campanha de Promoção",
                                    scheduledFor: new Date(Date.now() + 86400000).toISOString(),
                                    contactCount: 145,
                                },
                            });
                        }}
                    >
                        <Clock className="w-3 h-3" />
                        Scheduled UI [LOCK]
                    </Button>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-[10px] font-bold uppercase tracking-wider gap-2 bg-amber-500/5 border-amber-500/20 text-amber-600 h-9"
                        onClick={() => {
                            setStatus({
                                isSending: true,
                                isPaused: true,
                                progress: 30,
                                totalContacts: 100,
                                sentCount: 30,
                                failedCount: 0,
                                statusMessage: "Campanha pausada"
                            }, 3, 'sending');
                        }}
                    >
                        <Pause className="w-3 h-3" />
                        Paused UI [LOCK]
                    </Button>
                </div>

                <div className="h-px bg-border/50 my-1" />

                <div className="grid grid-cols-1 gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-[10px] font-bold uppercase tracking-wider gap-2 bg-emerald-500/5 border-emerald-500/20 text-emerald-600 h-9"
                        onClick={() => {
                            setStatus({
                                isSending: false,
                                progress: 100,
                                totalContacts: 50,
                                sentCount: 50,
                                failedCount: 0,
                                failedContacts: [],
                                stoppedByUser: false,
                                statusMessage: "Concluído com sucesso"
                            }, 3);
                        }}
                    >
                        <CheckCircle2 className="w-3 h-3" />
                        Success Report
                    </Button>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="justify-start text-[10px] font-bold uppercase tracking-wider gap-2 bg-destructive/5 border-destructive/20 text-destructive h-9"
                        onClick={() => {
                            setStatus({
                                isSending: false,
                                progress: 100,
                                totalContacts: 20,
                                sentCount: 15,
                                failedCount: 5,
                                failedContacts: [
                                    { name: "João Silva", number: "5511999999999" },
                                    { name: "Maria Oliveira", number: "5511888888888" },
                                    { name: "Carlos Souza", number: "5511777777777" }
                                ],
                                stoppedByUser: false,
                                statusMessage: "Concluído com erros"
                            }, 3);
                        }}
                    >
                        <AlertTriangle className="w-3 h-3" />
                        Error Report
                    </Button>
                </div>
            </div>
            
            <p className="text-[9px] text-muted-foreground text-center font-medium opacity-50">
                Simulador de Estados de UI
            </p>
        </div>
    );
}

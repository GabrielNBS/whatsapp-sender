'use client';

import { useHydrated } from '@/hooks/use-hydrated';
import { SendPageSkeleton } from '@/components/send/send-page-skeleton';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Template } from '@/lib/types';
import { nanoid } from 'nanoid';
import { StaleBatchDialog } from '@/components/send/stale-batch-dialog';
import { useScheduler } from '@/hooks/use-scheduler';
import { useSender } from '@/hooks/use-sender';
import { useSendForm } from '@/hooks/use-send-form';
import { useScheduleMessages } from '@/hooks/use-schedule-messages';
import {
    MessageSquare,
    Calendar,
    Bell,
    CheckCircle,
    Trash2,
    Users
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { Input } from "@/components/ui/input";

import { RecipientSelector } from '@/components/send/recipient-selector';
import { MessageEditor } from '@/components/send/message-editor';
import { StepIndicator } from '@/components/send/step-indicator';
import { WizardNavigation } from '@/components/send/wizard-navigation';
import { ActionPanel } from '@/components/send/action-panel';
import { WhatsAppMockup } from '@/components/dashboard/templates/whatsapp-mockup';
import { FileText } from 'lucide-react';

const STEPS = [
  { id: 1, label: "Destinatários", icon: Users },
  { id: 2, label: "Conteúdo", icon: MessageSquare },
  { id: 3, label: "Revisão", icon: Calendar },
];

export default function SendPage() {
    const {
        groups: storeGroups,
        contacts: storeContacts,
        getContactsByGroup: storeGetContacts,
        logs,
        addLog: storeAddLog,
        cleanupLogs,
        clearLogs,
        sendingStatus,
        setSendingStatus
    } = useAppStore();

    useEffect(() => {
        const interval = setInterval(() => {
            cleanupLogs();
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [cleanupLogs]);

    const {
        activeSchedules,
        staleBatch,
        fetchSchedules,
        handleCancelSchedule,
        handleConfirmStale
    } = useScheduler();

    const { handleSend, handleStop } = useSender();

    const [showStopConfirmation, setShowStopConfirmation] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);

    const [currentStep, setCurrentStep] = useState(1);
    
    const hydrated = useHydrated();

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch('/api/templates');
                if (res.ok) {
                    const data = await res.json();
                    setTemplates(data);
                }
            } catch (error) {
                console.error("Falha ao buscar modelos", error);
            }
        };

        fetchTemplates();
    }, []);

    const groups = storeGroups;
    const contacts = storeContacts;
    const getContactsByGroup = storeGetContacts;

    const isSending = sendingStatus.isSending;

    const {
        recipientConfig,
        message,
        selectedFile,
        isScheduleMode,
        scheduleDate,
        selectedTemplateId,
        recipients,
        estimatedTime,
        setRecipientConfig,
        setMessage,
        setSelectedFile,
        setIsScheduleMode,
        setScheduleDate,
        handleTemplateSelect,
        resetForm,
    } = useSendForm({
        groups,
        contacts,
        getContactsByGroup,
        templates,
    });

    const addLog = (logMessage: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        storeAddLog({
            id: nanoid(),
            message: logMessage,
            type,
            timestamp: new Date()
        });
    };

    // Handlers
    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleFinalAction();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };


    // Custom Hook for Scheduling
    const { mutate: scheduleMessages } = useScheduleMessages({
        onSuccess: () => {
             addLog('Agendamento realizado com sucesso!', 'success');
             toast.success("Agendamento realizado com sucesso!");
             resetForm();
             fetchSchedules();
             setCurrentStep(1); // Reset wizard
             // Clear loading state in store if needed, though hook handles its own loading
             setSendingStatus({ isSending: false, statusMessage: null });
        },
        onError: (error) => {
            addLog('Erro ao agendar: ' + error.message, 'error');
            toast.error("Erro ao agendar envio.");
             setSendingStatus({ isSending: false, statusMessage: null });
        }
    });

    const handleSchedule = async () => {
        if (!scheduleDate) {
            toast.error("Selecione uma data para agendar.");
            return;
        }
        
        // Update store state to reflect global loading/busy state if desired
        setSendingStatus({ isSending: true, statusMessage: 'Agendando envio...' });

        await scheduleMessages({
            recipients: recipients,
            message,
            media: selectedFile,
            scheduledFor: scheduleDate,
            batchName: recipientConfig.type === 'contact'
                ? `Envio para ${recipientConfig.name}`
                : `Campanha para ${recipients.length} contatos`,
            templateId: selectedTemplateId || ''
        });
    };

    const handleFinalAction = async () => {
        if (recipients.length === 0) {
            toast.error("Nenhum destinatário encontrado.");
            return;
        }
        
        if (isScheduleMode) {
            await handleSchedule();
        } else {
            const started = await handleSend(recipients, message, selectedFile);
            if (started) {
                setMessage('');
                setSelectedFile(null);
                setCurrentStep(1); // Reset wizard
            }
        }
    };

    // Validation
    const isNextDisabled = () => {
        if (currentStep === 1) {
            return recipients.length === 0;
        }
        if (currentStep === 2) {
            return !message && !selectedFile;
        }
        if (currentStep === 3) {
            if (isScheduleMode && !scheduleDate) return true;
            return false;
        }
        return false;
    };

    // Formatting Helpers
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (!hydrated) {
        return <SendPageSkeleton />;
    }

    const recentLogs = logs.slice(0, 50);

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-muted/30 -m-6 p-6 overflow-hidden">

            <StaleBatchDialog
                staleBatch={staleBatch}
                onAction={handleConfirmStale}
            />

            {/* Header Compact */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Nova Campanha</h1>
                    <p className="text-muted-foreground text-xs">Command Center</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-card px-3 py-1.5 rounded-full text-xs font-medium border border-border shadow-sm text-foreground">
                        <CheckCircle className="w-3.5 h-3.5 mr-2 text-success" />
                        Sistema Operacional
                    </div>
                </div>
            </div>

            {/* Main Grid Content */}
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">

                {/* WIZARD CONTAINER (Left + Center merged) */}
                <div className="col-span-12 lg:col-span-9 flex flex-col min-h-0">
                    <div className="bg-card rounded-xl shadow-lg border border-border flex flex-col h-full overflow-hidden relative">
                        
                        {/* Top Bar with Step Indicator */}
                        <div className="pt-6 pb-2 px-6 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
                            <StepIndicator currentStep={currentStep} steps={STEPS} />
                        </div>

                        {/* Content Area with Animation */}
                        <div className="flex-1 overflow-y-auto p-6 relative">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full flex flex-col"
                                >
                                    {/* STEP 1: RECIPIENTS */}
                                    {currentStep === 1 && (
                                        <div className="max-w-xl mx-auto w-full space-y-6">
                                            <div className="text-center space-y-2 mb-8">
                                                <h2 className="text-2xl font-bold tracking-tight">Quem receberá as mensagens?</h2>
                                                <p className="text-muted-foreground">Selecione um grupo ou contatos individuais.</p>
                                            </div>
                                            
                                            <RecipientSelector
                                                groups={groups}
                                                contacts={contacts}
                                                value={recipientConfig}
                                                onChange={setRecipientConfig}
                                                getContactsByGroup={getContactsByGroup}
                                                disabled={isSending}
                                            />

                                            {/* Summary of selection */}
                                            {recipients.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 p-2 rounded-full">
                                                            <Users className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm text-foreground">
                                                                {recipients.length} {recipients.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Tempo estimado: ~{Math.ceil((recipients.length * 15) / 60)} min
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 2: CONTENT */}
                                    {currentStep === 2 && (
                                        <div className="h-full flex flex-col">
                                            <div className="flex justify-between items-center mb-4 px-1">
                                                <div>
                                                    <h2 className="text-lg font-semibold">Conteúdo da Mensagem</h2>
                                                    <p className="text-xs text-muted-foreground">Personalize sua mensagem ou escolha um modelo.</p>
                                                </div>
                                                
                                                {/* Template Selector integrated in header */}
                                                <div className="flex items-center gap-2">
                                                    <Select value={selectedTemplateId || 'none'} onValueChange={handleTemplateSelect} disabled={isSending}>
                                                        <SelectTrigger animatedBorder className="w-[200px] h-9 text-xs font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-3.5 h-3.5" />
                                                                <SelectValue placeholder="Carregar Modelo" />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Nenhum (Limpar)</SelectItem>
                                                            {templates.map(t => (
                                                                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden shadow-inner">
                                                <MessageEditor
                                                    message={message}
                                                    onMessageChange={setMessage}
                                                    selectedFile={selectedFile}
                                                    onFileChange={setSelectedFile}
                                                    disabled={isSending}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: REVIEW & SCHEDULE */}
                                    {currentStep === 3 && (
                                        <div className="max-w-2xl mx-auto w-full space-y-6">
                                            <div className="text-center space-y-2 mb-6">
                                                <h2 className="text-2xl font-bold tracking-tight">Revisão Final</h2>
                                                <p className="text-muted-foreground">Confira os detalhes antes de iniciar o envio.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Summary Card */}
                                                <div className="space-y-4">
                                                    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                                                        <h3 className="font-medium text-sm border-b border-border pb-2">Resumo da Campanha</h3>
                                                        
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Destinatário:</span>
                                                                <span className="font-medium">{recipientConfig.name}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Total Contatos:</span>
                                                                <span className="font-medium">{recipients.length}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Estimativa:</span>
                                                                <span className="font-medium">~{estimatedTime} min</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Mídia Anexada:</span>
                                                                <span className="font-medium">{selectedFile ? 'Sim' : 'Não'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Schedule Config */}
                                                    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-primary" />
                                                                <h3 className="font-medium text-sm">Agendar Envio</h3>
                                                            </div>
                                                            <Switch checked={isScheduleMode} onCheckedChange={setIsScheduleMode} disabled={isSending} />
                                                        </div>
                                                        
                                                        {isScheduleMode && (
                                                            <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                                                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Data e Hora</label>
                                                                <Input
                                                                    type="datetime-local"
                                                                    value={scheduleDate}
                                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                                    className="h-9 text-sm"
                                                                    disabled={isSending}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Message Preview (Mini) */}
                                                {/* Message Preview (Reference Mockup) */}
                                                <div className="border border-border rounded-xl p-4 flex flex-col h-full bg-slate-50 dark:bg-zinc-950/50">
                                                    <h3 className="font-medium text-sm mb-3">Pré-visualização</h3>
                                                    <div className="flex-1 overflow-hidden relative transform scale-90 origin-top h-[500px]">
                                                        <WhatsAppMockup 
                                                            content={message} 
                                                            media={selectedFile} 
                                                            showFooter={false}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Bottom Navigation Bar */}
                        <div className="p-6 pt-2 bg-background/50 backdrop-blur-sm z-10">
                             <WizardNavigation
                                currentStep={currentStep}
                                totalSteps={STEPS.length}
                                onBack={handleBack}
                                onNext={handleNext}
                                isNextDisabled={isNextDisabled()}
                                isSending={isSending}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: LOGS (Span 3) - Kept as is for observability */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-hidden">
                    {/* Live Logs Panel - Fills remaining height */}
                    <div className="bg-card rounded-xl shadow-lg border border-border flex flex-col min-h-0 flex-1 overflow-hidden">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Bell className="w-3 h-3" />
                                Monitoramento
                            </h3>

                            <button onClick={clearLogs} className="text-xs text-primary hover:underline">
                                Limpar
                            </button>
                        </div>
                        
                        {/* Monitor Panel (ActionPanel without buttons) */}
                        <div className="p-4 border-b border-border bg-background/50">
                             <ActionPanel
                                recipientCount={recipients.length}
                                estimatedTime={estimatedTime}
                                recipientType={recipientConfig.type}
                                isSending={isSending}
                                isScheduleMode={isScheduleMode}
                                onAction={() => {}} // Not used here as buttons are hidden
                                onStop={handleStop}
                                showActionButtons={false}
                                sendProgress={isSending ? {
                                    current: sendingStatus.currentContactIndex,
                                    total: sendingStatus.totalContacts
                                } : undefined}
                            />
                        </div>

                        <div className="overflow-y-auto p-4 space-y-3 flex-1 scrollbar-thin scrollbar-thumb-border">
                            {/* Active Schedules first if any */}
                            {activeSchedules.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Agendamentos</p>
                                    {activeSchedules.map(schedule => (
                                        <div key={schedule.id} className="bg-foreground border border-info/20 rounded p-2 flex justify-between items-center">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-secondary truncate">{schedule.batchName}</p>
                                                <p className="text-[10px] text-muted-foreground">{new Date(schedule.scheduledFor).toLocaleString('pt-BR')}</p>
                                            </div>
                                            <button onClick={() => handleCancelSchedule(schedule.id)} className="text-secondary hover:text-destructive">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {recentLogs.length === 0 && !activeSchedules.length && (
                                <div className="text-center py-8 opacity-50 flex flex-col items-center justify-center h-full">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                                        <Bell className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Sistema pronto para envio</p>
                                </div>
                            )}

                            <AnimatePresence initial={false}>
                                {recentLogs.map((log) => (
                                    <motion.div 
                                        key={log.id} 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn("flex gap-3 items-start p-2 rounded-md transition-colors", log.type === 'success' ? "bg-success/10" :
                                        log.type === 'error' ? "bg-destructive/10" : "bg-muted/40")}
                                    >
                                        {/* Dot Icon */}
                                        <div className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                                            log.type === 'success' ? "bg-success" :
                                                log.type === 'error' ? "bg-destructive" : "bg-muted-foreground/60"
                                        )} />
                                        
                                        {/* Message */}
                                        <div className="min-w-0">
                                            <p className="text-xs text-foreground leading-snug wrap-break-word font-medium">{log.message}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">{formatTime(new Date(log.timestamp))}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        
                        {/* Progress Bar (Visible only when sending) -> Handled by ActionPanel above used as Monitor */}
                        {isSending && (
                             <div className="p-4 border-t border-border bg-background">
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="w-full h-8 text-xs font-semibold shadow-sm"
                                    onClick={() => setShowStopConfirmation(true)}
                                >
                                    Parar Envio
                                </Button>
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stop Confirmation Dialog */}
            <AlertDialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Parar Envio?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja interromper o envio em massa?
                            Isso irá parar o processo imediatamente e a lista ficará incompleta.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Continuar Enviando</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                handleStop();
                                setShowStopConfirmation(false);
                            }} 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Parar Envio
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


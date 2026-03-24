'use client';

import { useHydrated } from '@/hooks/use-hydrated';
import { SendPageSkeleton } from '@/components/send/send-page-skeleton';

import { useState, useEffect } from 'react';

import { AnimatedContent } from '@/components/ui/animated-content';
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
    Users
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

import { RecipientSelector } from '@/components/send/recipient-selector';
import { MessageEditor } from '@/components/send/message-editor';
import { StepIndicator } from '@/components/send/step-indicator';
import { WizardNavigation } from '@/components/send/wizard-navigation';


import { StatusPanel } from '@/components/send/status-panel';
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
        sendingStatus,
        setSendingStatus,
        logs,
        addLog: storeAddLog,
        cleanupLogs,
        clearLogs
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
        handleConfirmStale,
        handleCancelSchedule
    } = useScheduler();

    const { handleSend } = useSender();

    const [scheduledOverlayData, setScheduledOverlayData] = useState<{
        batchName: string;
        scheduledFor: string;
        contactCount: number;
    } | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isScheduling, setIsScheduling] = useState(false);

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isMonitoringPanelOpen, setMonitoringPanelOpen] = useState<boolean>(false);
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
             setIsScheduling(false);
        },
        onError: (error) => {
            addLog('Erro ao agendar: ' + error.message, 'error');
            toast.error("Erro ao agendar envio.");
            setIsScheduling(false);
        }
    });

    const handleSchedule = async () => {
        if (!scheduleDate) {
            toast.error("Selecione uma data para agendar.");
            return;
        }
        
        const batchNameStr = recipientConfig.type === 'contact'
            ? `Envio para ${recipientConfig.name}`
            : `Campanha para ${recipients.length} contatos`;

        await scheduleMessages({
            recipients: recipients,
            message,
            media: selectedFile,
            scheduledFor: scheduleDate,
            batchName: batchNameStr,
            templateId: selectedTemplateId || ''
        });

        fetchSchedules(); // Refresh the schedules list so the Bell icon updates
        setScheduledOverlayData({
            batchName: batchNameStr,
            scheduledFor: scheduleDate,
            contactCount: recipients.length
        });
        resetForm();
        setCurrentStep(1);
        setIsScheduling(false);
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
                resetForm();
                setCurrentStep(1);
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

    const handleNewTransmission = () => {
        resetForm();
        setCurrentStep(1);
        setRecipientConfig({ type: 'group', id: 'all', name: 'Todos os Contatos' });
        setScheduledOverlayData(null);
        clearLogs();
        setSendingStatus({ isSending: false, statusMessage: null, totalContacts: 0, currentContactIndex: 0, progress: 0, failedContacts: [], stoppedByUser: false });
    };

    // Remove periodic background updates for this component if no longer global

    if (!hydrated) {
        return <SendPageSkeleton />;
    }


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
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button 
                            onClick={() => setMonitoringPanelOpen(prev => !prev)}
                            className={cn(
                                "relative p-2 rounded-xl transition-all border shadow-sm group",
                                isMonitoringPanelOpen 
                                    ? "bg-primary border-primary text-primary-foreground" 
                                    : "bg-card border-border text-muted-foreground hover:border-primary/50"
                            )}
                        >
                            <Bell className={cn("w-4 h-4 transition-colors", isMonitoringPanelOpen ? "text-primary-foreground" : "group-hover:text-primary")} />
                            {logs.length > 0 && !isMonitoringPanelOpen && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-card" />
                            )}
                        </button>

                        {/* Floating Notification Popover */}
                        <AnimatePresence>
                            {isMonitoringPanelOpen && (
                                <>
                                    {/* Invisible backdrop for outside click */}
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setMonitoringPanelOpen(false)}
                                    />
                                    
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute right-0 top-full mt-3 z-50 w-[400px] max-w-[calc(100vw-2rem)] bg-card shadow-2xl rounded-2xl border border-border overflow-hidden"
                                    >
                                        <div className="max-h-[500px] overflow-y-auto">
                                            <StatusPanel
                                                activeSchedules={activeSchedules}
                                                isSending={isSending}
                                                isScheduleMode={isScheduleMode}
                                                estimatedTime={estimatedTime}
                                                progress={sendingStatus.progress}
                                                currentContactIndex={sendingStatus.currentContactIndex}
                                                totalRecipients={sendingStatus.totalContacts}
                                                statusMessage={sendingStatus.statusMessage}
                                                logs={logs}
                                                onCancelSchedule={handleCancelSchedule}
                                                onClearLogs={clearLogs}
                                            />
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center bg-card px-3 py-1.5 rounded-full text-xs font-medium border border-border shadow-sm text-foreground">
                        <CheckCircle className="w-3.5 h-3.5 mr-2 text-success" />
                        Sistema Operacional
                    </div>
                </div>
            </div>

            {/* Main Grid Content */}
            <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">

                {/* WIZARD CONTAINER */}
                <motion.div layout className="flex flex-col min-h-0 flex-1" transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
                    <div className="bg-card rounded-xl shadow-lg border border-border flex flex-col h-full overflow-hidden relative">
                        
                        {/* Top Bar with Step Indicator */}
                        <div className="pt-6 pb-2 px-6 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
                            <StepIndicator currentStep={currentStep} steps={STEPS} />
                        </div>

                        {/* Content Area with Animation */}
                        <div className="flex-1 overflow-y-auto p-6 relative">
                            <AnimatedContent activeKey={currentStep} spring="snappy" className="h-full flex flex-col">
                                    {/* STEP 1: RECIPIENTS */}
                                    {currentStep === 1 && (
                                        <div className="max-w-xl mx-auto w-full space-y-6">
                                            <div className="text-center space-y-2 mb-8">
                                                <h2 className="text-2xl font-bold tracking-tight">Quem receberá as mensagens?</h2>
                                                <p className="text-muted-foreground">Selecione um grupo ou contatos individuais.</p>
                                            </div>

                                            {activeSchedules.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                                                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm text-foreground">
                                                                {activeSchedules.length} {activeSchedules.length === 1 ? 'agendamento pendente' : 'agendamentos pendentes'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Clique aqui para ver a fila de envios programados.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                            
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
                                                        <SelectTrigger animatedBorder className="w-[200px] h-9 text-xs font-medium text-secondary bg-primary">
                                                            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="truncate"><SelectValue placeholder="Carregar Modelo" /></span>
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

                                                {/* WhatsApp Preview */}
                                                <div className="border border-border rounded-xl p-4 flex flex-col bg-slate-50 dark:bg-zinc-950/50" style={{ minHeight: 0 }}>
                                                    <h3 className="font-medium text-sm mb-3 shrink-0">Pré-visualização</h3>
                                                    <div className="flex-1 min-h-0" style={{ height: '360px' }}>
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
                            </AnimatedContent>
                        </div>

                        <div className="p-6 pt-2 bg-background/50 backdrop-blur-sm z-10">
                             <WizardNavigation
                                currentStep={currentStep}
                                totalSteps={STEPS.length}
                                onBack={handleBack}
                                onNext={handleNext}
                                isNextDisabled={isNextDisabled()}
                                isSending={isSending || isScheduling}
                            />
                        </div>

                        {/* Sending Overlay — covers wizard while transmitting */}
                        {/* Sending Overlay REMOVED - replaced by floating corner tooltip */}

                        {/* Completed Overlay — shown when send is done but User is viewing the final result */}
                        <AnimatePresence>
                            {!isSending && sendingStatus.totalContacts > 0 && !sendingStatus.statusMessage?.includes('Iniciando') && !isScheduling && (
                                <motion.div
                                    key="completed-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/97 backdrop-blur-sm p-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                        className="flex flex-col items-center gap-5 w-full max-w-sm text-center"
                                    >
                                        {/* Icon: 3 states */}
                                        {sendingStatus.stoppedByUser ? (
                                            // Stopped manually — gray/slate with pulse
                                            <motion.div 
                                                className="w-24 h-24 rounded-full flex items-center justify-center bg-slate-100 border-4 border-slate-200 shadow-inner"
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            >
                                                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                                                    <rect x="11" y="10" width="6" height="20" rx="3" fill="#64748b"/>
                                                    <rect x="23" y="10" width="6" height="20" rx="3" fill="#64748b"/>
                                                </svg>
                                            </motion.div>
                                        ) : sendingStatus.failedContacts.length === 0 ? (
                                            // Full success — green with check draw
                                            <motion.div 
                                                className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20" 
                                                style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            >
                                                <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12">
                                                    <motion.path 
                                                        d="M10 21 L16 27 L30 13" 
                                                        stroke="white" 
                                                        strokeWidth="4" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round"
                                                        initial={{ pathLength: 0 }}
                                                        animate={{ pathLength: 1 }}
                                                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                                                    />
                                                </svg>
                                            </motion.div>
                                        ) : (
                                            // Partial — amber with bounce exclamation
                                            <motion.div 
                                                className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20" 
                                                style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            >
                                                <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12">
                                                    <motion.path 
                                                        d="M20 10 L20 24" 
                                                        stroke="white" 
                                                        strokeWidth="4" 
                                                        strokeLinecap="round"
                                                        initial={{ pathLength: 0 }}
                                                        animate={{ pathLength: 1 }}
                                                        transition={{ duration: 0.4, delay: 0.2 }}
                                                    />
                                                    <motion.circle 
                                                        cx="20" cy="31" r="2.5" 
                                                        fill="white"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.5 }}
                                                    />
                                                </svg>
                                            </motion.div>
                                        )}

                                        {(() => {
                                            const sent = sendingStatus.sentCount;
                                            const failed = sendingStatus.failedCount;
                                            const total = sent + failed;
                                            const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

                                            const getHeaderColors = () => {
                                                if (sendingStatus.stoppedByUser) return { title: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-600' };
                                                if (failed === 0) return { title: 'text-gray-800', bg: 'bg-green-50', border: 'border-green-100', text: 'text-green-700' };
                                                return { title: 'text-gray-800', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' };
                                            };
                                            const colors = getHeaderColors();

                                            return (
                                                <div className="w-full space-y-5">
                                                    <div className="space-y-1">
                                                        <h3 className={`text-2xl font-extrabold ${colors.title}`}>
                                                            {sendingStatus.stoppedByUser ? 'Envio Interrompido' : failed === 0 ? 'Transmissão Concluída!' : 'Transmissão Parcial'}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {sendingStatus.stoppedByUser 
                                                                ? 'O envio foi parado manualmente pelo usuário.' 
                                                                : 'O processamento da lista de contatos chegou ao fim.'}
                                                        </p>
                                                    </div>

                                                    {/* Metrics Grid */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className={`flex flex-col items-center justify-center p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
                                                            <span className={`text-2xl font-bold ${colors.text}`}>{sent}</span>
                                                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mt-0.5">Entregues</span>
                                                        </div>
                                                        <div className={`flex flex-col items-center justify-center p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
                                                            <span className={`text-2xl font-bold ${sendingStatus.stoppedByUser ? colors.text : failed > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{failed}</span>
                                                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mt-0.5">Falhas</span>
                                                        </div>
                                                        <div className={`flex flex-col items-center justify-center p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
                                                            <span className={`text-2xl font-bold ${colors.text}`}>{successRate}%</span>
                                                            <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mt-0.5">Sucesso</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Failed contacts list */}
                                        {sendingStatus.failedContacts.length > 0 && (
                                            <div className="w-full">
                                                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">
                                                    {sendingStatus.failedContacts.length === 1 ? 'Número com problema' : 'Números com problema'}
                                                </p>
                                                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-border">
                                                    {sendingStatus.failedContacts.map((c, i) => (
                                                        <div key={i} className="flex items-center gap-2.5 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 text-left">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-semibold text-gray-800 truncate">{c.name}</p>
                                                                <p className="text-[10px] text-gray-500 font-mono">{c.number}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* CTA */}
                                        <button
                                            onClick={handleNewTransmission}
                                            className="w-full h-11 rounded-xl font-semibold text-sm text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                                            style={{
                                                background: sendingStatus.stoppedByUser
                                                    ? 'linear-gradient(135deg, #475569, #64748b)'
                                                    : 'linear-gradient(135deg, #16a34a, #4ade80)'
                                            }}
                                        >
                                            Nova Transmissão
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scheduled Overlay */}
                        <AnimatePresence>
                            {scheduledOverlayData && (
                                <motion.div
                                    key="scheduled-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/97 backdrop-blur-sm p-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                        className="flex flex-col items-center gap-5 w-full max-w-sm text-center"
                                    >
                                        <motion.div 
                                            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20" 
                                            style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        >
                                            <Calendar className="w-12 h-12 text-white" />
                                        </motion.div>

                                        <div className="w-full space-y-5">
                                            <div className="space-y-1">
                                                <h3 className="text-2xl font-extrabold text-blue-700">
                                                    Envio Agendado!
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Sua campanha foi programada com sucesso e será disparada automaticamente.
                                                </p>
                                            </div>

                                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left space-y-2">
                                                <p className="text-xs text-blue-800 font-semibold">{scheduledOverlayData.batchName}</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Horário</span>
                                                    <span className="text-xs text-blue-900">{new Date(scheduledOverlayData.scheduledFor).toLocaleString('pt-BR')}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Contatos</span>
                                                    <span className="text-xs text-blue-900">{scheduledOverlayData.contactCount}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleNewTransmission}
                                            className="w-full h-11 rounded-xl font-semibold text-sm text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                                            style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}
                                        >
                                            Nova Transmissão
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>


                {/* LOCAL MONITORING DRAWER - REMOVED for simplified popover */}
            </div>

        </div>
    );
}


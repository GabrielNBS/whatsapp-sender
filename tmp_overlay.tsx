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

import { WhatsAppMockup } from '@/components/dashboard/templates/whatsapp-mockup';
import { FileText } from 'lucide-react';

const STEPS = [
  { id: 1, label: "Destinat├írios", icon: Users },
  { id: 2, label: "Conte├║do", icon: MessageSquare },
  { id: 3, label: "Revis├úo", icon: Calendar },
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
    const [showMonitoringPanel, setShowMonitoringPanel] = useState(false);
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
            toast.error("Nenhum destinat├írio encontrado.");
            return;
        }
        
        if (isScheduleMode) {
            await handleSchedule();
        } else {
            const started = await handleSend(recipients, message, selectedFile);
            if (started) {
                resetForm();
                setCurrentStep(1);
                setShowMonitoringPanel(true);
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

    const handleNewTransmission = () => {
        resetForm();
        setCurrentStep(1);
        setRecipientConfig({ type: 'group', id: 'all', name: 'Todos os Contatos' });
        setShowMonitoringPanel(false);
        clearLogs();
        setSendingStatus({ isSending: false, statusMessage: null, totalContacts: 0, currentContactIndex: 0, progress: 0, failedContacts: [], stoppedByUser: false });
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
                                                <h2 className="text-2xl font-bold tracking-tight">Quem receber├í as mensagens?</h2>
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
                                                    <h2 className="text-lg font-semibold">Conte├║do da Mensagem</h2>
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
                                                <h2 className="text-2xl font-bold tracking-tight">Revis├úo Final</h2>
                                                <p className="text-muted-foreground">Confira os detalhes antes de iniciar o envio.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Summary Card */}
                                                <div className="space-y-4">
                                                    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                                                        <h3 className="font-medium text-sm border-b border-border pb-2">Resumo da Campanha</h3>
                                                        
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Destinat├írio:</span>
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
                                                                <span className="text-muted-foreground">M├¡dia Anexada:</span>
                                                                <span className="font-medium">{selectedFile ? 'Sim' : 'N├úo'}</span>
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
                                                    <h3 className="font-medium text-sm mb-3 shrink-0">Pr├®-visualiza├º├úo</h3>
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

                        {/* Sending Overlay ÔÇö covers wizard while transmitting */}
                        <AnimatePresence>
                            {isSending && (
                                <motion.div
                                    key="sending-overlay"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-8"
                                >
                                    <motion.div
                                        initial={{ scale: 0.85, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1, duration: 0.3 }}
                                        className="flex flex-col items-center gap-5 w-full max-w-sm text-center"
                                    >
                                        {/* SVG illustration */}
                                        <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-44 h-32">
                                            <rect x="20" y="20" width="80" height="140" rx="14" fill="#f0fdf4" stroke="#22c55e" strokeWidth="2.5"/>
                                            <rect x="30" y="38" width="60" height="104" rx="6" fill="#dcfce7"/>
                                            <circle cx="60" cy="152" r="6" fill="#bbf7d0" stroke="#22c55e" strokeWidth="1.5"/>
                                            <motion.g animate={{ x: [0, 8, 0], opacity: [1, 0.7, 1] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}>
                                                <rect x="110" y="55" width="70" height="28" rx="12" fill="#22c55e"/>
                                                <path d="M110 72 L102 80 L118 72" fill="#22c55e"/>
                                                <rect x="118" y="63" width="54" height="6" rx="3" fill="white" opacity="0.8"/>
                                                <rect x="118" y="73" width="36" height="4" rx="2" fill="white" opacity="0.5"/>
                                            </motion.g>
                                            <motion.g animate={{ x: [0, 10, 0], opacity: [0.8, 0.5, 0.8] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.3 }}>
                                                <rect x="115" y="100" width="58" height="24" rx="10" fill="#4ade80"/>
                                                <path d="M115 116 L107 123 L122 116" fill="#4ade80"/>
                                                <rect x="122" y="107" width="44" height="5" rx="2.5" fill="white" opacity="0.7"/>
                                                <rect x="122" y="115" width="28" height="3.5" rx="1.75" fill="white" opacity="0.45"/>
                                            </motion.g>
                                            <motion.g animate={{ x: [0, 6, 0], opacity: [0.6, 0.3, 0.6] }} transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut", delay: 0.7 }}>
                                                <rect x="120" y="136" width="46" height="20" rx="8" fill="#86efac"/>
                                                <path d="M120 150 L113 156 L127 150" fill="#86efac"/>
                                                <rect x="127" y="142" width="32" height="4" rx="2" fill="white" opacity="0.6"/>
                                                <rect x="127" y="149" width="20" height="3" rx="1.5" fill="white" opacity="0.4"/>
                                            </motion.g>
                                            <circle cx="195" cy="48" r="4" fill="#fbbf24" opacity="0.8"/>
                                            <circle cx="205" cy="90" r="2.5" fill="#34d399" opacity="0.7"/>
                                            <circle cx="198" cy="128" r="3" fill="#fbbf24" opacity="0.6"/>
                                        </svg>

                                        {/* Title + status */}
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-gray-800">Enviando mensagens...</h3>
                                            <p className="text-sm text-gray-500">
                                                {sendingStatus.statusMessage || 'Transmiss├úo em andamento. N├úo feche esta janela.'}
                                            </p>
                                        </div>

                                        {/* Big progress counter */}
                                        {sendingStatus.totalContacts > 0 && (
                                            <div className="w-full space-y-3">
                                                <div className="flex items-baseline justify-center gap-2">
                                                    <span className="text-5xl font-extrabold" style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                        {(sendingStatus.currentContactIndex ?? 0) + 1}
                                                    </span>
                                                    <span className="text-xl text-gray-400">/ {sendingStatus.totalContacts}</span>
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    {sendingStatus.totalContacts - ((sendingStatus.currentContactIndex ?? 0) + 1)} restantes
                                                </p>
                                                {/* Progress bar */}
                                                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80)' }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.round((((sendingStatus.currentContactIndex ?? 0) + 1) / sendingStatus.totalContacts) * 100)}%` }}
                                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Info grid: estimated time + safe delay + recipient type */}
                                        <div className="w-full grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Estimativa</p>
                                                <p className="text-sm font-semibold text-gray-700">~{estimatedTime} min</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Atraso</p>
                                                <p className="text-sm font-semibold text-green-600">Ativo Ô£ô</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Modo</p>
                                                <span className={cn(
                                                    "inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold",
                                                    recipientConfig.type === 'group'
                                                        ? "bg-blue-50 text-blue-700"
                                                        : "bg-green-50 text-green-700"
                                                )}>
                                                    {recipientConfig.type === 'group' ? 'GRUPO' : 'CONTATO'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Pulsing dots */}
                                        <div className="flex items-center gap-2">
                                            {[0, 0.2, 0.4].map((delay, i) => (
                                                <motion.span
                                                    key={i}
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                                                    transition={{ repeat: Infinity, duration: 1, delay, ease: 'easeInOut' }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Completed Overlay ÔÇö shown when send is done but monitoring panel is still visible */}
                        <AnimatePresence>
                            {!isSending && showMonitoringPanel && (
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
                                            // Stopped manually ÔÇö gray/slate
                                            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-slate-100 border-4 border-slate-200">
                                                <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
                                                    <rect x="11" y="11" width="7" height="18" rx="2" fill="#64748b"/>
                                                    <rect x="22" y="11" width="7" height="18" rx="2" fill="#64748b"/>
                                                </svg>
                                            </div>
                                        ) : sendingStatus.failedContacts.length === 0 ? (
                                            // Full success ÔÇö green
                                            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #4ade80)' }}>
                                                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                                                    <path d="M8 20 L17 29 L32 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                        ) : (
                                            // Partial ÔÇö amber
                                            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                                                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                                                    <path d="M20 12 L20 22" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                                                    <circle cx="20" cy="29" r="2" fill="white"/>
                                                </svg>
                                            </div>
                                        )}

                                        {/* Title + subtitle: 3 states + plural/singular */}
                                        {(() => {
                                            const sent = sendingStatus.totalContacts - sendingStatus.failedContacts.length;
                                            const failed = sendingStatus.failedContacts.length;
                                            const msgWord = (n: number) => n === 1 ? 'mensagem' : 'mensagens';
                                            if (sendingStatus.stoppedByUser) {
                                                return (
                                                    <div className="space-y-1">
                                                        <h3 className="text-2xl font-extrabold text-slate-700">Envio Interrompido</h3>
                                                        <p className="text-sm text-slate-500">
                                                            {sent === 0
                                                                ? 'Nenhuma mensagem foi enviada.'
                                                                : `${sent} ${msgWord(sent)} ${sent === 1 ? 'entregue' : 'entregues'} antes da parada.`
                                                            }
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            if (failed === 0) {
                                                return (
                                                    <div className="space-y-1">
                                                        <h3 className="text-2xl font-extrabold text-gray-800">Transmiss├úo Conclu├¡da!</h3>
                                                        <p className="text-sm text-gray-500">
                                                            {sendingStatus.totalContacts} {msgWord(sendingStatus.totalContacts)} {sendingStatus.totalContacts === 1 ? 'entregue' : 'entregues'} com sucesso.
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return (
                                                <div className="space-y-1">
                                                    <h3 className="text-2xl font-extrabold text-gray-800">Transmiss├úo Parcial</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {sent} {msgWord(sent)} {sent === 1 ? 'entregue' : 'entregues'}, {failed} com {failed === 1 ? 'falha' : 'falhas'}.
                                                    </p>
                                                </div>
                                            );
                                        })()}

                                        {/* Failed contacts list */}
                                        {sendingStatus.failedContacts.length > 0 && (
                                            <div className="w-full">
                                                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-2">
                                                    {sendingStatus.failedContacts.length === 1 ? 'N├║mero com problema' : 'N├║meros com problema'}
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
                                            Nova Transmiss├úo
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* RIGHT COL: LOGS ÔÇö slides in when sending starts, stays until new transmission */}
                <AnimatePresence initial={false}>
                {showMonitoringPanel && (
                <motion.div
                    key="monitoring-panel"
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    style={{ width: '300px', minWidth: '300px' }}
                    className="flex flex-col gap-4 min-h-0 overflow-hidden shrink-0">
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
                </motion.div>
                )}
                </AnimatePresence>
            </div>

            {/* Stop Confirmation Dialog */}
            <AlertDialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Parar Envio?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja interromper o envio em massa?
                            Isso ir├í parar o processo imediatamente e a lista ficar├í incompleta.
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


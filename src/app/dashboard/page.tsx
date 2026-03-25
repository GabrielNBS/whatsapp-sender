'use client';

import { useHydrated } from '@/hooks/use-hydrated';
import { SendPageSkeleton } from '@/components/send/send-page-skeleton';

import { useState, useEffect } from 'react';

import { AnimatedContent } from '@/components/ui/animated-content';
import { useAppStore } from '@/lib/store';
import { useGlobalSheet } from '@/components/dashboard/global-sheet-provider';
import { Template } from '@/lib/types';
import { nanoid } from 'nanoid';
import { StaleBatchDialog } from '@/components/send/stale-batch-dialog';
import { useScheduler } from '@/hooks/use-scheduler';
import { useSender } from '@/hooks/use-sender';
import { useSendForm } from '@/hooks/use-send-form';
import { useRealtimeMetrics } from '@/hooks/use-realtime-metrics';
import { useScheduleMessages } from '@/hooks/use-schedule-messages';
import {
    MessageSquare,
    Calendar,
    Bell,
    CheckCircle,
    Users,
    User,
    AlertTriangle,
    PlusCircle,
    Sparkles,
    ChevronRight,
    QrCode
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

import { RecipientSelector } from '@/components/send/recipient-selector';
import { MessageEditor } from '@/components/send/message-editor';
import { StepIndicator } from '@/components/send/step-indicator';
import { WizardNavigation } from '@/components/send/wizard-navigation';



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
        handleConfirmStale
    } = useScheduler();

    const { handleSend, handleStop } = useSender();

    const [showStopConfirmation, setShowStopConfirmation] = useState(false);
    const [scheduledOverlayData, setScheduledOverlayData] = useState<{
        batchName: string;
        scheduledFor: string;
        contactCount: number;
    } | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isScheduling, setIsScheduling] = useState(false);

    const [currentStep, setCurrentStep] = useState<number>(0);
    const hydrated = useHydrated();
    const { openSheet } = useGlobalSheet();
    const { metrics } = useRealtimeMetrics({ pollingInterval: 5000 });
    const isConnected = metrics?.connection.status === 'connected';

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
                // Moving to Step 4 for real-time tracking
                setCurrentStep(4);
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
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => openSheet('settings')}
                        className="w-10 h-10 rounded-full bg-linear-to-tr from-primary to-primary/60 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow"
                        title="Configurações (Nome da Empresa)"
                    >
                        <User className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Nova Campanha</h1>
                        <p className="text-muted-foreground text-xs">Command Center</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">

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
                        {currentStep > 0 && currentStep < 4 && (
                            <div className="pt-6 pb-2 px-6 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
                                <StepIndicator currentStep={currentStep} steps={STEPS} />
                            </div>
                        )}

                        {/* Content Area with Animation */}
                        <div className="flex-1 overflow-y-auto p-6 relative">
                            {/* WhatsApp Connection Alert (Global for wizard) */}
                            {currentStep > 0 && currentStep < 4 && !isConnected && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full shrink-0">
                                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-amber-900 dark:text-amber-400">WhatsApp Desconectado</p>
                                            <p className="text-xs text-amber-700 dark:text-amber-500">Conecte seu dispositivo nas configurações para habilitar os disparos.</p>
                                        </div>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        onClick={() => openSheet('settings')}
                                        className="bg-amber-600 hover:bg-amber-700 text-white border-none shrink-0"
                                    >
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Conectar Agora
                                    </Button>
                                </motion.div>
                            )}
                            
                            <AnimatedContent activeKey={currentStep} spring="snappy" className="h-full flex flex-col">
                                    {/* STEP 0: INTRO CTA */}
                                    {currentStep === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 py-12">
                                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                                <MessageSquare className="w-10 h-10 text-primary" />
                                            </div>
                                            <div className="space-y-4">
                                                <h2 className="text-4xl font-extrabold tracking-tight">Pronto para engajar sua base?</h2>
                                                <p className="text-lg text-muted-foreground leading-relaxed">
                                                    Crie campanhas personalizadas, selecione seus melhores contatos e alcance seu público de forma direta e eficiente. Tudo em poucos passos.
                                                </p>
                                            </div>
                                            
                                            <button 
                                                onClick={() => setCurrentStep(1)}
                                                className="mt-8 px-10 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3"
                                            >
                                                Começar Nova Campanha
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </button>

                                            {/* Business Persona Prompt */}
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                                className="pt-12 flex flex-col items-center gap-2"
                                            >
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Personalize sua experiência</p>
                                                <button 
                                                    onClick={() => openSheet('settings')}
                                                    className="flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                    Configurar perfil da minha empresa
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </motion.div>
                                        </div>
                                    )}

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
                                            
                                            {contacts.length === 0 ? (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="bg-card border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center text-center space-y-4"
                                                >
                                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Users className="w-8 h-8 text-primary" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-bold">Nenhum contato encontrado</h3>
                                                        <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                                                            Sua agenda está vazia. Adicione contatos ou importe uma planilha para começar.
                                                        </p>
                                                    </div>
                                                    <Button 
                                                        onClick={() => openSheet('contacts')}
                                                        className="bg-primary text-primary-foreground rounded-full px-8"
                                                    >
                                                        <PlusCircle className="w-4 h-4 mr-2" />
                                                        Gerenciar Contatos
                                                    </Button>
                                                </motion.div>
                                            ) : (
                                                <RecipientSelector
                                                    groups={groups}
                                                    contacts={contacts}
                                                    value={recipientConfig}
                                                    onChange={setRecipientConfig}
                                                    getContactsByGroup={getContactsByGroup}
                                                    disabled={isSending}
                                                />
                                            )}

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
                                                    {templates.length === 0 && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-9 border-dashed border-primary/50 text-primary hover:bg-primary/5 px-3 rounded-full animate-pulse"
                                                            onClick={() => openSheet('templates')}
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                                                            Criar Primeiro Modelo
                                                        </Button>
                                                    )}
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

                                    {/* STEP 4: REAL-TIME FEEDBACK (MISSION CONTROL) */}
                                    {currentStep === 4 && (
                                        <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full space-y-6 flex-1 h-full relative">
                                            
                                            <AnimatePresence mode="wait">
                                                {isSending ? (
                                                    <motion.div
                                                        key="sending-ui"
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 1.05 }}
                                                        className="flex flex-col items-center gap-6 w-full max-w-md text-center py-10"
                                                    >
                                                        {/* Animated SVG illustration */}
                                                        <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-36">
                                                            <rect x="20" y="20" width="80" height="140" rx="14" fill="var(--primary-foreground)" stroke="var(--primary)" strokeWidth="2.5" className="opacity-10"/>
                                                            <rect x="30" y="38" width="60" height="104" rx="6" fill="var(--primary)" className="opacity-5"/>
                                                            <circle cx="60" cy="152" r="6" fill="var(--primary)" stroke="var(--primary)" strokeWidth="1.5" className="opacity-20"/>
                                                            <motion.g animate={{ x: [0, 8, 0], opacity: [1, 0.7, 1] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}>
                                                                <rect x="110" y="55" width="70" height="28" rx="12" fill="var(--primary)"/>
                                                                <path d="M110 72 L102 80 L118 72" fill="var(--primary)"/>
                                                                <rect x="118" y="63" width="54" height="6" rx="3" fill="white" opacity="0.8"/>
                                                                <rect x="118" y="73" width="36" height="4" rx="2" fill="white" opacity="0.5"/>
                                                            </motion.g>
                                                            <motion.g animate={{ x: [0, 10, 0], opacity: [0.8, 0.5, 0.8] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.3 }}>
                                                                <rect x="115" y="100" width="58" height="24" rx="10" fill="var(--primary)" className="opacity-70"/>
                                                                <path d="M115 116 L107 123 L122 116" fill="var(--primary)" className="opacity-70"/>
                                                                <rect x="122" y="107" width="44" height="5" rx="2.5" fill="white" opacity="0.7"/>
                                                                <rect x="122" y="115" width="28" height="3.5" rx="1.75" fill="white" opacity="0.45"/>
                                                            </motion.g>
                                                            <motion.g animate={{ x: [0, 6, 0], opacity: [0.6, 0.3, 0.6] }} transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut", delay: 0.7 }}>
                                                                <rect x="120" y="136" width="46" height="20" rx="8" fill="var(--primary)" className="opacity-40"/>
                                                                <path d="M120 150 L113 156 L127 150" fill="var(--primary)" className="opacity-40"/>
                                                                <rect x="127" y="142" width="32" height="4" rx="2" fill="white" opacity="0.6"/>
                                                                <rect x="127" y="149" width="20" height="3" rx="1.5" fill="white" opacity="0.4"/>
                                                            </motion.g>
                                                            <circle cx="195" cy="48" r="4" fill="#fbbf24" opacity="0.8"/>
                                                            <circle cx="205" cy="90" r="2.5" fill="var(--primary)" opacity="0.7"/>
                                                            <circle cx="198" cy="128" r="3" fill="#fbbf24" opacity="0.6"/>
                                                        </svg>

                                                        {/* Title + status */}
                                                        <div className="space-y-1">
                                                            <h3 className="text-2xl font-bold text-foreground">Enviando mensagens...</h3>
                                                            <p className="text-sm text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full inline-block">
                                                                {sendingStatus.statusMessage || 'Transmissão em andamento. Não feche esta janela.'}
                                                            </p>
                                                        </div>

                                                        {/* Big progress counter */}
                                                        {sendingStatus.totalContacts > 0 && (
                                                            <div className="w-full space-y-4">
                                                                <div className="flex items-baseline justify-center gap-2">
                                                                    <span className="text-6xl font-black text-primary">
                                                                        {sendingStatus.sentCount + sendingStatus.failedCount}
                                                                    </span>
                                                                    <span className="text-2xl text-muted-foreground font-medium">/ {sendingStatus.totalContacts}</span>
                                                                </div>
                                                                
                                                                {/* Progress bar */}
                                                                <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner border border-border/50">
                                                                    <motion.div
                                                                        className="h-full rounded-full bg-linear-to-r from-primary to-primary/60"
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${Math.round(((sendingStatus.sentCount + sendingStatus.failedCount) / (sendingStatus.totalContacts || 1)) * 100)}%` }}
                                                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-muted-foreground font-medium">
                                                                    {sendingStatus.totalContacts - (sendingStatus.sentCount + sendingStatus.failedCount)} mensagens restantes
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Info grid */}
                                                        <div className="w-full grid grid-cols-3 gap-4 pt-6 border-t border-border">
                                                            <div className="text-center">
                                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Estimativa</p>
                                                                <p className="text-sm font-bold">~{estimatedTime} min</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Atraso</p>
                                                                <p className="text-sm font-bold text-success">Ativo ✓</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Modo</p>
                                                                <span className={cn(
                                                                    "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold",
                                                                    recipientConfig.type === 'group' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                )}>
                                                                    {recipientConfig.type === 'group' ? 'GRUPO' : 'CONTATO'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <Button 
                                                            variant="destructive" 
                                                            className="mt-4 w-full h-12 rounded-xl font-bold shadow-lg shadow-destructive/10"
                                                            onClick={() => setShowStopConfirmation(true)}
                                                        >
                                                            Parar Operação
                                                        </Button>
                                                    </motion.div>
                                                ) : (
                                                    // COMPLETED STATE (INLINE)
                                                    <motion.div
                                                        key="completed-ui"
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex flex-col items-center gap-6 w-full max-w-md text-center py-6"
                                                    >
                                                        {/* Icon: 3 states */}
                                                        {sendingStatus.stoppedByUser ? (
                                                            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-slate-100 border-4 border-slate-200">
                                                                <svg viewBox="0 0 40 40" fill="none" className="w-9 h-9">
                                                                    <rect x="11" y="11" width="7" height="18" rx="2" fill="#64748b"/>
                                                                    <rect x="22" y="11" width="7" height="18" rx="2" fill="#64748b"/>
                                                                </svg>
                                                            </div>
                                                        ) : sendingStatus.failedContacts.length === 0 ? (
                                                            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-success shadow-lg shadow-success/20">
                                                                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                                                                    <path d="M8 20 L17 29 L32 12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <div className="w-20 h-20 rounded-full flex items-center justify-center bg-amber-500 shadow-lg shadow-amber-500/20">
                                                                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
                                                                    <path d="M20 12 L20 22" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                                                                    <circle cx="20" cy="29" r="2" fill="white"/>
                                                                </svg>
                                                            </div>
                                                        )}

                                                        <div className="space-y-1">
                                                            <h3 className="text-3xl font-black tracking-tight text-foreground">
                                                                {sendingStatus.stoppedByUser ? 'Interrompido' : 'Concluído!'}
                                                            </h3>
                                                            {(() => {
                                                                const sent = sendingStatus.sentCount;
                                                                const failed = sendingStatus.failedCount;
                                                                return (
                                                                    <p className="text-muted-foreground font-medium">
                                                                        {sent} enviadas • {failed} falhas
                                                                    </p>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Detailed Metrics Panel */}
                                                        <div className="w-full grid grid-cols-2 gap-4">
                                                            <div className="bg-card border border-border p-4 rounded-2xl text-left">
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Taxa de Sucesso</p>
                                                                <p className="text-2xl font-black text-success">
                                                                    {Math.round((sendingStatus.sentCount / (sendingStatus.sentCount + sendingStatus.failedCount || 1)) * 100)}%
                                                                </p>
                                                            </div>
                                                            <div className="bg-card border border-border p-4 rounded-2xl text-left">
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total de Contatos</p>
                                                                <p className="text-2xl font-black text-foreground">{sendingStatus.totalContacts}</p>
                                                            </div>
                                                        </div>

                                                        {sendingStatus.failedContacts.length > 0 && (
                                                            <div className="w-full text-left bg-destructive/5 border border-destructive/10 rounded-2xl p-4">
                                                                <div className="flex items-center gap-2 mb-3 text-destructive">
                                                                    <Bell className="w-4 h-4" />
                                                                    <span className="text-xs font-bold uppercase tracking-wider">Erros Detectados</span>
                                                                </div>
                                                                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-destructive/20">
                                                                    {sendingStatus.failedContacts.map((c, i) => (
                                                                        <div key={i} className="flex justify-between items-center text-xs">
                                                                            <span className="font-semibold text-foreground/80">{c.name}</span>
                                                                            <span className="font-mono text-muted-foreground">{c.number}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <Button 
                                                            onClick={handleNewTransmission}
                                                            className="w-full h-14 rounded-2xl font-black text-base shadow-xl hover:shadow-2xl transition-all gap-2"
                                                        >
                                                            <MessageSquare className="w-5 h-5" />
                                                            NOVA CAMPANHA
                                                        </Button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Stop Confirmation Dialog */}
                                            <AlertDialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
                                                <AlertDialogContent className="rounded-2xl border-border/50 shadow-2xl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-xl font-bold">Interromper Envio?</AlertDialogTitle>
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
                                    )}
                            </AnimatedContent>
                        </div>

                        {currentStep > 0 && currentStep < 4 && (
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
                        )}


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


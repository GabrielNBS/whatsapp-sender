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
    Activity,
    Bell,
    Users,
    User,
    AlertTriangle,
    ChevronRight,
    QrCode,
    RefreshCw,
    Play,
    Plus,
    Eye
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedPaperPlane } from "@/components/ui/animated-paper-plane";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";

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
import { WizardStepper } from '@/components/send/wizard-stepper';
import { WizardNavigation } from '@/components/send/wizard-navigation';

import { WhatsAppMockup } from '@/components/dashboard/templates/whatsapp-mockup';

const STEPS = [
  { id: 1, label: "Público", icon: Users },
  { id: 2, label: "Mensagem", icon: MessageSquare },
];

const STEPS_NAV = [
  { id: 0, label: "Iniciar", icon: Play },
  { id: 1, label: "Público", icon: Users },
  { id: 2, label: "Mensagem", icon: MessageSquare },
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
        }, 60000);
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
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const words = ["Engajamento", "Negócio", "Posicionamento", "Alcance"];
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

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }, 10000);
        return () => clearInterval(interval);
    }, [words.length]);

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

    // Validation
    const canNavigateTo = (targetStep: number) => {
        if (targetStep <= currentStep) return true;
        if (targetStep === 1 && currentStep === 0) return true;
        if (targetStep === 2) return recipients.length > 0;
        if (targetStep === 3) return recipients.length > 0 && (message || selectedFile);
        return false;
    };

    const handleNext = () => {
        if (currentStep < 2) {
            if (canNavigateTo(currentStep + 1)) {
                setCurrentStep(prev => prev + 1);
            } else {
                if (currentStep === 1) toast.error("Selecione os destinatários antes de prosseguir.");
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const { mutate: scheduleMessages } = useScheduleMessages({
        onSuccess: () => {
             addLog('Agendamento realizado com sucesso!', 'success');
             toast.success("Agendamento realizado com sucesso!");
             resetForm();
             fetchSchedules();
             setCurrentStep(0);
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

        setIsScheduling(true);
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

        setScheduledOverlayData({
            batchName: batchNameStr,
            scheduledFor: scheduleDate,
            contactCount: recipients.length
        });
    };

    const handleSendAction = async () => {
        if (!canNavigateTo(3)) {
             toast.error("Preencha todos os campos obrigatórios.");
             return;
        }

        if (isScheduleMode) {
            await handleSchedule();
        } else {
            const started = await handleSend(recipients, message, selectedFile);
            if (started) {
                setCurrentStep(3);
            }
        }
    };

    const handleStepperClick = (navStepId: number) => {
        if (canNavigateTo(navStepId)) {
            setCurrentStep(navStepId);
        } else {
            if (navStepId === 1) toast.error("Comece a campanha primeiro.");
            if (navStepId === 2) toast.error("Selecione os destinatários primeiro.");
        }
    };

    const handleNewTransmission = () => {
        resetForm();
        setCurrentStep(0);
        setRecipientConfig({ type: 'group', id: 'all', name: 'Todos os Contatos' });
        setScheduledOverlayData(null);
        clearLogs();
        setSendingStatus({ isSending: false, statusMessage: null, totalContacts: 0, currentContactIndex: 0, progress: 0, failedContacts: [], stoppedByUser: false });
    };

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
                    >
                        <User className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">
                            {currentStep > 0 && currentStep < 3
                                ? STEPS_NAV.find(s => s.id === currentStep)?.label
                                : currentStep === 3 ? "Transmissão" : "Nova Campanha"}
                        </h1>
                        <p className="text-muted-foreground text-xs">
                            {currentStep > 0 && currentStep < 3
                                ? `Passo ${currentStep} de 2 • Nova Campanha`
                                : "Command Center"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Grid Content */}
            <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">

                <motion.div layout className="flex flex-col min-h-0 flex-1" transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
                    <div className="bg-card rounded-xl shadow-lg border border-border flex flex-col h-full overflow-hidden relative">

                        {currentStep < 3 && (
                            <WizardStepper
                                currentStep={currentStep}
                                steps={STEPS_NAV}
                                onStepClick={handleStepperClick}
                            />
                        )}

                        <div className="flex-1 overflow-hidden p-6 relative">
                            {currentStep > 0 && currentStep < 3 && !isConnected && (
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
                                            <p className="text-xs text-amber-700 dark:text-amber-500">Conecte seu dispositivo para habilitar os disparos.</p>
                                        </div>
                                    </div>
                                    <Button size="sm" onClick={() => openSheet('settings')} className="bg-amber-600">
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Conectar
                                    </Button>
                                </motion.div>
                            )}

                            <AnimatedContent activeKey={currentStep} spring="snappy" className="h-full flex flex-col">
                                    {/* STEP 0: INTRO */}
                                    {currentStep === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6 py-4 overflow-visible">
                                            <motion.div
                                                animate={{ 
                                                    scale: [1, 1.05, 1],
                                                    y: [0, -6, 0]
                                                }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                className="w-32 h-32 flex items-center justify-center -mb-4 overflow-visible relative"
                                            >
                                                <AnimatedPaperPlane className="w-full h-full" />
                                            </motion.div>
                                            <div className="space-y-2 overflow-visible">
                                                <h2 className="text-5xl font-black tracking-tighter flex flex-col items-center gap-0 mb-1">
                                                    <span className="bg-clip-text text-transparent bg-linear-to-r from-[#25D366] via-[#128C7E] to-[#075E54] animate-gradient-x">
                                                        Escale seu
                                                    </span>
                                                    <div className="h-[1.2em] relative w-full flex justify-center overflow-visible">
                                                        <AnimatePresence mode="wait">
                                                            <motion.div
                                                                key={currentWordIndex}
                                                                className="absolute flex items-center justify-center whitespace-nowrap"
                                                            >
                                                                {words[currentWordIndex].split('').map((char, i) => (
                                                                    <motion.span
                                                                        key={`${currentWordIndex}-${i}`}
                                                                        initial={{ opacity: 0, scale: 0.5, filter: "blur(8px)", y: 20 }}
                                                                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
                                                                        exit={{ 
                                                                            opacity: 0, 
                                                                            scale: 1.2,
                                                                            filter: "blur(15px)",
                                                                            x: (i % 2 === 0 ? 1 : -1) * (20 + i * 2),
                                                                            y: -40 - (i * 2),
                                                                            rotate: (i % 2 === 0 ? 1 : -1) * 20
                                                                        }}
                                                                        transition={{ 
                                                                            duration: 0.6, 
                                                                            delay: i * 0.02,
                                                                            ease: [0.4, 0, 0.2, 1]
                                                                        }}
                                                                        className="inline-block bg-clip-text text-transparent py-3 px-0.5 bg-linear-to-r from-[#25D366] via-[#128C7E] to-[#075E54] animate-gradient-x"
                                                                    >
                                                                        {char === ' ' ? '\u00A0' : char}
                                                                    </motion.span>
                                                                ))}
                                                            </motion.div>
                                                        </AnimatePresence>
                                                    </div>
                                                </h2>
                                                <p className="text-lg text-muted-foreground">
                                                    Campanhas <strong className='font-medium text-primary'>personalizadas</strong> e disparos <strong className='font-medium text-primary'>precisos</strong>. Comece agora a alcançar seu público de forma <strong className='font-medium text-primary'>profissional</strong>.
                                                </p>
                                            </div>
                                            <motion.button 
                                                onClick={() => setCurrentStep(1)}
                                                whileHover="hover"
                                                whileTap="tap"
                                                className="mt-8 px-10 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-full shadow-xl transition-all flex items-center gap-3 group"
                                            >
                                                Iniciar Campanha
                                                <motion.div
                                                    variants={{
                                                        hover: { x: 5 },
                                                        tap: { x: 2 }
                                                    }}
                                                >
                                                    <ChevronRight className="w-5 h-5 transition-transform" />
                                                </motion.div>
                                            </motion.button>

                                            {/* Method 4: Dashboard Status Card (Active/Scheduled) - Compacted */}
                                            {sendingStatus && (sendingStatus.isSending || activeSchedules.length > 0) && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="w-full mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-left max-w-3xl mx-auto"
                                                >
                                                    {sendingStatus.isSending && (
                                                        <button 
                                                            onClick={() => openSheet('monitoring')}
                                                            className="w-full sm:max-w-[300px] group bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl p-3 transition-all flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                                    <Activity className="w-5 h-5 animate-pulse" />
                                                                </div>
                                                                <div className="overflow-hidden leading-tight">
                                                                    <p className="text-[9px] font-black uppercase text-primary tracking-widest truncate">Live Now</p>
                                                                    <p className="text-xs font-bold text-foreground truncate">{sendingStatus.statusMessage || 'Enviando...'}</p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                                                            <motion.div 
                                                                                className="h-full bg-primary" 
                                                                                animate={{ width: `${Math.round(((sendingStatus.sentCount + sendingStatus.failedCount) / (sendingStatus.totalContacts || 1)) * 100)}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[9px] font-bold text-muted-foreground tabular-nums">
                                                                            {Math.round(((sendingStatus.sentCount + sendingStatus.failedCount) / (sendingStatus.totalContacts || 1)) * 100)}%
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-1" />
                                                        </button>
                                                    )}

                                                    {activeSchedules.length > 0 && (
                                                        <button 
                                                            onClick={() => openSheet('monitoring', { focusedBatchId: activeSchedules[0].batchId })}
                                                            className="w-full sm:max-w-[300px] group bg-card hover:bg-muted/50 border border-border rounded-xl p-3 transition-all flex items-center justify-between shadow-xs"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                                                                    <Calendar className="w-5 h-5" />
                                                                </div>
                                                                <div className="overflow-hidden leading-tight">
                                                                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest truncate">Agendamentos</p>
                                                                    <p className="text-xs font-bold text-foreground">
                                                                        {activeSchedules.length} {activeSchedules.length === 1 ? 'pendente' : 'pendentes'}
                                                                    </p>
                                                                    <p className="text-[9px] font-medium text-muted-foreground mt-0.5 whitespace-nowrap">
                                                                        Próximo: {new Date(activeSchedules[0].scheduledFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-1" />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 1: RECIPIENTS */}
                                    {currentStep === 1 && (
                                        <div className="max-w-xl mx-auto w-full space-y-6 pt-4">
                                            <div className="text-center space-y-2 mb-8">
                                                <h2 className="text-2xl font-bold">Para quem vamos enviar?</h2>
                                                <p className="text-muted-foreground">Escolha os contatos ou grupos que receberão a sua mensagem.</p>
                                            </div>
                                            
                                            <RecipientSelector
                                                groups={groups}
                                                contacts={contacts}
                                                value={recipientConfig}
                                                onChange={setRecipientConfig}
                                                getContactsByGroup={getContactsByGroup}
                                                disabled={isSending}
                                            />

                                            {recipients.length > 0 && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 p-2 rounded-full">
                                                            <Users className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <p className="font-bold text-sm">
                                                            {recipients.length} {recipients.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}

                                    {/* STEP 2: MERGED MESSAGE + PREVIEW */}
                                    {currentStep === 2 && (
                                        <div className="h-full flex flex-col overflow-hidden">
                                            <div className="flex flex-col lg:flex-row gap-10 flex-1 min-h-0 pt-2">
                                                <div className="flex-1 flex flex-col min-h-0 overflow-visible">
                                                    <div className="mb-6 space-y-1">
                                                        <h2 className="text-3xl font-black tracking-tight">Crie sua Mensagem</h2>
                                                        <p className="text-sm text-muted-foreground font-medium italic">Selecione um modelo ou escreva manualmente.</p>
                                                    </div>

                                                    {/* Template Selector (Select dropdown) */}
                                                    <div className="mb-6 flex items-center gap-4">
                                                        <Select onValueChange={handleTemplateSelect} disabled={isSending}>
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ 
                                                                    opacity: 1, 
                                                                    y: 0,
                                                                    transition: { delay: 0.1 } 
                                                                }}
                                                                whileHover="hover"
                                                                whileTap="tap"
                                                                className="relative inline-block"
                                                            >
                                                                <SelectTrigger 
                                                                    animatedBorder 
                                                                    className="max-w-[260px] h-10 rounded-full bg-neutral-950 text-white border-transparent hover:bg-neutral-900 transition-all text-sm font-bold shadow-2xl px-4 gap-3 relative overflow-hidden group justify-start"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-lg pointer-events-none">🪄</span>
                                                                        <SelectValue placeholder="Usar Modelo" />
                                                                    </div>
                                                                </SelectTrigger>
                                                            </motion.div>
                                                            <SelectContent>
                                                                <SelectItem value="none">Nenhum modelo</SelectItem>
                                                                {templates.length === 0 ? (
                                                                    <SelectItem value="__empty__" disabled>Nenhum modelo disponível</SelectItem>
                                                                ) : (
                                                                    templates.map(template => (
                                                                        <SelectItem key={template.id} value={template.id}>
                                                                            {template.title}
                                                                        </SelectItem>
                                                                    ))
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => openSheet('templates')}
                                                            className="h-10 rounded-full px-4 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-2 group"
                                                        >
                                                            <div className="bg-muted group-hover:bg-primary/10 p-1 rounded-full transition-colors">
                                                                <Plus className="w-3 h-3 transition-transform group-hover:rotate-90" />
                                                            </div>
                                                            Criar modelo
                                                        </Button>
                                                    </div>

                                                    {/* Message Editor */}
                                                    <div className="flex-1 min-h-0">
                                                        <MessageEditor
                                                            message={message}
                                                            onMessageChange={setMessage}
                                                            selectedFile={selectedFile}
                                                            onFileChange={setSelectedFile}
                                                            disabled={isSending}
                                                        />
                                                    </div>

                                                    <div className="mt-4 p-4 bg-muted/20 border border-border/50 rounded-[24px] space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-primary/10 p-2 rounded-full">
                                                                    <Users className="w-5 h-5 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold">{recipients.length} contatos alvo</p>
                                                                    <p className="text-[10px] text-muted-foreground uppercase font-black">Público Selecionado</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3 bg-background px-4 py-2 rounded-full border border-border/50">
                                                                <span className="text-xs font-bold text-muted-foreground">Agendar?</span>
                                                                <Switch checked={isScheduleMode} onCheckedChange={setIsScheduleMode} disabled={isSending} />
                                                            </div>
                                                        </div>
                                                        
                                                        {isScheduleMode && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 border-t border-border/50">
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">Data e Horário</p>
                                                                <Input type="datetime-local" className="rounded-xl" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} disabled={isSending} />
                                                            </motion.div>
                                                        )}
                                                    </div>

                                                    {/* Mobile Preview Button */}
                                                    <div className="mt-4 lg:hidden">
                                                        <Sheet>
                                                            <SheetTrigger asChild>
                                                                <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 flex items-center justify-center gap-2 font-bold text-muted-foreground hover:text-foreground bg-background">
                                                                    <Eye className="w-5 h-5" />
                                                                    Ver Preview da Mensagem
                                                                </Button>
                                                            </SheetTrigger>
                                                            <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col items-center overflow-hidden rounded-t-3xl border-t border-border bg-[#ece5dd] dark:bg-[#0b141a]">
                                                                <div className="sr-only">
                                                                    <SheetTitle>Preview do WhatsApp</SheetTitle>
                                                                    <SheetDescription>Visualize como sua mensagem aparecerá na tela do celular</SheetDescription>
                                                                </div>
                                                                <div className="w-full h-full flex flex-col p-6 items-center overflow-y-auto">
                                                                    <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mb-6 shrink-0" />
                                                                    <WhatsAppMockup content={message} media={selectedFile} />
                                                                </div>
                                                            </SheetContent>
                                                        </Sheet>
                                                    </div>
                                                </div>

                                                <div className="hidden lg:flex flex-col w-[340px] shrink-0">
                                                    <div className="flex items-center gap-2 mb-4 px-1">
                                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-widest">Preview em Tempo Real</span>
                                                    </div>
                                                    <div className="flex-1 min-h-0 flex items-start justify-center">
                                                        <WhatsAppMockup content={message} media={selectedFile} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-center mt-6 mb-4 shrink-0 relative z-10">
                                                <Button
                                                    onClick={handleSendAction}
                                                    disabled={isSending || isScheduling || (!message && !selectedFile)}
                                                    asChild
                                                    className={cn(
                                                        "h-14 px-12 rounded-full font-black text-lg shadow-xl transition-all text-white border-none group",
                                                        (isSending || isScheduling || (!message && !selectedFile)) ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer"
                                                    )}
                                                    style={{ 
                                                        background: (isSending || isScheduling || (!message && !selectedFile)) 
                                                            ? 'linear-gradient(135deg, #4b5563, #374151)' // Grayish gradient
                                                            : 'linear-gradient(135deg, #044950, #609000)' // Original green gradient
                                                    }}
                                                >
                                                    <motion.button
                                                        whileHover={!(isSending || isScheduling || (!message && !selectedFile)) ? "hover" : ""}
                                                        whileTap={!(isSending || isScheduling || (!message && !selectedFile)) ? "tap" : ""}
                                                    >
                                                        <span className="flex items-center gap-2 group-hover:gap-4 transition-all duration-300 uppercase">
                                                            {isSending || isScheduling ? (
                                                                <>
                                                                    <RefreshCw className="w-5 h-5 animate-spin mr-1" />
                                                                    {isScheduling ? 'AGENDANDO...' : 'ENVIANDO...'}
                                                                </>
                                                            ) : (
                                                                'REVISAR E ENVIAR'
                                                            )}
                                                            <motion.div variants={{ hover: { x: 4 } }}>
                                                                <ChevronRight className="w-5 h-5" />
                                                            </motion.div>
                                                        </span>
                                                    </motion.button>
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* STEP 3: REAL-TIME FEEDBACK */}
                                    {currentStep === 3 && (
                                        <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full space-y-6 h-full relative">
                                            
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
                                                                <p className="text-sm font-bold">~{Math.ceil((recipients.length * 15) / 60)} min</p>
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

                        {currentStep === 1 && (
                            <div className="p-6 pt-2 bg-background/50 backdrop-blur-sm z-10 border-t border-border/50">
                                 <WizardNavigation
                                    currentStep={currentStep}
                                    totalSteps={STEPS.length}
                                    onBack={handleBack}
                                    onNext={handleNext}
                                    isNextDisabled={!canNavigateTo(currentStep + 1)}
                                    isSending={isSending || isScheduling}
                                />
                            </div>
                        )}

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
            </div>
        </div>
    );
}

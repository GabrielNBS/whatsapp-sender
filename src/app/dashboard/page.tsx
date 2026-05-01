'use client';

import { useHydrated } from '@/hooks/use-hydrated';
import { SendPageSkeleton } from '@/components/send/send-page-skeleton';

import { useState, useEffect, Suspense } from 'react';
import GradientText from '@/components/ui/gradient-text';

import { AnimatedContent } from '@/components/ui/animated-content';
import { useAppStore } from '@/lib/store';
import { useGlobalSheet } from '@/components/dashboard/global-sheet-provider';
import { nanoid } from 'nanoid';
import { useScheduler } from '@/hooks/use-scheduler';
import { useSender } from '@/hooks/use-sender';
import { useSendForm } from '@/hooks/use-send-form';
import { useRealtimeMetrics } from '@/hooks/use-realtime-metrics';
import { useScheduleMessages } from '@/hooks/use-schedule-messages';
import { useRotatingIndex } from '@/hooks/use-rotating-index';
import { useSendPageInitialStep } from '@/hooks/use-send-page-initial-step';
import { useTemplateCatalog } from '@/hooks/use-template-catalog';
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
    Eye,
    Square
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
    return (
        <Suspense fallback={<SendPageSkeleton />}>
            <SendPageInner />
        </Suspense>
    );
}

function SendPageInner() {
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
        fetchSchedules,
    } = useScheduler();

    const { handleSend, handleStop } = useSender();

    const [showStopConfirmation, setShowStopConfirmation] = useState(false);
    const [scheduledOverlayData, setScheduledOverlayData] = useState<{
        batchName: string;
        scheduledFor: string;
        contactCount: number;
    } | null>(null);
    const [isScheduling, setIsScheduling] = useState(false);

    const initialStep = useSendPageInitialStep();
    const [currentStep, setCurrentStep] = useState<number>(initialStep);
    const words = ["Engajamento", "Negócio", "Posicionamento", "Alcance"];
    const currentWordIndex = useRotatingIndex(words.length, 10000);
    const templates = useTemplateCatalog();
    const hydrated = useHydrated();
    const { openSheet } = useGlobalSheet();
    const { metrics } = useRealtimeMetrics({ pollingInterval: 5000 });
    const isConnected = metrics?.connection.status === 'connected';

    const [debugForceScreen, setDebugForceScreen] = useState<string | null>(null);

    useEffect(() => {
        const handleGoToStep = (e: CustomEvent) => setCurrentStep(e.detail);
        const handleScheduledOverlay = (e: CustomEvent) => {
            if (e.detail) {
                setScheduledOverlayData(e.detail);
                setCurrentStep(3);
                if (e.detail.force) setDebugForceScreen('scheduled');
            } else {
                setScheduledOverlayData(null);
                setDebugForceScreen(null);
            }
        };

        const handleForceScreen = (e: CustomEvent) => {
            setDebugForceScreen(e.detail);
            if (e.detail) setCurrentStep(3);
        };

        window.addEventListener('go-to-step', handleGoToStep as EventListener);
        window.addEventListener('debug-scheduled-overlay', handleScheduledOverlay as EventListener);
        window.addEventListener('debug-force-screen', handleForceScreen as EventListener);
        return () => {
            window.removeEventListener('go-to-step', handleGoToStep as EventListener);
            window.removeEventListener('debug-scheduled-overlay', handleScheduledOverlay as EventListener);
            window.removeEventListener('debug-force-screen', handleForceScreen as EventListener);
        };
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
        setRecipientConfig,
        setMessage,
        setSelectedFile,
        setIsScheduleMode,
        setScheduleDate,
        handleTemplateSelect,
        resetForm,
    } = useSendForm({
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
            setCurrentStep(3);
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
        <div className="flex flex-col h-[calc(100vh-2rem)] -m-6 p-6 overflow-hidden">

            {/* Main Grid Content */}
            <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">

                <motion.div layout className="flex flex-col min-h-0 flex-1" transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
                    <div className="bg-card rounded-xl flex flex-col h-full pt-4 relative">

                        {currentStep < 3 && (
                            <WizardStepper
                                currentStep={currentStep}
                                steps={STEPS_NAV}
                                onStepClick={handleStepperClick}
                            />
                        )}

                        <div className="flex-1 overflow-hidden relative">
                            {currentStep > 0 && currentStep < 3 && !isConnected && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-amber-50 w-full max-w-xl mx-auto mt-4 dark:bg-amber-950/20 shadow-md shadow-amber-900/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
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
                                    <Button size="sm" onClick={() => openSheet('settings', { tab: 'connection' })} className="bg-amber-600">
                                        <QrCode className="w-4 h-4 mr-2" />
                                        Conectar
                                    </Button>
                                </motion.div>
                            )}

                            <AnimatedContent activeKey={currentStep} spring="snappy" className="h-full flex flex-col">
                                {/* STEP 0: INTRO */}
                                {currentStep === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 py-4 lg:py-8">
                                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-6 lg:mb-10 flex items-center justify-center">
                                            {[...Array(5)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="absolute inset-0 rounded-full border border-emerald-500/20 bg-emerald-500/5"
                                                    animate={{
                                                        scale: [1, 2.2],
                                                        opacity: [0, 0.3, 0]
                                                    }}
                                                    transition={{
                                                        duration: 5,
                                                        repeat: Infinity,
                                                        delay: i * 1,
                                                        ease: "linear"
                                                    }}
                                                />
                                            ))}
                                            <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full animate-pulse" />

                                            <motion.svg
                                                viewBox="0 0 100 100"
                                                className="w-24 h-24 rounded-full relative z-10"
                                                initial="initial"
                                                animate="animate"
                                            >
                                                <motion.path
                                                    d="M30 35 H70 C75 35 80 40 80 45 V65 C80 70 75 75 70 75 H45 L32 85 V75 C27 75 22 70 22 65 V45 C22 40 27 35 30 35Z"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.5"
                                                    className="text-primary"
                                                    variants={{
                                                        animate: { y: [0, -3, 0] }
                                                    }}
                                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                                />
                                                <motion.path d="M38 50 H62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/40" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
                                                <motion.path d="M38 60 H54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/40" animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />

                                                {[...Array(3)].map((_, i) => (
                                                    <motion.circle
                                                        key={i}
                                                        cx="50" cy="55" r="2"
                                                        className="text-success/60"
                                                        fill="currentColor"
                                                        variants={{
                                                            initial: { x: 0, y: 0, opacity: 0, scale: 0 },
                                                            animate: {
                                                                x: [0, 35 + i * 5],
                                                                y: [0, -25 + i * 15],
                                                                opacity: [0, 1, 0],
                                                                scale: [0, 1, 0.5]
                                                            }
                                                        }}
                                                        transition={{ repeat: Infinity, duration: 3, delay: i * 1, ease: "easeOut" }}
                                                    />
                                                ))}
                                                <motion.path
                                                    d="M82 40 C88 45 88 65 82 70"
                                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                                    className="text-primary/20"
                                                    animate={{ opacity: [0, 1, 0], x: [0, 5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 4 }}
                                                />
                                            </motion.svg>
                                        </div>
                                        <div className="space-y-4 lg:space-y-6">
                                            <h2 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-light tracking-tighter leading-[0.9] flex flex-col items-center">
                                                <GradientText
                                                    colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]}
                                                    animationSpeed={4}
                                                    className="text-2xl font-medium tracking-tight mb-2 opacity-80"
                                                >
                                                    Escale seu
                                                </GradientText>
                                                <div className="h-[1.1em] sm:h-[1.3em] relative w-full flex justify-center">
                                                    <AnimatePresence mode="wait">
                                                        <motion.div
                                                            key={currentWordIndex}
                                                            className="absolute flex items-center justify-center whitespace-nowrap"
                                                        >
                                                            {words[currentWordIndex].split('').map((char, i) => (
                                                                <motion.span
                                                                    key={`${currentWordIndex}-${i}`}
                                                                    initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                                                                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                                                    exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                                                                    transition={{
                                                                        duration: 0.4,
                                                                        delay: i * 0.02,
                                                                        ease: [0.4, 0, 0.2, 1]
                                                                    }}
                                                                    className="inline-block text-primary font-black py-2 px-px"
                                                                >
                                                                    {char === ' ' ? '\u00A0' : char}
                                                                </motion.span>
                                                            ))}
                                                        </motion.div>
                                                    </AnimatePresence>
                                                </div>
                                            </h2>
                                            <p className="text-base text-muted-foreground/70 leading-relaxed max-w-[380px] mx-auto font-medium">
                                                Campanhas <span className="text-foreground font-bold">personalizadas</span> e disparos <span className="text-foreground font-bold">precisos</span> e <span className="text-foreground font-bold">programados</span>.
                                                Alcance seu público de forma profissional.
                                            </p>
                                        </div>
                                        <motion.button
                                            onClick={() => setCurrentStep(1)}
                                            whileHover="hover"
                                            whileTap={{ scale: 0.98 }}
                                            className="cursor-pointer mt-4 lg:mt-10 px-8 sm:px-10 py-3.5 sm:py-4.5 bg-primary text-primary-foreground text-xs sm:text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-3"
                                        >
                                            Iniciar Campanha
                                            <motion.div
                                                variants={{ hover: { x: 5 } }}
                                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                            >
                                                <ChevronRight className="w-5 h-5" />
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
                                    <div className="max-w-xl mx-auto w-full space-y-6 pt-4 h-full overflow-y-auto no-scrollbar pb-10 px-2 lg:px-0">
                                        <div className="space-y-1 mb-10">
                                            <GradientText
                                                colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]}
                                                animationSpeed={6}
                                                className="text-[10px] font-black uppercase tracking-[0.2rem] opacity-60 mb-4"
                                            >
                                                Passo 01
                                            </GradientText>
                                            <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-light tracking-tighter leading-[1.05] mb-2">Para quem vamos <GradientText colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]} className="inline font-black text-foreground" showBorder={false}>enviar?</GradientText></h2>
                                            <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">Escolha os contatos ou grupos que receberão a mensagem.</p>
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
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-4 flex items-center gap-4 group"
                                            >
                                                <div className="bg-primary/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-500">
                                                    <Users className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-primary/50 leading-none mb-1">Público Ativo</p>
                                                    <p className="font-bold text-base text-foreground leading-none">
                                                        {recipients.length} {recipients.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* STEP 2: MERGED MESSAGE + PREVIEW */}
                                {currentStep === 2 && (
                                    <div className="h-full flex flex-col overflow-hidden pb-2">
                                        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 flex-1 min-h-0 pt-2">
                                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                                <div className="mb-6 lg:mb-10 space-y-1 [@media(max-height:1079px)]:hidden">
                                                    <GradientText
                                                        colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]}
                                                        animationSpeed={6}
                                                        className="text-[10px] font-black uppercase tracking-[0.2rem] opacity-60 mb-4"
                                                    >
                                                        Passo 02
                                                    </GradientText>
                                                    <h2 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-light tracking-tighter leading-[1.05] mb-2">Crie sua <GradientText colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]} className="inline font-black text-foreground">mensagem</GradientText></h2>
                                                    <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">Selecione um modelo ou escreva manualmente.</p>
                                                </div>

                                                {/* Message Editor */}
                                                <div className="flex-1 min-h-0">
                                                    <MessageEditor
                                                        message={message}
                                                        onMessageChange={setMessage}
                                                        selectedFile={selectedFile}
                                                        onFileChange={setSelectedFile}
                                                        disabled={isSending}
                                                        templateSlot={
                                                            <div className="flex items-center gap-1">
                                                                <Select onValueChange={handleTemplateSelect} disabled={isSending}>
                                                                    <SelectTrigger
                                                                        animatedBorder
                                                                        className="w-[160px] h-8 rounded-full bg-neutral-950 text-white border-transparent hover:bg-neutral-900 transition-all text-[11px] font-bold shadow-sm px-3 gap-2"
                                                                    >
                                                                        <span className="text-sm pointer-events-none">🪄</span>
                                                                        <SelectValue placeholder="Usar Modelo" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">Nenhum modelo</SelectItem>
                                                                        {templates.length === 0 ? (
                                                                            <SelectItem value="__empty__" disabled>Nenhum modelo</SelectItem>
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
                                                                    className="h-8 rounded-full px-2 text-[11px] font-bold text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                                                                >
                                                                    <Plus className="w-3 h-3 mr-1" /> Criar
                                                                </Button>
                                                            </div>
                                                        }
                                                    />
                                                </div>

                                                <div className="mt-4 p-4 bg-muted/20 border border-border/50 rounded-xl space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-primary/10 p-2 rounded-full">
                                                                <Users className="w-5 h-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">{recipients.length} {recipients.length === 1 ? 'contato' : 'contatos'} alvo</p>
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

                                                {/* Mobile/Laptop Preview Button */}
                                                <div className="mt-4 lg:hidden [@media(max-height:1079px)]:block">
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

                                            <div className="hidden lg:flex flex-col w-[340px] shrink-0 [@media(max-height:1079px)]:!hidden">
                                                <div className="flex items-center gap-2 mb-4 px-1">
                                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-widest">Preview em Tempo Real</span>
                                                </div>
                                                <div className="flex-1 min-h-0 flex items-start justify-center">
                                                    <WhatsAppMockup content={message} media={selectedFile} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-center mt-4 shrink-0 relative z-10">
                                            <Button
                                                onClick={handleSendAction}
                                                disabled={isSending || isScheduling || (!message && !selectedFile)}
                                                asChild
                                                className={cn(
                                                    "h-14 px-12 rounded-2xl font-black text-xs bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all gap-3 uppercase tracking-[0.2rem]",
                                                    (isSending || isScheduling || (!message && !selectedFile)) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                                )}
                                            >
                                                <motion.button
                                                    whileHover={!(isSending || isScheduling || (!message && !selectedFile)) ? "hover" : ""}
                                                    whileTap={!(isSending || isScheduling || (!message && !selectedFile)) ? "tap" : ""}
                                                >
                                                    <span className="flex items-center gap-3 transition-all">
                                                        {isSending || isScheduling ? (
                                                            <>
                                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                                <span>{isScheduling ? 'Agendando...' : 'Enviando...'}</span>
                                                            </>
                                                        ) : (
                                                            'Revisar e Enviar'
                                                        )}
                                                        <motion.div variants={{ hover: { x: 5 } }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
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
                                            {(debugForceScreen === 'sending' || (isSending && !debugForceScreen)) ? (
                                                <motion.div
                                                    key="sending-ui"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 1.05 }}
                                                    className="flex flex-col items-center gap-3 lg:gap-3 2xl:gap-6 w-full max-w-md text-center py-4 lg:py-4 2xl:py-10 h-full lg:h-full 2xl:h-full justify-center"
                                                >
                                                    {/* Animated SVG illustration */}
                                                    <div className="relative mb-2 lg:mb-2 2xl:mb-8 flex-1 flex items-center justify-center min-h-0 max-h-[30vh]">
                                                        <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                                                        <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-56 2xl:h-40 relative z-10 transition-all">
                                                            <rect x="20" y="20" width="80" height="140" rx="20" fill="currentColor" className="text-primary/10" stroke="currentColor" strokeWidth="2.5" />
                                                            <rect x="30" y="38" width="60" height="104" rx="8" fill="currentColor" className="text-primary/5" />
                                                            <circle cx="60" cy="152" r="6" fill="currentColor" className="text-primary/20" />

                                                            <motion.g animate={{ x: [0, 8, 0], opacity: [1, 0.7, 1] }} transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}>
                                                                <rect x="110" y="55" width="70" height="28" rx="14" fill="var(--primary)" />
                                                                <path d="M110 72 L102 80 L118 72" fill="var(--primary)" />
                                                                <rect x="118" y="63" width="54" height="6" rx="3" fill="white" opacity="0.8" />
                                                                <rect x="118" y="73" width="36" height="4" rx="2" fill="white" opacity="0.5" />
                                                            </motion.g>

                                                            <motion.g animate={{ x: [0, 10, 0], opacity: [0.8, 0.5, 0.8] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.3 }}>
                                                                <rect x="115" y="100" width="58" height="24" rx="12" fill="var(--primary)" className="opacity-70" />
                                                                <path d="M115 116 L107 123 L122 116" fill="var(--primary)" className="opacity-70" />
                                                                <rect x="122" y="107" width="44" height="5" rx="2.5" fill="white" opacity="0.7" />
                                                                <rect x="122" y="115" width="28" height="3.5" rx="1.75" fill="white" opacity="0.45" />
                                                            </motion.g>

                                                            <motion.g animate={{ x: [0, 6, 0], opacity: [0.6, 0.3, 0.6] }} transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut", delay: 0.7 }}>
                                                                <rect x="120" y="136" width="46" height="20" rx="10" fill="var(--primary)" className="opacity-40" />
                                                                <path d="M120 150 L113 156 L127 150" fill="var(--primary)" className="opacity-40" />
                                                                <rect x="127" y="142" width="32" height="4" rx="2" fill="white" opacity="0.6" />
                                                                <rect x="127" y="149" width="20" height="3" rx="1.5" fill="white" opacity="0.4" />
                                                            </motion.g>

                                                            <motion.circle cx="195" cy="48" r="4" fill="#fbbf24" animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ repeat: Infinity, duration: 2 }} />
                                                            <motion.circle cx="205" cy="90" r="2.5" fill="var(--primary)" animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
                                                            <motion.circle cx="198" cy="128" r="3" fill="#fbbf24" animate={{ opacity: [0.1, 0.6, 0.1] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} />
                                                        </svg>
                                                    </div>

                                                    {/* Title + status */}
                                                    <div className="space-y-2 lg:space-y-2 2xl:space-y-4 mb-4 lg:mb-4 2xl:mb-8">
                                                        <h3 className="text-[1.75rem] lg:text-[1.75rem] 2xl:text-[2.5rem] font-light tracking-tighter leading-[1.1]">
                                                            Enviando <GradientText className="font-black">mensagens...</GradientText>
                                                        </h3>
                                                        <div className="flex justify-center">
                                                            <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 bg-muted/20 border border-border/40 px-4 py-1.5 2xl:px-5 2xl:py-2 rounded-full backdrop-blur-md">
                                                                {sendingStatus.statusMessage || 'Transmissão em andamento. Não feche esta janela.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Big progress counter */}
                                                    {sendingStatus.totalContacts > 0 && (
                                                        <div className="w-full space-y-2 lg:space-y-2 2xl:space-y-4">
                                                            <div className="flex items-baseline justify-center gap-2">
                                                                <GradientText className="text-4xl lg:text-4xl 2xl:text-6xl font-black">
                                                                    {sendingStatus.sentCount + sendingStatus.failedCount}
                                                                </GradientText>
                                                                <span className="text-xl lg:text-xl 2xl:text-2xl text-muted-foreground font-medium">/ {sendingStatus.totalContacts}</span>
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
                                                    <div className="w-full grid grid-cols-3 gap-3 lg:gap-3 2xl:gap-4 pt-4 lg:pt-4 2xl:pt-6 border-t border-border">
                                                        <div className="text-center">
                                                            <p className="text-[8px] lg:text-[8px] 2xl:text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Estimativa</p>
                                                            <p className="text-xs lg:text-xs 2xl:text-sm font-bold">~{Math.ceil((recipients.length * 15) / 60)} min</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[8px] lg:text-[8px] 2xl:text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Atraso</p>
                                                            <p className="text-xs lg:text-xs 2xl:text-sm font-bold text-success">Ativo ✓</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[8px] lg:text-[8px] 2xl:text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Modo</p>
                                                            <span className={cn(
                                                                "inline-block px-2 py-0.5 rounded-full text-[9px] lg:text-[9px] 2xl:text-[10px] font-bold",
                                                                recipientConfig.type === 'group' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                            )}>
                                                                {recipientConfig.type === 'group' ? 'GRUPO' : 'CONTATO'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <motion.button
                                                        whileHover="hover"
                                                        whileTap={{ scale: 0.98 }}
                                                        className="mt-6 lg:mt-6 2xl:mt-10 w-full h-12 lg:h-12 2xl:h-14 rounded-2xl font-black text-[10px] lg:text-[10px] 2xl:text-xs bg-destructive text-destructive-foreground shadow-xl shadow-destructive/20 flex items-center justify-center gap-3 group transition-all tracking-[0.2em] uppercase"
                                                        onClick={() => setShowStopConfirmation(true)}
                                                    >
                                                        <motion.div
                                                            variants={{ hover: { rotate: 180, scale: 1.2 } }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                                        >
                                                            <Square className="w-4 h-4 fill-current" />
                                                        </motion.div>
                                                        Interromper Agora
                                                    </motion.button>
                                                </motion.div>
                                            ) : (debugForceScreen === 'scheduled' || (scheduledOverlayData && !debugForceScreen)) ? (
                                                <motion.div
                                                    key="scheduled-ui"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 1.05 }}
                                                    className="flex flex-col items-center w-full max-w-md text-center py-4 lg:py-4 2xl:py-6 h-full justify-center"
                                                >
                                                    {/* Scheduled SVG Illustration */}
                                                    <div className="relative mb-4 lg:mb-4 2xl:mb-8 flex-1 flex items-center justify-center min-h-0 max-h-[25vh]">
                                                        <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full" />
                                                        <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-48 2xl:h-40 relative z-10 transition-all">
                                                            <rect x="60" y="20" width="80" height="120" rx="20" fill="currentColor" className="text-blue-100 dark:text-blue-900/20" />
                                                            <rect x="72" y="38" width="56" height="84" rx="8" fill="currentColor" className="text-white dark:text-blue-950/40" />
                                                            <motion.g
                                                                initial={{ rotate: 0 }}
                                                                animate={{ rotate: 360 }}
                                                                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                                                                style={{ originX: '100px', originY: '77px' }}
                                                            >
                                                                <circle cx="100" cy="77" r="32" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 6" className="opacity-30" />
                                                                <circle cx="100" cy="45" r="3" fill="#3b82f6" />
                                                            </motion.g>
                                                            <motion.path
                                                                d="M100 62 L100 77 L112 77"
                                                                stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                                animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
                                                                style={{ originX: '100px', originY: '77px' }}
                                                            />
                                                            <circle cx="100" cy="77" r="2" fill="#3b82f6" />
                                                        </svg>
                                                    </div>

                                                    <div className="space-y-2 lg:space-y-2 2xl:space-y-4 mb-4 lg:mb-4 2xl:mb-8">
                                                        <h3 className="text-[1.75rem] lg:text-[1.75rem] 2xl:text-[2.5rem] font-light tracking-tighter leading-[1.1]">
                                                            Campanha <GradientText className="font-black" colors={['#3b82f6', '#60a5fa', '#2563eb']}>agendada!</GradientText>
                                                        </h3>
                                                        <div className="flex justify-center">
                                                            <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 bg-blue-500/5 border border-blue-500/10 px-4 py-1.5 2xl:px-5 2xl:py-2 rounded-full">
                                                                Tudo pronto para o disparo automático.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="w-full bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-4 lg:p-4 2xl:p-6 text-left space-y-4 lg:space-y-4 2xl:space-y-6 shadow-xs mb-6 lg:mb-6 2xl:mb-10">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">{scheduledOverlayData.batchName}</span>
                                                            <div className="h-[2px] w-12 bg-blue-500/30 rounded-full" />
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 lg:gap-4 2xl:gap-8">
                                                            <div className="space-y-1.5 lg:space-y-1.5 2xl:space-y-2">
                                                                <div className="flex items-center gap-2 text-blue-500/80">
                                                                    <Calendar className="w-3 h-3 lg:w-3 lg:h-3 2xl:w-3.5 2xl:h-3.5" />
                                                                    <span className="text-[8px] lg:text-[8px] 2xl:text-[9px] uppercase font-black tracking-widest">DATA E HORA</span>
                                                                </div>
                                                                <p className="text-xs lg:text-xs 2xl:text-sm font-black text-foreground tracking-tight">
                                                                    {new Date(scheduledOverlayData.scheduledFor).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1.5 lg:space-y-1.5 2xl:space-y-2">
                                                                <div className="flex items-center gap-2 text-blue-500/80">
                                                                    <Users className="w-3 h-3 lg:w-3 lg:h-3 2xl:w-3.5 2xl:h-3.5" />
                                                                    <span className="text-[8px] lg:text-[8px] 2xl:text-[9px] uppercase font-black tracking-widest">PÚBLICO</span>
                                                                </div>
                                                                <p className="text-xs lg:text-xs 2xl:text-sm font-black text-foreground tracking-tight">{scheduledOverlayData.contactCount} contatos</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <motion.button
                                                        whileHover="hover"
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleNewTransmission}
                                                        className="w-full h-12 lg:h-12 2xl:h-14 rounded-2xl font-black text-[10px] lg:text-[10px] 2xl:text-xs bg-primary text-primary-foreground shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group tracking-[0.2em] uppercase"
                                                    >
                                                        <span>NOVA TRANSMISSÃO</span>
                                                        <motion.div
                                                            variants={{ hover: { rotate: 90, scale: 1.2 } }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </motion.div>
                                                    </motion.button>
                                                </motion.div>
                                            ) : (
                                                // COMPLETED STATE (INLINE)
                                                <motion.div
                                                    key="completed-ui"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 1.05 }}
                                                    className="flex flex-col items-center gap-3 lg:gap-3 2xl:gap-6 w-full max-w-md text-center py-4 lg:py-4 2xl:py-6 h-full justify-center"
                                                >
                                                    {/* Status Illustration: Animated SVG based on final state */}
                                                    <div className="relative mb-2 lg:mb-2 2xl:mb-4 flex-1 flex items-center justify-center min-h-0 max-h-[25vh]">
                                                        {sendingStatus.stoppedByUser ? (
                                                            /* Interrupted Illustration */
                                                            <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-48 2xl:h-40 transition-all">
                                                                <rect x="60" y="20" width="80" height="120" rx="12" fill="currentColor" className="text-slate-200 dark:text-slate-800" />
                                                                <rect x="70" y="35" width="60" height="85" rx="4" fill="currentColor" className="text-slate-100 dark:text-slate-900" />
                                                                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                                                                    <rect x="85" y="60" width="8" height="30" rx="4" fill="#64748b" />
                                                                    <rect x="107" y="60" width="8" height="30" rx="4" fill="#64748b" />
                                                                </motion.g>
                                                                <circle cx="100" cy="130" r="4" fill="#64748b" opacity="0.3" />
                                                                <motion.circle
                                                                    cx="40" cy="80" r="6" fill="#64748b" opacity="0.2"
                                                                    animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                                                />
                                                                <motion.circle
                                                                    cx="160" cy="110" r="4" fill="#64748b" opacity="0.15"
                                                                    animate={{ y: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                                                                />
                                                            </svg>
                                                        ) : sendingStatus.failedContacts.length === 0 ? (
                                                            /* Success Illustration */
                                                            <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-48 2xl:h-40">
                                                                <rect x="60" y="20" width="80" height="120" rx="12" fill="currentColor" className="text-emerald-100 dark:text-emerald-900/30" />
                                                                <rect x="70" y="35" width="60" height="85" rx="4" fill="currentColor" className="text-emerald-50 dark:text-emerald-950/40" />
                                                                <motion.path
                                                                    d="M85 80 L97 92 L120 68"
                                                                    stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
                                                                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
                                                                />
                                                                <motion.g animate={{ y: [0, -5, 0], opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                                                                    <circle cx="160" cy="50" r="5" fill="#10b981" />
                                                                    <circle cx="40" cy="100" r="4" fill="#10b981" />
                                                                </motion.g>
                                                                <motion.path
                                                                    d="M150 100 L170 80" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" className="opacity-30"
                                                                    animate={{ strokeDashoffset: [0, -8] }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                                />
                                                            </svg>
                                                        ) : (
                                                            /* Alert Illustration */
                                                            <svg viewBox="0 0 200 160" fill="none" className="w-40 h-32 lg:w-40 lg:h-32 2xl:w-48 2xl:h-40">
                                                                <rect x="60" y="20" width="80" height="120" rx="12" fill="currentColor" className="text-amber-100 dark:text-amber-900/30" />
                                                                <rect x="70" y="35" width="60" height="85" rx="4" fill="currentColor" className="text-amber-50 dark:text-amber-950/40" />
                                                                <motion.g animate={{ rotate: [0, -3, 3, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 2 }}>
                                                                    <path d="M100 55 L100 85" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />
                                                                    <circle cx="100" cy="100" r="4" fill="#f59e0b" />
                                                                </motion.g>
                                                                <motion.circle
                                                                    cx="160" cy="120" r="5" fill="#ef4444" opacity="0.5"
                                                                    animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                                                                />
                                                                <circle cx="45" cy="60" r="3" fill="#f59e0b" opacity="0.4" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {/* Title + status */}
                                                    <div className="space-y-2 lg:space-y-2 2xl:space-y-4 mb-4 lg:mb-4 2xl:mb-8">
                                                        <h3 className="text-[1.75rem] lg:text-[1.75rem] 2xl:text-[2.5rem] font-light tracking-tighter leading-[1.1]">
                                                            {sendingStatus.stoppedByUser ? (
                                                                <>Envio <GradientText className="font-black" colors={['#64748b', '#94a3b8', '#475569']}>interrompido</GradientText></>
                                                            ) : sendingStatus.failedContacts.length > 0 ? (
                                                                <>Campanha finalizada. <GradientText className="font-black" colors={['#f59e0b', '#fbbf24', '#d97706']}>Atenção!</GradientText></>
                                                            ) : (
                                                                <>Transmissão <GradientText className="font-black" colors={['#10b981', '#34d399', '#059669']}>concluída!</GradientText></>
                                                            )}
                                                        </h3>
                                                        <div className="flex justify-center">
                                                            <p className={cn(
                                                                "text-[9px] lg:text-[9px] 2xl:text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 2xl:px-5 2xl:py-2 rounded-full border backdrop-blur-md",
                                                                sendingStatus.stoppedByUser
                                                                    ? "text-muted-foreground/60 bg-muted/20 border-border/40"
                                                                    : sendingStatus.failedContacts.length > 0
                                                                        ? "text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-500/10"
                                                                        : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
                                                            )}>
                                                                {sendingStatus.stoppedByUser ? 'A campanha foi pausada manualmente.' : 'Todas as mensagens foram processadas.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Metrics Cards */}
                                                    <div className="w-full grid grid-cols-2 gap-3 lg:gap-3 2xl:gap-4 mb-4 lg:mb-4 2xl:mb-8">
                                                        <div className="bg-card/40 backdrop-blur-md border border-border/40 p-4 lg:p-4 2xl:p-6 rounded-2xl text-left shadow-xs transition-all hover:bg-card/60 group">
                                                            <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 lg:mb-2 2xl:mb-3 opacity-50 group-hover:opacity-100 transition-opacity">Taxa de Sucesso</p>
                                                            <div className="flex items-baseline gap-1">
                                                                <GradientText 
                                                                    className={cn(
                                                                        "text-2xl lg:text-2xl 2xl:text-4xl font-bold tracking-tighter leading-none"
                                                                    )}
                                                                    colors={sendingStatus.failedContacts.length === 0 ? ['#10b981', '#34d399', '#059669'] : ['#f59e0b', '#fbbf24', '#d97706']}
                                                                >
                                                                    {Math.round((sendingStatus.sentCount / (sendingStatus.sentCount + sendingStatus.failedCount || 1)) * 100)}%
                                                                </GradientText>
                                                            </div>
                                                        </div>
                                                        <div className="bg-card/40 backdrop-blur-md border border-border/40 p-4 lg:p-4 2xl:p-6 rounded-2xl text-left shadow-xs transition-all hover:bg-card/60 group">
                                                            <p className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2 lg:mb-2 2xl:mb-3 opacity-50 group-hover:opacity-100 transition-opacity">Total Alcançado</p>
                                                            <p className="text-2xl lg:text-2xl 2xl:text-4xl font-bold text-foreground tracking-tighter leading-none">
                                                                {sendingStatus.totalContacts}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {sendingStatus.failedContacts.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                            className="w-full text-left bg-destructive/[0.02] border border-destructive/10 rounded-3xl p-4 lg:p-3 2xl:p-6 mb-4 lg:mb-4 2xl:mb-10 shrink min-h-0"
                                                        >
                                                            <div className="flex items-center gap-2 mb-2 lg:mb-2 2xl:mb-4 text-destructive/80">
                                                                <Bell className="w-3.5 h-3.5 lg:w-3.5 lg:h-3.5 2xl:w-4 2xl:h-4" />
                                                                <span className="text-[9px] lg:text-[9px] 2xl:text-[10px] font-bold uppercase tracking-[0.2em]">Relatório de Erros ({sendingStatus.failedContacts.length})</span>
                                                            </div>
                                                            <div className="max-h-24 lg:max-h-20 2xl:max-h-40 overflow-y-auto space-y-2 lg:space-y-1.5 2xl:space-y-3 pr-2 no-scrollbar">
                                                                {sendingStatus.failedContacts.map((c, i) => (
                                                                    <div key={i} className="flex justify-between items-center bg-background/40 p-3 rounded-2xl border border-border/30">
                                                                        <span className="font-bold text-[11px] text-foreground/80 tracking-tight">{c.name}</span>
                                                                        <span className="font-mono text-[9px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">{c.number}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    <motion.button
                                                        whileHover="hover"
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleNewTransmission}
                                                        className="w-full h-12 lg:h-12 2xl:h-14 rounded-2xl font-black text-[10px] lg:text-[10px] 2xl:text-xs bg-primary text-primary-foreground shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group tracking-[0.2em] uppercase"
                                                    >
                                                        <span>NOVA TRANSMISSÃO</span>
                                                        <motion.div
                                                            variants={{ hover: { rotate: 90, scale: 1.2 } }}
                                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </motion.div>
                                                    </motion.button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Stop Confirmation Dialog */}
                                        <AlertDialog open={showStopConfirmation} onOpenChange={setShowStopConfirmation}>
                                            <AlertDialogContent className="rounded-2xl border-border/50 shadow-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-xl font-black tracking-tight">Interromper Envio?</AlertDialogTitle>
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

                    </div>
                </motion.div>
            </div>
        </div>
    );
}

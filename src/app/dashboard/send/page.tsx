'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Template } from '@/lib/types';
import { nanoid } from 'nanoid';
import { StaleBatchDialog } from '@/components/send/stale-batch-dialog';
import { useScheduler } from '@/hooks/use-scheduler';
import { useSender } from '@/hooks/use-sender';
import { useSendForm } from '@/hooks/use-send-form';
import {
    MessageSquare,
    Calendar,
    Bell,
    CheckCircle,
    Trash2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";


// UI Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { ActionPanel } from '@/components/send/action-panel';

export default function SendPage() {
    // Global Store State
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

    // Log Cleanup Effect
    useEffect(() => {
        const interval = setInterval(() => {
            cleanupLogs();
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [cleanupLogs]);

    // Hooks
    const {
        activeSchedules,
        staleBatch,
        fetchSchedules,
        handleCancelSchedule,
        handleConfirmStale
    } = useScheduler();

    const { handleSend, handleStop } = useSender();

    // Local State (UI)
    const [mounted, setMounted] = useState(false);
    const [showStopConfirmation, setShowStopConfirmation] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);

    useEffect(() => {
        setMounted(true);
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/templates');
            if (res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Failed to fetch templates", error);
        }
    };

    // Derived State
    const groups = mounted ? storeGroups : [{ id: 'default', name: 'Geral', description: 'Lista Padrão' }];
    const contacts = mounted ? storeContacts : [];
    const getContactsByGroup = mounted ? storeGetContacts : () => [];

    const isSending = mounted ? sendingStatus.isSending : false;

    // Use the send form hook for form state management
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

    // Handlers - Page-specific logic (API calls)
    const handleSchedule = async () => {
        if (!scheduleDate) {
            toast.error("Selecione uma data para agendar.");
            return;
        }
        setSendingStatus({ isSending: true, statusMessage: 'Agendando envio...' });

        try {
            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: recipients,
                    message,
                    media: selectedFile,
                    scheduledFor: scheduleDate,
                    batchName: recipientConfig.type === 'contact'
                        ? `Envio para ${recipientConfig.name}`
                        : `Campanha para ${recipients.length} contatos`,
                    templateId: selectedTemplateId
                })
            });

            if (!res.ok) throw new Error('Falha ao agendar');

            addLog('Agendamento realizado com sucesso!', 'success');
            toast.success("Agendamento realizado com sucesso!");
            resetForm();
            fetchSchedules();

        } catch (error) {
            addLog('Erro ao agendar: ' + error, 'error');
            toast.error("Erro ao agendar envio.");
        } finally {
            setSendingStatus({ isSending: false, statusMessage: null });
        }
    };

    const handleAction = async () => {
        if (recipients.length === 0) {
            toast.error("Nenhum destinatário encontrado.");
            return;
        }
        if (!message && !selectedFile) {
            toast.error("Adicione uma mensagem ou mídia para enviar.");
            return;
        }

        if (isScheduleMode) {
            await handleSchedule();
        } else {
            const started = await handleSend(recipients, message, selectedFile);
            if (started) {
                setMessage('');
                setSelectedFile(null);
            }
        }
    };

    // Formatting Helpers
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

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
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">

                {/* LEFT COL: CONFIGURATION (Span 3) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">

                    <RecipientSelector
                        groups={groups}
                        contacts={contacts}
                        value={recipientConfig}
                        onChange={setRecipientConfig}
                        getContactsByGroup={getContactsByGroup}
                        disabled={isSending}
                    />

                    {/* Template Card */}
                    <div className={`bg-card rounded-xl shadow-sm border border-border p-4 space-y-4 ${isSending ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                Modelo
                            </h2>
                        </div>
                        <Select value={selectedTemplateId || 'none'} onValueChange={handleTemplateSelect} disabled={isSending}>
                            <SelectTrigger className="w-full h-9 text-sm">
                                <SelectValue placeholder="Selecione um modelo..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhum (Escrever do zero)</SelectItem>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Schedule Card */}
                    <div className={`bg-card rounded-xl shadow-sm border border-border p-4 space-y-4 ${isSending ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                                <Calendar className="w-4 h-4 text-primary" />
                                Agendamento
                            </h2>
                            <Switch checked={isScheduleMode} onCheckedChange={setIsScheduleMode} disabled={isSending} />
                        </div>
                        {isScheduleMode && (
                            <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Data de Envio</label>
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

                {/* CENTER COL: COMPOSITION (Span 6) */}
                <div className="col-span-12 lg:col-span-6 flex flex-col min-h-0">
                    <MessageEditor
                        message={message}
                        onMessageChange={setMessage}
                        selectedFile={selectedFile}
                        onFileChange={setSelectedFile}
                        disabled={isSending}
                    />
                </div>

                {/* RIGHT COL: ACTIONS & LOGS (Span 3) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-hidden">

                    <ActionPanel
                        recipientCount={recipients.length}
                        estimatedTime={estimatedTime}
                        recipientType={recipientConfig.type}
                        isSending={isSending}
                        isScheduleMode={isScheduleMode}
                        onAction={handleAction}
                        onStop={() => setShowStopConfirmation(true)}
                        sendProgress={isSending ? {
                            current: sendingStatus.currentContactIndex,
                            total: sendingStatus.totalContacts
                        } : undefined}
                    />

                    {/* Live Logs Panel - Fills remaining height */}
                    <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col min-h-0 flex-1 overflow-hidden">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Log de Envios</h3>
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
                                <div className="text-center py-8 opacity-50">
                                    <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground">Aguardando atividades...</p>
                                </div>
                            )}

                            {recentLogs.map((log) => (
                                <div key={log.id} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
                                    <div className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                                        log.type === 'success' ? "bg-success" :
                                            log.type === 'error' ? "bg-destructive" : "bg-muted-foreground/30"
                                    )} />
                                    <div className="min-w-0">
                                        <p className="text-xs text-foreground leading-snug wrap-break-word">{log.message}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(new Date(log.timestamp))}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
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

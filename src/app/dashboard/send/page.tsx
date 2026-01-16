'use client';

import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Template } from '@/lib/types';
import { nanoid } from 'nanoid';
import { StaleBatchDialog } from '@/components/send/stale-batch-dialog';
import { useScheduler } from '@/hooks/use-scheduler';
import { useSender } from '@/hooks/use-sender';
import {
    Send,
    Users,
    MessageSquare,
    Calendar,
    Bell,
    CheckCircle,
    Trash2,
    Clock,
    Image as ImageIcon,
    Bold,
    Italic,
    Smile,
    Search,
    X,
    User,
    Check
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from 'next/image';

// UI Components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

    const { handleSend } = useSender();

    // Local State (UI)
    const [mounted, setMounted] = useState(false);

    // NEW: Unified Selection State
    const [recipientConfig, setRecipientConfig] = useState<{
        type: 'group' | 'contact';
        id: string;
        name: string;
    }>({ type: 'group', id: 'all', name: 'Todos os Contatos' });

    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<{ data: string, mimetype: string, filename: string } | null>(null);
    const [isScheduleMode, setIsScheduleMode] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');

    // Search/Dropdown State
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Templates State
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        fetchTemplates();

        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    // Logic to calculate actual recipients based on selection type
    const recipients = recipientConfig.type === 'group'
        ? (recipientConfig.id === 'all' ? contacts : getContactsByGroup(recipientConfig.id))
        : contacts.filter(c => c.id === recipientConfig.id);

    // Filter Logic for Search
    const filteredGroups = groups.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.number.includes(searchTerm)
    );

    // Estimate: 20s per contact is conservative default from store/logic
    const estimatedTime = Math.ceil((recipients.length) * 20 / 60);

    const addLog = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        storeAddLog({
            id: nanoid(),
            message,
            type,
            timestamp: new Date()
        });
    };

    // Handlers
    const handleTemplateSelect = (templateId: string) => {
        if (templateId === 'none') {
            setSelectedTemplateId(null);
            return;
        }
        setSelectedTemplateId(templateId);
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setMessage(template.content);
            if (template.media) {
                try {
                    const mediaData = JSON.parse(template.media);
                    setSelectedFile(mediaData);
                } catch (e) {
                    console.error("Error parsing template media", e);
                }
            } else {
                setSelectedFile(null);
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64Data = reader.result as string;
                const parts = base64Data.split(',');
                if (parts.length === 2) {
                    setSelectedFile({
                        data: parts[1],
                        mimetype: file.type,
                        filename: file.name
                    });
                }
            };
        }
    };

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
            setMessage('');
            setSelectedFile(null);
            setIsScheduleMode(false);
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
            await handleSend(recipients, message, selectedFile);
        }
    };

    // Formatting Helpers
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const recentLogs = logs.slice(0, 50);

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-slate-50/50 -m-6 p-6 overflow-hidden">
            <StaleBatchDialog
                staleBatch={staleBatch}
                onAction={handleConfirmStale}
            />

            {/* Header Compact */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">Nova Campanha</h1>
                    <p className="text-slate-500 text-xs">Command Center</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 shadow-sm text-slate-600">
                        <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-500" />
                        Sistema Operacional
                    </div>
                </div>
            </div>

            {/* Main Grid Content */}
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">

                {/* LEFT COL: CONFIGURATION (Span 3) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">

                    {/* Unified Selector Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4 relative z-50">
                        <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                            <Users className="w-4 h-4 text-indigo-500" />
                            Destinatários
                        </h2>
                        <div className="space-y-1 relative" ref={searchRef}>
                            <label className="text-xs font-medium text-slate-500">Buscar Grupo ou Contato</label>

                            {/* Custom Trigger */}
                            <div
                                onClick={() => setIsSearchOpen(!isSearchOpen)}
                                className={cn(
                                    "flex items-center justify-between w-full h-9 px-3 py-2 text-sm bg-white border rounded-md shadow-sm cursor-pointer hover:bg-slate-50",
                                    isSearchOpen ? "border-indigo-500 ring-1 ring-indigo-500" : "border-slate-200"
                                )}
                            >
                                <span className={cn("truncate block", !recipientConfig.name && "text-slate-400")}>
                                    {recipientConfig.name}
                                </span>
                                <Search className="w-3.5 h-3.5 text-slate-400" />
                            </div>

                            {/* Dropdown Menu */}
                            {isSearchOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col z-[100]">
                                    <div className="p-2 border-b border-slate-100 relative">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Filtrar..."
                                            className="w-full pl-7 pr-2 py-1 text-xs border-0 focus:ring-0 placeholder:text-slate-400"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-1">
                                        {/* ALL OPTION */}
                                        <div
                                            className="px-2 py-1.5 text-sm hover:bg-indigo-50 rounded cursor-pointer flex items-center justify-between group"
                                            onClick={() => {
                                                setRecipientConfig({ type: 'group', id: 'all', name: 'Todos os Contatos' });
                                                setIsSearchOpen(false);
                                                setSearchTerm('');
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                                <span>Todos os Contatos</span>
                                            </div>
                                            {recipientConfig.id === 'all' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                        </div>

                                        {/* GROUPS */}
                                        {filteredGroups.length > 0 && (
                                            <>
                                                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Grupos</div>
                                                {filteredGroups.map(group => (
                                                    <div
                                                        key={group.id}
                                                        className="px-2 py-1.5 text-sm hover:bg-indigo-50 rounded cursor-pointer flex items-center justify-between"
                                                        onClick={() => {
                                                            setRecipientConfig({ type: 'group', id: group.id, name: group.name });
                                                            setIsSearchOpen(false);
                                                            setSearchTerm('');
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-3.5 h-3.5 text-slate-400" />
                                                            <span>{group.name}</span>
                                                            <span className="text-xs text-slate-400">({getContactsByGroup(group.id).length})</span>
                                                        </div>
                                                        {recipientConfig.id === group.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* CONTACTS */}
                                        {filteredContacts.length > 0 && (
                                            <>
                                                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Contatos</div>
                                                {filteredContacts.map(contact => (
                                                    <div
                                                        key={contact.id}
                                                        className="px-2 py-1.5 text-sm hover:bg-indigo-50 rounded cursor-pointer flex items-center justify-between"
                                                        onClick={() => {
                                                            setRecipientConfig({ type: 'contact', id: contact.id, name: contact.name });
                                                            setIsSearchOpen(false);
                                                            setSearchTerm('');
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                                            <div className="flex flex-col">
                                                                <span>{contact.name}</span>
                                                                <span className="text-[10px] text-slate-400">{contact.number}</span>
                                                            </div>
                                                        </div>
                                                        {recipientConfig.id === contact.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {filteredGroups.length === 0 && filteredContacts.length === 0 && (
                                            <div className="px-2 py-4 text-center text-xs text-slate-400">
                                                Nenhum resultado encontrado.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Template Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                <MessageSquare className="w-4 h-4 text-indigo-500" />
                                Modelo
                            </h2>
                        </div>
                        <Select value={selectedTemplateId || 'none'} onValueChange={handleTemplateSelect}>
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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                <Calendar className="w-4 h-4 text-indigo-500" />
                                Agendamento
                            </h2>
                            <Switch checked={isScheduleMode} onCheckedChange={setIsScheduleMode} />
                        </div>
                        {isScheduleMode && (
                            <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                                <label className="text-xs font-medium text-slate-500 block mb-1.5">Data de Envio</label>
                                <Input
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER COL: COMPOSITION (Span 6) */}
                <div className="col-span-12 lg:col-span-6 flex flex-col min-h-0">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                        {/* Toolbar Header */}
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Editor de Mensagem</span>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 rounded" title="Negrito">
                                    <Bold className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 rounded" title="Itálico">
                                    <Italic className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 rounded" title="Emoji">
                                    <Smile className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 relative group min-h-0 overflow-hidden">
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full h-full border-0 resize-none p-4 text-base focus-visible:ring-0 bg-transparent relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200"
                                placeholder="Digite sua mensagem..."
                            />
                        </div>

                        {/* Media Attachment Area - Bar at bottom */}
                        <div className="p-3 border-t border-slate-100 bg-slate-50 relative z-20">
                            {selectedFile ? (
                                <div className="flex items-center gap-3 bg-white border border-indigo-100 rounded-lg p-2 pr-4 shadow-sm w-fit">
                                    <div className="relative w-10 h-10 rounded overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                        <Image
                                            src={`data:${selectedFile.mimetype};base64,${selectedFile.data}`}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="min-w-0 max-w-[200px]">
                                        <p className="text-xs font-medium text-slate-700 truncate">{selectedFile.filename}</p>
                                        <p className="text-[10px] text-slate-400">Mídia anexada</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 ml-2"
                                        onClick={() => setSelectedFile(null)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-9 bg-white border-dashed text-slate-600 hover:text-indigo-600 hover:border-indigo-300"
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                    >
                                        <ImageIcon className="w-3.5 h-3.5 mr-2" />
                                        Adicionar Imagem
                                    </Button>
                                    <span className="text-[10px] text-slate-400">Suporta PNG, JPG (Max 5MB)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: ACTIONS & LOGS (Span 3) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0 overflow-hidden">

                    {/* Action Panel */}
                    <div className="bg-slate-900 text-white rounded-xl shadow-lg p-5 shrink-0 flex flex-col gap-4">
                        <div>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Resumo Total</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">{recipients.length}</span>
                                <span className="text-sm text-slate-400">destinatários</span>
                            </div>
                            {/* Current Selection Badges */}
                            <div className="mt-2 text-xs">
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-medium border",
                                    recipientConfig.type === 'group'
                                        ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                )}>
                                    {recipientConfig.type === 'group' ? 'GRUPO' : 'CONTATO'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-700/50">
                            <div className="flex justify-between text-xs text-slate-300">
                                <span>Tempo estimado:</span>
                                <span>~{estimatedTime} min</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-300">
                                <span>Atraso seguro:</span>
                                <span className="text-emerald-400">Ativo</span>
                            </div>
                        </div>

                        <Button
                            onClick={handleAction}
                            disabled={isSending}
                            className={cn(
                                "w-full h-11 text-sm font-semibold shadow transition-all mt-1",
                                isScheduleMode
                                    ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                                    : "bg-emerald-500 hover:bg-emerald-600 text-white",
                                isSending && "opacity-80"
                            )}
                        >
                            {isSending ? (
                                <>Enviando...</>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    {isScheduleMode ? "Agendar Disparo" : "Iniciar Disparo"}
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Live Logs Panel - Fills remaining height */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-0 flex-1 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-500">Log de Envios</h3>
                            <button onClick={clearLogs} className="text-xs text-indigo-500 hover:underline">
                                Limpar
                            </button>
                        </div>

                        <div className="overflow-y-auto p-4 space-y-3 flex-1 scrollbar-thin scrollbar-thumb-slate-200">
                            {/* Active Schedules first if any */}
                            {activeSchedules.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Agendamentos</p>
                                    {activeSchedules.map(schedule => (
                                        <div key={schedule.id} className="bg-blue-50/50 border border-blue-100 rounded p-2 flex justify-between items-center">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-blue-900 truncate">{schedule.batchName}</p>
                                                <p className="text-[10px] text-blue-600">{new Date(schedule.scheduledFor).toLocaleString('pt-BR')}</p>
                                            </div>
                                            <button onClick={() => handleCancelSchedule(schedule.id)} className="text-red-400 hover:text-red-600">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {recentLogs.length === 0 && !activeSchedules.length && (
                                <div className="text-center py-8 opacity-50">
                                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400">Aguardando atividades...</p>
                                </div>
                            )}

                            {recentLogs.map((log) => (
                                <div key={log.id} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
                                    <div className={cn("mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                                        log.type === 'success' ? "bg-emerald-500" :
                                            log.type === 'error' ? "bg-red-500" : "bg-slate-300"
                                    )} />
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-700 leading-snug break-words">{log.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{formatTime(new Date(log.timestamp))}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

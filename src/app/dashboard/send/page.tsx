'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
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
    FileText, 
    Image as ImageIcon,
    Bold,
    Italic,
    Smile,
    History
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from 'next/image';

// UI Components (Inline for simplicity as requested by task plan, but structured)
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
   const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
   const [message, setMessage] = useState('');
   const [selectedFile, setSelectedFile] = useState<{ data: string, mimetype: string, filename: string } | null>(null);
   const [isScheduleMode, setIsScheduleMode] = useState(false);
   const [scheduleDate, setScheduleDate] = useState('');
   
   // Templates State
   const [templates, setTemplates] = useState<any[]>([]);
   const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

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
   // const progress = mounted ? sendingStatus.progress : 0; // Usage if needed for progress bar later
   // const currentContactIndex = mounted ? sendingStatus.currentContactIndex : 0;
   
   const recipients = selectedGroupId === 'all'
      ? contacts
      : getContactsByGroup(selectedGroupId);

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
        if(templateId === 'none') {
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
                    batchName: `Campanha para ${recipients.length} contatos`,
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
            toast.error("Selecione destinatários para enviar.");
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

    // Filter logs for relevant display
    const recentLogs = logs.slice(0, 5);

   return (
      <div className="flex flex-col h-full bg-slate-50/50 -m-6 p-6 min-h-[calc(100vh-65px)]">
         <StaleBatchDialog 
            staleBatch={staleBatch} 
            onAction={handleConfirmStale} 
         />

         {/* Header */}
         <div className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nova Campanha</h1>
               <p className="text-slate-500 text-sm mt-1">Configure e envie suas mensagens em etapas simples.</p>
            </div>
            <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium border border-green-200">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Sistema Operacional
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                    <Bell className="w-5 h-5" />
                </Button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
            
            {/* Left Column - Steps */}
            <div className="lg:col-span-2 space-y-8 pb-24">
                
                {/* Step 1: Recipients */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative group hover:shadow-md transition-shadow">
                    <div className="absolute -left-3 top-6 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm z-10 border-4 border-slate-50">1</div>
                    <div className="ml-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            <Users className="w-5 h-5 text-indigo-500" />
                            Selecionar Destinatários
                        </h2>
                        <p className="text-sm text-slate-500 mb-6 mt-1">Quem receberá esta mensagem?</p>
                        
                        <div className="space-y-2">
                             <label className="text-sm font-medium text-slate-700">Lista de Contatos</label>
                             <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-10 relative z-20">
                                    <SelectValue placeholder="Selecione uma lista" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Contatos ({contacts.length})</SelectItem>
                                    {groups.map(group => (
                                        <SelectItem key={group.id} value={group.id}>
                                            {group.name} ({getContactsByGroup(group.id).length})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                    </div>
                </section>

                {/* Step 2: Message */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative group hover:shadow-md transition-shadow">
                    <div className="absolute -left-3 top-6 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm z-10 border-4 border-slate-50">2</div>
                    <div className="ml-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                            <MessageSquare className="w-5 h-5 text-indigo-500" />
                            Compor Mensagem
                        </h2>
                        <p className="text-sm text-slate-500 mb-6 mt-1">Escolha um modelo ou escreva do zero.</p>
                        
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Modelo (Opcional)</label>
                                <Select value={selectedTemplateId || 'none'} onValueChange={handleTemplateSelect}>
                                    <SelectTrigger className="w-full bg-slate-50 border-slate-200 relative z-20">
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

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Conteúdo da Mensagem</label>
                                <div className="relative">
                                    <Textarea 
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="min-h-[150px] bg-slate-50 border-slate-200 pr-24 resize-y text-sm"
                                        placeholder="Digite sua mensagem aqui..."
                                    />
                                    {/* Simplified formatting toolbar visual */}
                                    <div className="absolute bottom-3 right-3 flex gap-1 bg-white/50 backdrop-blur-sm p-1 rounded-lg border border-slate-200/50">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600 rounded-md" title="Negrito">
                                            <Bold className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600 rounded-md" title="Itálico">
                                            <Italic className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600 rounded-md" title="Emoji">
                                            <Smile className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Formatação suportada: *negrito*, _itálico_, ~tachado~
                                </p>
                            </div>

                            {/* Image Upload Area */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 block">Imagem (Opcional)</label>
                                <div 
                                    className={cn(
                                        "relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer hover:bg-slate-50",
                                        selectedFile ? "border-indigo-200 bg-indigo-50/10" : "border-slate-200"
                                    )}
                                    onClick={() => document.getElementById('image-upload')?.click()}
                                >
                                    {selectedFile ? (
                                        <div className="relative flex items-center gap-3">
                                            <div className="relative w-16 h-16 rounded overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                                <Image 
                                                     src={`data:${selectedFile.mimetype};base64,${selectedFile.data}`} 
                                                     alt="Preview" 
                                                     fill
                                                     className="object-cover" 
                                                     unoptimized
                                                />
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{selectedFile.filename}</p>
                                                <p className="text-xs text-slate-400">Clique para trocar</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-red-400 hover:text-red-500 hover:bg-red-50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFile(null);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="py-2">
                                            <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                            <p className="text-sm text-indigo-600 font-medium hover:underline">Carregar imagem</p>
                                            <p className="text-xs text-slate-400 mt-1">PNG, JPG até 5MB</p>
                                        </div>
                                    )}
                                    <Input 
                                        id="image-upload" 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step 3: Schedule */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative group hover:shadow-md transition-shadow">
                     <div className="absolute -left-3 top-6 w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center font-bold text-sm z-10 border-4 border-slate-50 group-hover:bg-indigo-500 transition-colors">3</div>
                     <div className="ml-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
                                <Calendar className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                Agendamento
                            </h2>
                            <div className="flex items-center gap-3">
                                <span className={cn("text-sm font-medium transition-colors", isScheduleMode ? "text-indigo-600" : "text-slate-500")}>
                                    Agendar Envio
                                </span>
                                <Switch checked={isScheduleMode} onCheckedChange={setIsScheduleMode} />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">Ative para escolher data e hora futura.</p>

                        {isScheduleMode && (
                            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium text-slate-700 block mb-2">Data e Hora do Envio</label>
                                <Input 
                                    type="datetime-local" 
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                        )}
                     </div>
                </section>

            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                        <h3 className="font-semibold text-lg text-slate-800">Resumo</h3>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
                            {isScheduleMode ? "Agendamento" : "Envio Imediato"}
                        </span>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Destinatários:</span>
                            <span className="font-medium text-slate-900">{recipients.length} Contatos</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Estimativa:</span>
                            <span className="font-medium text-slate-900">~{estimatedTime} mins</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Atraso Segurança:</span>
                            <span className="font-medium text-emerald-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Ativo
                            </span>
                        </div>
                    </div>

                    <Button 
                        onClick={handleAction} 
                        disabled={isSending}
                        className={cn(
                            "w-full h-12 text-base font-medium shadow-md transition-all hover:shadow-lg",
                            isSending ? "opacity-80" : "hover:-translate-y-0.5"
                        )}
                    >
                        {isSending ? (
                             <>Enviando...</>
                        ) : (
                             <>
                                <Send className="w-4 h-4 mr-2" />
                                {isScheduleMode ? "Agendar Envio" : "Iniciar Envio Agora"}
                             </>
                        )}
                    </Button>
                </div>

                {/* Activity Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400">Atividades Recentes</h3>
                        <button onClick={clearLogs} className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Limpar
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentLogs.length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-sm">
                                Nenhuma atividade recente.
                            </div>
                        )}
                        {recentLogs.map((log) => (
                            <div key={log.id} className={cn(
                                "flex items-start p-3 rounded-lg border",
                                log.type === 'success' ? "bg-emerald-50 border-emerald-100" :
                                log.type === 'error' ? "bg-red-50 border-red-100" :
                                "bg-slate-50 border-slate-100 opacity-75"
                            )}>
                                {log.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 mr-3 shrink-0" />}
                                {log.type === 'error' && <Bell className="w-4 h-4 text-red-500 mt-0.5 mr-3 shrink-0" />}
                                {log.type === 'info' && <Clock className="w-4 h-4 text-slate-400 mt-0.5 mr-3 shrink-0" />}
                                
                                <div className="min-w-0 font-normal">
                                    <p className={cn(
                                        "text-sm font-medium line-clamp-2",
                                        log.type === 'success' ? "text-emerald-800" :
                                        log.type === 'error' ? "text-red-800" :
                                        "text-slate-700"
                                    )}>{log.message}</p>
                                    <p className={cn(
                                        "text-xs mt-1",
                                        log.type === 'success' ? "text-emerald-600" : "text-slate-400"
                                    )}>{formatTime(new Date(log.timestamp))}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Active Schedules Section in Activity Card */}
                    {activeSchedules.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                             <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-semibold text-slate-400 uppercase">Agendados</span>
                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-medium">{activeSchedules.length} item(s)</span>
                            </div>
                            
                            <div className="space-y-2">
                                {activeSchedules.map(schedule => (
                                    <div key={schedule.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm relative overflow-hidden group">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3">
                                                <div className="bg-slate-100 p-2 rounded-md shrink-0">
                                                    <Calendar className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 truncate">{schedule.batchName}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                        {new Date(schedule.scheduledFor).toLocaleString('pt-BR')} • {schedule.recipients?.length || 0} contatos
                                                    </p>
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 text-red-300 hover:text-red-500 -mt-1 -mr-1"
                                                onClick={() => handleCancelSchedule(schedule.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

         </div>
      </div>
   );
}


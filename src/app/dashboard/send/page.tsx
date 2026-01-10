'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Send, Loader2, CheckCircle2, XCircle, Info, Clock, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';

type LogType = 'success' | 'error' | 'info' | 'warning' | 'pending';

interface LogEntry {
   id: string;
   message: string;
   type: LogType;
   timestamp: Date;
}

export default function SendPage() {
   const { groups: storeGroups, contacts: storeContacts, getContactsByGroup: storeGetContacts } = useAppStore();
   const [mounted, setMounted] = useState(false);

   useEffect(() => {
      setMounted(true);
   }, []);

   const groups = mounted ? storeGroups : [{ id: 'default', name: 'Geral', description: 'Lista Padrão' }];
   const contacts = mounted ? storeContacts : [];
   const getContactsByGroup = mounted ? storeGetContacts : () => [];

   const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
   const [message, setMessage] = useState('');

   const [isSending, setIsSending] = useState(false);
   const [progress, setProgress] = useState(0);
   const [logs, setLogs] = useState<LogEntry[]>([]);
   const [statusMessage, setStatusMessage] = useState<string | null>(null);
   const [currentContactIndex, setCurrentContactIndex] = useState(0);

   const addLog = (message: string, type: LogType = 'info') => {
      setLogs(prev => [
         {
            id: nanoid(),
            message,
            type,
            timestamp: new Date()
         },
         ...prev
      ]);
   };

   // File State
   const [selectedFile, setSelectedFile] = useState<{ data: string, mimetype: string, filename: string } | null>(null);

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = () => {
            // data URL format: "data:image/png;base64,....."
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

   // Computed recipients
   const recipients = selectedGroupId === 'all'
      ? contacts
      : getContactsByGroup(selectedGroupId);

   const estimatedTime = Math.ceil((recipients.length - currentContactIndex) * 20 / 60); // dynamic remaining time

   const handleSend = async () => {
      if ((!message && !selectedFile) || recipients.length === 0) return;

      setIsSending(true);
      setLogs([]); // Clear previous logs
      setStatusMessage('Iniciando transmissão...');

      // Start loop
      processQueue(0);
   };

   const processQueue = async (index: number) => {
      if (index >= recipients.length) {
         setIsSending(false);
         setStatusMessage(null);
         addLog('Transmissão completa!', 'success');
         setCurrentContactIndex(recipients.length);
         setProgress(100);
         return;
      }

      const contact = recipients[index];
      setCurrentContactIndex(index);
      setProgress(Math.round((index / recipients.length) * 100));

      try {
         setStatusMessage(`Enviando para ${contact.name} (${contact.number})...`);

         const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               number: contact.number,
               message: message,
               media: selectedFile
            })
         });

         if (!res.ok) throw new Error('Falha ao enviar');

         addLog(`Enviado para ${contact.name}`, 'success');

         const nextContact = recipients[index + 1];

         if (nextContact) {
            // Random Delay: 15s to 30s
            const delay = Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
            const nextName = nextContact.name.split(' ')[0];

            let remaining = Math.ceil(delay / 1000);
            setStatusMessage(`Aguardando ${remaining}s para enviar para ${nextName}...`);

            const interval = setInterval(() => {
               remaining -= 1;
               if (remaining > 0) {
                  setStatusMessage(`Aguardando ${remaining}s para enviar para ${nextName}...`);
               }
            }, 1000);

            setTimeout(() => {
               clearInterval(interval);
               processQueue(index + 1);
            }, delay);
         } else {
            processQueue(index + 1);
         }

      } catch (error) {
         console.error(error);
         addLog(`Erro ao enviar para ${contact.name}: ${error}`, 'error');
         setTimeout(() => {
            processQueue(index + 1);
         }, 5000); // Shorter delay on error
      }
   };

   return (
      <div className="space-y-6 max-w-4xl mx-auto">
         <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Enviar Mensagem</h1>
         </div>

         <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column: Form */}
            <div className="md:col-span-2 space-y-6">
               <Card>
                  <CardHeader>
                     <CardTitle>Configurações da Campanha</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium">Destinatários</label>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isSending}>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecione os destinatários" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">Todos os Contatos ({contacts.length})</SelectItem>
                              {groups.map(g => (
                                 <SelectItem key={g.id} value={g.id}>
                                    {g.name} ({getContactsByGroup(g.id).length})
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium">Mensagem</label>
                        <Textarea
                           placeholder="Digite sua mensagem aqui..."
                           className="min-h-[150px]"
                           value={message}
                           onChange={e => setMessage(e.target.value)}
                           disabled={isSending}
                        />
                        <p className="text-xs text-muted-foreground">
                           Formatação: *negrito*, _itálico_, ~tachado~
                        </p>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium">Imagem (Opcional)</label>
                        <Input type="file" accept="image/*" onChange={handleFileChange} disabled={isSending} />
                        {selectedFile && <p className="text-xs text-success">Selecionado: {selectedFile.filename}</p>}
                     </div>

                     <div className="pt-4">
                        {!isSending ? (
                           <Button className="w-full" onClick={handleSend} disabled={recipients.length === 0 || (!message && !selectedFile)}>
                              <Send className="w-4 h-4 mr-2" />
                              Iniciar Envio
                           </Button>
                        ) : (
                           <Button className="w-full" variant="secondary" disabled>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Envio em andamento...
                           </Button>
                        )}

                        {recipients.length > 0 && (
                           <p className="text-xs text-center mt-3 text-muted-foreground">
                              Tempo estimado: ~{estimatedTime} mins (Atrasos de segurança ativos)
                           </p>
                        )}
                     </div>
                  </CardContent>
               </Card>
            </div>

            {/* Right Column: Status & Preview */}
            <div className="space-y-6 flex flex-col h-full">
               <Card className="flex flex-col h-full border-border bg-muted/30 shadow-inner">
                  <CardHeader className="bg-card border-b flex flex-row items-center justify-between space-y-0 py-3">
                     <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        Progresso em Tempo Real
                     </CardTitle>
                     {isSending && (
                        <Badge variant="outline" className="text-[10px] font-normal flex gap-1 items-center bg-muted/30">
                           <Hourglass className="w-3 h-3 text-muted-foreground" />
                           ~{estimatedTime} min restantes
                        </Badge>
                     )}
                  </CardHeader>
                  <CardContent className="space-y-4 pt-6 flex-1 flex flex-col min-h-0">
                     <div className="space-y-2 bg-card p-4 rounded-lg border shadow-sm">
                        <div className="flex justify-between text-sm font-medium text-muted-foreground">
                           <span>Progresso Total</span>
                           <span>{currentContactIndex} / {recipients.length}</span>
                        </div>
                        <Progress value={progress} className="h-2" />

                        {statusMessage && (
                           <div className="flex items-center gap-2 text-xs text-info bg-info/10 p-2 rounded animate-in fade-in transition-all">
                              <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                              <span className="font-medium truncate">{statusMessage}</span>
                           </div>
                        )}
                     </div>

                     <div className="flex-1 overflow-y-auto pr-2 space-y-2 relative">
                        <AnimatePresence mode="popLayout">
                           {logs.length === 0 && !statusMessage && (
                              <motion.div
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 className="text-muted-foreground italic text-center py-10 text-sm"
                              >
                                 Aguardando início do envio...
                              </motion.div>
                           )}
                           {logs.map((log) => (
                              <motion.div
                                 key={log.id}
                                 layout
                                 initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                 animate={{ opacity: 1, x: 0, scale: 1 }}
                                 exit={{ opacity: 0, x: 20 }}
                                 className={`flex items-start gap-3 p-3 rounded-lg border text-sm shadow-sm ${log.type === 'success' ? 'bg-success/10 border-success/20 text-success' :
                                    log.type === 'error' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                                       'bg-card border-border text-muted-foreground'
                                    }`}
                              >
                                 <div className="mt-0.5 shrink-0">
                                    {log.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                    {log.type === 'error' && <XCircle className="w-4 h-4" />}
                                    {log.type === 'info' && <Info className="w-4 h-4" />}
                                 </div>
                                 <div className="flex-1">
                                    <p className="font-medium">{log.message}</p>
                                    <p className="text-[10px] opacity-70 mt-1">
                                       {log.timestamp.toLocaleTimeString()}
                                    </p>
                                 </div>
                              </motion.div>
                           ))}
                        </AnimatePresence>
                     </div>
                  </CardContent>
               </Card>
            </div>
         </div>
      </div>
   );
}

'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { nanoid } from 'nanoid';
import { StaleBatchDialog } from '@/components/send/stale-batch-dialog';
import { SendForm } from '@/components/send/send-form';
import { StatusPanel } from '@/components/send/status-panel';
import { useScheduler } from '@/hooks/use-scheduler';
import { useSender } from '@/hooks/use-sender';

export default function SendPage() {
   // Global Store State
   const { 
      groups: storeGroups, 
      contacts: storeContacts, 
      getContactsByGroup: storeGetContacts,
      logs,
      addLog: storeAddLog,
      cleanupLogs, // Import cleanup action
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
   const progress = mounted ? sendingStatus.progress : 0;
   const statusMessage = mounted ? sendingStatus.statusMessage : null;
   const currentContactIndex = mounted ? sendingStatus.currentContactIndex : 0;
   const displayedLogs = mounted ? logs : [];

   const recipients = selectedGroupId === 'all'
      ? contacts
      : getContactsByGroup(selectedGroupId);

   const estimatedTime = Math.ceil((recipients.length - currentContactIndex) * 20 / 60);

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
        if (!scheduleDate) return;
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
            setMessage('');
            setSelectedFile(null);
            setIsScheduleMode(false);
            fetchSchedules();

        } catch (error) {
            addLog('Erro ao agendar: ' + error, 'error');
        } finally {
            setSendingStatus({ isSending: false, statusMessage: null });
        }
    };

    const handleAction = async () => {
        if (isScheduleMode) {
            await handleSchedule();
        } else {
            await handleSend(recipients, message, selectedFile);
        }
    };

   return (
      <div className="space-y-6 max-w-4xl mx-auto">
         <StaleBatchDialog 
            staleBatch={staleBatch} 
            onAction={handleConfirmStale} 
         />

         <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Enviar Mensagem</h1>
         </div>

         <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
               <SendForm 
                  groups={groups}
                  contacts={contacts}
                  templates={templates}
                  selectedGroupId={selectedGroupId}
                  setSelectedGroupId={setSelectedGroupId}
                  isSending={isSending}
                  handleTemplateSelect={handleTemplateSelect}
                  message={message}
                  setMessage={setMessage}
                  selectedFile={selectedFile}
                  handleFileChange={handleFileChange}
                  isScheduleMode={isScheduleMode}
                  setIsScheduleMode={setIsScheduleMode}
                  scheduleDate={scheduleDate}
                  setScheduleDate={setScheduleDate}
                  handleAction={handleAction}
                  recipientsCount={recipients.length}
                  estimatedTime={estimatedTime}
                  selectedTemplateId={selectedTemplateId}
               />
            </div>

            <div className="space-y-6 flex flex-col h-full">
               <StatusPanel 
                  activeSchedules={activeSchedules}
                  isSending={isSending}
                  isScheduleMode={isScheduleMode}
                  estimatedTime={estimatedTime}
                  progress={progress}
                  currentContactIndex={currentContactIndex}
                  totalRecipients={recipients.length}
                  statusMessage={statusMessage}
                  logs={displayedLogs}
                  onCancelSchedule={handleCancelSchedule}
                  onClearLogs={clearLogs}
               />
            </div>
         </div>
      </div>
   );
}

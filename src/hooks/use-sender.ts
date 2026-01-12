
import { useAppStore } from '@/lib/store';
import { calculateSafetyDelay } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { Contact, LogType } from '@/lib/types';


export function useSender() {
    const { setSendingStatus, addLog: storeAddLog } = useAppStore();

    const addLog = (message: string, type: LogType = 'info') => {
        // Expiration Logic:
        // Success: 10 mins
        // Others (Error/Warning usually important): Keep default (or maybe 3h?)
        // Let's set 10m for success, undefined (forever) for others unless specified.
        
        let expiresAt = undefined;
        if (type === 'success') {
            expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        }

        storeAddLog({
            id: nanoid(),
            message,
            type,
            timestamp: new Date(),
            expiresAt
        });
    };

    const processQueue = async (index: number, recipients: Contact[], message: string, selectedFile: any | null) => {
        if (index >= recipients.length) {
            setSendingStatus({ isSending: false, statusMessage: null, progress: 100, currentContactIndex: recipients.length });
            addLog('Transmissão completa!', 'success');
            return;
        }

        const contact = recipients[index];
        setSendingStatus({ currentContactIndex: index, progress: Math.round((index / recipients.length) * 100) });

        try {
            setSendingStatus({ statusMessage: `Enviando para ${contact.name} (${contact.number})...` });

            // We now delegate variable substitution to the server (Smart Substitution)
            // It will check for pushname or use the fallback name we send.

            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    number: contact.number,
                    message: message, // Raw message with {{name}}
                    media: selectedFile,
                    name: contact.name // Pass fallback name
                })
            });

            if (!res.ok) throw new Error('Falha ao enviar');

            addLog(`Enviado para ${contact.name}`, 'success');

            const nextContact = recipients[index + 1];

            if (nextContact) {
                const delay = calculateSafetyDelay();
                const nextName = nextContact.name.split(' ')[0];

                let remaining = Math.ceil(delay / 1000);
                setSendingStatus({ statusMessage: `Aguardando ${remaining}s para enviar para ${nextName}...` });

                const interval = setInterval(() => {
                    remaining -= 1;
                    if (remaining > 0) {
                        setSendingStatus({ statusMessage: `Aguardando ${remaining}s para enviar para ${nextName}...` });
                    }
                }, 1000);

                setTimeout(() => {
                    clearInterval(interval);
                    processQueue(index + 1, recipients, message, selectedFile);
                }, delay);
            } else {
                processQueue(index + 1, recipients, message, selectedFile);
            }

        } catch (error) {
            console.error(error);
            addLog(`Erro ao enviar para ${contact.name}: ${error}`, 'error');
            setTimeout(() => {
                processQueue(index + 1, recipients, message, selectedFile);
            }, 5000);
        }
    };

    const handleSend = async (recipients: Contact[], message: string, selectedFile: any | null) => {
        if ((!message && !selectedFile) || recipients.length === 0) return;

        setSendingStatus({ isSending: true, statusMessage: 'Iniciando transmissão...', progress: 0, currentContactIndex: 0 });
        processQueue(0, recipients, message, selectedFile);
    };

    return {
        handleSend
    };
}

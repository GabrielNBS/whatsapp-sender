
import { useAppStore } from '@/lib/store';
import { calculateSafetyDelay } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { Contact, LogType } from '@/lib/types';


import { useRef } from 'react';

export function useSender() {
    const { setSendingStatus, addLog: storeAddLog } = useAppStore();

    // Safety Refs
    const abortRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

    const cleanup = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        timeoutRef.current = null;
        intervalRef.current = null;
    };

    const handleStop = () => {
        if (abortRef.current) return;

        abortRef.current = true;
        cleanup();

        setSendingStatus({
            isSending: false,
            statusMessage: null
        });
        addLog('Envio interrompido pelo usuário.', 'warning');
    };

    const processQueue = async (index: number, recipients: Contact[], message: string, selectedFile: any | null) => {
        if (abortRef.current) return;

        if (index >= recipients.length) {
            setSendingStatus({ isSending: false, statusMessage: null, progress: 100, currentContactIndex: recipients.length });
            addLog('Transmissão completa!', 'success');
            return;
        }

        const contact = recipients[index];
        setSendingStatus({ currentContactIndex: index, progress: Math.round((index / recipients.length) * 100) });

        try {
            if (abortRef.current) return;
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

            if (abortRef.current) return;

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Falha ao enviar');
            }

            addLog(`Enviado para ${contact.name}`, 'success');

            const nextContact = recipients[index + 1];

            if (nextContact) {
                const delay = calculateSafetyDelay();
                const nextName = nextContact.name.split(' ')[0];

                let remaining = Math.ceil(delay / 1000);
                if (abortRef.current) return;

                setSendingStatus({ statusMessage: `Aguardando ${remaining}s para enviar para ${nextName}...` });

                intervalRef.current = setInterval(() => {
                    if (abortRef.current) {
                        cleanup();
                        return;
                    }
                    remaining -= 1;
                    if (remaining > 0) {
                        setSendingStatus({ statusMessage: `Aguardando ${remaining}s para enviar para ${nextName}...` });
                    }
                }, 1000);

                timeoutRef.current = setTimeout(() => {
                    cleanup(); // Clear interval before proceeding
                    if (!abortRef.current) {
                        processQueue(index + 1, recipients, message, selectedFile);
                    }
                }, delay);
            } else {
                processQueue(index + 1, recipients, message, selectedFile);
            }

        } catch (error) {
            if (abortRef.current) return;
            console.error(error);
            addLog(`Erro ao enviar para ${contact.name}: ${error}`, 'error');

            // Retry/Skip logic with delay
            timeoutRef.current = setTimeout(() => {
                if (!abortRef.current) {
                    processQueue(index + 1, recipients, message, selectedFile);
                }
            }, 5000);
        }
    };

    const handleSend = async (recipients: Contact[], message: string, selectedFile: any | null) => {
        if ((!message && !selectedFile) || recipients.length === 0) return;

        // Reset state
        abortRef.current = false;
        cleanup();

        setSendingStatus({ isSending: true, statusMessage: 'Iniciando transmissão...', progress: 0, currentContactIndex: 0 });
        processQueue(0, recipients, message, selectedFile);
    };

    return {
        handleSend,
        handleStop
    };
}

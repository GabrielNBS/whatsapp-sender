import { useState } from 'react';
import { FileData } from './use-send-form';
import { Contact } from '@/lib/types';

interface SchedulePayload {
    recipients: Contact[];
    message: string;
    media: FileData | null;
    scheduledFor: string;
    batchName: string;
    templateId: string | null;
}

interface UseScheduleMessagesOptions {
    onSuccess?: (data: unknown) => void;
    onError?: (error: Error) => void;
}

export function useScheduleMessages(options: UseScheduleMessagesOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutate = async (payload: SchedulePayload) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Falha ao agendar');
            }

            const data = await res.json();

            if (options.onSuccess) {
                options.onSuccess(data);
            }
            return data;

        } catch (err: unknown) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            if (options.onError) {
                options.onError(errorObj);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        mutate,
        isLoading,
        error
    };
}

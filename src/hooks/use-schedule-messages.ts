import { useState } from 'react';
import { FileData } from './use-send-form';
import { Contact } from '@/lib/types';
import { scheduleApi, ScheduleResult } from '@/services/schedules/scheduleApi';

interface SchedulePayload {
    recipients: Contact[];
    message: string;
    media: FileData | null;
    scheduledFor: string;
    batchName: string;
    templateId: string | null;
}

interface UseScheduleMessagesOptions {
    onSuccess?: (data: ScheduleResult) => void;
    onError?: (error: Error) => void;
}

export function useScheduleMessages(options: UseScheduleMessagesOptions = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutate = async (payload: SchedulePayload) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await scheduleApi.create(payload);

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

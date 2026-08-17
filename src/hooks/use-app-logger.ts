import { useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useAppStore } from '@/lib/store';
import { LogType } from '@/lib/types';

const SUCCESS_LOG_TTL_MS = 10 * 60 * 1000;

export function useAppLogger() {
  const storeAddLog = useAppStore((state) => state.addLog);

  return useCallback((message: string, type: LogType = 'info', expiresAt?: number) => {
    storeAddLog({
      id: nanoid(),
      message,
      type,
      timestamp: new Date(),
      expiresAt: expiresAt ?? (type === 'success' ? Date.now() + SUCCESS_LOG_TTL_MS : undefined),
    });
  }, [storeAddLog]);
}


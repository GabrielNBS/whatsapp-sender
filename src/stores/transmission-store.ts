import { create } from 'zustand';
import type { LogEntry, SendingStatus } from '@/lib/types';

export const INITIAL_SENDING_STATUS: SendingStatus = {
  isSending: false,
  progress: 0,
  currentContactIndex: 0,
  totalContacts: 0,
  statusMessage: null,
  failedContacts: [],
  stoppedByUser: false,
  isPaused: false,
  sentCount: 0,
  failedCount: 0,
};

interface TransmissionStore {
  logs: LogEntry[];
  sendingStatus: SendingStatus;
  addLog: (entry: LogEntry) => void;
  cleanupLogs: () => void;
  clearLogs: () => void;
  setSendingStatus: (status: Partial<SendingStatus>) => void;
  startSending: (totalContacts: number) => void;
  pauseSending: (statusMessage: string, status?: Partial<SendingStatus>) => void;
  finishSending: (status?: Partial<SendingStatus>) => void;
  resetSending: () => void;
}

export const useTransmissionStore = create<TransmissionStore>((set) => ({
  logs: [],
  sendingStatus: INITIAL_SENDING_STATUS,
  addLog: (entry) => set((state) => ({ logs: [entry, ...state.logs].slice(0, 100) })),
  cleanupLogs: () => set((state) => ({
    logs: state.logs.filter((log) => !log.expiresAt || log.expiresAt > Date.now()),
  })),
  clearLogs: () => set({ logs: [] }),
  setSendingStatus: (status) => set((state) => ({
    sendingStatus: { ...state.sendingStatus, ...status },
  })),
  startSending: (totalContacts) => set({
    sendingStatus: {
      ...INITIAL_SENDING_STATUS,
      isSending: true,
      totalContacts,
      statusMessage: 'Iniciando transmissão no servidor...',
    },
  }),
  pauseSending: (statusMessage, status = {}) => set((state) => ({
    sendingStatus: {
      ...state.sendingStatus,
      ...status,
      isSending: false,
      isPaused: true,
      stoppedByUser: true,
      statusMessage,
    },
  })),
  finishSending: (status = {}) => set((state) => ({
    sendingStatus: {
      ...state.sendingStatus,
      ...status,
      isSending: false,
      isPaused: false,
      progress: 100,
      currentContactIndex: status.currentContactIndex ?? status.totalContacts ?? state.sendingStatus.totalContacts,
    },
  })),
  resetSending: () => set({ sendingStatus: INITIAL_SENDING_STATUS }),
}));


import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { Group, Contact, LogEntry, Campaign } from './types';

interface AppState {
  groups: Group[];
  contacts: Contact[];
  
  addGroup: (name: string, description?: string) => void;
  deleteGroup: (id: string) => void;
  
  addContact: (name: string, number: string, groupIds?: string[]) => void;
  importContacts: (newContacts: Omit<Contact, 'id'>[]) => void;
  updateContactGroups: (contactId: string, groupIds: string[]) => void;
  deleteContact: (id: string) => void;
  
  getContactsByGroup: (groupId: string) => Contact[];

  // Persistent Logs & Status
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  cleanupLogs: () => void;
  clearLogs: () => void;
  
  sendingStatus: {
     isSending: boolean;
     progress: number;
     currentContactIndex: number;
     statusMessage: string | null;
  };
  setSendingStatus: (status: Partial<AppState['sendingStatus']>) => void;

  // History
  history: Campaign[];
  addCampaign: (campaign: Campaign) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      groups: [
         { id: 'default', name: 'Geral', description: 'Lista Padrão' }
      ],
      contacts: [],

      // Logs & Status Initial State
      logs: [],
      sendingStatus: {
          isSending: false,
          progress: 0,
          currentContactIndex: 0,
          statusMessage: null
      },
      
      history: [],

      addGroup: (name, description) => set((state) => ({
        groups: [...state.groups, { id: nanoid(), name, description }]
      })),

      deleteGroup: (id) => set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        contacts: state.contacts.map(c => ({
           ...c,
           groupIds: c.groupIds.filter(gid => gid !== id)
        }))
      })),

      addContact: (name, number, groupIds = ['default']) => set((state) => ({
        contacts: [...state.contacts, { id: nanoid(), name, number, groupIds }]
      })),

      importContacts: (newContacts) => set((state) => {
         const withIds = newContacts.map(c => ({ ...c, id: nanoid() }));
         return { contacts: [...state.contacts, ...withIds] };
      }),

      updateContactGroups: (contactId, groupIds) => set((state) => ({
         contacts: state.contacts.map((c) => 
            c.id === contactId ? { ...c, groupIds } : c
         )
      })),

      deleteContact: (id) => set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== id)
      })),
      
      getContactsByGroup: (groupId) => {
         const { contacts } = get();
         return contacts.filter(c => c.groupIds.includes(groupId));
      },

      addLog: (entry) => set((state) => ({
          logs: [entry, ...state.logs].slice(0, 100) // Keep last 100 logs
      })),

      cleanupLogs: () => set((state) => {
          const now = Date.now();
          return {
              logs: state.logs.filter(log => !log.expiresAt || log.expiresAt > now)
          };
      }),

      clearLogs: () => set({ logs: [] }),

      setSendingStatus: (status) => set((state) => ({
          sendingStatus: { ...state.sendingStatus, ...status }
      })),

      addCampaign: (campaign) => set((state) => ({
          history: [campaign, ...state.history].slice(0, 50) // Keep last 50 campaigns
      }))
    }),
    {
      name: 'whatsapp-sender-storage',
    }
  )
);

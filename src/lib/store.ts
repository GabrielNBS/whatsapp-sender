import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { Group, Contact, LogEntry, Campaign } from './types';

interface AppState {
  groups: Group[];
  contacts: Contact[];

  addGroup: (name: string, description?: string, customId?: string) => void;
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
    totalContacts: number;
    statusMessage: string | null;
  };
  setSendingStatus: (status: Partial<AppState['sendingStatus']>) => void;

  // History
  history: Campaign[];
  addCampaign: (campaign: Campaign) => void;

  // Avatar Cache
  avatars: Record<string, string | null>;
  fetchAvatar: (phone: string) => Promise<string | null>;
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
        totalContacts: 0,
        statusMessage: null
      },

      history: [],

      addGroup: (name, description, customId) => set((state) => ({
        groups: [...state.groups, { id: customId || nanoid(), name, description }]
      })),

      deleteGroup: (id) => set((state) => {
        if (id === 'default') return {}; // Prevent deleting default group

        return {
          groups: state.groups.filter((g) => g.id !== id),
          contacts: state.contacts.map(c => {
            const newGroupIds = c.groupIds.filter(gid => gid !== id);
            return {
              ...c,
              groupIds: newGroupIds.length > 0 ? newGroupIds : ['default']
            };
          })
        };
      }),

      addContact: (name, number, groupIds = ['default']) => set((state) => ({
        contacts: [...state.contacts, { id: nanoid(), name, number, groupIds: groupIds.length ? groupIds : ['default'] }]
      })),

      importContacts: (newContacts) => set((state) => {
        const withIds = newContacts.map(c => ({
          ...c,
          id: nanoid(),
          groupIds: c.groupIds && c.groupIds.length > 0 ? c.groupIds : ['default']
        }));
        return { contacts: [...state.contacts, ...withIds] };
      }),

      updateContactGroups: (contactId, groupIds) => set((state) => ({
        contacts: state.contacts.map((c) =>
          c.id === contactId ? { ...c, groupIds: groupIds.length > 0 ? groupIds : ['default'] } : c
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
      })),

      // Avatar Logic
      avatars: {},
      fetchAvatar: async (phone) => {
        const { avatars } = get();
        // Return cached if exists (undefined check because null is a valid "no avatar" state)
        if (avatars[phone] !== undefined) {
            return avatars[phone];
        }

        try {
            const res = await fetch(`/api/contacts/avatar?phone=${encodeURIComponent(phone)}`);
            if (res.ok) {
                const data = await res.json();
                const url = data.url || null;
                
                set((state) => ({
                    avatars: { ...state.avatars, [phone]: url }
                }));
                return url;
            }
        } catch (error) {
            console.error('Failed to fetch avatar', error);
        }

        // Cache failure as null to avoid retry loop in short term
        set((state) => ({
            avatars: { ...state.avatars, [phone]: null }
        }));
        return null;
      }
    }),
    {
      name: 'whatsapp-sender-storage',
    }
  )
);

export type { Contact, Group };

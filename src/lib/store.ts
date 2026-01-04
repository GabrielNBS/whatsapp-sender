import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

export interface Group {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  groupIds: string[];
}

interface AppState {
  groups: Group[];
  contacts: Contact[];
  
  addGroup: (name: string, description?: string) => void;
  deleteGroup: (id: string) => void;
  
  addContact: (name: string, number: string, groupIds?: string[]) => void;
  importContacts: (newContacts: Omit<Contact, 'id'>[]) => void;
  updateContactGroups: (contactId: string, groupIds: string[]) => void;
  deleteContact: (id: string) => void;
  
  // Helpers
  getContactsByGroup: (groupId: string) => Contact[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      groups: [
         { id: 'default', name: 'Geral', description: 'Lista Padrão' }
      ],
      contacts: [],

      addGroup: (name, description) => set((state) => ({
        groups: [...state.groups, { id: nanoid(), name, description }]
      })),

      deleteGroup: (id) => set((state) => ({
        groups: state.groups.filter((g) => g.id !== id),
        // Remove group from contacts? Or keep them group-less?
        // Let's remove the groupId from contacts
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
      }
    }),
    {
      name: 'whatsapp-sender-storage',
    }
  )
);

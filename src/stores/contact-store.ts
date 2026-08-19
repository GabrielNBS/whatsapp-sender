import { create } from 'zustand';
import { DEFAULT_GROUP_ID, DEFAULT_GROUP_NAME } from '@/constants/contacts';
import type { Contact, Group } from '@/lib/types';

interface ContactStore {
  groups: Group[];
  contacts: Contact[];
  replaceContactState: (groups: Group[], contacts: Contact[]) => void;
  upsertContacts: (contacts: Contact[]) => void;
  removeContactFromState: (contactId: string) => void;
  clearContactsFromState: () => void;
  upsertGroup: (group: Group) => void;
  removeGroupFromState: (groupId: string) => void;
}

const DEFAULT_GROUP: Group = {
  id: DEFAULT_GROUP_ID,
  name: DEFAULT_GROUP_NAME,
  description: 'Lista padrão',
};

export const useContactStore = create<ContactStore>((set) => ({
  groups: [DEFAULT_GROUP],
  contacts: [],
  replaceContactState: (groups, contacts) => set({
    groups: groups.length > 0 ? groups : [DEFAULT_GROUP],
    contacts,
  }),
  upsertContacts: (contacts) => set((state) => {
    const byId = new Map(state.contacts.map((contact) => [contact.id, contact]));
    for (const contact of contacts) byId.set(contact.id, contact);
    return { contacts: Array.from(byId.values()) };
  }),
  removeContactFromState: (contactId) => set((state) => ({
    contacts: state.contacts.filter((contact) => contact.id !== contactId),
  })),
  clearContactsFromState: () => set({ contacts: [] }),
  upsertGroup: (group) => set((state) => ({
    groups: state.groups.some((current) => current.id === group.id)
      ? state.groups.map((current) => current.id === group.id ? group : current)
      : [...state.groups, group],
  })),
  removeGroupFromState: (groupId) => set((state) => ({
    groups: state.groups.filter((group) => group.id !== groupId),
  })),
}));

export function selectContactsByGroup(contacts: Contact[], groupId: string) {
  return contacts.filter((contact) => contact.groupIds.includes(groupId));
}

export function selectEmptyNonDefaultGroups(groups: Group[], contacts: Contact[]) {
  return groups.filter(
    (group) => group.id !== DEFAULT_GROUP_ID && selectContactsByGroup(contacts, group.id).length === 0,
  );
}

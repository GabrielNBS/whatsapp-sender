import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import { Group, Contact, LogEntry, Campaign } from "./types";
import { normalizePhone } from "@/services/contacts/normalizePhone";
import { normalizeGroupIds } from '@/services/contacts/normalizeGroupIds';
import { avatarApi } from '@/services/contacts/avatarApi';

const DEFAULT_GROUP_ID = "default";
const AVATAR_CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeContactPayload(contact: Omit<Contact, "id">): Omit<Contact, "id"> {
  return {
    ...contact,
    name: contact.name.trim(),
    number: normalizePhone(contact.number),
    groupIds: normalizeGroupIds(contact.groupIds),
  };
}

interface AppState {
  groups: Group[];
  contacts: Contact[];
  replaceContactState: (groups: Group[], contacts: Contact[]) => void;
  upsertContacts: (contacts: Contact[]) => void;
  removeContactFromState: (contactId: string) => void;
  clearContactsFromState: () => void;
  upsertGroup: (group: Group) => void;
  removeGroupFromState: (groupId: string) => void;
  addGroup: (name: string, description?: string, customId?: string) => void;
  deleteGroup: (id: string) => void;
  addContact: (name: string, number: string, groupIds?: string[]) => void;
  importContacts: (newContacts: Omit<Contact, "id">[]) => void;
  clearContacts: () => void;
  updateContactGroups: (contactId: string, groupIds: string[]) => void;
  deleteContact: (id: string) => void;
  getContactsByGroup: (groupId: string) => Contact[];
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  cleanupLogs: () => void;
  clearLogs: () => void;
  sendingStatus: SendingStatus;
  setSendingStatus: (status: Partial<SendingStatus>) => void;
  startSending: (totalContacts: number) => void;
  pauseSending: (statusMessage: string, status?: Partial<SendingStatus>) => void;
  finishSending: (status?: Partial<SendingStatus>) => void;
  resetSending: () => void;
  history: Campaign[];
  addCampaign: (campaign: Campaign) => void;
  avatars: Record<string, string | null>;
  avatarFetchedAt: Record<string, number>;
  fetchAvatar: (phone: string) => Promise<string | null>;
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
}

export interface SendingStatus {
  isSending: boolean;
  progress: number;
  currentContactIndex: number;
  totalContacts: number;
  statusMessage: string | null;
  failedContacts: { name: string; number: string }[];
  stoppedByUser: boolean;
  isPaused: boolean;
  sentCount: number;
  failedCount: number;
}

const INITIAL_SENDING_STATUS: SendingStatus = {
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      groups: [{ id: DEFAULT_GROUP_ID, name: "Geral", description: "Lista Padr?o" }],
      contacts: [],
      logs: [],
      sendingStatus: INITIAL_SENDING_STATUS,
      history: [],
      avatars: {},
      avatarFetchedAt: {},
      devMode: false,

      replaceContactState: (groups, contacts) => set({
        groups: groups.length > 0 ? groups : [{ id: DEFAULT_GROUP_ID, name: "Geral", description: "Lista Padrao" }],
        contacts,
      }),

      upsertContacts: (contacts) => set((state) => {
        const byId = new Map(state.contacts.map((contact) => [contact.id, contact]));
        contacts.forEach((contact) => byId.set(contact.id, contact));
        return { contacts: Array.from(byId.values()) };
      }),

      removeContactFromState: (contactId) => set((state) => ({
        contacts: state.contacts.filter((contact) => contact.id !== contactId),
      })),

      clearContactsFromState: () => set({ contacts: [] }),

      upsertGroup: (group) => set((state) => {
        const exists = state.groups.some((current) => current.id === group.id);
        return { groups: exists
          ? state.groups.map((current) => current.id === group.id ? group : current)
          : [...state.groups, group] };
      }),

      removeGroupFromState: (groupId) => set((state) => ({
        groups: state.groups.filter((group) => group.id !== groupId),
      })),

      addGroup: (name, description, customId) => set((state) => {
        const normalizedName = name.trim();
        if (!normalizedName) {
          return state;
        }

        const alreadyExists = state.groups.some((group) => group.name.trim().toLowerCase() === normalizedName.toLowerCase());
        if (alreadyExists) {
          return state;
        }

        return {
          groups: [...state.groups, { id: customId || nanoid(), name: normalizedName, description }],
        };
      }),

      deleteGroup: (id) => set((state) => {
        if (id === DEFAULT_GROUP_ID) return state;

        return {
          groups: state.groups.filter((group) => group.id !== id),
          contacts: state.contacts.map((contact) => {
            const newGroupIds = contact.groupIds.filter((groupId) => groupId !== id);
            return {
              ...contact,
              groupIds: normalizeGroupIds(newGroupIds),
            };
          }),
        };
      }),

      addContact: (name, number, groupIds = [DEFAULT_GROUP_ID]) => set((state) => {
        const contact = normalizeContactPayload({ name, number, groupIds });
        if (!contact.number) {
          return state;
        }

        const alreadyExists = state.contacts.some((existing) => normalizePhone(existing.number) === contact.number);
        if (alreadyExists) {
          return state;
        }

        return {
          contacts: [...state.contacts, { id: nanoid(), ...contact }],
        };
      }),

      importContacts: (newContacts) => set((state) => {
        const existingNumbers = new Set(state.contacts.map((contact) => normalizePhone(contact.number)));
        const contactsToAdd: Contact[] = [];

        for (const contact of newContacts) {
          const normalized = normalizeContactPayload(contact);
          if (!normalized.number || existingNumbers.has(normalized.number)) {
            continue;
          }

          existingNumbers.add(normalized.number);
          contactsToAdd.push({ id: nanoid(), ...normalized });
        }

        return { contacts: [...state.contacts, ...contactsToAdd] };
      }),

      clearContacts: () => set({ contacts: [] }),

      updateContactGroups: (contactId, groupIds) => set((state) => ({
        contacts: state.contacts.map((contact) =>
          contact.id === contactId
            ? { ...contact, groupIds: normalizeGroupIds(groupIds) }
            : contact
        ),
      })),

      deleteContact: (id) => set((state) => ({
        contacts: state.contacts.filter((contact) => contact.id !== id),
      })),

      getContactsByGroup: (groupId) => get().contacts.filter((contact) => contact.groupIds.includes(groupId)),

      addLog: (entry) => set((state) => ({
        logs: [entry, ...state.logs].slice(0, 100),
      })),

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

      addCampaign: (campaign) => set((state) => ({
        history: [campaign, ...state.history].slice(0, 50),
      })),

      fetchAvatar: async (phone) => {
        const normalizedPhone = normalizePhone(phone);
        const { avatars, avatarFetchedAt } = get();
        const cachedAt = avatarFetchedAt[normalizedPhone] ?? 0;
        const cacheValid = cachedAt > 0 && Date.now() - cachedAt < AVATAR_CACHE_TTL_MS;

        if (cacheValid && avatars[normalizedPhone] !== undefined) {
          return avatars[normalizedPhone];
        }

        try {
          const data = await avatarApi.get(normalizedPhone);
          const url = data.url || null;
          set((state) => ({
            avatars: { ...state.avatars, [normalizedPhone]: url },
            avatarFetchedAt: { ...state.avatarFetchedAt, [normalizedPhone]: Date.now() },
          }));
          return url;
        } catch (error) {
          console.error("Failed to fetch avatar", error);
        }

        set((state) => ({
          avatars: { ...state.avatars, [normalizedPhone]: null },
          avatarFetchedAt: { ...state.avatarFetchedAt, [normalizedPhone]: Date.now() },
        }));
        return null;
      },

      setDevMode: (enabled) => set({ devMode: enabled }),
    }),
    {
      name: "whatsapp-sender-storage",
      partialize: (state) => {
        const transientKeys = new Set(["sendingStatus", "logs", "avatars", "avatarFetchedAt"]);
        return Object.fromEntries(
          Object.entries(state).filter(([key]) => !transientKeys.has(key))
        ) as Partial<AppState>;
      },
    }
  )
);

export type { Contact, Group };

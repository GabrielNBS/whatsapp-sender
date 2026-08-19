import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesStore {
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      devMode: false,
      setDevMode: (devMode) => set({ devMode }),
    }),
    {
      name: 'whatsapp-sender-preferences:v2',
      version: 2,
      partialize: ({ devMode }) => ({ devMode }),
    },
  ),
);


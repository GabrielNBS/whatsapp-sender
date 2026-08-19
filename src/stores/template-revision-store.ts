import { create } from 'zustand';

interface TemplateRevisionStore {
  revision: number;
  markChanged: () => void;
}

export const useTemplateRevisionStore = create<TemplateRevisionStore>((set) => ({
  revision: 0,
  markChanged: () => set((state) => ({ revision: state.revision + 1 })),
}));

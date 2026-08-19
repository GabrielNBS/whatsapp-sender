import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TemplateFilterType } from '@/types/templates';

interface TemplateFilterStore {
  filter: TemplateFilterType;
  selectedCategory: string | null;
  setFilter: (filter: TemplateFilterType) => void;
  setSelectedCategory: (selectedCategory: string | null) => void;
  clear: () => void;
}

export const useTemplateFilterStore = create<TemplateFilterStore>()(
  persist(
    (set) => ({
      filter: 'all',
      selectedCategory: null,
      setFilter: (filter) => set({ filter }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      clear: () => set({ filter: 'all', selectedCategory: null }),
    }),
    {
      name: 'template-filters:v2',
      version: 2,
      partialize: ({ filter, selectedCategory }) => ({ filter, selectedCategory }),
    },
  ),
);

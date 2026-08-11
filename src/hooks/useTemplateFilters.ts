import { useState, useMemo, useSyncExternalStore } from 'react';
import { Template, TemplateFilterType } from '@/types/templates';

const LOCAL_STORAGE_FILTER_KEY = 'templates-filter-type';
const LOCAL_STORAGE_CAT_KEY = 'templates-filter-category';
const FILTERS_CHANGED_EVENT = 'template-filters-changed';

function subscribeToStoredFilters(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(FILTERS_CHANGED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(FILTERS_CHANGED_EVENT, onStoreChange);
  };
}

function getStoredFilter(): TemplateFilterType {
  const saved = localStorage.getItem(LOCAL_STORAGE_FILTER_KEY);
  return saved === 'media' || saved === 'text' ? saved : 'all';
}

function notifyStoredFiltersChanged() {
  window.dispatchEvent(new Event(FILTERS_CHANGED_EVENT));
}

export function useTemplateFilters(templates: Template[]) {
  const filter = useSyncExternalStore<TemplateFilterType>(
    subscribeToStoredFilters,
    getStoredFilter,
    () => 'all',
  );
  const selectedCategory = useSyncExternalStore(
    subscribeToStoredFilters,
    () => localStorage.getItem(LOCAL_STORAGE_CAT_KEY),
    () => null,
  );
  const [searchTerm, setSearchTerm] = useState('');

  const changeFilter = (type: TemplateFilterType) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FILTER_KEY, type);
      notifyStoredFiltersChanged();
    } catch {}
  };

  const changeCategory = (category: string | null) => {
    try {
      if (category) {
        localStorage.setItem(LOCAL_STORAGE_CAT_KEY, category);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_CAT_KEY);
      }
      notifyStoredFiltersChanged();
    } catch {}
  };

  const clearFilters = () => {
    setSearchTerm('');
    try {
      localStorage.removeItem(LOCAL_STORAGE_FILTER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_CAT_KEY);
      notifyStoredFiltersChanged();
    } catch {}
  };

  // Memoiza a extração de categorias normalizadas disponíveis (PERF-001 e FILTER-001)
  const categories = useMemo(() => {
    const rawCats = templates
      .map((t) => t.category)
      .filter((cat): cat is string => typeof cat === 'string' && cat.trim().length > 0);
    
    // Remove duplicidades e ordena alfabeticamente
    return Array.from(new Set(rawCats)).sort();
  }, [templates]);

  // Memoiza a filtragem dos templates por tipo, categoria e busca textual (PERF-002 e FILTER-002)
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      // 1. Filtro por tipo (mídia ou texto)
      if (filter === 'media' && !t.parsedMedia) return false;
      if (filter === 'text' && t.parsedMedia) return false;

      // 2. Filtro por categoria
      if (selectedCategory && t.category !== selectedCategory) return false;

      // 3. Filtro por busca textual (título ou conteúdo)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(term);
        const matchesContent = t.content.toLowerCase().includes(term);
        if (!matchesTitle && !matchesContent) return false;
      }

      return true;
    });
  }, [templates, filter, selectedCategory, searchTerm]);

  return {
    filter,
    setFilter: changeFilter,
    selectedCategory,
    setSelectedCategory: changeCategory,
    searchTerm,
    setSearchTerm,
    categories,
    filteredTemplates,
    clearFilters,
  };
}
export default useTemplateFilters;

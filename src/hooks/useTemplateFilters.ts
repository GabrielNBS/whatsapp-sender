import { useState, useMemo } from 'react';
import type { Template } from '@/types/templates';
import { useTemplateFilterStore } from '@/stores/template-filter-store';

export function useTemplateFilters(templates: Template[]) {
  const filter = useTemplateFilterStore((state) => state.filter);
  const selectedCategory = useTemplateFilterStore((state) => state.selectedCategory);
  const changeFilter = useTemplateFilterStore((state) => state.setFilter);
  const changeCategory = useTemplateFilterStore((state) => state.setSelectedCategory);
  const clearStoredFilters = useTemplateFilterStore((state) => state.clear);
  const [searchTerm, setSearchTerm] = useState('');

  const clearFilters = () => {
    setSearchTerm('');
    clearStoredFilters();
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

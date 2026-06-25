import { useState, useMemo, useEffect } from 'react';
import { Template, TemplateFilterType } from '@/types/templates';

const LOCAL_STORAGE_FILTER_KEY = 'templates-filter-type';
const LOCAL_STORAGE_CAT_KEY = 'templates-filter-category';

export function useTemplateFilters(templates: Template[]) {
  const [filter, setFilter] = useState<TemplateFilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Carrega os filtros salvos do localStorage na montagem (STATE-004)
  useEffect(() => {
    try {
      const savedFilter = localStorage.getItem(LOCAL_STORAGE_FILTER_KEY);
      if (savedFilter === 'all' || savedFilter === 'media' || savedFilter === 'text') {
        setFilter(savedFilter as TemplateFilterType);
      }

      const savedCategory = localStorage.getItem(LOCAL_STORAGE_CAT_KEY);
      if (savedCategory) {
        setSelectedCategory(savedCategory);
      }
    } catch {}
  }, []);

  // Salva no localStorage quando os filtros mudam
  const changeFilter = (type: TemplateFilterType) => {
    setFilter(type);
    try {
      localStorage.setItem(LOCAL_STORAGE_FILTER_KEY, type);
    } catch {}
  };

  const changeCategory = (category: string | null) => {
    setSelectedCategory(category);
    try {
      if (category) {
        localStorage.setItem(LOCAL_STORAGE_CAT_KEY, category);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_CAT_KEY);
      }
    } catch {}
  };

  const clearFilters = () => {
    setFilter('all');
    setSelectedCategory(null);
    setSearchTerm('');
    try {
      localStorage.removeItem(LOCAL_STORAGE_FILTER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_CAT_KEY);
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

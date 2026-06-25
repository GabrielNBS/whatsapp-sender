import { TemplateFilterType } from '@/types/templates';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

interface TemplateFiltersProps {
  filter: TemplateFilterType;
  onFilterChange: (type: TemplateFilterType) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  onClearFilters: () => void;
}

export function TemplateFilters({
  filter,
  onFilterChange,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  categories,
  onClearFilters,
}: TemplateFiltersProps) {
  const hasActiveFilters = filter !== 'all' || selectedCategory !== null || searchTerm.trim() !== '';

  return (
    <div className="space-y-4">
      {/* 1. Busca textual */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Pesquisar por título ou conteúdo..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:bg-white dark:focus-visible:bg-zinc-950 transition-all h-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-zinc-400 hover:text-zinc-600 hover:bg-transparent"
            onClick={() => onSearchChange('')}
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 2. Filtros de tipo e categorias */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {/* Filtros de Tipo */}
          <button
            onClick={() => onFilterChange('all')}
            aria-pressed={filter === 'all'}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap cursor-pointer",
              filter === 'all'
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            )}
          >
            Todos
          </button>
          
          <button
            onClick={() => onFilterChange('media')}
            aria-pressed={filter === 'media'}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap cursor-pointer",
              filter === 'media'
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            )}
          >
            Mídia
          </button>
          
          <button
            onClick={() => onFilterChange('text')}
            aria-pressed={filter === 'text'}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap cursor-pointer",
              filter === 'text'
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            )}
          >
            Texto
          </button>

          {categories.length > 0 && (
            <>
              {/* Divisor */}
              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0" />

              {/* Filtros de Categoria */}
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(selectedCategory === cat ? null : cat)}
                  aria-pressed={selectedCategory === cat}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                    selectedCategory === cat
                      ? "bg-zinc-800 dark:bg-zinc-200 border-zinc-800 dark:border-zinc-200 text-white dark:text-zinc-900"
                      : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  )}
                >
                  {cat}
                </button>
              ))}
            </>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs h-8 text-zinc-400 hover:text-red-500 hover:bg-transparent px-2 ml-auto"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
export default TemplateFilters;

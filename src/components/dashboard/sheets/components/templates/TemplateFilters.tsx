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
          aria-label="Pesquisar modelos"
          placeholder="Pesquisar por título ou conteúdo..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-muted/30 pl-9 pr-11"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              "min-h-10 whitespace-nowrap rounded-lg border px-4 text-sm font-medium",
              filter === 'all'
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Todos
          </button>
          
          <button
            onClick={() => onFilterChange('media')}
            aria-pressed={filter === 'media'}
            className={cn(
              "min-h-10 whitespace-nowrap rounded-lg border px-4 text-sm font-medium",
              filter === 'media'
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Mídia
          </button>
          
          <button
            onClick={() => onFilterChange('text')}
            aria-pressed={filter === 'text'}
            className={cn(
              "min-h-10 whitespace-nowrap rounded-lg border px-4 text-sm font-medium",
              filter === 'text'
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
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
                    "flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3.5 text-sm font-medium",
                    selectedCategory === cat
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
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
              className="ml-auto h-10 px-3 text-sm text-muted-foreground hover:text-destructive"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
export default TemplateFilters;

import { useState, useMemo, useEffect } from 'react';
import { Template } from '@/types/templates';
import { TemplateCard } from './TemplateCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TEMPLATES_PER_PAGE } from '@/constants/templates';

interface TemplateGridProps {
  templates: Template[];
  deletingIds: Record<string, boolean>;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: Template) => void;
  onCopy: (content: string) => void;
}

export function TemplateGrid({
  templates,
  deletingIds,
  onEdit,
  onDelete,
  onDuplicate,
  onCopy,
}: TemplateGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.ceil(templates.length / TEMPLATES_PER_PAGE) || 1;
  }, [templates.length]);

  // Corrige página órfã se a lista encolher
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Reseta paginação quando o tamanho do array muda (busca/filtros aplicados)
  useEffect(() => {
    setCurrentPage(1);
  }, [templates.length]);

  const startIndex = (currentPage - 1) * TEMPLATES_PER_PAGE;
  const endIndex = startIndex + TEMPLATES_PER_PAGE;
  const paginatedTemplates = useMemo(() => {
    return templates.slice(startIndex, endIndex);
  }, [templates, startIndex, endIndex]);

  return (
    <div className="space-y-6 flex-1 flex flex-col justify-between min-h-0">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onCopy={onCopy}
            isDeleting={!!deletingIds[template.id]}
          />
        ))}
      </div>

      {/* Controles de Paginação (PERF-006) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-2xl shrink-0 mt-4">
          <span className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, templates.length)} de {templates.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Página anterior de modelos"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-12 text-center">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Próxima página de modelos"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
export default TemplateGrid;

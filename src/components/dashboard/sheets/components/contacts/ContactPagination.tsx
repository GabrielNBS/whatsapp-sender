import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContactPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalFiltered: number;
  onPageChange: (page: number | ((prev: number) => number)) => void;
}

export function ContactPagination({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalFiltered,
  onPageChange,
}: ContactPaginationProps) {
  return (
    <div className="flex items-center justify-between p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
      <span className="text-sm text-muted-foreground">
        Mostrando {totalFiltered > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalFiltered)} de {totalFiltered}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium min-w-12 text-center">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

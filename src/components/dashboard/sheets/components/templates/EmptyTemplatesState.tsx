import { FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyTemplatesStateProps {
  isFiltered: boolean;
  onClearFilters?: () => void;
}

export function EmptyTemplatesState({
  isFiltered,
  onClearFilters,
}: EmptyTemplatesStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
        <FileText className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {isFiltered ? 'Nenhum modelo corresponde aos filtros' : 'Nenhum modelo encontrado'}
      </h3>
      <p className="text-sm text-muted-foreground dark:text-zinc-500 mt-1 max-w-[280px]">
        {isFiltered
          ? 'Tente ajustar sua busca ou remova os filtros ativos para ver outros modelos.'
          : 'Crie um novo modelo para começar a enviar mensagens padronizadas.'}
      </p>
      
      {isFiltered && onClearFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="mt-4 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
        >
          <X className="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}
export default EmptyTemplatesState;

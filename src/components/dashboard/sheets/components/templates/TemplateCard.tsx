import { memo } from 'react';
import { Template } from '@/types/templates';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Megaphone, Copy, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TemplateMediaPreview } from './TemplateMediaPreview';
import { TemplatePreview } from './TemplatePreview';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: Template) => void;
  onCopy: (content: string) => void;
  isDeleting: boolean;
}

// Usamos memo para evitar re-renderizações desnecessárias de cards estáticos (PERF-005)
export const TemplateCard = memo(function TemplateCard({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onCopy,
  isDeleting,
}: TemplateCardProps) {
  const hasMedia = !!template.parsedMedia;

  return (
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xs bg-white dark:bg-zinc-950 rounded-[20px] flex flex-col p-0 gap-0">
      {/* Seção de Mídia */}
      <TemplateMediaPreview
        media={template.parsedMedia}
        templateTitle={template.title}
      />

      <CardContent className="p-4 flex-1 flex flex-col gap-4">
        {/* Cabeçalho */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              hasMedia 
                ? "bg-orange-50 dark:bg-orange-950/20 text-orange-500 dark:text-orange-400" 
                : "bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400"
            )}
          >
            {hasMedia ? <Megaphone className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-base">
              {template.title}
            </h3>
            <p className="text-xs text-muted-foreground dark:text-zinc-500">
              {template.createdAt}
            </p>
          </div>
        </div>

        {/* Pré-visualização do Conteúdo */}
        <TemplatePreview content={template.content} />

        {/* Rodapé com Ações (A11Y-002) */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"
              onClick={() => onCopy(template.content)}
              aria-label={`Copiar texto do modelo: ${template.title}`}
            >
              <Copy className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg"
              onClick={() => onDuplicate(template)}
              aria-label={`Duplicar modelo: ${template.title}`}
            >
              <div className="relative">
                <Copy className="h-4 w-4" />
                <Plus className="h-2 w-2 absolute -bottom-1 -right-1 bg-white dark:bg-zinc-950 rounded-full text-green-600 dark:text-green-500" />
              </div>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg"
              onClick={() => onEdit(template)}
              aria-label={`Editar modelo: ${template.title}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
              onClick={() => onDelete(template.id)}
              disabled={isDeleting}
              aria-label={`Excluir modelo: ${template.title}`}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
export default TemplateCard;

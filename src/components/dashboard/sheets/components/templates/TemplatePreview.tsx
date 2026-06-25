import { useMemo } from 'react';
import { parseTemplateVariables } from '@/services/templates/parseTemplateVariables';
import { cn } from '@/lib/utils';

interface TemplatePreviewProps {
  content: string;
}

export function TemplatePreview({ content }: TemplatePreviewProps) {
  const tokens = useMemo(() => parseTemplateVariables(content), [content]);

  if (!content) {
    return <span className="text-zinc-400 italic">Sem conteúdo na mensagem.</span>;
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-3.5 text-sm text-zinc-700 dark:text-zinc-350 leading-relaxed font-normal break-words line-clamp-3">
      {tokens.map((token, index) => {
        if (token.type === 'variable') {
          return (
            <span
              key={index}
              className={cn(
                "px-1 py-0.5 rounded text-xs font-semibold select-none",
                token.isValid
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/55 dark:border-indigo-900/30"
                  : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100/55 dark:border-red-900/30"
              )}
              title={token.isValid ? 'Variável válida' : 'Variável desconhecida/não suportada'}
            >
              {token.value}
            </span>
          );
        }
        return <span key={index}>{token.value}</span>;
      })}
    </div>
  );
}
export default TemplatePreview;

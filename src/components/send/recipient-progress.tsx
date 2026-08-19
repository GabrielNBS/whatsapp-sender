import { Check, Clock3, Loader2, UserRound, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecipientBatch } from '@/hooks/use-send-form';

interface RecipientProgressProps {
  batches: RecipientBatch[];
  completedRecipients: number;
}

export function RecipientProgress({
  batches,
  completedRecipients,
}: RecipientProgressProps) {
  if (batches.length === 0) return null;

  const activeBatchIndex = batches.findIndex(
    (batch) => batch.recipients.length > 0 && completedRecipients < batch.endIndex,
  );
  const nextBatchIndex = activeBatchIndex >= 0
    ? batches.findIndex(
        (batch, index) => index > activeBatchIndex && batch.recipients.length > 0,
      )
    : -1;

  return (
    <section
      aria-label="Ordem e progresso dos destinatários"
      aria-live="polite"
      className="w-full rounded-xl border border-border/60 bg-card/80 p-3 text-left shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            Ordem de envio
          </p>
          <p className="text-xs font-medium text-foreground">
            {batches.length} {batches.length === 1 ? 'etapa selecionada' : 'etapas selecionadas'}
          </p>
        </div>
        {activeBatchIndex >= 0 && (
          <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            Etapa {activeBatchIndex + 1} de {batches.length}
          </span>
        )}
      </div>

      <div className="premium-scrollbar max-h-36 space-y-1 overflow-y-auto pr-1">
        {batches.map((batch, index) => {
          const recipientCount = batch.recipients.length;
          const isEmpty = recipientCount === 0;
          const isCompleted = isEmpty || completedRecipients >= batch.endIndex;
          const isActive = index === activeBatchIndex;
          const isNext = index === nextBatchIndex;
          const completedInBatch = isCompleted
            ? recipientCount
            : Math.max(0, Math.min(recipientCount, completedRecipients - batch.startIndex));
          const statusLabel = isEmpty
            ? 'Sem novos contatos'
            : isCompleted
              ? 'Enviado'
              : isActive
                ? 'Em envio'
                : isNext
                  ? 'Próximo'
                  : 'Na fila';

          return (
            <div
              key={`${batch.type}:${batch.id}`}
              className={cn(
                'flex items-center gap-3 rounded-lg border px-2.5 py-2 transition-colors',
                isActive && 'border-primary/30 bg-primary/5',
                isCompleted && !isEmpty && 'border-success/20 bg-success/5',
                !isActive && (!isCompleted || isEmpty) && 'border-border/40 bg-muted/20',
              )}
            >
              <div
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                  isActive && 'border-primary bg-primary text-primary-foreground',
                  isCompleted && !isEmpty && 'border-success bg-success text-success-foreground',
                  !isActive && (!isCompleted || isEmpty) && 'border-border bg-background text-muted-foreground',
                )}
              >
                {isCompleted && !isEmpty ? <Check className="size-3.5" /> : index + 1}
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                {batch.type === 'group'
                  ? <Users className="size-3.5 shrink-0 text-muted-foreground" />
                  : <UserRound className="size-3.5 shrink-0 text-muted-foreground" />}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-foreground">{batch.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {completedInBatch}/{recipientCount} {recipientCount === 1 ? 'contato' : 'contatos'}
                  </p>
                </div>
              </div>

              <div className={cn(
                'flex shrink-0 items-center gap-1 text-xs font-semibold',
                isActive && 'text-primary',
                isCompleted && !isEmpty && 'text-success',
                !isActive && (!isCompleted || isEmpty) && 'text-muted-foreground',
              )}>
                {isActive && <Loader2 className="size-3 animate-spin" />}
                {isNext && <Clock3 className="size-3" />}
                {statusLabel}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

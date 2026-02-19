'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <ErrorState
        title="Erro no Painel"
        description="Não foi possível carregar esta seção do dashboard."
        resetAction={reset}
        showHomeButton={false}
        minHeight="min-h-[300px]"
      />
      
      <div className="mt-4 p-4 bg-muted/30 rounded-lg max-w-lg w-full overflow-auto">
        <p className="text-xs font-mono text-muted-foreground break-all">
          Detalhes técnicos: {error.message}
          {error.digest && <span className="block mt-1">Digest: {error.digest}</span>}
        </p>
      </div>
    </div>
  );
}

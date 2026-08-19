'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Erro no painel" description={error.message || 'Não foi possível carregar esta seção do painel.'} resetAction={reset} showHomeButton={false} minHeight="min-h-[70vh]" />;
}

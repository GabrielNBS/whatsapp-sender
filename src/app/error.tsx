'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState description={error.message || 'Encontramos um problema inesperado ao processar sua solicitação.'} resetAction={reset} minHeight="min-h-screen" />;
}

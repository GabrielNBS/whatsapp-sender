'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <ErrorState
        title="Ops! Algo deu errado."
        description={error.message || "Encontramos um problema inesperado."}
        resetAction={reset}
        showHomeButton={true}
      />
    </div>
  );
}

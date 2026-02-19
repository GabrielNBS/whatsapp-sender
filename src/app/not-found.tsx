import { ErrorState } from '@/components/ui/error-state';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <ErrorState
        title="Página não encontrada"
        description="A rota que você tentou acessar não existe ou foi movida."
        showHomeButton={true}
        minHeight="min-h-[400px]"
      />
    </div>
  );
}

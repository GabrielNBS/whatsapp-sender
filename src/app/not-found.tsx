import { ErrorState } from '@/components/ui/error-state';

export default function NotFound() {
  return (
    <ErrorState
      title="Página não encontrada"
      description="A página que você tentou acessar não existe ou foi movida."
      minHeight="min-h-screen"
    />
  );
}

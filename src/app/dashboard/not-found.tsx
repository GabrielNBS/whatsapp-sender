import { ErrorState } from '@/components/ui/error-state';

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <ErrorState
        title="Seção não encontrada"
        description="Esta página do painel não existe. Verifique o endereço ou use o menu lateral para navegar."
        showHomeButton={false}
        minHeight="min-h-[300px]"
      />
    </div>
  );
}

import { QrDisplay as QrDisplayContent } from '@/components/qr-display';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorState } from '@/components/ui/error-state';
import { PersonalAuthGate } from '@/components/personal-auth-gate';

export function QrDisplay() {
  return (
    <ErrorBoundary
      fallback={
        <div className="w-full max-w-sm mx-auto p-4 border rounded-lg bg-card">
            <ErrorState 
                title="Erro no QR Code" 
                description="Falha ao carregar o componente de conexão."
                showHomeButton={false}
                minHeight="min-h-[200px]"
            />
        </div>
      }
    >
      <QrDisplayContent />
    </ErrorBoundary>
  );
}


export default function Home() {
  return (
    <PersonalAuthGate><main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <QrDisplay />
      <div className="mt-8 text-xs text-muted-foreground max-w-sm text-center">
        Use a automação com responsabilidade. Respeite os limites para evitar restrições na conta.
      </div>
    </main></PersonalAuthGate>
  );
}

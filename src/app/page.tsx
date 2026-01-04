import { QrDisplay } from '@/components/qr-display';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <div className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-slate-900">
          Envio WhatsApp
        </h1>
        <p className="text-lg text-slate-600">
          Gerencie suas listas e envie atualizações facilmente.
        </p>
      </div>
      
      <QrDisplay />
      
      <div className="mt-8 text-xs text-slate-400 max-w-sm text-center">
        Use a automação com responsabilidade. Respeite os limites para evitar restrições na conta.
      </div>
    </main>
  );
}

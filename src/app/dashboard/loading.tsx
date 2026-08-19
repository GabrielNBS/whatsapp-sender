import { LogoLoader } from '@/components/logo-loader';

export default function DashboardLoading() {
  return (
    <main className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_45%)]" />
      <LogoLoader className="relative z-10" label="Carregando seu painel" />
    </main>
  );
}

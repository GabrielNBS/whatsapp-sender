'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogoLoader } from '@/components/logo-loader';

export function PersonalAuthGate({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('unauthorized');
        if (active) setIsAuthorized(true);
      })
      .catch(() => router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`));
    return () => { active = false; };
  }, [pathname, router]);

  if (!isAuthorized) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_45%)]" />
        <LogoLoader className="relative z-10" label="Verificando seu acesso" />
      </main>
    );
  }

  return <>{children}</>;
}

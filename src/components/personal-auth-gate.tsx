'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

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
    return <main className="flex min-h-screen items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" aria-label="Verificando acesso" /></main>;
  }

  return <>{children}</>;
}

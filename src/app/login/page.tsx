'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function LoginForm() {
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Nao foi possivel entrar.');
      const next = searchParams.get('next');
      router.replace(next?.startsWith('/') ? next : '/');
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Nao foi possivel entrar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <BrandLogo className="mx-auto h-8 w-auto" compact />
          <CardTitle>Acessar Regula Send</CardTitle>
          <CardDescription>Informe a chave definida em APP_ACCESS_TOKEN para abrir sua central de envios.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input aria-label="Chave de acesso" autoComplete="current-password" minLength={32} onChange={(event) => setToken(event.target.value)} required type="password" value={token} />
            {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-muted/20" />}>
      <LoginForm />
    </Suspense>
  );
}

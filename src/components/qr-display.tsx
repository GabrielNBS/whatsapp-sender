'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QrDisplay() {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('initializing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/qr');
        const data = await res.json();
        
        // Update state
        setQr(data.qr);
        setStatus(data.status.status);
        setIsAuthenticated(data.status.isAuthenticated);

        // Redirect if authenticated
        if (data.status.isAuthenticated) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to fetch status', error);
      }
    };

    fetchStatus();
    intervalId = setInterval(fetchStatus, 3000); // Poll every 3s

    return () => clearInterval(intervalId);
  }, [router]);

  if (isAuthenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Autenticado!</AlertTitle>
            <AlertDescription className="text-green-700">
              Redirecionando para o dashboard...
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Login WhatsApp</CardTitle>
        <CardDescription>Abra o WhatsApp no seu celular e escaneie o código QR</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-6 space-y-6">
        <div className="relative flex items-center justify-center w-64 h-64 bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200">
          {qr ? (
             <QRCodeSVG value={qr} size={256} level="L" includeMargin={true} />
          ) : (
            <div className="flex flex-col items-center text-slate-400 animate-pulse">
               {status === 'INITIALIZING' ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin mb-2" />
                    <span>Iniciando Cliente...</span>
                  </>
               ) : (
                  <>
                     <Loader2 className="w-10 h-10 animate-spin mb-2" />
                     <span>Aguardando QR Code...</span>
                  </>
               )}
            </div>
          )}
        </div>
        
        <div className="text-sm text-center text-slate-500">
          <p>Status: <span className="font-mono font-medium text-slate-700">{status}</span></p>
        </div>
      </CardContent>
    </Card>
  );
}

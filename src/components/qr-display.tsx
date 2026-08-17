'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { qrApi } from '@/services/connection/qrApi';

const QR_GRID_SIZE = 29;

function isFinderModule(row: number, column: number) {
  const finders = [[0, 0], [0, QR_GRID_SIZE - 7], [QR_GRID_SIZE - 7, 0]];

  return finders.some(([top, left]) => {
    const localRow = row - top;
    const localColumn = column - left;
    const isInside = localRow >= 0 && localRow < 7 && localColumn >= 0 && localColumn < 7;
    return isInside && (
      localRow === 0 || localRow === 6 || localColumn === 0 || localColumn === 6 ||
      (localRow >= 2 && localRow <= 4 && localColumn >= 2 && localColumn <= 4)
    );
  });
}

const placeholderModules = Array.from({ length: QR_GRID_SIZE ** 2 }, (_, index) => {
  const row = Math.floor(index / QR_GRID_SIZE);
  const column = index % QR_GRID_SIZE;
  const seed = (row * 37 + column * 19 + row * column * 11) % 101;

  return {
    id: index,
    isDark: isFinderModule(row, column) || seed < 44,
    fillOrder: (row * 17 + column * 29 + row * column * 7) % 101,
  };
});

export function QrDisplay() {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('INITIALIZING');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [placeholderProgress, setPlaceholderProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await qrApi.getStatus();
        
        // Update state
        setQr(data.qr);
        setStatus(data.status.status);
        setIsAuthenticated(data.status.isAuthenticated);
        setConnectionError(data.status.error);

        // Redirect if authenticated
        if (data.status.isAuthenticated) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to fetch status', error);
      }
    };

    fetchStatus();
    const intervalId = setInterval(fetchStatus, 1000);

    return () => clearInterval(intervalId);
  }, [router]);

  useEffect(() => {
    if (qr || connectionError) return;

    const intervalId = window.setInterval(() => {
      setPlaceholderProgress((current) => current >= 100 ? 0 : current + 5);
    }, 55);

    return () => clearInterval(intervalId);
  }, [connectionError, qr]);

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
        <div className="relative flex items-center justify-center w-64 h-64 bg-white rounded-lg overflow-hidden border-2 border-emerald-100">
          {qr ? (
             <QRCodeSVG value={qr} size={256} level="L" includeMargin={true} />
          ) : (
            <div
              aria-label="Preparando codigo QR"
              className="grid h-full w-full gap-px bg-emerald-50 p-3"
              style={{ gridTemplateColumns: `repeat(${QR_GRID_SIZE}, minmax(0, 1fr))` }}
            >
              {placeholderModules.map((module) => (
                <span
                  key={module.id}
                  className={module.isDark
                    ? module.fillOrder <= placeholderProgress
                      ? 'bg-emerald-600 transition-colors duration-150'
                      : 'bg-emerald-100 transition-colors duration-150'
                    : 'bg-white'}
                />
              ))}
            </div>
          )}
        </div>

        {connectionError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível gerar o QR Code</AlertTitle>
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        )}
        
        <div className="text-sm text-center text-slate-500">
          <p>Status: <span className="font-mono font-medium text-slate-700">{status}</span></p>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { qrApi } from '@/services/connection/qrApi';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';

import { QrIllustration } from './qr-illustration';
import { BrandLogo } from './brand-logo';

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
  const reduceMotion = useReducedMotion();
  const statusLabel: Record<string, string> = {
    INITIALIZING: 'Preparando conexão',
    CONNECTED: 'WhatsApp conectado',
    READY: 'WhatsApp conectado',
    AUTHENTICATED: 'Sincronizando WhatsApp',
    DISCONNECTED: 'WhatsApp desconectado',
    QR_READY: 'Código QR pronto',
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await qrApi.getStatus();
        
        setQr(data.qr);
        setStatus(data.status.status);
        setIsAuthenticated(data.status.isAuthenticated);
        setConnectionError(data.status.error);

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
    if (qr || connectionError || reduceMotion) return;

    const intervalId = window.setInterval(() => {
      setPlaceholderProgress((current) => current >= 100 ? 0 : current + 5);
    }, 55);

    return () => clearInterval(intervalId);
  }, [connectionError, qr, reduceMotion]);

  if (isAuthenticated) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto relative z-50"
      >
        <Card className="relative overflow-hidden border-success/30 bg-card shadow-lg">
          <div className="absolute inset-0 bg-linear-to-br from-success/20 to-transparent pointer-events-none" />
          <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center space-y-4">
            <motion.div
              initial={reduceMotion ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <CheckCircle2 className="w-20 h-20 text-success" />
            </motion.div>
            <h2 className="text-center text-2xl font-bold text-foreground">
              Autenticado com sucesso
            </h2>
            <p className="text-muted-foreground text-center">
              Redirecionando para o seu dashboard...
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[80vh] gap-8 relative z-10 py-10"
    >
      {/* Header */}
      <motion.div 
        initial={reduceMotion ? false : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full text-center px-4"
      >
        <BrandLogo animateIntro className="mx-auto mb-8 h-10 w-auto sm:h-12" />
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-md mx-auto">
          Conecte o WhatsApp para começar a enviar com a Regula Send. No celular, vá em <span className="font-semibold text-foreground">Aparelhos Conectados</span> e escaneie o código.
        </p>
      </motion.div>

      {/* SVG Container */}
      <motion.div 
        initial={reduceMotion ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative mx-auto aspect-square w-full max-w-[34rem] drop-shadow-lg"
      >
        <QrIllustration>
          <AnimatePresence mode="wait">
            {qr ? (
              <motion.div
                key="qr-ready"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ type: 'spring', damping: 20 }}
                className="w-full h-full p-1.5"
              >
                <QRCodeSVG value={qr} className="w-full h-full" level="L" includeMargin={true} />
              </motion.div>
            ) : (
              <motion.div
                key="qr-loading"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-label="Preparando codigo QR"
                className="w-full h-full relative" 
              >
                <div className="grid h-full w-full gap-px bg-success/5 p-1 absolute inset-0"
                     style={{ gridTemplateColumns: `repeat(${QR_GRID_SIZE}, minmax(0, 1fr))` }}>
                  {placeholderModules.map((module) => (
                    <span
                      key={module.id}
                      className={module.isDark
                        ? module.fillOrder <= placeholderProgress
                          ? 'bg-success/80 rounded-[1px]'
                          : 'bg-success/20 rounded-[1px]'
                        : 'bg-transparent'}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="bg-white/90 dark:bg-zinc-900/90 p-1.5 rounded-full shadow-md border border-border/50">
                    <Zap className={reduceMotion ? 'h-3.5 w-3.5 text-warning' : 'h-3.5 w-3.5 animate-pulse text-warning'} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </QrIllustration>
      </motion.div>

      {/* Footer Status */}
      <motion.div 
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col items-center gap-4 w-full max-w-md px-4"
      >
        {connectionError && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 backdrop-blur-md shadow-sm w-full">
            <AlertTitle className="font-semibold">Erro de Conexão</AlertTitle>
            <AlertDescription className="text-sm opacity-90">{connectionError}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-sm" role="status" aria-live="polite">
          <span className="relative flex h-3 w-3">
            {!reduceMotion ? <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${status === 'CONNECTED' ? 'bg-success' : 'bg-warning'}`} /> : null}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${status === 'CONNECTED' ? 'bg-success' : 'bg-warning'}`}></span>
          </span>
          <p className="text-sm font-medium text-foreground">
            {statusLabel[status] ?? 'Verificando conexão'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

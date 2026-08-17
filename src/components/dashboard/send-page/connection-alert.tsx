'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectionAlertProps {
  onConnect: () => void;
}

export function ConnectionAlert({ onConnect }: ConnectionAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 mt-2 flex max-w-xl flex-col items-center justify-between gap-3 rounded-xl bg-amber-50 p-3 shadow-md shadow-amber-900/20 dark:bg-amber-950/20 sm:mx-auto sm:mt-4 sm:flex-row sm:gap-4 sm:p-4"
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 rounded-full bg-amber-100 p-2 dark:bg-amber-900/50">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900 dark:text-amber-400">WhatsApp Desconectado</p>
          <p className="text-xs text-amber-700 dark:text-amber-500">Conecte seu dispositivo para habilitar os disparos.</p>
        </div>
      </div>
      <Button size="sm" onClick={onConnect} className="bg-amber-600">
        <QrCode className="mr-2 h-4 w-4" />
        Conectar
      </Button>
    </motion.div>
  );
}

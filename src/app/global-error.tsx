'use client';

import { ErrorState } from '@/components/ui/error-state';
import './globals.css';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}>
        <div className="flex h-screen w-full items-center justify-center">
            <ErrorState
                title="Erro Crítico no Sistema"
                description={error.message || "Ocorreu um erro fatal que impediu o carregamento da aplicação."}
                resetAction={reset}
                showHomeButton={false}
                minHeight="min-h-screen"
            />
        </div>
      </body>
    </html>
  );
}

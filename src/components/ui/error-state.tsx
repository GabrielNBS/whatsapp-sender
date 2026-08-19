'use client';

import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

interface ErrorStateProps {
  title?: string;
  description?: string;
  retryAction?: () => void;
  resetAction?: () => void;
  showHomeButton?: boolean;
  minHeight?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Ocorreu um erro inesperado ao processar sua solicitação.',
  retryAction,
  resetAction,
  showHomeButton = true,
  minHeight = 'min-h-[400px]',
}: ErrorStateProps) {
  const handleRetry = () => {
    if (retryAction) retryAction();
    if (resetAction) resetAction();
  };

  return (
    <div className={`flex items-center justify-center w-full p-6 ${minHeight}`}>
      <Card className="w-full max-w-md border-destructive/20 shadow-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>
            Se o erro persistir, entre em contato com o suporte ou verifique os logs do console.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {showHomeButton && (
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Início
              </Link>
            </Button>
          )}
          
          {(retryAction || resetAction) && (
            <Button onClick={handleRetry} variant="default">
              <RefreshCcw className="w-4 h-4 mr-2" />
                Tentar novamente
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

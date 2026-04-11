'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function useSendPageInitialStep(): number {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStep = useMemo(() => {
    return searchParams?.get('step') === '3' ? 3 : 0;
  }, [searchParams]);

  useEffect(() => {
    if (searchParams?.get('step') === '3') {
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  return initialStep;
}

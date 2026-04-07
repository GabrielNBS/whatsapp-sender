'use client';

import { useEffect, useState } from 'react';

export function useRotatingIndex(totalItems: number, intervalMs: number): number {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (totalItems <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentIndex((previousIndex) => (previousIndex + 1) % totalItems);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [intervalMs, totalItems]);

  return currentIndex;
}

'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextType {
  isNavigating: boolean;
  targetPath: string | null;
  startNavigation: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  targetPath: null,
  startNavigation: () => {},
});

export function useNavigation() {
  return useContext(NavigationContext);
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [targetPath, setTargetPath] = useState<string | null>(null);

  const startNavigation = useCallback((path: string) => {
    if (path !== pathname) {
      setTargetPath(path);
    }
  }, [pathname]);

  const activeTargetPath = targetPath && targetPath !== pathname ? targetPath : null;
  const isNavigating = activeTargetPath !== null;

  return (
    <NavigationContext.Provider value={{ isNavigating, targetPath: activeTargetPath, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

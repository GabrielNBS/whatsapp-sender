'use client';

import { createContext, useContext, useState, useTransition, useCallback, useEffect, useRef } from 'react';
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
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const prevPathname = useRef(pathname);

  const startNavigation = useCallback((path: string) => {
    if (path !== pathname) {
      setIsNavigating(true);
      setTargetPath(path);
    }
  }, [pathname]);

  // When the pathname changes, navigation is complete
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsNavigating(false);
      setTargetPath(null);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return (
    <NavigationContext.Provider value={{ isNavigating, targetPath, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type SheetType = 'templates' | 'contacts' | 'history' | 'overview' | 'settings' | null;

interface GlobalSheetContextType {
  activeSheet: SheetType;
  openSheet: (sheet: SheetType) => void;
  closeSheet: () => void;
}

const GlobalSheetContext = createContext<GlobalSheetContextType | undefined>(undefined);

export function GlobalSheetProvider({ children }: { children: ReactNode }) {
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);

  const openSheet = (sheet: SheetType) => {
    setActiveSheet(sheet);
  };

  const closeSheet = () => {
    setActiveSheet(null);
  };

  return (
    <GlobalSheetContext.Provider value={{ activeSheet, openSheet, closeSheet }}>
      {children}
    </GlobalSheetContext.Provider>
  );
}

export function useGlobalSheet() {
  const context = useContext(GlobalSheetContext);
  if (context === undefined) {
    throw new Error('useGlobalSheet must be used within a GlobalSheetProvider');
  }
  return context;
}

'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type SheetType = 'templates' | 'contacts' | 'history' | 'overview' | 'settings' | 'monitoring' | null;

interface GlobalSheetContextType {
  activeSheet: SheetType;
  sheetData: Record<string, unknown> | null;
  openSheet: (sheet: SheetType, data?: Record<string, unknown>) => void;
  closeSheet: () => void;
}

const GlobalSheetContext = createContext<GlobalSheetContextType | undefined>(undefined);

export function GlobalSheetProvider({ children }: { children: ReactNode }) {
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [sheetData, setSheetData] = useState<Record<string, unknown> | null>(null);

  const openSheet = (sheet: SheetType, data?: Record<string, unknown>) => {
    setSheetData(data || null);
    setActiveSheet(sheet);
  };

  const closeSheet = () => {
    setActiveSheet(null);
    setSheetData(null);
  };

  return (
    <GlobalSheetContext.Provider value={{ activeSheet, sheetData, openSheet, closeSheet }}>
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

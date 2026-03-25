'use client';

import { 
  Sheet, 
  SheetContent, 
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useGlobalSheet } from "./global-sheet-provider";
import { ContactsSheetContent } from "./sheets/contacts-sheet-content";
import { TemplatesSheetContent } from "./sheets/templates-sheet-content";
import { HistorySheetContent } from "./sheets/history-sheet-content";
import { SettingsSheetContent } from "./sheets/settings-sheet-content";
import { OverviewSheetContent } from "./sheets/overview-sheet-content";

export function GlobalSheet() {
  const { activeSheet, closeSheet } = useGlobalSheet();

  return (
    <Sheet open={activeSheet !== null} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent side="right" className="w-full sm:w-[40%] sm:max-w-none overflow-y-auto border-l border-border bg-background shadow-2xl">
        <div className="sr-only">
          <SheetTitle>{activeSheet ? `Painel de ${activeSheet}` : 'Painel Lateral'}</SheetTitle>
          <SheetDescription>Gerenciamento de {activeSheet || 'recursos'}</SheetDescription>
        </div>
        {activeSheet === 'contacts' && <ContactsSheetContent />}
        {activeSheet === 'templates' && <TemplatesSheetContent />}
        {activeSheet === 'history' && <HistorySheetContent />}
        {activeSheet === 'settings' && <SettingsSheetContent />}
        {activeSheet === 'overview' && <OverviewSheetContent />}
      </SheetContent>
    </Sheet>
  );
}

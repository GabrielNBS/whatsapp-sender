'use client';

import { 
  Sheet, 
  SheetContent, 
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useGlobalSheet } from "./global-sheet-provider";
import { ContactsSheetContent } from "@/components/dashboard/sheets/contacts-sheet-content";
import { TemplatesSheetContent } from "@/components/dashboard/sheets/templates-sheet-content";
import { HistorySheetContent } from "@/components/dashboard/sheets/history-sheet-content";
import { SettingsSheetContent } from "@/components/dashboard/sheets/settings-sheet-content";
import { OverviewSheetContent } from "@/components/dashboard/sheets/overview-sheet-content";

import { MonitoringSheetContent } from "@/components/dashboard/sheets/monitoring-sheet-content";

export function GlobalSheet() {
  const { activeSheet, closeSheet } = useGlobalSheet();

  return (
    <Sheet open={activeSheet !== null} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent 
        side="right" 
        className={cn(
          "w-full sm:max-w-none overflow-y-auto border-l border-border bg-background shadow-2xl p-8 transition-all duration-500",
          activeSheet === 'monitoring' ? "sm:w-[640px]" : "sm:w-[40vw]"
        )}
      >
        <div className="sr-only">
          <SheetTitle>{activeSheet ? `Painel de ${activeSheet}` : 'Painel Lateral'}</SheetTitle>
          <SheetDescription>Gerenciamento de {activeSheet || 'recursos'}</SheetDescription>
        </div>
        {activeSheet === 'contacts' && <ContactsSheetContent />}
        {activeSheet === 'templates' && <TemplatesSheetContent />}
        {activeSheet === 'history' && <HistorySheetContent />}
        {activeSheet === 'settings' && <SettingsSheetContent />}
        {activeSheet === 'overview' && <OverviewSheetContent />}
        {activeSheet === 'monitoring' && <MonitoringSheetContent />}
      </SheetContent>
    </Sheet>
  );
}

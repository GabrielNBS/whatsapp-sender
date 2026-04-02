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

import { useMediaQuery } from "@/hooks/use-media-query";

export function GlobalSheet() {
  const { activeSheet, closeSheet } = useGlobalSheet();
  const isDesktop = useMediaQuery("(min-width: 640px)"); 

  return (
    <Sheet open={activeSheet !== null} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent 
        side={isDesktop ? "right" : "bottom"} 
        className={cn(
          "w-full overflow-y-auto bg-background shadow-2xl transition-all duration-500",
          !isDesktop ? "h-[90vh] rounded-t-2xl border-t border-border p-6" : "border-l border-border p-8",
          activeSheet === 'monitoring' ? "sm:w-[60vw] sm:max-w-none" : "sm:w-[60vw] sm:max-w-none"
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

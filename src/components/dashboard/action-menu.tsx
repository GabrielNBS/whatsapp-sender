'use client';

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Users, History, FileText, Settings, LayoutDashboard } from "lucide-react";
import { useGlobalSheet } from "./global-sheet-provider";
import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";

export function ActionMenu() {
  const { openSheet } = useGlobalSheet();
  const [open, setOpen] = useState(false);
  const isHydrated = useHydrated();

  const handleAction = (sheet: 'templates' | 'contacts' | 'history' | 'overview' | 'settings') => {
    openSheet(sheet);
    setOpen(false);
  };

  if (!isHydrated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            size="lg" 
            className="h-14 rounded-full px-6 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold flex items-center gap-2 bg-primary text-primary-foreground"
          >
           Configurações <Plus className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-45' : ''}`} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          align="end" 
          sideOffset={16} 
          className="w-56 p-2 rounded-2xl shadow-xl border-border/50"
        >
          <div className="flex flex-col gap-1">
            <Button variant="ghost" className="justify-start font-medium" onClick={() => handleAction('templates')}>
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              Criar template
            </Button>
            <Button variant="ghost" className="justify-start font-medium" onClick={() => handleAction('contacts')}>
              <Users className="w-4 h-4 mr-2 text-emerald-500" />
              Contatos
            </Button>
            <Button variant="ghost" className="justify-start font-medium" onClick={() => handleAction('history')}>
              <History className="w-4 h-4 mr-2 text-indigo-500" />
              Histórico
            </Button>
            <Button variant="ghost" className="justify-start font-medium" onClick={() => handleAction('overview')}>
              <LayoutDashboard className="w-4 h-4 mr-2 text-amber-500" />
              Visão geral
            </Button>
            <div className="h-px bg-border/50 my-1 mx-2" />
            <Button variant="ghost" className="justify-start font-medium text-muted-foreground" onClick={() => handleAction('settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

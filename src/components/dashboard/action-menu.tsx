'use client';

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users, History, FileText, Settings, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useGlobalSheet } from "./global-sheet-provider";
import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

import { motion } from "framer-motion";

export function ActionMenu() {
  const { openSheet } = useGlobalSheet();
  const [open, setOpen] = useState(false);
  const isHydrated = useHydrated();

  const handleAction = (sheet: 'templates' | 'contacts' | 'history' | 'overview' | 'settings' | 'consent-audit') => {
    openSheet(sheet);
    setOpen(false);
  };

  if (!isHydrated) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="icon" 
          aria-label="Abrir menu de ações"
          title="Ações"
          className={cn(
              "size-10 rounded-lg border-none bg-primary text-primary-foreground shadow-none transition-colors hover:bg-primary/90",
              open && "ring-3 ring-primary/20"
          )}
        >
          <motion.div
              animate={{ rotate: open ? 90 : 0 }}
              whileHover={{ rotate: 45 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-center justify-center w-full h-full"
          >
              <Settings className="w-6 h-6" />
          </motion.div>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        sideOffset={12} 
        className="w-56 rounded-xl border-border bg-popover p-2 shadow-lg"
      >
        <div className="flex flex-col gap-1">
          <Button variant="ghost" className="justify-start font-medium" onClick={() => handleAction('templates')}>
            <FileText className="mr-2 size-4 text-primary" />
            Criar template
          </Button>
          <Button variant="ghost" className="justify-start font-medium" onClick={() => handleAction('contacts')}>
            <Users className="mr-2 size-4 text-primary" />
            Contatos
          </Button>
          <Button variant="ghost" className="justify-start font-medium" onClick={() => handleAction('consent-audit')}>
            <ShieldCheck className="mr-2 size-4 text-primary" />
            Consentimento
          </Button>
          <Button variant="ghost" className="justify-start font-medium" onClick={() => handleAction('history')}>
            <History className="mr-2 size-4 text-primary" />
            Histórico
          </Button>
          <Button variant="ghost" className="justify-start font-medium" onClick={() => handleAction('overview')}>
            <LayoutDashboard className="mr-2 size-4 text-primary" />
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
  );
}

'use client';

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users, History, FileText, Settings, LayoutDashboard } from "lucide-react";
import { useGlobalSheet } from "./global-sheet-provider";
import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

import { motion } from "framer-motion";

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          size="icon" 
          className={cn(
              "h-14 w-14 sm:h-12 sm:w-12 rounded-full shadow-2xl hover:shadow-primary/40 transition-all duration-300 bg-neutral-900 text-white border-none group relative overflow-hidden",
              open && "ring-4 ring-primary/20 scale-95"
          )}
        >
          <motion.div
              animate={{ rotate: open ? 90 : 0 }}
              whileHover={{ rotate: 120 }}
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
        className="w-56 p-2 rounded-2xl shadow-2xl border-border/50 bg-card/95 backdrop-blur-md"
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
  );
}

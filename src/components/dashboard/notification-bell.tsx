"use client";

import { useAppStore } from "@/lib/store";
import { useScheduler } from "@/hooks/use-scheduler";
import { useGlobalSheet } from "./global-sheet-provider";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";

export function NotificationBell() {
    const { isSending, totalContacts } = useAppStore((s) => s.sendingStatus);
    const { activeSchedules } = useScheduler();
    const { openSheet } = useGlobalSheet();
    const isHydrated = useHydrated();

    if (!isHydrated) return null;

    const isActive = isSending && totalContacts > 0;
    const pendingCount = activeSchedules.length;

    return (
        <div className="fixed top-6 right-22 z-40">
            <Button
                size="icon"
                variant="ghost"
                onClick={() => openSheet('monitoring')}
                className="h-12 w-12 rounded-full bg-card/80 backdrop-blur-md border border-border shadow-xl hover:shadow-primary/20 hover:bg-card transition-all group relative"
            >
                <Bell className={cn(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                )} />

                {/* Live Badge */}
                <AnimatePresence>
                    {isActive ? (
                        <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute -top-1 -right-1 flex h-4 min-w-[24px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-white shadow-lg shadow-primary/30"
                        >
                            LIVE
                        </motion.span>
                    ) : pendingCount > 0 ? (
                        <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 border border-border text-[10px] font-bold text-white shadow-lg"
                        >
                            {pendingCount}
                        </motion.span>
                    ) : null}
                </AnimatePresence>

                {/* Animated Ring (Pulse) when active */}
                {isActive && (
                    <motion.span
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border border-primary/40 pointer-events-none"
                    />
                )}
            </Button>
        </div>
    );
}

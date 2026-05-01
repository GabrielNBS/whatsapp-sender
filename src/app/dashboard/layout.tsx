'use client';

import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { NavigationProvider } from '@/hooks/use-navigation';
import { GlobalSheetProvider } from '@/components/dashboard/global-sheet-provider';
import { GlobalSheet } from '@/components/dashboard/global-sheet';
import { Suspense } from "react";
import { ActionMenu } from '@/components/dashboard/action-menu';
import { TransmissionPill } from '@/components/dashboard/transmission-pill';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { useSendPolling } from '@/hooks/use-send-polling';
import { useAppStore } from '@/lib/store';
import { DebugTransmissionMenu } from '@/components/dashboard/debug-transmission-menu';

function PollingManager() {
  useSendPolling();
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const devMode = useAppStore(state => state.devMode);

  return (
    <NavigationProvider>
      <DashboardShell>
        <GlobalSheetProvider>
          <div className="flex h-screen bg-muted/20 relative">
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-7xl h-full">
                <DashboardContent>
                  {children}
                </DashboardContent>
              </div>
            </main>
            <div className="fixed top-6 right-6 z-40 flex flex-col gap-3">
              <NotificationBell />
              <ActionMenu />
            </div>
            <GlobalSheet />
            <TransmissionPill />
            <PollingManager />
            {devMode && <DebugTransmissionMenu />}
          </div>
        </GlobalSheetProvider>
      </DashboardShell>
    </NavigationProvider>
  );
}

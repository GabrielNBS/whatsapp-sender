'use client';

import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { NavigationProvider } from '@/hooks/use-navigation';
import { GlobalSheetProvider } from '@/components/dashboard/global-sheet-provider';
import { GlobalSheet } from '@/components/dashboard/global-sheet';
import { ActionMenu } from '@/components/dashboard/action-menu';
import { TransmissionPill } from '@/components/dashboard/transmission-pill';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { useSendPolling } from '@/hooks/use-send-polling';
import { useSchedulePolling } from '@/hooks/use-schedule-polling';
import { useContactHydration } from '@/hooks/use-contact-hydration';
import { useAppStore } from '@/lib/store';
import { DebugTransmissionMenu } from '@/components/dashboard/debug-transmission-menu';

function PollingManager() {
  useContactHydration();
  useSendPolling();
  useSchedulePolling();
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
          <div className="flex h-dvh min-h-0 overflow-hidden bg-muted/20 relative">
            <main className="min-w-0 flex-1 overflow-auto overscroll-contain">
              <div className="container mx-auto h-full min-h-0 max-w-7xl p-3 sm:p-4 lg:p-6">
                <DashboardContent>
                  {children}
                </DashboardContent>
              </div>
            </main>
            <div className="fixed right-3 top-3 z-40 flex flex-col gap-2 sm:right-4 sm:top-4 sm:gap-3 lg:right-6 lg:top-6">
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

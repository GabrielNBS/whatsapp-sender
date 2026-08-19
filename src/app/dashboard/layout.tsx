'use client';

import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { NavigationProvider } from '@/hooks/use-navigation';
import { GlobalSheetProvider } from '@/components/dashboard/global-sheet-provider';
import { GlobalSheet } from '@/components/dashboard/global-sheet';
import { TransmissionPill } from '@/components/dashboard/transmission-pill';
import { useSendPolling } from '@/hooks/use-send-polling';
import { useSchedulePolling } from '@/hooks/use-schedule-polling';
import { useContactHydration } from '@/hooks/use-contact-hydration';
import { usePreferencesStore } from '@/stores/preferences-store';
import { DebugTransmissionMenu } from '@/components/dashboard/debug-transmission-menu';
import { PersonalAuthGate } from '@/components/personal-auth-gate';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { sonnerFeedback } from '@/presentation/feedback';

function PollingManager() {
  useContactHydration();
  useSendPolling(sonnerFeedback);
  useSchedulePolling(sonnerFeedback);
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const devMode = usePreferencesStore(state => state.devMode);

  return (
    <PersonalAuthGate><NavigationProvider>
      <DashboardShell>
        <GlobalSheetProvider>
          <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-background">
            <DashboardHeader />
            <main className="min-w-0 flex-1 overflow-auto overscroll-contain">
              <div className="container mx-auto h-full min-h-0 max-w-7xl p-3 sm:p-4 lg:p-6">
                <DashboardContent>
                  {children}
                </DashboardContent>
              </div>
            </main>
            <GlobalSheet />
            <TransmissionPill />
            <PollingManager />
            {devMode && <DebugTransmissionMenu />}
          </div>
        </GlobalSheetProvider>
      </DashboardShell>
    </NavigationProvider></PersonalAuthGate>
  );
}

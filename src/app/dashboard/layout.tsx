'use client';

import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { NavigationProvider } from '@/hooks/use-navigation';
import { GlobalSheetProvider } from '@/components/dashboard/global-sheet-provider';
import { GlobalSheet } from '@/components/dashboard/global-sheet';
import { ActionMenu } from '@/components/dashboard/action-menu';
import { useSendPolling } from '@/hooks/use-send-polling';

function PollingManager() {
  useSendPolling();
  return null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <DashboardShell>
        <GlobalSheetProvider>
          <div className="flex h-screen bg-muted/20 relative">
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto p-6 md:p-8 max-w-7xl h-full">
                <DashboardContent>
                  {children}
                </DashboardContent>
              </div>
            </main>
            <ActionMenu />
            <GlobalSheet />
            <PollingManager />
          </div>
        </GlobalSheetProvider>
      </DashboardShell>
    </NavigationProvider>
  );
}

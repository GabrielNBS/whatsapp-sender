import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { NavigationProvider } from '@/hooks/use-navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <DashboardShell>
        <div className="flex h-screen bg-muted/20">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 md:p-8 max-w-7xl">
              <DashboardContent>
                {children}
              </DashboardContent>
            </div>
          </main>
        </div>
      </DashboardShell>
    </NavigationProvider>
  );
}

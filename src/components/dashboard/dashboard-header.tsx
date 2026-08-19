'use client';

import Link from 'next/link';
import { BarChart3, Megaphone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ActionMenu } from '@/components/dashboard/action-menu';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { BrandLogo } from '@/components/brand-logo';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/dashboard', label: 'Campanha', icon: Megaphone },
  { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart3 },
];

export function DashboardHeader() {
  const pathname = usePathname();

  return (
    <header className="z-40 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 sm:px-4 lg:px-6">
        <Link href="/dashboard" aria-label="Ir para a campanha" className="shrink-0 rounded-lg">
          <BrandLogo className="h-7 w-auto" compact />
        </Link>

        <nav aria-label="Navegação principal" className="ml-auto flex items-center gap-1 sm:ml-6">
          {navigationItems.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 border-l border-border pl-2 sm:ml-auto">
          <NotificationBell />
          <ActionMenu />
        </div>
      </div>
    </header>
  );
}

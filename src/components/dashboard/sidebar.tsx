'use client';

import Link from 'next/link';
import DeveloperTag from '@/components/developer-tag';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Send,
  Settings,
  LogOut,
  FileText,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/hooks/use-navigation';

const navItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/contacts', label: 'Contatos', icon: Users },
  { href: '/dashboard/send', label: 'Envios', icon: Send },
  { href: '/dashboard/templates', label: 'Modelos', icon: FileText },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isNavigating, targetPath, startNavigation } = useNavigation();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Falha ao sair', error);
    }
  };

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    if (href === pathname) return; // Already on this page
    startNavigation(href);
    router.push(href);
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xl font-bold flex items-center gap-2 text-sidebar-foreground">
          <Send className="w-6 h-6 text-primary" />
          Whatsender
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const isLoadingThis = isNavigating && targetPath === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                isLoadingThis && "opacity-70"
              )}
            >
              {isLoadingThis ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Icon className="w-5 h-5" />
              )}
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border space-y-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
        <DeveloperTag isExpanded={true} />
      </div>
    </div>
  );
}

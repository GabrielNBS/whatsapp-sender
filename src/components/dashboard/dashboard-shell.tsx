'use client';

import { useSendPolling } from '@/hooks/use-send-polling';
import { SendProgressTooltip } from '@/components/dashboard/send-progress-tooltip';


export function DashboardShell({ children }: { children: React.ReactNode }) {
  useSendPolling();

  return (
    <>
      {children}
      <SendProgressTooltip />
    </>
  );
}

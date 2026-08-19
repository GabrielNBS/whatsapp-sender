import { create } from 'zustand';
import type { ScheduledCampaignOverlay } from '@/lib/types';

interface DebugSimulationCommand {
  step: number | null;
  forceScreen: string | null;
  scheduledOverlay: ScheduledCampaignOverlay | null;
}

interface DebugSimulationStore extends DebugSimulationCommand {
  revision: number;
  apply: (command: Partial<DebugSimulationCommand>) => void;
}

export const useDebugSimulationStore = create<DebugSimulationStore>((set) => ({
  revision: 0,
  step: null,
  forceScreen: null,
  scheduledOverlay: null,
  apply: (command) => set((state) => ({
    step: command.step ?? null,
    forceScreen: command.forceScreen ?? null,
    scheduledOverlay: command.scheduledOverlay ?? null,
    revision: state.revision + 1,
  })),
}));

import type { GroupColor } from '@/lib/types';

export const GROUP_COLOR_STYLES: Record<GroupColor, {
  icon: string;
  badge: string;
  swatch: string;
}> = {
  slate: {
    icon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200',
    badge: 'border-slate-200 bg-slate-100/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200',
    swatch: 'bg-slate-500 ring-slate-500/20',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-950/70 dark:text-blue-300',
    badge: 'border-blue-200 bg-blue-100/80 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200',
    swatch: 'bg-blue-500 ring-blue-500/20',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-600 dark:bg-violet-950/70 dark:text-violet-300',
    badge: 'border-violet-200 bg-violet-100/80 text-violet-700 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200',
    swatch: 'bg-violet-500 ring-violet-500/20',
  },
  pink: {
    icon: 'bg-pink-100 text-pink-600 dark:bg-pink-950/70 dark:text-pink-300',
    badge: 'border-pink-200 bg-pink-100/80 text-pink-700 dark:border-pink-800 dark:bg-pink-950/60 dark:text-pink-200',
    swatch: 'bg-pink-500 ring-pink-500/20',
  },
  orange: {
    icon: 'bg-orange-100 text-orange-600 dark:bg-orange-950/70 dark:text-orange-300',
    badge: 'border-orange-200 bg-orange-100/80 text-orange-700 dark:border-orange-800 dark:bg-orange-950/60 dark:text-orange-200',
    swatch: 'bg-orange-500 ring-orange-500/20',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    badge: 'border-amber-200 bg-amber-100/80 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
    swatch: 'bg-amber-500 ring-amber-500/20',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300',
    badge: 'border-emerald-200 bg-emerald-100/80 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200',
    swatch: 'bg-emerald-500 ring-emerald-500/20',
  },
  cyan: {
    icon: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/70 dark:text-cyan-300',
    badge: 'border-cyan-200 bg-cyan-100/80 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-200',
    swatch: 'bg-cyan-500 ring-cyan-500/20',
  },
};

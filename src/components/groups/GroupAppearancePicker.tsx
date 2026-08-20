'use client';

import { Check } from 'lucide-react';
import { GROUP_COLORS, GROUP_ICONS } from '@/constants/group-appearance';
import type { GroupColor, GroupIcon } from '@/lib/types';
import { cn } from '@/lib/utils';
import { GroupIcon as GroupIconComponent } from './GroupIcon';
import { GROUP_COLOR_STYLES } from './group-appearance';

const COLOR_LABELS: Record<GroupColor, string> = {
  slate: 'Cinza',
  blue: 'Azul',
  violet: 'Violeta',
  pink: 'Rosa',
  orange: 'Laranja',
  amber: 'Âmbar',
  emerald: 'Esmeralda',
  cyan: 'Ciano',
};

const ICON_LABELS: Record<GroupIcon, string> = {
  users: 'Pessoas',
  briefcase: 'Trabalho',
  heart: 'Favoritos',
  star: 'Destaques',
  'shopping-bag': 'Compras',
  megaphone: 'Divulgação',
  'graduation-cap': 'Educação',
  house: 'Casa',
  'party-popper': 'Eventos',
  plane: 'Viagens',
  dumbbell: 'Fitness',
  tag: 'Etiqueta',
};

interface GroupAppearancePickerProps {
  color: GroupColor;
  icon: GroupIcon;
  onColorChange: (color: GroupColor) => void;
  onIconChange: (icon: GroupIcon) => void;
}

export function GroupAppearancePicker({
  color,
  icon,
  onColorChange,
  onIconChange,
}: GroupAppearancePickerProps) {
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">Cor da tag</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Cores disponíveis">
          {GROUP_COLORS.map((option) => {
            const isSelected = option === color;
            return (
              <button
                key={option}
                type="button"
                aria-label={`Usar cor ${COLOR_LABELS[option]}`}
                aria-pressed={isSelected}
                onClick={() => onColorChange(option)}
                className={cn(
                  'flex size-9 items-center justify-center rounded-full ring-offset-background transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  GROUP_COLOR_STYLES[option].swatch,
                  isSelected && 'ring-4',
                )}
              >
                {isSelected && <Check className="size-4 text-white" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">Ícone</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="group" aria-label="Ícones disponíveis">
          {GROUP_ICONS.map((option) => {
            const isSelected = option === icon;
            return (
              <button
                key={option}
                type="button"
                aria-label={`Usar ícone ${ICON_LABELS[option]}`}
                aria-pressed={isSelected}
                onClick={() => onIconChange(option)}
                className={cn(
                  'flex h-12 flex-col items-center justify-center gap-1 rounded-xl border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected && 'border-primary/50 bg-primary/10 text-primary shadow-sm',
                )}
              >
                <GroupIconComponent icon={option} className="size-4" />
                <span className="text-[10px] leading-none">{ICON_LABELS[option]}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

'use client';

import {
  BriefcaseBusiness,
  Dumbbell,
  GraduationCap,
  Heart,
  House,
  Megaphone,
  PartyPopper,
  Plane,
  ShoppingBag,
  Star,
  Tag,
  Users,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import type { GroupIcon as GroupIconKey } from '@/lib/types';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<GroupIconKey, IconComponent> = {
  users: Users,
  briefcase: BriefcaseBusiness,
  heart: Heart,
  star: Star,
  'shopping-bag': ShoppingBag,
  megaphone: Megaphone,
  'graduation-cap': GraduationCap,
  house: House,
  'party-popper': PartyPopper,
  plane: Plane,
  dumbbell: Dumbbell,
  tag: Tag,
};

export function GroupIcon({ icon, ...props }: { icon: GroupIconKey } & SVGProps<SVGSVGElement>) {
  const Icon = ICONS[icon];
  return <Icon aria-hidden="true" {...props} />;
}

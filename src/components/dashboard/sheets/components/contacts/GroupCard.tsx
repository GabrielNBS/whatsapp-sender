import { Group } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Paintbrush, Settings, Trash2 } from 'lucide-react';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { GroupIcon } from '@/components/groups/GroupIcon';
import { GROUP_COLOR_STYLES } from '@/components/groups/group-appearance';
import { cn } from '@/lib/utils';

interface GroupCardProps {
  group: Group;
  contactCount: number;
  onManageClick: (group: Group) => void;
  onCustomizeClick: (group: Group) => void;
  onDeleteClick: (group: Group) => void;
}

export function GroupCard({
  group,
  contactCount,
  onManageClick,
  onCustomizeClick,
  onDeleteClick,
}: GroupCardProps) {
  const isDefault = group.id === DEFAULT_GROUP_ID;

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', GROUP_COLOR_STYLES[group.color].icon)}>
            <GroupIcon icon={group.icon} className="size-4" />
          </div>
          <CardTitle className="truncate text-sm font-semibold text-foreground">{group.name}</CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCustomizeClick(group)}
            aria-label={`Personalizar grupo ${group.name}`}
          >
            <Paintbrush className="size-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onManageClick(group)}
            aria-label={`Configurar grupo ${group.name}`}
          >
            <Settings className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </Button>
          {!isDefault && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteClick(group)}
              aria-label={`Excluir grupo ${group.name}`}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {contactCount}
        </div>
        <p className="text-xs text-muted-foreground">contatos</p>
      </CardContent>
    </Card>
  );
}
export default GroupCard;

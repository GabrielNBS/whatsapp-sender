import { Group } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Trash2 } from 'lucide-react';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';

interface GroupCardProps {
  group: Group;
  contactCount: number;
  onManageClick: (group: Group) => void;
  onDeleteClick: (group: Group) => void;
}

export function GroupCard({
  group,
  contactCount,
  onManageClick,
  onDeleteClick,
}: GroupCardProps) {
  const isDefault = group.id === DEFAULT_GROUP_ID;

  return (
    <Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {group.name}
        </CardTitle>
        <div className="flex gap-1">
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
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {contactCount}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">contatos</p>
      </CardContent>
    </Card>
  );
}
export default GroupCard;

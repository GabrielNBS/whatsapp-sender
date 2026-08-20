import { useState } from 'react';
import { Group, Contact, GroupColor, GroupIcon } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle } from 'lucide-react';
import { GroupCard } from './GroupCard';
import { GroupManagementDialog } from '@/components/contacts/group-management-dialog';
import { GroupCustomizationDialog } from '@/components/groups/GroupCustomizationDialog';

interface GroupsTabProps {
  groups: Group[];
  contacts: Contact[];
  onAddGroup: (name: string, appearance: { color: GroupColor; icon: GroupIcon }) => Promise<boolean>;
  onUpdateGroupAppearance: (groupId: string, appearance: { color: GroupColor; icon: GroupIcon }) => Promise<boolean>;
  onDeleteGroup: (id: string) => Promise<void>;
  managingGroup: Group | null;
  onManageGroupChange: (group: Group | null) => void;
}

export function GroupsTab({
  groups,
  contacts,
  onAddGroup,
  onUpdateGroupAppearance,
  onDeleteGroup,
  managingGroup,
  onManageGroupChange,
}: GroupsTabProps) {
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [customizingGroup, setCustomizingGroup] = useState<Group | null>(null);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const handleDeleteGroupClick = (group: Group) => {
    const groupContactsCount = contacts.filter((c) => c.groupIds.includes(group.id)).length;
    if (groupContactsCount > 0) {
      setDeletingGroup(group);
    } else {
      onDeleteGroup(group.id);
    }
  };

  const confirmDeleteGroup = async () => {
    if (deletingGroup) {
      await onDeleteGroup(deletingGroup.id);
      setDeletingGroup(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-4">
      <div className="flex justify-start">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCustomizingGroup(null);
            setIsCustomizationOpen(true);
          }}
        >
          <Users className="w-4 h-4 mr-2" /> Criar Grupo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            contactCount={contacts.filter((c) => c.groupIds.includes(group.id)).length}
            onManageClick={onManageGroupChange}
            onCustomizeClick={(group) => {
              setCustomizingGroup(group);
              setIsCustomizationOpen(true);
            }}
            onDeleteClick={handleDeleteGroupClick}
          />
        ))}
      </div>

      <GroupManagementDialog
        group={managingGroup}
        isOpen={!!managingGroup}
        onClose={() => onManageGroupChange(null)}
      />

      <GroupCustomizationDialog
        key={`${customizingGroup?.id ?? 'new'}-${isCustomizationOpen}`}
        group={customizingGroup}
        open={isCustomizationOpen}
        onOpenChange={(open) => {
          setIsCustomizationOpen(open);
          if (!open) setCustomizingGroup(null);
        }}
        onCreate={onAddGroup}
        onUpdate={onUpdateGroupAppearance}
      />

      <AlertDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
      >
        <AlertDialogContent className="max-w-[400px] rounded-xl border-border bg-card shadow-lg">
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="text-xl font-bold tracking-tight text-center">
                Excluir Grupo
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed px-2">
                Tem certeza que deseja remover este grupo? <br />
                A categoria <strong className="text-foreground font-bold">&quot;{deletingGroup?.name}&quot;</strong> possui contatos associados. <br />
                Ao excluir, esses contatos serão movidos para o grupo <strong className="text-primary font-bold">&quot;Geral&quot;</strong>.
                <br />
                <br />
                Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-center !justify-center w-full px-2">
            <AlertDialogCancel className="w-full sm:w-auto min-w-[120px] rounded-xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto min-w-[120px] rounded-xl font-bold shadow-lg shadow-destructive/20 transition-all"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
export default GroupsTab;

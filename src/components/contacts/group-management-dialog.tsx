import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRightLeft, UserMinus } from 'lucide-react';
import { useAppStore, Contact, Group } from '@/lib/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GroupManagementDialogProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupManagementDialog({ group, isOpen, onClose }: GroupManagementDialogProps) {
  const { contacts, groups, updateContactGroups } = useAppStore();
  const [movingContactId, setMovingContactId] = useState<string | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>('');

  useEffect(() => {
     if (!isOpen) {
        setMovingContactId(null);
        setTargetGroupId('');
     }
  }, [isOpen]);

  if (!group) return null;

  // Filter contacts that belong to this group
  const groupContacts = contacts.filter(c => c.groupIds.includes(group.id));
  const otherGroups = groups.filter(g => g.id !== group.id);
  const canMove = otherGroups.length > 0;
  const isDefaultGroup = group.id === 'default';

  const handleRemoveFromGroup = (contact: Contact) => {
    const newGroupIds = contact.groupIds.filter(id => id !== group.id);
    // Logic in store now handles fallback to default if empty
    updateContactGroups(contact.id, newGroupIds);
  };

  const handleMoveToGroup = (contact: Contact) => {
    if (!targetGroupId) return;
    
    // Remove from current group, add to new group
    // Ensure we don't duplicate if they are already in the target group (though "Move" implies switching context)
    const newGroupIds = contact.groupIds
      .filter(id => id !== group.id)
      .concat(targetGroupId);
      
    // Deduplicate just in case
    const uniqueGroupIds = Array.from(new Set(newGroupIds));
    
    updateContactGroups(contact.id, uniqueGroupIds);
    setMovingContactId(null);
    setTargetGroupId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Grupo: {group.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 mt-4">
          {groupContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
              Nenhum contato neste grupo.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead className="w-[300px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupContacts.map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {movingContactId === contact.id ? (
                          <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-right-5 duration-200">
                            <Select value={targetGroupId} onValueChange={setTargetGroupId}>
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Mover para..." />
                              </SelectTrigger>
                              <SelectContent>
                                {otherGroups.map(g => (
                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              className="h-8 px-2" 
                              onClick={() => handleMoveToGroup(contact)}
                              disabled={!targetGroupId}
                            >
                              OK
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2" 
                              onClick={() => {
                                setMovingContactId(null);
                                setTargetGroupId('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {canMove && (
                                <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8  border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-orange-900/50 dark:hover:bg-orange-900/20 dark:hover:text-orange-400"
                                onClick={() => setMovingContactId(contact.id)}
                                >
                                <ArrowRightLeft className="w-3 h-3 mr-1.5" />
                                Mover
                                </Button>
                            )}

                             {isDefaultGroup ? (
                                <TooltipProvider>
                                   <Tooltip>
                                      <TooltipTrigger asChild>
                                         <Button variant="ghost" size="sm" className="h-8 opacity-50 cursor-not-allowed">
                                            <UserMinus className="w-3 h-3 mr-1.5" />
                                            Remover
                                         </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                         <p>Não é possível remover contatos do grupo Geral</p>
                                      </TooltipContent>
                                   </Tooltip>
                                </TooltipProvider>
                             ) : (
                                <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                   onClick={() => handleRemoveFromGroup(contact)}
                                >
                                   <UserMinus className="w-3 h-3 mr-1.5" />
                                   Remover
                                </Button>
                             )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        
        <div className="border-t pt-4 mt-2 flex justify-between items-center text-sm text-muted-foreground">
             <span>Total de contatos: {groupContacts.length}</span>
             <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

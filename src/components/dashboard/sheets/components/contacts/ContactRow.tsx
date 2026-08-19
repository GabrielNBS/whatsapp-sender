import { Contact, Group } from '@/lib/types';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { ContactEngagement } from '@/components/contacts/contact-engagement';
import { formatPhoneNumber } from '@/lib/utils';
import { AnalyticsRecord } from '@/hooks/useContactAnalytics';
import type { ContactConsentStatus } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ContactRowProps {
  contact: Contact;
  groups: Group[];
  analyticsStats?: AnalyticsRecord;
  onEditClick: (contact: Contact) => void;
  onDeleteClick: (contact: Contact) => void;
  onConsentChange: (contactId: string, consentStatus: ContactConsentStatus) => Promise<boolean>;
}

export function ContactRow({
  contact,
  groups,
  analyticsStats,
  onEditClick,
  onDeleteClick,
  onConsentChange,
}: ContactRowProps) {
  const consentStatus = contact.consentStatus || 'UNKNOWN';
  return (
    <TableRow className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
      <TableCell className="font-medium text-zinc-700 dark:text-zinc-300">
        {contact.name}
      </TableCell>
      <TableCell className="text-zinc-600 dark:text-zinc-400">
        {formatPhoneNumber(contact.number)}
      </TableCell>
      <TableCell>
        <div className="flex gap-1 flex-wrap">
          {contact.groupIds.map((gid) => {
            const gName = groups.find((g) => g.id === gid)?.name || 'Geral';
            return (
              <Badge
                key={gid}
                variant="secondary"
                className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
              >
                {gName}
              </Badge>
            );
          })}
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={consentStatus}
          onValueChange={(value) => void onConsentChange(contact.id, value as ContactConsentStatus)}
        >
          <SelectTrigger aria-label={`Consentimento de ${contact.name}`} className="w-[150px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UNKNOWN">Não definido</SelectItem>
            <SelectItem value="OPTED_IN">Consentido</SelectItem>
            <SelectItem value="OPTED_OUT">Opt-out / Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <ContactEngagement stats={analyticsStats} />
      </TableCell>
      <TableCell className="text-center">
        <div className="flex justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:bg-primary/10 hover:text-primary"
            onClick={() => onEditClick(contact)}
            aria-label={`Editar grupo de ${contact.name}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDeleteClick(contact)}
            aria-label={`Excluir contato ${contact.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

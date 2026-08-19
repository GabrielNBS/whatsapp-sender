import type { Contact } from '@/lib/types';
import { formatPhoneNumber } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ui/avatar-display';
import { CommandGroup, CommandItem } from '@/components/ui/command';

interface ContactListProps {
  contacts: Contact[];
  getSelectionOrder: (contactId: string) => number | null;
  onSelect: (contact: Contact) => void;
}

/**
 * ContactList - Renders filtered contacts in the dropdown
 */
export function ContactList({ contacts, getSelectionOrder, onSelect }: ContactListProps) {
  if (contacts.length === 0) return null;

  return (
    <CommandGroup heading="Contatos">
      {contacts.map((contact) => {
        const selectionOrder = getSelectionOrder(contact.id);
        const isSelected = selectionOrder !== null;

        return (
          <CommandItem
            key={contact.id}
            value={`contact:${contact.id}:${contact.name}`}
            onSelect={() => onSelect(contact)}
            className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg mx-1 my-0.5"
          >
            <div className="flex items-center gap-3">
              <AvatarDisplay name={contact.name} phone={contact.number} className="w-8 h-8 rounded-lg opacity-90 shadow-none border border-border/20" />
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-sm">{contact.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {formatPhoneNumber(contact.number)}
                </span>
              </div>
            </div>
            <div className={`flex size-5 items-center justify-center rounded-full border text-xs font-bold ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>
              {selectionOrder}
            </div>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

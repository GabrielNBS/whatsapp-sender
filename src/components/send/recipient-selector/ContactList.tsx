import { Check } from 'lucide-react';
import { Contact } from '@/lib/store';
import { formatPhoneNumber } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ui/avatar-display';
import { CommandGroup, CommandItem } from '@/components/ui/command';

interface ContactListProps {
  contacts: Contact[];
  selectedId: string;
  onSelect: (contact: Contact) => void;
}

/**
 * ContactList - Renders filtered contacts in the dropdown
 */
export function ContactList({ contacts, selectedId, onSelect }: ContactListProps) {
  if (contacts.length === 0) return null;

  return (
    <CommandGroup heading="Contatos">
      {contacts.map((contact) => (
        <CommandItem
          key={contact.id}
          onSelect={() => onSelect(contact)}
          className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg mx-1 my-0.5"
        >
          <div className="flex items-center gap-3">
            <AvatarDisplay name={contact.name} phone={contact.number} className="w-8 h-8 rounded-lg opacity-90 shadow-none border border-border/20" />
            <div className="flex flex-col leading-tight">
              <span className="font-medium text-sm">{contact.name}</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                {formatPhoneNumber(contact.number)}
              </span>
            </div>
          </div>
          {selectedId === contact.id && (
            <Check className="w-4 h-4 text-primary" />
          )}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

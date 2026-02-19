import { Check } from 'lucide-react';
import { Contact } from '@/lib/store';
import { formatPhoneNumber } from '@/lib/utils';
import { AvatarDisplay } from '@/components/ui/avatar-display';

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
    <>
      <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">
        Contatos
      </div>
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer flex items-center justify-between"
          onClick={() => onSelect(contact)}
        >
          <div className="flex items-center gap-2">
            <AvatarDisplay name={contact.name} phone={contact.number} className="w-8 h-8" />
            <div className="flex flex-col">
              <span>{contact.name}</span>
              <span className="text-[10px] text-muted-foreground">
                {formatPhoneNumber(contact.number)}
              </span>
            </div>
          </div>
          {selectedId === contact.id && (
            <Check className="w-3.5 h-3.5 text-primary" />
          )}
        </div>
      ))}
    </>
  );
}

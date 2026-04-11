import { Group, Contact } from '@/lib/store';

/**
 * Recipient configuration type
 */
export interface RecipientValue {
  type: 'group' | 'contact';
  id: string;
  name: string;
}

/**
 * Props for SearchInput
 */
export interface SearchInputProps {
  value: RecipientValue;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Props for GroupList
 */
export interface GroupListProps {
  groups: Group[];
  selectedId: string;
  getContactCount: (groupId: string) => number;
  onSelect: (group: Group) => void;
}

/**
 * Props for ContactList
 */
export interface ContactListProps {
  contacts: Contact[];
  selectedId: string;
  onSelect: (contact: Contact) => void;
}

/**
 * Props for AllContactsOption
 */
export interface AllContactsOptionProps {
  isSelected: boolean;
  onSelect: () => void;
}

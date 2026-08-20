import { useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChartNoAxesColumn, Check, CircleUserRound, Phone, ShieldCheck, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineTableControl, type InlineTableColumn } from '@/components/ui/inline-table-control';
import { ContactEngagement } from '@/components/contacts/contact-engagement';
import { useContactAnalytics } from '@/hooks/useContactAnalytics';
import { useContactPagination } from '@/hooks/useContactPagination';
import { useContactSearch } from '@/hooks/useContactSearch';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { validateContactFields } from '@/services/contacts/validateContact';
import { formatPhoneInput } from '@/services/contacts/normalizePhone';
import type { Contact, ContactConsentStatus, Group } from '@/lib/types';
import { cn, formatPhoneNumber } from '@/lib/utils';

import { ContactPagination } from './ContactPagination';
import { ContactSearch } from './ContactSearch';

const DRAFT_CONTACT_ID = '__new_contact__';

interface ContactTableProps {
  contacts: Contact[];
  groups: Group[];
  onDeleteClick: (contact: Contact) => void;
  onAddContact: (name: string, number: string, groupIds: string[]) => Promise<boolean>;
  onUpdateContact: (contactId: string, name: string, number: string, groupIds: string[]) => Promise<boolean>;
  onConsentChange: (contactId: string, consentStatus: ContactConsentStatus) => Promise<boolean>;
  isAddingContact: boolean;
  onCancelAdd: () => void;
}

function getGroupNames(contact: Contact, groups: Group[]) {
  return contact.groupIds.map((groupId) => groups.find((group) => group.id === groupId)?.name || 'Geral');
}

function InlinePlaceholderFeedback({ message, hasValue }: { message?: string; hasValue: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {message && hasValue ? (
        <motion.span
          key={message}
          initial={{ x: 6 }}
          animate={{ x: 0 }}
          exit={{ x: 6 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="pointer-events-none absolute inset-y-0 right-0 flex max-w-[82%] items-center truncate bg-linear-to-l from-background via-background/95 to-transparent pl-8 text-xs font-medium text-destructive transition-opacity group-focus-within/field:opacity-0"
          role="alert"
        >
          {message}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function GroupEditor({
  groups,
  value,
  error,
  onChange,
  onBlur,
}: {
  groups: Group[];
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}) {
  const selectedGroupIds = Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];

  return (
    <div onBlur={onBlur} aria-invalid={Boolean(error)} className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto aria-invalid:text-destructive">
      {groups.map((group) => {
        const checked = selectedGroupIds.includes(group.id);
        return (
          <label
            key={group.id}
            className={cn(
              'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-[color,background-color,border-color,transform] hover:-translate-y-px',
              checked
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-background/50 text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => {
                if (checked && selectedGroupIds.length === 1) return;
                onChange(
                  checked
                    ? selectedGroupIds.filter((id) => id !== group.id)
                    : [...selectedGroupIds, group.id],
                );
              }}
              className="sr-only"
            />
            {checked && <Check aria-hidden="true" className="size-3" />}
            <span>{group.name}</span>
          </label>
        );
      })}
    </div>
  );
}

export function ContactTable({
  contacts,
  groups,
  onDeleteClick,
  onAddContact,
  onUpdateContact,
  onConsentChange,
  isAddingContact,
  onCancelAdd,
}: ContactTableProps) {
  const { searchTerm, setSearchTerm, filteredContacts } = useContactSearch(contacts);
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedContacts,
    startIndex,
    endIndex,
  } = useContactPagination(filteredContacts);
  const visiblePhones = useMemo(
    () => paginatedContacts.map((contact) => contact.number),
    [paginatedContacts],
  );
  const { analytics } = useContactAnalytics(visiblePhones);
  const draftContact = useMemo<Contact | null>(
    () =>
      isAddingContact
        ? {
            id: DRAFT_CONTACT_ID,
            name: '',
            number: '',
            groupIds: [DEFAULT_GROUP_ID],
            consentStatus: 'UNKNOWN',
          }
        : null,
    [isAddingContact],
  );

  // Calculado uma única vez por página (contatos + grupos), reaproveitado no
  // desktop (coluna "Grupos") e no mobile — evita recomputar getGroupNames
  // duas vezes por contato a cada render.
  const groupNamesByContactId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const contact of paginatedContacts) {
      map.set(contact.id, getGroupNames(contact, groups));
    }
    if (draftContact) {
      map.set(draftContact.id, getGroupNames(draftContact, groups));
    }
    return map;
  }, [paginatedContacts, groups, draftContact]);

  // Colunas que NÃO dependem de analytics — não são recriadas quando os
  // dados de engajamento chegam/atualizam.
  const staticColumns = useMemo<InlineTableColumn<Contact>[]>(
    () => [
      {
        key: 'name',
        label: 'Nome',
        icon: <CircleUserRound className="size-4" />,
        editorClassName: 'lg:col-span-6',
        validates: true,
        microcopyInPlaceholder: true,
        render: (contact) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground sm:text-base">{contact.name || 'Novo contato'}</p>
          </div>
        ),
        renderEditor: ({ mode, value, error, microcopy, onChange, onBlur }) => {
          const name = String(value ?? '');
          const isNearLimit = name.length >= 85;
          const isAtLimit = name.length >= 100;

          return (
            <div className="relative flex items-center">
              <Input
                aria-label="Nome do contato"
                aria-invalid={Boolean(error)}
                placeholder={microcopy || 'Nome'}
                value={name}
                onChange={(event) => onChange(event.target.value)}
                onBlur={onBlur}
                autoFocus={mode === 'create'}
                maxLength={100}
                className="h-auto border-0 bg-transparent px-0 py-0 pr-12 text-base font-bold shadow-none placeholder:font-normal focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25 sm:text-sm"
              />
              {microcopy && name ? null : (
                <motion.span
                  aria-hidden="true"
                  animate={isAtLimit ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={isAtLimit ? { duration: 0.7, repeat: Infinity } : { duration: 0.2 }}
                  className={cn(
                    'pointer-events-none absolute right-0 text-[10px] tabular-nums text-muted-foreground opacity-0 transition-[color,opacity] group-focus-within/field:opacity-100',
                    isNearLimit && 'text-foreground opacity-100',
                    isAtLimit && 'font-semibold text-destructive',
                  )}
                >
                  {name.length}/100
                </motion.span>
              )}
              <InlinePlaceholderFeedback message={microcopy} hasValue={Boolean(name)} />
            </div>
          );
        },
      },
      {
        key: 'number',
        label: 'Número',
        icon: <Phone className="size-4" />,
        editorClassName: 'lg:col-span-6',
        validates: true,
        microcopyInPlaceholder: true,
        render: (contact) => (
          <span className="text-sm text-muted-foreground">{formatPhoneNumber(contact.number)}</span>
        ),
        renderEditor: ({ value, error, microcopy, onChange, onBlur }) => {
          const phone = formatPhoneInput(String(value ?? ''));

          return (
            <div className="relative flex items-center">
              <span
                aria-hidden="true"
                className={cn(
                  'mr-0 max-w-0 overflow-hidden text-sm font-semibold text-muted-foreground opacity-0 transition-[max-width,margin,opacity,color] duration-200 group-focus-within/field:mr-1.5 group-focus-within/field:max-w-9 group-focus-within/field:text-primary group-focus-within/field:opacity-100',
                  phone && 'mr-1.5 max-w-9 opacity-100',
                  error && 'text-destructive group-focus-within/field:text-destructive',
                )}
              >
                +55
              </span>
              <Input
                aria-label="Número do contato"
                aria-invalid={Boolean(error)}
                placeholder={microcopy || 'Número — (11) 99999-9999'}
                value={phone}
                onChange={(event) => onChange(formatPhoneInput(event.target.value))}
                onBlur={onBlur}
                inputMode="tel"
                autoComplete="tel-national"
                maxLength={15}
                className="h-auto border-0 bg-transparent px-0 py-0 text-base font-bold shadow-none placeholder:font-normal focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/25 sm:text-sm"
              />
              <InlinePlaceholderFeedback message={microcopy} hasValue={Boolean(phone)} />
            </div>
          );
        },
      },
      {
        key: 'groupIds',
        label: 'Grupos',
        icon: <Users className="size-4" />,
        editorClassName: 'sm:col-span-2 lg:col-span-6',
        validates: true,
        render: (contact) => (
          <div className="flex flex-wrap gap-1">
            {(groupNamesByContactId.get(contact.id) ?? getGroupNames(contact, groups)).map((groupName, index) => (
              <Badge key={`${contact.id}-${groupName}-${index}`} variant="secondary" className="text-xs">
                {groupName}
              </Badge>
            ))}
          </div>
        ),
        renderEditor: ({ value, error, onChange, onBlur }) => (
          <GroupEditor groups={groups} value={value} error={error} onChange={onChange} onBlur={onBlur} />
        ),
      },
      {
        key: 'consentStatus',
        label: 'Consentimento',
        icon: <ShieldCheck className="size-4" />,
        className: 'justify-center',
        editorClassName: 'lg:col-span-3',
        render: (contact) => {
          const consentStatus = contact.consentStatus || 'UNKNOWN';
          const isDraft = contact.id === DRAFT_CONTACT_ID;
          return (
            <Select
              value={consentStatus}
              disabled={isDraft}
              onValueChange={(value) => void onConsentChange(contact.id, value as ContactConsentStatus)}
            >
              <SelectTrigger aria-label={`Consentimento de ${contact.name || 'novo contato'}`} className="h-auto w-full border-0 bg-transparent px-0 py-0 text-xs shadow-none focus:ring-0 sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNKNOWN">Não definido</SelectItem>
                <SelectItem value="OPTED_IN">Consentido</SelectItem>
                <SelectItem value="OPTED_OUT">Opt-out / Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          );
        },
      },
    ],
    [groups, groupNamesByContactId, onConsentChange],
  );

  // Única coluna que depende de analytics — isolada para que um
  // refetch/atualização de engajamento não invalide as demais colunas.
  const engagementColumn = useMemo<InlineTableColumn<Contact>>(
    () => ({
      key: 'engagement',
      label: 'Engajamento',
      icon: <ChartNoAxesColumn className="size-4" />,
      className: 'justify-center',
      editorClassName: 'lg:col-span-3',
      render: (contact) => <ContactEngagement stats={analytics[contact.number]} />,
    }),
    [analytics],
  );

  const columns = useMemo<InlineTableColumn<Contact>[]>(
    () => [...staticColumns, engagementColumn],
    [staticColumns, engagementColumn],
  );

  const handleValidate = useCallback(
    (contact: Contact, mode: 'create' | 'edit') => {
      const fieldErrors = validateContactFields(
        contact.name,
        contact.number,
        contact.groupIds,
        contacts,
        groups,
        mode === 'edit' ? contact.id : undefined,
      );
      return {
        isValid: Object.keys(fieldErrors).length === 0,
        fieldErrors,
      };
    },
    [contacts, groups],
  );

  const handleCreate = useCallback(
    (contact: Contact) => onAddContact(contact.name, contact.number, contact.groupIds),
    [onAddContact],
  );

  const handleUpdate = useCallback(
    (contact: Contact) => onUpdateContact(contact.id, contact.name, contact.number, contact.groupIds),
    [onUpdateContact],
  );

  const renderMobile = useCallback(
    (contact: Contact) => (
      <>
        <p className="text-xs text-muted-foreground">{formatPhoneNumber(contact.number)}</p>
        <div className="flex flex-wrap items-center gap-1">
          {(groupNamesByContactId.get(contact.id) ?? getGroupNames(contact, groups)).map((groupName, index) => (
            <Badge key={`${contact.id}-mobile-${groupName}-${index}`} variant="secondary" className="text-[10px]">
              {groupName}
            </Badge>
          ))}
          <span className="text-[11px] text-muted-foreground">
            {contact.consentStatus === 'OPTED_IN'
              ? 'Consentido'
              : contact.consentStatus === 'OPTED_OUT'
                ? 'Opt-out'
                : 'Não definido'}
          </span>
          <ContactEngagement stats={analytics[contact.number]} />
        </div>
      </>
    ),
    [groupNamesByContactId, groups, analytics],
  );

  if (contacts.length === 0 && !isAddingContact) {
    return (
      <div className="flex h-full items-center justify-center py-12 text-muted-foreground">
        Nenhum contato encontrado.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg bg-muted/30">
      <ContactSearch
        value={searchTerm}
        onChange={(value) => {
          setSearchTerm(value);
          setCurrentPage(1);
        }}
        onClear={() => {
          setSearchTerm('');
          setCurrentPage(1);
        }}
      />

      <div className="relative flex-1 overflow-auto">
        <InlineTableControl
          data={paginatedContacts}
          columns={columns}
          validate={handleValidate}
          createItem={draftContact}
          onCancelCreate={onCancelAdd}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={onDeleteClick}
          emptyMessage="Nenhum contato corresponde à pesquisa."
          renderMobile={renderMobile}
          gridTemplateColumns="1.35fr 1.2fr 1.55fr 1.35fr 1fr 92px"
          className="min-h-full"
        />
      </div>

      <ContactPagination
        currentPage={currentPage}
        totalPages={totalPages}
        startIndex={startIndex}
        endIndex={endIndex}
        totalFiltered={filteredContacts.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default ContactTable;
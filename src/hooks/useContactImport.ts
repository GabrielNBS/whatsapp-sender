import { useState, useCallback } from 'react';
import { useAppStore, Contact } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { parseContactsCsv } from '@/services/contacts/parseContactsCsv';
import { dedupeContacts } from '@/services/contacts/dedupeContacts';
import { DEFAULT_GROUP_ID } from '@/constants/contacts';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { importContacts } from '@/services/contacts/contactsApi';
import { MAX_CSV_FILE_SIZE } from '@/constants/domain';

export type ImportTargetType = 'default' | 'existing' | 'new';

export function isImportTargetType(value: unknown): value is ImportTargetType {
  return typeof value === 'string' && ['default', 'existing', 'new'].includes(value);
}

export function useContactImport() {
  const { contacts, groups, upsertContacts, upsertGroup } = useAppStore(useShallow((state) => ({
    contacts: state.contacts,
    groups: state.groups,
    upsertContacts: state.upsertContacts,
    upsertGroup: state.upsertGroup,
  })));

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedContacts, setImportedContacts] = useState<Omit<Contact, 'id'>[]>([]);
  const [importTargetType, setImportTargetType] = useState<ImportTargetType>('default');
  const [importTargetGroupId, setImportTargetGroupId] = useState('');
  const [importNewGroupName, setImportNewGroupName] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > MAX_CSV_FILE_SIZE) {
      toast.error('O arquivo CSV excede o limite de 5 MB.');
      return;
    }
    setIsParsing(true);
    try {
      const result = await parseContactsCsv(file);
      
      if (result.errors.length > 0) {
        // Mostra os primeiros 3 erros de validação
        result.errors.slice(0, 3).forEach(err => toast.error(err));
        if (result.errors.length > 3) {
          toast.error(`E mais ${result.errors.length - 3} outros erros de validação.`);
        }
      }

      if (result.contacts.length === 0) {
        toast.error('Nenhum contato válido encontrado para importar.');
        return;
      }

      setImportedContacts(result.contacts);
      setIsImportModalOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Falha ao processar arquivo CSV.');
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (importedContacts.length === 0) {
      toast.error('Não há contatos para importar.');
      return;
    }

    let targetGroupId = DEFAULT_GROUP_ID;

    if (importTargetType === 'existing') {
      if (!importTargetGroupId) {
        toast.error('Selecione um grupo de destino.');
        return;
      }
      targetGroupId = importTargetGroupId;
    } else if (importTargetType === 'new') {
      const trimmedGroupName = importNewGroupName.trim();
      if (!trimmedGroupName) {
        toast.error('Digite o nome do novo grupo.');
        return;
      }
      
      // Verifica duplicidade do grupo
      const groupExists = groups.some(g => g.name.toLowerCase() === trimmedGroupName.toLowerCase());
      if (groupExists) {
        toast.error('Já existe um grupo com este nome.');
        return;
      }

      const newId = nanoid();
      targetGroupId = newId;
    }

    const newGroup = importTargetType === 'new'
      ? { id: targetGroupId, name: importNewGroupName.trim(), description: 'Criado via importação' }
      : undefined;

    // Aplica o grupo de destino aos contatos importados
    const contactsWithGroups = importedContacts.map(c => ({
      ...c,
      groupIds: [targetGroupId]
    }));

    // Aplica a deduplicação
    const { uniqueContacts, duplicateCount } = dedupeContacts(contactsWithGroups, contacts);

    if (uniqueContacts.length === 0) {
      toast.warning('Todos os contatos da lista já existem na base.');
      setIsImportModalOpen(false);
      return;
    }

    try {
      const result = await importContacts(
        newGroup,
        uniqueContacts.map((contact) => ({ id: nanoid(), ...contact })),
      );
      if (result.group) upsertGroup(result.group);
      upsertContacts(result.contacts);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao importar contatos.');
      return;
    }
    
    if (duplicateCount > 0) {
      toast.success(`${uniqueContacts.length} contatos importados. ${duplicateCount} duplicados foram ignorados.`);
    } else {
      toast.success(`${uniqueContacts.length} contatos importados com sucesso.`);
    }

    // Cleanup
    setIsImportModalOpen(false);
    setImportedContacts([]);
    setImportTargetType('default');
    setImportTargetGroupId('');
    setImportNewGroupName('');
  }, [importedContacts, importTargetType, importTargetGroupId, importNewGroupName, groups, contacts, upsertContacts, upsertGroup]);

  const handleCloseImport = useCallback(() => {
    setIsImportModalOpen(false);
    setImportedContacts([]);
    setImportTargetType('default');
    setImportTargetGroupId('');
    setImportNewGroupName('');
  }, []);

  return {
    isImportModalOpen,
    setIsImportModalOpen: (open: boolean) => {
      if (!open) handleCloseImport();
      else setIsImportModalOpen(true);
    },
    importedContacts,
    importTargetType,
    setImportTargetType: (value: unknown) => {
      if (isImportTargetType(value)) {
        setImportTargetType(value);
      }
    },
    importTargetGroupId,
    setImportTargetGroupId,
    importNewGroupName,
    setImportNewGroupName,
    isParsing,
    handleFileUpload,
    handleConfirmImport,
  };
}

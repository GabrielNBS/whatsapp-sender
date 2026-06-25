'use client';

import { SplitText } from '@/components/ui/split-text';
import { AnimatedContent } from '@/components/ui/animated-content';

import { useState } from 'react';
import { toast } from "sonner";
import { useAppStore, Contact, Group } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Trash2, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Hooks
import { useContacts } from '@/hooks/useContacts';
import { useGroups } from '@/hooks/useGroups';
import { useContactImport } from '@/hooks/useContactImport';
import { useContactAnalytics } from '@/hooks/useContactAnalytics';

// Subcomponentes
import { ContactTable } from './components/contacts/ContactTable';
import { AddContactDialog } from './components/contacts/AddContactDialog';
import { ImportContactsDialog } from './components/contacts/ImportContactsDialog';
import { GroupsTab } from './components/contacts/GroupsTab';
import { EditContactGroupIdDialog } from './components/contacts/EditContactGroupIdDialog';
import { ConfirmDeleteContactDialog } from './components/contacts/ConfirmDeleteContactDialog';

export function ContactsSheetContent() {
  const { clearContacts } = useAppStore();
  
  const {
    contacts,
    groups,
    addContact,
    updateContactGroups,
    deleteContact,
  } = useContacts();

  const {
    addGroup,
    deleteGroup,
  } = useGroups();

  const {
    isImportModalOpen,
    setIsImportModalOpen,
    importedContacts,
    importTargetType,
    setImportTargetType,
    importTargetGroupId,
    setImportTargetGroupId,
    importNewGroupName,
    setImportNewGroupName,
    handleFileUpload,
    handleConfirmImport,
  } = useContactImport();

  const { analytics } = useContactAnalytics();

  // Estados locais da UI
  const [activeTab, setActiveTab] = useState('contacts');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);

  const handleClearAll = () => {
    clearContacts();
    setIsClearConfirmOpen(false);
    toast.success("Todos os contatos foram removidos");
  };

  const executeDeleteContact = () => {
    if (deletingContact) {
      deleteContact(deletingContact.id);
      setDeletingContact(null);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8 overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <SplitText text="Contatos & Grupos" as="h1" className="text-xl font-bold tracking-tight" />
        <div className="text-sm text-muted-foreground">
          Total: {contacts.length}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <TabsList>
            <TabsTrigger value="contacts">Todos os Contatos</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {/* Modal Novo Contato */}
            <AddContactDialog
              groups={groups}
              onAddContact={addContact}
              isOpen={isAddOpen}
              onOpenChange={setIsAddOpen}
            />

            {/* Input CSV Acessível */}
            <div className="relative">
              <input
                type="file"
                id="csv-file-input"
                accept=".csv"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                  e.target.value = '';
                }}
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="csv-file-input" className="cursor-pointer flex items-center">
                  <Upload className="w-4 h-4 mr-2" /> Importar CSV
                </label>
              </Button>
            </div>

            {/* Limpar Lista */}
            {contacts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                onClick={() => setIsClearConfirmOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Lista
              </Button>
            )}
          </div>
        </div>

        <AnimatedContent activeKey={activeTab} spring="snappy" direction="horizontal" offset={20}>
          <TabsContent
            value="contacts"
            className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden border rounded-lg bg-white dark:bg-zinc-950 overflow-hidden"
            forceMount
          >
            <ContactTable
              contacts={contacts}
              groups={groups}
              analytics={analytics}
              onEditClick={setEditingContact}
              onDeleteClick={setDeletingContact}
            />
          </TabsContent>

          <TabsContent
            value="groups"
            className="flex-1 overflow-y-auto min-h-0 data-[state=inactive]:hidden pr-2"
            forceMount
          >
            <GroupsTab
              groups={groups}
              contacts={contacts}
              onAddGroup={addGroup}
              onDeleteGroup={deleteGroup}
              managingGroup={managingGroup}
              onManageGroupChange={setManagingGroup}
            />
          </TabsContent>
        </AnimatedContent>
      </Tabs>

      {/* Diálogos Globais */}
      <ImportContactsDialog
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        importedContacts={importedContacts}
        importTargetType={importTargetType}
        onTargetTypeChange={setImportTargetType}
        importTargetGroupId={importTargetGroupId}
        onTargetGroupIdChange={setImportTargetGroupId}
        importNewGroupName={importNewGroupName}
        onNewGroupNameChange={setImportNewGroupName}
        groups={groups}
        onConfirmImport={handleConfirmImport}
      />

      <EditContactGroupIdDialog
        key={editingContact?.id || 'none'}
        contact={editingContact}
        groups={groups}
        isOpen={!!editingContact}
        onClose={() => setEditingContact(null)}
        onSave={updateContactGroups}
      />

      <ConfirmDeleteContactDialog
        contact={deletingContact}
        isOpen={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        onConfirm={executeDeleteContact}
      />

      {/* Confirmação Limpar Tudo */}
      <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
        <AlertDialogContent className="rounded-2xl max-w-[400px] border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="text-xl font-bold tracking-tight text-center">
                Limpar Todos os Contatos
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed px-2 text-center">
                Tem certeza que deseja remover <strong className="text-foreground font-bold text-base">{contacts.length} contatos</strong>? <br />
                Esta ação excluirá permanentemente todos os contatos da sua lista local.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-center !justify-center w-full px-2">
            <AlertDialogCancel className="w-full sm:w-auto min-w-[120px] rounded-xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto min-w-[120px] rounded-xl font-bold shadow-lg shadow-destructive/20 transition-all"
            >
              Limpar Lista
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

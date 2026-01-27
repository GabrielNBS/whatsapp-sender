'use client';

import { useState } from 'react';
import { toast } from "sonner";
import { useAppStore, Contact, Group } from '@/lib/store';
import { formatPhoneNumber } from '@/lib/utils';
import { GroupManagementDialog } from '@/components/contacts/group-management-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload, Users, Pencil, ChevronLeft, ChevronRight, Settings, FileSpreadsheet } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Papa from 'papaparse';
import { nanoid } from 'nanoid';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';



export default function ContactsPage() {
   const { groups, contacts, addContact, deleteContact, addGroup, deleteGroup, importContacts } = useAppStore();

   const [newContactName, setNewContactName] = useState('');
   const [newContactNumber, setNewContactNumber] = useState('');
   const [newContactGroupId, setNewContactGroupId] = useState('default');
   const [isAddOpen, setIsAddOpen] = useState(false);

   const [newGroupName, setNewGroupName] = useState('');
   const [isGroupOpen, setIsGroupOpen] = useState(false);
   const [managingGroup, setManagingGroup] = useState<Group | null>(null);
   const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

   // Import State
   const [isImportModalOpen, setIsImportModalOpen] = useState(false);
   const [importedContacts, setImportedContacts] = useState<Omit<Contact, 'id'>[]>([]);
   const [importTargetType, setImportTargetType] = useState<'default' | 'existing' | 'new'>('default');
   const [importTargetGroupId, setImportTargetGroupId] = useState<string>('');
   const [importNewGroupName, setImportNewGroupName] = useState('');

   const handleAddContact = () => {
      if (newContactName && newContactNumber) {
         addContact(newContactName, newContactNumber, [newContactGroupId]);
         setNewContactName('');
         setNewContactNumber('');
         setNewContactGroupId('default');
         setIsAddOpen(false);
      }
   };

   const handleAddGroup = () => {
      if (newGroupName) {
         addGroup(newGroupName);
         setNewGroupName('');
         setIsGroupOpen(false);
      }
   };

   const handleDeleteGroupClick = (group: Group) => {
      const groupContactsCount = contacts.filter(contact => contact.groupIds.includes(group.id)).length;
      if (groupContactsCount > 0) {
         setDeletingGroup(group);
      } else {
         deleteGroup(group.id);
      }
   };

   const confirmDeleteGroup = () => {
      if (deletingGroup) {
         deleteGroup(deletingGroup.id);
         setDeletingGroup(null);
      }
   };

   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setNewContactNumber(formatted);
   };

   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         Papa.parse(file, {
            header: true,
            complete: (results) => {
               const parsed = (results.data as any[]).map((row) => {
                  const rawNumber = row.number || '';
                  const cleanNumber = rawNumber.replace(/\D/g, '');

                  if (cleanNumber.length < 10) return null;

                  return {
                     name: row.name || 'Unknown',
                     number: cleanNumber,
                     groupIds: [] as string[] // Explicitly cast to string[]
                  };
               }).filter((c): c is Omit<Contact, 'id'> => c !== null);

               setImportedContacts(parsed);
               setIsImportModalOpen(true);
               // Reset input
               e.target.value = '';
            }
         });
      }
   };

   const handleConfirmImport = () => {
      let targetGroupId = 'default';

      if (importTargetType === 'existing' && importTargetGroupId) {
         targetGroupId = importTargetGroupId;
      } else if (importTargetType === 'new' && importNewGroupName) {
         const newId = nanoid();
         addGroup(importNewGroupName, 'Criado via importação', newId);
         targetGroupId = newId;
      }

      const contactsToImport = importedContacts.map(c => ({
         ...c,
         groupIds: [targetGroupId]
      }));

      importContacts(contactsToImport);

      // Cleanup
      setIsImportModalOpen(false);
      setImportedContacts([]);
      setImportTargetType('default');
      setImportTargetGroupId('');
      setImportNewGroupName('');
   };

   return (
      <div className="flex flex-col h-[calc(100vh-2rem)] -m-6 p-6 space-y-4 overflow-hidden">
         <div className="flex justify-between items-center shrink-0">
            <h1 className="text-xl font-bold tracking-tight">Contatos & Grupos</h1>
            <div className="text-sm text-muted-foreground">
               Total: {contacts.length}
            </div>
         </div>

         <Tabs defaultValue="contacts" className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4 shrink-0">
               <TabsList>
                  <TabsTrigger value="contacts">Todos os Contatos</TabsTrigger>
                  <TabsTrigger value="groups">Grupos</TabsTrigger>
               </TabsList>

               {/* Actions that depend on tab could go here or inside tab content, keeping basic Add Contact reachable */}
               <div className="flex gap-2">
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                     <DialogTrigger asChild>
                        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Adicionar Contato</Button>
                     </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                           <DialogTitle>Novo Contato</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                           <div className="grid gap-2">
                              <Input
                                 placeholder="Nome"
                                 value={newContactName}
                                 onChange={e => setNewContactName(e.target.value)}
                              />
                              <div className="space-y-1">
                                 <Input
                                    placeholder="(11) 9 9999-9999"
                                    value={newContactNumber}
                                    onChange={handlePhoneChange}
                                    maxLength={16}
                                 />
                                 <p className="text-[10px] text-muted-foreground pl-1">
                                    Formato: (DDD) 9 0000-0000
                                 </p>
                              </div>

                              <span className="text-sm font-medium">Selecione um grupo</span>
                              <Select value={newContactGroupId} onValueChange={setNewContactGroupId}>
                                 <SelectTrigger>
                                    <SelectValue placeholder="Selecione um grupo" />
                                 </SelectTrigger>
                                 <SelectContent className="max-h-[200px]">
                                    {groups.map(group => (
                                       <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                    ))}
                                 </SelectContent>
                              </Select>
                           </div>
                           <Button onClick={handleAddContact}>Salvar</Button>
                        </div>
                     </DialogContent>
                  </Dialog>

                  <div className="relative">
                     <input
                        type="file"
                        accept=".csv"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                     />
                     <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" /> Importar CSV</Button>
                  </div>
               </div>
            </div>

            <TabsContent value="contacts" className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden border rounded-lg bg-white overflow-hidden">
               <ValidContactTable contacts={contacts} onDelete={deleteContact} />
            </TabsContent>

            <TabsContent value="groups" className="flex-1 overflow-y-auto min-h-0 data-[state=inactive]:hidden pr-2">
               <div className="flex justify-start mb-4">
                  <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
                     <DialogTrigger asChild>
                        <Button variant="secondary" size="sm"><Users className="w-4 h-4 mr-2" /> Criar Grupo</Button>
                     </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                           <DialogTitle>Novo Grupo</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                           <Input placeholder="Nome do Grupo" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
                           <Button onClick={handleAddGroup}>Criar</Button>
                        </div>
                     </DialogContent>
                  </Dialog>
               </div>

               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groups.map(group => (
                     <Card key={group.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                           <CardTitle className="text-sm font-medium">{group.name}</CardTitle>
                           <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => setManagingGroup(group)}>
                                 <Settings className="w-4 h-4 text-muted-foreground hover:text-primary" />
                              </Button>
                              {group.id !== 'default' && (
                                 <Button variant="ghost" size="icon" onClick={() => handleDeleteGroupClick(group)}>
                                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                 </Button>
                              )}
                           </div>
                        </CardHeader>
                        <CardContent>
                           <div className="text-2xl font-bold">
                              {contacts.filter(c => c.groupIds.includes(group.id)).length}
                           </div>
                           <p className="text-xs text-slate-500">contatos</p>
                        </CardContent>
                     </Card>
                  ))}
               </div>

               <GroupManagementDialog
                  group={managingGroup}
                  isOpen={!!managingGroup}
                  onClose={() => setManagingGroup(null)}
               />

               <AlertDialog open={!!deletingGroup} onOpenChange={(open) => !open && setDeletingGroup(null)}>
                  <AlertDialogContent>
                     <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Grupo</AlertDialogTitle>
                        <AlertDialogDescription>
                           O grupo <strong>{deletingGroup?.name}</strong> possui contatos associados.
                           Ao excluir, esses contatos serão movidos para o grupo &quot;Geral&quot; caso não pertençam a outros grupos.
                           Deseja continuar?
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteGroup} className="bg-destructive text-info-foreground hover:bg-destructive/90">
                           Excluir
                        </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>
            </TabsContent>
         </Tabs>

         <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogContent className="sm:max-w-[425px]">
               <DialogHeader>
                  <DialogTitle>Importar Contatos</DialogTitle>
               </DialogHeader>
               <div className="py-4 space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                     <FileSpreadsheet className="w-4 h-4" />
                     <span>{importedContacts.length} contatos encontrados no arquivo.</span>
                  </div>

                  <div className="space-y-3">
                     <Label>Destino dos contatos</Label>
                     <RadioGroup value={importTargetType} onValueChange={(v: any) => setImportTargetType(v)}>
                        <div className="flex items-center space-x-2">
                           <RadioGroupItem value="default" id="r1" />
                           <Label htmlFor="r1">Adicionar ao grupo Geral (Padrão)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                           <RadioGroupItem value="existing" id="r2" />
                           <Label htmlFor="r2">Adicionar a um grupo existente</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                           <RadioGroupItem value="new" id="r3" />
                           <Label htmlFor="r3">Criar um novo grupo</Label>
                        </div>
                     </RadioGroup>
                  </div>

                  {importTargetType === 'existing' && (
                     <div className="space-y-2 pl-6 border-l-2 border-slate-100">
                        <Label>Selecione o grupo</Label>
                        <Select value={importTargetGroupId} onValueChange={setImportTargetGroupId}>
                           <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                           </SelectTrigger>
                           <SelectContent>
                              {groups.map(g => (
                                 <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  )}

                  {importTargetType === 'new' && (
                     <div className="space-y-2 pl-6 border-l-2 border-slate-100">
                        <Label>Nome do novo grupo</Label>
                        <Input
                           placeholder="Ex: Clientes VIP"
                           value={importNewGroupName}
                           onChange={e => setImportNewGroupName(e.target.value)}
                        />
                     </div>
                  )}

                  <div className="pt-2 flex justify-end gap-2">
                     <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
                     <Button onClick={handleConfirmImport} disabled={
                        (importTargetType === 'existing' && !importTargetGroupId) ||
                        (importTargetType === 'new' && !importNewGroupName)
                     }>
                        Importar Contatos
                     </Button>
                  </div>
               </div>
            </DialogContent>
         </Dialog>
      </div>
   );
}

function ValidContactTable({ contacts, onDelete }: { contacts: Contact[], onDelete: (id: string) => void }) {
   const { groups, updateContactGroups } = useAppStore();
   const [editingContact, setEditingContact] = useState<Contact | null>(null);
   const [selectedGroup, setSelectedGroup] = useState<string>('');
   const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
   const [confirmingSave, setConfirmingSave] = useState(false);

   // Pagination state
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10;

   // Calculate pagination
   const totalPages = Math.ceil(contacts.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const paginatedContacts = contacts.slice(startIndex, endIndex);

   const handleEditClick = (contact: Contact) => {
      setEditingContact(contact);
      setSelectedGroup(contact.groupIds[0] || 'default');
   };

   const initiateSaveEdit = () => {
      setConfirmingSave(true);
   };

   const executeSaveEdit = () => {
      if (editingContact) {
         updateContactGroups(editingContact.id, [selectedGroup]);
         setEditingContact(null);
         setConfirmingSave(false);
         toast.success("Contato atualizado com sucesso");
      }
   };

   const initiateDelete = (contact: Contact) => {
      setDeletingContact(contact);
   };

   const executeDelete = () => {
      if (deletingContact) {
         onDelete(deletingContact.id);
         setDeletingContact(null);
         toast.success("Contato excluído com sucesso");
      }
   };

   if (contacts.length === 0) {
      return (
         <div className="flex items-center justify-center h-full text-muted-foreground bg-slate-50">
            Nenhum contato encontrado.
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
         <div className="flex-1 overflow-auto relative">
            <table className="w-full caption-bottom text-sm text-left">
               <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                     <TableHead className="font-semibold text-slate-600">Nome</TableHead>
                     <TableHead className="font-semibold text-slate-600">Número</TableHead>
                     <TableHead className="font-semibold text-slate-600">Grupos</TableHead>
                     <TableHead className="text-center w-[120px] font-semibold text-slate-600">Ações</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {paginatedContacts.map((contact) => (
                     <TableRow key={contact.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-700">{contact.name}</TableCell>
                        <TableCell className="text-slate-600">{formatPhoneNumber(contact.number)}</TableCell>
                        <TableCell>
                           <div className="flex gap-1 flex-wrap">
                              {contact.groupIds.map((gid: string) => {
                                 const gName = groups.find(g => g.id === gid)?.name || 'Geral';
                                 return (
                                    <Badge key={gid} variant="secondary" className="text-xs bg-slate-100 text-slate-600 border-slate-200">
                                       {gName}
                                    </Badge>
                                 );
                              })}
                           </div>
                        </TableCell>
                        <TableCell className="text-center">
                           <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => handleEditClick(contact)}>
                                 <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => initiateDelete(contact)}>
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>
                        </TableCell>
                     </TableRow>
                  ))}
               </TableBody>
            </table>
         </div>

         {/* Pagination Controls - Fixed at bottom */}
         <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white shrink-0">
            <span className="text-sm text-muted-foreground">
               Mostrando {startIndex + 1}-{Math.min(endIndex, contacts.length)} de {contacts.length}
            </span>
            <div className="flex items-center gap-2">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
               >
                  <ChevronLeft className="w-4 h-4" />
               </Button>
               <span className="text-sm font-medium min-w-12 text-center">
                  {currentPage} / {totalPages}
               </span>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
               >
                  <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
         </div>

         <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Editar Grupo do Contato</DialogTitle>
               </DialogHeader>
               <div className="py-4 space-y-4">
                  <div>
                     <label className="text-sm font-medium">Nome</label>
                     <Input value={editingContact?.name || ''} disabled />
                  </div>
                  <div>
                     <label className="text-sm font-medium">Grupo</label>
                     <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                        <SelectTrigger>
                           <SelectValue placeholder="Selecione um grupo" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                           {groups.map(g => (
                              <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <Button onClick={initiateSaveEdit}>Salvar Alterações</Button>
               </div>
            </DialogContent>
         </Dialog>

         {/* Delete Confirmation */}
         <AlertDialog open={!!deletingContact} onOpenChange={(open) => !open && setDeletingContact(null)}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
                  <AlertDialogDescription>
                     Tem certeza que deseja excluir o contato <strong>{deletingContact?.name}</strong>?
                     Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={executeDelete} className="bg-destructive text-info-foreground hover:bg-destructive/90">
                     Excluir
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         {/* Save Confirmation */}
         <AlertDialog open={confirmingSave} onOpenChange={setConfirmingSave}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Salvar Alterações</AlertDialogTitle>
                  <AlertDialogDescription>
                     Deseja confirmar a alteração do grupo para o contato <strong>{editingContact?.name}</strong>?
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={executeSaveEdit} className="bg-primary text-primary-foreground hover:bg-primary/90">
                     Confirmar
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
}

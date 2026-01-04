'use client';

import { useState } from 'react';
import { useAppStore, Contact } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Plus, Trash2, Upload, Users, Pencil } from 'lucide-react';
import Papa from 'papaparse';

export default function ContactsPage() {
  const { groups, contacts, addContact, deleteContact, addGroup, deleteGroup, importContacts } = useAppStore();
  
  const [newContactName, setNewContactName] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [newContactGroupId, setNewContactGroupId] = useState('default');
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [isGroupOpen, setIsGroupOpen] = useState(false);

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

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.substring(0, 13);
    
    if (!limited) return '';
    if (limited.length <= 2) return `+${limited}`;
    if (limited.length <= 4) return `+${limited.substring(0, 2)} (${limited.substring(2)}`;
    if (limited.length <= 9) return `+${limited.substring(0, 2)} (${limited.substring(2, 4)}) ${limited.substring(4)}`;
    
    return `+${limited.substring(0, 2)} (${limited.substring(2, 4)}) ${limited.substring(4, 9)}-${limited.substring(9)}`;
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
                 groupIds: ['default']
              };
           }).filter((c): c is Omit<Contact, 'id'> => c !== null);
           
           importContacts(parsed);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Contatos & Grupos</h1>
      </div>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList >
          <TabsTrigger value="contacts">Todos os Contatos</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between">
             <div className="flex gap-2">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="w-4 h-4 mr-2 cursor-pointer" /> Adicionar Contato</Button>
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
                              placeholder="+55 (11) 99999-9999" 
                              value={newContactNumber} 
                              onChange={handlePhoneChange} 
                              maxLength={19} 
                           />
                           <p className="text-[10px] text-slate-400 pl-1">
                              Formato: +55 (DDD) Número
                           </p>
                        </div>
                        <Select value={newContactGroupId} onChange={(e) => setNewContactGroupId(e.target.value)}>
                            {groups.map(group => (
                                <option key={group.id} value={group.id}>{group.name}</option>
                            ))}
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
                   <Button variant="outline"><Upload className="w-4 h-4 mr-2" /> Importar CSV</Button>
                </div>
             </div>
             <div className="text-sm text-slate-500 self-center">
                Total: {contacts.length}
             </div>
          </div>

          <ValidContactTable contacts={contacts} onDelete={deleteContact} />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
           <div className="flex justify-start">
              <Dialog open={isGroupOpen} onOpenChange={setIsGroupOpen}>
                  <DialogTrigger asChild>
                    <Button><Users className="w-4 h-4 mr-2" /> Criar Grupo</Button>
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
                       <Button variant="ghost" size="icon" onClick={() => deleteGroup(group.id)}>
                         <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                       </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ValidContactTable({ contacts, onDelete }: { contacts: Contact[], onDelete: (id: string) => void }) {
   const { groups, updateContactGroups } = useAppStore();
   const [editingContact, setEditingContact] = useState<Contact | null>(null);
   const [selectedGroup, setSelectedGroup] = useState<string>('');

   if (contacts.length === 0) {
      return (
         <div className="text-center py-10 text-slate-500 border rounded-lg bg-slate-50">
            Nenhum contato encontrado. Adicione manualmente ou importe um CSV.
         </div>
      );
   }

   const handleEditClick = (contact: Contact) => {
      setEditingContact(contact);
      setSelectedGroup(contact.groupIds[0] || 'default');
   };

   const handleSaveEdit = () => {
      if (editingContact) {
         updateContactGroups(editingContact.id, [selectedGroup]);
         setEditingContact(null);
      }
   };

   return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Grupos</TableHead>
            <TableHead className="text-center w-[120px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">{contact.name}</TableCell>
              <TableCell>{contact.number}</TableCell>
              <TableCell>
                 <div className="flex gap-1">
                    {contact.groupIds.map((gid: string) => {
                       const gName = groups.find(g => g.id === gid)?.name || 'Geral';
                       return (
                           <Badge key={gid} variant="secondary" className="text-xs">
                              {gName}
                           </Badge>
                       );
                    })}
                 </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center gap-1">
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(contact)}>
                     <Pencil className="w-4 h-4 text-slate-500" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(contact.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                   </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
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
                  <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                     {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                     ))}
                  </Select>
               </div>
               <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
   );
}

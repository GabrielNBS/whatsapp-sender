import { Contact, Group } from '@/lib/types';
import { useContactSearch } from '@/hooks/useContactSearch';
import { useContactPagination } from '@/hooks/useContactPagination';
import { ContactSearch } from './ContactSearch';
import { ContactPagination } from './ContactPagination';
import { ContactRow } from './ContactRow';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnalyticsRecord } from '@/hooks/useContactAnalytics';

interface ContactTableProps {
  contacts: Contact[];
  groups: Group[];
  analytics: Record<string, AnalyticsRecord>;
  onEditClick: (contact: Contact) => void;
  onDeleteClick: (contact: Contact) => void;
}

export function ContactTable({
  contacts,
  groups,
  analytics,
  onEditClick,
  onDeleteClick,
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

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground dark:text-zinc-500 py-12">
        Nenhum contato encontrado.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 rounded-lg overflow-hidden">
      {/* Barra de Busca */}
      <ContactSearch
        value={searchTerm}
        onChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        onClear={() => {
          setSearchTerm('');
          setCurrentPage(1);
        }}
      />

      {/* Tabela de Contatos */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full caption-bottom text-sm text-left">
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Nome</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Número</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400">Grupos</TableHead>
              <TableHead className="font-semibold text-zinc-600 dark:text-zinc-400 text-center">Engajamento</TableHead>
              <TableHead className="text-center w-[120px] font-semibold text-zinc-600 dark:text-zinc-400">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white dark:bg-zinc-950">
            {paginatedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground dark:text-zinc-500">
                  Nenhum contato corresponde à pesquisa.
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  groups={groups}
                  analyticsStats={analytics[contact.number]}
                  onEditClick={onEditClick}
                  onDeleteClick={onDeleteClick}
                />
              ))
            )}
          </TableBody>
        </table>
      </div>

      {/* Paginação */}
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

import { useState } from "react";
import { Users, Check, UserPlus } from "lucide-react";
import { useGlobalSheet } from "@/components/dashboard/global-sheet-provider";
import { Button } from "@/components/ui/button";
import { Group, Contact } from "@/lib/store";
import { SearchTrigger, GroupList, ContactList } from "./recipient-selector/";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface RecipientSelectorProps {
  groups: Group[];
  contacts: Contact[];
  value: {
    type: "group" | "contact";
    id: string;
    name: string;
  };
  onChange: (value: {
    type: "group" | "contact";
    id: string;
    name: string;
  }) => void;
  getContactsByGroup: (groupId: string) => Contact[];
  disabled?: boolean;
}

export function RecipientSelector({
  groups,
  contacts,
  value,
  onChange,
  getContactsByGroup,
  disabled = false,
}: RecipientSelectorProps) {
  const { openSheet } = useGlobalSheet();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const hasNoData = groups.length === 0 && contacts.length === 0;

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const hasContacts = getContactsByGroup(group.id).length > 0;
    return matchesSearch && hasContacts;
  });

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.number.includes(searchTerm)
  );

  const handleSelect = (type: "group" | "contact", id: string, name: string) => {
    if (disabled) return;
    onChange({ type, id, name });
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`bg-card rounded-xl border border-border/50 p-5 space-y-5 relative transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="text-sm font-semibold text-foreground tracking-tight">
            Destinatários
          </h2>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => openSheet('contacts')}
          className="h-7 rounded-md text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 px-2.5 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5 mr-1.5 opacity-70" />
          Agenda
        </Button>
      </div>

      {hasNoData ? (
        <div className="py-10 px-6 flex flex-col items-center text-center space-y-4 bg-muted/5 rounded-xl border border-dashed border-border/60">
          <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center border border-border/50 text-muted-foreground/40 shadow-xs">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-sm text-foreground">Sua agenda está vazia</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">Adicione contatos ou grupos para habilitar o envio de mensagens.</p>
          </div>
          <Button
            onClick={() => openSheet('contacts')}
            variant="outline"
            className="h-9 rounded-lg px-5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            Adicionar Primeiro Contato
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground/70 ml-0.5">
            Público alvo da campanha
          </p>

          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <SearchTrigger
                value={value}
                isOpen={isOpen}
              />
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-xl border-border/60 shadow-xl" align="start">
              <Command shouldFilter={false} className="bg-popover">
                <div className="flex items-center px-3 border-b border-border/40">
                  <CommandInput
                    placeholder="Pesquisar contatos ou grupos..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                    className="h-11 border-none focus:ring-0 text-sm"
                  />
                </div>
                <CommandList className="max-h-[320px] premium-scrollbar py-1">
                  <CommandEmpty>
                    <div className="py-8 flex flex-col items-center text-center px-4">
                      <p className="text-xs font-medium text-muted-foreground italic">Nenhum resultado para "{searchTerm}"</p>
                    </div>
                  </CommandEmpty>

                  <CommandGroup heading="Ações">
                    <CommandItem
                      onSelect={() => handleSelect("group", "all", "Todos os Contatos")}
                      className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-lg mx-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">Todos os Contatos</span>
                      </div>
                      {value.id === "all" && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </CommandItem>
                  </CommandGroup>

                  <GroupList
                    groups={filteredGroups}
                    selectedId={value.id}
                    getContactCount={(id) => getContactsByGroup(id).length}
                    onSelect={(group) => handleSelect("group", group.id, group.name)}
                  />

                  <ContactList
                    contacts={filteredContacts}
                    selectedId={value.id}
                    onSelect={(contact) => handleSelect("contact", contact.id, contact.name)}
                  />
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

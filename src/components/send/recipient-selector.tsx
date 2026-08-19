import { useMemo, useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { useGlobalSheet } from "@/components/dashboard/global-sheet-provider";
import { Button } from "@/components/ui/button";
import type { Group, Contact } from '@/lib/types';
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
  value: Array<{
    type: "group" | "contact";
    id: string;
    name: string;
  }>;
  onChange: (value: Array<{
    type: "group" | "contact";
    id: string;
    name: string;
  }>) => void;
  disabled?: boolean;
}

export function RecipientSelector({
  groups,
  contacts,
  value,
  onChange,
  disabled = false,
}: RecipientSelectorProps) {
  const { openSheet } = useGlobalSheet();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const hasNoData = groups.length === 0 && contacts.length === 0;

  const groupContactCounts = useMemo(() => {
    const counts = new Map(groups.map((group) => [group.id, 0]));
    for (const contact of contacts.filter((item) => item.consentStatus !== 'OPTED_OUT')) {
      for (const groupId of contact.groupIds) {
        counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
      }
    }
    return counts;
  }, [contacts, groups]);

  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const hasContacts = (groupContactCounts.get(group.id) ?? 0) > 0;
    return matchesSearch && hasContacts;
  });

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.consentStatus !== 'OPTED_OUT' &&
      (contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.number.includes(searchTerm))
  );

  const selectedGroupIds = value
    .filter((item) => item.type === "group")
    .map((item) => item.id);
  const isAllSelected = selectedGroupIds.includes("all");
  const getSelectionOrder = (type: "group" | "contact", id: string) => {
    const index = value.findIndex((item) => item.type === type && item.id === id);
    return index >= 0 ? index + 1 : null;
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setSearchTerm("");
  };

  const handleSelect = (type: "group" | "contact", id: string, name: string) => {
    if (disabled) return;

    if (type === "group" && id === "all") {
      onChange(isAllSelected ? [] : [{ type, id, name }]);
      return;
    }

    const granularSelection = value.filter(
      (item) => !(item.type === "group" && item.id === "all")
    );
    const isSelected = granularSelection.some(
      (item) => item.type === type && item.id === id
    );

    onChange(
      isSelected
        ? granularSelection.filter((item) => !(item.type === type && item.id === id))
        : [...granularSelection, { type, id, name }]
    );
  };

  return (
    <div className={`relative space-y-5 rounded-xl border border-border bg-card p-5 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
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
          className="h-9 rounded-lg px-3 text-sm text-muted-foreground hover:text-primary"
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
          <p className="ml-0.5 text-sm font-medium text-muted-foreground">
            Público-alvo da campanha
          </p>

          <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <SearchTrigger
                value={value}
                isOpen={isOpen}
              />
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) overflow-hidden rounded-xl border-border p-0 shadow-lg" align="start">
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
                      <p className="text-xs font-medium text-muted-foreground italic">Nenhum resultado para &quot;{searchTerm}&quot;</p>
                    </div>
                  </CommandEmpty>

                  <CommandGroup heading="Ações">
                    <CommandItem
                      value="group:all:Todos os Contatos"
                      onSelect={() => handleSelect("group", "all", "Todos os Contatos")}
                      className="flex items-center justify-between cursor-pointer py-2.5 px-3 rounded-lg mx-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">Todos os Contatos</span>
                      </div>
                      <div className={`flex size-5 items-center justify-center rounded-full border text-xs font-bold ${isAllSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background'}`}>
                        {isAllSelected ? 1 : null}
                      </div>
                    </CommandItem>
                  </CommandGroup>

                  <GroupList
                    groups={filteredGroups}
                    getSelectionOrder={(id) => getSelectionOrder("group", id)}
                    getContactCount={(id) => groupContactCounts.get(id) ?? 0}
                    onSelect={(group) => handleSelect("group", group.id, group.name)}
                  />

                  <ContactList
                    contacts={filteredContacts}
                    getSelectionOrder={(id) => getSelectionOrder("contact", id)}
                    onSelect={(contact) => handleSelect("contact", contact.id, contact.name)}
                  />
                </CommandList>
                <div className="flex items-center justify-between border-t border-border/40 px-3 py-2.5">
                  <div className="leading-tight">
                    <p className="text-xs font-medium text-muted-foreground">
                      {value.length === 0
                        ? "Nenhuma seleção"
                        : `${value.length} ${value.length === 1 ? "seleção" : "seleções"}`}
                    </p>
                    {value.length > 1 && (
                      <p className="text-xs text-muted-foreground">
                        A numeração define a ordem de envio
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenChange(false)}
                    className="h-9 rounded-lg px-3 text-sm font-semibold"
                  >
                    Concluir
                  </Button>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}

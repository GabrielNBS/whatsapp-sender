import { useState, useRef, useEffect } from "react";
import { Users, Check } from "lucide-react";
import { Group, Contact } from "@/lib/store";
import { SearchTrigger, SearchInput, GroupList, ContactList } from "./recipient-selector/";

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
}

export function RecipientSelector({
  groups,
  contacts,
  value,
  onChange,
  getContactsByGroup,
}: RecipientSelectorProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.number.includes(searchTerm)
  );

  const handleSelect = (type: "group" | "contact", id: string, name: string) => {
    onChange({ type, id, name });
    setIsSearchOpen(false);
    setSearchTerm("");
  };

  return (
    <div
      className="bg-card rounded-xl shadow-sm border border-border p-4 space-y-4 relative z-50"
      ref={searchRef}
    >
      <h2 className="text-sm font-semibold flex items-center gap-2 text-foreground">
        <Users className="w-4 h-4 text-primary" />
        Destinatários
      </h2>
      <div className="space-y-1 relative">
        <label className="text-xs font-medium text-muted-foreground">
          Buscar Grupo ou Contato
        </label>

        <SearchTrigger
          value={value}
          isOpen={isSearchOpen}
          onToggle={() => setIsSearchOpen(!isSearchOpen)}
        />

        {isSearchOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col z-100">
            <SearchInput value={searchTerm} onChange={setSearchTerm} />
            
            <div className="overflow-y-auto flex-1 p-1">
              {/* All Contacts Option */}
              <div
                className="px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer flex items-center justify-between group"
                onClick={() => handleSelect("group", "all", "Todos os Contatos")}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Todos os Contatos</span>
                </div>
                {value.id === "all" && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>

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

              {filteredGroups.length === 0 && filteredContacts.length === 0 && (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  Nenhum resultado encontrado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

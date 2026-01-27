import { useState, useRef, useEffect } from "react";
import { Users, Search, Check, User } from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";
import { Group, Contact } from "@/lib/store";

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
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
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

        <div
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className={cn(
            "flex items-center justify-between w-full h-9 px-3 py-2 text-sm bg-background border rounded-md shadow-sm cursor-pointer hover:bg-accent",
            isSearchOpen
              ? "border-primary ring-1 ring-ring"
              : "border-border"
          )}
        >
          <span
            className={cn("truncate block", !value.name && "text-muted-foreground")}
          >
            {value.name}
          </span>
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
        </div>

        {isSearchOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col z-100">
            <div className="p-2 border-b border-border relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Filtrar..."
                className="w-full pl-7 pr-2 py-1 text-xs border-0 focus:ring-0 placeholder:text-muted-foreground outline-none bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="overflow-y-auto flex-1 p-1">
              <div
                className="px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer flex items-center justify-between group"
                onClick={() => {
                  onChange({
                    type: "group",
                    id: "all",
                    name: "Todos os Contatos",
                  });
                  setIsSearchOpen(false);
                  setSearchTerm("");
                }}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Todos os Contatos</span>
                </div>
                {value.id === "all" && (
                  <Check className="w-3.5 h-3.5 text-primary" />
                )}
              </div>

              {filteredGroups.length > 0 && (
                <>
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">
                    Grupos
                  </div>
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className="px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        onChange({
                          type: "group",
                          id: group.id,
                          name: group.name,
                        });
                        setIsSearchOpen(false);
                        setSearchTerm("");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{group.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({getContactsByGroup(group.id).length})
                        </span>
                      </div>
                      {value.id === group.id && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* CONTACTS */}
              {filteredContacts.length > 0 && (
                <>
                  <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-2">
                    Contatos
                  </div>
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="px-2 py-1.5 text-sm hover:bg-accent rounded cursor-pointer flex items-center justify-between"
                      onClick={() => {
                        onChange({
                          type: "contact",
                          id: contact.id,
                          name: contact.name,
                        });
                        setIsSearchOpen(false);
                        setSearchTerm("");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span>{contact.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatPhoneNumber(contact.number)}
                          </span>
                        </div>
                      </div>
                      {value.id === contact.id && (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                  ))}
                </>
              )}

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

import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * SearchInput - Filter input inside the dropdown
 */
export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="p-2 border-b border-border relative">
      <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
      <input
        autoFocus
        type="text"
        placeholder="Filtrar..."
        className="w-full pl-7 pr-2 py-1 text-xs border-0 focus:ring-0 placeholder:text-muted-foreground outline-none bg-transparent"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

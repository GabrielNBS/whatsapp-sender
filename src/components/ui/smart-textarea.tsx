import * as React from "react"
import { cn } from "@/lib/utils"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface SmartTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onValueChange?: (value: string) => void;
    snippets?: { trigger: string, content: string }[];
}

const VARIABLES = [
    { label: "Nome", value: "{{name}}" },
    { label: "Telefone", value: "{{phone}}" },
    { label: "Email", value: "{{email}}" },
    { label: "Documento", value: "{{document}}" },
];

export const SmartTextarea = React.forwardRef<HTMLTextAreaElement, SmartTextareaProps>(
  ({ className, onValueChange, onChange, snippets = [], ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [mode, setMode] = React.useState<'variable' | 'snippet' | null>(null);
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);
    
    // Merge refs
    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const selectionStart = e.target.selectionStart;
        
        // Check for triggers
        const lastChar = value.slice(selectionStart - 1, selectionStart);
        
        // Detect Trigger: '{' for variables
        if (lastChar === '{') { 
             setMode('variable');
             setOpen(true);
        }
        // Detect Trigger: '/' for snippets
        else if (lastChar === '/') {
            setMode('snippet');
            setOpen(true);
        }
        else if (open) {
             // Close if typing space or newline
             if (lastChar === ' ' || lastChar === '\n') {
                 setOpen(false);
             }
        }

        if (onChange) onChange(e);
        if (onValueChange) onValueChange(value);
    };

    const handleSelect = (value: string) => {
         if (!internalRef.current) return;
         
         const textarea = internalRef.current;
         const currentVal = textarea.value;
         const selectionStart = textarea.selectionStart;
         
         let insertion = value;
         
         // If mode is variable, we might need to adjust logic if '{' was typed.
         // Current logic assumption: user typed '{', popup opens. 
         // If they select '{{name}}', we act as if we replace the '{' or append?
         // Simplest: Delete the trigger char and insert the full value.
         
         const prefix = currentVal.slice(0, selectionStart - 1);
         const suffix = currentVal.slice(selectionStart);
         
         const newValue = prefix + insertion + suffix;
         
         // Update native value for visual
         textarea.value = newValue;
         
         // Trigger change for libraries like react-hook-form
         // This is tricky without a real event, but onValueChange helps custom consumers
         if (onValueChange) onValueChange(newValue);

         // Creating a synthetic event for standard onChange if needed is complex here.
         // We rely on onValueChange propagation for controlled components.
         
         // Move cursor
         const newCursorPos = prefix.length + insertion.length;
         
         // We need to wait for render cycle or force update to set selection?
         // Usually setting value synchronously works.
         setTimeout(() => {
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
         }, 0);

         setOpen(false);
    };

    const filteredItems = mode === 'variable' 
        ? VARIABLES 
        : snippets.map(s => ({ label: `${s.trigger} - ${s.content.slice(0, 20)}...`, value: s.content }));

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
         if (open && e.key === 'Escape') {
             setOpen(false);
             e.preventDefault();
         }
         // We could handle ArrowDown/Up/Enter here to navigation the Command list manually
         // But interacting with Radix Command via ref is undocumented.
         // For now, let's keep it mouse/touch mostly or basic.
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
           <div className="relative w-full">
                <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={internalRef}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                {...props}
                />
           </div>
        </PopoverTrigger>
        <PopoverContent 
            className="w-[200px] p-0" 
            align="start" 
            side="bottom"
            onOpenAutoFocus={(e) => e.preventDefault()} 
        >
          <Command>
            <CommandList>
              <CommandGroup heading={mode === 'variable' ? "Variáveis" : "Snippets"}>
                {filteredItems.length > 0 ? filteredItems.map((item) => (
                  <CommandItem
                    key={item.value + item.label} // unique key
                    onSelect={() => handleSelect(item.value)}
                    className="cursor-pointer"
                  >
                    {item.label}
                  </CommandItem>
                )) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        Nenhum item encontrado.
                    </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)
SmartTextarea.displayName = "SmartTextarea"

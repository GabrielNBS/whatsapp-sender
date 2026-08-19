"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Command, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { snippetsApi, type Snippet } from '@/services/settings/snippetsApi';


export function SnippetSettings() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [trigger, setTrigger] = useState("");
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchSnippets();
  }, []);

  const fetchSnippets = async () => {
    try {
      setSnippets(await snippetsApi.list());
    } catch {
      toast.error(`Erro ao carregar snippets`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!trigger || !content) {
      toast.warning("Preencha o gatilho e o conteúdo");
      return;
    }

    setIsCreating(true);
    try {
      const snippet = await snippetsApi.create({ trigger, content });
      setSnippets((current) => [...current, snippet]);
      toast.success("Snippet criado");
      setTrigger("");
      setContent("");
    } catch {
      toast.error(`Erro ao criar snippet`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await snippetsApi.remove(id);
      toast.success("Snippet removido");
      setSnippets((current) => current.filter((snippet) => snippet.id !== id));
    } catch {
      toast.error(`Erro ao remover snippet`);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Command className="w-5 h-5 text-muted-foreground" />
          Snippets de texto
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto] items-end">
        <div className="space-y-2">
          <Label htmlFor="snippet-trigger">Gatilho (ex.: /pix)</Label>
          <Input
            id="snippet-trigger"
            placeholder="/atalho"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="snippet-content">Conteúdo do texto</Label>
          <Input
            id="snippet-content"
            placeholder="Texto que será inserido..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate} disabled={isCreating} aria-label="Criar snippet">
          {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground text-sm">Carregando...</div>
        ) : snippets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border-dashed border-2 rounded-lg">
            Nenhum snippet criado ainda.
          </div>
        ) : (
          <div className="grid gap-2">
            {snippets.map((snippet) => (
              <div
                key={snippet.id}
                className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border group"
              >
                <div className="flex items-center gap-4">
                  <code className="rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                    {snippet.trigger}
                  </code>
                  <span className="max-w-[300px] truncate text-sm text-muted-foreground">
                    {snippet.content}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(snippet.id)}
                  aria-label={`Remover snippet ${snippet.trigger}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

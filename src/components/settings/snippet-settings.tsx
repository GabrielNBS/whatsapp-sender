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
          Snippets de Texto
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto] items-end">
        <div className="space-y-2">
          <Label>Gatilho (ex: /pix)</Label>
          <Input
            placeholder="/atalho"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Conteúdo do Texto</Label>
          <Input
            placeholder="Texto que será inserido..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate} disabled={isCreating}>
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
                  <code className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {snippet.trigger}
                  </code>
                  <span className="text-sm text-gray-600 truncate max-w-[300px]">
                    {snippet.content}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(snippet.id)}
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

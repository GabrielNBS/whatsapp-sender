"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Save, Loader2, Link as LinkIcon, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function GeneralSettings() {
  const [defaultLink, setDefaultLink] = useState("");
  const [defaultCTA, setDefaultCTA] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [linkError, setLinkError] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setDefaultLink(data.defaultLink || "");
        setDefaultCTA(data.defaultCTA || "");
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
      toast.error("Erro ao carregar configurações gerais");
    } finally {
      setIsLoading(false);
    }
  };

  const validateLink = (url: string) => {
    if (!url) {
        setLinkError("");
        return true;
    }
    // Simple regex for URL validation (http/https required)
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url)) {
        setLinkError("Insira uma URL válida (ex: https://site.com)");
        return false;
    }
    setLinkError("");
    return true;
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDefaultLink(val);
    if (val) validateLink(val);
    else setLinkError("");
  };

  const handleSave = async () => {
    if (!validateLink(defaultLink)) {
        toast.error("Corrija o link antes de salvar");
        return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultLink, defaultCTA }),
      });

      if (res.ok) {
        toast.success("Configurações salvas com sucesso");
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          Geral
        </h3>
        <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="default-link" className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-500" />
                Link Padrão
            </Label>
            <Input
                id="default-link"
                placeholder="Ex: https://meusite.com/promo"
                value={defaultLink}
                onChange={handleLinkChange}
                className={linkError ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {linkError ? (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {linkError}
                </p>
            ) : (
                <p className="text-xs text-muted-foreground">
                    Link que será inserido automaticamente nos modelos.
                </p>
            )}
            </div>

            <div className="space-y-2">
            <Label htmlFor="default-cta">Mensagem de CTA Padrão</Label>
            <Textarea
                id="default-cta"
                placeholder="Ex: Clique no link abaixo para aproveitar:"
                value={defaultCTA}
                onChange={(e) => setDefaultCTA(e.target.value)}
                className="h-24 resize-none"
            />
            <p className="text-xs text-muted-foreground">
                Texto de chamada para ação que acompanhará o link.
            </p>
            </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
                <Eye className="w-4 h-4" />
                Visualização do Rodapé
            </Label>
            <Card className="p-4 bg-muted/30 border-dashed min-h-[160px] flex items-center justify-center text-sm">
                {(defaultCTA || defaultLink) ? (
                    <div className="w-full space-y-2">
                         <p className="text-gray-400 text-xs italic text-center mb-4">...conteúdo da sua mensagem...</p>
                         <div className="bg-white p-3 rounded-lg border shadow-sm space-y-1">
                             {defaultCTA && <p className="text-gray-800 whitespace-pre-wrap">{defaultCTA}</p>}
                             {defaultLink && <p className="text-blue-600 underline break-all">{defaultLink}</p>}
                         </div>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center text-xs">
                        Preencha os campos para visualizar como o rodapé aparecerá nas mensagens.
                    </p>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
}

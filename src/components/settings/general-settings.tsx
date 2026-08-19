"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Save, Loader2, Link as LinkIcon, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { usePreferencesStore } from '@/stores/preferences-store';
import { Code2 } from "lucide-react";
import { settingsApi } from '@/services/settings/settingsApi';

export function GeneralSettings() {
  const [defaultLink, setDefaultLink] = useState("");
  const [defaultCTA, setDefaultCTA] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [linkError, setLinkError] = useState("");
  const { devMode, setDevMode } = usePreferencesStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.get();
      setDefaultLink(data.defaultLink || "");
      setDefaultCTA(data.defaultCTA || "");
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
      await settingsApi.update({ defaultLink, defaultCTA });
      toast.success("Configurações salvas com sucesso");
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
        <Button onClick={handleSave} disabled={isSaving} size="sm">
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
                <LinkIcon className="w-4 h-4 text-primary" />
                Link padrão
            </Label>
            <Input
                id="default-link"
                placeholder="Ex: https://meusite.com/promo"
                value={defaultLink}
                onChange={handleLinkChange}
                aria-describedby={linkError ? "default-link-error" : "default-link-help"}
                aria-invalid={Boolean(linkError)}
            />
            {linkError ? (
                <p id="default-link-error" className="flex items-center gap-1 text-xs text-destructive" role="alert">
                    <AlertCircle className="w-3 h-3" />
                    {linkError}
                </p>
            ) : (
                <p id="default-link-help" className="text-xs text-muted-foreground">
                    Link que será inserido automaticamente nos modelos.
                </p>
            )}
            </div>

            <div className="space-y-2">
            <Label htmlFor="default-cta">Mensagem de CTA padrão</Label>
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
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Eye className="w-4 h-4" />
                Visualização do rodapé
            </div>
            <Card className="p-4 bg-muted/30 border-dashed min-h-[160px] flex items-center justify-center text-sm">
                {(defaultCTA || defaultLink) ? (
                    <div className="w-full space-y-2">
                         <p className="mb-4 text-center text-xs italic text-muted-foreground">...conteúdo da sua mensagem...</p>
                         <div className="space-y-1 rounded-lg border bg-background p-3 shadow-sm">
                             {defaultCTA && <p className="whitespace-pre-wrap text-foreground">{defaultCTA}</p>}
                             {defaultLink && <p className="break-all text-primary underline">{defaultLink}</p>}
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

      <div className="h-px bg-border/50 my-6" />

      <div className="space-y-4">
          <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-primary" />
                      <Label htmlFor="developer-mode">Modo desenvolvedor</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Habilita o menu flutuante de simulação de estados (Debug UI).</p>
              </div>
              <Switch
                  id="developer-mode"
                  checked={devMode}
                  onCheckedChange={setDevMode}
              />
          </div>
      </div>
    </div>
  );
}

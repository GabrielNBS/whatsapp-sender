"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Save, Loader2, Link as LinkIcon, AlertCircle, Eye, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { usePreferencesStore } from '@/stores/preferences-store';
import { Code2 } from "lucide-react";
import { settingsApi } from '@/services/settings/settingsApi';
import {
  DEFAULT_OPT_OUT_FOOTER_ID,
  OPT_OUT_FOOTER_OPTIONS,
  type OptOutFooterId,
} from '@/domain/opt-out-footer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function GeneralSettings() {
  const [defaultLink, setDefaultLink] = useState("");
  const [defaultCTA, setDefaultCTA] = useState("");
  const [optOutFooterId, setOptOutFooterId] = useState<OptOutFooterId>(DEFAULT_OPT_OUT_FOOTER_ID);
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
      setOptOutFooterId(data.optOutFooterId || DEFAULT_OPT_OUT_FOOTER_ID);
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
      await settingsApi.update({ defaultLink, defaultCTA, optOutFooterId });
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
                {(defaultCTA || defaultLink || optOutFooterId) ? (
                    <div className="w-full space-y-2">
                         <p className="mb-4 text-center text-xs italic text-muted-foreground">...conteúdo da sua mensagem...</p>
                         <div className="space-y-1 rounded-lg border bg-background p-3 shadow-sm">
                             {defaultCTA && <p className="whitespace-pre-wrap text-foreground">{defaultCTA}</p>}
                             {defaultLink && <p className="break-all text-primary underline">{defaultLink}</p>}
                             <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                               {OPT_OUT_FOOTER_OPTIONS.find((option) => option.id === optOutFooterId)?.text}
                             </div>
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

      <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <Label htmlFor="opt-out-footer">Rodapé obrigatório de cancelamento</Label>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Uma destas mensagens será anexada automaticamente ao final de todo envio. Essa proteção não pode ser desativada pela aplicação.
          </p>
        </div>
        <Select value={optOutFooterId} onValueChange={(value) => setOptOutFooterId(value as OptOutFooterId)}>
          <SelectTrigger id="opt-out-footer" aria-label="Texto obrigatório de cancelamento">
            <SelectValue placeholder="Selecione o texto do rodapé" />
          </SelectTrigger>
          <SelectContent>
            {OPT_OUT_FOOTER_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="rounded-lg border border-border bg-background p-3 text-sm text-foreground">
          {OPT_OUT_FOOTER_OPTIONS.find((option) => option.id === optOutFooterId)?.text}
        </p>
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

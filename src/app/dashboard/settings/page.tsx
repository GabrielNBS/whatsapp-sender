'use client';

import { Settings, BarChart3, Command } from "lucide-react";
import { ReportSettings } from "@/components/settings/report-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { SnippetSettings } from "@/components/settings/snippet-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 bg-muted rounded-lg">
          <Settings className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as opções do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 pb-4">
            <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
            <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="w-4 h-4" /> Geral
            </TabsTrigger>
            <TabsTrigger value="snippets" className="flex items-center gap-2">
                <Command className="w-4 h-4" /> Snippets
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Relatórios
            </TabsTrigger>
            </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 -mr-4">
            <TabsContent value="general" className="mt-0 h-full">
            <GeneralSettings />
            </TabsContent>
            
            <TabsContent value="snippets" className="mt-0 h-full">
            <SnippetSettings />
            </TabsContent>
            
            <TabsContent value="reports" className="mt-0 h-full">
            <ReportSettings />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

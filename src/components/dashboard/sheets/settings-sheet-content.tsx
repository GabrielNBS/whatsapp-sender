'use client';

import { useState } from 'react';
import { SplitText } from '@/components/ui/split-text';
import { AnimatedContent } from '@/components/ui/animated-content';

import { Settings, BarChart3, Command } from "lucide-react";
import { ReportSettings } from "@/components/settings/report-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { SnippetSettings } from "@/components/settings/snippet-settings";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SettingsSheetContent() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="p-2 bg-muted rounded-lg">
          <Settings className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <SplitText text="Configurações" as="h1" className="text-2xl font-bold" />
          <p className="text-sm text-muted-foreground">
            Gerencie as opções do sistema
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
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
          <AnimatedContent activeKey={activeTab} spring="gentle" direction="vertical" offset={16}>
            <div className="mt-0 h-full">
                {activeTab === 'general' && <GeneralSettings />}
                {activeTab === 'snippets' && <SnippetSettings />}
                {activeTab === 'reports' && <ReportSettings />}
            </div>
          </AnimatedContent>
        </div>
      </Tabs>
    </div>
  );
}

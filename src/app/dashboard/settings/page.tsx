'use client';

import { Settings } from "lucide-react";
import { ReportSettings } from "@/components/settings/report-settings";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
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

      {/* Report Settings Section */}
      <ReportSettings />
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Trash2, 
  Phone, 
  User, 
  Bell,
  BellOff,
  Clock,
  Settings,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface Recipient {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
}

interface ReportConfig {
  sendImmediate: boolean;
  sendEngagement: boolean;
  engagementDelayMins: number;
  engagementTimeFixed: string | null;
}

export function ReportSettings() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // New recipient form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Phone mask: +55 (11) 99999-9999
  const applyPhoneMask = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 13);
    
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  };

  // Extract raw phone from masked value
  const extractRawPhone = (masked: string): string => {
    return masked.replace(/\D/g, '');
  };

  // Handle phone input with mask
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyPhoneMask(e.target.value);
    setNewPhone(masked);
  };

  // Fetch recipients and config
  const fetchData = useCallback(async () => {
    try {
      const [recipientsRes, configRes] = await Promise.all([
        fetch('/api/reports/recipients'),
        fetch('/api/reports/config'),
      ]);

      if (recipientsRes.ok) {
        setRecipients(await recipientsRes.json());
      }
      if (configRes.ok) {
        setConfig(await configRes.json());
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add new recipient
  const handleAddRecipient = async () => {
    const rawPhone = extractRawPhone(newPhone);
    
    if (!newName.trim() || rawPhone.length < 12) {
      toast.error('Preencha nome e telefone completo (ex: +55 11 99999-9999)');
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/reports/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, phone: rawPhone }),
      });

      if (res.ok) {
        const recipient = await res.json();
        setRecipients(prev => [recipient, ...prev]);
        setNewName('');
        setNewPhone('');
        toast.success('Gestor adicionado!');
      } else {
        throw new Error('Failed to add');
      }
    } catch (error) {
      toast.error('Erro ao adicionar gestor');
    } finally {
      setIsAdding(false);
    }
  };

  // Toggle recipient active status
  const handleToggleActive = async (recipientId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/reports/recipients/${recipientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        setRecipients(prev => 
          prev.map(r => r.id === recipientId ? { ...r, isActive: !isActive } : r)
        );
        toast.success(isActive ? 'Gestor desativado' : 'Gestor ativado');
      }
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  // Delete recipient
  const handleDeleteRecipient = async (recipientId: string) => {
    try {
      const res = await fetch(`/api/reports/recipients/${recipientId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setRecipients(prev => prev.filter(r => r.id !== recipientId));
        toast.success('Gestor removido');
      }
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  // Update config
  const handleUpdateConfig = async (updates: Partial<ReportConfig>) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/reports/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setConfig(prev => prev ? { ...prev, ...updates } : null);
        toast.success('Configurações salvas');
      }
    } catch (error) {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  // Format phone for display
  const formatPhone = (phone: string) => {
    if (phone.length === 13) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  // Send test report
  const handleSendTestReport = async () => {
    if (recipients.filter(r => r.isActive).length === 0) {
      toast.error('Cadastre pelo menos um gestor ativo');
      return;
    }
    
    setIsTesting(true);
    try {
      const res = await fetch('/api/reports/test', {
        method: 'POST',
      });

      const data = await res.json();
      
      if (res.ok) {
        const successCount = data.results?.filter((r: { success: boolean }) => r.success).length || 0;
        toast.success(`Teste enviado para ${successCount} gestor(es)`);
        console.log('[Test Report] Results:', data);
      } else {
        toast.error(data.error || 'Erro ao enviar teste');
        console.error('[Test Report] Error:', data);
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Relatórios Automáticos</h2>
            <p className="text-sm text-muted-foreground">
              Configure quem recebe os relatórios de campanha
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSendTestReport}
          disabled={isTesting || recipients.filter(r => r.isActive).length === 0}
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Phone className="w-4 h-4 mr-2" />
          )}
          Enviar Teste
        </Button>
      </div>

      {/* Config Section */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-foreground" />
          Configurações
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Relatório Imediato</p>
              <p className="text-xs text-muted-foreground">Enviar ao finalizar campanha</p>
            </div>
            <Switch
              checked={config?.sendImmediate ?? true}
              onCheckedChange={(checked) => handleUpdateConfig({ sendImmediate: checked })}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Relatório de Engajamento</p>
              <p className="text-xs text-muted-foreground">Enviar após período de análise</p>
            </div>
            <Switch
              checked={config?.sendEngagement ?? true}
              onCheckedChange={(checked) => handleUpdateConfig({ sendEngagement: checked })}
              disabled={isSaving}
            />
          </div>

          {config?.sendEngagement && (
            <div className="flex items-center gap-3 pt-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Enviar após</span>
              <Input
                type="number"
                value={config?.engagementDelayMins ?? 240}
                onChange={(e) => handleUpdateConfig({ engagementDelayMins: parseInt(e.target.value) || 240 })}
                className="w-20 h-8"
                min={30}
                max={1440}
              />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
          )}
        </div>
      </div>

      {/* Recipients Section */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Gestores ({recipients.length})
        </h3>

        {/* Add New Form */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Nome do gestor"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="flex-1">
          <Input
              placeholder="+55 (11) 99999-9999"
              value={newPhone}
              onChange={handlePhoneChange}
              className="h-9"
            />
          </div>
          <Button
            onClick={handleAddRecipient}
            disabled={isAdding}
            size="sm"
            className="h-9"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Recipients List */}
        <div className="space-y-2">
          {recipients.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum gestor cadastrado</p>
              <p className="text-xs">Adicione números para receber relatórios</p>
            </div>
          ) : (
            recipients.map((recipient) => (
              <div
                key={recipient.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  recipient.isActive 
                    ? "bg-background border-border" 
                    : "bg-muted/30 border-muted opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                    recipient.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {recipient.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{recipient.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatPhone(recipient.phone)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(recipient.id, recipient.isActive)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title={recipient.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {recipient.isActive ? (
                      <Bell className="w-4 h-4 text-success" />
                    ) : (
                      <BellOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteRecipient(recipient.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

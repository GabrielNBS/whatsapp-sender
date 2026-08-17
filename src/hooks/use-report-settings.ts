'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  reportsApi,
  type ReportConfig,
  type ReportRecipient,
} from '@/services/reports/reportsApi';

export function formatReportPhone(phone: string) {
  if (phone.length !== 13) return phone;
  return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
}

export function maskReportPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `+${digits}`;
  if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
  if (digits.length <= 9) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
}

export function useReportSettings() {
  const [recipients, setRecipients] = useState<ReportRecipient[]>([]);
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await reportsApi.getSettings();
      setRecipients(data.recipients);
      setConfig(data.config);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const addRecipient = async () => {
    const rawPhone = newPhone.replace(/\D/g, '');
    if (!newName.trim() || rawPhone.length < 12) {
      toast.error('Preencha nome e telefone completo (ex: +55 11 99999-9999)');
      return;
    }

    setIsAdding(true);
    try {
      const recipient = await reportsApi.addRecipient({ name: newName, phone: rawPhone });
      setRecipients((current) => [recipient, ...current]);
      setNewName('');
      setNewPhone('');
      toast.success('Gestor adicionado!');
    } catch {
      toast.error('Erro ao adicionar gestor');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleRecipient = async (recipientId: string, isActive: boolean) => {
    try {
      const updatedRecipient = await reportsApi.updateRecipient(recipientId, { isActive: !isActive });
      setRecipients((current) => current.map(
        (recipient) => recipient.id === recipientId ? updatedRecipient : recipient,
      ));
      toast.success(isActive ? 'Gestor desativado' : 'Gestor ativado');
    } catch {
      toast.error('Erro ao atualizar');
    }
  };

  const deleteRecipient = async (recipientId: string) => {
    try {
      await reportsApi.removeRecipient(recipientId);
      setRecipients((current) => current.filter((recipient) => recipient.id !== recipientId));
      toast.success('Gestor removido');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const updateConfig = async (updates: Partial<ReportConfig>) => {
    setIsSaving(true);
    try {
      setConfig(await reportsApi.updateConfig(updates));
      toast.success('Configurações salvas');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestReport = async () => {
    if (!recipients.some((recipient) => recipient.isActive)) {
      toast.error('Cadastre pelo menos um gestor ativo');
      return;
    }

    setIsTesting(true);
    try {
      const data = await reportsApi.sendTest();
      const successCount = data.results?.filter((result) => result.success).length || 0;
      toast.success(`Teste enviado para ${successCount} gestor(es)`);
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setIsTesting(false);
    }
  };

  return {
    activeRecipientCount: recipients.filter((recipient) => recipient.isActive).length,
    addRecipient,
    config,
    deleteRecipient,
    isAdding,
    isLoading,
    isSaving,
    isTesting,
    newName,
    newPhone,
    recipients,
    sendTestReport,
    setNewName,
    setNewPhone: (value: string) => setNewPhone(maskReportPhone(value)),
    toggleRecipient,
    updateConfig,
  };
}

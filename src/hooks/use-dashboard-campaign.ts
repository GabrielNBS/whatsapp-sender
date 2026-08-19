'use client';

import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGlobalSheet } from '@/components/dashboard/global-sheet-provider';
import { useAppLogger } from '@/hooks/use-app-logger';
import { useConnectionStatus } from '@/hooks/use-connection-status';
import { useHydrated } from '@/hooks/use-hydrated';
import { useScheduleMessages } from '@/hooks/use-schedule-messages';
import { useScheduler } from '@/hooks/use-scheduler';
import { useSendForm } from '@/hooks/use-send-form';
import { useSender } from '@/hooks/use-sender';
import { useSendPageInitialStep } from '@/hooks/use-send-page-initial-step';
import { useTemplateCatalog } from '@/hooks/use-template-catalog';
import { getCampaignProgress } from '@/lib/campaign-progress';
import { useContactStore, selectContactsByGroup } from '@/stores/contact-store';
import { useTransmissionStore } from '@/stores/transmission-store';
import { isScheduleDateValid } from '@/lib/utils';
import type { ConfirmationPort, FeedbackPort } from '@/presentation/feedback';
import { useDebugSimulationStore } from '@/stores/debug-simulation-store';
import type { ScheduledCampaignOverlay } from '@/lib/types';

export type RecipientMode = 'GRUPOS' | 'CONTATOS' | 'MISTO';

export function useDashboardCampaign(feedback: FeedbackPort, confirmAction: ConfirmationPort) {
  const { groups, contacts } = useContactStore(useShallow((state) => ({
    groups: state.groups,
    contacts: state.contacts,
  })));
  const {
    sendingStatus,
    cleanupLogs,
    clearLogs,
    finishSending,
    resetSending,
  } = useTransmissionStore(useShallow((state) => ({
    sendingStatus: state.sendingStatus,
    cleanupLogs: state.cleanupLogs,
    clearLogs: state.clearLogs,
    finishSending: state.finishSending,
    resetSending: state.resetSending,
  })));
  const getContactsByGroup = (groupId: string) => selectContactsByGroup(contacts, groupId);
  const { activeSchedules, fetchSchedules, completedSchedules } = useScheduler(feedback);
  const { handleSend, handleStop } = useSender(feedback, confirmAction);
  const { templates, loadTemplate } = useTemplateCatalog();
  const hydrated = useHydrated();
  const { openSheet } = useGlobalSheet();
  const { status: connectionStatus } = useConnectionStatus({ pollingInterval: 5000 });
  const addLog = useAppLogger();
  const initialStep = useSendPageInitialStep();

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [connectionPromptOpen, setConnectionPromptOpen] = useState(false);
  const [scheduledOverlayData, setScheduledOverlayData] = useState<ScheduledCampaignOverlay | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const debugForceScreen = useDebugSimulationStore((state) => state.forceScreen);

  const {
    recipientConfigs,
    message,
    selectedFile,
    isScheduleMode,
    scheduleDate,
    selectedTemplateId,
    recipients,
    recipientBatches,
    setRecipientConfigs,
    setMessage,
    setSelectedFile,
    setIsScheduleMode,
    setScheduleDate,
    handleTemplateSelect,
    resetForm,
  } = useSendForm({ contacts, getContactsByGroup, templates, loadTemplate });

  const isSending = sendingStatus.isSending;
  const isConnected = connectionStatus === 'connected';
  const campaignProgress = getCampaignProgress(sendingStatus);
  const connectionPromptVisible = connectionPromptOpen && !isConnected;

  const scheduledOverlay = useMemo<ScheduledCampaignOverlay | null>(() => {
    if (scheduledOverlayData) return scheduledOverlayData;
    if (sendingStatus.statusMessage !== 'Agendado') return null;

    const nextScheduledBatch = activeSchedules.find((schedule) => schedule.count > 0);
    return nextScheduledBatch
      ? {
          batchId: nextScheduledBatch.batchId,
          batchName: nextScheduledBatch.batchName,
          scheduledFor: String(nextScheduledBatch.scheduledFor),
          contactCount: nextScheduledBatch.total,
        }
      : null;
  }, [activeSchedules, scheduledOverlayData, sendingStatus.statusMessage]);

  useEffect(() => {
    const interval = window.setInterval(cleanupLogs, 60_000);
    return () => window.clearInterval(interval);
  }, [cleanupLogs]);

  useEffect(() => {
    return useDebugSimulationStore.subscribe((state, previousState) => {
      if (state.revision === previousState.revision) return;
      setScheduledOverlayData(state.scheduledOverlay);
      if (state.step !== null) setCurrentStep(state.step);
      if (state.forceScreen || state.scheduledOverlay) setCurrentStep(3);
    });
  }, []);

  useEffect(() => {
    if ((isSending || scheduledOverlay) && currentStep !== 3) {
      const timeoutId = window.setTimeout(() => setCurrentStep(3), 0);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [currentStep, isSending, scheduledOverlay]);

  useEffect(() => {
    if (!scheduledOverlayData) return;

    const completedSchedule = completedSchedules.find(
      (schedule) => schedule.batchId === scheduledOverlayData.batchId,
    );
    if (!completedSchedule) return;

    const timeoutId = window.setTimeout(() => {
      finishSending({
        isPaused: false,
        stoppedByUser: false,
        statusMessage: completedSchedule.failed > 0
          ? 'Agendamento concluído com falhas.'
          : 'Agendamento concluído.',
        progress: 100,
        currentContactIndex: completedSchedule.total,
        totalContacts: completedSchedule.total,
        sentCount: completedSchedule.sent,
        failedCount: completedSchedule.failed,
      });
      setScheduledOverlayData(null);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [completedSchedules, finishSending, scheduledOverlayData]);

  const scheduledStatusComplete = Boolean(
    scheduledOverlay
      && !isSending
      && sendingStatus.totalContacts > 0
      && sendingStatus.progress >= 100
      && campaignProgress.processed >= sendingStatus.totalContacts,
  );

  const singleRecipientConfig = recipientConfigs.length === 1 ? recipientConfigs[0] : null;
  const hasSelectedGroups = recipientConfigs.some((config) => config.type === 'group');
  const hasSelectedContacts = recipientConfigs.some((config) => config.type === 'contact');
  const recipientMode: RecipientMode = hasSelectedGroups && hasSelectedContacts
    ? 'MISTO'
    : hasSelectedContacts
      ? 'CONTATOS'
      : 'GRUPOS';
  const batchName = singleRecipientConfig?.type === 'contact'
    ? `Envio para ${singleRecipientConfig.name}`
    : `Campanha para ${recipients.length} contatos`;
  const isNextStepDisabled = currentStep === 1 && recipients.length === 0;

  const canNavigateTo = (targetStep: number) => {
    if (targetStep === 3 && (isSending || scheduledOverlay)) return true;
    if (targetStep <= currentStep) return true;
    if (targetStep === 1 && currentStep === 0) return true;
    if (targetStep === 2) return isConnected && recipients.length > 0;
    if (targetStep === 3) return recipients.length > 0 && Boolean(message || selectedFile);
    return false;
  };

  const handleNext = () => {
    if (currentStep >= 2) return;
    if (currentStep === 1 && !isConnected) {
      setConnectionPromptOpen(true);
      return;
    }
    if (canNavigateTo(currentStep + 1)) {
      setCurrentStep((step) => step + 1);
      return;
    }
    if (currentStep === 1) feedback.error('Selecione os destinatários antes de prosseguir.');
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((step) => step - 1);
  };

  const { mutate: scheduleMessages } = useScheduleMessages({
    onSuccess: () => {
      addLog('Agendamento realizado com sucesso!', 'success');
      feedback.success('Agendamento realizado com sucesso!');
      resetForm();
      fetchSchedules();
      setCurrentStep(3);
      setIsScheduling(false);
    },
    onError: (error) => {
      addLog(`Erro ao agendar: ${error.message}`, 'error');
      feedback.error('Erro ao agendar envio.');
      setIsScheduling(false);
    },
  });

  const handleSchedule = async () => {
    if (!scheduleDate) {
      feedback.error('Selecione uma data para agendar.');
      return;
    }
    if (!isScheduleDateValid(scheduleDate)) {
      feedback.error('O agendamento deve ser feito com pelo menos 2 minutos de antecedência.');
      return;
    }

    setIsScheduling(true);
    const scheduledFor = new Date(scheduleDate).toISOString();
    const result = await scheduleMessages({
      recipients,
      message,
      media: selectedFile,
      scheduledFor,
      batchName,
      templateId: selectedTemplateId || null,
    });
    if (result) {
      setScheduledOverlayData({
        batchId: result.batchId,
        batchName,
        scheduledFor,
        contactCount: recipients.length,
      });
    }
  };

  const handleSendAction = async () => {
    if (!canNavigateTo(3)) {
      feedback.error('Preencha todos os campos obrigatórios.');
      return;
    }
    if (isScheduleMode) {
      await handleSchedule();
      return;
    }

    const started = await handleSend(recipients, message, selectedFile, batchName);
    if (started) setCurrentStep(3);
  };

  const handleStepperClick = (navStepId: number) => {
    if (navStepId === 2 && !isConnected) {
      setConnectionPromptOpen(true);
      return;
    }
    if (canNavigateTo(navStepId)) {
      setCurrentStep(navStepId);
      return;
    }
    if (navStepId === 1) feedback.error('Comece a campanha primeiro.');
    if (navStepId === 2) feedback.error('Selecione os destinatários primeiro.');
  };

  const handleNewTransmission = () => {
    resetForm();
    setCurrentStep(0);
    setRecipientConfigs([{ type: 'group', id: 'all', name: 'Todos os Contatos' }]);
    setScheduledOverlayData(null);
    clearLogs();
    resetSending();
  };

  return {
    activeSchedules,
    batchName,
    campaignProgress,
    canNavigateTo,
    connectionPromptOpen: connectionPromptVisible,
    contacts,
    currentStep,
    debugForceScreen,
    groups,
    handleBack,
    handleNewTransmission,
    handleNext,
    handleSendAction,
    handleStop,
    handleStepperClick,
    handleTemplateSelect,
    hydrated,
    isNextStepDisabled,
    isScheduleMode,
    isScheduling,
    isSending,
    message,
    openConnectionSettings: () => {
      setConnectionPromptOpen(false);
      openSheet('settings', { tab: 'connection' });
    },
    openMonitoring: (focusedBatchId?: string) => openSheet('monitoring', focusedBatchId ? { focusedBatchId } : undefined),
    openTemplates: () => openSheet('templates'),
    recipientBatches,
    recipientConfigs,
    recipientMode,
    recipients,
    scheduleDate,
    scheduledOverlay,
    scheduledStatusComplete,
    selectedFile,
    sendingStatus,
    setCurrentStep,
    setConnectionPromptOpen,
    setIsScheduleMode,
    setMessage,
    setRecipientConfigs,
    setScheduleDate,
    setSelectedFile,
    templates,
  };
}

export type DashboardCampaignController = ReturnType<typeof useDashboardCampaign>;

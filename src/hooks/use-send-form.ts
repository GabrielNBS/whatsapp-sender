import { useState, useMemo, useCallback, ChangeEvent, useEffect } from 'react';
import { Contact } from '@/lib/types';
import type { TemplateCatalogItem } from '@/services/templates/templatesApi';
import { estimateCampaignDurationMinutes } from '@/lib/campaign-progress';

/**
 * File data structure for media uploads
 */
export interface FileData {
  data: string;
  mimetype: string;
  filename: string;
}

/**
 * Recipient configuration
 */
export interface RecipientConfig {
  type: 'group' | 'contact';
  id: string;
  name: string;
}

export interface RecipientBatch extends RecipientConfig {
  recipients: Contact[];
  startIndex: number;
  endIndex: number;
}

/**
 * Hook parameters
 */
interface UseSendFormParams {
  contacts: Contact[];
  getContactsByGroup: (groupId: string) => Contact[];
  templates: TemplateCatalogItem[];
  loadTemplate: (templateId: string) => Promise<{
    content: string;
    media?: string | null;
  }>;
}

/**
 * Hook return type
 */
interface UseSendFormReturn {
  // State
  recipientConfigs: RecipientConfig[];
  message: string;
  selectedFile: FileData | null;
  isScheduleMode: boolean;
  scheduleDate: string;
  selectedTemplateId: string | null;
  
  // Computed
  recipients: Contact[];
  recipientBatches: RecipientBatch[];
  recipientsCount: number;
  estimatedTime: number;
  canSubmit: boolean;
  
  // Actions
  setRecipientConfigs: (configs: RecipientConfig[]) => void;
  setMessage: (message: string) => void;
  setSelectedFile: (file: FileData | null) => void;
  setIsScheduleMode: (mode: boolean) => void;
  setScheduleDate: (date: string) => void;
  handleTemplateSelect: (templateId: string) => Promise<void>;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  resetForm: () => void;
}

export function resolveRecipientBatches(
  recipientConfigs: RecipientConfig[],
  contacts: Contact[],
  getContactsByGroup: (groupId: string) => Contact[],
): RecipientBatch[] {
  const selectedContactIds = new Set<string>();
  const orderedRecipients: Contact[] = [];
  const batches: RecipientBatch[] = [];

  for (const config of recipientConfigs) {
    const batchRecipients = config.type === 'group'
      ? config.id === 'all'
        ? contacts
        : getContactsByGroup(config.id)
      : contacts.filter((contact) => contact.id === config.id);
    const startIndex = orderedRecipients.length;

    for (const contact of batchRecipients) {
      if (selectedContactIds.has(contact.id)) continue;
      selectedContactIds.add(contact.id);
      orderedRecipients.push(contact);
    }

    batches.push({
      ...config,
      recipients: orderedRecipients.slice(startIndex),
      startIndex,
      endIndex: orderedRecipients.length,
    });
  }

  return batches;
}

export function resolveRecipients(
  recipientConfigs: RecipientConfig[],
  contacts: Contact[],
  getContactsByGroup: (groupId: string) => Contact[],
): Contact[] {
  return resolveRecipientBatches(
    recipientConfigs,
    contacts,
    getContactsByGroup,
  ).flatMap((batch) => batch.recipients);
}

/**
 * useSendForm - Custom hook for send form state management
 * 
 * Encapsulates all form state and logic for the send page,
 * reducing prop drilling and component complexity.
 */
export function useSendForm({
  contacts,
  getContactsByGroup,
  templates,
  loadTemplate,
}: UseSendFormParams): UseSendFormReturn {
  // Form state
  const [recipientConfigs, setRecipientConfigs] = useState<RecipientConfig[]>([
    {
      type: 'group',
      id: 'all',
      name: 'Todos os Contatos',
    },
  ]);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  // Computed: batches and recipients preserve the exact selection order.
  const recipientBatches = useMemo(() => {
    return resolveRecipientBatches(recipientConfigs, contacts, getContactsByGroup);
  }, [recipientConfigs, contacts, getContactsByGroup]);
  const recipients = useMemo(
    () => recipientBatches.flatMap((batch) => batch.recipients),
    [recipientBatches],
  );

  const recipientsCount = recipients.length;

  const estimatedTime = useMemo(
    () => estimateCampaignDurationMinutes(recipientsCount),
    [recipientsCount],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);


  // Validation: can submit form
  const canSubmit = useMemo(() => {
    // Must have recipients
    if (recipientsCount === 0) return false;
    
    // Must have message or file
    if (!message && !selectedFile) return false;
    
    // Schedule mode validation
    if (isScheduleMode) {
      if (!scheduleDate) return false;
      const scheduledTime = new Date(scheduleDate).getTime();
      const minTime = nowTimestamp + 2 * 60 * 1000; // 2 minutes from now
      if (scheduledTime < minTime) return false;
    }
    
    return true;
  }, [recipientsCount, message, selectedFile, isScheduleMode, scheduleDate, nowTimestamp]);

  // Handlers
  const handleTemplateSelect = useCallback(async (templateId: string) => {
    if (templateId === 'none') {
      setSelectedTemplateId(null);
      setMessage('');
      setSelectedFile(null);
      return;
    }
    
    try {
      const template = await loadTemplate(templateId);
      setSelectedTemplateId(templateId);
      setMessage(template.content);
      
      if (template.media) {
        try {
          const mediaData = JSON.parse(template.media);
          setSelectedFile(mediaData);
        } catch (e) {
          console.error('Error parsing template media', e);
          setSelectedFile(null);
        }
      } else {
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error loading template', error);
      setSelectedTemplateId(null);
    }
  }, [loadTemplate]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedFile({
        data: base64,
        mimetype: file.type,
        filename: file.name,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const resetForm = useCallback(() => {
    setMessage('');
    setSelectedFile(null);
    setIsScheduleMode(false);
    setScheduleDate('');
    setSelectedTemplateId(null);
  }, []);

  const visibleSelectedTemplateId = selectedTemplateId && templates.some((template) => template.id === selectedTemplateId)
    ? selectedTemplateId
    : null;

  return {
    // State
    recipientConfigs,
    message,
    selectedFile,
    isScheduleMode,
    scheduleDate,
    selectedTemplateId: visibleSelectedTemplateId,
    
    // Computed
    recipients,
    recipientBatches,
    recipientsCount,
    estimatedTime,
    canSubmit,
    
    // Actions
    setRecipientConfigs,
    setMessage,
    setSelectedFile,
    setIsScheduleMode,
    setScheduleDate,
    handleTemplateSelect,
    handleFileChange,
    resetForm,
  };
}

export default useSendForm;

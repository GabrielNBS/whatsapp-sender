import { useState, useMemo, useCallback, ChangeEvent } from 'react';
import { Contact, Group, Template } from '@/lib/types';

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

/**
 * Hook parameters
 */
interface UseSendFormParams {
  groups: Group[];
  contacts: Contact[];
  getContactsByGroup: (groupId: string) => Contact[];
  templates: Template[];
}

/**
 * Hook return type
 */
interface UseSendFormReturn {
  // State
  recipientConfig: RecipientConfig;
  message: string;
  selectedFile: FileData | null;
  isScheduleMode: boolean;
  scheduleDate: string;
  selectedTemplateId: string | null;
  
  // Computed
  recipients: Contact[];
  recipientsCount: number;
  estimatedTime: number;
  canSubmit: boolean;
  
  // Actions
  setRecipientConfig: (config: RecipientConfig) => void;
  setMessage: (message: string) => void;
  setSelectedFile: (file: FileData | null) => void;
  setIsScheduleMode: (mode: boolean) => void;
  setScheduleDate: (date: string) => void;
  handleTemplateSelect: (templateId: string) => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  resetForm: () => void;
}

/**
 * useSendForm - Custom hook for send form state management
 * 
 * Encapsulates all form state and logic for the send page,
 * reducing prop drilling and component complexity.
 */
export function useSendForm({
  groups,
  contacts,
  getContactsByGroup,
  templates,
}: UseSendFormParams): UseSendFormReturn {
  // Form state
  const [recipientConfig, setRecipientConfig] = useState<RecipientConfig>({
    type: 'group',
    id: 'all',
    name: 'Todos os Contatos',
  });
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [isScheduleMode, setIsScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Computed: recipients based on selection
  const recipients = useMemo(() => {
    if (recipientConfig.type === 'group') {
      return recipientConfig.id === 'all'
        ? contacts
        : getContactsByGroup(recipientConfig.id);
    }
    return contacts.filter(c => c.id === recipientConfig.id);
  }, [recipientConfig, contacts, getContactsByGroup]);

  const recipientsCount = recipients.length;

  // Estimated time: ~20 seconds per contact
  const estimatedTime = useMemo(() => {
    return Math.ceil((recipientsCount * 20) / 60);
  }, [recipientsCount]);

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
      const minTime = Date.now() + 2 * 60 * 1000; // 2 minutes from now
      if (scheduledTime < minTime) return false;
    }
    
    return true;
  }, [recipientsCount, message, selectedFile, isScheduleMode, scheduleDate]);

  // Handlers
  const handleTemplateSelect = useCallback((templateId: string) => {
    if (templateId === 'none') {
      setSelectedTemplateId(null);
      return;
    }
    
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
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
    }
  }, [templates]);

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

  return {
    // State
    recipientConfig,
    message,
    selectedFile,
    isScheduleMode,
    scheduleDate,
    selectedTemplateId,
    
    // Computed
    recipients,
    recipientsCount,
    estimatedTime,
    canSubmit,
    
    // Actions
    setRecipientConfig,
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

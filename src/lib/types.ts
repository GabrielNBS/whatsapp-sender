
// Basic Types
export type LogType = 'success' | 'error' | 'info' | 'warning' | 'pending';

export interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: Date;
  expiresAt?: number; // Timestamp in ms
}

export type GroupColor =
  | 'slate'
  | 'blue'
  | 'violet'
  | 'pink'
  | 'orange'
  | 'amber'
  | 'emerald'
  | 'cyan';

export type GroupIcon =
  | 'users'
  | 'briefcase'
  | 'heart'
  | 'star'
  | 'shopping-bag'
  | 'megaphone'
  | 'graduation-cap'
  | 'house'
  | 'party-popper'
  | 'plane'
  | 'dumbbell'
  | 'tag';

export interface Group {
  id: string;
  name: string;
  description?: string;
  color: GroupColor;
  icon: GroupIcon;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  groupIds: string[];
  consentStatus?: ContactConsentStatus;
  consentAt?: string | null;
  optedOutAt?: string | null;
}

export interface SendingStatus {
  isSending: boolean;
  progress: number;
  currentContactIndex: number;
  totalContacts: number;
  statusMessage: string | null;
  failedContacts: { name: string; number: string }[];
  stoppedByUser: boolean;
  isPaused: boolean;
  sentCount: number;
  failedCount: number;
}

export interface ScheduledCampaignOverlay {
  batchId: string;
  batchName: string;
  scheduledFor: string;
  contactCount: number;
}

export type ContactConsentStatus = 'UNKNOWN' | 'OPTED_IN' | 'OPTED_OUT';

export interface Template {
  id: string;
  title: string;
  content: string;
  media?: string; // JSON string
}

export interface TemplateMediaPayload {
    data: string;
    mimetype: string;
    filename?: string;
}

export type ScheduledMessageStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'PAUSED'
    | 'CANCELED'
    | 'SENT'
    | 'FAILED';

export interface ScheduleRecipientInput {
    name: string;
    number?: string;
    phone?: string;
}

export interface ScheduleRequestBody {
    recipients: ScheduleRecipientInput[];
    message?: string;
    media?: TemplateMediaPayload | null;
    scheduledFor: string;
    batchName?: string;
    templateId?: string;
}

export interface MessageStatus {
    id: string;
    name: string;
    phone: string;
    status: ScheduledMessageStatus;
}

export interface ScheduleBatchSummary {
    id: string;
    batchId: string;
    batchName: string;
    scheduledFor: Date | string; // Often string from JSON
    count: number; // Pending count (or Total?) - We will clarify this in route.ts
    processing: number;
    paused?: number; // Paused count
    total: number; // Total messages in batch
    sent: number; // Sent messages in batch
    failed: number; // Failed messages
}

export interface ScheduledBatch extends ScheduleBatchSummary {
    contacts: MessageStatus[];
    sampleTemplate?: string; // Sample message template for display
}

export interface Campaign {
    id: string;
    name: string;
    date: Date;
    stats: {
        total: number;
        success: number;
        failed: number;
    };
    type: 'INSTANT' | 'SCHEDULED';
}

export interface IMessageSender {
    sendMessage(to: string, message: string, media?: TemplateMediaPayload): Promise<unknown>;
}

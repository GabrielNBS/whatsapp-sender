
// Basic Types
export type LogType = 'success' | 'error' | 'info' | 'warning' | 'pending';

export interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: Date;
  expiresAt?: number; // Timestamp in ms
}

export interface Group {
  id: string;
  name: string;
  description?: string;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  groupIds: string[];
}

export interface Template {
  id: string;
  title: string;
  content: string;
  media?: string; // JSON string
}

export interface MessageStatus {
    id: string;
    name: string;
    phone: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
}

export interface ScheduledBatch {
    id: string;
    batchId: string;
    batchName: string;
    scheduledFor: Date | string; // Often string from JSON
    count: number; // Pending count (or Total?) - We will clarify this in route.ts
    total: number; // Total messages in batch
    sent: number; // Sent messages in batch
    failed: number; // Failed messages
    contacts: MessageStatus[];
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

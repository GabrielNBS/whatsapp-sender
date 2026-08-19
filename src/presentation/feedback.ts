import { toast } from 'sonner';

export interface FeedbackOptions {
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface FeedbackPort {
  success(message: string, options?: FeedbackOptions): void;
  error(message: string, options?: FeedbackOptions): void;
  info(message: string, options?: FeedbackOptions): void;
  warning(message: string, options?: FeedbackOptions): void;
  notify(message: string, options?: FeedbackOptions): void;
}

export const sonnerFeedback: FeedbackPort = {
  success: (message, options) => { toast.success(message, options); },
  error: (message, options) => { toast.error(message, options); },
  info: (message, options) => { toast.info(message, options); },
  warning: (message, options) => { toast.warning(message, options); },
  notify: (message, options) => { toast(message, options); },
};

export type ConfirmationPort = (message: string) => boolean | Promise<boolean>;

export const browserConfirmation: ConfirmationPort = (message) => window.confirm(message);

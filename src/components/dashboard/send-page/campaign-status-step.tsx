'use client';

import { AnimatePresence } from 'framer-motion';
import type { DashboardCampaignController } from '@/hooks/use-dashboard-campaign';
import {
  SendingOverlay,
  ScheduledOverlay,
  PausedOverlay,
  SuccessOverlay,
  ErrorOverlay,
} from './overlays';

type CampaignStatusStepProps = Pick<
  DashboardCampaignController,
  | 'campaignProgress'
  | 'debugForceScreen'
  | 'handleNewTransmission'
  | 'handleStop'
  | 'isSending'
  | 'recipientBatches'
  | 'recipientMode'
  | 'recipients'
  | 'scheduledOverlay'
  | 'scheduledStatusComplete'
  | 'sendingStatus'
>;

export function CampaignStatusStep({
  campaignProgress,
  debugForceScreen,
  handleNewTransmission,
  handleStop,
  isSending,
  recipientBatches,
  recipientMode,
  recipients,
  scheduledOverlay,
  scheduledStatusComplete,
  sendingStatus,
}: CampaignStatusStepProps) {
  const isSendingView = debugForceScreen === 'sending' || (isSending && !debugForceScreen);
  const isScheduledView =
    debugForceScreen === 'scheduled' ||
    (scheduledOverlay && !scheduledStatusComplete && !debugForceScreen);

  return (
    <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full space-y-6 h-full relative">
      <AnimatePresence mode="wait">
        {isSendingView ? (
          <SendingOverlay
            campaignProgress={campaignProgress}
            recipientBatches={recipientBatches}
            recipientMode={recipientMode}
            recipients={recipients}
            sendingStatus={sendingStatus}
            handleStop={handleStop}
          />
        ) : isScheduledView ? (
          <ScheduledOverlay
            scheduledOverlay={scheduledOverlay}
            handleNewTransmission={handleNewTransmission}
          />
        ) : (debugForceScreen === 'paused' || sendingStatus.stoppedByUser) ? (
          <PausedOverlay
            sendingStatus={sendingStatus}
            handleNewTransmission={handleNewTransmission}
          />
        ) : sendingStatus.failedContacts.length === 0 ? (
          <SuccessOverlay
            sendingStatus={sendingStatus}
            handleNewTransmission={handleNewTransmission}
          />
        ) : (
          <ErrorOverlay
            sendingStatus={sendingStatus}
            handleNewTransmission={handleNewTransmission}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Play, Users } from 'lucide-react';
import { CampaignIntroStep } from '@/components/dashboard/send-page/campaign-intro-step';
import { CampaignMessageStep } from '@/components/dashboard/send-page/campaign-message-step';
import { CampaignRecipientsStep } from '@/components/dashboard/send-page/campaign-recipients-step';
import { CampaignStatusStep } from '@/components/dashboard/send-page/campaign-status-step';
import { ConnectionAlert } from '@/components/dashboard/send-page/connection-alert';
import { AnimatedContent } from '@/components/ui/animated-content';
import { SendPageSkeleton } from '@/components/send/send-page-skeleton';
import { WizardNavigation } from '@/components/send/wizard-navigation';
import { WizardStepper } from '@/components/send/wizard-stepper';
import { useDashboardCampaign } from '@/hooks/use-dashboard-campaign';
import { browserConfirmation, sonnerFeedback } from '@/presentation/feedback';

const STEPS = [
    { id: 1, label: "Público", icon: Users },
    { id: 2, label: "Mensagem", icon: MessageSquare },
];

const STEPS_NAV = [
    { id: 0, label: "Iniciar", icon: Play },
    { id: 1, label: "Público", icon: Users },
    { id: 2, label: "Mensagem", icon: MessageSquare },
];

export default function SendPage() {
    return (
        <Suspense fallback={<SendPageSkeleton />}>
            <SendPageInner />
        </Suspense>
    );
}

function SendPageInner() {
    const campaign = useDashboardCampaign(sonnerFeedback, browserConfirmation);
    const {
        canNavigateTo,
        currentStep,
        handleBack,
        handleNext,
        handleStepperClick,
        hydrated,
        isConnected,
        isScheduling,
        isSending,
    } = campaign;

    if (!hydrated) {
        return <SendPageSkeleton />;
    }

    return (
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            {/* Main Grid Content */}
            <div className="flex flex-1 min-h-0 min-w-0 gap-3 overflow-hidden sm:gap-4 lg:gap-6">

                <motion.div layout className="flex min-h-0 min-w-0 flex-1 flex-col" transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
                    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card pt-3 shadow-sm sm:pt-4">

                        {currentStep < 3 && (
                            <WizardStepper
                                currentStep={currentStep}
                                steps={STEPS_NAV}
                                onStepClick={handleStepperClick}
                            />
                        )}

                        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                            {currentStep > 0 && currentStep < 3 && !isConnected ? (
                                <ConnectionAlert onConnect={campaign.openConnectionSettings} />
                            ) : null}

                            <AnimatedContent activeKey={currentStep} spring="snappy" className="flex min-h-0 flex-1 flex-col">
                                {currentStep === 0 && (
                                    <CampaignIntroStep
                                        activeSchedules={campaign.activeSchedules}
                                        campaignProgress={campaign.campaignProgress}
                                        onStart={() => campaign.setCurrentStep(1)}
                                        openMonitoring={campaign.openMonitoring}
                                        sendingStatus={campaign.sendingStatus}
                                    />
                                )}

                                {currentStep === 1 && (
                                    <CampaignRecipientsStep
                                        contacts={campaign.contacts}
                                        groups={campaign.groups}
                                        isSending={campaign.isSending}
                                        recipientConfigs={campaign.recipientConfigs}
                                        recipients={campaign.recipients}
                                        setRecipientConfigs={campaign.setRecipientConfigs}
                                    />
                                )}

                                {currentStep === 2 && (
                                    <CampaignMessageStep
                                        handleSendAction={campaign.handleSendAction}
                                        handleTemplateSelect={campaign.handleTemplateSelect}
                                        isScheduleMode={campaign.isScheduleMode}
                                        isScheduling={campaign.isScheduling}
                                        isSending={campaign.isSending}
                                        message={campaign.message}
                                        openTemplates={campaign.openTemplates}
                                        recipients={campaign.recipients}
                                        scheduleDate={campaign.scheduleDate}
                                        selectedFile={campaign.selectedFile}
                                        setIsScheduleMode={campaign.setIsScheduleMode}
                                        setMessage={campaign.setMessage}
                                        setScheduleDate={campaign.setScheduleDate}
                                        setSelectedFile={campaign.setSelectedFile}
                                        templates={campaign.templates}
                                    />
                                )}

                                {currentStep === 3 && (
                                    <CampaignStatusStep
                                        campaignProgress={campaign.campaignProgress}
                                        debugForceScreen={campaign.debugForceScreen}
                                        handleNewTransmission={campaign.handleNewTransmission}
                                        handleStop={campaign.handleStop}
                                        isSending={campaign.isSending}
                                        recipientBatches={campaign.recipientBatches}
                                        recipientMode={campaign.recipientMode}
                                        recipients={campaign.recipients}
                                        scheduledOverlay={campaign.scheduledOverlay}
                                        scheduledStatusComplete={campaign.scheduledStatusComplete}
                                        sendingStatus={campaign.sendingStatus}
                                    />
                                )}
                            </AnimatedContent>
                        </div>

                        {currentStep === 1 && (
                            <div className="z-10 border-t border-border/50 bg-background/80 p-3 backdrop-blur-sm sm:p-4 sm:pt-2 lg:p-6 lg:pt-2">
                                <WizardNavigation
                                    currentStep={currentStep}
                                    totalSteps={STEPS.length}
                                    onBack={handleBack}
                                    onNext={handleNext}
                                    isNextDisabled={!canNavigateTo(currentStep + 1)}
                                    isSending={isSending || isScheduling}
                                />
                            </div>
                        )}

                    </div>
                </motion.div>
            </div>
        </div>
    );
}

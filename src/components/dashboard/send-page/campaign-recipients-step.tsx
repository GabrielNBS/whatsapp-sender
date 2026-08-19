'use client';

import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { RecipientSelector } from '@/components/send/recipient-selector';
import GradientText from '@/components/ui/gradient-text';
import type { DashboardCampaignController } from '@/hooks/use-dashboard-campaign';

type CampaignRecipientsStepProps = Pick<
  DashboardCampaignController,
  'contacts' | 'groups' | 'isSending' | 'recipientConfigs' | 'recipients' | 'setRecipientConfigs'
>;

export function CampaignRecipientsStep({
  contacts,
  groups,
  isSending,
  recipientConfigs,
  recipients,
  setRecipientConfigs,
}: CampaignRecipientsStepProps) {
  return (
    <div className="premium-scrollbar mx-auto h-full w-full max-w-xl space-y-4 overflow-y-auto px-2 pb-6 pt-2 sm:space-y-6 sm:pb-8 sm:pt-4 lg:px-0">
      <div className="mb-5 space-y-2 sm:mb-8 [@media(max-height:700px)]:mb-4">
        <GradientText
          animationSpeed={6}
          className="text-xs font-semibold"
        >
          Passo 1 de 2
        </GradientText>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Para quem vamos{' '}
          <GradientText className="inline font-bold text-foreground" showBorder={false}>
            enviar?
          </GradientText>
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">Escolha os contatos ou grupos que receberão a mensagem.</p>
      </div>

      <RecipientSelector
        groups={groups}
        contacts={contacts}
        value={recipientConfigs}
        onChange={setRecipientConfigs}
        disabled={isSending}
      />

      {recipients.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-primary">Público ativo</p>
            <p className="text-base font-bold leading-none text-foreground">
              {recipients.length} {recipients.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
            </p>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

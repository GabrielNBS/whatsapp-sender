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
      <div className="mb-5 space-y-1 sm:mb-8 lg:mb-10 [@media(max-height:700px)]:mb-4">
        <GradientText
          colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]}
          animationSpeed={6}
          className="mb-4 text-[10px] font-black uppercase tracking-[0.2rem] opacity-60"
        >
          Passo 01
        </GradientText>
        <h2 className="mb-2 text-3xl font-light leading-[1.05] tracking-tighter sm:text-4xl lg:text-[3.25rem] [@media(max-height:700px)]:lg:text-4xl">
          Para quem vamos{' '}
          <GradientText colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]} className="inline font-black text-foreground" showBorder={false}>
            enviar?
          </GradientText>
        </h2>
        <p className="text-base font-medium leading-relaxed text-muted-foreground/80">Escolha os contatos ou grupos que receberão a mensagem.</p>
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
          className="group flex items-center gap-4 rounded-2xl border border-primary/10 bg-primary/3 p-4"
        >
          <div className="rounded-xl bg-primary/10 p-2.5 transition-transform duration-500 group-hover:scale-110">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="mb-1 text-xs font-black uppercase leading-none tracking-widest text-primary/50">Público Ativo</p>
            <p className="text-base font-bold leading-none text-foreground">
              {recipients.length} {recipients.length === 1 ? 'contato selecionado' : 'contatos selecionados'}
            </p>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}

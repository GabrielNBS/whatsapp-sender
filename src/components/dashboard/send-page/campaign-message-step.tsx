'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Eye, MessageSquareText, Plus, RefreshCw, Users } from 'lucide-react';

import { CampaignSchedulePicker } from '@/components/dashboard/send-page/campaign-schedule-picker';
import { WhatsAppMockup } from '@/components/dashboard/templates/whatsapp-mockup';
import { MessageEditor } from '@/components/send/message-editor';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { DashboardCampaignController } from '@/hooks/use-dashboard-campaign';
import { cn } from '@/lib/utils';

type CampaignMessageStepProps = Pick<
  DashboardCampaignController,
  | 'canSubmit'
  | 'handleSendAction'
  | 'handleTemplateSelect'
  | 'isScheduleMode'
  | 'isScheduling'
  | 'isSending'
  | 'message'
  | 'openTemplates'
  | 'recipients'
  | 'scheduleDate'
  | 'selectedFile'
  | 'setIsScheduleMode'
  | 'setMessage'
  | 'setScheduleDate'
  | 'setSelectedFile'
  | 'templates'
>;

export function CampaignMessageStep({
  canSubmit,
  handleSendAction,
  handleTemplateSelect,
  isScheduleMode,
  isScheduling,
  isSending,
  message,
  openTemplates,
  recipients,
  scheduleDate,
  selectedFile,
  setIsScheduleMode,
  setMessage,
  setScheduleDate,
  setSelectedFile,
  templates,
}: CampaignMessageStepProps) {
  const submitDisabled = isSending || isScheduling || !canSubmit;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-2 sm:px-5 lg:px-6">
        <div className="flex min-h-full gap-4 pt-2 lg:gap-5 xl:gap-6">
          <section className="flex min-h-120 min-w-0 flex-1 flex-col gap-3">
            <header className="flex shrink-0 items-center gap-3 px-1">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
              >
                <MessageSquareText className="size-4" />
              </motion.div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">Mensagem</h2>
                <p className="truncate text-xs text-muted-foreground">Escreva, personalize e revise antes do envio.</p>
              </div>
            </header>

            <div className="min-h-80 flex-1">
              <MessageEditor
                message={message}
                onMessageChange={setMessage}
                selectedFile={selectedFile}
                onFileChange={setSelectedFile}
                disabled={isSending}
                templateSlot={
                  <div className="flex items-center gap-1">
                    <Select onValueChange={handleTemplateSelect} disabled={isSending}>
                      <SelectTrigger className="h-9 w-38 gap-2 rounded-lg bg-accent-foreground text-sm font-semibold text-secondary sm:w-40">
                        <span className="pointer-events-none text-sm">🪄</span>
                        <SelectValue placeholder="Usar modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum modelo</SelectItem>
                        {templates.length === 0 ? (
                          <SelectItem value="__empty__" disabled>Nenhum modelo</SelectItem>
                        ) : (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>{template.title}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openTemplates}
                      className="h-9 rounded-lg px-2.5 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Plus className="size-3.5" />
                      <span className="hidden sm:inline">Criar</span>
                    </Button>
                  </div>
                }
              />
            </div>

            <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-border/60 bg-muted/15 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-3">
              <div className="flex min-w-0 items-center gap-2.5 px-1">
                <motion.div whileHover={{ scale: 1.06 }} className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Users className="size-4" />
                </motion.div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{recipients.length} {recipients.length === 1 ? 'contato' : 'contatos'}</p>
                  <p className="text-[11px] text-muted-foreground">Público selecionado</p>
                </div>
              </div>

              <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-10 rounded-xl px-3 text-muted-foreground lg:hidden [@media(max-height:1079px)]:inline-flex">
                      <Eye className="size-4" /> Prévia
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="flex h-[90vh] flex-col items-center overflow-hidden rounded-t-3xl border-t border-border bg-[#ece5dd] p-0 dark:bg-[#0b141a]">
                    <div className="sr-only">
                      <SheetTitle>Prévia do WhatsApp</SheetTitle>
                      <SheetDescription>Visualize como sua mensagem aparecerá na tela do celular</SheetDescription>
                    </div>
                    <div className="flex h-full w-full flex-col items-center overflow-y-auto p-6">
                      <div className="mb-6 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20" />
                      <WhatsAppMockup content={message} media={selectedFile} />
                    </div>
                  </SheetContent>
                </Sheet>

                <CampaignSchedulePicker
                  enabled={isScheduleMode}
                  value={scheduleDate}
                  disabled={isSending || isScheduling}
                  onEnabledChange={setIsScheduleMode}
                  onValueChange={setScheduleDate}
                />
              </div>
            </div>
          </section>

          <aside className="hidden w-[min(24vw,18rem)] shrink-0 flex-col lg:flex [@media(max-height:1079px)]:hidden!">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="size-2 rounded-full bg-success shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_12%,transparent)]" />
              <span className="text-xs font-medium text-muted-foreground">Prévia em tempo real</span>
            </div>
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-hidden rounded-2xl border border-border/50 bg-muted/15 p-3">
              <WhatsAppMockup content={message} media={selectedFile} />
            </div>
          </aside>
        </div>
      </div>

      <div className="z-20 mt-2 flex shrink-0 justify-end border-t border-border/50 bg-card/95 px-3 py-3 backdrop-blur-sm sm:px-5 lg:px-6">
        <Button
          onClick={handleSendAction}
          disabled={submitDisabled}
          asChild
          className={cn(
            'h-11 gap-3 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm sm:px-7',
            submitDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          )}
        >
          <motion.button
            whileHover={submitDisabled ? undefined : 'hover'}
            whileTap={submitDisabled ? undefined : 'tap'}
          >
            <span className="flex items-center gap-3">
              {isSending || isScheduling ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  <span>{isScheduling ? 'Agendando…' : 'Enviando…'}</span>
                </>
              ) : (
                <span>{isScheduleMode ? 'Revisar agendamento' : 'Revisar e enviar'}</span>
              )}
              <motion.span variants={{ hover: { x: 4 } }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                <ChevronRight className="size-4" />
              </motion.span>
            </span>
          </motion.button>
        </Button>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Eye, Plus, RefreshCw, Users } from 'lucide-react';
import { WhatsAppMockup } from '@/components/dashboard/templates/whatsapp-mockup';
import { MessageEditor } from '@/components/send/message-editor';
import { Button } from '@/components/ui/button';
import GradientText from '@/components/ui/gradient-text';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import type { DashboardCampaignController } from '@/hooks/use-dashboard-campaign';
import { cn } from '@/lib/utils';

type CampaignMessageStepProps = Pick<
  DashboardCampaignController,
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
  const submitDisabled = isSending || isScheduling || (!message && !selectedFile);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pb-2">
      <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto px-1">
        <div className="flex min-h-120 flex-col gap-4 pt-2 sm:gap-6 lg:flex-row lg:gap-8 xl:gap-10">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="mb-6 space-y-2 lg:mb-8 [@media(max-height:1079px)]:hidden">
              <GradientText
                colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]}
                animationSpeed={6}
                className="text-xs font-semibold"
              >
                Passo 2 de 2
              </GradientText>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                Crie sua{' '}
                <GradientText colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]} className="inline font-bold text-foreground">
                  mensagem
                </GradientText>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">Selecione um modelo ou escreva manualmente.</p>
            </div>

            <div className="min-h-64 flex-1 sm:min-h-72">
              <MessageEditor
                message={message}
                onMessageChange={setMessage}
                selectedFile={selectedFile}
                onFileChange={setSelectedFile}
                disabled={isSending}
                templateSlot={
                  <div className="flex items-center gap-1">
                    <Select onValueChange={handleTemplateSelect} disabled={isSending}>
                      <SelectTrigger className="h-9 w-40 gap-2 rounded-lg bg-accent-foreground text-secondary text-sm font-semibold">
                        <span className="pointer-events-none text-sm">🪄</span>
                        <SelectValue placeholder="Usar Modelo" />
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
                      className="h-9 rounded-lg px-3 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Plus className="mr-1 h-3 w-3" /> Criar
                    </Button>
                  </div>
                }
              />
            </div>

            <div className="mt-4 space-y-3 rounded-xl border border-border/50 bg-muted/20 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{recipients.length} {recipients.length === 1 ? 'contato' : 'contatos'} alvo</p>
                    <p className="text-xs text-muted-foreground">Público selecionado</p>
                  </div>
                </div>
                <div className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-background px-3">
                  <Label htmlFor="schedule-campaign" className="cursor-pointer text-sm text-muted-foreground">Agendar envio</Label>
                  <Switch id="schedule-campaign" checked={isScheduleMode} onCheckedChange={setIsScheduleMode} disabled={isSending} />
                </div>
              </div>

              {isScheduleMode ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-border/50 pt-4">
                  <Label htmlFor="schedule-date" className="mb-2">Data e horário</Label>
                  <Input id="schedule-date" type="datetime-local" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} disabled={isSending} />
                </motion.div>
              ) : null}
            </div>

            <div className="mt-4 lg:hidden [@media(max-height:1079px)]:block">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-background font-bold text-muted-foreground hover:text-foreground">
                    <Eye className="h-5 w-5" />
                    Ver Preview da Mensagem
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="flex h-[90vh] flex-col items-center overflow-hidden rounded-t-3xl border-t border-border bg-[#ece5dd] p-0 dark:bg-[#0b141a]">
                  <div className="sr-only">
                    <SheetTitle>Preview do WhatsApp</SheetTitle>
                    <SheetDescription>Visualize como sua mensagem aparecerá na tela do celular</SheetDescription>
                  </div>
                  <div className="flex h-full w-full flex-col items-center overflow-y-auto p-6">
                    <div className="mb-6 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/20" />
                    <WhatsAppMockup content={message} media={selectedFile} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="hidden w-[min(30vw,340px)] shrink-0 flex-col lg:flex [@media(max-height:1079px)]:!hidden">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs font-medium text-muted-foreground">Prévia em tempo real</span>
            </div>
            <div className="flex min-h-0 flex-1 items-start justify-center">
              <WhatsAppMockup content={message} media={selectedFile} />
            </div>
          </div>
        </div>
      </div>

      <div className="z-20 mt-2 flex shrink-0 justify-center border-t border-border/50 bg-card/95 py-3 backdrop-blur-sm sm:mt-4">
        <Button
          onClick={handleSendAction}
          disabled={submitDisabled}
          asChild
          className={cn(
            'h-12 gap-3 rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm',
            submitDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          )}
        >
          <motion.button
            whileHover={submitDisabled ? '' : 'hover'}
            whileTap={submitDisabled ? '' : 'tap'}
          >
            <span className="flex items-center gap-3 transition-all">
              {isSending || isScheduling ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>{isScheduling ? 'Agendando...' : 'Enviando...'}</span>
                </>
              ) : 'Revisar e Enviar'}
              <motion.div variants={{ hover: { x: 5 } }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
                <ChevronRight className="h-5 w-5" />
              </motion.div>
            </span>
          </motion.button>
        </Button>
      </div>
    </div>
  );
}

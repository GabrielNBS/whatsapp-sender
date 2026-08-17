'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Eye, Plus, RefreshCw, Users } from 'lucide-react';
import { WhatsAppMockup } from '@/components/dashboard/templates/whatsapp-mockup';
import { MessageEditor } from '@/components/send/message-editor';
import { Button } from '@/components/ui/button';
import GradientText from '@/components/ui/gradient-text';
import { Input } from '@/components/ui/input';
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
            <div className="mb-6 space-y-1 lg:mb-10 [@media(max-height:1079px)]:hidden">
              <GradientText
                colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]}
                animationSpeed={6}
                className="mb-4 text-[10px] font-black uppercase tracking-[0.2rem] opacity-60"
              >
                Passo 02
              </GradientText>
              <h2 className="mb-2 text-3xl font-light leading-[1.05] tracking-tighter sm:text-4xl lg:text-[3.25rem]">
                Crie sua{' '}
                <GradientText colors={["#25D366", "#128C7E", "#25D366", "#34B7F1", "#25D366"]} className="inline font-black text-foreground">
                  mensagem
                </GradientText>
              </h2>
              <p className="text-base font-medium leading-relaxed text-muted-foreground/80">Selecione um modelo ou escreva manualmente.</p>
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
                      <SelectTrigger
                        animatedBorder
                        className="h-8 w-40 gap-2 rounded-full border-transparent bg-neutral-950 px-3 text-[11px] font-bold text-white shadow-sm transition-all hover:bg-neutral-900"
                      >
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
                      className="h-8 rounded-full px-2 text-[11px] font-bold text-muted-foreground transition-all hover:bg-muted hover:text-primary"
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
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Público Selecionado</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-full border border-border/50 bg-background px-4 py-2">
                  <span className="text-xs font-bold text-muted-foreground">Agendar?</span>
                  <Switch checked={isScheduleMode} onCheckedChange={setIsScheduleMode} disabled={isSending} />
                </div>
              </div>

              {isScheduleMode ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t border-border/50 pt-4">
                  <p className="mb-1.5 ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data e Horário</p>
                  <Input type="datetime-local" className="rounded-xl" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} disabled={isSending} />
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
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Preview em Tempo Real</span>
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
            'h-14 gap-3 rounded-2xl bg-primary px-12 text-xs font-black uppercase tracking-[0.2rem] text-primary-foreground shadow-xl shadow-primary/20 transition-all',
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

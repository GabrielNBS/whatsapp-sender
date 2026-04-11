
import { ChangeEvent } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Info, CalendarClock, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Group, Contact, Template } from '@/lib/types';
import { isScheduleDateValid } from '@/lib/utils';

// ─── Public interface (unchanged) ────────────────────────────────────────────

interface SendFormProps {
  groups: Group[];
  contacts: Contact[];
  templates: Template[];
  selectedGroupId: string;
  setSelectedGroupId: (id: string) => void;
  isSending: boolean;
  handleTemplateSelect: (id: string) => void;
  message: string;
  setMessage: (msg: string) => void;
  selectedFile: { data?: string; mimetype?: string; filename: string } | null;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isScheduleMode: boolean;
  setIsScheduleMode: (mode: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (date: string) => void;
  handleAction: () => void;
  recipientsCount: number;
  estimatedTime: number;
  selectedTemplateId: string | null;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

interface MessageSectionProps {
  message: string;
  setMessage: (msg: string) => void;
  isSending: boolean;
}

function MessageSection({ message, setMessage, isSending }: MessageSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="message-input" className="text-sm font-medium">
        Mensagem
      </Label>
      <Textarea
        id="message-input"
        placeholder="Digite sua mensagem aqui..."
        className="min-h-[150px]"
        value={message}
        onChange={e => setMessage(e.target.value)}
        disabled={isSending}
      />
      <p className="text-xs text-muted-foreground">
        Formatação: *negrito*, _itálico_, ~tachado~
      </p>
    </div>
  );
}

interface ImageSectionProps {
  selectedTemplateId: string | null;
  selectedFile: { data?: string; mimetype?: string; filename: string } | null;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isSending: boolean;
}

function ImageSection({ selectedTemplateId, selectedFile, handleFileChange, isSending }: ImageSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="image-input" className="text-sm font-medium">
        Imagem (Opcional)
      </Label>

      {!selectedTemplateId && (
        <Input
          id="image-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isSending}
        />
      )}

      {selectedTemplateId && (
        <p className="text-[10px] text-muted-foreground italic">
          {selectedFile ? '* Imagem definida pelo modelo.' : '* Este modelo não possui imagem.'}
        </p>
      )}

      {selectedFile && (
        <div className="mt-2 space-y-2">
          <div className="relative w-full h-48 bg-muted/20 rounded-lg overflow-hidden border border-border flex items-center justify-center">
            {selectedFile.data ? (
              <Image
                src={`data:${selectedFile.mimetype || 'image/png'};base64,${selectedFile.data}`}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Preview indisponível</p>
              </div>
            )}
          </div>
          <p className="text-xs text-success flex items-center gap-1">
            <Info className="w-3 h-3" />
            Selecionado: {selectedFile.filename}
          </p>
        </div>
      )}
    </div>
  );
}

interface ScheduleSectionProps {
  scheduleDate: string;
  setScheduleDate: (date: string) => void;
  isSending: boolean;
}

function ScheduleSection({ scheduleDate, setScheduleDate, isSending }: ScheduleSectionProps) {
  return (
    <div className="space-y-2 overflow-hidden">
      <Label htmlFor="schedule-date" className="text-sm font-medium">
        Data e Hora do Envio
      </Label>
      <Input
        id="schedule-date"
        type="datetime-local"
        value={scheduleDate}
        onChange={e => setScheduleDate(e.target.value)}
        min={new Date().toISOString().slice(0, 16)}
        disabled={isSending}
      />
      {scheduleDate && !isScheduleDateValid(scheduleDate) && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <Info className="w-3 h-3" />
          O agendamento deve ser feito com pelo menos 2 minutos de antecedência.
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SendForm({
  groups,
  contacts,
  templates,
  selectedGroupId,
  setSelectedGroupId,
  isSending,
  handleTemplateSelect,
  message,
  setMessage,
  selectedFile,
  handleFileChange,
  isScheduleMode,
  setIsScheduleMode,
  scheduleDate,
  setScheduleDate,
  handleAction,
  recipientsCount,
  estimatedTime,
  selectedTemplateId,
}: SendFormProps) {
  const isScheduleInvalid =
    isScheduleMode && (!scheduleDate || !isScheduleDateValid(scheduleDate));

  const isActionDisabled =
    recipientsCount === 0 ||
    (!message && !selectedFile) ||
    isScheduleInvalid;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Configurações da Campanha</CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor="schedule-mode" className="text-sm text-muted-foreground">
            Agendar Envio
          </Label>
          <Switch
            id="schedule-mode"
            checked={isScheduleMode}
            onCheckedChange={setIsScheduleMode}
            disabled={isSending}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Destinatários */}
        <div className="space-y-2">
          <Label htmlFor="recipients-select" className="text-sm font-medium">
            Destinatários
          </Label>
          <Select
            value={selectedGroupId}
            onValueChange={setSelectedGroupId}
            disabled={isSending}
          >
            <SelectTrigger id="recipients-select">
              <SelectValue placeholder="Selecione os destinatários" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Contatos ({contacts.length})</SelectItem>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modelos */}
        <div className="space-y-2">
          <Label htmlFor="template-select" className="text-sm font-medium">
            Modelos de Mensagem (Opcional)
          </Label>
          <Select onValueChange={handleTemplateSelect} disabled={isSending}>
            <SelectTrigger id="template-select" animatedBorder>
              <SelectValue placeholder="Selecione um modelo..." />
            </SelectTrigger>
            <SelectContent>
              {templates.length === 0 ? (
                <SelectItem value="__empty__" disabled>
                  Nenhum modelo disponível
                </SelectItem>
              ) : (
                templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <MessageSection
          message={message}
          setMessage={setMessage}
          isSending={isSending}
        />

        <ImageSection
          selectedTemplateId={selectedTemplateId}
          selectedFile={selectedFile}
          handleFileChange={handleFileChange}
          isSending={isSending}
        />

        <AnimatePresence>
          {isScheduleMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <ScheduleSection
                scheduleDate={scheduleDate}
                setScheduleDate={setScheduleDate}
                isSending={isSending}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ação */}
        <div className="pt-4">
          {!isSending ? (
            <Button
              className="w-full"
              onClick={handleAction}
              disabled={isActionDisabled}
            >
              {isScheduleMode ? (
                <>
                  <CalendarClock className="w-4 h-4 mr-2" />
                  Agendar Envio
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Iniciar Envio Agora
                </>
              )}
            </Button>
          ) : (
            <Button className="w-full" variant="secondary" disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </Button>
          )}

          {!isScheduleMode && recipientsCount > 0 && (
            <p className="text-xs text-center mt-3 text-muted-foreground">
              Tempo estimado: ~{estimatedTime} mins (Atrasos de segurança ativos)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


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
  selectedFile: { data?: string, mimetype?: string, filename: string } | null;
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
  selectedTemplateId
}: SendFormProps) {
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Configurações da Campanha</CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor="schedule-mode" className="text-sm text-muted-foreground">Agendar Envio</Label>
          <Switch
            id="schedule-mode"
            checked={isScheduleMode}
            onCheckedChange={setIsScheduleMode}
            disabled={isSending}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Destinatários</label>
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isSending}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione os destinatários" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Contatos ({contacts.length})</SelectItem>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Modelos de Mensagem (Opcional)</label>
          <Select onValueChange={handleTemplateSelect} disabled={isSending}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um modelo..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Mensagem</label>
          <Textarea
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Imagem (Opcional)</label>
          
          {!selectedTemplateId && (
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              disabled={isSending} 
            />
          )}

          {selectedTemplateId && (
             <p className="text-[10px] text-muted-foreground italic">
                {selectedFile ? "* Imagem definida pelo modelo." : "* Este modelo não possui imagem."}
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

        <AnimatePresence>
          {isScheduleMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <label className="text-sm font-medium">Data e Hora do Envio</label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              {scheduleDate && new Date(scheduleDate).getTime() < Date.now() + 2 * 60 * 1000 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  O agendamento deve ser feito com pelo menos 2 minutos de antecedência.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4">
          {!isSending ? (
            <Button
              className="w-full"
              onClick={handleAction}
              disabled={
                recipientsCount === 0 ||
                (!message && !selectedFile) ||
                (isScheduleMode && (!scheduleDate || new Date(scheduleDate).getTime() < Date.now() + 2 * 60 * 1000))
              }
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

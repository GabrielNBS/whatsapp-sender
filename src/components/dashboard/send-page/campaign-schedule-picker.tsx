'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Check, ChevronDown, Clock3, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CampaignSchedulePickerProps {
  enabled: boolean;
  value: string;
  disabled?: boolean;
  onEnabledChange: (enabled: boolean) => void;
  onValueChange: (value: string) => void;
}

const scheduleFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function toLocalDateTimeValue(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function getScheduleSummary(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : scheduleFormatter.format(parsed);
}

export function CampaignSchedulePicker({
  enabled,
  value,
  disabled = false,
  onEnabledChange,
  onValueChange,
}: CampaignSchedulePickerProps) {
  const [open, setOpen] = useState(false);
  const [referenceTime, setReferenceTime] = useState(() => Date.now());
  const [draftValue, setDraftValue] = useState(value);
  const [datePart = '', timePart = ''] = draftValue.split('T');
  const summary = useMemo(() => getScheduleSummary(value), [value]);
  const draftSummary = useMemo(() => getScheduleSummary(draftValue), [draftValue]);
  const scheduledTimestamp = draftSummary ? new Date(draftValue).getTime() : Number.NaN;
  const isValid = Number.isFinite(scheduledTimestamp) && scheduledTimestamp >= referenceTime + 2 * 60_000;
  const isComplete = Boolean(datePart && timePart);
  const minimumValue = toLocalDateTimeValue(new Date(referenceTime + 2 * 60_000));
  const [minimumDate, minimumTime] = minimumValue.split('T');

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setReferenceTime(Date.now());
      setDraftValue(value);
    }
    setOpen(nextOpen);
  };

  const selectRelativePreset = (minutes: number) => {
    const nextDate = new Date(Date.now() + minutes * 60_000);
    setDraftValue(toLocalDateTimeValue(nextDate));
  };

  const selectTomorrowMorning = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(9, 0, 0, 0);
    setDraftValue(toLocalDateTimeValue(nextDate));
  };

  const confirmSchedule = () => {
    if (!isValid) return;
    onValueChange(draftValue);
    onEnabledChange(true);
    setOpen(false);
  };

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'group/schedule h-10 min-w-0 max-w-full gap-2 rounded-xl bg-background px-3 text-sm font-semibold transition-[border-color,background-color,color,box-shadow] hover:border-primary/35 hover:bg-primary/5',
              enabled && 'border-primary/30 bg-primary/5 text-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_8%,transparent)]',
            )}
            aria-label={enabled && summary ? `Agendamento: ${summary}` : 'Agendar envio'}
          >
            <motion.span
              animate={enabled ? { scale: 1.08, rotate: -4 } : { scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 26 }}
              className="shrink-0"
            >
              <CalendarClock className="size-4" />
            </motion.span>
            <span className="truncate">{enabled ? summary || 'Definir data e hora' : 'Agendar envio'}</span>
            <ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" sideOffset={8} className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border-border p-0 shadow-xl">
          <div className="flex items-start gap-3 border-b border-border/60 bg-muted/25 p-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
            >
              <CalendarClock className="size-4" />
            </motion.div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Programar envio</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">Escolha quando a campanha deve começar.</p>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(7rem,.65fr)] gap-2">
              <div className="group/date flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ring)_12%,transparent)]">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within/date:text-primary" />
                <Input
                  type="date"
                  aria-label="Data do agendamento"
                  value={datePart}
                  min={minimumDate}
                  onChange={(event) => setDraftValue(`${event.target.value}T${timePart}`)}
                  disabled={disabled}
                  className="h-auto min-w-0 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="group/time flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ring)_12%,transparent)]">
                <Clock3 className="size-4 shrink-0 text-muted-foreground transition-colors group-focus-within/time:text-primary" />
                <Input
                  type="time"
                  aria-label="Horário do agendamento"
                  value={timePart}
                  min={datePart === minimumDate ? minimumTime : undefined}
                  onChange={(event) => setDraftValue(`${datePart}T${event.target.value}`)}
                  disabled={disabled}
                  className="h-auto min-w-0 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button type="button" variant="secondary" size="sm" onClick={() => selectRelativePreset(10)} className="h-8 rounded-lg px-2.5 text-xs">Em 10 min</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => selectRelativePreset(60)} className="h-8 rounded-lg px-2.5 text-xs">Em 1 hora</Button>
              <Button type="button" variant="secondary" size="sm" onClick={selectTomorrowMorning} className="h-8 rounded-lg px-2.5 text-xs">Amanhã, 09:00</Button>
            </div>

            <motion.div
              layout
              role="status"
              aria-live="polite"
              className={cn(
                'flex min-h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium',
                isValid ? 'bg-success/10 text-success' : isComplete ? 'bg-destructive/8 text-destructive' : 'bg-muted text-muted-foreground',
              )}
            >
              {isValid ? <Check className="size-3.5" /> : <Sparkles className="size-3.5" />}
              <span>{isValid ? `Pronto para ${draftSummary}` : isComplete ? 'Escolha um horário com pelo menos 2 minutos de antecedência.' : 'Defina a data e o horário do envio.'}</span>
            </motion.div>

            <Button type="button" onClick={confirmSchedule} disabled={!isValid} className="h-10 w-full rounded-xl">
              <Check className="size-4" /> Confirmar horário
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <AnimatePresence initial={false}>
        {enabled ? (
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.14 }}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled}
              onClick={() => {
                setOpen(false);
                setDraftValue('');
                onValueChange('');
                onEnabledChange(false);
              }}
              className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remover agendamento"
            >
              <X className="size-4" />
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

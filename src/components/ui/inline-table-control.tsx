'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Check, CheckCircle2, CircleX, LoaderCircle, Pencil, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type InlineTableMode = 'create' | 'edit';

export interface InlineTableValidation {
  isValid: boolean;
  fieldErrors?: Record<string, string | undefined>;
}

export interface InlineTableEditorContext<T> {
  item: T;
  mode: InlineTableMode;
  value: unknown;
  error?: string;
  microcopy?: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

export interface InlineTableColumn<T> {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  editorClassName?: string;
  validates?: boolean;
  microcopyInPlaceholder?: boolean;
  render: (item: T) => React.ReactNode;
  renderEditor?: (context: InlineTableEditorContext<T>) => React.ReactNode;
}

interface InlineTableControlProps<T extends { id: string }> {
  data: T[];
  columns: InlineTableColumn<T>[];
  validate?: (item: T, mode: InlineTableMode) => InlineTableValidation;
  onUpdate?: (item: T) => void | boolean | Promise<void | boolean>;
  onCreate?: (item: T) => void | boolean | Promise<void | boolean>;
  onDelete?: (item: T) => void;
  createItem?: T | null;
  onCancelCreate?: () => void;
  renderMobile?: (item: T) => React.ReactNode;
  emptyMessage?: React.ReactNode;
  gridTemplateColumns?: string;
  className?: string;
}

const layoutTransition = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 42,
  mass: 0.55,
};

const sharedElementTransition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as const,
};

const CONFETTI = [
  { x: -76, y: -40, rotate: -35, className: 'bg-primary' },
  { x: -52, y: -62, rotate: 28, className: 'bg-success' },
  { x: -28, y: -48, rotate: 70, className: 'bg-accent-foreground' },
  { x: 0, y: -68, rotate: 110, className: 'bg-primary' },
  { x: 30, y: -52, rotate: 145, className: 'bg-success' },
  { x: 56, y: -66, rotate: 190, className: 'bg-destructive' },
  { x: 78, y: -38, rotate: 225, className: 'bg-primary' },
  { x: -64, y: 4, rotate: 255, className: 'bg-destructive' },
  { x: 62, y: 8, rotate: 310, className: 'bg-accent-foreground' },
] as const;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getValue<T>(item: T, key: string): unknown {
  return (item as Record<string, unknown>)[key];
}

export function InlineTableControl<T extends { id: string }>({
  data,
  columns,
  validate,
  onUpdate,
  onCreate,
  onDelete,
  createItem = null,
  onCancelCreate,
  renderMobile,
  emptyMessage = 'Nenhum registro encontrado.',
  gridTemplateColumns,
  className,
}: InlineTableControlProps<T>) {
  const [items, setItems] = useState<T[]>(data);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<T | null>(null);
  const [createValues, setCreateValues] = useState<T | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(() => new Set());
  const [microcopyByField, setMicrocopyByField] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  useEffect(() => setItems(data), [data]);

  useEffect(() => {
    setCreateValues(createItem ? { ...createItem } : null);
    setValidationAttempted(false);
    setTouchedFields(new Set());
    setMicrocopyByField({});
    setSaveSucceeded(false);
    if (createItem) {
      setEditingId(null);
      setEditValues(null);
    }
  }, [createItem]);

  useEffect(() => {
    if (Object.keys(microcopyByField).length === 0) return;

    const timeout = window.setTimeout(() => setMicrocopyByField({}), 1800);
    return () => window.clearTimeout(timeout);
  }, [microcopyByField]);

  const revealMicrocopy = (key: string, error?: string) => {
    setMicrocopyByField((previous) => {
      if (!error) {
        if (!previous[key]) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      }
      return { ...previous, [key]: error };
    });
  };

  const syncFieldFeedback = (item: T, mode: InlineTableMode, key: string) => {
    const error = validate?.(item, mode).fieldErrors?.[key];
    if (!error) {
      revealMicrocopy(key);
    } else if (validationAttempted || touchedFields.has(key)) {
      revealMicrocopy(key, error);
    }
  };

  const updateEditValue = (key: string, value: unknown) => {
    if (!editValues) return;
    const next = { ...editValues, [key]: value } as T;
    setEditValues(next);
    syncFieldFeedback(next, 'edit', key);
  };

  const updateCreateValue = (key: string, value: unknown) => {
    if (!createValues) return;
    const next = { ...createValues, [key]: value } as T;
    setCreateValues(next);
    syncFieldFeedback(next, 'create', key);
  };

  const handleDone = async () => {
    if (!editValues || !onUpdate) return;

    setValidationAttempted(true);
    if (validate && !validate(editValues, 'edit').isValid) return;

    setIsSaving(true);
    try {
      const result = await onUpdate(editValues);
      if (result !== false) {
        setItems((previous) => previous.map((item) => (item.id === editValues.id ? editValues : item)));
        setSaveSucceeded(true);
        await wait(900);
        setEditingId(null);
        setEditValues(null);
        setValidationAttempted(false);
        setTouchedFields(new Set());
        setMicrocopyByField({});
        setSaveSucceeded(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!createValues || !onCreate) return;

    setValidationAttempted(true);
    if (validate && !validate(createValues, 'create').isValid) return;

    setIsSaving(true);
    try {
      const result = await onCreate(createValues);
      if (result !== false) {
        setSaveSucceeded(true);
        await wait(900);
        setCreateValues(null);
        setValidationAttempted(false);
        setTouchedFields(new Set());
        setMicrocopyByField({});
        setSaveSucceeded(false);
        onCancelCreate?.();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderEditor = (item: T, mode: InlineTableMode, update: (key: string, value: unknown) => void, validation?: InlineTableValidation) => {
    return (
      <motion.div layout className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
        {columns.map((column) => {
          const value = getValue(item, column.key);
          const rawError = validation?.fieldErrors?.[column.key];
          const error = rawError && (validationAttempted || touchedFields.has(column.key)) ? rawError : undefined;
          const isValid = Boolean(column.validates && validation && !rawError);
          const fieldStatus = error ? 'invalid' : isValid ? 'valid' : 'idle';
          const content = column.renderEditor
            ? column.renderEditor({
                item,
                mode,
                value,
                error,
                microcopy: microcopyByField[column.key],
                onChange: (nextValue) => update(column.key, nextValue),
                onBlur: () => {
                  setTouchedFields((previous) => new Set(previous).add(column.key));
                  revealMicrocopy(column.key, rawError);
                },
              })
            : column.render(item);

          return (
            <motion.div key={column.key} layout className={cn('min-w-0', column.editorClassName)}>
              <motion.div
                layout
                transition={{ layout: layoutTransition, x: { duration: 0.22, ease: 'easeOut' } }}
                animate={error ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
                className={cn(
                  'group/field flex min-h-11 w-full items-start gap-2.5 rounded-xl border-[1.6px] border-border bg-muted/30 px-3 py-2.5 transition-[border-color,box-shadow,background-color] focus-within:border-primary focus-within:bg-background focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ring)_15%,transparent)]',
                  error && 'border-destructive bg-destructive/5 focus-within:border-destructive',
                  isValid && 'border-success/45 bg-success/5 focus-within:border-success focus-within:shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_14%,transparent)]',
                )}
              >
                {column.icon && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-0.5 inline-flex shrink-0 text-muted-foreground transition-[color,transform] group-focus-within/field:scale-110 group-focus-within/field:text-primary',
                      error && 'text-destructive group-focus-within/field:text-destructive',
                      isValid && 'text-success group-focus-within/field:text-success',
                    )}
                  >
                    <motion.span
                      whileHover={{ scale: 1.1, rotate: 3 }}
                      animate={
                        fieldStatus === 'invalid'
                          ? { scale: [1, 1.18, 1], rotate: [0, -5, 5, 0] }
                          : fieldStatus === 'valid'
                            ? { scale: [1, 1.2, 1], rotate: [0, 5, 0] }
                            : { scale: 1, rotate: 0 }
                      }
                      transition={{ duration: 0.24, ease: 'easeOut' }}
                      className="inline-flex"
                    >
                      {column.icon}
                    </motion.span>
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {content}
                  <AnimatePresence initial={false}>
                    {microcopyByField[column.key] && !column.microcopyInPlaceholder ? (
                      <motion.p
                        initial={{ height: 0, opacity: 0, y: -3 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -3 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden pt-1 text-xs font-medium text-destructive"
                        role="alert"
                      >
                        {microcopyByField[column.key]}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
                <AnimatePresence initial={false}>
                  {fieldStatus !== 'idle' && (
                    <motion.span
                      key={fieldStatus}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      className="mt-0.5 shrink-0"
                    >
                      {fieldStatus === 'invalid' ? (
                        <CircleX className="size-4 text-destructive" />
                      ) : (
                        <CheckCircle2 className="size-4 text-success" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  const renderActions = (mode: InlineTableMode, isFormValid: boolean) => {
    return (
      <div className="mt-6 flex flex-row justify-end gap-2 sm:mt-4">
        <Button
          type="button"
          variant="secondary"
          disabled={isSaving}
          onClick={() => {
            if (mode === 'create') {
              setCreateValues(null);
              onCancelCreate?.();
            } else {
              setEditingId(null);
              setEditValues(null);
            }
            setValidationAttempted(false);
            setTouchedFields(new Set());
            setMicrocopyByField({});
          }}
          className="flex-1 sm:flex-none"
        >
          <X /> Cancelar
        </Button>
        <Button
          type="button"
          disabled={isSaving || !isFormValid || (mode === 'create' ? !onCreate : !onUpdate)}
          onClick={() => void (mode === 'create' ? handleCreate() : handleDone())}
          className="flex-1 sm:flex-none"
        >
          {isSaving ? <LoaderCircle className="animate-spin" /> : <Check />}
          {isSaving ? 'Salvando…' : mode === 'create' ? 'Adicionar' : 'Salvar'}
        </Button>
      </div>
    );
  };

  const renderEditingItem = (item: T, mode: InlineTableMode) => {
    const validation = validate?.(item, mode);
    const validationColumns = columns.filter((column) => column.validates);
    const validFields = validationColumns.filter((column) => !validation?.fieldErrors?.[column.key]).length;
    const progress = validationColumns.length > 0 ? (validFields / validationColumns.length) * 100 : 100;

    return (
      <motion.div
        layoutId={`container-${item.id}`}
        transition={sharedElementTransition}
        className="relative z-20 my-2 overflow-hidden rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl sm:my-4 sm:rounded-none sm:border-x-0 sm:p-8 sm:py-4 sm:shadow-none"
      >
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-muted" role="progressbar" aria-label="Progresso do preenchimento" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            className="relative h-full overflow-hidden bg-success"
          >
            {progress > 0 && progress < 100 ? (
              <motion.span
                aria-hidden="true"
                animate={{ x: ['-120%', '260%'] }}
                transition={{ duration: 1.25, ease: 'linear', repeat: Infinity }}
                className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-primary-foreground/55 to-transparent"
              />
            ) : null}
          </motion.div>
        </div>

        {renderEditor(item, mode, mode === 'create' ? updateCreateValue : updateEditValue, validation)}
        {renderActions(mode, validation?.isValid ?? true)}

        <AnimatePresence>
          {saveSucceeded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-card/92 backdrop-blur-sm"
            >
              <div className="relative flex flex-col items-center gap-2">
                {CONFETTI.map((piece, index) => (
                  <motion.span
                    key={`${piece.x}-${piece.y}`}
                    aria-hidden="true"
                    initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                    animate={{ x: piece.x, y: piece.y, scale: [0, 1, 0.8], rotate: piece.rotate, opacity: [1, 1, 0] }}
                    transition={{ duration: 0.75, delay: index * 0.025, ease: 'easeOut' }}
                    className={cn('absolute left-1/2 top-7 size-1.5 rounded-[2px]', piece.className)}
                  />
                ))}
                <div className="relative grid size-14 place-items-center">
                  <motion.span
                    aria-hidden="true"
                    initial={{ scale: 0.75, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full border-2 border-success"
                  />
                  <svg viewBox="0 0 48 48" className="size-14 rounded-full bg-success/10 p-2 text-success" aria-hidden="true">
                    <motion.circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="2.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} />
                    <motion.path d="M15 24.5 21.5 31 34 18.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.25 }} />
                  </svg>
                </div>
                <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="text-sm font-semibold text-success">
                  {mode === 'create' ? 'Contato adicionado!' : 'Alterações salvas!'}
                </motion.p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderItem = (item: T) => {
    const isEditing = editingId === item.id;
    const visibleItem = isEditing && editValues?.id === item.id ? editValues : item;

    return (
      <div key={item.id} className="relative">
        {!editingId && !createValues ? <div className="mx-6 hidden h-px bg-border sm:block" /> : null}
        <AnimatePresence initial={false}>
          {isEditing ? (
            renderEditingItem(visibleItem, 'edit')
          ) : (
            <motion.div
              layoutId={`container-${item.id}`}
              transition={{ ...sharedElementTransition, opacity: { duration: 0.08 } }}
              animate={{ opacity: editingId || createValues ? 0.42 : 1 }}
              className={cn(
                'group grid cursor-default grid-cols-[minmax(0,1fr)_40px] items-center rounded-2xl px-4 py-4 transition-colors duration-150 sm:grid-cols-[var(--inline-grid)] sm:rounded-none sm:px-6 sm:py-5',
                editingId || createValues ? '' : 'border border-border bg-muted/30 hover:bg-muted/50 sm:border-none sm:bg-transparent',
              )}
              style={{ '--inline-grid': gridTemplateColumns } as React.CSSProperties}
            >
              {columns.map((column, index) => (
                <div key={column.key} className={cn('min-w-0', index > 0 && 'hidden sm:block', column.className)}>
                  {index === 0 ? (
                    <>
                      {column.render(item)}
                      {renderMobile && <div className="mt-1 space-y-1 sm:hidden">{renderMobile(item)}</div>}
                    </>
                  ) : column.render(item)}
                </div>
              ))}

              <div className="flex justify-end gap-1">
                {onDelete && <Button type="button" variant="ghost" size="icon-sm" onClick={() => onDelete(item)} aria-label="Excluir contato" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 /></Button>}
                {onUpdate && (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => { setEditValues({ ...item }); setEditingId(item.id); setValidationAttempted(false); setTouchedFields(new Set()); setMicrocopyByField({}); setSaveSucceeded(false); }} aria-label="Editar contato" className="text-muted-foreground hover:bg-primary/10 hover:text-primary">
                    <Pencil />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={cn('flex w-full flex-col antialiased select-none', className)}>
      <div className="w-full">
        <motion.div layout transition={layoutTransition} className={cn('sticky top-0 z-10 hidden bg-card/95 px-6 py-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase shadow-sm backdrop-blur transition-opacity duration-100 sm:grid', editingId || createValues ? 'opacity-30' : 'opacity-100')} style={{ gridTemplateColumns }}>
          {columns.map((column) => <motion.div layout key={column.key} className={cn('flex items-center gap-2', column.className)}>{column.icon} {column.label}</motion.div>)}
          <div aria-hidden="true" />
        </motion.div>

        <LayoutGroup>
          <div className="flex flex-col gap-2 sm:gap-0">
            {createValues && <motion.div layout transition={layoutTransition}>{renderEditingItem(createValues, 'create')}</motion.div>}
            {items.length > 0 ? items.map(renderItem) : !createValues ? <div className="flex min-h-32 items-center justify-center px-4 py-12 text-sm text-muted-foreground">{emptyMessage}</div> : null}
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}

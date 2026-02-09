"use client";

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { MoveContactFormProps } from './types';

/**
 * MoveContactForm - Inline form for selecting target group and confirming move
 */
export function MoveContactForm({
  targetGroupId,
  otherGroups,
  isLoading,
  onTargetGroupChange,
  onConfirm,
  onCancel,
}: MoveContactFormProps) {
  return (
    <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-right-5 duration-200">
      <Select 
        value={targetGroupId} 
        onValueChange={onTargetGroupChange}
        disabled={isLoading}
      >
        <SelectTrigger className="h-8 text-xs" aria-label="Selecionar grupo de destino">
          <SelectValue placeholder="Mover para..." />
        </SelectTrigger>
        <SelectContent>
          {otherGroups.map(g => (
            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        size="sm" 
        className="h-8 px-2" 
        onClick={onConfirm}
        disabled={!targetGroupId || isLoading}
        aria-label="Confirmar movimentação"
      >
        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OK'}
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 px-2" 
        onClick={onCancel}
        disabled={isLoading}
        aria-label="Cancelar movimentação"
      >
        Cancelar
      </Button>
    </div>
  );
}

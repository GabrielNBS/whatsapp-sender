"use client";

import { Button } from '@/components/ui/button';
import { ArrowRightLeft, UserMinus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContactActionsProps } from './types';

/**
 * ContactActions - Action buttons for move/remove operations
 */
export function ContactActions({
  contact,
  canMove,
  isDefaultGroup,
  isLoading,
  onStartMove,
  onRemove,
}: ContactActionsProps) {
  return (
    <div className="flex gap-2">
      {canMove && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 border-warning/30 hover:bg-warning/10 hover:text-warning-foreground dark:border-warning/20 dark:hover:bg-warning/10"
          onClick={onStartMove}
          disabled={isLoading}
          aria-label={`Mover ${contact.name} para outro grupo`}
        >
          <ArrowRightLeft className="w-3 h-3 mr-1.5" aria-hidden="true" />
          Mover
        </Button>
      )}

      {isDefaultGroup ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 opacity-50 cursor-not-allowed"
                aria-disabled="true"
              >
                <UserMinus className="w-3 h-3 mr-1.5" aria-hidden="true" />
                Remover
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Não é possível remover contatos do grupo Geral</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          disabled={isLoading}
          aria-label={`Remover ${contact.name} do grupo`}
        >
          <UserMinus className="w-3 h-3 mr-1.5" aria-hidden="true" />
          Remover
        </Button>
      )}
    </div>
  );
}


import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScheduledBatch } from '@/lib/types';

interface StaleBatchDialogProps {
  staleBatch: ScheduledBatch | null;
  onAction: (keep: boolean) => void;
}

export function StaleBatchDialog({ staleBatch, onAction }: StaleBatchDialogProps) {
  if (!staleBatch) return null;

  // Ensure scheduledFor is valid properly handled
  const scheduledDate = typeof staleBatch.scheduledFor === 'string' 
      ? new Date(staleBatch.scheduledFor) 
      : staleBatch.scheduledFor;

  return (
    <Dialog open={!!staleBatch} onOpenChange={(open) => !open && onAction(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendamento Atrasado Detectado</DialogTitle>
          <DialogDescription>
            O agendamento "{staleBatch.batchName || 'Sem nome'}" estava programado para {scheduledDate.toLocaleString()}, o que faz mais de 1 hora.
            <br /><br />
            Deseja enviar as mensagens agora ou cancelar?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={() => onAction(false)}>
            Cancelar Agendamento
          </Button>
          <Button onClick={() => onAction(true)}>
            Enviar Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

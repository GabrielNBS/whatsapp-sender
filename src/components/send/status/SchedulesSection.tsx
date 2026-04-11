import { ScheduledBatch } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScheduleItem } from '@/components/schedule-item';

interface SchedulesSectionProps {
  schedules: ScheduledBatch[];
  onCancel: (batchId: string) => void;
}

/**
 * SchedulesSection - Lista de agendamentos ativos
 */
export function SchedulesSection({ schedules, onCancel }: SchedulesSectionProps) {
  if (schedules.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
        Agendamentos Ativos
        <Badge variant="secondary" className="text-[10px]">{schedules.length}</Badge>
      </h4>
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
        {schedules.map(batch => (
          <ScheduleItem key={batch.id} batch={batch} onCancel={onCancel} />
        ))}
      </div>
    </div>
  );
}

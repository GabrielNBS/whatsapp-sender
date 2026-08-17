import { describe, expect, it } from 'vitest';
import { splitScheduleBatches } from '@/lib/schedule-store';
import type { ScheduleBatchSummary } from '@/lib/types';

const batch = (overrides: Partial<ScheduleBatchSummary>): ScheduleBatchSummary => ({
  id: 'schedule-1',
  batchId: 'batch-1',
  batchName: 'Campanha',
  count: 0,
  processing: 0,
  paused: 0,
  total: 3,
  sent: 3,
  failed: 0,
  scheduledFor: new Date().toISOString(),
  ...overrides,
});

describe('splitScheduleBatches', () => {
  it('separates complete batches from batches that still need attention', () => {
    const result = splitScheduleBatches([
      batch({ batchId: 'complete' }),
      batch({ batchId: 'paused', sent: 1, count: 0, paused: 2 }),
      batch({ batchId: 'scheduled', sent: 0, count: 3 }),
    ]);

    expect(result.completedSchedules.map((item) => item.batchId)).toEqual(['complete']);
    expect(result.activeSchedules.map((item) => item.batchId)).toEqual(['paused', 'scheduled']);
  });
});

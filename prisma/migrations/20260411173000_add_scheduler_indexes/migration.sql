-- Improve scheduler and queue status query performance
CREATE INDEX IF NOT EXISTS "ScheduledMessage_status_scheduledFor_idx"
ON "ScheduledMessage"("status", "scheduledFor");

CREATE INDEX IF NOT EXISTS "ScheduledMessage_batchId_status_idx"
ON "ScheduledMessage"("batchId", "status");

CREATE INDEX IF NOT EXISTS "ScheduledMessage_scheduledFor_idx"
ON "ScheduledMessage"("scheduledFor");


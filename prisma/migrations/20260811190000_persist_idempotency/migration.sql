CREATE TABLE "IdempotencyRecord" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "IdempotencyRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "IdempotencyRecord_workspaceId_key_key"
ON "IdempotencyRecord"("workspaceId", "key");

CREATE INDEX "IdempotencyRecord_expiresAt_idx"
ON "IdempotencyRecord"("expiresAt");

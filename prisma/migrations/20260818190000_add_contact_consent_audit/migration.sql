CREATE TABLE "ContactConsentAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL DEFAULT 'local',
    "contactId" TEXT,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reason" TEXT,
    "matchedKeyword" TEXT,
    "messageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactConsentAudit_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactConsentAudit_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ContactConsentAudit_workspaceId_createdAt_idx" ON "ContactConsentAudit"("workspaceId", "createdAt");
CREATE INDEX "ContactConsentAudit_workspaceId_phone_createdAt_idx" ON "ContactConsentAudit"("workspaceId", "phone", "createdAt");
CREATE INDEX "ContactConsentAudit_contactId_createdAt_idx" ON "ContactConsentAudit"("contactId", "createdAt");

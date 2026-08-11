-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "monthlyMessageLimit" INTEGER NOT NULL,
    "contactLimit" INTEGER,
    "activeCampaignLimit" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "provider" TEXT,
    "providerCustomerId" TEXT,
    "providerSubId" TEXT,
    "currentPeriodStart" DATETIME,
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsageEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL DEFAULT 'local',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContactGroup_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactGroupMembership" (
    "contactId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("contactId", "groupId"),
    CONSTRAINT "ContactGroupMembership_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ContactGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ContactGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Seed the default workspace used before authentication and tenant provisioning exist.
INSERT OR IGNORE INTO "Workspace" ("id", "name", "createdAt", "updatedAt")
VALUES ('local', 'Local Workspace', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "Plan" (
    "id",
    "name",
    "monthlyMessageLimit",
    "contactLimit",
    "activeCampaignLimit",
    "createdAt",
    "updatedAt"
)
VALUES ('local-free', 'Local Free', 5000, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "Subscription" (
    "id",
    "workspaceId",
    "planId",
    "status",
    "createdAt",
    "updatedAt"
)
VALUES ('local-subscription', 'local', 'local-free', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO "ContactGroup" ("id", "workspaceId", "name", "description", "createdAt", "updatedAt")
VALUES ('default', 'local', 'Geral', 'Lista Padrao', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "Template" ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "Snippet" ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "ScheduledMessage" ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "ContactAnalytics" ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "Campaign" ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "ReportConfig" ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "ReportRecipient" ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "Settings" ADD COLUMN "workspaceId" TEXT NOT NULL DEFAULT 'local';

INSERT OR IGNORE INTO "ContactGroupMembership" ("contactId", "groupId", "createdAt")
SELECT "id", 'default', CURRENT_TIMESTAMP FROM "Contact";

-- Re-scope unique constraints to workspace.
DROP INDEX IF EXISTS "Contact_phone_key";
DROP INDEX IF EXISTS "Snippet_trigger_key";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");
CREATE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_workspaceId_key" ON "Subscription"("workspaceId");
CREATE INDEX IF NOT EXISTS "UsageEvent_workspaceId_type_occurredAt_idx" ON "UsageEvent"("workspaceId", "type", "occurredAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_workspaceId_phone_key" ON "Contact"("workspaceId", "phone");
CREATE INDEX IF NOT EXISTS "Contact_workspaceId_idx" ON "Contact"("workspaceId");
CREATE UNIQUE INDEX IF NOT EXISTS "ContactGroup_workspaceId_name_key" ON "ContactGroup"("workspaceId", "name");
CREATE INDEX IF NOT EXISTS "ContactGroup_workspaceId_idx" ON "ContactGroup"("workspaceId");
CREATE INDEX IF NOT EXISTS "ContactGroupMembership_groupId_idx" ON "ContactGroupMembership"("groupId");
CREATE INDEX IF NOT EXISTS "Template_workspaceId_idx" ON "Template"("workspaceId");
CREATE UNIQUE INDEX IF NOT EXISTS "Snippet_workspaceId_trigger_key" ON "Snippet"("workspaceId", "trigger");
CREATE INDEX IF NOT EXISTS "Snippet_workspaceId_idx" ON "Snippet"("workspaceId");
CREATE INDEX IF NOT EXISTS "ScheduledMessage_workspaceId_status_scheduledFor_idx" ON "ScheduledMessage"("workspaceId", "status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "ContactAnalytics_workspaceId_idx" ON "ContactAnalytics"("workspaceId");
CREATE INDEX IF NOT EXISTS "Campaign_workspaceId_startedAt_idx" ON "Campaign"("workspaceId", "startedAt");
CREATE INDEX IF NOT EXISTS "ReportConfig_workspaceId_idx" ON "ReportConfig"("workspaceId");
CREATE INDEX IF NOT EXISTS "ReportRecipient_workspaceId_idx" ON "ReportRecipient"("workspaceId");

PRAGMA foreign_keys = OFF;
BEGIN IMMEDIATE;

ALTER TABLE "ContactGroupMembership" RENAME TO "_old_ContactGroupMembership";
ALTER TABLE "Contact" RENAME TO "_old_Contact";
ALTER TABLE "Template" RENAME TO "_old_Template";
ALTER TABLE "Snippet" RENAME TO "_old_Snippet";
ALTER TABLE "ScheduledMessage" RENAME TO "_old_ScheduledMessage";
ALTER TABLE "ContactAnalytics" RENAME TO "_old_ContactAnalytics";
ALTER TABLE "Campaign" RENAME TO "_old_Campaign";
ALTER TABLE "ReportConfig" RENAME TO "_old_ReportConfig";
ALTER TABLE "ReportRecipient" RENAME TO "_old_ReportRecipient";
ALTER TABLE "Settings" RENAME TO "_old_Settings";

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL DEFAULT 'local',
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "tags" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Contact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Template" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL DEFAULT 'local',
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "media" TEXT,
  "category" TEXT,
  CONSTRAINT "Template_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Snippet" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL DEFAULT 'local',
  "trigger" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Snippet_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ContactAnalytics" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "phone" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL DEFAULT 'local',
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "readCount" INTEGER NOT NULL DEFAULT 0,
  "lastReadAt" DATETIME,
  "lastSentAt" DATETIME,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ContactAnalytics_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL DEFAULT 'local',
  "name" TEXT NOT NULL,
  "templateName" TEXT,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "totalContacts" INTEGER NOT NULL,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "readCount" INTEGER NOT NULL DEFAULT 0,
  "responseCount" INTEGER NOT NULL DEFAULT 0,
  "immediateReportSentAt" DATETIME,
  "engagementReportSentAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Campaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReportConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL DEFAULT 'local',
  "sendImmediate" BOOLEAN NOT NULL DEFAULT true,
  "sendEngagement" BOOLEAN NOT NULL DEFAULT true,
  "engagementDelayMins" INTEGER NOT NULL DEFAULT 240,
  "engagementTimeFixed" TEXT,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ReportConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Settings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL DEFAULT 'local',
  "defaultLink" TEXT,
  "defaultCTA" TEXT,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Settings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReportRecipient" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL DEFAULT 'local',
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "configId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReportRecipient_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ReportConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReportRecipient_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ContactGroupMembership" (
  "contactId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("contactId", "groupId"),
  CONSTRAINT "ContactGroupMembership_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContactGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ContactGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ScheduledMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workspaceId" TEXT NOT NULL DEFAULT 'local',
  "scheduledFor" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "contactName" TEXT NOT NULL,
  "contactPhone" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  "contactId" TEXT,
  "batchId" TEXT,
  "batchName" TEXT,
  CONSTRAINT "ScheduledMessage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ScheduledMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ScheduledMessage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Contact" SELECT "id", "workspaceId", "name", "phone", "tags", "createdAt", "updatedAt" FROM "_old_Contact";
INSERT INTO "Template" SELECT "id", "workspaceId", "title", "content", "createdAt", "updatedAt", "media", "category" FROM "_old_Template";
INSERT INTO "Snippet" SELECT "id", "workspaceId", "trigger", "content", "createdAt", "updatedAt" FROM "_old_Snippet";
INSERT INTO "ContactAnalytics" SELECT 'analytics-' || lower(hex(randomblob(16))), "phone", "workspaceId", "sentCount", "readCount", "lastReadAt", "lastSentAt", "updatedAt" FROM "_old_ContactAnalytics";
INSERT INTO "Campaign" SELECT "id", "workspaceId", "name", "templateName", "startedAt", "completedAt", "totalContacts", "sentCount", "failedCount", "readCount", "responseCount", "immediateReportSentAt", "engagementReportSentAt", "createdAt", "updatedAt" FROM "_old_Campaign";
INSERT INTO "ReportConfig" SELECT "id", "workspaceId", "sendImmediate", "sendEngagement", "engagementDelayMins", "engagementTimeFixed", "updatedAt" FROM "_old_ReportConfig";
INSERT INTO "Settings" SELECT "id", "workspaceId", "defaultLink", "defaultCTA", "updatedAt" FROM "_old_Settings";
INSERT INTO "ReportRecipient" SELECT "id", "workspaceId", "name", "phone", "isActive", "configId", "createdAt" FROM "_old_ReportRecipient";
INSERT INTO "ContactGroupMembership" SELECT "contactId", "groupId", "createdAt" FROM "_old_ContactGroupMembership";
INSERT INTO "ScheduledMessage" SELECT "id", "workspaceId", "scheduledFor", "status", "contactName", "contactPhone", "templateId", "createdAt", "updatedAt", "contactId", "batchId", "batchName" FROM "_old_ScheduledMessage";

DROP TABLE "_old_ScheduledMessage";
DROP TABLE "_old_ContactGroupMembership";
DROP TABLE "_old_ReportRecipient";
DROP TABLE "_old_Settings";
DROP TABLE "_old_ReportConfig";
DROP TABLE "_old_Campaign";
DROP TABLE "_old_ContactAnalytics";
DROP TABLE "_old_Snippet";
DROP TABLE "_old_Template";
DROP TABLE "_old_Contact";

CREATE UNIQUE INDEX "Contact_workspaceId_phone_key" ON "Contact"("workspaceId", "phone");
CREATE INDEX "Contact_workspaceId_idx" ON "Contact"("workspaceId");
CREATE INDEX "ContactGroupMembership_groupId_idx" ON "ContactGroupMembership"("groupId");
CREATE INDEX "Template_workspaceId_idx" ON "Template"("workspaceId");
CREATE UNIQUE INDEX "Snippet_workspaceId_trigger_key" ON "Snippet"("workspaceId", "trigger");
CREATE INDEX "Snippet_workspaceId_idx" ON "Snippet"("workspaceId");
CREATE INDEX "ScheduledMessage_workspaceId_status_scheduledFor_idx" ON "ScheduledMessage"("workspaceId", "status", "scheduledFor");
CREATE INDEX "ScheduledMessage_status_scheduledFor_idx" ON "ScheduledMessage"("status", "scheduledFor");
CREATE INDEX "ScheduledMessage_batchId_status_idx" ON "ScheduledMessage"("batchId", "status");
CREATE INDEX "ScheduledMessage_scheduledFor_idx" ON "ScheduledMessage"("scheduledFor");
CREATE UNIQUE INDEX "ContactAnalytics_workspaceId_phone_key" ON "ContactAnalytics"("workspaceId", "phone");
CREATE INDEX "Campaign_workspaceId_startedAt_idx" ON "Campaign"("workspaceId", "startedAt");
CREATE UNIQUE INDEX "ReportConfig_workspaceId_key" ON "ReportConfig"("workspaceId");
CREATE UNIQUE INDEX "ReportRecipient_workspaceId_phone_key" ON "ReportRecipient"("workspaceId", "phone");
CREATE UNIQUE INDEX "Settings_workspaceId_key" ON "Settings"("workspaceId");

COMMIT;
PRAGMA foreign_keys = ON;

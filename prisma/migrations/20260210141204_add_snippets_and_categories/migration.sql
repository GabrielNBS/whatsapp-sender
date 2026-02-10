-- AlterTable
ALTER TABLE "Template" ADD COLUMN "category" TEXT;

-- CreateTable
CREATE TABLE "Snippet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trigger" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Snippet_trigger_key" ON "Snippet"("trigger");

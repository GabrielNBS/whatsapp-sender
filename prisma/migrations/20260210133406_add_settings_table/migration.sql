-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "defaultLink" TEXT,
    "defaultCTA" TEXT,
    "updatedAt" DATETIME NOT NULL
);

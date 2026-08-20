ALTER TABLE "ContactGroup" ADD COLUMN "color" TEXT NOT NULL DEFAULT 'slate';
ALTER TABLE "ContactGroup" ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'users';

UPDATE "ContactGroup"
SET "color" = 'slate', "icon" = 'users'
WHERE "name" = 'Geral';

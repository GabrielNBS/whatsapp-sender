import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const desktopAssetsDir = path.join(projectRoot, 'desktop-assets');
const templateDatabasePath = path.join(desktopAssetsDir, 'template.db');
const migrationsDir = path.join(projectRoot, 'prisma', 'migrations');

mkdirSync(desktopAssetsDir, { recursive: true });
rmSync(templateDatabasePath, { force: true });
const database = new DatabaseSync(templateDatabasePath);

const migrationDirectories = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right));

for (const migrationDirectory of migrationDirectories) {
  const migrationPath = path.join(migrationsDir, migrationDirectory, 'migration.sql');
  const sql = readFileSync(migrationPath, 'utf8');
  database.exec(sql);
}

database.close();

console.log(`Template database generated at ${templateDatabasePath}`);

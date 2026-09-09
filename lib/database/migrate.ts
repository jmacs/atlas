import {fileURLToPath} from 'node:url';
import {drizzle} from 'drizzle-orm/node-sqlite';
import {migrate} from 'drizzle-orm/node-sqlite/migrator';
import type {DatabaseSync} from 'node:sqlite';

export function migrateDatabase(sqlite: DatabaseSync) {
  const result = migrate(drizzle({client: sqlite}), {
    migrationsFolder: fileURLToPath(new URL('./migrations', import.meta.url)),
  });
  if (result) {
    throw new Error(`Database migration failed: ${JSON.stringify(result)}`);
  }
}

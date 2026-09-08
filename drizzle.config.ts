import {defineConfig} from 'drizzle-kit';

import {CONFIG} from '#config';

export default defineConfig({
  dialect: 'sqlite',
  schema: './database/schema.ts',
  out: './database/migrations',
  dbCredentials: {
    url: CONFIG.paths.database,
  },
});

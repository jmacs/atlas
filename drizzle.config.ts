import {defineConfig} from 'drizzle-kit';

import {CONFIG} from '#lib/config.ts';

export default defineConfig({
  dialect: 'sqlite',
  schema: './lib/database/schema.ts',
  out: './lib/database/migrations',
  dbCredentials: {
    url: CONFIG.paths.database,
  },
});

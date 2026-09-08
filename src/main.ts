import {serve} from '@hono/node-server';

import {createApp} from './app.ts';
import {logger} from './logger.ts';

const app = createApp();

const server = serve(
  {
    fetch: app.fetch,
    hostname: '0.0.0.0',
    port: 3000,
  },
  (info) => {
    logger.info(`Listening on http://0.0.0.0:${info.port}`);
  },
);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close());
}

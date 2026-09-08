import {serve} from '@hono/node-server';

import {createHost} from './core/host.tsx';
import {logger} from './core/logger.ts';
import {apps} from './apps/index.ts';

const host = createHost(apps);

const server = serve(
  {
    fetch: host.fetch,
    hostname: '0.0.0.0',
    port: 3000,
  },
  (info) => {
    logger.info(`Listening on http://0.0.0.0:${info.port}`);
    logger.info(`Node env: ${process.env.NODE_ENV}`);
  },
);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close());
}

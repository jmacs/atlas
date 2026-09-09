import {serve} from '@hono/node-server';
import {createActionScheduler} from '#lib/actions/scheduling.ts';
import {createActionSubmitter} from '#lib/actions/submission.ts';
import {sqlite} from '#lib/database/client.ts';
import {migrateDatabase} from '#lib/database/migrate.ts';
import {CONFIG} from '#lib/config.ts';
import {createHost} from './system/host.tsx';
import {logger} from './system/logger.ts';
import {apps} from './apps/index.ts';
import {staticPaths} from './web.config.ts';

logger.info('Application started');

migrateDatabase(sqlite);

const scheduler = createActionScheduler({
  pollIntervalMs: CONFIG.ACTION_POLL_INTERVAL_MS,
  onError: (error) => logger.error(error, 'Action scheduler error'),
});

scheduler.start();

const host = createHost({
  apps,
  staticPaths,
  dependencies: {
    actions: createActionSubmitter(scheduler),
    scheduler,
  },
});

const server = serve(
  {
    fetch: host.fetch,
    hostname: '0.0.0.0',
    port: CONFIG.PORT,
  },
  (info) => {
    logger.info(`Listening on http://0.0.0.0:${info.port}`);
    logger.info(`Node env: ${CONFIG.NODE_ENV}`);
  },
);

let shuttingDown = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    server.close();
    void scheduler
      .stop()
      .then(() => {
        // Close SSE/keepalive connections after active work has had its grace period.
        if ('closeAllConnections' in server) {
          server.closeAllConnections();
        }
        sqlite.close();
      })
      .catch((error) => {
        logger.error(error, 'Action scheduler shutdown failed');
        process.exitCode = 1;
        if ('closeAllConnections' in server) {
          server.closeAllConnections();
        }
      });
  });
}

import {serveStatic} from '@hono/node-server/serve-static';
import {Hono} from 'hono';
import {bodyLimit} from 'hono/body-limit';
import {registerFixtures} from '#fixtures';
import {CONFIG} from '#lib/config.ts';

import {createAuthMiddleware, registerAuthRoutes} from './auth.tsx';
import type {AtlasApp, AtlasEnv} from './contracts.ts';
import {ErrorPage} from './ErrorPage.tsx';
import {logger} from './logger.ts';
import {NotFoundPage} from './NotFoundPage.tsx';
import type {ActionScheduler} from '#lib/actions/scheduling.ts';
import type {ActionSubmitter} from '#lib/actions/submission.ts';

const BODY_LIMIT_KB = 16_384;

type HostOptions = {
  apps: readonly AtlasApp[];
  dependencies: {
    actions: ActionSubmitter;
    scheduler: Pick<ActionScheduler, 'cleanup'>;
  };
  staticPaths: readonly StaticPath[];
};

export type StaticPath = {
  requestPath: `/${string}/*`;
  root: string;
};

export function createHost({apps, dependencies, staticPaths}: HostOptions) {
  const app = new Hono<AtlasEnv>();

  // caps the incoming HTTP body before parsing it.
  app.use(
    '*',
    bodyLimit({
      maxSize: BODY_LIMIT_KB,
      onError: (c) => c.text('Request body exceeds 16 KiB.', 413),
    }),
  );

  for (const staticPath of staticPaths) {
    const requestRoot = staticPath.requestPath.slice(0, -1);
    app.use(
      staticPath.requestPath,
      serveStatic({
        root: staticPath.root,
        rewriteRequestPath: (requestPath) => requestPath.slice(requestRoot.length),
      }),
    );
  }

  // Request dependencies.
  app.use('*', async (c, next) => {
    c.set('actions', dependencies.actions);
    c.set('scheduler', dependencies.scheduler);
    await next();
  });

  if (CONFIG.FIXTURES) {
    registerFixtures(app);
  }

  const publicMountPaths = apps.filter((app) => app.isPublic === true).map((app) => app.mountPath);
  app.use('*', createAuthMiddleware(publicMountPaths));
  registerAuthRoutes(app);
  registerApps(app, apps);

  app.get('/error', (c) => c.html(<ErrorPage />, 500));
  app.get('/not-found', (c) => c.html(<NotFoundPage />, 404));

  app.notFound((c) => c.html(<NotFoundPage />, 404));

  app.onError((error, c) => {
    logger.error(error, 'Unhandled request error');
    return c.html(<ErrorPage />, 500);
  });

  return app;
}

function registerApps(app: Hono<AtlasEnv>, apps: readonly AtlasApp[]) {
  for (const appDefinition of apps) {
    app.route(appDefinition.mountPath, appDefinition.app);
  }
}

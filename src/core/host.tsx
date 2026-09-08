import {serveStatic} from '@hono/node-server/serve-static';
import {Hono, type Hono as HonoApp} from 'hono';

import {authMiddleware, registerAuthRoutes} from './auth.tsx';
import {ErrorPage} from './ErrorPage.tsx';
import {registerImportMapRoutes} from './importmap.ts';
import {logger} from './logger.ts';
import {NotFoundPage} from './NotFoundPage.tsx';

export type AtlasApp = {
  id: string;
  mountPath: `/${string}`;
  app: HonoApp;
};

function registerApps(app: Hono, apps: readonly AtlasApp[]) {
  for (const appDefinition of apps) {
    app.route(appDefinition.mountPath, appDefinition.app);
  }
}

export function createHost(apps: readonly AtlasApp[]) {
  const app = new Hono();

  registerImportMapRoutes(app);

  // Public static assets.
  app.use('/styles/*', serveStatic({root: './public'}));
  app.use('/scripts/*', serveStatic({root: './public'}));
  app.use('/images/*', serveStatic({root: './public'}));

  app.use('*', authMiddleware);
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

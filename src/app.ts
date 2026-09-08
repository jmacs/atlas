import {Hono} from 'hono';
import {serveStatic} from '@hono/node-server/serve-static';
import {authMiddleware, registerAuthRoutes} from './auth.tsx';
import {registerImportMapRoutes} from './importmap.ts';
import {registerRoutes} from './router.ts';

export function createApp() {
  const app = new Hono();

  registerImportMapRoutes(app);

  // public static assets
  app.use('/scripts/*', serveStatic({root: './public'}));
  app.use('/images/*', serveStatic({root: './public'}));

  app.use('*', authMiddleware);
  registerAuthRoutes(app);
  registerRoutes(app);

  return app;
}

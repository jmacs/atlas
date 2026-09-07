import {serveStatic} from '@hono/node-server/serve-static';
import {Hono} from 'hono';

import {registerRoutes} from './route.ts';

export function createApp() {
  const app = new Hono();

  app.get('/assets/htmx.js', serveStatic({path: './node_modules/htmx.org/dist/htmx.esm.js'}));
  app.use('/scripts/*', serveStatic({root: './public'}));

  registerRoutes(app);

  return app;
}

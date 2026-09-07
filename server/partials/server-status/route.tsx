import type {Hono} from 'hono';

import {ServerStatus} from './ServerStatus.tsx';

export function register(app: Hono) {
  app.get('/partials/server-status', (c) => c.html(<ServerStatus status="ok" />));
}

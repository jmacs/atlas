import type {Hono} from 'hono';

export function register(app: Hono) {
  app.get('/api/status', (c) => c.json({status: 'ok'}));
}

import {Hono} from 'hono';

export const app = new Hono().basePath('/api/status');

app.get('/', (c) => c.json({status: 'ok'}));

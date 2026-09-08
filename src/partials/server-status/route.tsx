import {Hono} from 'hono';

import {ServerStatus} from './ServerStatus.tsx';

export const app = new Hono().basePath('/partials/server-status');

app.get('/', (c) => c.html(<ServerStatus status="ok" />));

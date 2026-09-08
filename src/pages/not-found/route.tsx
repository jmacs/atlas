import {Hono} from 'hono';

import {NotFound} from './NotFound.tsx';

export const app = new Hono().basePath('/not-found');

app.get('/', (c) => c.html(<NotFound />, 404));

import {Hono} from 'hono';

import {ErrorPage} from './ErrorPage.tsx';

export const app = new Hono().basePath('/error');

app.get('/', (c) => c.html(<ErrorPage />, 500));

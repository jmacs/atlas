import {Hono} from 'hono';

import {Home} from './Home.tsx';

export const app = new Hono().basePath('/');

app.get('/', (c) => c.html(<Home />));

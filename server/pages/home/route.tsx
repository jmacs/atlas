import type {Hono} from 'hono';

import {Home} from './Home.tsx';

export function register(app: Hono) {
  app.get('/', (c) => c.html(<Home />));
}

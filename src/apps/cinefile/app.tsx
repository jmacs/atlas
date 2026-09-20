import {Hono} from 'hono';

import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {CinefileHomePage} from './CinefileHomePage.tsx';
import {CinefileSearchPage} from './CinefileSearchPage.tsx';

const app = new Hono<AtlasEnv>();

app.get('/', (c) => c.html(<CinefileHomePage />));
app.get('/search', (c) => c.html(<CinefileSearchPage />));

export const cinefileApp: AtlasApp = {
  id: 'cinefile',
  isPublic: true,
  mountPath: '/cinefile',
  app,
};

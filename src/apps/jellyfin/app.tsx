import {Hono} from 'hono';

import type {AtlasApp} from '../../core/host.tsx';
import {JellyfinHomePage} from './JellyfinHomePage.tsx';

const app = new Hono();

app.get('/', (c) => c.html(<JellyfinHomePage />));

export const jellyfinApp: AtlasApp = {
  id: 'jellyfin',
  mountPath: '/jellyfin',
  app,
};

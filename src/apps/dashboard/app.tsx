import {Hono} from 'hono';
import type {AtlasApp, AtlasEnv} from '../../system/contracts.ts';
import {DashboardPage} from './DashboardPage.tsx';

const app = new Hono<AtlasEnv>();

app.get('/', (c) => c.html(<DashboardPage />));
app.get('/api/status', (c) => c.json({status: 'ok'}));

export const dashboardApp: AtlasApp = {
  id: 'dashboard',
  mountPath: '/',
  app,
};

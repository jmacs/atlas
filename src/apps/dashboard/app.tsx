import {Hono} from 'hono';

import type {AtlasApp} from '../../core/host.tsx';
import {DashboardPage} from './DashboardPage.tsx';
import {ServerStatus} from './ServerStatus.tsx';

const app = new Hono();

app.get('/', (c) => c.html(<DashboardPage />));
app.get('/api/status', (c) => c.json({status: 'ok'}));
app.get('/partials/server-status', (c) => c.html(<ServerStatus status="ok" />));

export const dashboardApp: AtlasApp = {
  id: 'dashboard',
  mountPath: '/',
  app,
};

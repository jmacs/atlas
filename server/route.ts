import type {Hono} from 'hono';

import {register as registerStatusApi} from './api/status/route.ts';
import {register as registerHomePage} from './pages/home/route.tsx';
import {register as registerServerStatusPartial} from './partials/server-status/route.tsx';

const routeRegisters = [registerStatusApi, registerHomePage, registerServerStatusPartial];

export function registerRoutes(app: Hono) {
  for (const register of routeRegisters) {
    register(app);
  }
}

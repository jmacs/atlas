import type {Hono} from 'hono';

import {logger} from './logger.ts';
import {ErrorPage} from './pages/error/ErrorPage.tsx';
import {NotFound} from './pages/not-found/NotFound.tsx';
import * as ErrorPageRoute from './pages/error/route.tsx';
import * as HomePage from './pages/home/route.tsx';
import * as StatusApi from './api/status/route.ts';
import * as NotFoundPageRoute from './pages/not-found/route.tsx';
import * as ServerStatusPartial from './partials/server-status/route.tsx';

const routeModules = [
  // add routes here
  StatusApi,
  ErrorPageRoute,
  HomePage,
  NotFoundPageRoute,
  ServerStatusPartial,
];

type RouteModule = {
  app: Hono;
};

function isHonoApp(value: unknown): value is Hono {
  return (
    typeof value === 'object' &&
    value !== null &&
    'fetch' in value &&
    typeof value.fetch === 'function' &&
    'routes' in value &&
    Array.isArray(value.routes)
  );
}

function assertRouteModule(routeModule: object, index: number): asserts routeModule is RouteModule {
  if (!('app' in routeModule)) {
    throw new Error(`Route module at index ${index} must export app`);
  }

  if (!isHonoApp(routeModule.app)) {
    throw new Error(`Route module at index ${index} must export app as a Hono instance`);
  }
}

export function registerRoutes(app: Hono) {
  for (const [index, routeModule] of routeModules.entries()) {
    assertRouteModule(routeModule, index);
    app.route('/', routeModule.app);
  }

  app.notFound((c) => c.html(NotFound(), 404));

  app.onError((error, c) => {
    logger.error(error, 'Unhandled request error');

    return c.html(ErrorPage(), 500);
  });
}

import {serveStatic} from '@hono/node-server/serve-static';
import type {Hono} from 'hono';

type ImportMapModule = {
  import: string;
  path: string;
  module: `/${string}`;
  entry?: string;
};

const modules: ImportMapModule[] = [
  {
    import: 'htmx.org',
    path: './node_modules/htmx.org/dist',
    module: '/modules/htmx.org',
    entry: 'htmx.esm.js',
  },
];

function generateImportMap(modules: ImportMapModule[]) {
  const imports: Record<string, string> = {};
  for (const source of modules) {
    if ('entry' in source) {
      imports[source.import] = `${source.module}/${source.entry}`;
    }
    imports[`${source.import}/`] = `${source.module}/`;
  }
  return JSON.stringify({imports});
}

export const importMapJson = generateImportMap(modules);

export function registerImportMapRoutes(app: Hono) {
  for (const source of modules) {
    app.use(
      `${source.module}/*`,
      serveStatic({
        root: source.path,
        rewriteRequestPath: (requestPath) => requestPath.slice(source.module.length + 1),
      }),
    );
  }
}

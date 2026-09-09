import type {ImportMapModule} from './system/importmap.ts';
import type {StaticPath} from './system/host.tsx';

export const modules = {
  htmx: {
    import: 'htmx.org',
    module: '/modules/htmx.org',
    entry: 'htmx.esm.js',
  },
  alpine: {
    import: 'alpinejs',
    module: '/modules/alpinejs',
    entry: 'module.esm.js',
  },
} as const satisfies Record<string, ImportMapModule>;

export const staticPaths: StaticPath[] = [
  {
    requestPath: '/styles/*',
    root: './public/styles',
  },
  {
    requestPath: '/scripts/*',
    root: './public/scripts',
  },
  {
    requestPath: '/images/*',
    root: './public/images',
  },
  {
    requestPath: '/modules/htmx.org/*',
    root: './node_modules/htmx.org/dist',
  },
  {
    requestPath: '/modules/alpinejs/*',
    root: './node_modules/alpinejs/dist',
  },
];

import 'dotenv/config';

import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const ROOT_DIR = dirname(fileURLToPath(import.meta.url));

const APPDATA_DIR = resolve(ROOT_DIR, requireEnv('ATLAS_APPDATA_DIR'));
const MOVIES_DIR = requireEnv('ATLAS_MOVIES_DIR');
const BOOKS_DIR = requireEnv('ATLAS_BOOKS_DIR');

export const CONFIG = {
  paths: Object.freeze({
    root: ROOT_DIR,
    appData: APPDATA_DIR,
    database: join(APPDATA_DIR, 'atlas.sqlite'),
    logs: join(APPDATA_DIR, 'logs'),
    applicationLog: join(APPDATA_DIR, 'logs', 'atlas.log'),
    actions: join(ROOT_DIR, 'actions'),
    movies: MOVIES_DIR,
    books: BOOKS_DIR,
  }),
} as const;

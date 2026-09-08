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

const NODE_ENV = process.env.NODE_ENV || 'development';
const AUTH_BYPASS = process.env.ATLAS_AUTH_BYPASS?.trim().toLowerCase() === 'true';
const APPDATA_DIR = resolve(ROOT_DIR, requireEnv('ATLAS_APPDATA_DIR'));
const MOVIES_DIR = requireEnv('ATLAS_MOVIES_DIR');
const BOOKS_DIR = requireEnv('ATLAS_BOOKS_DIR');
const SETTINGS_PATH = join(APPDATA_DIR, 'settings.json');

export const CONFIG = {
  NODE_ENV,
  AUTH_BYPASS,
  paths: Object.freeze({
    root: ROOT_DIR,
    appData: APPDATA_DIR,
    settings: SETTINGS_PATH,
    database: join(APPDATA_DIR, 'atlas.sqlite'),
    logs: join(APPDATA_DIR, 'logs'),
    applicationLog: join(APPDATA_DIR, 'logs', 'atlas.log'),
    actions: join(ROOT_DIR, 'actions'),
    movies: MOVIES_DIR,
    books: BOOKS_DIR,
  }),
} as const;

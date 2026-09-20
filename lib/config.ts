import 'dotenv/config';

import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ADD ENV VARS HERE
const PORT = Number(process.env.PORT ?? 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const TIMEZONE = 'America/Moncton';
const ACTION_POLL_INTERVAL_MS = Number(process.env.ATLAS_ACTION_POLL_INTERVAL_MS ?? 1000);
const ACTION_RETENTION_DAYS = days(7);
const ACTION_CLEANUP_INTERVAL_MS = hours(24);
const AUTH_BYPASS = process.env.ATLAS_AUTH_BYPASS?.trim().toLowerCase() === 'true';
const FIXTURES = process.env.FIXTURES?.trim().toLowerCase() === 'true';
const APPDATA_DIR = resolve(ROOT_DIR, requireEnv('ATLAS_APPDATA_DIR'));
const MOVIES_DIR = requireEnv('ATLAS_MOVIES_DIR');
const BOOKS_DIR = requireEnv('ATLAS_BOOKS_DIR');
const JELLYFIN_SERVER = requireHttpUrl('JELLYFIN_SERVER');
const JELLYFIN_API_KEY = requireEnv('JELLYFIN_API_KEY');
const TMDB_TOKEN = requireEnv('TMDB_TOKEN');
const SETTINGS_PATH = join(APPDATA_DIR, 'settings.json');

// DO NOT EXPORT ANYTHING ELSE FROM THIS FILE!
export const CONFIG = {
  PORT,
  NODE_ENV,
  TIMEZONE,
  AUTH_BYPASS,
  FIXTURES,
  ACTION_POLL_INTERVAL_MS,
  ACTION_RETENTION_DAYS,
  ACTION_CLEANUP_INTERVAL_MS,
  JELLYFIN_SERVER,
  JELLYFIN_API_KEY,
  TMDB_TOKEN,
  paths: Object.freeze({
    root: ROOT_DIR,
    appData: APPDATA_DIR,
    settings: SETTINGS_PATH,
    database: join(APPDATA_DIR, 'atlas.sqlite'),
    logs: join(APPDATA_DIR, 'logs'),
    applicationLog: join(APPDATA_DIR, 'logs', 'atlas.log'),
    movies: MOVIES_DIR,
    books: BOOKS_DIR,
    jellyfin: join(APPDATA_DIR, 'jellyfin'),
    jellyfinCatalog: join(APPDATA_DIR, 'jellyfin', 'catalog.json'),
    jellyfinCollectionUpdaters: join(APPDATA_DIR, 'jellyfin', 'collection-updaters.json'),
  }),
} as const;

function days(value: number) {
  return hours(value * 24);
}

function hours(value: number) {
  return value * 60 * 60 * 1000;
}

function requireHttpUrl(name: string): string {
  const value = requireEnv(name);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) URL.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must be a valid HTTP(S) URL.`);
  }
  return url.toString().replace(/\/$/, '');
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

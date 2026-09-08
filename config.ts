import 'dotenv/config';

import {readFileSync} from 'node:fs';
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
const SETTINGS_PATH = join(APPDATA_DIR, 'settings.json');

function readBooleanEnv(name: string): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === undefined || value === '' || value === 'false') {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  throw new Error(`${name} must be either true or false`);
}

function readAuthSettings() {
  let settings: unknown;
  try {
    settings = JSON.parse(readFileSync(SETTINGS_PATH, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Unable to read ${SETTINGS_PATH}`, {cause: error});
  }

  if (
    typeof settings !== 'object' ||
    settings === null ||
    !('auth' in settings) ||
    typeof settings.auth !== 'object' ||
    settings.auth === null ||
    !('username' in settings.auth) ||
    typeof settings.auth.username !== 'string' ||
    settings.auth.username.length === 0 ||
    !('password' in settings.auth) ||
    typeof settings.auth.password !== 'string' ||
    settings.auth.password.length === 0
  ) {
    throw new Error(
      `${SETTINGS_PATH} must contain non-empty auth.username and auth.password strings`,
    );
  }

  return Object.freeze({
    username: settings.auth.username,
    password: settings.auth.password,
  });
}

const AUTH_BYPASS = readBooleanEnv('ATLAS_AUTH_BYPASS');
if (AUTH_BYPASS && process.env.NODE_ENV !== 'development') {
  throw new Error('ATLAS_AUTH_BYPASS can only be enabled when NODE_ENV=development');
}

const AUTH_SETTINGS = AUTH_BYPASS ? undefined : readAuthSettings();

export const CONFIG = {
  auth: Object.freeze({
    bypass: AUTH_BYPASS,
    credentials: AUTH_SETTINGS,
  }),
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

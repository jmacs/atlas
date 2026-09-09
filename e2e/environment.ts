import {join, resolve} from 'node:path';

export const ROOT_DIR = resolve(import.meta.dirname, '..');
export const PLAYWRIGHT_PORT = 3100;
export const PLAYWRIGHT_APPDATA_DIR = join(ROOT_DIR, '.local', 'playwright', 'app');

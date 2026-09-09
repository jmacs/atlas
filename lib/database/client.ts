import {mkdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

import {drizzle} from 'drizzle-orm/node-sqlite';

import {CONFIG} from '#lib/config.ts';

mkdirSync(CONFIG.paths.appData, {recursive: true});

export const sqlite = new DatabaseSync(CONFIG.paths.database);

sqlite.exec('PRAGMA busy_timeout = 5000');
sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');

export const db = drizzle({client: sqlite});

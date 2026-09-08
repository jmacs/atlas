import {mkdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';

import {defineRelations} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/node-sqlite';

import {CONFIG} from '#config';
import * as schema from '#database/schema';

mkdirSync(CONFIG.paths.appData, {recursive: true});

export const sqlite = new DatabaseSync(CONFIG.paths.database);

sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');
sqlite.exec('PRAGMA busy_timeout = 5000');

const relations = defineRelations(schema);

export const db = drizzle({client: sqlite, relations});

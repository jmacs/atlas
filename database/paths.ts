import 'dotenv/config';

import {join, resolve} from 'node:path';

const configuredAppDataDirectory = process.env.ATLAS_APPDATA_DIR?.trim();

export const appDataDirectory = resolve(configuredAppDataDirectory || '.local');
export const sqlitePath = join(appDataDirectory, 'atlas.sqlite');

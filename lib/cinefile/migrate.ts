import {copyFile, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {randomUUID} from 'node:crypto';

import {CONFIG} from '#lib/config.ts';

export type CinefileMigrationResult =
  | {status: 'missing' | 'up-to-date'}
  | {backupPath: string; migratedRequests: number; status: 'migrated'};

export async function migrateCinefileRequests(
  path = CONFIG.paths.cinefileRequests,
): Promise<CinefileMigrationResult> {
  let serialized: string;
  try {
    serialized = await readFile(path, 'utf8');
  } catch (error) {
    if (isMissingFile(error)) {
      return {status: 'missing'};
    }
    throw error;
  }

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch (error) {
    throw new Error('Cinefile requests contain invalid JSON and cannot be migrated.', {
      cause: error,
    });
  }
  if (isRecord(value) && value.schema === 1 && Array.isArray(value.requests)) {
    return {status: 'up-to-date'};
  }
  if (!Array.isArray(value)) {
    throw new Error('Cinefile requests use an unknown schema and cannot be migrated.');
  }

  const requests = value.map((request, index) => {
    if (!isRecord(request)) {
      throw new Error(`Legacy Cinefile request at index ${index} must be an object.`);
    }
    return {...request, kind: 'movie'};
  });
  const backupPath = `${path}.backup-${new Date().toISOString().replaceAll(':', '-')}`;
  await copyFile(path, backupPath);

  const temporaryPath = join(dirname(path), `.${randomUUID()}.requests-migration.json`);
  try {
    await writeFile(temporaryPath, JSON.stringify({schema: 1, requests}), {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporaryPath, path);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
  return {backupPath, migratedRequests: requests.length, status: 'migrated'};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

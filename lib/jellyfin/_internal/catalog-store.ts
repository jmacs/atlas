import {mkdir, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {CONFIG} from '#lib/config.ts';
import {validateCatalog} from './catalog-validation.ts';
import type {Catalog} from './catalog.ts';

export type CatalogReadResult =
  | {kind: 'missing'}
  | {kind: 'ready'; catalog: Catalog}
  | {kind: 'unavailable'; reason: 'read_failed' | 'invalid'; cause: Error};

export type CatalogStore = {
  read(): Promise<CatalogReadResult>;
  replace(catalog: Catalog): Promise<void>;
};

export function createCatalogStore(path = CONFIG.paths.jellyfinCatalog): CatalogStore {
  return {
    async read() {
      let serialized: string;
      try {
        serialized = await readFile(path, 'utf8');
      } catch (error) {
        if (isMissingFile(error)) {
          return {kind: 'missing'};
        }
        return {kind: 'unavailable', reason: 'read_failed', cause: toError(error)};
      }
      let value: unknown;
      try {
        value = JSON.parse(serialized);
      } catch (error) {
        return {kind: 'unavailable', reason: 'invalid', cause: toError(error)};
      }
      const catalog = validateCatalog(value);
      if ('code' in catalog) {
        return {
          kind: 'unavailable',
          reason: 'invalid',
          cause: catalog.cause ?? new Error('Invalid catalog.'),
        };
      }
      return {kind: 'ready', catalog};
    },
    async replace(catalog) {
      const validated = validateCatalog(catalog);
      if ('code' in validated) {
        throw validated.cause ?? new Error('Invalid catalog.');
      }
      const serialized = JSON.stringify(validated);
      const directory = dirname(path);
      const temporaryPath = join(directory, `.${randomUUID()}.catalog.json`);
      await mkdir(directory, {recursive: true});
      try {
        await writeFile(temporaryPath, serialized, {encoding: 'utf8', flag: 'wx'});
        await rename(temporaryPath, path);
      } catch (error) {
        await unlink(temporaryPath).catch(() => undefined);
        throw error;
      }
    },
  };
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

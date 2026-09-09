import {randomUUID} from 'node:crypto';
import {mkdir, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {CONFIG} from '#lib/config.ts';
import {validateSavedCollectionUpdaters} from './collection-updater-validation.ts';
import type {CollectionUpdaterValidationError} from './collection-updater-validation.ts';
import type {SavedCollectionUpdater} from './collection-updater-library.ts';

export type CollectionUpdaterStore = {
  read(): Promise<SavedCollectionUpdater[]>;
  replace(updaters: readonly SavedCollectionUpdater[]): Promise<void>;
};

export function createCollectionUpdaterStore(
  path = CONFIG.paths.jellyfinCollectionUpdaters,
): CollectionUpdaterStore {
  return {
    async read() {
      let serialized: string;
      try {
        serialized = await readFile(path, 'utf8');
      } catch (error) {
        if (isMissingFile(error)) {
          return [];
        }
        throw new Error(`Unable to read saved collection updaters: ${toError(error).message}`, {
          cause: error,
        });
      }

      let value: unknown;
      try {
        value = JSON.parse(serialized);
      } catch (error) {
        throw new Error(
          `Saved collection updaters contain invalid JSON: ${toError(error).message}`,
          {
            cause: error,
          },
        );
      }
      const validated = validateSavedCollectionUpdaterDocument(value);
      if ('code' in validated) {
        throw new Error(
          `Saved collection updaters are invalid at ${validated.path}: ${validated.message}`,
        );
      }
      return validated;
    },
    async replace(updaters) {
      const validated = validateSavedCollectionUpdaterDocument(updaters);
      if ('code' in validated) {
        throw new Error(
          `Saved collection updaters are invalid at ${validated.path}: ${validated.message}`,
        );
      }
      const serialized = JSON.stringify(validated);
      const directory = dirname(path);
      const temporaryPath = join(directory, `.${randomUUID()}.collection-updaters.json`);
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

export function validateSavedCollectionUpdaterDocument(
  value: unknown,
): SavedCollectionUpdater[] | CollectionUpdaterValidationError {
  if (!Array.isArray(value)) {
    return invalid('collectionUpdaters', 'must be an array.');
  }
  const ids = new Set<string>();
  for (const [index, entry] of value.entries()) {
    const path = `collectionUpdaters[${index}]`;
    if (!isRecord(entry)) {
      return invalid(path, 'must be an object.');
    }
    if (typeof entry.id !== 'string' || !entry.id.trim()) {
      return invalid(`${path}.id`, 'must be a non-empty string.');
    }
    if (ids.has(entry.id)) {
      return invalid(`${path}.id`, 'must be unique within the saved updater library.');
    }
    if (typeof entry.enabled !== 'boolean') {
      return invalid(`${path}.enabled`, 'must be a boolean.');
    }
    ids.add(entry.id);
  }
  const domain = validateSavedCollectionUpdaters(
    value.map((entry) => {
      if (!isRecord(entry)) {
        return entry;
      }
      return {collectionId: entry.collectionId, conditions: entry.conditions};
    }),
  );
  if ('code' in domain) {
    return domain;
  }
  return domain.map((updater, index) => {
    const entry = value[index]! as Record<string, unknown>;
    return {id: entry.id as string, enabled: entry.enabled as boolean, ...updater};
  });
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function invalid(path: string, message: string): CollectionUpdaterValidationError {
  return {code: 'collection_updater_invalid', path, message};
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

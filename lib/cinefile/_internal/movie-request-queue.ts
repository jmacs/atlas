import {randomUUID} from 'node:crypto';
import {mkdir, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';

import {CONFIG} from '#lib/config.ts';

export type MovieRequest = {
  id: string;
  title: string;
  tmdbId: number;
  year: number | null;
};

export type NewMovieRequest = Omit<MovieRequest, 'id'>;

export type MovieRequestQueue = {
  add(movie: NewMovieRequest): Promise<MovieRequest>;
  read(): Promise<MovieRequest[]>;
  remove(tmdbId: number): Promise<void>;
};

export function createMovieRequestQueue(path = CONFIG.paths.cinefileRequests): MovieRequestQueue {
  let pending: Promise<unknown> = Promise.resolve();

  function serialized<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation, operation);
    pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  return {
    add(movie) {
      return serialized(async () => {
        validateNewMovieRequest(movie);
        const requests = await readOrCreate(path);
        const existing = requests.find(({tmdbId}) => tmdbId === movie.tmdbId);
        if (existing) {
          return existing;
        }
        const request = {id: randomUUID(), ...movie};
        await replace(path, [...requests, request]);
        return request;
      });
    },
    read() {
      return serialized(() => readOrCreate(path));
    },
    remove(tmdbId) {
      return serialized(async () => {
        validateTmdbId(tmdbId);
        const requests = await readOrCreate(path);
        const remaining = requests.filter((request) => request.tmdbId !== tmdbId);
        if (remaining.length !== requests.length) {
          await replace(path, remaining);
        }
      });
    },
  };
}

async function readOrCreate(path: string): Promise<MovieRequest[]> {
  let serialized: string;
  try {
    serialized = await readFile(path, 'utf8');
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }
    await mkdir(dirname(path), {recursive: true});
    try {
      await writeFile(path, '[]', {encoding: 'utf8', flag: 'wx'});
      return [];
    } catch (createError) {
      if (!isAlreadyExists(createError)) {
        throw createError;
      }
      serialized = await readFile(path, 'utf8');
    }
  }

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch (error) {
    throw new Error('Movie requests contain invalid JSON.', {cause: error});
  }
  return validateMovieRequests(value);
}

async function replace(path: string, requests: readonly MovieRequest[]): Promise<void> {
  const directory = dirname(path);
  const temporaryPath = join(directory, `.${randomUUID()}.requests.json`);
  await mkdir(directory, {recursive: true});
  try {
    await writeFile(temporaryPath, JSON.stringify(requests), {encoding: 'utf8', flag: 'wx'});
    await rename(temporaryPath, path);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

function validateMovieRequests(value: unknown): MovieRequest[] {
  if (!Array.isArray(value)) {
    throw new Error('Movie requests must be an array.');
  }
  const ids = new Set<string>();
  const tmdbIds = new Set<number>();
  for (const [index, request] of value.entries()) {
    const label = `Movie request at index ${index}`;
    if (!isRecord(request)) {
      throw new Error(`${label} must be an object.`);
    }
    if (typeof request.id !== 'string' || !request.id.trim()) {
      throw new Error(`${label} must have an ID.`);
    }
    if (ids.has(request.id)) {
      throw new Error('Movie request IDs must be unique.');
    }
    validateNewMovieRequest({
      title: request.title as string,
      tmdbId: request.tmdbId as number,
      year: request.year as number | null,
    });
    if (tmdbIds.has(request.tmdbId as number)) {
      throw new Error('A movie can only appear in the request queue once.');
    }
    ids.add(request.id);
    tmdbIds.add(request.tmdbId as number);
  }
  return value as MovieRequest[];
}

function validateNewMovieRequest(movie: NewMovieRequest): void {
  if (typeof movie.title !== 'string' || !movie.title.trim()) {
    throw new Error('A movie request must have a title.');
  }
  validateTmdbId(movie.tmdbId);
  if (movie.year !== null && (!Number.isSafeInteger(movie.year) || movie.year <= 0)) {
    throw new Error('A movie request year must be a positive integer or null.');
  }
}

function validateTmdbId(tmdbId: number): void {
  if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
    throw new Error('A movie request must have a valid TMDB ID.');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMissingFile(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

function isAlreadyExists(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'EEXIST';
}

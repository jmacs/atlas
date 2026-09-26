import {randomUUID} from 'node:crypto';
import {mkdir, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';

import {CONFIG} from '#lib/config.ts';

export type RequestKind = 'movie' | 'tvseries';

export type CinefileRequest = {
  id: string;
  kind: RequestKind;
  posterPath: string | null;
  requestedAt: string;
  title: string;
  tmdbId: number;
  year: number | null;
};

export type NewCinefileRequest = Omit<CinefileRequest, 'id' | 'requestedAt'>;

export type CinefileRequestQueue = {
  add(request: NewCinefileRequest): Promise<CinefileRequest>;
  read(): Promise<CinefileRequest[]>;
  remove(kind: RequestKind, tmdbId: number): Promise<void>;
};

type RequestDocument = {
  requests: CinefileRequest[];
  schema: 1;
};

export function createCinefileRequestQueue(
  path = CONFIG.paths.cinefileRequests,
): CinefileRequestQueue {
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
    add(newRequest) {
      return serialized(async () => {
        validateNewRequest(newRequest);
        const requests = await readOrCreate(path);
        const existing = requests.find(
          ({kind, tmdbId}) => kind === newRequest.kind && tmdbId === newRequest.tmdbId,
        );
        if (existing) {
          return existing;
        }
        const request = {
          id: randomUUID(),
          requestedAt: new Date().toISOString(),
          ...newRequest,
        };
        await replace(path, [...requests, request]);
        return request;
      });
    },
    read() {
      return serialized(() => readOrCreate(path));
    },
    remove(kind, tmdbId) {
      return serialized(async () => {
        validateKind(kind);
        validateTmdbId(tmdbId);
        const requests = await readOrCreate(path);
        const remaining = requests.filter(
          (request) => request.kind !== kind || request.tmdbId !== tmdbId,
        );
        if (remaining.length !== requests.length) {
          await replace(path, remaining);
        }
      });
    },
  };
}

async function readOrCreate(path: string): Promise<CinefileRequest[]> {
  let serialized: string;
  try {
    serialized = await readFile(path, 'utf8');
  } catch (error) {
    if (!isMissingFile(error)) {
      throw error;
    }
    await mkdir(dirname(path), {recursive: true});
    try {
      await writeFile(path, JSON.stringify({schema: 1, requests: []}), {
        encoding: 'utf8',
        flag: 'wx',
      });
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
    throw new Error('Cinefile requests contain invalid JSON.', {cause: error});
  }
  return validateRequestDocument(value).requests;
}

async function replace(path: string, requests: readonly CinefileRequest[]): Promise<void> {
  const directory = dirname(path);
  const temporaryPath = join(directory, `.${randomUUID()}.requests.json`);
  await mkdir(directory, {recursive: true});
  const document: RequestDocument = {schema: 1, requests: [...requests]};
  try {
    await writeFile(temporaryPath, JSON.stringify(document, null, 2), {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporaryPath, path);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

function validateRequestDocument(value: unknown): RequestDocument {
  if (!isRecord(value) || value.schema !== 1 || !Array.isArray(value.requests)) {
    throw new Error('Cinefile requests must use schema 1. Run the Cinefile migration.');
  }
  const ids = new Set<string>();
  const mediaIds = new Set<string>();
  for (const [index, request] of value.requests.entries()) {
    const label = `Cinefile request at index ${index}`;
    if (!isRecord(request)) {
      throw new Error(`${label} must be an object.`);
    }
    if (typeof request.id !== 'string' || !request.id.trim()) {
      throw new Error(`${label} must have an ID.`);
    }
    if (!isUtcDate(request.requestedAt)) {
      throw new Error(`${label} must have a valid request timestamp.`);
    }
    if (ids.has(request.id)) {
      throw new Error('Cinefile request IDs must be unique.');
    }
    validateNewRequest({
      kind: request.kind as RequestKind,
      posterPath: request.posterPath as string | null,
      title: request.title as string,
      tmdbId: request.tmdbId as number,
      year: request.year as number | null,
    });
    const mediaId = `${request.kind}:${request.tmdbId}`;
    if (mediaIds.has(mediaId)) {
      throw new Error('A title can only appear in the request queue once.');
    }
    ids.add(request.id);
    mediaIds.add(mediaId);
  }
  return value as RequestDocument;
}

function validateNewRequest(request: NewCinefileRequest): void {
  validateKind(request.kind);
  if (request.posterPath !== null && typeof request.posterPath !== 'string') {
    throw new Error('A request poster path must be a string or null.');
  }
  if (typeof request.title !== 'string' || !request.title.trim()) {
    throw new Error('A request must have a title.');
  }
  validateTmdbId(request.tmdbId);
  if (request.year !== null && (!Number.isSafeInteger(request.year) || request.year <= 0)) {
    throw new Error('A request year must be a positive integer or null.');
  }
}

function validateKind(kind: RequestKind): void {
  if (kind !== 'movie' && kind !== 'tvseries') {
    throw new Error('A request kind must be movie or tvseries.');
  }
}

function validateTmdbId(tmdbId: number): void {
  if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
    throw new Error('A request must have a valid TMDB ID.');
  }
}

function isUtcDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
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

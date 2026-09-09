import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {createCatalog, type Catalog, type RemoteCatalog} from './catalog.ts';
import {refreshCatalog} from './catalog-refresh.ts';
import {createCatalogStore} from './catalog-store.ts';
import type {JellyfinGateway} from './jellyfin-gateway.ts';

const directories: string[] = [];

const remote: RemoteCatalog = {
  collections: [
    {id: 'collection', name: 'Collection', serverId: 'server', etag: 'collection-etag'},
  ],
  movies: [{id: 'movie', name: 'Movie', year: 2020, genres: ['Drama'], etag: 'movie-etag'}],
  series: [{id: 'series', name: 'Series', genres: []}],
  collectionMovieIds: {collection: ['movie']},
  collectionSeriesIds: {collection: ['series']},
};

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, {recursive: true})));
});

describe('catalog store', () => {
  test('reports missing, malformed, and invariant-invalid snapshots without exposing catalog data', async () => {
    const path = await catalogPath();
    const store = createCatalogStore(path);
    await expect(store.read()).resolves.toEqual({kind: 'missing'});
    await writeFile(path, '{not json');
    await expect(store.read()).resolves.toMatchObject({kind: 'unavailable', reason: 'invalid'});
    await writeFile(path, JSON.stringify({...catalog(), movieCollectionIds: {}}));
    await expect(store.read()).resolves.toMatchObject({kind: 'unavailable', reason: 'invalid'});
  });

  test('validates before atomically replacing a prior complete snapshot', async () => {
    const path = await catalogPath();
    const store = createCatalogStore(path);
    const previous = catalog();
    await store.replace(previous);
    const before = await readFile(path, 'utf8');
    await expect(store.replace({...previous, movieCollectionIds: {}} as Catalog)).rejects.toThrow(
      'Catalog membership indexes do not agree.',
    );
    await expect(readFile(path, 'utf8')).resolves.toBe(before);
    await expect(store.read()).resolves.toEqual({kind: 'ready', catalog: previous});
  });
});

test('refresh validates, saves, reports progress, and summarizes the installed snapshot', async () => {
  const path = await catalogPath();
  const store = createCatalogStore(path);
  const events: string[] = [];
  const gateway: JellyfinGateway = {
    pullCatalog: vi.fn(async (report) => {
      report?.({phase: 'collections'});
      report?.({
        phase: 'memberships',
        collection: remote.collections[0]!,
        index: 1,
        total: 1,
      });
      report?.({phase: 'movies'});
      report?.({phase: 'series'});
      return remote;
    }),
    addMoviesToCollection: vi.fn(),
  };
  const dates = [
    new Date('2026-09-11T00:00:00.000Z'),
    new Date('2026-09-11T00:00:02.000Z'),
    new Date('2026-09-11T00:00:03.000Z'),
  ];
  const result = await refreshCatalog({
    gateway,
    store,
    report: (event) => events.push(event.phase),
    now: () => dates.shift()!,
  });
  expect(result).toEqual({
    pulledAt: '2026-09-11T00:00:02.000Z',
    collections: 1,
    movies: 1,
    series: 1,
    durationMs: 3000,
  });
  expect(events).toEqual(['collections', 'memberships', 'movies', 'series', 'saving']);
  await expect(store.read()).resolves.toMatchObject({
    kind: 'ready',
    catalog: {baseSnapshot: {pulledAt: result.pulledAt}},
  });
});

test('refresh leaves the preceding snapshot unchanged when the gateway fails', async () => {
  const path = await catalogPath();
  const store = createCatalogStore(path);
  await store.replace(catalog());
  const before = await readFile(path, 'utf8');
  const gateway: JellyfinGateway = {
    pullCatalog: vi.fn(async () => {
      throw new Error('Jellyfin unavailable');
    }),
    addMoviesToCollection: vi.fn(),
  };
  await expect(refreshCatalog({gateway, store})).rejects.toThrow('Jellyfin unavailable');
  await expect(readFile(path, 'utf8')).resolves.toBe(before);
});

function catalog(): Catalog {
  return createCatalog(remote, '2026-09-10T00:00:00.000Z');
}

async function catalogPath(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-jellyfin-'));
  directories.push(directory);
  return join(directory, 'catalog.json');
}

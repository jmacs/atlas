import {expect, test, vi} from 'vitest';
import type {CatalogStore} from './catalog-store.ts';
import {runCollectionUpdaters} from './collection-updater-run.ts';
import type {JellyfinGateway} from './jellyfin-gateway.ts';
import type {RemoteCatalog} from './catalog.ts';

function remoteCatalog(): RemoteCatalog {
  return {
    collections: [
      {id: 'first', name: 'First', serverId: 'server'},
      {id: 'second', name: 'Second', serverId: 'server'},
    ],
    movies: [
      {id: 'existing', name: 'Existing', year: 1990, genres: ['Drama']},
      {id: 'one', name: 'One', year: 2000, genres: ['Drama']},
      {id: 'two', name: 'Two', year: 2010, genres: ['Drama']},
    ],
    series: [],
    collectionMovieIds: {first: ['existing'], second: ['existing']},
    collectionSeriesIds: {},
  };
}

function store(): CatalogStore {
  return {
    read: vi.fn(async () => ({kind: 'missing' as const})),
    replace: vi.fn(async () => undefined),
  };
}

test('returns a no-op without contacting Jellyfin when no updaters are enabled', async () => {
  const gateway = {
    pullCatalog: vi.fn(async () => remoteCatalog()),
    addMoviesToCollection: vi.fn(async () => undefined),
  } satisfies JellyfinGateway;

  await expect(runCollectionUpdaters({gateway, store: store(), updaters: []})).resolves.toEqual({
    status: 'succeeded',
    outcomes: [],
    successfulChangeCount: 0,
    catalogMayBeStale: false,
  });
  expect(gateway.pullCatalog).not.toHaveBeenCalled();
  expect(gateway.addMoviesToCollection).not.toHaveBeenCalled();
});

test('reports an initial refresh failure without writes or catalog staleness', async () => {
  const gateway = {
    pullCatalog: vi.fn(async () => {
      throw new Error('offline');
    }),
    addMoviesToCollection: vi.fn(async () => undefined),
  } satisfies JellyfinGateway;

  const result = await runCollectionUpdaters({
    gateway,
    store: store(),
    updaters: [
      {
        collectionId: 'first',
        conditions: [{field: 'movie.year', operator: 'gte', value: 2000}],
      },
    ],
  });

  expect(result).toEqual({
    status: 'failed',
    failure: {kind: 'initial_refresh_failed', message: 'offline'},
    outcomes: [],
    successfulChangeCount: 0,
    catalogMayBeStale: false,
  });
  expect(gateway.addMoviesToCollection).not.toHaveBeenCalled();
});

test('refreshes, unions overlapping targets, applies changed collections, and refreshes again', async () => {
  const addMoviesToCollection = vi.fn(async () => undefined);
  const pullCatalog = vi.fn(async () => remoteCatalog());
  const gateway = {pullCatalog, addMoviesToCollection} satisfies JellyfinGateway;

  const result = await runCollectionUpdaters({
    gateway,
    store: store(),
    updaters: [
      {
        collectionId: 'first',
        conditions: [{field: 'movie.year', operator: 'gte', value: 2000}],
      },
      {
        collectionId: 'first',
        conditions: [{field: 'movie.genres', operator: 'includes_any', values: ['drama']}],
      },
      {
        collectionId: 'second',
        conditions: [{field: 'movie.year', operator: 'eq', value: 1990}],
      },
    ],
    now: () => new Date('2026-09-14T12:00:00.000Z'),
  });

  expect(result).toMatchObject({
    status: 'succeeded',
    successfulChangeCount: 2,
    catalogMayBeStale: false,
    outcomes: [
      {kind: 'applied', collectionId: 'first', changeCount: 2},
      {kind: 'no_changes', collectionId: 'second'},
    ],
  });
  expect(addMoviesToCollection).toHaveBeenCalledOnce();
  expect(addMoviesToCollection).toHaveBeenCalledWith('first', ['one', 'two']);
  expect(pullCatalog).toHaveBeenCalledTimes(2);
});

test('fails before writes when the fresh catalog is missing a target', async () => {
  const gateway = {
    pullCatalog: vi.fn(async () => remoteCatalog()),
    addMoviesToCollection: vi.fn(async () => undefined),
  } satisfies JellyfinGateway;

  const result = await runCollectionUpdaters({
    gateway,
    store: store(),
    updaters: [
      {
        collectionId: 'missing',
        conditions: [{field: 'movie.year', operator: 'gte', value: 2000}],
      },
    ],
  });

  expect(result).toMatchObject({
    status: 'failed',
    failure: {kind: 'targets_missing', collectionIds: ['missing']},
    successfulChangeCount: 0,
  });
  expect(gateway.addMoviesToCollection).not.toHaveBeenCalled();
  expect(gateway.pullCatalog).toHaveBeenCalledOnce();
});

test('retains partial outcomes and reports a failed final refresh as stale', async () => {
  const pullCatalog = vi
    .fn<JellyfinGateway['pullCatalog']>()
    .mockResolvedValueOnce(remoteCatalog())
    .mockRejectedValueOnce(new Error('final pull failed'));
  const gateway = {
    pullCatalog,
    addMoviesToCollection: vi.fn(async (collectionId: string) => {
      if (collectionId === 'second') {
        throw new Error('write failed');
      }
    }),
  } satisfies JellyfinGateway;

  const result = await runCollectionUpdaters({
    gateway,
    store: store(),
    updaters: [
      {
        collectionId: 'first',
        conditions: [{field: 'movie.year', operator: 'gte', value: 2000}],
      },
      {
        collectionId: 'second',
        conditions: [{field: 'movie.year', operator: 'gte', value: 2000}],
      },
    ],
  });

  expect(result).toMatchObject({
    status: 'failed',
    failure: {kind: 'write_failed', message: 'write failed'},
    successfulChangeCount: 2,
    catalogMayBeStale: true,
    finalRefreshError: {message: 'final pull failed'},
    outcomes: [
      {kind: 'applied', collectionId: 'first', changeCount: 2},
      {kind: 'failed', collectionId: 'second', error: {message: 'write failed'}},
    ],
  });
  expect(pullCatalog).toHaveBeenCalledTimes(2);
});

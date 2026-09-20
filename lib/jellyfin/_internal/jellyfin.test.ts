import {describe, expect, test, vi} from 'vitest';
import {createCatalog, movieLabel, type Catalog, type RemoteCatalog} from './catalog.ts';
import {validateCatalog} from './catalog-validation.ts';
import {createCatalogView} from './catalog-view.ts';
import {applyCollectionUpdaterPlan} from './collection-updater-execution.ts';
import {planCollectionUpdaterRun} from './collection-updater-plan.ts';
import {resolveCollectionUpdaterPreviews} from './collection-updater-resolution.ts';
import {validateSavedCollectionUpdaters} from './collection-updater-validation.ts';

const remote: RemoteCatalog = {
  collections: [
    {id: 'first', name: 'Duplicate', serverId: 'server', etag: 'c1'},
    {id: 'second', name: 'Duplicate', serverId: 'server'},
  ],
  movies: [
    {id: 'below', name: 'Below', year: 1989, genres: ['DRAMA']},
    {id: 'start', name: 'Start', year: 1990, genres: ['Comedy', 'Drama']},
    {id: 'inside', name: 'Inside', year: 1995, genres: ['Drama', 'Science Fiction']},
    {id: 'end', name: 'End', year: 2000, genres: ['Comedy']},
    {id: 'above', name: 'Above', year: 2001, genres: []},
    {id: 'unknown', name: 'Unknown', genres: ['Drama']},
  ],
  series: [{id: 'series', name: 'Series', genres: [], etag: 's1'}],
  collectionMovieIds: {first: ['start'], second: []},
  collectionSeriesIds: {first: ['series']},
};

function catalog(): Catalog {
  return createCatalog(remote, '2026-09-05T00:00:00.000Z');
}

describe('catalog', () => {
  test('preserves order, builds reverse indexes and snapshots remote IDs and etags', () => {
    const result = catalog();
    expect(result.movieCollectionIds).toEqual({start: ['first']});
    expect(result.seriesCollectionIds).toEqual({series: ['first']});
    expect(result.baseSnapshot).toEqual({
      pulledAt: '2026-09-05T00:00:00.000Z',
      collections: [{id: 'first', etag: 'c1'}, {id: 'second'}],
      movies: remote.movies.map(({id, etag}) => ({id, ...(etag === undefined ? {} : {etag})})),
      series: [{id: 'series', etag: 's1'}],
    });
    expect(movieLabel(remote.movies[0]!)).toBe('Below (1989)');
    expect(movieLabel(remote.movies[5]!)).toBe('Unknown');
  });

  test('omits memberships for items or collections that disappeared during the pull', () => {
    const result = createCatalog(
      {
        ...remote,
        movies: remote.movies.filter(({id}) => id !== 'start'),
        collectionMovieIds: {...remote.collectionMovieIds, missing: ['inside']},
      },
      '2026-09-05T00:00:00.000Z',
    );

    expect(result.collectionMovieIds).toEqual({first: [], second: []});
    expect(result.movieCollectionIds).toEqual({});
    expect(result.collectionSeriesIds).toEqual({first: ['series']});
    expect(result.seriesCollectionIds).toEqual({series: ['first']});
    expect(validateCatalog(result)).toEqual(result);
  });

  test('validates complete shape and rejects duplicate IDs, references, duplicate membership, and mismatched indexes', () => {
    const valid = catalog();
    expect(validateCatalog(valid)).toEqual(valid);
    for (const invalid of [
      null,
      {...valid, collections: [...valid.collections, valid.collections[0]]},
      {...valid, collectionMovieIds: {missing: ['start']}},
      {...valid, collectionMovieIds: {first: ['start', 'start'], second: []}},
      {...valid, movieCollectionIds: {}},
      {...valid, baseSnapshot: {pulledAt: 1}},
    ]) {
      expect(validateCatalog(invalid)).toMatchObject({code: 'catalog_invalid'});
    }
  });

  test('view uses exact IDs, source order, and empty absent membership', () => {
    const view = createCatalogView(catalog());
    expect(view.listMovies().map(({id}) => id)).toEqual(remote.movies.map(({id}) => id));
    expect(view.getCollection('first')?.name).toBe('Duplicate');
    expect(view.getCollection('missing')).toBeUndefined();
    expect(view.getMovieIdsInCollection('missing')).toEqual([]);
    expect(view.listCollectionMovieEdges()).toEqual([{collectionId: 'first', movieId: 'start'}]);
  });
});

describe('Collection Updater validation and resolution', () => {
  test('normalizes targets and accepts all valid condition variants without tightening legacy values', () => {
    const result = validateSavedCollectionUpdaters([
      {
        collectionId: ' first ',
        conditions: [
          {field: 'movie.year', operator: 'eq', value: 2000.5},
          {field: 'movie.year', operator: 'lt', value: 1},
          {field: 'movie.year', operator: 'gt', value: 1},
          {field: 'movie.year', operator: 'lte', value: 1},
          {field: 'movie.year', operator: 'gte', value: 1},
          {field: 'movie.year', operator: 'between', start: 1.5, end: 1.5},
          {field: 'movie.genres', operator: 'includes_any', values: ['', 'Drama', 'Drama']},
          {field: 'movie.genres', operator: 'includes_all', values: ['Drama']},
        ],
      },
    ]);
    expect(result).toMatchObject([{collectionId: 'first'}]);
  });

  test('reports the precise legacy path for invalid shapes and operands', () => {
    const invalids: [unknown, string][] = [
      [
        [{collectionId: 'a', conditions: [{field: 'movie.year', operator: 'eq', value: Infinity}]}],
        'collectionUpdaters[0].conditions[0].value',
      ],
      [
        [
          {
            collectionId: 'a',
            conditions: [{field: 'movie.year', operator: 'between', start: 2, end: 1}],
          },
        ],
        'collectionUpdaters[0].conditions[0].end',
      ],
      [
        [
          {
            collectionId: 'a',
            conditions: [{field: 'movie.genres', operator: 'includes_any', values: []}],
          },
        ],
        'collectionUpdaters[0].conditions[0].values',
      ],
      [
        [
          {
            collectionId: 'a',
            conditions: [{field: 'movie.genres', operator: 'includes_any', values: [1]}],
          },
        ],
        'collectionUpdaters[0].conditions[0].values[0]',
      ],
    ];
    for (const [value, path] of invalids) {
      expect(validateSavedCollectionUpdaters(value)).toMatchObject({
        code: 'collection_updater_invalid',
        path,
      });
    }
  });

  test('allows multiple updaters to target the same collection', () => {
    const updaters = [
      {
        collectionId: 'a',
        conditions: [{field: 'movie.year' as const, operator: 'eq' as const, value: 1}],
      },
      {
        collectionId: 'a',
        conditions: [{field: 'movie.year' as const, operator: 'gte' as const, value: 2}],
      },
    ];

    expect(validateSavedCollectionUpdaters(updaters)).toEqual(updaters);
  });

  test('resolves inclusive years and case-insensitive genres by target ID, excluding existing movies', () => {
    const previews = resolveCollectionUpdaterPreviews(createCatalogView(catalog()), [
      {
        collectionId: 'first',
        conditions: [{field: 'movie.year', operator: 'between', start: 1990, end: 2000}],
      },
      {collectionId: 'missing', conditions: [{field: 'movie.year', operator: 'gte', value: 1990}]},
      {
        collectionId: 'second',
        conditions: [{field: 'movie.genres', operator: 'includes_all', values: ['drama', 'DRAMA']}],
      },
    ]);
    expect(
      previews.map((preview) =>
        preview.kind === 'ready' ? preview.movies.map(({id}) => id) : preview.kind,
      ),
    ).toEqual([['inside', 'end'], 'target_missing', ['below', 'start', 'inside', 'unknown']]);
    expect(
      planCollectionUpdaterRun(catalog(), [
        {collectionId: 'missing-a', conditions: []},
        {collectionId: 'missing-b', conditions: []},
      ]),
    ).toEqual({
      code: 'collection_updater_targets_missing',
      collectionIds: ['missing-a', 'missing-b'],
    });
  });
});

test('applies plans sequentially, preserving no-ops and stopping after a failed write', async () => {
  const failure = new Error('failed');
  const writer = {
    addMoviesToCollection: vi.fn(async (collectionId: string) => {
      if (collectionId === 'failed') {
        throw failure;
      }
    }),
  };
  await expect(
    applyCollectionUpdaterPlan({
      writer,
      plan: [
        {collectionId: 'empty', collectionName: 'Empty', movieIds: []},
        {collectionId: 'applied', collectionName: 'Applied', movieIds: ['movie']},
        {collectionId: 'failed', collectionName: 'Failed', movieIds: ['other']},
        {collectionId: 'later', collectionName: 'Later', movieIds: ['last']},
      ],
    }),
  ).resolves.toEqual({
    outcomes: [
      {kind: 'no_changes', collectionId: 'empty', collectionName: 'Empty'},
      {kind: 'applied', collectionId: 'applied', collectionName: 'Applied', changeCount: 1},
      {kind: 'failed', collectionId: 'failed', collectionName: 'Failed', cause: failure},
      {kind: 'not_attempted', collectionId: 'later', collectionName: 'Later'},
    ],
    successfulChangeCount: 1,
  });
  expect(writer.addMoviesToCollection).toHaveBeenCalledTimes(2);
});

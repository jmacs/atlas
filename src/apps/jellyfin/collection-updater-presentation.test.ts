import type {CatalogReadResult} from '#lib/jellyfin/catalog.ts';
import {expect, test} from 'vitest';

import {
  catalogStatusForPage,
  collectionTypeaheadItems,
  collectionUpdaterEditorViewModels,
  collectionUpdaterPreviewForPage,
} from './collection-updater-presentation.ts';

const catalog = {
  kind: 'ready',
  catalog: {
    version: 1,
    collections: [
      {id: 'collection-1', name: 'Favorites', serverId: 'server'},
      {id: 'collection-2', name: 'Favorites', serverId: 'server'},
      {id: 'collection-3', name: 'Classics', serverId: 'server'},
    ],
    movies: [{id: 'movie-1', name: 'Arrival', year: 2016, genres: ['Drama'], etag: 'etag'}],
    series: [],
    collectionMovieIds: {'collection-3': ['movie-1']},
    movieCollectionIds: {'movie-1': ['collection-3']},
    collectionSeriesIds: {},
    seriesCollectionIds: {},
    baseSnapshot: {
      pulledAt: '2026-01-02T03:04:05.000Z',
      collections: [],
      movies: [],
      series: [],
    },
  },
} satisfies CatalogReadResult;

test('projects saved targets into collection references for the editor', () => {
  const updater = {
    id: 'saved',
    enabled: true,
    collectionId: 'collection-1',
    conditions: [{field: 'movie.year' as const, operator: 'eq' as const, value: 2016}],
  };
  expect(collectionUpdaterEditorViewModels(catalog, [updater])).toEqual([
    {
      id: 'saved',
      enabled: true,
      collection: {id: 'collection-1', title: 'Favorites'},
      conditions: updater.conditions,
    },
  ]);
  expect(collectionUpdaterEditorViewModels({kind: 'missing'}, [updater])[0]?.collection).toEqual({
    id: 'collection-1',
    title: 'collection-1',
  });
});

test('provides matching collection references to the typeahead', () => {
  expect(collectionTypeaheadItems(catalog, 'class')).toEqual([
    {
      value: 'collection-3',
      name: 'Classics',
      data: {id: 'collection-3', title: 'Classics'},
    },
  ]);
});

test('maps invalid catalog storage to an explicit unavailable status', () => {
  expect(
    catalogStatusForPage({kind: 'unavailable', reason: 'invalid', cause: new Error('bad')}),
  ).toEqual({kind: 'unavailable', reason: 'invalid'});
});

test('summarizes only saved enabled updaters, including missing targets', () => {
  const condition = {field: 'movie.year' as const, operator: 'eq' as const, value: 2016};

  expect(
    collectionUpdaterPreviewForPage(catalog.catalog, [
      {id: 'ready', enabled: true, collectionId: 'collection-1', conditions: [condition]},
      {id: 'missing', enabled: true, collectionId: 'missing', conditions: [condition]},
      {id: 'disabled', enabled: false, collectionId: 'collection-2', conditions: [condition]},
    ]),
  ).toEqual({
    totals: {enabledUpdaters: 2, additions: 1, changedCollections: 1},
    collections: [
      {
        collection: {id: 'collection-1', name: 'Favorites'},
        additionCount: 1,
        movieSample: [{id: 'movie-1', label: 'Arrival (2016)'}],
        omittedMovieCount: 0,
      },
    ],
    missingCollectionIds: ['missing'],
  });
});

test('groups overlapping updater matches and omits satisfied collections', () => {
  const expanded = structuredClone(catalog.catalog);
  expanded.movies.push({id: 'movie-2', name: 'Heat', year: 1995, genres: ['Drama'], etag: 'etag'});
  const preview = collectionUpdaterPreviewForPage(expanded, [
    {
      id: 'first',
      enabled: true,
      collectionId: 'collection-1',
      conditions: [{field: 'movie.genres', operator: 'includes_any', values: ['Drama']}],
    },
    {
      id: 'overlap',
      enabled: true,
      collectionId: 'collection-1',
      conditions: [{field: 'movie.year', operator: 'gte', value: 1990}],
    },
    {
      id: 'satisfied',
      enabled: true,
      collectionId: 'collection-3',
      conditions: [{field: 'movie.year', operator: 'eq', value: 2016}],
    },
  ]);

  expect(preview.totals).toEqual({enabledUpdaters: 3, additions: 2, changedCollections: 1});
  expect(preview.collections).toHaveLength(1);
  expect(preview.collections[0]?.movieSample.map(({id}) => id)).toEqual(['movie-1', 'movie-2']);
});
